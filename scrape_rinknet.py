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
from datetime import datetime
from pathlib import Path

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
        heading = page.locator("text=FAMILY MEMBERS").first
        if not await heading.count():
            return contacts
        await heading.scroll_into_view_if_needed()
        await asyncio.sleep(0.8)

        # Find the <select> that immediately follows the FAMILY MEMBERS heading.
        # Using XPath "following::select[1]" ensures we skip the Province/Country
        # dropdowns in the ADDRESSES section above it.
        family_select = heading.locator("xpath=following::select[1]")
        if not await family_select.count():
            return contacts

        # Get options ONLY from this specific select (not Province/Country dropdowns)
        option_locs = await family_select.locator("option").all()
        member_count = len(option_locs)
        if member_count == 0:
            return contacts

        for idx in range(member_count):
            # Re-query each time to avoid stale handles
            option_locs = await family_select.locator("option").all()
            if idx >= len(option_locs):
                break

            opt = option_locs[idx]
            raw_name  = (await opt.inner_text()).strip()
            member_name = " ".join(raw_name.split())   # collapse all whitespace/newlines
            opt_value = await opt.get_attribute("value")

            # Select this option and fire Angular's change event
            select_id = await family_select.get_attribute("id") or ""
            select_ng  = await family_select.get_attribute("ng-model") or ""
            await page.evaluate(
                """([idAttr, ngAttr, val]) => {
                    let s = null;
                    if (idAttr) s = document.getElementById(idAttr);
                    if (!s && ngAttr) s = document.querySelector('[ng-model="' + ngAttr + '"]');
                    // Fallback: first select AFTER the FAMILY MEMBERS heading
                    if (!s) {
                        const headings = [...document.querySelectorAll('*')]
                            .filter(el => (el.innerText || '').trim() === 'FAMILY MEMBERS'
                                       && el.children.length === 0);
                        for (const h of headings) {
                            let node = h;
                            while (node) {
                                const found = node.tagName === 'SELECT' ? node
                                            : node.querySelector('select');
                                if (found) { s = found; break; }
                                node = node.nextElementSibling
                                    || node.parentElement?.nextElementSibling;
                                if (!node) break;
                            }
                            if (s) break;
                        }
                    }
                    if (!s) return;
                    s.value = val;
                    s.dispatchEvent(new Event('change', {bubbles: true}));
                }""",
                [select_id, select_ng, opt_value],
            )
            await asyncio.sleep(1.0)

            # Read the email from the right-side detail form.
            # Only look at inputs whose current value looks like an email.
            email = await page.evaluate(
                """() => {
                    const re = /[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}/;
                    for (const inp of document.querySelectorAll('input')) {
                        const v = (inp.value || '').trim();
                        if (re.test(v)) return v;
                    }
                    return '';
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


    except Exception as exc:
        print(f"        [error reading family members: {exc}]")

    return contacts


async def _find_left_panel_players(page) -> list:
    """
    Sample pixel positions in the left ~30px of the page to find player
    names. Uses JS elementFromPoint so we only get elements that are
    ACTUALLY rendered and visible at those coordinates.
    Returns a list of (name_string, Playwright_locator) tuples.
    """
    # Scroll the left panel to the top first so we capture from row 1
    await page.evaluate("window.scrollTo(0, 0)")
    await asyncio.sleep(0.3)

    viewport_height = await page.evaluate("() => window.innerHeight")

    # Sample x=25 (left panel) at every 16px down the page
    names: list[str] = await page.evaluate(
        """(height) => {
            const seen  = new Set();
            const found = [];
            const pat   = /^[A-Za-z][A-Za-z\\s\\-\\']+,\\s*[A-Za-z]/;
            for (let y = 60; y < height - 60; y += 16) {
                const el = document.elementFromPoint(25, y);
                if (!el) continue;
                // Walk up to find a leaf-ish element with just a player name
                let target = el;
                for (let i = 0; i < 4; i++) {
                    const txt = (target.innerText || target.textContent || '').trim();
                    if (pat.test(txt) && txt.length < 55 && !txt.includes('\\n')) {
                        if (!seen.has(txt)) {
                            seen.add(txt);
                            found.push(txt);
                        }
                        break;
                    }
                    if (!target.parentElement) break;
                    target = target.parentElement;
                }
            }
            return found;
        }""",
        viewport_height,
    )

    if not names:
        return []

    # Convert each name string into a Playwright locator we can click
    handles = []
    for name in names:
        try:
            loc = page.get_by_text(name, exact=True).first
            if await loc.count() > 0 and await loc.is_visible():
                handles.append((name, loc))
        except Exception:
            pass

    return handles


async def process_page(page, all_contacts: list, confirmed: list) -> None:
    """
    Process every player visible in the current left-sidebar page.
    confirmed is a one-element list used as a mutable flag across calls.
    """
    await asyncio.sleep(1.5)

    pairs = await _find_left_panel_players(page)  # list of (name, locator)

    if not pairs:
        print("  [!] Could not find player list items on this page — skipping")
        return

    # ── Confirmation step (first page only) ─────────────────────────────────
    if not confirmed[0]:
        print(f"\n  Found {len(pairs)} players on this page.")
        print("  First 10 names detected:")
        for i, (name, _) in enumerate(pairs[:10]):
            print(f"    {i+1}. {name}")
        print()
        answer = input("  Do these look like YOUR players? (y/n) ").strip().lower()
        if answer != "y":
            print()
            print("  Stopping. Please send a screenshot of the browser and black")
            print("  window to get the selectors adjusted.")
            raise SystemExit(0)
        confirmed[0] = True
    # ─────────────────────────────────────────────────────────────────────────

    # Collect names upfront (locators go stale after navigation)
    player_names = [name for name, _ in pairs]
    total = len(player_names)

    for idx, player_name in enumerate(player_names):
        print(f"  [{idx+1}/{total}] {player_name}")
        try:
            # Re-find by name each time since locators go stale after navigation
            loc = page.get_by_text(player_name, exact=True).first
            await loc.scroll_into_view_if_needed()
            await loc.click()
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
    print()
    print("  *** IMPORTANT ***")
    print("  1. Log into RinkNet in the browser window.")
    print("  2. Navigate to YOUR player list (the page with")
    print("     all the player names on the left side).")
    print("  3. Once you can SEE the player list, come back")
    print("     HERE and press ENTER.")
    print("  DO NOT close the browser window!")
    print()

    all_contacts: list[dict] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False)
        context = await browser.new_context()
        page    = await context.new_page()

        await page.goto("https://ops.rinknet.com/")
        input(">>> Logged in and on your player list page? Press ENTER … ")

        # Use whatever page the user navigated to — no hardcoded URL
        print("\nStarting on current page …")
        await _wait_stable(page)
        await asyncio.sleep(2)

        page_num = 1
        confirmed = [False]  # mutable flag so confirmation only happens once
        while True:
            print(f"\n{'─'*50}")
            print(f"  PAGE {page_num}")
            print(f"{'─'*50}")

            await process_page(page, all_contacts, confirmed)

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

    timestamp   = datetime.now().strftime("%Y-%m-%d_%H-%M")
    output_file = Path(__file__).parent / f"parent_emails_{timestamp}.csv"

    fieldnames = ["player", "family_member", "email"]

    with open(output_file, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(unique)

    print(f"Saved → {output_file}")
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
