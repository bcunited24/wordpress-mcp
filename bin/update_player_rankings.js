#!/usr/bin/env node
/**
 * Update player star ratings and QMJHL 2026 draft rankings on NZ Hub admin.
 *
 * Prerequisites (run once):
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Usage:
 *   node update_player_rankings.js
 *   node update_player_rankings.js --start 50     # resume from player index 50
 *   node update_player_rankings.js --visible      # show browser window
 *   node update_player_rankings.js --dry-run      # search only, no saves
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const ADMIN_URL   = 'https://neutralzone.com/hub-mens-admin/';
const USERNAME    = 'brendan';
const PASSWORD    = 'nzhockey24';
const DRAFT_YEAR  = '2026';
const LEAGUE      = 'QMJHL';
const VALID_YEARS = ['2009', '2010'];

const args       = process.argv.slice(2);
const HEADLESS   = !args.includes('--visible');
const DRY_RUN    = args.includes('--dry-run');
const startIdx   = (() => { const i = args.indexOf('--start'); return i !== -1 ? parseInt(args[i + 1], 10) : 0; })();

const LOG_FILE   = path.join(__dirname, 'update_rankings.log');
const PROG_FILE  = path.join(__dirname, 'update_progress.json');
const SHOT_DIR   = path.join(__dirname, 'ranking_screenshots');

if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

// ─── Logging ──────────────────────────────────────────────────────────────────

function log(level, msg) {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}
const info  = msg => log('INFO ', msg);
const warn  = msg => log('WARN ', msg);
const error = msg => log('ERROR', msg);

// ─── Progress tracking ────────────────────────────────────────────────────────

function loadProgress() {
  if (fs.existsSync(PROG_FILE)) {
    try { return JSON.parse(fs.readFileSync(PROG_FILE, 'utf8')); } catch (_) {}
  }
  return { completed: [], failed: [] };
}

function saveProgress(prog) {
  fs.writeFileSync(PROG_FILE, JSON.stringify(prog, null, 2));
}

// ─── Player data ──────────────────────────────────────────────────────────────
// Raw format: rank \t |First ^Last| \t Pos \t Team \t Rate
// rank is empty for unranked players (star rating only)

const RAW = `1	|Thomas ^Boisvert|	F	Mount St. Charles	4.5
2	|JACOB ^McKINNON|	RW	SEMINAIRE ST-FRANCOIS	4.5
3	|VINCENT ^BOUTET|	D	SEMINAIRE ST-FRANCOIS	4.5
4	|JULIEN ^BERGERON|	LW	CHATEAUGUAY U18	4.5
5	|Zaac ^Charbonneau|	C	Mount St. Charles	4.5
6	|John ^Queally|	F	St. Sebastian's	4.25
7	|PIERRE-ALEXANDRE ^LEMIEUX|	C/RW	ESTHER-BLONDIN U18	4.25
8	|ASLAN ^TREMBLAY|	C	AMOS U18	4.25
9	|JUSTIN ^GAGNON|	F	NOTRE-DAME U18	4.25
10	|JAKOB ^ROYER|	C	TROIS-RIVIERES U18	4.25
11	|Samuel ^Lee|	F	Milton Academy	4.25
12	|DAMIEN ^LEDUC|	C	CHATEAUGUAY U18	4.25
13	|Blake ^Wilichoski|	F	Belmont Hill	4.25
14	|LAWRENCE ^WILLIAMS|	D	WEEKS MAJORS	4.25
15	|SAMUEL ^NOWLAN|	F	LITTLE CAESARS	4.25
16	|JACK ^CAMERON|	D	WEEKS MAJORS	4.25
17	|MAX ^BRIEN|	F	STEELE SUBURU	4.25
18	|Logan ^Cotter|	D	St. Mark's School	4.25
19	|DAMIAN ^NORRIS|	F	UPPER CANADA COLLEGE	4.25
20	|EMILE ^GUEVIN|	RW	TROIS-RIVIERES U18	4.25
21	|CJ ^Sawyer|	F	Atlantic Coast Academy 16U	4.25
22	|Emrik ^Menard|	F	Woodbridge Wolfpack U16	4
23	|MALIK ^TREMBLAY|	LW	MAGOG U18	4
24	|Robert ^Dekleine|	F	Belmont Hill	4
25	|DOMENICO ^BORSELLINO|	C	LAC ST-LOUIS U18	4
26	|ENZO ^ROY|	D	LEVIS U18	4
27	|Maveric ^Thisdelle|	F	Woodbridge Wolfpack 15U	4
28	|BRYCE ^LAZARE|	C	LAC ST-LOUIS U18	4
29	|NATHAN-NICOLAS ^ROY|	D	CHARLES LEMOYNE U18	4
30	|ELIOT ^FAUCHER|	D	STANDSTEAD U17	4
31	|ZACHARY ^LAINESSE|	G	LEVIS U18	4
32	|Nathan ^Frost|	D	CANIMEX M17	4
33	|Carter ^Felt|	F	Rivers School	4
34	|RAPHAEL ^TETREAULT|	F	ESTHER-BLONDIN U18	4
35	|TOMMY ^LEROUX|	C	CHARLES LEMOYNE U18	4
36	|ENZO ^LEVY|	LW	SAINT-EUSTACHE U18	4
37	|ALEXY ^BLANCHETTE|	D	JONQUIERE U18	4
38	|Jackson ^Conroy|	F	Bishop Kearney 15U	4
39	|MATTEO ^ROY|	D	MONCTON FLYERS	4
40	|DYLAN ^CURRIE|	RW	CHATEAUGUAY U18	4
41	|Mason ^Stonacek|	D	Mount St Charles U15	4
42	|GABRIEL ^COACHE-LUQMAN|	D	CHARLES LEMOYNE U18	4
43	|ALEXANDRE ^NOEL|	D	ST. HYACINTHE U18	4
44	|Nick ^Ware|	D	Belmont Hill	4
45	|JAYDEN ^TILLMAN|	D	Bishop Kearney 15U	4
46	|AXEL ^BOLDUC|	D	LEVIS U18	4
47	|MATHIEU ^GENEREUX|	D	STANDSTEAD U17	4
48	|NATHAN ^RIENDEAU|	C	CHARLES LEMOYNE U18	4
49	|Ethan ^Gingeleskie|	F	Avon Old Farms	3.75
50	|NATHAN ^BOULANGER|	G	ESTHER-BLONDIN U18	3.75
51	|JOEY ^LACKMAN|	D	LAC ST-LOUIS U18	3.75
52	|Ryan ^Porter|	D	Dexter School	3.75
53	|Brendan ^Martin|	D	St. Sebastian's	3.75
54	|CHASE ^CLEARY|	F	NOTRE-DAME U18	3.75
55	|SIMON-OLIVIER ^GUERARD|	G	SEMINAIRE ST-FRANCOIS	3.75
56	|MAVRICK ^OUELLETTE|	C	TROIS-RIVIERES U18	3.75
57	|Jameson ^Needham|	F	St Sebastian's	3.75
58	|Julien ^Robichaud|	D	NJ Avalanche 15U	3.75
59	|JOEY ^BEGIN|	D	NOTRE-DAME U18	3.75
60	|MORGAN ^FLEMMING|	F	VALLEY WILDCATS	3.75
61	|SIMON ^CANTIN|	C	CHARLES LEMOYNE U18	3.75
62	|LOU ^DESLAURIERS|	D	SAINT-EUSTACHE U18	3.75
63	|LOGAN ^LECLAIR|	LW	TROIS-RIVIERES U18	3.75
64	|George ^Panagakos|	G	South Kent 15U	3.75
65	|MAXIME-ALEXANDRE ^BEAUDOIN|	D	CHARLES LEMOYNE U18	3.75
66	|Samuel ^Fishbone|	D	St. Sebastian's	3.75
67	|ELIJAH ^SYLLA|	C	LAVAL-MONTREAL U18	3.75
68	|ZACHARY ^LAVOIE|	D	TROIS-RIVIERES U18	3.75
69	|Joey ^St. Laurent|	F	NJ Avalanche 15U	3.75
70	|LOIK ^POULIN|	F	LEVIS U18	3.75
71	|XAVIER ^GERVAIS|	G	JONQUIERE U18	3.75
72	|ALEXANDRE ^DESCHAMPS|	D	LAVAL-MONTREAL U18	3.75
73	|Owen ^Lundin|	F	Lawrence Academy	3.75
74	|CARTER ^GIBERSON|	D	FREDERICTON CAPS	3.75
75	|MALEK ^BELANGER|	RW	LEVIS U18	3.75
76	|DAMIEN ^ROY|	RW	MAGOG U18	3.75
77	|MIKAEL ^PERREAULT|	D	ESTHER-BLONDIN U18	3.75
78	|EMILE ^RIOUX|	D	NOTRE-DAME U18	3.75
79	|Liam ^Fournier|	F	Woodbridge Wolfpack 15U	3.75
80	|LUKE ^MCGUIRE|	F	EDGE SCHOOL U17	3.75
81	|LIAM ^DUFFY|	D	STEELE SUBURU	3.75
82	|Alexander ^Guo|	D	Belmont Hill	3.75
83	|SIMON ^DELAROSBIL|	C	LEVIS U18	3.75
84	|NATHAN ^LEBLANC|	F	MONCTON FLYERS	3.75
85	|Jamie ^Calla|	F	Governor's Academy	3.75
86	|Jayden ^Shea|	F	Pitt Pens 15U	3.75
87	|NOAH ^O'CONNELL|	C	ESTHER-BLONDIN U18	3.75
88	|CARTER ^ODELL|	F	HALIFAX MACS	3.75
89	|Michael ^Barrett|	F	Andover Academy	3.75
90	|Colin ^Walsh|	F	Framingham HS	3.75
91	|EDOUARD ^SALVAS|	G	ST. HYACINTHE U18	3.75
92	|WILLIAM ^VINCENT|	F	SAINT-EUSTACHE U18	3.75
93	|Kasen ^Walsh|	D	Noble & Greenough	3.75
94	|MATHIS ^KHOURY|	RW	LAVAL-MONTREAL U18	3.75
95	|ERIC ^HANLEY|	F	VALLEY WILDCATS	3.75
96	|Will ^Torres|	G	Rivers School	3.75
97	|PIERRE-ANTOINE ^CHARTRAND-BONGONO|	C	GATINEAU U18	3.75
98	|KEAVEN ^PROULX|	C	SAINT-EUSTACHE U18	3.75
99	|JAMIE ^JAILLET|	D	MONCTON FLYERS	3.75
100	|Louka ^Blanchette|	F	COLLEGE NOTRE DAME U18	3.75
101	|William ^Sproule|	D	Shattuck St. Mary's U15	3.75
102	|XAVIER ^LESAGE|	G	GATINEAU U18	3.75
103	|HUGO ^LEGARE|	C	SEMINAIRE ST-FRANCOIS	3.75
104	|Jake ^Donatelli|	D	St. George's School	3.75
105	|CALEB ^PELLETIER|	G	LAVAL-MONTREAL U18	3.75
106	|Olivier ^Necak|	F	SAINT-EUSTACHE U18	3.75
107	|Mason ^Wohlers|	D	Bishop Kearney Selects U15	3.75
108	|Tyler ^Poti|	D	Winchendon School	3.75
109	|Drew ^Short|	F	Winchendon School	3.75
110	|FELIX ^THEORET|	RW	CHATEAUGUAY U18	3.75
111	|HUGO ^BERGERON|	C	NOTRE-DAME U18	3.75
112	|RAPHAEL ^TRUCHON|	D	AMOS U18	3.75
113	|COOPER ^STRONG|	F	HALIFAX MACS	3.75
114	|ALEXIS ^TURCOTTE|	F	MAURICIE M17	3.75
115	|Colten ^Kelly|	D	Pitt Pens Elite 15U	3.75
116	|JUSTIN ^CARDILLO|	LW	LAC ST-LOUIS U18	3.75
117	|COLBY ^O'SHAUGHNESSY|	G	MARCH & MILL CO HUNTERS	3.75
118	|THOMAS ^DUROCHER|	D	RICHELIEU U17	3.75
119	|Jesse ^Bernardinelli|	G	St. John's Prep	3.75
120	|Hugo ^Vaillancourt|		JONQUIERE U18	3.75
121	|Gabriel ^Sorgini|	F	Notre Dame HA 15U	3.75
122	|Kuba ^Pavlik|	F	HC Pilsen Wolves U15 (CZE)	3.75
123	|TJ ^Petropoulos|	F	Milton Academy	3.75
124	|Tristan ^D'Elia|	F	WBS Knights 15U	3.75
125	|HENRY ^LACELLE|	F	LAC ST-LOUIS U18	3.75
126	|Olivier ^Lafreniere|	F	Woodbridge Wolfpack 15U	3.75
127	|Isaac ^De Franco|	F	GATINEAU U18	3.75
128	|Noah ^Leduc|	LD	CHATEAUGUAY U18	3.75
129	|THOMAS ^GAGNON|	RW	QUEBEC BLIZZARD M17	3.75
130	|Austin ^Wu|	F	Dexter School	3.75
131	|ZACKARY ^RENAUD|	G	SAINT-EUSTACHE U18	3.75
132	|Justin ^Letendre|	RW	ST. HYACINTHE U18	3.75
133	|COLE ^TOMS|	F	BISHOPS COLLEGE	3.5
134	|Cade ^Noonan|	F	St. Sebastian's	3.5
135	|Brayden ^White|	F	Williston Northampton	3.5
136	|DANIELE ^DI MARZO|	F	LAVAL-MONTREAL U18	3.5
137	|JEREMY ^LALONDE|	D	GATINEAU U18	3.5
138	|Colton ^Cleaves|	F	Brunswick	3.5
139	|NATE ^MACKAY|	F	HALIFAX MACS	3.5
140	|XAVIER ^BOULAY|	F	NORTHERN MOOSE	3.5
141	|Julian ^Herrera|	G	St. Mark's	3.5
142	|JUSTIN ^GAUDET|	LD	MARIE-RIVIER U17	3.5
143	|Andrew ^Martineau|	F	Woodbridge 15U	3.5
144	|LOIK ^SAVOIE|	D	GATINEAU U18	3.5
145	|Owen ^Frick|	F	Cushing	3.5
146	|Cameron ^Daigle|	F	St. George's School	3.5
147	|AIDEN ^GRAHAM|	F	NFLD GROLWERS	3.5
148	|Brycen ^Jardine|	F	NH Mtn Kings 15U	3.5
149	|MICKAEL ^RHEAUME|	F	BASSES LAURENTIDES	3.5
150	|Brodie ^Anderson|	D	Cushing Academy	3.5
151	|Dawson ^Wood|	F	Kimball Union	3.5
152	|Grady ^Rowley|	F	Mount St Charles U16	3.5
153	|BRAYDEN ^WATERHOUSE|	F	FREDERICTON CAPS	3.5
154	|JUSTIN ^HAMEL|	D	ST. HYACINTHE U18	3.5
155	|NATHAN ^CHALE|	D	GATINEAU U18	3.5
156	|Chase ^Warsofsky|	F	Cushing Academy	3.5
157	|Edward ^Bolduc|	F	Atlantic Coast 15U	3.5
158	|Alex ^Wang|	G	St. George's	3.5
159	|HUNTER ^MACLEAN|	F	STEELE SUBURU	3.5
160	|NATHAN ^DESMEULES|	D	SAINT-EUSTACHE U18	3.5
161	|RAYAN ^LACOMBE|	G	LAVAL-MONTREAL M17	3.5
162	|EMILE ^BOUCHARD|	C	GATINEAU U18	3.5
163	|Zack ^Labelle|	LW	OUTAOUAIS M17	3.5
164	|ELIOT ^ETHIER|	LW	SAINT-EUSTACHE U18	3.5
165	|Colin ^O'Leary|	D	Rivers School	3.5
166	|ELOIK ^ST-DENIS|	C	GATINEAU U18	3.5
167	|XAVIER ^LEBLANC|	G	MONCTON FLYERS	3.5
168	|Ethan ^Machado|	F	Cushing	3.5
169	|Yoan ^WRAGG|	LD	St-Gabriel RSEQ	3.5
170	|JACOB ^SABOURIN|	RW	GATINEAU U18	3.5
171	|JAXON ^FRASER|	F	FREDERICTON CAPS	3.5
172	|Liam ^Carlin|	F	Winchendon	3.5
173	|Philippe ^Harvey|	G	Sag-Lac M17	3.5
174	|KONSTANTINOS ^STAFYLAKIS|	F	LAVAL-MONTREAL U18	3.5
175	|Alexandre ^Paradis|	F	COLLEGE de Levy M18	3.5
176	|HENRY ^COLLINGWOOD|	D	BISHOPS COLLEGE	3.5
177	|Kellan ^Fenstad|	F	Yale Jr. Bulldogs 15U	3.5
178	|MATT ^MACDONALD|	F	STEELE SUBURU	3.5
179	|Brayden ^Hekle|	F	Shattuck St. Mary's 15U	3.5
180	|Preston ^Abbott|	D	New Hampton	3.5
181	|FLORENT Sy Lam ^PHAM|	G	CHARLES LEMOYNE M17	3.5
182	|THOMAS ^BOND|	C	JONQUIERE U18	3.5
183	|Blake ^Ward|	F	St. John's Prep	3.5
184	|ZAC ^PERREAULT|	RW	LAVAL-MONTREAL U18	3.5
185	|Brayden ^Erickson|	F	St. George's School	3.5
186	|Nathan ^Barrett|	D	Windy City Storm 15U	3.5
187	|Constantin ^Liarakos|	F	Notre Dame HA 15U	3.5
188	|DEREK ^LAFORCE|	D	GATINEAU u18	3.5
189	|Ben ^Rumsey|	F	Stanstead U17	3.5
190	|THOMAS ^ROSSIGNOL|	D	FADETTE ECOLE SEC.	3.5
191	|MAXIM ^ROBERT|	D	GATINEAU U18	3.5
192	|JADEN ^SMITH|	F	NFLD GROWLERS	3.5
193	|Kai ^Scranton|	F	Mid-Fairfield Rangers U15	3.5
194	|Landon ^Roe|	F	Belmont Hill	3.5
195	|ZACK ^SLEIGHER|	C	SAINT-EUSTACHE U18	3.5
196	|LUDOVIC ^PLANTE|	LW	LEVIS U18	3.5
197	|William ^Laplante|	G	Ontario HA U17	3.5
198	|Dominic ^Duplantie|	F	LAVAL-MONTREAL M17	3.5
199	|ZACHARY ^BIBEAU|	D	RICHELIEU U17	3.5
200	|Senji ^Kimura|	G	Phillips Andover	3.5
201	|QUINTON ^LAND|	D	STEELE SUBURU	3.5
202	|Sawyer ^O'Neil|	D	Mid Fairfield	3.5
203	|Eben ^Alden|	D	Noble & Greenough	3.5
204	|Luca ^De Pastena|	LD	Kuper Academy	3.5
205	|Lucca ^Brotto|	D	South Kent 15U	3.5
206	|MATT ^WILSON|	D	BASSES LAURENTIDES	3.5
207	|Ethan ^Hung|	D	Hotchkiss School	3.5
208	|AJ ^Oliveri|	F	Worcester Academy	3.5
209	|BRAYDEN ^WOODLEY|	D	Bourget RSEQ	3.5
210	|Hudson ^Boucher|	D	LAC ST-LOUIS M17	3.5
211	|Benjamin ^Gregoire|	F	Lanaudiere	3.5
212	|Owen ^Hannah|	F	Deerfield	3.5
213	|Silas ^Fils-Aime|	D	Eaglebrook PS	3.5
214	|Nathan ^Archange-Bourassa|	LD	LAVAL-MONTREAL U18	3.5
215	|MATTHEW ^DARBY|	G	LAC ST-LOUIS M17	3.5
216	|Jackson ^Luedke|	F	Mid-Fairfield Rangers U15	3.5
217	|LUCAS ^BOIVIN|	LW	MAGOG U18	3.5
218	|JACK ^BALDWIN|	F	MARCH & MILL CO HUNTERS	3.5
219	|Tommy ^Egan|	F	Austin Prep	3.5
220	|WILLIAM ^COTE|	D	LEVIS U18	3.5
221	|EDOUARD ^GERMAIN-LACROIX|	D	AMOS U18	3.5
222	|Jorden ^Marzi|	D	Rivers School	3.5
223	|Jaxson ^Fleming|	G	Catholic Memorial	3.5
224	|London ^Gillis|	D	NH Mtn Kings 15U	3.5
225	|NASH ^HAVERSTOCK|	F	HALIFAX MACS	3.5
226	|NICO ^CARLOMUSTO|	C	LAC ST-LOUIS M17	3.5
227	|Alexander ^Beck|	LW	Kuper Academy	3.5
228	|MIGUEL ^DUPLESSIS|	F	MONCTON FLYERS	3.5
229	|Brayden ^Dickie|	F	Canton HS	3.5
230	|SEAN ^DWYER|	F	STANDSTEAD U17	3.5
231	|Alexis ^Noel|	G	American HA 15U	3.5
232	|ZACH-OLIVIER ^MORASSE|	D	QUEBEC BLIZZARD M17	3.5
233	|Jake ^Guerriero|	F	Archbishop Williams	3.5
234	|JEREMY ^WILSON|	D	VALLEY WILDCATS	3.5
235	|LEO ^BELANGER|	G	COLLEGE NOTRE DAME U18	3.5
236	|Ben ^Beaudry|	D	Mid Fairfield	3.5
237	|ALISTAIR ^MACPHEE|	D	STEELE SUBURU	3.5
238	|KINGSTON ^DELISLE|	G	LAC ST-LOUIS M17	3.5
239	|Andrew ^Allred|	F	Yale Bulldogs 15U	3.5
240	|MARC-OLIVIER ^OUELLETTE|	D	MONCTON FLYERS	3.5
241	|Michael ^Shook|	F	Seacoast PA 15U	3.5
242	|Nicholas ^Tulipano|	F	Burlington HS	3.5
243	|Xavier ^Cardinal|	F	Seacoast PA 15U	3.5
244	|BLAKE ^BOUTILIER|	D	HALIFAX MACS	3.5
245	|RAPHAEL ^HOULE|	C	POINTE-LEVY M17	3.5
246	|LIAM ^BOWLES|	D	Saint John Vitos	3.5
247	|AARON ^MEADEN|	G	VALLEY WILDCATS	3.5
248	|Esteban ^Loyer|	D	American HA 15U	3.5
249	|NASH ^GORMAN|	D	RNS	3.5
250	|THOMAS ^THIBAULT|	C	BEAUCE-APPALACHES M17	3.5
251	|Grady ^Stickney|	F	Amesbury HS	3.5
252	|LOIK ^DESJARDINS|	C	CHARLES LEMOYNE M17	3.5
253	|Dylan ^Hug|	RW	MAGOG U18	3.5
254	|Quinn ^Brown|	D	Mount St. Charles 15U	3.5
255	|ANTOINE ^BRUNELLE|	G	MAURICIE M17	3.5
256	|Zachary ^Botelho|	G	Bourget RSEQ	3.5
257	|ALEXIS ^PICHETTE|	C	QUEBEC AS M17	3.5
258	|Phil ^Groeling|	F	New Hampton	3.5
259	|Giuliano ^Martone|	F	LAVAL-MONTREAL M17	3.5
260	|WILLYAM ^ROBIDOUX|	LW	RICHELIEU U17	3.5
261	|Matthew ^Bertleff|	D	South Kent 15U	3.5
262	|Will ^Gwaltney|	G	Dexter School	3.5
263	|ALEXIS ^HOULE|	G	QUEBEC AS M17	3.5
264	|ANDREW ^URQUHART|	F	MARCH & MILL CO HUNTERS	3.25
265	|ZAK ^DESCHAMPS|	LW	CHARLES LEMOYNE M17	3.25
266	|RENAUD ^HUBERT|	C	MAURICIE M17	3.25
267	|ZANE ^WASHIPABANO|	LW	OUTAOUAIS M17	3.25
268	|HUDSON ^O'KEEFE|	F	EAST COAST BLIZZARD	3.25
269	|GABRIEL ^THIBERT|	D	CHARLES LEMOYNE U18	3.25
270	|Graham ^Furness|	F	Governor's Academy	3.25
271	|Mae ^Pouget|	G	Mille-Iles M17	3.25
272	|WILLIAM ^LACHAPELLE|	D	QUEBEC AS M17	3.25
273	|James ^Hamlin|	F	Roxbury Latin	3.25
274	|Keith ^Olympia|	F	St. Mark's	3.25
275	|Maxime ^Vorobiev|	F	WBS Knights 15U	3.25
276	|ADAM ^GOSSELIN|	D	COLLEGE CLARETAIN M17	3.25
277	|TOMMY ^SOULIERE|	C	CHARLES LEMOYNE M17	3.25
278	|Zachary ^Mohamed|	F	Noble & Greenough	3.25
279	|CHARLES ^DESJARDINS|	C	BASSES LAURENTIDES	3.25
280	|JOSEPH ^VACHON|	C	Chateaguay U18	3.25
281	|Sidney ^Chartrand|	F	Bourget RSEQ	3.5
282	|Matthew ^Coccaro|	D	Mid-Fairfield Rangers U15	3.25
283	|Jack ^Funk|	F	Thayer	3.25
284	|Elliot ^Guertin|	D	RICHELIEU U17	3.25
285	|Marc-Antoine ^Larochelle|	F	BISHOPS COLLEGE	3.25
286	|SAMUEL ^WILLIAMS|	D	EAST COAST BLIZZARD	3.25
287	|Tristan ^Lavigne|	C	LAC ST-LOUIS U18	3.25
288	|Billy ^Ducharme|	F	Selects du Nord	3.25
289	|Riley ^Cormier|	F	KENSINGTON Wild	3.25
290	|Felix-Antoine ^Julien|	G	Bourget RSEQ	3.25
291	|MADDOX ^PAGE|	D	LAC ST-LOUIS M17	3.25
292	|Elie ^Jacques|	LD	BEAUCE-APPALACHES M17	3.25
293	|Connor ^Wright|	D	Tabor Academy	3.25
294	|Zach ^Ducharme|	LD	Selects du Nord	3.25
295	|Mika ^Richard|	F	Hill Academy U16	3.25
296	|SAMUEL ^SALOMON|	C	BASSES LAURENTIDES	3.25
297	|Brandon ^Gillard|	F	Atlantic Coast 15U	3.25
298	|Mason ^Proulx|	F	Seacoast PA 15U	3.25
299	|EMILE ^TREMBLAY|	D	BASSES LAURENTIDES	3.25
300	|HUGO ^CANTORO|	C	LAVAL ROUSSEAU M17	3.25
301	|Colin ^Dunlap|	D	Xaverian	3.25
302	|Taytum ^Thompson|	LW	OUTAOUAIS M17	3.25
303	|Danny ^Patch|	F	Pingree	3.25
304	|Colton ^Simas|	F	Deerfield Academy	3.25
305	|James ^Jackson|	F	Brunswick School	3.25
306	|MATHIS ^PROULX|	G	OUTAOUAIS M17	3.25
307	|EDOUARD ^Cote|	RW	Bourget RSEQ	3.25
308	|Mathieu ^Lamarche|	D	Mille-Iles M17	3.25
309	|DREW ^Moores|	F	RNS	3.25
310	|Liam ^Worth|	D	MARCH & MILL CO HUNTERS	3.25
311	|Gunnar ^Mink|	D	Rice Prep	3.25
312	|ALEXY ^COTE|	C	QUEBEC AS M17	3.25
313	|Cam ^Simon|	D	St. Mark's	3.25
314	|Ryan ^Holmes|	F	Westminster Prep	3.25
315	|BRAYDEN ^CARRIGAN|	F	VALLEY WILDCATS	3.25
316	|Connor ^Allaby|	F	Saint John Vitos	3.25
317	|Xavier ^Lanctot|	G	Seacoast PA 15U	3.25
318	|Whitaker ^Zinger|	F	Pope Francis	3.25
319	|MATHIEU ^LACROIX|	D	BEAUCE-APPALACHES M17	3.25
320	|WILLIAM ^GARNEAU|	C	QUEBEC AS M17	3.25
321	|LEO ^MENG|	D	FREDERICTON CAPS	3.25
322	|Carter ^Heise|	G	Concord HS-NH	3.25
323	|MJ ^BOTTOMLEY|	F	HALIFAX MACS	3.25
324	|Mikko ^Robichaud|	G	Kings-Edgehill	3.25
325	|EDOUARD ^GUAY|	D	BEAUCE-APPALACHES M17	3.25
326	|Greyson ^Peel|	D	CIHA	3.25
327	|Frederic ^Anctil|	D	Bas St-Laurent	3.25
328	|JOSHUA ^STEWART|	F	NORTHERN MOOSE	3.25
329	|Logan ^Smith|	D	Milton Academy	3.25
330	|Nathan ^Cook|	F	Brunswick School	3.25
331	|DAYLE ^POULIN|	G	BEAUCE-APPALACHES M17	3.25
332	|Jordan ^Cleary|		Sag-Lac M17	3.25
333	|ELI ^SWAIN|	F	WEEKS MAJORS	3.25
334	|LIAM ^HEALY|	G	EAST COAST BLIZZARD	3.25
335	|Connor ^Quinn|	F	Westminster	3.25
336	|Zack ^Laforce|	RD	MAURICIE M17	3.25
337	|Jackson ^Burns|	F	Belmont Hill	3.25
338	|Nevio ^Rubbo|	F	Notre Dame HA 15U	3.25
339	|Jacob ^Bolduc|	F	Sag-Lac M17	3.25
340	|Luke ^Gaudette|	F	Hillside School	3.25
341	|Evan ^Casavant|	D	Sherbrooke M17	3.25
342	|dylan ^Hansen-Leveille|	LD	Lower Canada College	3.25
343	|Drew ^Gallucci|	F	Pingree School	3.25
344	|Louis ^Lamontagne|	F	Seacoast PA 15U	3.25
345	|Jacob ^Gilbert|	D	RICHELIEU U17	3.25
346	|Nico ^Santella|	F	Saint Johns Shrewsbury	3.25
347	|GABRIEL ^BEAUCHEMIN|	D	CHARLES LEMOYNE M17	3.25
348	|BRYSON ^O'NEILL|	F	NFLD GROWLERS	3.25
349	|CALEB ^FORTIN|	C	BEAUCE-APPALACHES M17	3.25
350	|Leo ^McCullough|	F	Don Bosco Prep	3.25
351	|Alexis ^Miclette|	RD	PML RSEQ	3.25
352	|MALIK ^DAUPHINAIS|	D	MAURICIE M17	3.25
353	|Devin ^Cokinos|	F	Salisbury School	3.25
354	|Malek ^Boucher|	RD	Sag-Lac M17	3.25
355	|ETHAN ^PITCHER|	D	Central Impact	3.25
356	|Bodan ^Mcfadden|	F	RNS	3.25
357	|Noah ^Mazzola|	D	Seacoast Performance U16	3.25
358	|Rhys ^Dickinson|	F	FREDERICTON CAPS	3.25
359	|ELI ^LACHANCE|	C	MAURICIE M17	3.25
360	|Maxime ^Poulin|	F	Sherbrooke M17	3.25
361	|Tommy ^Moore|	F	Dexter School	3.25
362	|Nikolaos ^Tzouganatos|	D	St Marks	3.25
363	|Philippe ^Vachon|	LD	BISHOPS COLLEGE	3.25
364	|Nolan ^Dow-Imrie|	D	Sag-Lac M17	3.25
365	|Samuel ^Montminy|	LD	QUEBEC BLIZZARD M17	3.25
366	|RJ ^Grace|	D	Winchendon School	3.25
367	|Maxime ^Bernier|	F	Quebec As M17	3.25
368	|MATHIS ^CARIGNAN|	F	SEMINAIRE ST-JOSEPH M18	3.25
369	|Pier-Olivier ^Thauvette|	F	Nord Selects M17	3.25
370	|Luke ^Dickson|	F	Medfield HS	3.25
371	|Ryder ^Bisson|	D	St. John's Shrewsbury	3.25
372	|Louis-Edouard ^Rioux|	F	Quebec Blizzard M17	3.25
373	|MAXIME ^RICHARD|	F	MONCTON FLYERS	3.25
374	|JEREMIE ^DESJARDINS|	C	MAURICIE M17	3.25
375	|LUCAS ^CHISHOLM|	D	CBW ISLANDERS	3.25
376	|Jeremie ^Hebert|	F	Academie St. Therese	3.25
377	|ANTOINE ^OLIVIER|	D	CHARLES LEMOYNE M17	3.25
378	|Silas ^Mullins|	G	STEELE SUBURU	3.25
379	|Liam ^Croteau|	LW	Bourget RSEQ	3.25
380	|RAPHAEL ^GELINAS|	D	MAURICIE M17	3.25
381	|Oliver ^Methot|	F	BK Selects 15U	3.25
382	|ADAMO ^LATELLA|	C	LAVAL ROUSSEAU M17	3.25
383	|NOAH ^HACKETT|	D	KENSINGTON Wild	3.25
384	|Dylan ^Tasca|	F	La Salle Academy (RI)	3.25
385	|THOMAS ^MORGAN|	D	KENSINGTON Wild	3.25
386	|Liam ^Boone|	F	Kings-Edgehill	3.25
387	|Kaylan ^Miansi|	F	Mille-Iles M17	3.25
388	|Shaun ^Farrell|	D	Catholic Memorial	3.25
389	|Deniz ^Unal|	D	Noble & Greenough	3.25
390	|Kieran ^Larsen|	F	Selwyn House M18	3.25
391	|Xavier ^Vallee|	D	Bas St-Laurent	3.25
392	|JAMIE ^MORRISON|	D	Sydney Rush	3.25
393	|Trevor ^Rostowsky|	G	Yale Jr. Bulldogs 15U	3.25
394	|FELIX-ANTOINE ^TURGEON|	C	CHARLES LEMOYNE M17	3.25
395	|Luca ^Leo|	F	LAC ST-LOUIS M17	3.25
396	|Simon ^Pelletier|	F	WBS Knights 15U	3.25
397	|ETHAN ^MILLER|	F	Sydney Rush	3.25
398	|Robert ^Pandolfo|	F	Yale Jr. Bulldogs 15U	3.25
399	|Nathan ^Swain|	D	Pinnacle Growlers	3.25
400	|Maxim ^Gosselin|	D	Mille-Iles M17	3.25
	|Justin ^Labrecque|	F	BEAUCE-APPALACHES M17	3.25
	|Felix ^Potvin-Leblond|	F	Quebec Blizzard M17	3.25
	|ELYOT ^STEMPER|	C	QUEBEC AS M17	3.25
	|Owen ^Parsons|	F	Central Impact	3.25
	|Thomas ^Boulet|	F	Canimex M17	3.25
	|Thomas ^McCarthy|	F	East Coast Blizzard	3.25
	|Jacob ^Quenneville|	F	Quebec Blizzard M17	3.25
	|Carter ^Bizeau|	D	Saint John Vitos	3.25
	|Owen ^Weatherbie|	F	Charlottetown Knights	3.25
	|Remy ^Chapman Belliveau|	F	MARCH & MILL CO HUNTERS	3.25
	|Parker ^Leblanc|	F	South Shore U18	3.25
	|Thomas ^Vermette|	F	RICHELIEU U17	3.25
	|Mason ^Morris|	F	MARCH & MILL CO HUNTERS	3.25
	|Nolan ^Fraughton|	G	South Shore Mustangs	3.25
	|Thomas ^Giguere|	G	Atlantic Coast 15U	3.25
	|Hunter ^Green|	F	WEEKS MAJORS	3.25
	|Archie ^Wible|	G	NH Mountain Kings U15	3.25
	|Will ^Vincent|	F	CT Nor'Easters 15U / Simsbury HS	3.25
	|Jay ^Ha|	F	Mount St. Charles	3.25
	|Roan ^Wilson|	D	Cardigan Mountain	3.25
	|James ^Johnson|	F	Xaverian	3.25
	|Kingston ^Delmastro|	F	NH Mountain Kings U15	3.25
	|Lochlan ^Horsman|	F	Xaverian	3.25
	|Jack ^Manley|	F	Thayer Academy	3.25`;

// ─── Parse player list ────────────────────────────────────────────────────────

function parsePlayers(raw) {
  const players = [];
  for (const line of raw.trim().split('\n')) {
    const parts = line.split('\t');
    if (parts.length < 5) continue;
    const rankStr = parts[0].trim();
    const nameRaw = parts[1].trim();
    const team    = parts[3].trim();
    const rate    = parts[4].trim();

    const m = nameRaw.match(/^\|(.+?)\s+\^(.+?)\|$/);
    if (!m) continue;

    const first = m[1].trim();
    const last  = m[2].trim();
    const rank  = /^\d+$/.test(rankStr) ? parseInt(rankStr, 10) : null;

    players.push({ rank, first, last, rate, team,
      searchFirst: first.slice(0, 4),
      searchLast:  last,
    });
  }
  return players;
}

const PLAYERS = parsePlayers(RAW);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function screenshot(page, name) {
  const file = path.join(SHOT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
}

async function login(page) {
  info('Navigating to admin...');
  await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const url = page.url();
  if (url.includes('wp-login') || url.includes('login')) {
    info('Login page detected, filling credentials...');
    await page.fill('#user_login', USERNAME);
    await page.fill('#user_pass', PASSWORD);
    await page.click('#wp-submit');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
    info('Logged in. URL: ' + page.url());
  } else {
    info('Already logged in or custom auth. URL: ' + url);
  }
  await screenshot(page, '00_after_login');
}

// ─── Core update logic ────────────────────────────────────────────────────────

async function updatePlayer(page, player, index) {
  const label = `#${index + 1} ${player.first} ${player.last}`;
  info(`Processing ${label} (rank=${player.rank ?? 'unranked'}, rate=${player.rate})`);

  // Navigate to search page
  const searchUrl = ADMIN_URL + '?admin_area=nz_hub_mens_admin_search_add_edit_player&task=search&step=1';
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

  // Fill search form
  const firstInput = page.locator('input[name="first_name"], input[name="fname"], input[placeholder*="first" i], input[placeholder*="First" i]').first();
  const lastInput  = page.locator('input[name="last_name"],  input[name="lname"],  input[placeholder*="last" i],  input[placeholder*="Last" i]').first();

  if (await firstInput.count() === 0 || await lastInput.count() === 0) {
    // Dump all inputs for debugging on first player
    if (index === 0) {
      const inputs = await page.$$eval('input', els => els.map(e => ({ name: e.name, id: e.id, placeholder: e.placeholder, type: e.type })));
      info('DEBUG inputs: ' + JSON.stringify(inputs));
      await screenshot(page, `debug_search_form`);
    }
    throw new Error('Could not find first/last name search inputs');
  }

  await firstInput.fill(player.searchFirst);
  await lastInput.fill(player.searchLast);

  // Click Search
  const searchBtn = page.locator('input[type="submit"][value*="Search" i], button:has-text("Search"), input[value="Search"]').first();
  await searchBtn.click();
  await page.waitForLoadState('domcontentloaded');

  await screenshot(page, `${String(index + 1).padStart(3, '0')}_${player.last}_search`);

  // ── Find the correct player row ──────────────────────────────────────────────
  // Rows must have birth year 2009 or 2010
  const rows = await page.$$('tr.player-row, tr[data-player-id], tbody tr');
  let targetRow = null;

  for (const row of rows) {
    const text = (await row.innerText()).replace(/\s+/g, ' ');
    const hasValidYear = VALID_YEARS.some(y => text.includes(y));
    if (!hasValidYear) continue;

    // Check name match (case-insensitive)
    const lastLower = player.last.toLowerCase();
    if (text.toLowerCase().includes(lastLower)) {
      targetRow = row;
      break;
    }
  }

  // Fallback: if no row found by explicit tr class, look for any row with birth year
  if (!targetRow) {
    const allText = await page.content();
    // Check if results section exists at all
    if (!allText.includes('2009') && !allText.includes('2010')) {
      warn(`  No 2009/2010 player found for ${label} - skipping`);
      return { status: 'not_found' };
    }
    // Try to find any row with the last name
    targetRow = page.locator(`tr:has-text("${player.last.slice(0, 6)}")`).first();
    if (await targetRow.count() === 0) {
      warn(`  Player not found in results for ${label}`);
      await screenshot(page, `${String(index + 1).padStart(3, '0')}_${player.last}_NOT_FOUND`);
      return { status: 'not_found' };
    }
  }

  // ── Update star rating ───────────────────────────────────────────────────────
  if (!DRY_RUN) {
    // Try common field name patterns for star rating
    const ratingPatterns = [
      'input[name*="star_rating"]',
      'input[name*="star"]',
      'input[name*="rating"]',
      'input[name*="eval"]',
      'input[name*="evaluation"]',
      'input[name*="rate"]',
    ];

    let ratingInput = null;
    for (const pattern of ratingPatterns) {
      const el = page.locator(pattern).first();
      if (await el.count() > 0) { ratingInput = el; break; }
    }

    if (ratingInput) {
      await ratingInput.fill(player.rate);
      // Click the Go button adjacent to the rating field
      const ratingGo = page.locator('input[name*="star_go"], input[value="Go"][name*="star"], button:near(input[name*="star"])').first();
      if (await ratingGo.count() > 0) {
        await ratingGo.click();
        await page.waitForLoadState('domcontentloaded');
        info(`  ✓ Star rating set to ${player.rate}`);
      } else {
        // Try clicking any "Go" button near the rating input
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
      }
    } else {
      warn(`  Could not find star rating field for ${label} - will need manual inspection`);
      await screenshot(page, `${String(index + 1).padStart(3, '0')}_${player.last}_no_rating_field`);
    }
  }

  // ── Update QMJHL ranking (ranked players only) ───────────────────────────────
  if (!DRY_RUN && player.rank !== null) {
    // Select year 2026
    const yearInput = page.locator('input[name*="chl_year"], input[name*="draft_year"], select[name*="year"]').first();
    if (await yearInput.count() > 0) {
      const tag = await yearInput.evaluate(el => el.tagName.toLowerCase());
      if (tag === 'select') {
        await yearInput.selectOption(DRAFT_YEAR);
      } else {
        await yearInput.fill(DRAFT_YEAR);
      }
    }

    // Select QMJHL league
    const leagueSelect = page.locator('select[name*="chl_league"], select[name*="league"]').first();
    if (await leagueSelect.count() > 0) {
      await leagueSelect.selectOption({ label: LEAGUE });
    }

    // Enter rank number
    const rankInput = page.locator('input[name*="chl_rank"], input[name*="draft_rank"], input[name*="rank"]').first();
    if (await rankInput.count() > 0) {
      await rankInput.fill(String(player.rank));
    }

    // Click Go for the ranking
    const rankGo = page.locator('input[value="Go"][name*="chl"], input[value="Go"][name*="rank"], button:has-text("Go")').first();
    if (await rankGo.count() > 0) {
      await rankGo.click();
      await page.waitForLoadState('domcontentloaded');
      info(`  ✓ QMJHL 2026 rank set to ${player.rank}`);
    }
  }

  await screenshot(page, `${String(index + 1).padStart(3, '0')}_${player.last}_done`);
  return { status: 'ok' };
}

// ─── First-run inspection (dumps field names from first player) ───────────────

async function inspectFields(page, player) {
  info('=== INSPECTION MODE: dumping field names from first player ===');
  const searchUrl = ADMIN_URL + '?admin_area=nz_hub_mens_admin_search_add_edit_player&task=search&step=1';
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

  const allInputs = await page.$$eval('input, select, textarea', els =>
    els.map(e => ({ tag: e.tagName, name: e.name, id: e.id, type: e.type, placeholder: e.placeholder, value: e.value }))
  );
  info('Search form fields: ' + JSON.stringify(allInputs, null, 2));
  await screenshot(page, 'inspect_search_form');

  // Try to search for first player to get results form
  try {
    const firstInput = page.locator('input').nth(1);
    await firstInput.fill(player.searchFirst);
    const lastInput = page.locator('input').nth(2);
    await lastInput.fill(player.searchLast);
    await page.keyboard.press('Enter');
    await page.waitForLoadState('domcontentloaded');
    await screenshot(page, 'inspect_search_results');

    const resultInputs = await page.$$eval('input, select', els =>
      els.map(e => ({ tag: e.tagName, name: e.name, id: e.id, type: e.type, placeholder: e.placeholder }))
    );
    info('Result fields: ' + JSON.stringify(resultInputs, null, 2));
    fs.writeFileSync(path.join(SHOT_DIR, 'field_names.json'), JSON.stringify(resultInputs, null, 2));
    info(`Field names saved to ${path.join(SHOT_DIR, 'field_names.json')}`);
  } catch (e) {
    warn('Inspection search failed: ' + e.message);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  info(`Starting player ranking updates. Total players: ${PLAYERS.length}`);
  info(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}, headless: ${HEADLESS}, start index: ${startIdx}`);

  const progress = loadProgress();
  const browser  = await chromium.launch({ headless: HEADLESS, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context  = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page     = await context.newPage();

  try {
    await login(page);

    // Run inspection pass on first player to learn the field names
    if (startIdx === 0) {
      await inspectFields(page, PLAYERS[0]);
    }

    let successCount = 0;
    let skipCount    = 0;
    let failCount    = 0;

    for (let i = startIdx; i < PLAYERS.length; i++) {
      const player = PLAYERS[i];
      const key    = `${player.first}_${player.last}`;

      if (progress.completed.includes(key)) {
        info(`Skipping already completed: ${key}`);
        skipCount++;
        continue;
      }

      try {
        const result = await updatePlayer(page, player, i);
        if (result.status === 'ok') {
          progress.completed.push(key);
          successCount++;
        } else {
          progress.failed.push({ key, reason: result.status });
          failCount++;
        }
        saveProgress(progress);
      } catch (err) {
        error(`Failed on ${player.first} ${player.last}: ${err.message}`);
        await screenshot(page, `${String(i + 1).padStart(3, '0')}_${player.last}_ERROR`);
        progress.failed.push({ key, reason: err.message });
        failCount++;
        saveProgress(progress);
        // Re-login if session expired
        if (err.message.includes('login') || err.message.includes('session')) {
          await login(page);
        }
      }

      // Brief pause between players to avoid hammering the server
      await page.waitForTimeout(500);
    }

    info(`\n=== Done ===`);
    info(`Success: ${successCount}, Skipped: ${skipCount}, Failed: ${failCount}`);
    if (progress.failed.length > 0) {
      info(`Failed players saved to ${PROG_FILE}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  error('Fatal: ' + err.message);
  process.exit(1);
});
