"""
RinkNet Parent Email Scraper
----------------------------
HOW TO RUN (Windows):
  1. Install Python from https://python.org  (check "Add to PATH" during install)
  2. Open Command Prompt in this folder and run:
       pip install playwright
       playwright install chromium
       python scrape_rinknet.py
  3. A browser window opens — log into RinkNet, then press ENTER here.
     The script works through all 22 pages of players automatically,
     clicks each family member in the FAMILY MEMBERS listbox, reads their
     email, and saves everything to parent_emails.csv.
"""

import asyncio
import csv
import re
import sys
from pathlib import Path

TARGET_LIST_URL = (
    "https://ops.rinknet.com/#/home/players/addressPhone"
    "?listIds=942916689,-1350718491"
)
OUTPUT_FILE = Path(__file__).parent / "parent_emails.csv"
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")


async def _wait_stable(page, timeout: int = 8_000) -> None:
    try:
        await page.wait_for_load_state("networkidle", timeout=timeout)
    except Exception:
        await asyncio.sleep(1)


async def _read_value(page, label_text: str) -> str:
    """
    Find a form field by its visible label text and return the field's value.
    Handles both <input> fields and plain text siblings.
    """
    try:
        # Strategy 1: find a <label> whose text contains the label, get its 'for' id
        label = await page.query_selector(f"text={label_text}")
        if label:
            for_id = await label.get_attribute("for")
            if for_id:
                inp = await page.query_selector(f"#{for_id}")
                if inp:
                    val = await inp.input_value()
                    return (val or "").strip()

        # Strategy 2: evaluate JS — walk the DOM to find the label then its sibling/parent input
        val = await page.evaluate(
            """(labelText) => {
                for (const el of document.querySelectorAll('td, th, label, dt, span, div')) {
                    if (el.innerText && el.innerText.trim().startsWith(labelText)) {
                        // Try next sibling
                        let sib = el.nextElementSibling;
                        while (sib) {
                            const inp = sib.tagName === 'INPUT' ? sib
                                      : sib.querySelector('input');
                            if (inp) return inp.value || inp.innerText || '';
                            sib = sib.nextElementSibling;
                        }
                        // Try parent row's inputs
                        const row = el.closest('tr, .form-row, .field-row, div');
                        if (row) {
                            const inp = row.querySelector('input');
                            if (inp) return inp.value || '';
                        }
                    }
                }
                return '';
            }""",
            label_text,
        )
        return (val or "").strip()
    except Exception:
        return ""


async def get_family_emails(page, player_name: str) -> list[dict]:
    """
    From the currently-displayed player profile, click each family member
    in the FAMILY MEMBERS listbox and capture their email address.
    Returns a list of contact dicts.
    """
    contacts: list[dict] = []

    try:
        # Scroll the FAMILY MEMBERS heading into view
        heading = await page.query_selector("text=FAMILY MEMBERS")
        if not heading:
            return contacts
        await heading.scroll_into_view_if_needed()
        await asyncio.sleep(0.5)

        # The family member listbox — try common patterns
        # From the screenshot it looks like a <select> or styled list inside
        # the FAMILY MEMBERS section.
        listbox = None
        for sel in ["select", "[class*='family'] select",
                    "[class*='family'] ul li", "[class*='family'] .list-group-item"]:
            candidate = await page.query_selector(sel)
            if candidate:
                listbox = candidate
                listbox_sel = sel
                break

        if not listbox:
            return contacts

        # Get all items in the listbox
        if listbox.get_property("tagName"):
            tag = await page.evaluate("el => el.tagName.toLowerCase()", listbox)
        else:
            tag = "select"

        if tag == "select":
            # It's a <select> — iterate over <option> elements
            options = await page.query_selector_all(f"{listbox_sel} option, select option")
            member_count = len(options)

            for idx in range(member_count):
                # Re-query to avoid stale references
                opts = await page.query_selector_all("select option")
                if idx >= len(opts):
                    break
                opt = opts[idx]
                member_name = (await opt.inner_text()).strip()
                opt_value   = await opt.get_attribute("value")

                # Select this option (triggers Angular/Vue change binding)
                select_el = await page.query_selector("select")
                if opt_value is not None:
                    await page.evaluate(
                        """([sel, val]) => {
                            const s = document.querySelector(sel);
                            if (!s) return;
                            s.value = val;
                            s.dispatchEvent(new Event('change', {bubbles: true}));
                        }""",
                        ["select", opt_value],
                    )
                else:
                    await opt.click()

                await asyncio.sleep(1.0)   # wait for right-side form to update

                # Read the E-Mail field
                email = await _read_value(page, "E-Mail")

                # Fallback: scan all inputs on the page for an email-shaped value
                if not email or "@" not in email:
                    email = await page.evaluate(
                        """() => {
                            for (const inp of document.querySelectorAll('input')) {
                                const v = (inp.value || '').trim();
                                if (/@/.test(v)) return v;
                            }
                            // Also check plain text nodes
                            const all = document.body.innerText;
                            const m = all.match(/[\\w._%+\\-]+@[\\w.\\-]+\\.[a-zA-Z]{2,}/);
                            return m ? m[0] : '';
                        }"""
                    )

                if email and "@" in email:
                    contacts.append({
                        "player":        player_name,
                        "family_member": member_name,
                        "email":         email.lower().strip(),
                    })
                    print(f"        {member_name} → {email}")
                else:
                    print(f"        {member_name} → (no email)")

        else:
            # It's a list of <li> elements — click each one
            items = await page.query_selector_all(f"{listbox_sel}")
            for item in items:
                member_name = (await item.inner_text()).strip()
                await item.click()
                await asyncio.sleep(1.0)

                email = await _read_value(page, "E-Mail")
                if email and "@" in email:
                    contacts.append({
                        "player":        player_name,
                        "family_member": member_name,
                        "email":         email.lower().strip(),
                    })
                    print(f"        {member_name} → {email}")
                else:
                    print(f"        {member_name} → (no email)")

    except Exception as exc:
        print(f"        [error reading family members: {exc}]")

    return contacts


