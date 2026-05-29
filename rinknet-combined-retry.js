#!/usr/bin/env node
/**
 * RinkNet — QMJHL Combined Rankings — RETRY (43 not-found players)
 * List ID: -1716928099
 *
 * RUN:  node rinknet-combined-retry.js
 */

'use strict';

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

const USERNAME        = 'bcollins@neutralzone.net';
const PASSWORD        = 'NZhockey24!';
const LIST_ID         = '-1716928099';
const DELAY_MS        = 800;
const SCREENSHOTS_DIR = './rinknet-screenshots';

const PLAYERS = [
  { rank:2,   last:'McKinnon',           first:'Jacob',             stars:4.50 },
  { rank:11,  last:'Lee',                first:'Samuel',            stars:4.25 },
  { rank:30,  last:'Faucher',            first:'Eliot',             stars:4.00 },
  { rank:53,  last:'Martin',             first:'Brendan',           stars:3.75 },
  { rank:63,  last:'LeClair',            first:'Logan',             stars:3.75 },
  { rank:65,  last:'Beaudoin',           first:'Maxime-Alexandre',  stars:3.75 },
  { rank:90,  last:'Walsh',              first:'Colin',             stars:3.75 },
  { rank:117, last:"O'Shaughnessy",      first:'Colby',             stars:3.75 },
  { rank:123, last:'Petropoulos',        first:'TJ',                stars:3.75 },
  { rank:148, last:'Jardine',            first:'Brycen',            stars:3.50 },
  { rank:150, last:'Anderson',           first:'Brodie',            stars:3.50 },
  { rank:152, last:'Rowley',             first:'Grady',             stars:3.50 },
  { rank:155, last:'Chale',              first:'Nathan',            stars:3.50 },
  { rank:177, last:'Fenstad',            first:'Kellan',            stars:3.50 },
  { rank:188, last:'Laforce',            first:'Derek',             stars:3.50 },
  { rank:198, last:'Duplantie',          first:'Dominic',           stars:3.50 },
  { rank:199, last:'Bibeau',             first:'Zachary',           stars:3.50 },
  { rank:202, last:"O'Neil",             first:'Sawyer',            stars:3.50 },
  { rank:206, last:'Wilson',             first:'Matt',              stars:3.50 },
  { rank:208, last:'Oliveri',            first:'AJ',                stars:3.50 },
  { rank:209, last:'Woodley',            first:'Brayden',           stars:3.50 },
  { rank:212, last:'Hannah',             first:'Owen',              stars:3.50 },
  { rank:214, last:'Archange-Bourassa',  first:'Nathan',            stars:3.50 },
  { rank:217, last:'Boivin',             first:'Lucas',             stars:3.50 },
  { rank:218, last:'Baldwin',            first:'Jack',              stars:3.50 },
  { rank:219, last:'Egan',               first:'Tommy',             stars:3.50 },
  { rank:228, last:'Duplessis',          first:'Miguel',            stars:3.50 },
  { rank:229, last:'Dickie',             first:'Brayden',           stars:3.50 },
  { rank:232, last:'Morasse',            first:'Zach-Olivier',      stars:3.50 },
  { rank:236, last:'Beaudry',            first:'Ben',               stars:3.50 },
  { rank:266, last:'Hubert',             first:'Renaud',            stars:3.25 },
  { rank:275, last:'Vorobiev',           first:'Maxime',            stars:3.25 },
  { rank:279, last:'Desjardins',         first:'Charles',           stars:3.25 },
  { rank:280, last:'Vachon',             first:'Joseph',            stars:3.25 },
  { rank:304, last:'Simas',              first:'Colton',            stars:3.25 },
  { rank:320, last:'Garneau',            first:'William',           stars:3.25 },
  { rank:323, last:'Bottomley',          first:'MJ',                stars:3.25 },
  { rank:342, last:'Hanson-Leveillé',    first:'Dylan',             stars:3.25 },
  { rank:366, last:'Grace',              first:'RJ',                stars:3.25 },
  { rank:381, last:'Méthot',             first:'Oliver',            stars:3.25 },
  { rank:387, last:'Miansi',             first:'Kaylan',            stars:3.25 },
  { rank:390, last:'Larsen',             first:'Kieran',            stars:3.25 },
  { rank:391, last:'Vallée',             first:'Xavier',            stars:3.25 },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function saveScreenshot(page, name) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const file = path.join(SCREENSHOTS_DIR, `${Date.now()}-${name}.png`);
  return page.screenshot({ path: file, fullPage: false }).catch(() => {});
}

