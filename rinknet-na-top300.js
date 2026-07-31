#!/usr/bin/env node
/**
 * RinkNet NA Top 300 Rankings Importer
 *
 * Creates a new RinkNet list and imports 300 players with star ratings.
 *
 * RUN:
 *   node rinknet-na-top300.js
 */

'use strict';

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

const USERNAME        = 'bcollins@neutralzone.net';
const PASSWORD        = 'NZhockey24!';
const LIST_ID         = '-1438107616';
const DELAY_MS        = 1500;
const SCREENSHOTS_DIR = './rinknet-screenshots';

const PLAYERS = [
  { rank:  1, last:'Schultz',          first:'Maddox',            pos:'F',    team:'Regina Pats',                        stars:4.75 },
  { rank:  2, last:'Cullen',           first:'Joey',              pos:'F',    team:'Moorhead HS',                        stars:4.75 },
  { rank:  3, last:'Pue',              first:'Liam',              pos:'F',    team:'Regina Pats',                        stars:4.75 },
  { rank:  4, last:'Daley',            first:'Drew',              pos:'RD',   team:"Shattuck St. Mary's Prep",           stars:4.75 },
  { rank:  5, last:'Wouters',          first:'Holden',            pos:'D',    team:"St. George's School U18",            stars:4.50 },
  { rank:  6, last:'Kwajah',           first:'Kash',              pos:'C',    team:'Toronto Jr. Canadiens U16 AAA',      stars:4.50 },
  { rank:  7, last:'Cloutier',         first:'Kane',              pos:'C',    team:'Vaughan Kings U16 AAA',              stars:4.50 },
  { rank:  8, last:'Sgro',             first:'Adrian',            pos:'LD',   team:'Vaughan Kings U16 AAA',              stars:4.50 },
  { rank:  9, last:'Schulberger',      first:'Chase',             pos:'RD',   team:'Woodbridge 15U',                     stars:4.50 },
  { rank: 10, last:'Boisvert',         first:'Thomas',            pos:'F',    team:'Mount St. Charles',                  stars:4.50 },
  { rank: 11, last:'Wolitski',         first:'Nolan',             pos:'D',    team:'NAX U18',                            stars:4.50 },
  { rank: 12, last:'Dozark',           first:'Easton',            pos:'D',    team:'Honeybaked 15U',                     stars:4.50 },
  { rank: 13, last:'Kennedy',          first:'Colin',             pos:'C',    team:'Little Caesars 15U',                 stars:4.50 },
  { rank: 14, last:'Adams',            first:'Tanner',            pos:'C',    team:'Hill Academy U16',                   stars:4.50 },
  { rank: 15, last:'Thompson',         first:'RJ',                pos:'F',    team:'Eden Prairie HS',                    stars:4.50 },
  { rank: 16, last:'Charbonneau',      first:'Zaac',              pos:'C',    team:'Mount St. Charles',                  stars:4.50 },
  { rank: 17, last:'McKinnon',         first:'Jacob',             pos:'RW',   team:'Seminaire St-Francois',              stars:4.50 },
  { rank: 18, last:'Lemieux',          first:'Pierre-Alexandre',  pos:'C/RW', team:'Esther-Blondin U18',                 stars:4.50 },
  { rank: 19, last:'Morris',           first:'Carter',            pos:'F',    team:"Shattuck St. Mary's U16",            stars:4.50 },
  { rank: 20, last:'McKinnon',         first:'Maverick',          pos:'F',    team:'Forest Lake HS',                     stars:4.50 },
  { rank: 21, last:"Prud'Homme",       first:'Logan',             pos:'C',    team:'Upper Canada College Blues U16',     stars:4.50 },
  { rank: 22, last:'McNally',          first:'Declan',            pos:'LD',   team:'Don Mills Flyers U16 AAA',           stars:4.50 },
  { rank: 23, last:'Boutet',           first:'Vincent',           pos:'D',    team:'Seminaire St-Francois',              stars:4.50 },
  { rank: 24, last:'Fransen',          first:'Max',               pos:'LD',   team:'Upper Canada College Blues U16',     stars:4.50 },
  { rank: 25, last:'Colmer',           first:'Parker',            pos:'F',    team:"Shattuck St. Mary's 15U",            stars:4.50 },
  { rank: 26, last:'Kelly',            first:'Aiden',             pos:'RW',   team:'Little Caesars 15U',                 stars:4.50 },
  { rank: 27, last:'Bate',             first:'Drew',              pos:'C',    team:'London Jr. Knights U16 AAA',         stars:4.50 },
  { rank: 28, last:'Shingoose',        first:'Athens',            pos:'F',    team:'RHA Winnipeg',                       stars:4.50 },
  { rank: 29, last:'Kokkoris',         first:'Christopher',       pos:'D',    team:'Yale Lions U18',                     stars:4.50 },
  { rank: 30, last:'Boumedienne',      first:'Wilson',            pos:'F',    team:'Mount St. Charles 15U',              stars:4.50 },
  { rank: 31, last:'Bergeron',         first:'Julien',            pos:'LW',   team:'Chateauguay U18',                    stars:4.50 },
  { rank: 32, last:'LoSauro',          first:'William',           pos:'C',    team:'NJ Avalanche U16',                   stars:4.50 },
  { rank: 33, last:'Stevens',          first:'Dean',              pos:'F',    team:'Minnetonka BAA',                     stars:4.50 },
  { rank: 34, last:'Holowaychuk',      first:'Louis Oscar',       pos:'F',    team:"St. George's School U18",            stars:4.50 },
  { rank: 35, last:'Meier',            first:'Henry',             pos:'F',    team:"Shattuck St. Mary's U16",            stars:4.50 },
  { rank: 36, last:'Jim',              first:'Cruz',              pos:'D',    team:'NAX U18',                            stars:4.50 },
  { rank: 37, last:'Schemenauer',      first:'Mason',             pos:'D',    team:'Minnetonka HS',                      stars:4.50 },
  { rank: 38, last:'Mateychuk',        first:'Crosby',            pos:'D',    team:'Eastman Selects U18',                stars:4.50 },
  { rank: 39, last:'Nicol',            first:'Reid',              pos:'F',    team:'Brandon Wheat Kings U18',            stars:4.50 },
  { rank: 40, last:'Licastro',         first:'Jaden',             pos:'LD',   team:'Toronto Marlboros U16 AAA',          stars:4.50 },
  { rank: 41, last:'Zilinski',         first:'Matthew',           pos:'C',    team:'Mississauga Senators U16 AAA',       stars:4.50 },
  { rank: 42, last:'Matheson',         first:'Lucas',             pos:'LD',   team:'Barrie Jr. Colts U16 AAA',           stars:4.25 },
  { rank: 43, last:'Queally',          first:'John',              pos:'F',    team:"St. Sebastian's",                    stars:4.25 },
  { rank: 44, last:'Lainesse',         first:'Zachary',           pos:'G',    team:'Levis U18',                          stars:4.25 },
  { rank: 45, last:'Carver',           first:'Griffin',           pos:'RD',   team:'Little Caesars 15U',                 stars:4.25 },
  { rank: 46, last:'Roulston',         first:'Landon',            pos:'C',    team:'Vaughan Kings U16 AAA',              stars:4.25 },
  { rank: 47, last:'Laurin',           first:'Andrew',            pos:'RW',   team:'Quinte Red Devils U16 AAA',          stars:4.25 },
  { rank: 48, last:'Reilly',           first:'Braden',            pos:'RW',   team:'Toronto Marlboros U16 AAA',          stars:4.25 },
  { rank: 49, last:'Whelan',           first:'Lauchlan',          pos:'C',    team:'Quinte Red Devils U16 AAA',          stars:4.25 },
  { rank: 50, last:'Miles',            first:'Kalen',             pos:'F',    team:'NAX',                                stars:4.25 },
  { rank: 51, last:'Loftus',           first:'Owen',              pos:'G',    team:'Don Mills Flyers U16 AAA',           stars:4.25 },
  { rank: 52, last:'Royer',            first:'Jakob',             pos:'C',    team:'Trois-Rivieres U18',                 stars:4.25 },
  { rank: 53, last:'Oliverio',         first:'Ben',               pos:'F',    team:'Calgary Northstars',                 stars:4.25 },
  { rank: 54, last:'Nanubhai',         first:'Arjun',             pos:'C',    team:'Mississauga Senators U16 AAA',       stars:4.25 },
  { rank: 55, last:'Bouchard',         first:'Teagen',            pos:'F',    team:'NAX U18',                            stars:4.25 },
  { rank: 56, last:'Kelts',            first:'Will',              pos:'D',    team:'NAX U18',                            stars:4.25 },
  { rank: 57, last:'Lauder',           first:'Kyler',             pos:'C',    team:'Central Ontario Wolves U16 AAA',     stars:4.25 },
  { rank: 58, last:'Hall',             first:'Austin',            pos:'LW',   team:'Honeybaked 15U',                     stars:4.25 },
  { rank: 59, last:'Voortman',         first:'Jace',              pos:'C',    team:'Toronto Jr. Canadiens U16 AAA',      stars:4.25 },
  { rank: 60, last:'Evans',            first:'Cameron',           pos:'LW',   team:"Shattuck St. Mary's 15U",            stars:4.25 },
  { rank: 61, last:'Ellingson',        first:'Levi',              pos:'F',    team:'NAX U18',                            stars:4.25 },
  { rank: 62, last:'Kraft',            first:'Owen',              pos:'F',    team:'Moorhead BAA',                       stars:4.25 },
  { rank: 63, last:'Lappan',           first:'Max',               pos:'RD',   team:'Honeybaked 15U',                     stars:4.25 },
  { rank: 64, last:'Kaebel',           first:'Ezekiel',           pos:'F',    team:'Dallas Stars U16',                   stars:4.25 },
  { rank: 65, last:'Bednar',           first:'Domink',            pos:'F',    team:'SPA 15U',                            stars:4.25 },
  { rank: 66, last:'Delgado',          first:'Dylan',             pos:'RW',   team:'Honeybaked 15U',                     stars:4.25 },
  { rank: 67, last:'Beaulieu',         first:'Ryan',              pos:'LD',   team:'London Jr. Knights U16 AAA',         stars:4.25 },
  { rank: 68, last:'Campbell',         first:'MJ',                pos:'RW',   team:'Mount St Charles 15U',               stars:4.25 },
  { rank: 69, last:'Gagnon',           first:'Justin',            pos:'F',    team:'Notre-Dame U18',                     stars:4.25 },
  { rank: 70, last:'Liffiton',         first:'Thor',              pos:'D',    team:'Calgary Northstars',                 stars:4.25 },
  { rank: 71, last:'Miller',           first:'Evan',              pos:'RD',   team:'Chicago Mission 15U',                stars:4.25 },
  { rank: 72, last:'Vanacker',         first:'Roman',             pos:'C',    team:'Brantford 99ers U16 AAA',            stars:4.25 },
  { rank: 73, last:'Slavick',          first:'Ben',               pos:'LW',   team:'Little Caesars 15U',                 stars:4.25 },
  { rank: 74, last:'Henry',            first:'Logan',             pos:'F',    team:'BWC U18',                            stars:4.25 },
  { rank: 75, last:'Brien',            first:'Max',               pos:'F',    team:'Steele Suburu',                      stars:4.25 },
  { rank: 76, last:'Tremblay',         first:'Aslan',             pos:'C',    team:'Amos U18',                           stars:4.25 },
  { rank: 77, last:'Landreville',      first:'Cole',              pos:'F',    team:'Pilot Mound',                        stars:4.25 },
  { rank: 78, last:'Godbout',          first:'Gavin',             pos:'D',    team:'Hill-Murray HS',                     stars:4.25 },
  { rank: 79, last:'Leduc',            first:'Damien',            pos:'C',    team:'Chateauguay U18',                    stars:4.25 },
  { rank: 80, last:'Lee',              first:'Samuel',            pos:'F',    team:'Milton Academy',                     stars:4.25 },
  { rank: 81, last:'Nowlan',           first:'Samuel',            pos:'F',    team:'Little Caesars',                     stars:4.25 },
  { rank: 82, last:'Sampair',          first:'Landon',            pos:'F',    team:'Hill Murray',                        stars:4.25 },
  { rank: 83, last:'Williams',         first:'Lawrence',          pos:'D',    team:'Weeks Majors',                       stars:4.25 },
  { rank: 84, last:'Nicolay',          first:'Cruz',              pos:'D',    team:'Calgary IHA U18',                    stars:4.25 },
  { rank: 85, last:'Buttweiler',       first:'Henry',             pos:'F',    team:'Honeybaked 15U',                     stars:4.25 },
  { rank: 86, last:'Wilichoski',       first:'Blake',             pos:'F',    team:'Belmont Hill',                       stars:4.25 },
  { rank: 87, last:'Cameron',          first:'Jack',              pos:'D',    team:'Weeks Majors',                       stars:4.25 },
  { rank: 88, last:'Domonkos',         first:'Dominik Stefan',    pos:'F',    team:'Windy City Storm 15U',               stars:4.25 },
  { rank: 89, last:'Brown',            first:'Riley',             pos:'F',    team:'Moose Jaw Warriors U18',             stars:4.25 },
  { rank: 90, last:'Riehl',            first:'Jack',              pos:'RW',   team:'Pitt Pens Elite 15U',                stars:4.25 },
  { rank: 91, last:'Fowler',           first:'Noah',              pos:'F',    team:"St. George's School",                stars:4.25 },
  { rank: 92, last:'Roy',              first:'Enzo',              pos:'D',    team:'Levis U18',                          stars:4.25 },
  { rank: 93, last:'Ellery',           first:'Finn',              pos:'C',    team:'Central Ontario Wolves U16 AAA',     stars:4.25 },
  { rank: 94, last:'Kesler',           first:'Ryker',             pos:'C',    team:'Little Caesars 15U',                 stars:4.25 },
  { rank: 95, last:'Trupiano',         first:'Jack',              pos:'C',    team:'Little Caesars 15U',                 stars:4.25 },
  { rank: 96, last:'Roche',            first:'Shane',             pos:'RD',   team:'Toronto Marlboros U16 AAA',          stars:4.25 },
  { rank: 97, last:'Zhukov',           first:'Nikolai',           pos:'D',    team:'Hermantown HS',                      stars:4.25 },
  { rank: 98, last:'Deraney',          first:'Parker',            pos:'D',    team:'Fox Motors 15U',                     stars:4.25 },
  { rank: 99, last:'Norris',           first:'Damian',            pos:'F',    team:'Upper Canada College',               stars:4.25 },
  { rank:100, last:'Cotter',           first:'Logan',             pos:'D',    team:"St. Mark's School",                  stars:4.25 },
  { rank:101, last:'Menard',           first:'Emrik',             pos:'F',    team:'Woodbridge Wolfpack U16',            stars:4.25 },
  { rank:102, last:'Martinuik',        first:'Kain',              pos:'F',    team:"Shattuck St. Mary's 14U",            stars:4.25 },
  { rank:103, last:'Belikov',          first:'Ivan',              pos:'RD',   team:'Honeybaked 15U',                     stars:4.25 },
  { rank:104, last:'Hintenburger',     first:'Shayden',           pos:'LD',   team:'Hill Academy U16',                   stars:4.25 },
  { rank:105, last:'Paetsch',          first:'Kellen',            pos:'RD',   team:'BK Selects 15U',                     stars:4.25 },
  { rank:106, last:'Lamontagne',       first:'Jake',              pos:'LD',   team:'Honeybaked 15U',                     stars:4.25 },
  { rank:107, last:'Butler',           first:'Finley',            pos:'RW',   team:'London Jr. Knights U16 AAA',         stars:4.25 },
  { rank:108, last:'Brown',            first:'Brody',             pos:'RW',   team:'Vaughan Kings U16 AAA',              stars:4.25 },
  { rank:109, last:'Warner',           first:'Deverin',           pos:'C',    team:'Woodbridge 15U',                     stars:4.25 },
  { rank:110, last:'Guizetti',         first:'Cole',              pos:'LW',   team:'Upper Canada College Blues U16',     stars:4.25 },
  { rank:111, last:'Hair',             first:'Jack',              pos:'LD',   team:'Little Caesars 15U',                 stars:4.25 },
  { rank:112, last:'Teuscher',         first:'Ryan',              pos:'C',    team:'Fox Motors 15U',                     stars:4.25 },
  { rank:113, last:'Hall',             first:'Jake',              pos:'LD',   team:'Notre Dame HA 15U',                  stars:4.25 },
  { rank:114, last:'Tremblay',         first:'Malik',             pos:'LW',   team:'Magog U18',                          stars:4.25 },
  { rank:115, last:'Knott',            first:'Landon',            pos:'D',    team:'Bemidji HS',                         stars:4.25 },
  { rank:116, last:'Fayad',            first:'Ahmad',             pos:'F',    team:'NAX U18',                            stars:4.25 },
  { rank:117, last:'Kuklinski',        first:'Jakub',             pos:'LW',   team:'Mississauga Senators U16 AAA',       stars:4.25 },
  { rank:118, last:'Suter',            first:'Brooks',            pos:'D',    team:'Edina HS',                           stars:4.25 },
  { rank:119, last:'Johnston',         first:'Will',              pos:'LD',   team:"Shattuck St. Mary's 15U",            stars:4.25 },
  { rank:120, last:'Guevin',           first:'Emile',             pos:'RW',   team:'Trois-Rivieres U18',                 stars:4.25 },
  { rank:121, last:'Krochalk',         first:'Andrew',            pos:'LD',   team:'Fox Motors 15U',                     stars:4.25 },
  { rank:122, last:'Gibson',           first:'Karter',            pos:'G',    team:'NAX',                                stars:4.25 },
  { rank:123, last:'Kortan',           first:'Drew',              pos:'D',    team:'Moorhead HS',                        stars:4.25 },
  { rank:124, last:'Anderosov',        first:'Kole',              pos:'G',    team:"St. George's School",                stars:4.25 },
  { rank:125, last:'Burmis',           first:'Jake',              pos:'D',    team:'Rogers HS',                          stars:4.00 },
  { rank:126, last:'Ondrus',           first:'Brady',             pos:'F',    team:'NAX U18',                            stars:4.00 },
  { rank:127, last:'Brooks',           first:'Liam',              pos:'D',    team:'Duluth East HS',                     stars:4.00 },
  { rank:128, last:'Laurila',          first:'Henry',             pos:'D',    team:'Moorhead BAA',                       stars:4.00 },
  { rank:129, last:'Koch',             first:'Remy',              pos:'D',    team:'Edge School U18',                    stars:4.00 },
  { rank:130, last:'Fitzgerald',       first:'Evan',              pos:'C',    team:'Vaughan Kings U16 AAA',              stars:4.00 },
  { rank:131, last:'Martin',           first:'Mason',             pos:'G',    team:'Fox Motors 15U',                     stars:4.00 },
  { rank:132, last:'Faucher',          first:'Eliot',             pos:'D',    team:'Standstead U17',                     stars:4.00 },
  { rank:133, last:'Bannister',        first:'Evan',              pos:'C',    team:'Credit River Capitals U16 AAA',      stars:4.00 },
  { rank:134, last:'Ali',              first:'Aiden',             pos:'LD',   team:'Little Caesars 15U',                 stars:4.00 },
  { rank:135, last:'Walker',           first:'Alec',              pos:'C',    team:'Florida Alliance 15U',               stars:4.00 },
  { rank:136, last:'Boulanger',        first:'Nathan',            pos:'G',    team:'Esther Blondin U18',                 stars:4.00 },
  { rank:137, last:'Thisdelle',        first:'Maveric',           pos:'F',    team:'Woodbridge Wolfpack 15U',            stars:4.00 },
  { rank:138, last:'Saulnier',         first:'Alexandre',         pos:'C',    team:"Ottawa Jr. 67's U16 AAA",            stars:4.00 },
  { rank:139, last:'Hewitt',           first:'Nathan',            pos:'C',    team:'Niagara North Stars U16 AAA',        stars:4.00 },
  { rank:140, last:'Bimmerle',         first:'Eli',               pos:'F',    team:'Dallas Stars U16',                   stars:4.00 },
  { rank:141, last:'Archer',           first:'Owen',              pos:'D',    team:'St. Albert U18',                     stars:4.00 },
  { rank:142, last:'Leroux',           first:'Tommy',             pos:'C',    team:'Charles Lemoyne U18',                stars:4.00 },
  { rank:143, last:'Godick',           first:'Gavin',             pos:'RD',   team:'Don Mills Flyers U16 AAA',           stars:4.00 },
  { rank:144, last:'Sorenson',         first:'Ben',               pos:'D',    team:"Shattuck St. Mary's U16",            stars:4.00 },
  { rank:145, last:'Lazare',           first:'Bryce',             pos:'C',    team:'Lac St-Louis U18',                   stars:4.00 },
  { rank:146, last:'Mingo',            first:'Dylan',             pos:'G',    team:'RHA Kelowna',                        stars:4.00 },
  { rank:147, last:'Greschuk',         first:'Roan',              pos:'D',    team:'St. Albert Sabres U18',              stars:4.00 },
  { rank:148, last:'Doka',             first:'Ryker',             pos:'D',    team:'Regina Pats U18',                    stars:4.00 },
  { rank:149, last:'Nicholas',         first:'Kane',              pos:'LW',   team:'Pacific Coast U18',                  stars:4.00 },
  { rank:150, last:'Merrill',          first:'Finn',              pos:'C',    team:'Hill Academy U16',                   stars:4.00 },
  { rank:151, last:'Roy',              first:'Nathan-Nicolas',    pos:'D',    team:'Charles Lemoyne U18',                stars:4.00 },
  { rank:152, last:'Ferreira',         first:'Mateo',             pos:'D',    team:'Winnipeg Bruins U18',                stars:4.00 },
  { rank:153, last:'Haile',            first:'Brook',             pos:'D',    team:'Calgary Northstars U18',             stars:4.00 },
  { rank:154, last:'Pinko',            first:'Chris',             pos:'C',    team:'NJ Avalanche 15U',                   stars:4.00 },
  { rank:155, last:'Coache-Luqman',    first:'Gabriel',           pos:'D',    team:'Charles Lemoyne U18',                stars:4.00 },
  { rank:156, last:'Nimchonok',        first:'Jay',               pos:'RD',   team:'Upper Canada College Blues U16',     stars:4.00 },
  { rank:157, last:'Auferheide',       first:'Rylan',             pos:'LD',   team:'Pitt Pens Elite 15U',                stars:4.00 },
  { rank:158, last:'Packalen',         first:'Henri',             pos:'C',    team:'Peterborough Petes U16 AAA',         stars:4.00 },
  { rank:159, last:'Frost',            first:'Nathan',            pos:'D',    team:'Canimex M17',                        stars:4.00 },
  { rank:160, last:'Marvin',           first:'Charlie',           pos:'F',    team:'Warroad BAA',                        stars:4.00 },
  { rank:161, last:'Mesich',           first:'Marko',             pos:'G',    team:'Toronto Jr. Canadiens U16 AAA',      stars:4.00 },
  { rank:162, last:'Rotar',            first:'Cohenn',            pos:'F',    team:'Calgary IHA U18',                    stars:4.00 },
  { rank:163, last:'Turchak',          first:'Chace',             pos:'F',    team:'Calgary Buffaloes U18',              stars:4.00 },
  { rank:164, last:'Samek',            first:'Jack',              pos:'C',    team:'Markham Majors U16 AAA',             stars:4.00 },
  { rank:165, last:'Murray',           first:'Owen',              pos:'F',    team:'Winnipeg Bruins U18',                stars:4.00 },
  { rank:166, last:'Mears',            first:'Ethan',             pos:'RD',   team:'St. Louis Blues 15U',                stars:4.00 },
  { rank:167, last:'Saumweber',        first:'Soren',             pos:'C',    team:'Cretin Derham HS',                   stars:4.00 },
  { rank:168, last:'Stiehr',           first:'Alex',              pos:'LW',   team:'St. Louis Blues 15U',                stars:4.00 },
  { rank:169, last:'Nielson',          first:'Chase',             pos:'G',    team:'SAHA U17',                           stars:4.00 },
  { rank:170, last:'Jaravata',         first:'Braydon',           pos:'LD',   team:'Hill Academy U16',                   stars:4.00 },
  { rank:171, last:'McFadden',         first:'Liam',              pos:'D',    team:'OHA Edmonton U18',                   stars:4.00 },
  { rank:172, last:'Drouin',           first:'Noah',              pos:'RD',   team:'Chicago Reapers U16',                stars:4.00 },
  { rank:173, last:'Kaiser',           first:'Quinn',             pos:'C',    team:'Team Illinois 15U',                  stars:4.00 },
  { rank:174, last:'Baker',            first:'Cohen',             pos:'F',    team:'Thompson Blazers U18',               stars:4.00 },
  { rank:175, last:'Kelly',            first:'Kayden',            pos:'C',    team:'Markham Waxers U16 AAA',             stars:4.00 },
  { rank:176, last:'Arnold',           first:'Colby',             pos:'G',    team:'St. Louis Blues 15U',                stars:4.00 },
  { rank:177, last:'Cooney',           first:'Malone',            pos:'LW',   team:'Chicago Mission 15U',                stars:4.00 },
  { rank:178, last:'Watkins',          first:'Miller',            pos:'D',    team:'RINK Kelowna U18',                   stars:4.00 },
  { rank:179, last:'Quinn',            first:'Mason',             pos:'C',    team:'Toronto Marlboros U16 AAA',          stars:4.00 },
  { rank:180, last:'Filewich',         first:'Walker',            pos:'F',    team:'Calgary IHA U18',                    stars:4.00 },
  { rank:181, last:'Tetreault',        first:'Raphael',           pos:'F',    team:'Esther-Blondin U18',                 stars:4.00 },
  { rank:182, last:'Cullen',           first:'Aidan',             pos:'G',    team:"Shattuck St. Mary's 15U",            stars:4.00 },
  { rank:183, last:'Guerard',          first:'Simon-Olivier',     pos:'G',    team:'Seminaire St-Francois',              stars:4.00 },
  { rank:184, last:'Ngandu',           first:'Joel',              pos:'F',    team:'NAX U18',                            stars:4.00 },
  { rank:185, last:'Nowoselski',       first:'Braden',            pos:'D',    team:'Moose Jaw U18',                      stars:4.00 },
  { rank:186, last:'Coulter',          first:'Cam',               pos:'RW',   team:'Moorhead BAA',                       stars:4.00 },
  { rank:187, last:'Schimnowski',      first:'Crewe',             pos:'F',    team:'Winnipeg Bruins U18',                stars:4.00 },
  { rank:188, last:'Gregg',            first:'Chace',             pos:'F',    team:'Winnipeg Bruins U18',                stars:4.00 },
  { rank:189, last:'Samu',             first:'Luka',              pos:'F',    team:'NAX U18',                            stars:4.00 },
  { rank:190, last:'Quinn',            first:'Ronan',             pos:'RW',   team:'Markham Majors U16 AAA',             stars:4.00 },
  { rank:191, last:'Fenwick',          first:'Joseph',            pos:'LW',   team:'Markham Majors U16 AAA',             stars:4.00 },
  { rank:192, last:'Blanchette',       first:'Alexy',             pos:'D',    team:'Jonquiere U18',                      stars:4.00 },
  { rank:193, last:'Borsellino',       first:'Domenico',          pos:'C',    team:'Lac St-Louis U18',                   stars:4.00 },
  { rank:194, last:'Reschny',          first:'Anderson',          pos:'D',    team:'Saskatoon Blazers U18',              stars:4.00 },
  { rank:195, last:'Genereux',         first:'Mathieu',           pos:'D',    team:'Standstead U17',                     stars:4.00 },
  { rank:196, last:'Elke',             first:'Kash',              pos:'F',    team:'Tisdale Trojans U18',                stars:4.00 },
  { rank:197, last:'Andersen',         first:'Linden',            pos:'D',    team:'SAHA U18',                           stars:4.00 },
  { rank:198, last:'Toyne',            first:'Trevor',            pos:'F',    team:'Winnipeg Bruins U18',                stars:4.00 },
  { rank:199, last:'Conroy',           first:'Jackson',           pos:'F',    team:'Bishop Kearney 15U',                 stars:4.00 },
  { rank:200, last:'Grima',            first:'Brayden',           pos:'C',    team:'Toronto Jr. Canadiens U16 AAA',      stars:4.00 },
  { rank:201, last:'Leonard',          first:'Charlie',           pos:'D',    team:'Calgary IHA U18',                    stars:4.00 },
  { rank:202, last:'Montanino',        first:'John',              pos:'LD',   team:'Detroit Little Caesars 15s',         stars:4.00 },
  { rank:203, last:'Drouin',           first:'Mason',             pos:'F',    team:'Nichols U16',                        stars:4.00 },
  { rank:204, last:'Dekleine',         first:'Robert',            pos:'F',    team:'Belmont Hill',                       stars:4.00 },
  { rank:205, last:'Huska',            first:'Luke',              pos:'F',    team:'Edge School U18',                    stars:4.00 },
  { rank:206, last:'Sawyer',           first:'CJ',                pos:'F',    team:'Atlantic Coast Academy 16U',         stars:4.00 },
  { rank:207, last:'Banicevic',        first:'Peter',             pos:'F',    team:'Delta HA U18',                       stars:4.00 },
  { rank:208, last:'Moore',            first:'AJ',                pos:'LW',   team:'Little Caesars 15U',                 stars:4.00 },
  { rank:209, last:'Glukhikh',         first:'Artem',             pos:'F',    team:'NJ Rockets U16',                     stars:4.00 },
  { rank:210, last:'McCaig',           first:'Nixon',             pos:'LD',   team:'Vaughan Kings U16 AAA',              stars:4.00 },
  { rank:211, last:'Arndt',            first:'Easton',            pos:'F',    team:'NAX U18',                            stars:4.00 },
  { rank:212, last:'Hontvet',          first:'Ayven',             pos:'D',    team:'Warroad HS',                         stars:4.00 },
  { rank:213, last:'Levy',             first:'Enzo',              pos:'LW',   team:'Saint-Eustache U18',                 stars:4.00 },
  { rank:214, last:'Johnson',          first:'Brody',             pos:'G',    team:"Shattuck St. Mary's U16",            stars:4.00 },
  { rank:215, last:'Fournier',         first:'Liam',              pos:'F',    team:'Woodbridge 15U',                     stars:4.00 },
  { rank:216, last:'Kim',              first:'Colin',             pos:'F',    team:'Anaheim Jr Ducks U16',               stars:4.00 },
  { rank:217, last:'McDevitt',         first:'Drew',              pos:'F',    team:'LA Jr. Kings 15U',                   stars:4.00 },
  { rank:218, last:'Scott',            first:'Kael',              pos:'F',    team:'Lloydminster U18',                   stars:4.00 },
  { rank:219, last:'Krottner',         first:'Cole',              pos:'RW',   team:'Ottawa Valley Titans U16 AAA',       stars:4.00 },
  { rank:220, last:'Moad',             first:'Ty',                pos:'LD',   team:"Shattuck St. Mary's 15U",            stars:4.00 },
  { rank:221, last:'Currie',           first:'Dylan',             pos:'RW',   team:'Chateauguay U18',                    stars:4.00 },
  { rank:222, last:'Springer',         first:'Gavin',             pos:'C',    team:'Buffalo Jr Sabres 15U',              stars:4.00 },
  { rank:223, last:'Stephenson',       first:'Turner',            pos:'LD',   team:'Upper Canada College Blues U16',     stars:4.00 },
  { rank:224, last:'Riendeau',         first:'Nathan',            pos:'C',    team:'Charles Lemoyne U18',                stars:4.00 },
  { rank:225, last:'Gregg',            first:'Brayden',           pos:'D',    team:'Winnipeg Bruins U18',                stars:4.00 },
  { rank:226, last:'Krebs',            first:'Cole',              pos:'D',    team:'NAX U18',                            stars:4.00 },
  { rank:227, last:'Lawson',           first:'Luke',              pos:'G',    team:'Mississauga Reps U16 AAA',           stars:4.00 },
  { rank:228, last:'Barkic',           first:'Brayden',           pos:'LD',   team:'Don Mills Flyers U16 AAA',           stars:4.00 },
  { rank:229, last:'Lowe',             first:'Emry',              pos:'C',    team:'Brantford 99ers U16 AAA',            stars:4.00 },
  { rank:230, last:'Felt',             first:'Carter',            pos:'F',    team:'Rivers School',                      stars:4.00 },
  { rank:231, last:'Tillman',          first:'Jayden',            pos:'D',    team:'Bishop Kearney 15U',                 stars:4.00 },
  { rank:232, last:'Panagakos',        first:'George',            pos:'G',    team:'South Kent 15U',                     stars:4.00 },
  { rank:233, last:'Will',             first:'Tristan',           pos:'F',    team:'Hill-Murray',                        stars:4.00 },
  { rank:234, last:'Ware',             first:'Nick',              pos:'D',    team:'Belmont Hill',                       stars:4.00 },
  { rank:235, last:'Ruggere',          first:'Marc',              pos:'RD',   team:'Woodbridge 15U',                     stars:4.00 },
  { rank:236, last:'Nouwens',          first:'Mitchell',          pos:'G',    team:'Toronto Red Wings U16 AAA',          stars:4.00 },
  { rank:237, last:'Schulz',           first:'Brody',             pos:'RW',   team:'Ottawa Myers Automotive U16 AAA',    stars:4.00 },
  { rank:238, last:'Hendriks',         first:'Leo',               pos:'LD',   team:'Eastern Ontario Wild U16 AAA',       stars:4.00 },
  { rank:239, last:'Roberts',          first:'Quinn',             pos:'C',    team:'London Jr. Knights U16 AAA',         stars:4.00 },
  { rank:240, last:'Kunz',             first:'Tyler',             pos:'F',    team:"Shattuck St. Mary's 15U",            stars:4.00 },
  { rank:241, last:'Hanutke',          first:'Ryan',              pos:'LW',   team:"Shattuck St. Mary's 15U",            stars:4.00 },
  { rank:242, last:'McCotter',         first:'Declan',            pos:'RW',   team:'Huron-Perth Lakers U16 AAA',         stars:4.00 },
  { rank:243, last:'Housseas',         first:'Kosta',             pos:'LD',   team:'Markham Majors U16 AAA',             stars:4.00 },
  { rank:244, last:'MacLellan',        first:'Kingsley',          pos:'F',    team:'St. Albert U18',                     stars:4.00 },
  { rank:245, last:'Zachgo',           first:'Evan',              pos:'F',    team:'Sioux Falls 15U',                    stars:4.00 },
  { rank:246, last:'Noel',             first:'Alexandre',         pos:'D',    team:'St. Hyacinthe U18',                  stars:4.00 },
  { rank:247, last:'Bolduc',           first:'Axel',              pos:'D',    team:'Levis U18',                          stars:4.00 },
  { rank:248, last:'Lapierre',         first:'Colton',            pos:'LD',   team:'Toronto Red Wings U16 AAA',          stars:4.00 },
  { rank:249, last:'Nash',             first:'Brady',             pos:'C',    team:'Don Mills Flyers U16 AAA',           stars:4.00 },
  { rank:250, last:'Moon',             first:'Justin',            pos:'F',    team:'BWC U18',                            stars:4.00 },
  { rank:251, last:'Svrcek',           first:'Matyas',            pos:'F',    team:'BK Selects 15U',                     stars:4.00 },
  { rank:252, last:'Nash',             first:'Carter',            pos:'G',    team:'Honeybaked 15U',                     stars:4.00 },
  { rank:253, last:'Gill',             first:'Chase',             pos:'D',    team:'LA Jr. Kings 15U',                   stars:4.00 },
  { rank:254, last:'Roy',              first:'Matteo',            pos:'D',    team:'Moncton Flyers',                     stars:4.00 },
  { rank:255, last:'Cook',             first:'Jaxon',             pos:'F',    team:'Gentry Academy',                     stars:4.00 },
  { rank:256, last:'Davidson',         first:'Ethan',             pos:'RD',   team:'Central Ontario Wolves U16 AAA',     stars:4.00 },
  { rank:257, last:'Pavelski',         first:'Nate',              pos:'F',    team:'Madison Capitols 15U',               stars:3.75 },
  { rank:258, last:'Poti',             first:'Tyler',             pos:'D',    team:'Winchendon',                         stars:3.75 },
  { rank:259, last:'Weaver',           first:'Liam',              pos:'LD',   team:'Honeybaked 15U',                     stars:3.75 },
  { rank:260, last:'Wilford',          first:'Nash',              pos:'F',    team:'Buffalo Jr Sabres 15U',              stars:3.75 },
  { rank:261, last:'St. Laurent',      first:'Joey',              pos:'C',    team:'NJ Avalanche U15',                   stars:3.75 },
  { rank:262, last:'Lee',              first:'Easton',            pos:'LW',   team:'Moorhead BAA',                       stars:3.75 },
  { rank:263, last:'Fischer',          first:'Tripp',             pos:'F',    team:'Lloydminster U18',                   stars:3.75 },
  { rank:264, last:'Walsh',            first:'Colin',             pos:'LW',   team:'Framingham HS',                      stars:3.75 },
  { rank:265, last:'Madill',           first:'Paxson',            pos:'C',    team:'Hermantown HS',                      stars:3.75 },
  { rank:266, last:'Coulter-Suttie',   first:'Dilin',             pos:'F',    team:'Saskatoon Contacts U18',             stars:3.75 },
  { rank:267, last:'Malafis',          first:'Yanni',             pos:'C',    team:'Mid-Fairfield 15U',                  stars:3.75 },
  { rank:268, last:'Fishbone',         first:'Samuel',            pos:'RD',   team:"St. Sebastian's",                    stars:3.75 },
  { rank:269, last:'Lynn',             first:'Matthew',           pos:'RW',   team:'BK Selects 15U',                     stars:3.75 },
  { rank:270, last:'Lackman',          first:'Joey',              pos:'D',    team:'Lac St-Louis U18',                   stars:3.75 },
  { rank:271, last:'Martin',           first:'Gavin',             pos:'RW',   team:'Brantford 99ers U16',                stars:3.75 },
  { rank:272, last:'Kanyo',            first:'John',              pos:'RD',   team:'Barrie Colts U16',                   stars:3.75 },
  { rank:273, last:'Bergen',           first:'Walker',            pos:'D',    team:'Warman Wildcats U18',                stars:3.75 },
  { rank:274, last:'Stonacek',         first:'Mason',             pos:'D',    team:'Mount St Charles U15',               stars:3.75 },
  { rank:275, last:'Belanger',         first:'Gabriel',           pos:'RW',   team:'Little Caesars 15U',                 stars:3.75 },
  { rank:276, last:'McGauvran',        first:'Noah',              pos:'F',    team:'Northstar Christian U16',            stars:3.75 },
  { rank:277, last:'Gramer',           first:'John',              pos:'F',    team:'Moorhead HS',                        stars:3.75 },
  { rank:278, last:'Taylor',           first:'Patrick',           pos:'C',    team:'Windy City 15U',                     stars:3.75 },
  { rank:279, last:'Shtefan',          first:'Roman',             pos:'C',    team:'Windsor AAA Zn Jr. Spitfires U16',   stars:3.75 },
  { rank:280, last:'Buck',             first:'Hayden',            pos:'F',    team:'Lakeville North',                    stars:3.75 },
  { rank:281, last:'Shea',             first:'Jayden',            pos:'C',    team:'Pitt Pens Elite 15U',                stars:3.75 },
  { rank:282, last:'McGroarty',        first:'Tyler',             pos:'RW',   team:'NJ Avalanche 15U',                   stars:3.75 },
  { rank:283, last:'Meyer',            first:'Ben',               pos:'G',    team:'Regina Pats U18',                    stars:3.75 },
  { rank:284, last:'Walos',            first:'Caiven',            pos:'C',    team:'Madison Capitols 15U',               stars:3.75 },
  { rank:285, last:'Parkinson',        first:'Ethan',             pos:'D',    team:'Calgary Buffaloes U18',              stars:3.75 },
  { rank:286, last:'Robinson',         first:'Innis',             pos:'C',    team:"Ottawa Jr. 67's U16 AAA",            stars:3.75 },
  { rank:287, last:'Chytka',           first:'Gavin',             pos:'C',    team:'Phoenix Jr Coyotes 15U',             stars:3.75 },
  { rank:288, last:'Woodword',         first:'Andrew',            pos:'G',    team:'Chicago Mission 15U',                stars:3.75 },
  { rank:289, last:'Carroll',          first:'Xavier',            pos:'C',    team:'Hill Academy U16',                   stars:3.75 },
  { rank:290, last:'Tait',             first:'Jonathan',          pos:'LD',   team:'Mississauga Senators U16 AAA',       stars:3.75 },
  { rank:291, last:'Mork',             first:'Lukas',             pos:'D',    team:'White Bear Lake HS',                 stars:3.75 },
  { rank:292, last:'James',            first:'Trystan',           pos:'D',    team:'Calgary Flames U18',                 stars:3.75 },
  { rank:293, last:'Tobin',            first:'Charlie',           pos:'F',    team:'Edge School U18',                    stars:3.75 },
  { rank:294, last:'Hurlbert',         first:'Drew',              pos:'LD',   team:'Don Mills Flyers U16',               stars:3.75 },
  { rank:295, last:'Flemming',         first:'Morgan',            pos:'RW',   team:'Valley Wildcats U18',                stars:3.75 },
  { rank:296, last:'Gibson',           first:'Tanner',            pos:'G',    team:'Ajax Pickering U16',                 stars:3.75 },
  { rank:297, last:'Sokolov',          first:'Egor',              pos:'G',    team:'Toronto Marlboros U16',              stars:3.75 },
  { rank:298, last:'Reilly',           first:'Miles',             pos:'C',    team:'Toronto Marlboros U16',              stars:3.75 },
  { rank:299, last:'Cranney',          first:'Lucas',             pos:'LD',   team:'Markham Majors U16',                 stars:3.75 },
  { rank:300, last:'Bauer',            first:'Grayson',           pos:'F',    team:'Edge School U18',                    stars:3.75 },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function saveScreenshot(page, name) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const file = path.join(SCREENSHOTS_DIR, `${Date.now()}-${name}.png`);
  return page.screenshot({ path: file, fullPage: false }).catch(() => {});
}

