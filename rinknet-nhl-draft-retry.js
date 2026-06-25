#!/usr/bin/env node
/**
 * RinkNet — NHL Draft Rankings RETRY
 * Retries the 21 not-found + 2 skipped players from rinknet-nhl-draft.js
 * List ID: 1893103383
 * Birth years: 2006, 2007, 2008
 * Stars: ranks 1-5=4.75, 6-25=4.50, 26-80=4.25, 81-190=4.00, 191-250=3.75
 *
 * RUN:  node rinknet-nhl-draft-retry.js
 */

'use strict';

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

const USERNAME        = 'bcollins@neutralzone.net';
const PASSWORD        = 'NZhockey24!';
const LIST_ID         = '1893103383';
const DELAY_MS        = 1000;
const SCREENSHOTS_DIR = './rinknet-screenshots-retry';

function starsForRank(rank) {
  if (rank <=   5) return 4.75;
  if (rank <=  25) return 4.50;
  if (rank <=  80) return 4.25;
  if (rank <= 190) return 4.00;
  return 3.75;
}

// 21 not-found + 2 skipped from rinknet-nhl-draft.js
const PLAYERS = [
  { rank: 54,  last:'Fyodorov',         first:'Viktor'      },
  { rank: 55,  last:'Di Iorio',         first:'Alessandro'  },  // was SKIPPED (confirm btn)
  { rank: 57,  last:'Pugachyov',        first:'Gleb'        },
  { rank: 58,  last:'Trejbal',          first:'Tobias'      },
  { rank: 60,  last:'Bartholdsson',     first:'Nils'        },
  { rank: 61,  last:'Brongel-Larsson',  first:'Axel'        },
  { rank: 63,  last:'Arkko',            first:'Luka'        },
  { rank: 67,  last:'Rogowski',         first:'Brooks'      },
  { rank: 69,  last:'Wassilyn',         first:'Braidy'      },
  { rank: 78,  last:'Eriksson',         first:'Samuel'      },
  { rank: 79,  last:'Andersson',        first:'Adam'        },  // was SKIPPED (may already in list)
  { rank: 90,  last:'Kulebyakin',       first:'Oleg'        },
  { rank: 91,  last:'Reidzans',         first:'Daniels'     },
  { rank: 92,  last:'Bernat',           first:'Lucian'      },
  { rank: 93,  last:'Sapozhnikov',      first:'Alexander'   },
  { rank: 138, last:'Erickson',         first:'Joe'         },
  { rank: 154, last:'Taamu',            first:'Alofa Tunao' },
  { rank: 161, last:"O'Donnell",        first:'Aiden'       },
  { rank: 203, last:'Seidl',            first:'Jakub'       },
  { rank: 204, last:'Burick',           first:'Sean'        },
  { rank: 205, last:'Olson',            first:'Brett'       },
  { rank: 211, last:'Voyaga',           first:'Nikita'      },
  { rank: 232, last:'Zajic',            first:'Lucas'       },
].map(p => ({ ...p, stars: starsForRank(p.rank) }));

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

// Known Cyrillic/European transliteration alternates
const ALT_LAST = {
  'Fyodorov':     ['Fedorov', 'Fjodorov', 'Fyedorov'],
  'Pugachyov':    ['Pugachev', 'Pugachov', 'Pugachiov'],
  'Bartholdsson': ['Bartoldsson', 'Bartholdson', 'Bartoldson'],
  'Kulebyakin':   ['Kulyobakin', 'Kulebykin', 'Kulebjakin'],
  'Sapozhnikov':  ['Sapozhnikoff', 'Sapoznikov', 'Sapozhnikov'],
  'Wassilyn':     ['Wasilyn', 'Vasilin', 'Wassiline', 'Vasilyn'],
  'Reidzans':     ['Reizans', 'Reidzans', 'Reidzāns'],
  'Voyaga':       ['Vohaga', 'Vojaga', 'Voiaga', 'Voiaga'],
  'Eriksson':     ['Erikson', 'Ericsson', 'Ericson'],
  'Erickson':     ['Erikson', 'Eriksson', 'Ericson', 'Ericksen'],
  'Trejbal':      ['Trejpal', 'Treibal', 'Trejbál'],
  'Bernat':       ['Bernát', 'Bernath'],
  'Seidl':        ['Seidel', 'Seidl'],
  'Zajic':        ['Zajíc', 'Zajic', 'Zaijc'],
};

// Known alternate first names
const ALT_FIRST = {
  'Joe':    ['Joseph', 'Joey', 'Jo'],
  'Braidy': ['Brady', 'Brody', 'Braeden'],
  'Luka':   ['Lukas', 'Luke', 'Luca'],
  'Aiden':  ['Aidan', 'Aden'],
  'Sean':   ['Shawn', 'Shaun'],
};