const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');
function stripAccents(str) {
  return str.normalize('NFD').replace(COMBINING_MARKS, '');
}

// 3-char prefix. Also tries:
//   - full first name (helps with common surnames like Lee, Walsh)
//   - second segment of hyphenated first names (Maxime-Alexandre → "Ale Beaudoin")
function buildSearchTerms(player) {
  const raw    = player.first.substring(0, 3);
  const prefix = stripAccents(raw);
  const last   = player.last;
  const terms  = new Set();

  terms.add(`${prefix} ${stripAccents(last)}`);
  terms.add(`${prefix} ${last}`);
  terms.add(`${prefix} ${stripAccents(last.replace(/[''\.]/g, ''))}`);

  const segs = last.split(/[-\s]/);
  terms.add(`${prefix} ${stripAccents(segs[0])}`);
  terms.add(`${prefix} ${stripAccents(segs[segs.length - 1])}`);
  if (segs.length >= 3) terms.add(`${prefix} ${stripAccents(segs[1])}`);

  // Full first name — more specific for common surnames
  const full = stripAccents(player.first);
  terms.add(`${full} ${stripAccents(last)}`);
  terms.add(`${full} ${last}`);

  // For hyphenated first names, try the second part as prefix
  const firstParts = player.first.split('-');
  if (firstParts.length > 1) {
    const prefix2 = stripAccents(firstParts[firstParts.length - 1].substring(0, 3));
    terms.add(`${prefix2} ${stripAccents(last)}`);
    terms.add(`${prefix2} ${last}`);
  }

  return [...terms];
}