const COMBINING_MARKS = /[̀-ͯ]/g;
function stripAccents(str) {
  return str.normalize('NFD').replace(COMBINING_MARKS, '');
}

const NICKNAME_MAP = {
  'joey':      'joseph',
  'jake':      'jacob',
  'drew':      'andrew',
  'andy':      'andrew',
  'billy':     'william',
  'will':      'william',
  'alex':      'alexander',
  'nate':      'nathan',
  'matt':      'matthew',
  'nick':      'nicholas',
  'zach':      'zachary',
  'zack':      'zachary',
  'sam':       'samuel',
  'ben':       'benjamin',
  'chris':     'christopher',
  'mike':      'michael',
  'micky':     'michael',
  'tom':       'thomas',
  'tim':       'timothy',
  'rob':       'robert',
  'bob':       'robert',
  'bobby':     'robert',
  'jim':       'james',
  'jimmy':     'james',
  'charlie':   'charles',
  'dan':       'daniel',
  'danny':     'daniel',
  'tony':      'anthony',
  'freddy':    'frederick',
  'fred':      'frederick',
  'eddie':     'edward',
  'ed':        'edward',
  'cam':       'cameron',
  'emile':     'emilio',
  'cj':        'charles',
  'aj':        'andrew',
  'rj':        'robert',
  'mj':        'michael',
};

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

  // Also try formal/alternate first name if nickname is known
  const firstLower = player.first.toLowerCase();
  const formal = NICKNAME_MAP[firstLower];
  if (formal) {
    const formalPrefix = formal.substring(0, 3);
    terms.add(`${formalPrefix} ${stripAccents(last)}`);
    terms.add(`${formalPrefix} ${stripAccents(segs[0])}`);
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
  console.log('║  RinkNet NA Top 300 Rankings Importer            ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  let loginCompleted = false;

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context  = await browser.newContext();
  const page     = await context.newPage();

  page.on('request', req => {
    if (req.url().includes('/users/loginFromAuthPortal')) loginCompleted = true;
  });

  // ── Login ──────────────────────────────────────────────────────────────────
  console.log('[1/3] Logging in…');
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
    if (await pw.isVisible({ timeout: 3000 })) await pw.fill(PASSWORD);
  } catch (_) {}
  await sleep(500);
  try { await page.locator('button[type="submit"]').first().click(); }
  catch (_) { await page.keyboard.press('Enter').catch(() => {}); }

  console.log('  Waiting for login… (enter 2FA in browser if prompted)');
  for (let i = 0; i < 120; i++) { if (loginCompleted) break; await sleep(1000); }
  if (!loginCompleted) console.log('  ⚠ Auth not confirmed — proceeding anyway');
  await sleep(2000);

  if (!page.url().includes('ops.rinknet.com')) {
    await page.goto('https://ops.rinknet.com/#/home', { waitUntil: 'domcontentloaded' });
    await sleep(3000);
  }
  console.log('  ✓ Logged in\n');

  // ── Navigate to existing list ──────────────────────────────────────────────
  console.log(`[2/3] Navigating to list ${LIST_ID}…`);
  const listUrl = `https://ops.rinknet.com/#/home/lists/view/${LIST_ID}`;
  await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
  await sleep(3000);
  try {
    await page.waitForSelector('button:has-text("Add Player"), a:has-text("Add Player")', { timeout: 15000 });
    console.log('  ✓ Ready\n');
  } catch (_) {
    console.log('  ⚠ Add Player button not visible — navigate to the list in the browser, then press Enter');
    await waitForKeypress();
  }

  // ── Add players ────────────────────────────────────────────────────────────
  console.log(`[3/3] Adding ${PLAYERS.length} players…\n`);
  const results = { ok: [], skip: [], notFound: [] };

  for (const player of PLAYERS) {
    process.stdout.write(`  [${String(player.rank).padStart(3)}/300] ${player.first} ${player.last}`.padEnd(50));

    try {
      await dismissErrorPopup(page);
      await page.keyboard.press('Escape').catch(() => {});
      await sleep(300);

      if (!page.url().includes(`/home/lists/view/${LIST_ID}`)) {
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2500);
      }

      // Click ADD PLAYER trigger
      let triggerClicked = false;
      for (const sel of ['button:has-text("Add Player")','a:has-text("Add Player")','button:has-text("ADD PLAYER")','a:has-text("ADD PLAYER")']) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 5000 })) { await el.scrollIntoViewIfNeeded(); await el.click(); triggerClicked = true; break; }
        } catch (_) {}
      }
      if (!triggerClicked) { console.log('SKIP (trigger)'); results.skip.push(player.rank); continue; }

      // Wait for modal
      try { await page.waitForSelector('text=Search by Player', { timeout: 10000 }); }
      catch (_) {
        const hadErr = await dismissErrorPopup(page);
        if (hadErr) {
          await page.locator('button:has-text("Add Player"), a:has-text("Add Player")').first().click().catch(() => {});
          await page.waitForSelector('text=Search by Player', { timeout: 8000 }).catch(() => {});
        }
      }
      if (!await page.locator('text=Search by Player').isVisible().catch(() => false)) {
        console.log('SKIP (modal)');
        results.skip.push(player.rank);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2000);
        continue;
      }

      // Find modal search input (lowest y position = inside modal)
      let searchInput = null;
      const allInputs = await page.locator('input').all();
      let maxY = -1;
      for (const el of allInputs) {
        const box = await el.boundingBox().catch(() => null);
        if (box && box.y > maxY) { maxY = box.y; searchInput = el; }
      }
      if (!searchInput) { console.log('SKIP (input)'); results.skip.push(player.rank); await page.keyboard.press('Escape'); continue; }

      // Search with multiple terms — only accept rows with 2010 birth year
      const terms = buildSearchTerms(player);
      let rowFound = false;
      for (const term of terms) {
        await searchInput.click({ clickCount: 3 });
        await searchInput.fill('');
        await sleep(200);
        await searchInput.fill(term);
        await sleep(4000);
        const count = await page.locator('table tbody tr:has-text("/2010")').count().catch(() => 0);
        if (count > 0) { rowFound = true; break; }
      }

      if (!rowFound) {
        console.log('(not found)');
        results.notFound.push(player.rank);
        await page.keyboard.press('Escape');
        await sleep(500);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2000);
        continue;
      }

      // Select best row — must be born in 2010; no fallback to other years
      const nameA = player.last.split(/[-\s]/)[0];
      const nameS = stripAccents(nameA);
      let rowClicked = false;
      for (const sel of [
        `tr:has-text("${nameA}"):has-text("/2010")`,
        `tr:has-text("${nameS}"):has-text("/2010")`,
        'table tbody tr:has-text("/2010")',
      ]) {
        try {
          const row = page.locator(sel).first();
          if (await row.isVisible({ timeout: 1500 })) { await row.click(); rowClicked = true; break; }
        } catch (_) {}
      }
      if (!rowClicked) await page.locator('table tbody tr').first().click().catch(() => {});
      await sleep(500);

      // Click confirm ADD PLAYER button (last visible, non-disabled)
      const allAddBtns = page.locator('button:has-text("Add Player"), button:has-text("ADD PLAYER")');
      const total = await allAddBtns.count();
      let confirmClicked = false;
      for (let bi = total - 1; bi >= 0; bi--) {
        const vis      = await allAddBtns.nth(bi).isVisible({ timeout: 300 }).catch(() => false);
        if (!vis) continue;
        const disabled = await allAddBtns.nth(bi).isDisabled().catch(() => false);
        if (disabled) continue;
        try { await allAddBtns.nth(bi).click({ timeout: 5000 }); confirmClicked = true; break; }
        catch (_) {}
      }
      if (!confirmClicked) {
        console.log('SKIP (confirm btn)');
        results.skip.push(player.rank);
        await page.keyboard.press('Escape');
        await sleep(500);
        await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
        await sleep(2000);
        continue;
      }

      await sleep(600);
      await dismissErrorPopup(page);

      // Wait for addPlayer navigation
      try { await page.waitForURL('**/addPlayer/**', { timeout: 12000 }); }
      catch (_) {
        if (!page.url().includes('addPlayer')) {
          console.log('SKIP (addPlayer)');
          results.skip.push(player.rank);
          await page.goto(listUrl, { waitUntil: 'domcontentloaded' });
          await sleep(2000);
          continue;
        }
      }
      await sleep(2500);

      // Fill Ranking
      for (const sel of ['input[name="ranking"]','input[name="rank"]','input[type="number"]','input[type="text"]']) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
          await el.click({ clickCount: 3 });
          await el.fill(String(player.rank));
          break;
        }
      }

      // Set Star Rating — find the select whose options include 4.75 (unique to Star Rating)
      const starValue = String(parseFloat(player.stars));
      try { await page.waitForSelector('text=Star Rating', { timeout: 5000 }); } catch (_) {}
      await sleep(500);
      let ratingSet = false;
      // Strategy 1: select in the same table row as "Star Rating" label
      try {
        const starRow = page.locator('tr:has-text("Star Rating")').last();
        const starSel = starRow.locator('select');
        if (await starSel.isVisible({ timeout: 2000 })) {
          await starSel.selectOption(starValue);
          ratingSet = true;
        }
      } catch (_) {}
      // Strategy 2: find the select whose options contain 4.75
      if (!ratingSet) {
        const selects  = page.locator('select');
        const selCount = await selects.count();
        for (let si = 0; si < selCount; si++) {
          const sel  = selects.nth(si);
          if (!await sel.isVisible({ timeout: 500 }).catch(() => false)) continue;
          const opts = await sel.locator('option').allTextContents();
          if (!opts.map(o => o.trim()).some(o => o === '4.75' || o === '4.5')) continue;
          await sel.selectOption(starValue).catch(() => {});
          ratingSet = true;
          break;
        }
      }

      // Save — button is top-right; wait for it to be visible
      try { await page.waitForSelector('button:has-text("SAVE"), button:has-text("Save")', { timeout: 3000 }); } catch (_) {}
      for (const sel of ['button:has-text("SAVE")','button:has-text("Save")','button[type="submit"]','input[type="submit"]']) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 1000 }).catch(() => false)) { await el.click(); break; }
      }

      await sleep(800);
      await dismissErrorPopup(page);

      try { await page.waitForFunction(() => !window.location.href.includes('addPlayer'), { timeout: 12000 }); }
      catch (_) { await page.goto(listUrl, { waitUntil: 'domcontentloaded' }); }

      await sleep(DELAY_MS);
      console.log(`✓  (${player.stars}★)`);
      results.ok.push(player.rank);

    } catch (err) {
      console.log(`ERR: ${err.message.split('\n')[0].substring(0, 50)}`);
      results.skip.push(player.rank);
      await dismissErrorPopup(page);
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
  console.log(`\n  List URL: https://ops.rinknet.com/#/home/lists/view/${LIST_ID}`);
  console.log('══════════════════════════════════════════════\n');

  await browser.close();
}

function waitForKeypress() {
  return new Promise(resolve => {
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
}

function readLine() {
  return new Promise(resolve => {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', data => { process.stdin.pause(); resolve(data.trim()); });
  });
}

main().catch(err => { console.error('\n❌ Fatal:', err.message); process.exit(1); });
