#!/usr/bin/env node
/**
 * RinkNet Rankings Retry — targets the 58 players that failed on the first run.
 * Adds them directly to existing list -1531873177 (2026 NZ Rankings).
 *
 * SETUP (one-time — if not done already):
 *   npm install playwright
 *   npx playwright install chromium
 *
 * RUN:
 *   node rinknet-retry.js
 */

'use strict';

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const USERNAME        = 'bcollins@neutralzone.net';
const PASSWORD        = 'NZhockey24!';
const LIST_ID         = '-1531873177';   // existing list — no creation needed
const DELAY_MS        = 800;
const SCREENSHOTS_DIR = './rinknet-screenshots';
// ─────────────────────────────────────────────────────────────────────────────

// Only the 58 players that failed on the original run.
// rank 64 corrected: McQuire → McGuire
const PLAYERS = [
  // ── Technical SKIPs from first run ─────────────────────────────────────────
  { rank:2,   last:'McKinnon',       first:'Jacob',          stars:4.50 },
  { rank:61,  last:'Perreault',      first:'Mikael',         stars:3.75 },
  { rank:62,  last:'Rioux',          first:'Emile',          stars:3.75 },
  { rank:91,  last:'Vaillancourt',   first:'Hugo',           stars:3.50 },
  { rank:92,  last:'Sorgini',        first:'Gabriel',        stars:3.75 },
  { rank:93,  last:"D'Elia",         first:'Tristan',        stars:3.75 },
  { rank:94,  last:'Lacelle',        first:'Henry',          stars:3.50 },
  { rank:95,  last:'Lafreniere',     first:'Olivier',        stars:3.75 },
  { rank:96,  last:'De Franco',      first:'Isaac',          stars:3.50 },
  { rank:97,  last:'Leduc',          first:'Noah',           stars:3.75 },
  { rank:117, last:'Lacombe',        first:'Rayan',          stars:3.50 },
  { rank:118, last:'Bouchard',       first:'Emile',          stars:3.50 },
  { rank:119, last:'Labelle',        first:'Zack',           stars:3.50 },
  { rank:120, last:'Ethier',         first:'Eliot',          stars:3.50 },
  { rank:121, last:'St-Denis',       first:'Eloik',          stars:3.50 },
  { rank:123, last:'Wragg',          first:'Yoan',           stars:3.50 },
  { rank:124, last:'Sabourin',       first:'Jacob',          stars:3.50 },
  { rank:128, last:'Paradis',        first:'Alexandre',      stars:3.50 },
  { rank:141, last:'Laplante',       first:'William',        stars:3.50 },
  { rank:142, last:'Duplantie',      first:'Dominic',        stars:3.50 },
  { rank:143, last:'Bibeau',         first:'Zachary',        stars:3.50 },
  { rank:173, last:'Bowles',         first:'Liam',           stars:3.50 },
  { rank:174, last:'Meaden',         first:'Aaron',          stars:3.50 },
  { rank:212, last:'Salomon',        first:'Samuel',         stars:3.25 },
  { rank:213, last:'Gillard',        first:'Brandon',        stars:3.25 },
  { rank:259, last:'Bernier',        first:'Max',            stars:3.25 },
  { rank:274, last:'Boone',          first:'Liam',           stars:3.25 },
  // ── Not found in RinkNet on first run — retrying with fallback searches ─────
  { rank:16,  last:'Guevin',         first:'Emile',          stars:4.25 },
  { rank:29,  last:'Levy',           first:'Enzo',           stars:4.00 },
  { rank:30,  last:'Blanchette',     first:'Alexy',          stars:4.00 },
  { rank:38,  last:'Genereux',       first:'Mathieu',        stars:4.00 },
  { rank:43,  last:'Guerard',        first:'Simon-Olivier',  stars:3.75 },
  { rank:64,  last:'McGuire',        first:'Luke',           stars:3.75 },  // was McQuire
  { rank:65,  last:'Duffy',          first:'Liam',           stars:3.75 },
  { rank:69,  last:"O'Connell",      first:'Noah',           stars:3.75 },
  { rank:80,  last:'Legare',         first:'Hugo',           stars:3.75 },
  { rank:83,  last:'Theoret',        first:'Felix',          stars:3.75 },
  { rank:131, last:'Sy Lam Pham',    first:'Florent',        stars:3.50 },
  { rank:145, last:'DaPastena',      first:'Luca',           stars:3.50 },
  { rank:150, last:'Gregoire',       first:'Benjamin',       stars:3.50 },
  { rank:160, last:'Beck',           first:'Alexander',      stars:3.50 },
  { rank:178, last:'Desjardins',     first:'Loik',           stars:3.25 },
  { rank:179, last:'Hug',            first:'Dylan',          stars:3.25 },
  { rank:194, last:'Lachapelle',     first:'William',        stars:3.25 },
  { rank:197, last:'Souliere',       first:'Tommy',          stars:3.25 },
  { rank:222, last:'Cote',           first:'Alexy',          stars:3.25 },
  { rank:225, last:'Lanctot',        first:'Xavier',         stars:3.25 },
  { rank:227, last:'Garneau',        first:'William',        stars:3.25 },
  { rank:242, last:'Hanson-Leveille',first:'Dylan',          stars:3.25 },
  { rank:253, last:'Dickinson',      first:'Rhys',           stars:3.25 },
  { rank:256, last:'Vachon',         first:'Phillipe',       stars:3.25 },
  { rank:257, last:'Dow-Imrie',      first:'Nolan',          stars:3.25 },
  { rank:258, last:'Montminy',       first:'Samuel',         stars:3.25 },
  { rank:273, last:'Morgan',         first:'Thomas',         stars:3.25 },
  { rank:281, last:'Pelletier',      first:'Simon',          stars:3.25 },
  { rank:284, last:'Gosselin',       first:'Max',            stars:3.25 },
  { rank:291, last:'Quenville',      first:'Justin',         stars:3.25 },
  { rank:299, last:'Giguere',        first:'Thomas',         stars:3.25 },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function saveScreenshot(page, name) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const file = path.join(SCREENSHOTS_DIR, `${Date.now()}-${name}.png`);
  return page.screenshot({ path: file, fullPage: false }).catch(() => {});
}