async function dismissErrorPopup(page) {
  try {
    if (!await page.locator('text=Something has gone wrong').isVisible({ timeout: 300 }).catch(() => false)) return false;
    for (const sel of ['button:has-text("Close")', 'button:has-text("OK")', '[aria-label="Close"]', 'mat-dialog-actions button']) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 300 }).catch(() => false)) { await btn.click(); return true; }
    }
    await page.keyboard.press('Escape');
    return true;
  } catch (_) { return false; }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔═════════════════════════════════════════════════════╗');
  console.log('║  QMJHL Combined Rankings — RETRY (43 players)      ║');
  console.log('╚═════════════════════════════════════════════════════╝\n');

  let loginCompleted = false;
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
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
  console.log(`✓ Navigated to list ${LIST_ID}\n`);

  const results = { ok: [], skip: [], notFound: [] };

  for (const player of PLAYERS) {
    console.log(`\n[${player.rank}] ${player.first} ${player.last} (${player.stars}★)`);

    try {
      await dismissErrorPopup(page);

      // Close any modal left open from previous player
      await page.keyboard.press('Escape').catch(() => {});
      await sleep(400);

      // Ensure we're on the list view
      if (!page.url().includes(`/home/lists/view/${LIST_ID}`)) {
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2500);
      }

      // Capture baseline row count BEFORE opening modal.
      // Used as fallback to detect search results when birth year isn't visible.
      const baselineRows = await page.locator('table tbody tr').count().catch(() => 0);

      // ── Click + ADD PLAYER trigger ────────────────────────────────────────
      let triggerClicked = false;
      for (const sel of [
        'button:has-text("Add Player")', 'a:has-text("Add Player")',
        'button:has-text("ADD PLAYER")', 'a:has-text("ADD PLAYER")',
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
        console.log(`  ✗ SKIP — ADD PLAYER trigger not found`);
        await saveScreenshot(page, `skip-trigger-${player.rank}`);
        results.skip.push(player.rank);
        continue;
      }

      // ── Wait for modal ────────────────────────────────────────────────────
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

      // ── Find modal search input (lowest on page = inside modal) ──────────
      let searchInput = null;
      const allInputs = await page.locator('input').all();
      let maxY = -1;
      for (const el of allInputs) {
        const box = await el.boundingBox().catch(() => null);
        if (box && box.y > maxY) { maxY = box.y; searchInput = el; }
      }

      if (!searchInput) {
        console.log(`  ✗ SKIP — search input not found`);
        results.skip.push(player.rank);
        await page.keyboard.press('Escape');
        await sleep(500);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2000);
        continue;
      }

      // ── Search — primary: birth-year rows; fallback: any new rows vs baseline
      const terms = buildSearchTerms(player);
      let rowFound = false;
      let hasBirthYear = false;

      for (const term of terms) {
        console.log(`  → Searching: "${term}"`);
        await searchInput.click({ clickCount: 3 });
        await searchInput.fill('');
        await sleep(300);
        await searchInput.fill(term);
        await sleep(2500);

        const rows2010 = await page.locator('table tbody tr:has-text("/2010")').count().catch(() => 0);
        const rows2009 = await page.locator('table tbody tr:has-text("/2009")').count().catch(() => 0);
        const totalRows = await page.locator('table tbody tr').count().catch(() => 0);

        if (rows2010 + rows2009 > 0) {
          hasBirthYear = true;
          rowFound = true;
          console.log(`  ✓ Found rows (${rows2010 + rows2009} with 2009/2010 birth year)`);
          break;
        } else if (totalRows > baselineRows) {
          rowFound = true;
          console.log(`  ✓ Found rows (${totalRows - baselineRows} new rows, no year visible — will select by name)`);
          break;
        }
      }

      if (!rowFound) {
        console.log(`  ✗ NOT FOUND`);
        await saveScreenshot(page, `notfound-${player.rank}`);
        results.notFound.push(player.rank);
        await page.keyboard.press('Escape');
        await sleep(500);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2000);
        continue;
      }

      // ── Select best matching row ──────────────────────────────────────────
      const nameA = player.last.split(/[-\s]/)[0];
      const nameS = stripAccents(nameA);
      const rowSelectors = hasBirthYear ? [
        `tr:has-text("${nameA}"):has-text("/2010")`,
        `tr:has-text("${nameS}"):has-text("/2010")`,
        `tr:has-text("${nameA}"):has-text("/2009")`,
        `tr:has-text("${nameS}"):has-text("/2009")`,
        `tr:has-text("${nameA}")`,
        `tr:has-text("${nameS}")`,
        `tr:has-text("/2010")`,
        `tr:has-text("/2009")`,
      ] : [
        // No birth year visible — select by name only
        `tr:has-text("${nameA}")`,
        `tr:has-text("${nameS}")`,
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
        await page.locator('table tbody tr').first().click().catch(() => {});
      }

      await sleep(500);

      // ── Click ADD PLAYER confirm button (last → first, skip disabled) ─────
      const allAddBtns = page.locator('button:has-text("Add Player"), button:has-text("ADD PLAYER")');
      const total = await allAddBtns.count();
      let confirmClicked = false;
      for (let bi = total - 1; bi >= 0; bi--) {
        const vis      = await allAddBtns.nth(bi).isVisible({ timeout: 300 }).catch(() => false);
        if (!vis) continue;
        const disabled = await allAddBtns.nth(bi).isDisabled().catch(() => false);
        if (disabled) continue;
        try {
          await allAddBtns.nth(bi).click({ timeout: 5000 });
          confirmClicked = true;
          break;
        } catch (_) {}
      }

      if (!confirmClicked) {
        console.log(`  ✗ SKIP — confirm button not found/enabled`);
        await saveScreenshot(page, `skip-confirm-${player.rank}`);
        results.skip.push(player.rank);
        await page.keyboard.press('Escape');
        await sleep(500);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2000);
        continue;
      }

      // Dismiss any popup that fires right after confirm click
      await sleep(600);
      await dismissErrorPopup(page);

      // ── Wait for addPlayer navigation ─────────────────────────────────────
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

      // ── Fill Ranking ──────────────────────────────────────────────────────
      for (const sel of ['input[name="ranking"]','input[name="rank"]','input[type="number"]','input[type="text"]']) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
          await el.click({ clickCount: 3 });
          await el.fill(String(player.rank));
          break;
        }
      }

      // ── Set Star Rating ───────────────────────────────────────────────────
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

      // ── Save ──────────────────────────────────────────────────────────────
      for (const sel of ['button:has-text("SAVE")','button:has-text("Save")','button[type="submit"]']) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 1000 }).catch(() => false)) { await el.click(); break; }
      }

      // Dismiss any popup after save, then wait to return to list
      await sleep(800);
      await dismissErrorPopup(page);

      try {
        await page.waitForFunction(() => !window.location.href.includes('addPlayer'), { timeout: 12000 });
      } catch (_) {
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
      }

      await sleep(DELAY_MS);
      console.log(`  ✓ Added rank ${player.rank} at ${player.stars}★`);
      results.ok.push(player.rank);

    } catch (err) {
      console.error(`  ✗ ERROR: ${err.message}`);
      await saveScreenshot(page, `error-${player.rank}`);
      results.skip.push(player.rank);
      await page.keyboard.press('Escape').catch(() => {});
      await page.goto(listUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await sleep(2500);
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
