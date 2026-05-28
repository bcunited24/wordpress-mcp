#!/usr/bin/env node
/**
 * RinkNet — QMJHL Final Rankings: Top 125 Americans
 * List ID: -213287997
 * All players are 2009 or 2010 birth year.
 *
 * RUN:  node rinknet-americans.js
 */

'use strict';

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

const USERNAME        = 'bcollins@neutralzone.net';
const PASSWORD        = 'NZhockey24!';
const LIST_ID         = '-213287997';
const DELAY_MS        = 800;
const SCREENSHOTS_DIR = './rinknet-screenshots';

const PLAYERS = [
  { rank:1,   last:'Queally',          first:'John',       stars:4.25 },
  { rank:2,   last:'Wilichoski',       first:'Blake',      stars:4.25 },
  { rank:3,   last:'Lee',              first:'Samuel',     stars:4.25 },
  { rank:4,   last:'Cotter',           first:'Logan',      stars:4.25 },
  { rank:5,   last:'Sawyer',           first:'CJ',         stars:4.25 },
  { rank:6,   last:'Dekleine',         first:'Robert',     stars:4.00 },
  { rank:7,   last:'Felt',             first:'Carter',     stars:4.00 },
  { rank:8,   last:'Stonacek',         first:'Mason',      stars:4.00 },
  { rank:9,   last:'Ware',             first:'Nick',       stars:4.00 },
  { rank:10,  last:'Gingeleskie',      first:'Ethan',      stars:3.75 },
  { rank:11,  last:'Porter',           first:'Ryan',       stars:3.75 },
  { rank:12,  last:'Martin',           first:'Brendan',    stars:3.75 },
  { rank:13,  last:'Needham',          first:'Jameson',    stars:3.75 },
  { rank:14,  last:'Fishbone',         first:'Samuel',     stars:3.75 },
  { rank:15,  last:'St. Laurent',      first:'Joey',       stars:3.75 },
  { rank:16,  last:'Lundin',           first:'Owen',       stars:3.75 },
  { rank:17,  last:'Guo',              first:'Alexander',  stars:3.75 },
  { rank:18,  last:'Calla',            first:'Jamie',      stars:3.75 },
  { rank:19,  last:'Barrett',          first:'Michael',    stars:3.75 },
  { rank:20,  last:'Walsh',            first:'Colin',      stars:3.75 },
  { rank:21,  last:'Walsh',            first:'Kasen',      stars:3.75 },
  { rank:22,  last:'Torres',           first:'Will',       stars:3.75 },
  { rank:23,  last:'Sproule',          first:'William',    stars:3.75 },
  { rank:24,  last:'Donatelli',        first:'Jake',       stars:3.75 },
  { rank:25,  last:'Wohlers',          first:'Mason',      stars:3.75 },
  { rank:26,  last:'Poti',             first:'Tyler',      stars:3.75 },
  { rank:27,  last:'Short',            first:'Drew',       stars:3.75 },
  { rank:28,  last:'Kelly',            first:'Colten',     stars:3.75 },
  { rank:29,  last:'Bernardinelli',    first:'Jesse',      stars:3.75 },
  { rank:30,  last:'Pavlik',           first:'Kuba',       stars:3.75 },
  { rank:31,  last:'Petropoulos',      first:'TJ',         stars:3.75 },
  { rank:32,  last:'Wu',               first:'Austin',     stars:3.75 },
  { rank:33,  last:'Noonan',           first:'Cade',       stars:3.50 },
  { rank:34,  last:'White',            first:'Brayden',    stars:3.50 },
  { rank:35,  last:'Cleaves',          first:'Colton',     stars:3.50 },
  { rank:36,  last:'Herrera',          first:'Julian',     stars:3.50 },
  { rank:37,  last:'Martineau',        first:'Andrew',     stars:3.50 },
  { rank:38,  last:'Frick',            first:'Owen',       stars:3.50 },
  { rank:39,  last:'Daigle',           first:'Cameron',    stars:3.50 },
  { rank:40,  last:'Anderson',         first:'Brodie',     stars:3.50 },
  { rank:41,  last:'Wood',             first:'Dawson',     stars:3.50 },
  { rank:42,  last:'Rowley',           first:'Grady',      stars:3.50 },
  { rank:43,  last:'Warsofsky',        first:'Chase',      stars:3.50 },
  { rank:44,  last:'Wang',             first:'Alex',       stars:3.50 },
  { rank:45,  last:"O'Leary",          first:'Colin',      stars:3.50 },
  { rank:46,  last:'Machado',          first:'Ethan',      stars:3.50 },
  { rank:47,  last:'Carlin',           first:'Liam',       stars:3.50 },
  { rank:48,  last:'Fenstad',          first:'Kellan',     stars:3.50 },
  { rank:49,  last:'Hekle',            first:'Brayden',    stars:3.50 },
  { rank:50,  last:'Abbott',           first:'Preston',    stars:3.50 },
  { rank:51,  last:'Ward',             first:'Blake',      stars:3.50 },
  { rank:52,  last:'Erickson',         first:'Brayden',    stars:3.50 },
  { rank:53,  last:'Barrett',          first:'Nathan',     stars:3.50 },
  { rank:54,  last:'Rumsey',           first:'Ben',        stars:3.50 },
  { rank:55,  last:'Scranton',         first:'Kai',        stars:3.50 },
  { rank:56,  last:'Roe',              first:'Landon',     stars:3.50 },
  { rank:57,  last:'Kimura',           first:'Senji',      stars:3.50 },
  { rank:58,  last:"O'Neil",           first:'Sawyer',     stars:3.50 },
  { rank:59,  last:'Alden',            first:'Eben',       stars:3.50 },
  { rank:60,  last:'Hung',             first:'Ethan',      stars:3.50 },
  { rank:61,  last:'Oliveri',          first:'AJ',         stars:3.50 },
  { rank:62,  last:'Hannah',           first:'Owen',       stars:3.50 },
  { rank:63,  last:'Fils-Aime',        first:'Silas',      stars:3.50 },
  { rank:64,  last:'Luedke',           first:'Jackson',    stars:3.50 },
  { rank:65,  last:'Egan',             first:'Tommy',      stars:3.50 },
  { rank:66,  last:'Marzi',            first:'Jorden',     stars:3.50 },
  { rank:67,  last:'Fleming',          first:'Jaxson',     stars:3.50 },
  { rank:68,  last:'Guerriero',        first:'Jake',       stars:3.50 },
  { rank:69,  last:'Beaudry',          first:'Ben',        stars:3.50 },
  { rank:70,  last:'Allred',           first:'Andrew',     stars:3.50 },
  { rank:71,  last:'Shook',            first:'Michael',    stars:3.50 },
  { rank:72,  last:'Tulipano',         first:'Nick',       stars:3.50 },
  { rank:73,  last:'Stickney',         first:'Grady',      stars:3.50 },
  { rank:74,  last:'Brown',            first:'Quinn',      stars:3.50 },
  { rank:75,  last:'Groeling',         first:'Philip',     stars:3.50 },
  { rank:76,  last:'Gwaltney',         first:'Will',       stars:3.50 },
  { rank:77,  last:'Furness',          first:'Graham',     stars:3.25 },
  { rank:78,  last:'Hamlin',           first:'James',      stars:3.25 },
  { rank:79,  last:'Olympia',          first:'Keith',      stars:3.25 },
  { rank:80,  last:'Mohamed',          first:'Zachary',    stars:3.25 },
  { rank:81,  last:'Coccaro',          first:'Matthew',    stars:3.25 },
  { rank:82,  last:'Funk',             first:'Jack',       stars:3.25 },
  { rank:83,  last:'Wright',           first:'Connor',     stars:3.25 },
  { rank:84,  last:'Proulx',           first:'Mason',      stars:3.25 },
  { rank:85,  last:'Dunlap',           first:'Colin',      stars:3.25 },
  { rank:86,  last:'Patch',            first:'Danny',      stars:3.25 },
  { rank:87,  last:'Simas',            first:'Colton',     stars:3.25 },
  { rank:88,  last:'Jackson',          first:'James',      stars:3.25 },
  { rank:89,  last:'Mink',             first:'Gunnar',     stars:3.25 },
  { rank:90,  last:'Simon',            first:'Cam',        stars:3.25 },
  { rank:91,  last:'Holmes',           first:'Ryan',       stars:3.25 },
  { rank:92,  last:'Zinger',           first:'Whitaker',   stars:3.25 },
  { rank:93,  last:'Heise',            first:'Carter',     stars:3.25 },
  { rank:94,  last:'Peel',             first:'Greyson',    stars:3.25 },
  { rank:95,  last:'Smith',            first:'Logan',      stars:3.25 },
  { rank:96,  last:'Cook',             first:'Nathan',     stars:3.25 },
  { rank:97,  last:'Quinn',            first:'Connor',     stars:3.25 },
  { rank:98,  last:'Burns',            first:'Jackson',    stars:3.25 },
  { rank:99,  last:'Gaudette',         first:'Luke',       stars:3.25 },
  { rank:100, last:'Gallucci',         first:'Drew',       stars:3.25 },
  { rank:101, last:'Santella',         first:'Nico',       stars:3.25 },
  { rank:102, last:'McCullough',       first:'Leo',        stars:3.25 },
  { rank:103, last:'Cokinos',          first:'Devin',      stars:3.25 },
  { rank:104, last:'Mazzola',          first:'Noah',       stars:3.25 },
  { rank:105, last:'Moore',            first:'Tommy',      stars:3.25 },
  { rank:106, last:'Tzouganatos',      first:'Nikolaos',   stars:3.25 },
  { rank:107, last:'Grace',            first:'RJ',         stars:3.25 },
  { rank:108, last:'Dickson',          first:'Luke',       stars:3.25 },
  { rank:109, last:'Bisson',           first:'Ryder',      stars:3.25 },
  { rank:110, last:'Methot',           first:'Oliver',     stars:3.25 },
  { rank:111, last:'Tasca',            first:'Dylan',      stars:3.25 },
  { rank:112, last:'Farrell',          first:'Shaun',      stars:3.25 },
  { rank:113, last:'Unal',             first:'Deniz',      stars:3.25 },
  { rank:114, last:'Rostowsky',        first:'Trevor',     stars:3.25 },
  { rank:115, last:'Pandolfo-Jahn',    first:'Robert',     stars:3.25 },
  { rank:116, last:'Wible',            first:'Archer',     stars:3.25 },
  { rank:117, last:'Vincent',          first:'Will',       stars:3.25 },
  { rank:118, last:'Ha',               first:'Jay',        stars:3.25 },
  { rank:119, last:'Wilson',           first:'Roan',       stars:3.25 },
  { rank:120, last:'Johnson',          first:'James',      stars:3.25 },
  { rank:121, last:'Delmastro',        first:'Kingston',   stars:3.25 },
  { rank:122, last:'Horsman',          first:'Lochlan',    stars:3.25 },
  { rank:123, last:'Manley',           first:'Jack',       stars:3.25 },
  { rank:124, last:'Dickie',           first:'Brayden',    stars:3.25 },
  { rank:125, last:'St. Vrain',        first:'Hunter',     stars:3.25 },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function saveScreenshot(page, name) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const file = path.join(SCREENSHOTS_DIR, `${Date.now()}-${name}.png`);
  return page.screenshot({ path: file, fullPage: false }).catch(() => {});
}

