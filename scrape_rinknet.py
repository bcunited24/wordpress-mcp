"""
RinkNet Parent Email Scraper
----------------------------
HOW TO RUN (Windows):
  1. Install Python from https://python.org  (check "Add to PATH" during install)
  2. Open Command Prompt in the folder where this file lives, then run:
       pip install playwright
       playwright install chromium
       python scrape_rinknet.py
  3. A browser window will open — log into RinkNet normally, then press
     ENTER in this terminal. The script clicks through every player,
     opens each profile, scrolls to the family section, and saves all
     parent emails to parent_emails.csv.
"""

import asyncio
import csv
import json
import re
import sys
from pathlib import Path

TARGET_LIST_URL = (
    "https://ops.rinknet.com/#/home/players/addressPhone"
    "?listIds=942916689,-1350718491"
)
OUTPUT_FILE = Path(__file__).parent / "parent_emails.csv"

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

# Selector strategies tried in order to locate the player list rows.
# The first one that returns > 2 elements wins.
ROW_SELECTORS = [
    "tbody tr",
    "table tr:not(:first-child)",
    "tr[ng-click]",
    "[ng-click]",
    ".player-row",
    "[class*='player-row']",
    "[class*='playerRow']",
    "li[ng-repeat]",
    "[ng-repeat]",
    "[class*='list-item']",
]


# ---------------------------------------------------------------------------
# JSON helpers
# ---------------------------------------------------------------------------

def find_structured_contacts(obj: object, player_name: str = "") -> list[dict]:
    """
    Recursively walk a JSON blob and return a list of contact dicts
    {player, relation/type (optional), name (optional), email}.
    """
    contacts: list[dict] = []

    if isinstance(obj, list):
        for item in obj:
            contacts.extend(find_structured_contacts(item, player_name))

    elif isinstance(obj, dict):
        # Does this dict directly contain an email-valued key?
        email_val: str | None = None
        for k, v in obj.items():
            if isinstance(v, str) and EMAIL_RE.fullmatch(v.strip()):
                email_val = v.strip().lower()
                break

        if email_val:
            contact: dict = {"player": player_name, "email": email_val}
            for k, v in obj.items():
                kl = k.lower()
                if isinstance(v, str) and any(
                    tok in kl for tok in
                    ("first", "last", "name", "relation", "type", "role",
                     "parent", "guardian")
                ):
                    contact[k] = v
            contacts.append(contact)
        else:
            for v in obj.values():
                contacts.extend(find_structured_contacts(v, player_name))

    return contacts


def flat_emails_from_json(obj: object) -> set[str]:
    """Return every email-like string found anywhere in a JSON structure."""
    emails: set[str] = set()
    if isinstance(obj, str):
        for m in EMAIL_RE.findall(obj):
            emails.add(m.lower())
    elif isinstance(obj, dict):
        for v in obj.values():
            emails |= flat_emails_from_json(v)
    elif isinstance(obj, list):
        for item in obj:
            emails |= flat_emails_from_json(item)
    return emails


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main() -> None:
    try:
        from playwright.async_api import async_playwright, Page
    except ImportError:
        print("ERROR: Playwright not installed.")
        print("  pip install playwright")
        print("  playwright install chromium")
        sys.exit(1)

    print("=" * 60)
    print("  RinkNet Parent Email Scraper")
    print("=" * 60)
    print()
    print("A browser window is about to open.")
    print("Log into RinkNet, then come back here and press ENTER.")
    print()

    # Staging buffer for API JSON responses captured between player clicks
    pending_api: list[dict] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False)
        context = await browser.new_context()
        page: Page = await context.new_page()

        # ---- intercept every JSON API response ----
        async def on_response(response) -> None:
            try:
                if response.status != 200:
                    return
                if "json" not in response.headers.get("content-type", ""):
                    return
                text = await response.text()
                if "@" not in text:
                    return
                pending_api.append(json.loads(text))
            except Exception:
                pass

        page.on("response", on_response)
        # -------------------------------------------

        # Step 1 — manual login
        await page.goto("https://ops.rinknet.com/")
        input(">>> Logged in? Press ENTER to continue... ")
        pending_api.clear()

        # Step 2 — load the player list
        print("\nLoading player list …")
        await page.goto(TARGET_LIST_URL)
        await _wait_stable(page)
        await asyncio.sleep(3)

        # Step 3 — discover how many players are in the list
        selector, total = await _find_rows(page)

        if total == 0:
            print("\nCould not auto-detect player rows.")
            print("Switching to MANUAL mode:")
            print("  Click through every player yourself in the browser window.")
            print("  The script will capture all API data in the background.")
            print("  Press ENTER here when you have visited every player profile.")
            pending_api.clear()
            input(">>> Done clicking all players? Press ENTER … ")
            all_contacts = _process_api_batch(pending_api, "")
        else:
            print(f"Found {total} players. Starting automated click-through …\n")
            all_contacts = await _auto_click_all(
                page, selector, total, pending_api, TARGET_LIST_URL
            )

        await browser.close()

    # Step 4 — deduplicate and save
    seen: set[str] = set()
    unique: list[dict] = []
    for c in all_contacts:
        e = c.get("email", "").lower().strip()
        if e and e not in seen and EMAIL_RE.match(e):
            seen.add(e)
            unique.append(c)

    print(f"\n{'='*60}")
    print(f"Total unique parent/family emails collected: {len(unique)}")

    if not unique:
        print("\nNo emails found. Possible reasons:")
        print("  • The page needs a click or scroll before data loads")
        print("  • The player rows weren't detected — try manual mode")
        return

    # Build fieldnames: player first, email last, everything else in between
    fieldnames: list[str] = ["player"]
    for rec in unique:
        for k in rec:
            if k not in fieldnames and k != "email":
                fieldnames.append(k)
    fieldnames.append("email")

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(unique)

    print(f"Saved → {OUTPUT_FILE}")
    print("Done!")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _wait_stable(page, timeout: int = 10_000) -> None:
    try:
        await page.wait_for_load_state("networkidle", timeout=timeout)
    except Exception:
        await asyncio.sleep(2)


