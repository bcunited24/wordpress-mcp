#!/usr/bin/env node
/**
 * RinkNet Rankings Retry 2 — targets the 24 remaining skipped players.
 * All 24 are found in RinkNet search; failures are row-click / confirm-button / navigation.
 *
 * RUN:  node rinknet-retry2.js
 */

'use strict';

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

const USERNAME        = 'bcollins@neutralzone.net';
const PASSWORD        = 'NZhockey24!';
const LIST_ID         = '-1531873177';
const SCREENSHOTS_DIR = './rinknet-screenshots';

const PLAYERS = [
  { rank:2,   last:'McKinnon',          first:'Jacob',          stars:4.50 },
  { rank:173, last:'Bowles',            first:'Liam',           stars:3.50 },
  { rank:16,  last:'Guévin',            first:'Émile',          stars:4.25 },
  { rank:29,  last:'Levy',              first:'Enzo',           stars:4.00 },
  { rank:30,  last:'Blanchette',        first:'Alexy',          stars:4.00 },
  { rank:38,  last:'Généreux',          first:'Mathieu',        stars:4.00 },
  { rank:43,  last:'Guérard',           first:'Simon-Olivier',  stars:3.75 },
  { rank:80,  last:'Légaré',            first:'Hugo',           stars:3.75 },
  { rank:83,  last:'Théorêt',           first:'Félix',          stars:3.75 },
  { rank:131, last:'Sy Lam Pham',       first:'Florent',        stars:3.50 },
  { rank:145, last:'DaPastena',         first:'Luca',           stars:3.50 },
  { rank:178, last:'Desjardins',        first:'Loïk',           stars:3.25 },
  { rank:197, last:'Soulière',          first:'Tommy',          stars:3.25 },
  { rank:222, last:'Côté',              first:'Alexy',          stars:3.25 },
  { rank:225, last:'Lanctôt',           first:'Xavier',         stars:3.25 },
  { rank:242, last:'Hanson-Leveillé',   first:'Dylan',          stars:3.25 },
  { rank:253, last:'Dickinson',         first:'Rhys',           stars:3.25 },
  { rank:256, last:'Vachon',            first:'Phillipe',       stars:3.25 },
  { rank:257, last:'Dow-Imrie',         first:'Nolan',          stars:3.25 },
  { rank:258, last:'Montminy',          first:'Samuel',         stars:3.25 },
  { rank:273, last:'Morgan',            first:'Thomas',         stars:3.25 },
  { rank:281, last:'Pelletier',         first:'Simon',          stars:3.25 },
  { rank:291, last:'Quenville',         first:'Justin',         stars:3.25 },
  { rank:299, last:'Giguère',           first:'Thomas',         stars:3.25 },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function saveScreenshot(page, name) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const file = path.join(SCREENSHOTS_DIR, `${Date.now()}-${name}.png`);
  return page.screenshot({ path: file, fullPage: false }).catch(() => {});
}

const COMBINING_MARKS = new RegExp('[\u0300-\u036f]', 'g');
function stripAccents(str) {
  return str.normalize('NFD').replace(COMBINING_MARKS, '');
}

// Returns search terms to try in order, most-specific first.
function buildSearchTerms(player) {
  const prefix = stripAccents(player.first.substring(0, 2));
  const last   = player.last;
  const terms  = new Set();

  terms.add(`${prefix} ${stripAccents(last)}`);      // e.g. "Th Gregoire"
  terms.add(`${prefix} ${last}`);                    // e.g. "Th Grégoire"

  const noApos = stripAccents(last.replace(/['']/g, ''));
  terms.add(`${prefix} ${noApos}`);                  // O'Connell → OConnell

  const segs    = last.split(/[-\s]/);
  terms.add(`${prefix} ${stripAccents(segs[0])}`);   // first segment
  terms.add(`${prefix} ${stripAccents(segs[segs.length - 1])}`); // last segment
  if (segs.length >= 3) terms.add(`${prefix} ${stripAccents(segs[1])}`); // middle

  terms.add(stripAccents(last));                     // bare last name
  return [...terms];
}