const COMBINING_MARKS = new RegExp('[̀-ͯ]', 'g');
function stripAccents(str) {
  return str.normalize('NFD').replace(COMBINING_MARKS, '');
}

function buildSearchTerms(player) {
  const prefix = stripAccents(player.first.substring(0, 2));
  const last   = player.last;
  const terms  = new Set();

  terms.add(`${prefix} ${stripAccents(last)}`);
  terms.add(`${prefix} ${last}`);
  terms.add(`${prefix} ${stripAccents(last.replace(/[''\.]/g, ''))}`);

  const segs = last.split(/[-\s]/);
  terms.add(`${prefix} ${stripAccents(segs[0])}`);
  terms.add(`${prefix} ${stripAccents(segs[segs.length - 1])}`);
  if (segs.length >= 3) terms.add(`${prefix} ${stripAccents(segs[1])}`);

  terms.add(stripAccents(last));
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
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  QMJHL Final Rankings: Top 125 Americans         ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

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

      // Close any modal left open from a previous failure
      await page.keyboard.press('Escape').catch(() => {});
      await sleep(400);

      // Ensure we're on the list view
      if (!page.url().includes(`/home/lists/view/${LIST_ID}`)) {
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2500);
      }

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

      // ── Search — try each term until rows appear ──────────────────────────
      const terms = buildSearchTerms(player);
      let rowFound = false;

      for (const term of terms) {
        console.log(`  → Searching: "${term}"`);
        await searchInput.click({ clickCount: 3 });
        await searchInput.fill('');
        await sleep(300);
        await searchInput.fill(term);
        await sleep(2500);

        const hasRows = await page.locator('table tbody tr').count().catch(() => 0);
        if (hasRows > 0) {
          rowFound = true;
          console.log(`  ✓ Found rows`);
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

      // ── Select best matching row (2009 or 2010 birth year only) ──────────
      const nameA = player.last.split(/[-\s]/)[0];
      const nameS = stripAccents(nameA);
      const rowSelectors = [
        `tr:has-text("${nameA}"):has-text("/2010")`,
        `tr:has-text("${nameS}"):has-text("/2010")`,
        `tr:has-text("${nameA}"):has-text("/2009")`,
        `tr:has-text("${nameS}"):has-text("/2009")`,
        `tr:has-text("${nameA}")`,
        `tr:has-text("${nameS}")`,
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

      // ── Dismiss any popup after save then wait to return to list ──────────
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
