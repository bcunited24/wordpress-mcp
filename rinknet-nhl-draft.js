#!/usr/bin/env node
/**
 * RinkNet — NHL Draft Rankings
 * List ID: 1893103383
 * Birth years: 2006, 2007, 2008
 * Stars: ranks 1-5 = 4.75, 6-25 = 4.50, 26-80 = 4.25, 81-190 = 4.00, 191-250 = 3.75
 *
 * RUN:  node rinknet-nhl-draft.js
 */

'use strict';

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

const USERNAME        = 'bcollins@neutralzone.net';
const PASSWORD        = 'NZhockey24!';
const LIST_ID         = '1893103383';
const DELAY_MS        = 800;
const SCREENSHOTS_DIR = './rinknet-screenshots';

function starsForRank(rank) {
  if (rank <=   5) return 4.75;
  if (rank <=  25) return 4.50;
  if (rank <=  80) return 4.25;
  if (rank <= 190) return 4.00;
  return 3.75;
}

const PLAYERS = [
  { rank:1,   last:'McKenna',           first:'Gavin'          },
  { rank:2,   last:'Verhoeff',          first:'Keaton'         },
  { rank:3,   last:'Stenberg',          first:'Ivar'           },
  { rank:4,   last:'Smits',             first:'Alberts'        },
  { rank:5,   last:'Carels',            first:'Carson'         },
  { rank:6,   last:'Reid',              first:'Chase'          },
  { rank:7,   last:'Rudolph',           first:'Daxon'          },
  { rank:8,   last:'Command',           first:'Alexander'      },
  { rank:9,   last:'Malhotra',          first:'Caleb'          },
  { rank:10,  last:'Bjorck',            first:'Viggo'          },
  { rank:11,  last:'Nordmark',          first:'Marcus'         },
  { rank:12,  last:'Suvanto',           first:'Oliver'         },
  { rank:13,  last:'Lin',               first:'Ryan'           },
  { rank:14,  last:'Ruck',              first:'Liam'           },
  { rank:15,  last:'Gustafsson',        first:'Malte'          },
  { rank:16,  last:'Lawrence',          first:'Tynan'          },
  { rank:17,  last:'Ruck',              first:'Markus'         },
  { rank:18,  last:'Belchetz',          first:'Ethan'          },
  { rank:19,  last:'Klepov',            first:'Nikita'         },
  { rank:20,  last:'Hurlbert',          first:'JP'             },
  { rank:21,  last:'Macbeath',          first:'Ben'            },
  { rank:22,  last:'Hemming',           first:'Oscar'          },
  { rank:23,  last:'Shilov',            first:'Egor'           },
  { rank:24,  last:'Cullen',            first:'Wyatt'          },
  { rank:25,  last:'Villeneuve',        first:'Xavier'         },
  { rank:26,  last:'Alalauri',          first:'Samu'           },
  { rank:27,  last:'Novotny',           first:'Adam'           },
  { rank:28,  last:'Roobroeck',         first:'Ryan'           },
  { rank:29,  last:'Shcherbakov',       first:'Nikita V.'      },
  { rank:30,  last:'Hermansson',        first:'Elton'          },
  { rank:31,  last:'Williams',          first:'Cooper'         },
  { rank:32,  last:'Morozov',           first:'Ilya'           },
  { rank:33,  last:'Piiparinen',        first:'Juho'           },
  { rank:34,  last:'Fitzgerald',        first:'Colin'          },
  { rank:35,  last:'Dagenais',          first:'Maddox'         },
  { rank:36,  last:'Nycz',              first:'Landon'         },
  { rank:37,  last:'Cover',             first:'Jaxon'          },
  { rank:38,  last:'Mutryn',            first:'Casey'          },
  { rank:39,  last:'Katolicky',         first:'Simon'          },
  { rank:40,  last:'Valentini',         first:'Adam'           },
  { rank:41,  last:'Aaram-Olsen',       first:'Niklas'         },
  { rank:42,  last:'Plante',            first:'Victor'         },
  { rank:43,  last:'Hakansson',         first:'William'        },
  { rank:44,  last:'Bleyl',             first:'Tommy'          },
  { rank:45,  last:'Knights',           first:'Theodor'        },
  { rank:46,  last:'Schairer',          first:'Luke'           },
  { rank:47,  last:'Mbuyi',             first:'Peirce'         },
  { rank:48,  last:'Szongoth',          first:'Doman'          },
  { rank:49,  last:'Holmertz',          first:'Oscar'          },
  { rank:50,  last:'Hextall',           first:'Jack'           },
  { rank:51,  last:'Nemec',             first:'Adam'           },
  { rank:52,  last:'Chrenko',           first:'Tomas'          },
  { rank:53,  last:'Harrington',        first:'Chase'          },
  { rank:54,  last:'Fyodorov',          first:'Viktor'         },
  { rank:55,  last:'Di Iorio',          first:'Alessandro'     },
  { rank:56,  last:'Stevens',           first:'Carter'         },
  { rank:57,  last:'Pugachyov',         first:'Gleb'           },
  { rank:58,  last:'Trejbal',           first:'Tobias'         },
  { rank:59,  last:'Gashilov',          first:'Lavr'           },
  { rank:60,  last:'Bartholdsson',      first:'Nils'           },
  { rank:61,  last:'Brongel-Larsson',   first:'Axel'           },
  { rank:62,  last:'Goljer',            first:'Adam'           },
  { rank:63,  last:'Arkko',             first:'Luka'           },
  { rank:64,  last:'Zielinski',         first:'Blake'          },
  { rank:65,  last:'Edwards',           first:'Beckham'        },
  { rank:66,  last:'Ignatavicius',      first:'Simas'          },
  { rank:67,  last:'Rogowski',          first:'Brooks'         },
  { rank:68,  last:'Murnieks',          first:'Olivers'        },
  { rank:69,  last:'Wassilyn',          first:'Braidy'         },
  { rank:70,  last:'Svensk',            first:'Vertti'         },
  { rank:71,  last:'Cali',              first:'Ryder'          },
  { rank:72,  last:'Vandenberg',        first:'Thomas'         },
  { rank:73,  last:'Morrison',          first:'Charlie'        },
  { rank:74,  last:'Lagerberg Hoen',    first:'Jonas'          },
  { rank:75,  last:'Pakarinen',         first:'Noel'           },
  { rank:76,  last:'Andersson',         first:'Ludvig'         },
  { rank:77,  last:'Matveyev',          first:'Vsevolod'       },
  { rank:78,  last:'Eriksson',          first:'Samuel'         },
  { rank:79,  last:'Andersson',         first:'Adam'           },
  { rank:80,  last:'Shaikhlislamov',    first:'Alan'           },
  { rank:81,  last:'Brabenec',          first:'Jan'            },
  { rank:82,  last:'Denisov',           first:'Pavel'          },
  { rank:83,  last:'Novak',             first:'Filip'          },
  { rank:84,  last:'Chudzinski',        first:'Rian'           },
  { rank:85,  last:'Borichev',          first:'Dmitri'         },
  { rank:86,  last:'Barabanov',         first:'Egor'           },
  { rank:87,  last:'Bryzgalov',         first:'Yaroslav'       },
  { rank:88,  last:'Lansard',           first:'Zachary'        },
  { rank:89,  last:'Tournas',           first:'Niko'           },
  { rank:90,  last:'Kulebyakin',        first:'Oleg'           },
  { rank:91,  last:'Reidzans',          first:'Daniels'        },
  { rank:92,  last:'Bernat',            first:'Lucian'         },
  { rank:93,  last:'Sapozhnikov',       first:'Alexander'      },
  { rank:94,  last:'MacKenzie',         first:'Ethan'          },
  { rank:95,  last:'Murnane',           first:'Brady'          },
  { rank:96,  last:'Laitinen',          first:'Jiko'           },
  { rank:97,  last:'Pantelas',          first:'Giorgos'        },
  { rank:98,  last:'Vanhanen',          first:'Matias'         },
  { rank:99,  last:'Vlasov',            first:'Alexei'         },
  { rank:100, last:'Kemps',             first:'Jonas'          },
  { rank:101, last:'Liske',             first:'Brek'           },
  { rank:102, last:'Hafele',            first:'Landon'         },
  { rank:103, last:'Royston',           first:'Wesley'         },
  { rank:104, last:'Gustafson',         first:'Jake'           },
  { rank:105, last:'Isaksson',          first:'Max'            },
  { rank:106, last:'Rybkin',            first:'Yegor'          },
  { rank:107, last:'Runtso',            first:'Timofei'        },
  { rank:108, last:'Frolo',             first:'Jakub'          },
  { rank:109, last:'Tamm',              first:'Viggo'          },
  { rank:110, last:'Kosick',            first:'Noah'           },
  { rank:111, last:'Lemire',            first:'Kayden'         },
  { rank:112, last:'Croskery',          first:'Callum'         },
  { rank:113, last:'Kuehne',            first:'Lincoln'        },
  { rank:114, last:'Palme',             first:'Ola'            },
  { rank:115, last:'Gallacher',         first:'Layne'          },
  { rank:116, last:'Nilsson',           first:'Douglas'        },
  { rank:117, last:'Fedoseyev',         first:'Yaroslav'       },
  { rank:118, last:'Tukio',             first:'Ossi'           },
  { rank:119, last:'Steiner',           first:'Lars'           },
  { rank:120, last:'Doyle',             first:'Eddy'           },
  { rank:121, last:'Heger',             first:'Kyle'           },
  { rank:122, last:'Lefebvre',          first:'Liam'           },
  { rank:123, last:'Beuker',            first:'Dayne'          },
  { rank:124, last:'Tvrznik',           first:'Tobias'         },
  { rank:125, last:'Knowling',          first:'Brady'          },
  { rank:126, last:'Gudmundsson',       first:'Mans'           },
  { rank:127, last:'Duguay',            first:'Jordan'         },
  { rank:128, last:'Hamilton',          first:'Beckett'        },
  { rank:129, last:'Ivanov',            first:'Alexander'      },
  { rank:130, last:'Dolgopolov',        first:'Ilya'           },
  { rank:131, last:'Lacelle',           first:'William'        },
  { rank:132, last:'Floris',            first:'Jakub'          },
  { rank:133, last:'Ambrosio',          first:'Lucas'          },
  { rank:134, last:'Josbrant',          first:'Mans'           },
  { rank:135, last:'Kurtz',             first:'Jayden'         },
  { rank:136, last:'Morozov',           first:'Alexander'      },
  { rank:137, last:'Amrhein',           first:'Landon'         },
  { rank:138, last:'Erickson',          first:'Joe'            },
  { rank:139, last:'McFadden',          first:'Brian'          },
  { rank:140, last:'Vermirovsky',       first:'David'          },
  { rank:141, last:'Jardine',           first:'Evan'           },
  { rank:142, last:'Laatikainen',       first:'Max'            },
  { rank:143, last:'Klimpke',           first:'Brayden'        },
  { rank:144, last:'Orsulak',           first:'Michal'         },
  { rank:145, last:'Larys',             first:'Jan'            },
  { rank:146, last:'Larsson',           first:'Melwin'         },
  { rank:147, last:'Charvat',           first:'Sebastian'      },
  { rank:148, last:'Karsay',            first:'Samuel'         },
  { rank:149, last:'Amidovski',         first:'Nathan'         },
  { rank:150, last:'Kuhta',             first:'Jasper'         },
  { rank:151, last:'Sivertson',         first:'Jonah'          },
  { rank:152, last:'McLaughlin',        first:'Will'           },
  { rank:153, last:'Taillefer',         first:'Alexandre'      },
  { rank:154, last:'Taamu',             first:'Alofa Tunao'    },
  { rank:155, last:'Carell',            first:'Felix'          },
  { rank:156, last:'Sjostrom',          first:'Oliwer'         },
  { rank:157, last:'Ivchenko',          first:'Dmitri'         },
  { rank:158, last:'Galvas',            first:'Tomas'          },
  { rank:159, last:'Minchak',           first:'Matthew'        },
  { rank:160, last:'Jakubec',           first:'Michal'         },
  { rank:161, last:"O'Donnell",         first:'Aiden'          },
  { rank:162, last:'Tsyplakov',         first:'Gleb'           },
  { rank:163, last:'Boettiger',         first:'Harrison'       },
  { rank:164, last:'Kalimullin',        first:'Adel'           },
  { rank:165, last:'Lechner',           first:'Teddy'          },
  { rank:166, last:'Levac',             first:'Adam'           },
  { rank:167, last:'Gastrin',           first:'Malcom'         },
  { rank:168, last:'Sklenicka',         first:'Marek'          },
  { rank:169, last:'Rousseau',          first:'Thomas'         },
  { rank:170, last:'Karbainov',         first:'Matvei'         },
  { rank:171, last:'Stuart',            first:'Logan'          },
  { rank:172, last:'Ryabykin',          first:'Yelisei'        },
  { rank:173, last:'Francisco',         first:'AJ'             },
  { rank:174, last:'Dingman',           first:'Sawyer'         },
  { rank:175, last:'Joudrey',           first:'Caelan'         },
  { rank:176, last:'Ovcharov',          first:'Nikita'         },
  { rank:177, last:'Tarvainen',         first:'Joel'           },
  { rank:178, last:'Pufr',              first:'Antonin'        },
  { rank:179, last:'Nicolaysen',        first:'Henry'          },
  { rank:180, last:'Shaiikov',          first:'Danai'          },
  { rank:181, last:'Hrenak',            first:'Samuel'         },
  { rank:182, last:'Tuuva',             first:'Leo'            },
  { rank:183, last:'Cermak',            first:'Tomas'          },
  { rank:184, last:'Berchild',          first:'Mikey'          },
  { rank:185, last:'Brosnan',           first:'Myles'          },
  { rank:186, last:'Xu',                first:'Jacob'          },
  { rank:187, last:'Rheaume-Mullen',    first:'Dakoda'         },
  { rank:188, last:'Manchuso',          first:'William'        },
  { rank:189, last:'Ustinkov',          first:'Daniil'         },
  { rank:190, last:'Jovanovski',        first:'Zachary'        },
  { rank:191, last:'Casey',             first:'Carter'         },
  { rank:192, last:'Varosyan',          first:'Rafik'          },
  { rank:193, last:'Hedqvist',          first:'Isac'           },
  { rank:194, last:'Dumont',            first:'Dylan'          },
  { rank:195, last:'Tuminaro',          first:'Cole'           },
  { rank:196, last:'Simonov',           first:'Semyon'         },
  { rank:197, last:'Somervuori',        first:'Jere'           },
  { rank:198, last:'Bykov',             first:'Andrei'         },
  { rank:199, last:'Uronen',            first:'Anttoni'        },
  { rank:200, last:'Trottier',          first:'Parker'         },
  { rank:201, last:'Cossette-Ayotte',   first:'Benjamin'       },
  { rank:202, last:'Tomik',             first:'Tobias'         },
  { rank:203, last:'Seidl',             first:'Jakub'          },
  { rank:204, last:'Burick',            first:'Sean'           },
  { rank:205, last:'Olson',             first:'Brett'          },
  { rank:206, last:'Varga',             first:'Kalder'         },
  { rank:207, last:'Kamas',             first:'Jiri'           },
  { rank:208, last:'Lemieux',           first:'Jean-Christoph' },
  { rank:209, last:'Ladds',             first:'Liam'           },
  { rank:210, last:'Damphousse',        first:'Bo'             },
  { rank:211, last:'Voyaga',            first:'Nikita'         },
  { rank:212, last:'Dillard',           first:'Cameron'        },
  { rank:213, last:'Fortin',            first:'Alexis'         },
  { rank:214, last:'Langlois',          first:'Tristan'        },
  { rank:215, last:'Korneyev',          first:'Korney'         },
  { rank:216, last:'Kotajarvi',         first:'Jesper'         },
  { rank:217, last:'Feeley',            first:'Colin'          },
  { rank:218, last:'Laksonen',          first:'Albin'          },
  { rank:219, last:'Zurawski',          first:'Cole'           },
  { rank:220, last:'Chartrand',         first:'Cameron'        },
  { rank:221, last:'Kuzma',             first:'Cameron'        },
  { rank:222, last:'Frossard',          first:'Eric'           },
  { rank:223, last:'Bouvard',           first:'Fabrice'        },
  { rank:224, last:'Rozzi',             first:'Dylan'          },
  { rank:225, last:'Ilyin',             first:'Arseni'         },
  { rank:226, last:'Dean',              first:'Dylan'          },
  { rank:227, last:'Pepoy',             first:'Brody'          },
  { rank:228, last:'Daniele',           first:'Biagio Jr.'     },
  { rank:229, last:'Ricard',            first:'Emile'          },
  { rank:230, last:'Sedlacek',          first:'David'          },
  { rank:231, last:'Iginla',            first:'Joe'            },
  { rank:232, last:'Zajic',             first:'Lucas'          },
  { rank:233, last:'Yared',             first:'William'        },
  { rank:234, last:'Jennersjo',         first:'Torkel'         },
  { rank:235, last:'Poletin',           first:'Frantisek'      },
  { rank:236, last:'Bogas',             first:'Nick'           },
  { rank:237, last:'Rinne',             first:'Rasmus'         },
  { rank:238, last:'Pantelakis',        first:'Zachary'        },
  { rank:239, last:'Carey',             first:'Ryder'          },
  { rank:240, last:'Lygitsakos',        first:'Chad'           },
  { rank:241, last:'Howard',            first:'Ryan'           },
  { rank:242, last:'Sloper',            first:'Brady'          },
  { rank:243, last:'Rudolph',           first:'Brendan'        },
  { rank:244, last:'Kraft',             first:'Mason'          },
  { rank:245, last:"O'Neill",           first:'Andrew'         },
  { rank:246, last:'Allard',            first:'Cameron'        },
  { rank:247, last:'Salandra',          first:'Joseph'         },
  { rank:248, last:'Wathier',           first:'Sam'            },
  { rank:249, last:'Dravecky',          first:'Vladimir'       },
  { rank:250, last:'Laylin',            first:'Bode'           },
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

// 3-char prefix; also tries full first name and second segment of hyphenated first names.
// No last-name-only fallback.
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

  // Full first name — helps with common surnames
  const full = stripAccents(player.first);
  terms.add(`${full} ${stripAccents(last)}`);
  terms.add(`${full} ${last}`);

  // For hyphenated first names, also try the second part
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
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  NHL Draft Rankings — 250 players                ║');
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

      // ── Search — primary: birth-year rows; fallback: new rows vs baseline ─
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
        console.log(`  ✗ SKIP — confirm button not found/enabled`);
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
  if (results.skip.length)     console.log(`  Skip ranks:      ${results.skip.join(', ')}`);
  if (results.notFound.length) console.log(`  Not-found ranks: ${results.notFound.join(', ')}`);
  console.log('══════════════════════════════════════════════\n');

  await browser.close();
}

main().catch(err => { console.error(err); process.exit(1); });