async function dismissErrorPopup(page) {
  try {
    if (!await page.locator('text=Something has gone wrong').isVisible({ timeout: 400 }).catch(() => false)) return false;
    for (const sel of ['button:has-text("Close")', 'button:has-text("OK")', '[aria-label="Close"]', 'mat-dialog-actions button']) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 300 }).catch(() => false)) { await btn.click(); return true; }
    }
    await page.keyboard.press('Escape');
    return true;
  } catch (_) { return false; }
}

// Close any open modal (Escape key + wait for md-dialog to disappear).
async function closeModal(page) {
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(600);
  // If dialog still visible, try clicking outside it
  const stillOpen = await page.locator('.md-dialog-container').isVisible({ timeout: 500 }).catch(() => false);
  if (stillOpen) {
    await page.mouse.click(10, 10).catch(() => {});
    await sleep(500);
  }
}

// Wait up to `ms` for the confirm ADD PLAYER button INSIDE the dialog to become enabled.
async function waitForConfirmEnabled(page, ms) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    // Only look inside md-dialog-container — never the trigger button behind it
    const btns = page.locator('.md-dialog-container button:has-text("Add Player"), .md-dialog-container button:has-text("ADD PLAYER")');
    const count = await btns.count().catch(() => 0);
    for (let i = count - 1; i >= 0; i--) {
      const vis      = await btns.nth(i).isVisible({ timeout: 200 }).catch(() => false);
      const disabled = await btns.nth(i).isDisabled().catch(() => true);
      if (vis && !disabled) return btns.nth(i);
    }
    await sleep(300);
  }
  return null;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  RinkNet Retry 2  (24 remaining players) ║');
  console.log('╚══════════════════════════════════════════╝\n');

  let loginCompleted = false;
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context  = await browser.newContext();
  const page     = await context.newPage();

  page.on('request', req => {
    if (req.url().includes('/users/loginFromAuthPortal')) loginCompleted = true;
  });

  // ── Login ──────────────────────────────────────────────────────────────────
  console.log('→ Logging in…');
  await page.goto('https://accounts.rinknet.com/', { waitUntil: 'domcontentloaded' });
  await sleep(2000);

  for (const sel of ['input[type="email"]','input[name="email"]','input[name="username"]','input[type="text"]']) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) { await el.fill(USERNAME); break; }
    } catch (_) {}
  }
  await sleep(500);

  try {
    const pw = page.locator('input[type="password"]').first();
    if (await pw.isVisible({ timeout: 3000 })) {
      await pw.fill(PASSWORD);
    } else {
      console.log('  ⚠ Password field not visible — please type it in the browser');
    }
  } catch (_) {
    console.log('  ⚠ Password field not found — please type it in the browser');
  }
  await sleep(500);

  try { await page.locator('button[type="submit"]').first().click(); }
  catch (_) { await page.keyboard.press('Enter').catch(() => {}); }

  console.log('  Waiting for login… (enter 2FA in the browser if prompted)');
  for (let i = 0; i < 120; i++) { if (loginCompleted) break; await sleep(1000); }
  if (!loginCompleted) console.log('  ⚠ Auth not confirmed — proceeding anyway');
  await sleep(2000);

  if (!page.url().includes('ops.rinknet.com')) {
    await page.goto('https://ops.rinknet.com/#/home', { waitUntil: 'domcontentloaded' });
    await sleep(3000);
  }
  console.log('✓ Logged in\n');

  const listUrl = `https://ops.rinknet.com/#/home/lists/view/${LIST_ID}`;
  await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
  await sleep(3000);

  const results = { ok: [], skip: [], notFound: [] };

  for (const player of PLAYERS) {
    console.log(`\n[${player.rank}] ${player.first} ${player.last} (${player.stars}★)`);

    try {
      await dismissErrorPopup(page);

      // ── Step 1: Ensure modal is closed and we're on the list view ──────
      // Close any modal left open by a previous failure before doing anything
      const modalOpen = await page.locator('.md-dialog-container').isVisible({ timeout: 500 }).catch(() => false);
      if (modalOpen) {
        console.log(`  → Closing leftover modal…`);
        await closeModal(page);
      }

      if (!page.url().includes(`/home/lists/view/${LIST_ID}`)) {
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(3000);
      }

      // ── Step 2: Click the + ADD PLAYER trigger ───────────────────────────
      let triggerClicked = false;
      for (const sel of [
        'button:has-text("Add Player")', 'a:has-text("Add Player")',
        'button:has-text("ADD PLAYER")', 'a:has-text("ADD PLAYER")',
      ]) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 6000 })) {
            await el.scrollIntoViewIfNeeded();
            await sleep(300);
            await el.click();
            triggerClicked = true;
            break;
          }
        } catch (_) {}
      }

      if (!triggerClicked) {
        console.log(`  ✗ SKIP — ADD PLAYER trigger not found`);
        await saveScreenshot(page, `skip-trigger-${player.rank}`);
        results.skip.push(player.rank);
        await closeModal(page);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2500);
        continue;
      }

      // ── Step 3: Wait for modal ───────────────────────────────────────────
      try {
        await page.waitForSelector('text=Search by Player', { timeout: 12000 });
      } catch (_) {
        const hadError = await dismissErrorPopup(page);
        if (hadError) {
          await page.locator('button:has-text("Add Player"), a:has-text("Add Player")').first().click().catch(() => {});
          await page.waitForSelector('text=Search by Player', { timeout: 10000 }).catch(() => {});
        }
      }

      if (!await page.locator('text=Search by Player').isVisible().catch(() => false)) {
        console.log(`  ✗ SKIP — modal did not open`);
        await saveScreenshot(page, `skip-modal-${player.rank}`);
        results.skip.push(player.rank);
        await closeModal(page);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2500);
        continue;
      }

      // ── Step 4: Find modal search input (lowest on page = inside modal) ──
      await sleep(500);
      let searchInput = null;
      const allInputs = await page.locator('input').all();
      let maxY = -1;
      for (const el of allInputs) {
        const box = await el.boundingBox().catch(() => null);
        if (box && box.y > maxY) { maxY = box.y; searchInput = el; }
      }

      if (!searchInput) {
        console.log(`  ✗ SKIP — search input not found`);
        await saveScreenshot(page, `skip-input-${player.rank}`);
        results.skip.push(player.rank);
        await closeModal(page);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2500);
        continue;
      }

      // ── Step 5: Search — try terms until rows appear ─────────────────────
      const terms = buildSearchTerms(player);
      let rowCount = 0;

      for (const term of terms) {
        console.log(`  → Searching: "${term}"`);
        await searchInput.click({ clickCount: 3 });
        await searchInput.fill('');
        await sleep(400);
        await searchInput.fill(term);
        await sleep(3000);  // generous wait for auto-search

        // Only count rows INSIDE the modal — the main list table also has
        // hundreds of tr elements which would give a false "found" reading.
        rowCount = await page.locator('.md-dialog-container table tbody tr').count().catch(() => 0);
        if (rowCount > 0) {
          console.log(`  ✓ ${rowCount} row(s) found`);
          break;
        }
      }

      if (rowCount === 0) {
        console.log(`  ✗ NOT FOUND`);
        await saveScreenshot(page, `notfound-${player.rank}`);
        results.notFound.push(player.rank);
        await closeModal(page);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2500);
        continue;
      }

      // ── Step 6: Click the best matching row ─────────────────────────────
      // Scope every selector to inside md-dialog-container so we never
      // accidentally click a row in the main list table behind the modal.
      const baseName         = stripAccents(player.last.split(/[-'\s]/)[0]);
      const baseNameAccented = player.last.split(/[-'\s]/)[0];
      const rowTried = [
        `.md-dialog-container tr:has-text("${baseNameAccented}"):has-text("/2010")`,
        `.md-dialog-container tr:has-text("${baseName}"):has-text("/2010")`,
        `.md-dialog-container tr:has-text("${baseNameAccented}"):has-text("/2009")`,
        `.md-dialog-container tr:has-text("${baseName}"):has-text("/2009")`,
        `.md-dialog-container tr:has-text("${baseNameAccented}")`,
        `.md-dialog-container tr:has-text("${baseName}")`,
        '.md-dialog-container table tbody tr:first-child',
      ];
      let rowClicked = false;
      for (const sel of rowTried) {
        try {
          const row = page.locator(sel).first();
          if (await row.isVisible({ timeout: 2000 })) {
            await row.click();
            rowClicked = true;
            console.log(`  ✓ Row clicked (${sel})`);
            break;
          }
        } catch (_) {}
      }
      if (!rowClicked) {
        // Last resort: click whatever is in the table
        await page.locator('.md-dialog-container table tbody tr').first().click().catch(() => {});
        console.log(`  ✓ Row clicked (modal first row fallback)`);
      }

      // ── Step 7: Wait up to 5s for the confirm button to become enabled ───
      await sleep(800);
      const confirmBtn = await waitForConfirmEnabled(page, 5000);

      if (!confirmBtn) {
        console.log(`  ✗ SKIP — confirm button never enabled`);
        await saveScreenshot(page, `skip-confirm-${player.rank}`);
        results.skip.push(player.rank);
        await closeModal(page);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2500);
        continue;
      }

      await confirmBtn.click();
      console.log(`  ✓ Confirm clicked`);

      // ── Step 8: Wait for addPlayer page ─────────────────────────────────
      try {
        await page.waitForURL('**/addPlayer/**', { timeout: 15000 });
      } catch (_) {
        console.log(`  ✗ SKIP — addPlayer page not reached`);
        await saveScreenshot(page, `skip-addplayer-${player.rank}`);
        results.skip.push(player.rank);
        await closeModal(page);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2500);
        continue;
      }

      await sleep(1000);

      // ── Step 9: Fill Ranking ─────────────────────────────────────────────
      for (const sel of ['input[name="ranking"]','input[name="rank"]','input[type="number"]','input[type="text"]']) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
          await el.click({ clickCount: 3 });
          await el.fill(String(player.rank));
          break;
        }
      }

      // ── Step 10: Set Star Rating ─────────────────────────────────────────
      const starValue = String(parseFloat(player.stars));
      const selects   = page.locator('select');
      const selCount  = await selects.count();
      for (let si = 0; si < selCount; si++) {
        const sel  = selects.nth(si);
        const opts = await sel.locator('option').allTextContents();
        if (opts.some(o => /^\d\.\d/.test(o.trim()))) {
          await sel.selectOption(starValue);
          break;
        }
      }

      // ── Step 11: Save ────────────────────────────────────────────────────
      for (const sel of ['button:has-text("SAVE")','button:has-text("Save")','button[type="submit"]']) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 1000 }).catch(() => false)) { await el.click(); break; }
      }

      // ── Step 12: Wait to return to list ─────────────────────────────────
      try {
        await page.waitForFunction(() => !window.location.href.includes('addPlayer'), { timeout: 15000 });
      } catch (_) {
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
      }

      await sleep(1000);
      console.log(`  ✓ Added rank ${player.rank} at ${player.stars}★`);
      results.ok.push(player.rank);

    } catch (err) {
      console.error(`  ✗ ERROR: ${err.message}`);
      await saveScreenshot(page, `error-${player.rank}`);
      results.skip.push(player.rank);
      await closeModal(page);
      await page.goto(listUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await sleep(3000);
    }
  }

  console.log('\n══════════════════════════════════════════════');
  console.log(`  ✓ Added:     ${results.ok.length}`);
  console.log(`  ✗ Skipped:   ${results.skip.length}`);
  console.log(`  ✗ Not found: ${results.notFound.length}`);
  if (results.skip.length)     console.log(`  Skip ranks:      ${results.skip.join(', ')}`);
  if (results.notFound.length) console.log(`  Not-found ranks: ${results.notFound.join(', ')}`);
  console.log('══════════════════════════════════════════════\n');

  await browser.close();
}

main().catch(err => { console.error(err); process.exit(1); });