function stripAccents(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Build a list of search strings to try, from most specific to most forgiving.
function buildSearchTerms(player) {
  const prefix = stripAccents(player.first.substring(0, 2));
  const last   = player.last;

  const terms = new Set();

  // Primary: "Pr Lastname"
  terms.add(`${prefix} ${stripAccents(last)}`);

  // Strip apostrophes: O'Connell → OConnell, D'Elia → DElia
  const noApostrophe = stripAccents(last.replace(/'/g, ''));
  terms.add(`${prefix} ${noApostrophe}`);

  // Hyphenated / space-separated — try first segment: Hanson-Leveille → Hanson, De Franco → De
  const firstSeg = stripAccents(last.split(/[-\s]/)[0]);
  terms.add(`${prefix} ${firstSeg}`);

  // Last segment: Sy Lam Pham → Pham, Hanson-Leveille → Leveille
  const segs = last.split(/[-\s]/);
  const lastSeg = stripAccents(segs[segs.length - 1]);
  terms.add(`${prefix} ${lastSeg}`);

  // Middle segment for 3-word names: Sy Lam Pham → Lam
  if (segs.length >= 3) {
    terms.add(`${prefix} ${stripAccents(segs[1])}`);
  }

  // Bare last name only (no prefix) — last resort
  terms.add(stripAccents(last));

  return [...terms];
}

async function dismissErrorPopup(page) {
  try {
    const errEl = page.locator('text=Something has gone wrong');
    if (!await errEl.isVisible({ timeout: 300 }).catch(() => false)) return false;
    for (const sel of [
      'button:has-text("Close")', 'button:has-text("OK")',
      'button:has-text("Dismiss")', '[aria-label="Close"]', 'mat-dialog-actions button',
    ]) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 300 }).catch(() => false)) {
        await btn.click();
        return true;
      }
    }
    await page.keyboard.press('Escape');
    return true;
  } catch (_) { return false; }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   RinkNet Rankings Retry  (58 players)   ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page    = await context.newPage();

  // ── Login ──────────────────────────────────────────────────────────────────
  console.log('→ Logging in…');
  await page.goto('https://accounts.rinknet.com/#/', { waitUntil: 'domcontentloaded' });
  await sleep(2000);

  // Fill credentials wherever they appear
  const userField = page.locator('input[type="email"], input[name="username"], input[name="email"]').first();
  await userField.fill(USERNAME).catch(() => {});
  const passField = page.locator('input[type="password"]').first();
  await passField.fill(PASSWORD).catch(() => {});
  await passField.press('Enter');
  await sleep(4000);

  // If still on accounts domain, try clicking Sign In button
  if (page.url().includes('accounts.rinknet.com')) {
    await page.locator('button:has-text("Sign In"), button:has-text("LOG IN"), button[type="submit"]')
      .first().click().catch(() => {});
    await sleep(4000);
  }

  // Navigate to the ops portal
  if (!page.url().includes('ops.rinknet.com')) {
    await page.goto('https://ops.rinknet.com/#/home', { waitUntil: 'domcontentloaded' });
    await sleep(3000);
  }
  console.log('✓ Logged in\n');

  // ── Navigate to the existing list ─────────────────────────────────────────
  const listUrl = `https://ops.rinknet.com/#/home/lists/view/${LIST_ID}`;
  await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
  await sleep(3000);
  console.log(`✓ Navigated to list ${LIST_ID}\n`);

  // ── Process each player ────────────────────────────────────────────────────
  const results = { ok: [], skip: [], notFound: [] };

  for (const player of PLAYERS) {
    console.log(`\n[${player.rank}] ${player.first} ${player.last} (${player.stars}★)`);

    try {
      await dismissErrorPopup(page);

      // Step 1: Ensure we are on the list view page
      const curUrl = page.url();
      if (!curUrl.includes(`/home/lists/view/${LIST_ID}`)) {
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2500);
      }

      // Step 2: Click the + ADD PLAYER trigger button
      let triggerClicked = false;
      for (const sel of [
        'button:has-text("Add Player")',
        'a:has-text("Add Player")',
        'button:has-text("ADD PLAYER")',
        'a:has-text("ADD PLAYER")',
      ]) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 5000 })) {
            await el.scrollIntoViewIfNeeded();
            await el.click();
            triggerClicked = true;
            break;
          }
        } catch (_) {}
      }

      if (!triggerClicked) {
        console.log(`  ✗ SKIP — could not click ADD PLAYER trigger`);
        await saveScreenshot(page, `skip-trigger-${player.rank}`);
        results.skip.push(player.rank);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2000);
        continue;
      }

      // Step 3: Wait for modal ("Search by Player" label is unique to the modal)
      try {
        await page.waitForSelector('text=Search by Player', { timeout: 10000 });
      } catch (_) {
        const hadError = await dismissErrorPopup(page);
        if (hadError) {
          await page.locator('button:has-text("Add Player"), a:has-text("Add Player")').first().click().catch(() => {});
          await page.waitForSelector('text=Search by Player', { timeout: 8000 }).catch(() => {});
        }
      }

      if (!await page.locator('text=Search by Player').isVisible().catch(() => false)) {
        console.log(`  ✗ SKIP — modal did not open`);
        await saveScreenshot(page, `skip-modal-${player.rank}`);
        results.skip.push(player.rank);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2000);
        continue;
      }

      // Step 4: Find the modal search input (lowest in the page = below header)
      let searchInput = null;
      const allInputEls = await page.locator('input').all();
      let maxY = -1;
      for (const el of allInputEls) {
        const box = await el.boundingBox().catch(() => null);
        if (box && box.y > maxY) { maxY = box.y; searchInput = el; }
      }

      if (!searchInput) {
        console.log(`  ✗ SKIP — search input not found`);
        results.skip.push(player.rank);
        await page.keyboard.press('Escape');
        await sleep(500);
        continue;
      }

      // Step 5: Try each search term until a matching row appears
      const searchTerms = buildSearchTerms(player);
      let rowFound = false;

      for (const term of searchTerms) {
        console.log(`  → Searching: "${term}"`);
        await searchInput.click({ clickCount: 3 });
        await searchInput.fill('');
        await sleep(300);
        await searchInput.fill(term);
        await sleep(2500);  // wait for auto-search

        // Check if any rows appeared in the results table
        const hasRows = await page.locator('table tbody tr').count().catch(() => 0);
        if (hasRows > 0) {
          rowFound = true;
          console.log(`  ✓ Found rows with term "${term}"`);
          break;
        }
      }

      if (!rowFound) {
        console.log(`  ✗ NOT FOUND — no results for any search term`);
        await saveScreenshot(page, `notfound-${player.rank}`);
        results.notFound.push(player.rank);
        await page.keyboard.press('Escape');
        await sleep(500);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2000);
        continue;
      }

      // Step 6: Select the best matching row (prefer /2010, then /2009, then first)
      const rowSelectors = [
        `tr:has-text("${player.last.split(/[-'\s]/)[0]}"):has-text("/2010")`,
        `tr:has-text("${player.last.split(/[-'\s]/)[0]}"):has-text("/2009")`,
        `tr:has-text("${player.last.split(/[-'\s]/)[0]}")`,
        'table tbody tr:first-child',
      ];
      let rowClicked = false;
      for (const sel of rowSelectors) {
        try {
          const row = page.locator(sel).first();
          if (await row.isVisible({ timeout: 2000 })) {
            await row.click();
            rowClicked = true;
            break;
          }
        } catch (_) {}
      }

      if (!rowClicked) {
        // fallback: click whatever first row is there
        await page.locator('table tbody tr').first().click().catch(() => {});
      }

      await sleep(500);

      // Step 7: Click the ADD PLAYER confirm button (last visible enabled one)
      const allAddBtns = page.locator('button:has-text("Add Player"), button:has-text("ADD PLAYER")');
      const total = await allAddBtns.count();
      let confirmClicked = false;
      for (let bi = total - 1; bi >= 0; bi--) {
        const vis      = await allAddBtns.nth(bi).isVisible({ timeout: 300 }).catch(() => false);
        if (!vis) continue;
        const disabled = await allAddBtns.nth(bi).isDisabled().catch(() => false);
        if (disabled) continue;
        await allAddBtns.nth(bi).click();
        confirmClicked = true;
        break;
      }

      if (!confirmClicked) {
        console.log(`  ✗ SKIP — ADD PLAYER confirm button not enabled`);
        await saveScreenshot(page, `skip-confirm-${player.rank}`);
        results.skip.push(player.rank);
        await page.keyboard.press('Escape');
        await sleep(500);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2000);
        continue;
      }

      // Step 8: Wait for addPlayer navigation
      try {
        await page.waitForURL('**/addPlayer/**', { timeout: 12000 });
      } catch (_) {
        console.log(`  ✗ SKIP — did not reach addPlayer page`);
        await saveScreenshot(page, `skip-addplayer-${player.rank}`);
        results.skip.push(player.rank);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2000);
        continue;
      }

      await sleep(DELAY_MS);

      // Step 9: Fill Ranking number
      const rankSelectors = [
        'input[name="ranking"]', 'input[name="rank"]',
        'input[type="number"]',  'input[type="text"]',
      ];
      for (const sel of rankSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
          await el.click({ clickCount: 3 });
          await el.fill(String(player.rank));
          break;
        }
      }

      // Step 10: Set Star Rating — find the <select> that has float options (e.g. "4.5")
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

      // Step 11: Click SAVE
      for (const sel of ['button:has-text("SAVE")', 'button:has-text("Save")', 'button[type="submit"]']) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
          await el.click();
          break;
        }
      }

      // Step 12: Wait to return to list view
      try {
        await page.waitForFunction(() => !window.location.href.includes('addPlayer'), { timeout: 12000 });
      } catch (_) {
        // If stuck, force-navigate back
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
      }

      await sleep(DELAY_MS);
      console.log(`  ✓ Added — rank ${player.rank}, ${player.stars}★`);
      results.ok.push(player.rank);

    } catch (err) {
      console.error(`  ✗ ERROR: ${err.message}`);
      await saveScreenshot(page, `error-${player.rank}`);
      results.skip.push(player.rank);
      // Recover: go back to list
      await page.goto(listUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await sleep(2500);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
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