async def _find_rows(page) -> tuple[str, int]:
    """Return (winning_selector, count) or ('', 0) if nothing found."""
    for sel in ROW_SELECTORS:
        els = await page.query_selector_all(sel)
        if len(els) > 2:
            return sel, len(els)
    return "", 0


async def _auto_click_all(
    page,
    selector: str,
    total: int,
    pending_api: list,
    list_url: str,
) -> list[dict]:
    """Click every player row, scrape their profile, return all contacts."""
    all_contacts: list[dict] = []

    for idx in range(total):
        # Re-query rows every iteration — the DOM is rebuilt after each navigation
        rows = await page.query_selector_all(selector)
        if idx >= len(rows):
            print(f"  [!] Row {idx+1} not found after re-query — stopping early")
            break

        row = rows[idx]

        # Try to read the player name from the row text
        try:
            row_text = (await row.inner_text()).strip()
            player_name = row_text.split("\n")[0].strip()
        except Exception:
            player_name = f"Player {idx + 1}"

        print(f"  [{idx+1}/{total}] {player_name} …", end="", flush=True)

        pending_api.clear()
        contacts: list[dict] = []

        try:
            await row.scroll_into_view_if_needed()
            await row.click()
            await _wait_stable(page, timeout=12_000)
            await asyncio.sleep(2)

            # Scroll to bottom so the family/contacts section loads
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(2)
            await _wait_stable(page, timeout=6_000)

            # Grab contacts from every API response triggered by this click
            contacts = _process_api_batch(pending_api, player_name)

            # Belt-and-suspenders: also scan visible page text for email addresses
            visible_emails: list[str] = await page.evaluate(r"""
                () => {
                    const re = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
                    return [...new Set(
                        (document.body.innerText.match(re) || []).map(e => e.toLowerCase())
                    )];
                }
            """)
            api_emails = {c["email"] for c in contacts}
            for e in visible_emails:
                if e not in api_emails:
                    contacts.append({"player": player_name, "email": e})

            print(f" {len(contacts)} email(s)")
            all_contacts.extend(contacts)

        except Exception as exc:
            print(f" ERROR: {exc}")

        # Navigate back to the player list
        try:
            await page.go_back()
            await _wait_stable(page, timeout=8_000)
            await asyncio.sleep(1.5)
        except Exception:
            # If go_back fails, reload the list URL directly
            await page.goto(list_url)
            await _wait_stable(page)
            await asyncio.sleep(2)

    return all_contacts


def _process_api_batch(batch: list[dict], player_name: str) -> list[dict]:
    """Extract structured contact records from a list of raw API payloads."""
    contacts: list[dict] = []
    flat: set[str] = set()

    for payload in batch:
        found = find_structured_contacts(payload, player_name)
        if found:
            contacts.extend(found)
        flat |= flat_emails_from_json(payload)

    existing = {c["email"] for c in contacts}
    for e in flat:
        if e not in existing:
            contacts.append({"player": player_name, "email": e})

    return contacts


if __name__ == "__main__":
    asyncio.run(main())
