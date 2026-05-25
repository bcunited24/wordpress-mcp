"""
RinkNet Parent Email Scraper
----------------------------
HOW TO RUN (Windows):
  1. Install Python from https://python.org  (check "Add to PATH" during install)
  2. Open Command Prompt and run these three commands one at a time:
       pip install playwright
       playwright install chromium
       python scrape_rinknet.py
  3. A browser window will open — log into RinkNet normally, then come back to
     the terminal and press ENTER. The script does the rest.
  4. Results are saved to parent_emails.csv in the same folder as this script.
"""

import asyncio
import csv
import json
import re
import sys
from pathlib import Path

TARGET_URL = "https://ops.rinknet.com/#/home/players/addressPhone?listIds=942916689,-1350718491"
OUTPUT_FILE = Path(__file__).parent / "parent_emails.csv"

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")


def extract_emails_recursive(obj, collector: set):
    """Walk any JSON structure and pull out every email address found."""
    if isinstance(obj, str):
        for m in EMAIL_RE.findall(obj):
            collector.add(m.lower())
    elif isinstance(obj, dict):
        for v in obj.values():
            extract_emails_recursive(v, collector)
    elif isinstance(obj, list):
        for item in obj:
            extract_emails_recursive(item, collector)


def extract_records_recursive(obj, records: list, depth=0):
    """
    Try to pull structured rows (dicts with name + email fields) out of the
    JSON so the CSV has player/parent name context alongside the email.
    Falls back to flat email-only rows if the structure is unrecognised.
    """
    if isinstance(obj, list):
        for item in obj:
            extract_records_recursive(item, records, depth + 1)
    elif isinstance(obj, dict):
        # Look for any key that smells like an email
        email_keys = [k for k, v in obj.items()
                      if isinstance(v, str) and EMAIL_RE.match(v.strip())]
        name_keys  = [k for k in obj
                      if any(tok in k.lower() for tok in
                             ("name", "player", "parent", "guardian", "first", "last"))]
        if email_keys:
            row = {}
            for k in name_keys:
                row[k] = obj[k]
            for k in email_keys:
                row["email"] = obj[k].strip().lower()
            records.append(row)
        else:
            for v in obj.values():
                extract_records_recursive(v, records, depth + 1)


async def main():
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("\nERROR: Playwright is not installed.")
        print("Run this command first:  pip install playwright")
        print("Then run:                playwright install chromium")
        sys.exit(1)

    print("=" * 60)
    print("  RinkNet Parent Email Scraper")
    print("=" * 60)
    print()
    print("A browser window is about to open.")
    print("1. Log into RinkNet as you normally would.")
    print("2. Once you are fully logged in, come BACK to this window")
    print("   and press ENTER to continue.")
    print()

    api_responses: list[dict] = []          # raw JSON payloads from API calls
    flat_emails:   set[str]   = set()       # fallback: any email found anywhere

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False)
        context = await browser.new_context()
        page    = await context.new_page()

        # ---------- intercept every JSON response ----------
        async def on_response(response):
            try:
                if response.status != 200:
                    return
                ct = response.headers.get("content-type", "")
                if "json" not in ct:
                    return
                text = await response.text()
                if "@" not in text:          # quick pre-filter
                    return
                data = json.loads(text)
                api_responses.append(data)
            except Exception:
                pass

        page.on("response", on_response)
        # ---------------------------------------------------

        await page.goto("https://ops.rinknet.com/")

        # Pause here so the user can log in manually
        input(">>> Logged in? Press ENTER to continue... ")

        print()
        print("Navigating to the player address/phone list...")
        await page.goto(TARGET_URL)

        # Wait for the SPA to finish rendering
        try:
            await page.wait_for_load_state("networkidle", timeout=15_000)
        except Exception:
            pass
        await asyncio.sleep(4)

        print("Page loaded. Scanning for email addresses...")

        # Also grab any emails visible in the rendered HTML (belt-and-suspenders)
        visible_emails: list[str] = await page.evaluate("""
            () => {
                const re = /[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}/g;
                return [...new Set((document.body.innerText.match(re) || [])
                                   .map(e => e.toLowerCase()))];
            }
        """)
        flat_emails.update(visible_emails)

        # Also try to read the full page text for any emails in hidden elements
        page_text: str = await page.evaluate("() => document.documentElement.innerHTML")
        for m in EMAIL_RE.findall(page_text):
            flat_emails.add(m.lower())

        await browser.close()

    # -------- process collected API data --------
    records: list[dict] = []
    for payload in api_responses:
        extract_records_recursive(payload, records)
        extract_emails_recursive(payload, flat_emails)

    # Deduplicate structured records by email
    seen: set[str] = set()
    unique_records: list[dict] = []
    for rec in records:
        e = rec.get("email", "")
        if e and e not in seen:
            seen.add(e)
            unique_records.append(rec)

    # Add any flat emails not already covered by structured records
    for e in sorted(flat_emails):
        if e not in seen:
            seen.add(e)
            unique_records.append({"email": e})

    print(f"\nTotal unique email addresses found: {len(unique_records)}")

    if not unique_records:
        print("\nNo emails were captured.")
        print("This can happen if RinkNet loads data only after a user action.")
        print("Try scrolling through the full player list before pressing ENTER,")
        print("or use Option 3 (browser dev tools) — ask for instructions.")
        return

    # -------- build CSV --------
    # Determine all column headers (email always last)
    all_keys: list[str] = []
    for rec in unique_records:
        for k in rec:
            if k != "email" and k not in all_keys:
                all_keys.append(k)
    all_keys.append("email")

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=all_keys, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(unique_records)

    print(f"Saved to: {OUTPUT_FILE}")
    print()
    print("Done! Open parent_emails.csv to see your results.")


if __name__ == "__main__":
    asyncio.run(main())