function buildSearchTerms(player) {
  const firstWords = player.first.split(/[\s-]/);
  const last       = player.last;
  const lastSegs   = last.split(/[-\s]/);
  const terms      = new Set();

  const add = (f, l) => {
    const fS = stripAccents(String(f));
    const lS = stripAccents(String(l));
    terms.add(`${fS} ${lS}`);
    terms.add(`${fS} ${l}`);
  };

  // Every prefix (3-char) of every first-name word × every last-name segment + full last
  for (const fw of firstWords) {
    const pfx = stripAccents(fw.substring(0, 3));
    add(pfx, last);
    for (const seg of lastSegs) add(pfx, seg);
    // Full first-name word too
    add(fw, last);
    for (const seg of lastSegs) add(fw, seg);
  }

  // Alternate last-name spellings
  for (const [key, alts] of Object.entries(ALT_LAST)) {
    if (lastSegs.includes(key)) {
      for (const alt of alts) {
        for (const fw of firstWords) {
          add(stripAccents(fw.substring(0, 3)), alt);
          add(fw, alt);
        }
      }
    }
  }

  // Alternate first-name spellings
  for (const [key, alts] of Object.entries(ALT_FIRST)) {
    if (firstWords[0] === key) {
      for (const alt of alts) {
        add(alt.substring(0, 3), last);
        add(alt, last);
        for (const seg of lastSegs) {
          add(alt.substring(0, 3), seg);
          add(alt, seg);
        }
      }
    }
  }

  // Last-name-only — for very distinctive surnames (7+ chars unique enough)
  for (const seg of lastSegs) {
    if (stripAccents(seg).length >= 7) {
      terms.add(stripAccents(seg));
    }
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
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  NHL Draft Rankings — RETRY (23 players)         ║');
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
      await page.keyboard.press('Escape').catch(() => {});
      await sleep(400);

      if (!page.url().includes(`/home/lists/view/${LIST_ID}`)) {
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2500);
      }

      // Baseline row count before opening modal
      const baselineRows = await page.locator('table tbody tr').count().catch(() => 0);

      // ── Click ADD PLAYER trigger ──────────────────────────────────────────
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

      // ── Search with extended term list ────────────────────────────────────
      const terms = buildSearchTerms(player);
      let rowFound = false;
      let hasBirthYear = false;

      for (const term of terms) {
        console.log(`  → Searching: "${term}"`);
        await searchInput.click({ clickCount: 3 });
        await searchInput.fill('');
        await sleep(300);
        await searchInput.fill(term);
        await sleep(3000);  // slightly longer than original to give results time to load

        const rows2008 = await page.locator('table tbody tr:has-text("/2008")').count().catch(() => 0);
        const rows2007 = await page.locator('table tbody tr:has-text("/2007")').count().catch(() => 0);
        const rows2006 = await page.locator('table tbody tr:has-text("/2006")').count().catch(() => 0);
        const totalRows = await page.locator('table tbody tr').count().catch(() => 0);

        if (rows2008 + rows2007 + rows2006 > 0) {
          hasBirthYear = true;
          rowFound = true;
          console.log(`  ✓ Found rows (${rows2008 + rows2007 + rows2006} with 2006-2008 birth year)`);
          break;
        } else if (totalRows > baselineRows) {
          rowFound = true;
          console.log(`  ✓ Found rows (${totalRows - baselineRows} new rows, no year visible)`);
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

      // ── Select best matching row (prefer correct birth year + name) ───────
      const nameA = player.last.split(/[-\s]/)[0];
      const nameS = stripAccents(nameA);
      const rowSelectors = hasBirthYear ? [
        `tr:has-text("${nameA}"):has-text("/2008")`,
        `tr:has-text("${nameS}"):has-text("/2008")`,
        `tr:has-text("${nameA}"):has-text("/2007")`,
        `tr:has-text("${nameS}"):has-text("/2007")`,
        `tr:has-text("${nameA}"):has-text("/2006")`,
        `tr:has-text("${nameS}"):has-text("/2006")`,
        `tr:has-text("${nameA}")`,
        `tr:has-text("${nameS}")`,
        `tr:has-text("/2008")`,
        `tr:has-text("/2007")`,
        `tr:has-text("/2006")`,
      ] : [
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
        console.log(`  ✗ SKIP — confirm button not found/enabled (player may already be in list)`);
        await saveScreenshot(page, `skip-confirm-${player.rank}`);
        results.skip.push(player.rank);
        await page.keyboard.press('Escape');
        await sleep(500);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2000);
        continue;
      }

      // Dismiss any popup right after confirm click
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
  if (results.ok.length)      console.log(`  Added ranks:     ${results.ok.join(', ')}`);
  if (results.skip.length)    console.log(`  Skip ranks:      ${results.skip.join(', ')}`);
  if (results.notFound.length) console.log(`  Not-found ranks: ${results.notFound.join(', ')}`);
  console.log('══════════════════════════════════════════════\n');

  await browser.close();
}

main().catch(err => { console.error(err); process.exit(1); });