async def process_page(page, all_contacts: list) -> None:
    """Process every player visible in the current left-sidebar page."""
    await asyncio.sleep(1.5)

    # Find player name items in the left sidebar list
    # From the screenshot they appear to be plain <li> or <a> elements
    player_items = []
    for sel in [
        ".list-group-item",
        "ul.player-list li",
        "ul li a",
        "div[class*='sidebar'] li",
        "div[class*='list'] li",
        "[ng-repeat] a",
        "[ng-repeat]",
        "li",            # broad fallback
    ]:
        candidates = await page.query_selector_all(sel)
        # Filter to items that look like "LastName, FirstName"
        named = []
        for el in candidates:
            txt = (await el.inner_text()).strip()
            if "," in txt and len(txt) < 60 and "\n" not in txt:
                named.append(el)
        if len(named) > 3:
            player_items = named
            print(f"  (using selector '{sel}' — {len(named)} players on this page)")
            break

    if not player_items:
        print("  [!] Could not find player list items on this page — skipping")
        return

    total = len(player_items)
    for idx in range(total):
        # Re-query each time to avoid stale element references
        player_items = []
        for sel in [".list-group-item", "ul.player-list li", "ul li a",
                    "div[class*='sidebar'] li", "div[class*='list'] li",
                    "[ng-repeat] a", "[ng-repeat]", "li"]:
            candidates = await page.query_selector_all(sel)
            named = []
            for el in candidates:
                txt = (await el.inner_text()).strip()
                if "," in txt and len(txt) < 60 and "\n" not in txt:
                    named.append(el)
            if len(named) > 3:
                player_items = named
                break

        if idx >= len(player_items):
            break

        item = player_items[idx]
        player_name = (await item.inner_text()).strip()
        print(f"  [{idx+1}/{total}] {player_name}")

        try:
            await item.scroll_into_view_if_needed()
            await item.click()
            await _wait_stable(page, timeout=10_000)
            await asyncio.sleep(1.5)

            contacts = await get_family_emails(page, player_name)
            all_contacts.extend(contacts)

            if not contacts:
                print("        (no family emails found)")

        except Exception as exc:
            print(f"        [error: {exc}]")


async def main() -> None:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("ERROR: Run:  pip install playwright  then:  playwright install chromium")
        sys.exit(1)

    print("=" * 60)
    print("  RinkNet Parent Email Scraper")
    print("=" * 60)
    print()
    print("A browser window is about to open.")
    print("Log into RinkNet, then press ENTER here to begin.")
    print()

    all_contacts: list[dict] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False)
        context = await browser.new_context()
        page    = await context.new_page()

        await page.goto("https://ops.rinknet.com/")
        input(">>> Logged in? Press ENTER to start … ")

        print("\nLoading player list …")
        await page.goto(TARGET_LIST_URL)
        await _wait_stable(page)
        await asyncio.sleep(3)

        page_num = 1
        while True:
            print(f"\n{'─'*50}")
            print(f"  PAGE {page_num}")
            print(f"{'─'*50}")

            await process_page(page, all_contacts)

            # Look for NEXT PAGE button
            next_btn = await page.query_selector(
                "button:has-text('NEXT PAGE'), "
                "input[value='NEXT PAGE'], "
                "a:has-text('NEXT PAGE'), "
                "[class*='next']:not([disabled])"
            )
            if not next_btn:
                print("\n[No more pages — done!]")
                break

            # Check if button is disabled
            disabled = await next_btn.get_attribute("disabled")
            if disabled is not None:
                print("\n[NEXT PAGE is disabled — done!]")
                break

            print(f"\n  → Moving to page {page_num + 1} …")
            await next_btn.click()
            await _wait_stable(page, timeout=10_000)
            await asyncio.sleep(2)
            page_num += 1

        await browser.close()

    # ── Deduplicate ──────────────────────────────────────────────────────────
    seen: set[str]   = set()
    unique: list[dict] = []
    for c in all_contacts:
        key = (c.get("player", ""), c.get("email", "").lower().strip())
        if key[1] and key[1] not in seen and EMAIL_RE.match(key[1]):
            seen.add(key[1])
            unique.append({**c, "email": key[1]})

    print(f"\n{'='*60}")
    print(f"Total unique parent/family emails: {len(unique)}")

    if not unique:
        print("\nNo emails found.")
        print("The page HTML may differ from what was expected.")
        print("Share a screenshot of what the browser showed and I can adjust the script.")
        return

    fieldnames = ["player", "family_member", "email"]

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(unique)

    print(f"Saved → {OUTPUT_FILE}")
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
