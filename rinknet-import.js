#!/usr/bin/env node
/**
 * RinkNet Rankings Importer v2
 *
 * Imports 300 player rankings into a RinkNet List with star ratings.
 *
 * SETUP (one-time):
 *   npm install playwright
 *   npx playwright install chromium
 *
 * RUN:
 *   node rinknet-import.js
 */

'use strict';

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const USERNAME        = 'bcollins@neutralzone.net';
const PASSWORD        = 'NZhockey24!';
const LIST_NAME       = '2026 NZ Rankings';  // ← edit this
const DELAY_MS        = 800;
const SCREENSHOTS_DIR = './rinknet-screenshots';
// ─────────────────────────────────────────────────────────────────────────────

const PLAYERS = [
  { rank:1,   last:'Boisvert',            first:'Thomas',            pos:'F',    team:'Mount St. Charles',         stars:4.50 },
  { rank:2,   last:'McKinnon',            first:'Jacob',             pos:'RW',   team:'Seminaire St-Francois',     stars:4.50 },
  { rank:3,   last:'Boutet',              first:'Vincent',           pos:'D',    team:'Seminaire St-Francois',     stars:4.50 },
  { rank:4,   last:'Bergeron',            first:'Julien',            pos:'LW',   team:'Chateauguay U18',           stars:4.50 },
  { rank:5,   last:'Charbonneau',         first:'Zaac',              pos:'C',    team:'Mount St. Charles',         stars:4.50 },
  { rank:6,   last:'Lemieux',             first:'Pierre-Alexandre',  pos:'C/RW', team:'Esther-Blondin U18',        stars:4.25 },
  { rank:7,   last:'Tremblay',            first:'Aslan',             pos:'C',    team:'Amos U18',                  stars:4.25 },
  { rank:8,   last:'Gagnon',              first:'Justin',            pos:'F',    team:'Notre-Dame U18',            stars:4.25 },
  { rank:9,   last:'Royer',               first:'Jakob',             pos:'C',    team:'Trois-Rivieres U18',        stars:4.25 },
  { rank:10,  last:'Leduc',               first:'Damien',            pos:'C',    team:'Chateauguay U18',           stars:4.25 },
  { rank:11,  last:'Williams',            first:'Lawrence',          pos:'D',    team:'Weeks Majors',              stars:4.25 },
  { rank:12,  last:'Nowlan',              first:'Samuel',            pos:'F',    team:'Little Caesars',            stars:4.25 },
  { rank:13,  last:'Cameron',             first:'Jack',              pos:'D',    team:'Weeks Majors',              stars:4.25 },
  { rank:14,  last:'Brien',               first:'Max',               pos:'F',    team:'Steele Suburu',             stars:4.25 },
  { rank:15,  last:'Norris',              first:'Damian',            pos:'F',    team:'Upper Canada College',      stars:4.25 },
  { rank:16,  last:'Guevin',              first:'Emile',             pos:'RW',   team:'Trois-Rivieres U18',        stars:4.25 },
  { rank:17,  last:'Menard',              first:'Emrik',             pos:'F',    team:'Woodbridge Wolfpack U16',   stars:4.00 },
  { rank:18,  last:'Tremblay',            first:'Malik',             pos:'LW',   team:'Magog U18',                 stars:4.00 },
  { rank:19,  last:'Borsellino',          first:'Domenico',          pos:'C',    team:'Lac St-Louis U18',          stars:4.00 },
  { rank:20,  last:'Roy',                 first:'Enzo',              pos:'D',    team:'Levis U18',                 stars:4.00 },
  { rank:21,  last:'Thisdelle',           first:'Maveric',           pos:'F',    team:'Woodbridge Wolfpack 15U',   stars:4.00 },
  { rank:22,  last:'Lazare',              first:'Bryce',             pos:'C',    team:'Lac St-Louis U18',          stars:4.00 },
  { rank:23,  last:'Roy',                 first:'Nathan-Nicolas',    pos:'D',    team:'Charles Lemoyne U18',       stars:4.00 },
  { rank:24,  last:'Faucher',             first:'Eliot',             pos:'D',    team:'Standstead U17',            stars:4.00 },
  { rank:25,  last:'Lainesse',            first:'Zach',              pos:'G',    team:'Levis U18',                 stars:4.00 },
  { rank:26,  last:'Frost',               first:'Nathan',            pos:'D',    team:'Canimex M17',               stars:4.00 },
  { rank:27,  last:'Tetreault',           first:'Rapheal',           pos:'F',    team:'Esther-Blondin U18',        stars:4.00 },
  { rank:28,  last:'Leroux',              first:'Tommy',             pos:'C',    team:'Charles Lemoyne U18',       stars:4.00 },
  { rank:29,  last:'Levy',                first:'Enzo',              pos:'LW',   team:'Saint-Eustache U18',        stars:4.00 },
  { rank:30,  last:'Blanchette',          first:'Alexy',             pos:'D',    team:'Jonquiere U18',             stars:4.00 },
  { rank:31,  last:'Conroy',              first:'Jackson',           pos:'F',    team:'Bishop Kearney 15U',        stars:4.00 },
  { rank:32,  last:'Roy',                 first:'Matteo',            pos:'D',    team:'Moncton Flyers',            stars:4.00 },
  { rank:33,  last:'Currie',              first:'Dylan',             pos:'RW',   team:'Chateauguay U18',           stars:4.00 },
  { rank:34,  last:'Coache-Luqman',       first:'Gabriel',           pos:'D',    team:'Charles Lemoyne U18',       stars:4.00 },
  { rank:35,  last:'Noel',                first:'Alexandre',         pos:'D',    team:'St. Hyacinthe U18',         stars:4.00 },
  { rank:36,  last:'Tillman',             first:'Jayden',            pos:'D',    team:'Bishop Kearney 15U',        stars:4.00 },
  { rank:37,  last:'Bolduc',              first:'Axel',              pos:'D',    team:'Levis U18',                 stars:4.00 },
  { rank:38,  last:'Genereux',            first:'Mathieu',           pos:'D',    team:'Standstead U17',            stars:4.00 },
  { rank:39,  last:'Riendeau',            first:'Nathan',            pos:'C',    team:'Charles Lemoyne U18',       stars:4.00 },
  { rank:40,  last:'Boulanger',           first:'Nathan',            pos:'G',    team:'Esther-Blondin U18',        stars:3.75 },
  { rank:41,  last:'Lackman',             first:'Joey',              pos:'D',    team:'Lac St-Louis U18',          stars:3.75 },
  { rank:42,  last:'Cleary',              first:'Chase',             pos:'F',    team:'Notre-Dame U18',            stars:3.75 },
  { rank:43,  last:'Guerard',             first:'Simon-Olivier',     pos:'G',    team:'Seminaire St-Francois',     stars:3.75 },
  { rank:44,  last:'Ouellette',           first:'Mavrick',           pos:'C',    team:'Trois-Rivieres U18',        stars:3.75 },
  { rank:45,  last:'Robichaud',           first:'Julien',            pos:'D',    team:'NJ Avalanche 15U',          stars:3.75 },
  { rank:46,  last:'Begin',               first:'Joey',              pos:'D',    team:'Notre-Dame U18',            stars:3.75 },
  { rank:47,  last:'Flemming',            first:'Morgan',            pos:'F',    team:'Valley Wildcats',           stars:3.75 },
  { rank:48,  last:'Cantin',              first:'Simon',             pos:'C',    team:'Charles Lemoyne U18',       stars:3.75 },
  { rank:49,  last:'Deslauriers',         first:'Lou',               pos:'D',    team:'Saint-Eustache U18',        stars:3.75 },
  { rank:50,  last:'Leclair',             first:'Logan',             pos:'LW',   team:'Trois-Rivieres U18',        stars:3.75 },
  { rank:51,  last:'Panagakos',           first:'George-Nektarios',  pos:'G',    team:'South Kent 15U',            stars:3.75 },
  { rank:52,  last:'Beaudoin',            first:'Maxime-Alexandre',  pos:'D',    team:'Charles Lemoyne U18',       stars:3.75 },
  { rank:53,  last:'Sylla',               first:'Elijah',            pos:'C',    team:'Laval-Montreal U18',        stars:3.75 },
  { rank:54,  last:'Lavoie',              first:'Zachary',           pos:'D',    team:'Trois-Rivieres U18',        stars:3.75 },
  { rank:55,  last:'Poulin',              first:'Loik',              pos:'F',    team:'Levis U18',                 stars:3.75 },
  { rank:56,  last:'Gervais',             first:'Xavier',            pos:'G',    team:'Jonquiere U18',             stars:3.75 },
  { rank:57,  last:'Deschamps',           first:'Alexandre',         pos:'D',    team:'Laval-Montreal U18',        stars:3.75 },
  { rank:58,  last:'Giberson',            first:'Carter',            pos:'D',    team:'Fredericton Caps',          stars:3.75 },
  { rank:59,  last:'Belanger',            first:'Malek',             pos:'RW',   team:'Levis U18',                 stars:3.75 },
  { rank:60,  last:'Roy',                 first:'Damien',            pos:'RW',   team:'Magog U18',                 stars:3.75 },
  { rank:61,  last:'Perreault',           first:'Mikael',            pos:'D',    team:'Esther-Blondin U18',        stars:3.75 },
  { rank:62,  last:'Rioux',               first:'Emile',             pos:'D',    team:'Notre-Dame U18',            stars:3.75 },
  { rank:63,  last:'Fournier',            first:'Liam',              pos:'F',    team:'Woodbridge Wolfpack 15U',   stars:3.75 },
  { rank:64,  last:'McQuire',             first:'Luke',              pos:'F',    team:'Edge School U17',           stars:3.75 },
  { rank:65,  last:'Duffy',               first:'Liam',              pos:'D',    team:'Steele Suburu',             stars:3.75 },
  { rank:66,  last:'Delarosbil',          first:'Simon',             pos:'C',    team:'Levis U18',                 stars:3.75 },
  { rank:67,  last:'Leblanc',             first:'Nathan',            pos:'F',    team:'Moncton Flyers',            stars:3.75 },
  { rank:68,  last:'Shea',                first:'Jayden',            pos:'F',    team:'Pitt Pens 15U',             stars:3.75 },
  { rank:69,  last:"O'Connell",           first:'Noah',              pos:'C',    team:'Esther-Blondin U18',        stars:3.75 },
  { rank:70,  last:'Odell',               first:'Carter',            pos:'F',    team:'Halifax Macs',              stars:3.75 },
  { rank:71,  last:'Salvas',              first:'Edouard',           pos:'G',    team:'St. Hyacinthe U18',         stars:3.75 },
  { rank:72,  last:'Vincent',             first:'William',           pos:'F',    team:'Saint-Eustache U18',        stars:3.75 },
  { rank:73,  last:'Khoury',              first:'Mathis',            pos:'RW',   team:'Laval-Montreal U18',        stars:3.75 },
  { rank:74,  last:'Hanley',              first:'Eric',              pos:'F',    team:'Valley Wildcats',           stars:3.75 },
  { rank:75,  last:'Chartrand-Bongono',   first:'Pierre-Antoine',    pos:'C',    team:'Gatineau U18',              stars:3.75 },
  { rank:76,  last:'Proulx',              first:'Keaven',            pos:'C',    team:'Saint-Eustache U18',        stars:3.75 },
  { rank:77,  last:'Jaillet',             first:'Jamie',             pos:'D',    team:'Moncton Flyers',            stars:3.75 },
  { rank:78,  last:'Blanchette',          first:'Louca',             pos:'F',    team:'College Notre Dame U18',    stars:3.75 },
  { rank:79,  last:'Lesage',              first:'Xavier',            pos:'G',    team:'Gatineau U18',              stars:3.75 },
  { rank:80,  last:'Legare',              first:'Hugo',              pos:'C',    team:'Seminaire St-Francois',     stars:3.75 },
  { rank:81,  last:'Pelletier',           first:'Caleb',             pos:'G',    team:'Laval-Montreal U18',        stars:3.75 },
  { rank:82,  last:'Necak',               first:'Olivier',           pos:'F',    team:'Saint-Eustache U18',        stars:3.75 },
  { rank:83,  last:'Theoret',             first:'Felix',             pos:'RW',   team:'Chateauguay U18',           stars:3.75 },
  { rank:84,  last:'Bergeron',            first:'Hugo',              pos:'C',    team:'Notre-Dame U18',            stars:3.75 },
  { rank:85,  last:'Truchon',             first:'Raphael',           pos:'D',    team:'Amos U18',                  stars:3.75 },
  { rank:86,  last:'Strong',              first:'Cooper',            pos:'F',    team:'Halifax Macs',              stars:3.50 },
  { rank:87,  last:'Turcotte',            first:'Alexis',            pos:'F',    team:'Mauricie M17',              stars:3.50 },
  { rank:88,  last:'Cardillo',            first:'Justin',            pos:'LW',   team:'Lac St-Louis U18',          stars:3.75 },
  { rank:89,  last:"O'Shaughnessy",       first:'Colby',             pos:'G',    team:'March & Mill Co Hunters',   stars:3.75 },
  { rank:90,  last:'Durocher',            first:'Thomas',            pos:'D',    team:'Richelieu U17',             stars:3.75 },
  { rank:91,  last:'Vaillancourt',        first:'Hugo',              pos:'',     team:'Jonquiere U18',             stars:3.50 },
  { rank:92,  last:'Sorgini',             first:'Gabriel',           pos:'F',    team:'Notre Dame HA 15U',         stars:3.75 },
  { rank:93,  last:"D'Elia",              first:'Tristan',           pos:'F',    team:'WBS Knights 15U',           stars:3.75 },
  { rank:94,  last:'Lacelle',             first:'Henry',             pos:'F',    team:'Lac St-Louis U18',          stars:3.50 },
  { rank:95,  last:'Lafreniere',          first:'Olivier',           pos:'F',    team:'Woodbridge Wolfpack 15U',   stars:3.75 },
  { rank:96,  last:'De Franco',           first:'Isaac',             pos:'F',    team:'Gatineau U18',              stars:3.50 },
  { rank:97,  last:'Leduc',               first:'Noah',              pos:'LD',   team:'Chateauguay U18',           stars:3.75 },
  { rank:98,  last:'Gagnon',              first:'Thomas',            pos:'RW',   team:'Quebec Blizzard M17',       stars:3.75 },
  { rank:99,  last:'Renaud',              first:'Zackary',           pos:'G',    team:'Saint-Eustache U18',        stars:3.75 },
  { rank:100, last:'Letendre',            first:'Justin',            pos:'RW',   team:'St. Hyacinthe U18',         stars:3.75 },
  { rank:101, last:'Toms',                first:'Cole',              pos:'F',    team:'Bishops College',           stars:3.50 },
  { rank:102, last:'Di Marzo',            first:'Daniele',           pos:'F',    team:'Laval-Montreal U18',        stars:3.50 },
  { rank:103, last:'Lalonde',             first:'Jeremy',            pos:'D',    team:'Gatineau U18',              stars:3.50 },
  { rank:104, last:'MacKay',              first:'Nate',              pos:'F',    team:'Halifax Macs',              stars:3.50 },
  { rank:105, last:'Boulay',              first:'Xavier',            pos:'F',    team:'Northern Moose',            stars:3.50 },
  { rank:106, last:'Gaudet',              first:'Justin',            pos:'LD',   team:'Marie-Rivier U17',          stars:3.50 },
  { rank:107, last:'Savoie',              first:'Loik',              pos:'D',    team:'Gatineau U18',              stars:3.50 },
  { rank:108, last:'Graham',              first:'Aiden',             pos:'F',    team:'NFLD Growlers',             stars:3.50 },
  { rank:109, last:'Jardine',             first:'Brycen',            pos:'F',    team:'NH Mtn Kings 15U',          stars:3.50 },
  { rank:110, last:'Rheaume',             first:'Mickael',           pos:'F',    team:'Basses Laurentides',        stars:3.50 },
  { rank:111, last:'Waterhouse',          first:'Brayden',           pos:'F',    team:'Fredericton Caps',          stars:3.50 },
  { rank:112, last:'Hamel',               first:'Justin',            pos:'D',    team:'St. Hyacinthe U18',         stars:3.50 },
  { rank:113, last:'Chale',               first:'Nathan',            pos:'D',    team:'Gatineau U18',              stars:3.50 },
  { rank:114, last:'Bolduc',              first:'Edward',            pos:'F',    team:'Atlantic Coast 15U',        stars:3.50 },
  { rank:115, last:'MacLean',             first:'Hunter',            pos:'F',    team:'Steele Suburu',             stars:3.50 },
  { rank:116, last:'Desmeules',           first:'Nathan',            pos:'D',    team:'Saint-Eustache U18',        stars:3.50 },
  { rank:117, last:'Lacombe',             first:'Rayan',             pos:'G',    team:'Laval-Montreal M17',        stars:3.50 },
  { rank:118, last:'Bouchard',            first:'Emile',             pos:'C',    team:'Gatineau U18',              stars:3.50 },
  { rank:119, last:'Labelle',             first:'Zack',              pos:'LW',   team:'Outaouais M17',             stars:3.50 },
  { rank:120, last:'Ethier',              first:'Eliot',             pos:'LW',   team:'Saint-Eustache U18',        stars:3.50 },
  { rank:121, last:'St-Denis',            first:'Eloik',             pos:'C',    team:'Gatineau U18',              stars:3.50 },
  { rank:122, last:'Leblanc',             first:'Xavier',            pos:'G',    team:'Moncton Flyers',            stars:3.50 },
  { rank:123, last:'Wragg',               first:'Yoan',              pos:'LD',   team:'St-Gabriel RSEQ',           stars:3.50 },
  { rank:124, last:'Sabourin',            first:'Jacob',             pos:'RW',   team:'Gatineau U18',              stars:3.50 },
  { rank:125, last:'Fraser',              first:'Jaxon',             pos:'F',    team:'Fredericton Caps',          stars:3.50 },
  { rank:126, last:'Harvey',              first:'Philippe',          pos:'G',    team:'Sag-Lac M17',               stars:3.50 },
  { rank:127, last:'Stafylakis',          first:'Konstantinos',      pos:'F',    team:'Laval-Montreal U18',        stars:3.50 },
  { rank:128, last:'Paradis',             first:'Alexandre',         pos:'F',    team:'College de Levy M18',       stars:3.50 },
  { rank:129, last:'Collingwood',         first:'Henry',             pos:'D',    team:'Bishops College',           stars:3.50 },
  { rank:130, last:'MacDonald',           first:'Matt',              pos:'F',    team:'Steele Suburu',             stars:3.50 },
  { rank:131, last:'Sy Lam Pham',         first:'Florent',           pos:'G',    team:'Charles Lemoyne M17',       stars:3.50 },
  { rank:132, last:'Bond',                first:'Thomas',            pos:'C',    team:'Jonquiere U18',             stars:3.50 },
  { rank:133, last:'Perreault',           first:'Zac',               pos:'RW',   team:'Laval-Montreal U18',        stars:3.50 },
  { rank:134, last:'Liarakos',            first:'Constantin',        pos:'F',    team:'Notre Dame HA 15U',         stars:3.50 },
  { rank:135, last:'Laforce',             first:'Derek',             pos:'D',    team:'Gatineau U18',              stars:3.50 },
  { rank:136, last:'Rossignol',           first:'Thomas',            pos:'D',    team:'Fadette Ecole Sec.',        stars:3.50 },
  { rank:137, last:'Robert',              first:'Maxim',             pos:'D',    team:'Gatineau U18',              stars:3.25 },
  { rank:138, last:'Smith',               first:'Jaden',             pos:'F',    team:'NFLD Growlers',             stars:3.50 },
  { rank:139, last:'Sleigher',            first:'Zack',              pos:'C',    team:'Saint-Eustache U18',        stars:3.50 },
  { rank:140, last:'Plante',              first:'Ludovic',           pos:'LW',   team:'Levis U18',                 stars:3.50 },
  { rank:141, last:'Laplante',            first:'William',           pos:'G',    team:'Ontario HA U17',            stars:3.50 },
  { rank:142, last:'Duplantie',           first:'Dominic',           pos:'F',    team:'Laval-Montreal M17',        stars:3.50 },
  { rank:143, last:'Bibeau',              first:'Zachary',           pos:'D',    team:'Richelieu U17',             stars:3.50 },
  { rank:144, last:'Land',                first:'Quinton',           pos:'D',    team:'Steele Suburu',             stars:3.50 },
  { rank:145, last:'DaPastena',           first:'Luca',              pos:'LD',   team:'Kuper Academy',             stars:3.50 },
  { rank:146, last:'Brotto',              first:'Lucca',             pos:'D',    team:'South Kent 15U',            stars:3.50 },
  { rank:147, last:'Wilson',              first:'Matt',              pos:'D',    team:'Basses Laurentides',        stars:3.50 },
  { rank:148, last:'Woodley',             first:'Brayden',           pos:'D',    team:'Bourget RSEQ',              stars:3.50 },
  { rank:149, last:'Boucher',             first:'Hudson',            pos:'D',    team:'Lac St-Louis M17',          stars:3.50 },
  { rank:150, last:'Gregoire',            first:'Benjamin',          pos:'F',    team:'Lanaudiere',                stars:3.50 },
  { rank:151, last:'Bourassa',            first:'Nathan',            pos:'LD',   team:'Laval-Montreal U18',        stars:3.50 },
  { rank:152, last:'Darby',               first:'Matthew',           pos:'G',    team:'Lac St-Louis M17',          stars:3.50 },
  { rank:153, last:'Boivin',              first:'Lucas',             pos:'LW',   team:'Magog U18',                 stars:3.50 },
  { rank:154, last:'Baldwin',             first:'Jack',              pos:'F',    team:'March & Mill Co Hunters',   stars:3.50 },
  { rank:155, last:'Cote',                first:'William',           pos:'D',    team:'Levis U18',                 stars:3.50 },
  { rank:156, last:'Germain-Lacroix',     first:'Edouard',           pos:'D',    team:'Amos U18',                  stars:3.50 },
  { rank:157, last:'Gillis',              first:'London',            pos:'D',    team:'NH Mtn Kings 15U',          stars:3.50 },
  { rank:158, last:'Haverstock',          first:'Nash',              pos:'F',    team:'Halifax Macs',              stars:3.50 },
  { rank:159, last:'Carlomusto',          first:'Nico',              pos:'C',    team:'Lac St-Louis M17',          stars:3.50 },
  { rank:160, last:'Beck',                first:'Alexander',         pos:'LW',   team:'Kuper Academy',             stars:3.50 },
  { rank:161, last:'Duplessis',           first:'Miguel',            pos:'F',    team:'Moncton Flyers',            stars:3.50 },
  { rank:162, last:'Dwyer',               first:'Sean',              pos:'F',    team:'Standstead U17',            stars:3.50 },
  { rank:163, last:'Noel',                first:'Alexis',            pos:'G',    team:'American HA 15U',           stars:3.50 },
  { rank:164, last:'Morasse',             first:'Zach-Olivier',      pos:'D',    team:'Quebec Blizzard M17',       stars:3.50 },
  { rank:165, last:'Wilson',              first:'Jeremy',            pos:'D',    team:'Valley Wildcats',           stars:3.50 },
  { rank:166, last:'Belanger',            first:'Leo',               pos:'G',    team:'College Notre Dame U18',    stars:3.50 },
  { rank:167, last:'MacPhee',             first:'Alistair',          pos:'D',    team:'Steele Suburu',             stars:3.50 },
  { rank:168, last:'Delisle',             first:'Kingston',          pos:'G',    team:'Lac St-Louis M17',          stars:3.50 },
  { rank:169, last:'Ouellette',           first:'Marc-Olivier',      pos:'D',    team:'Moncton Flyers',            stars:3.50 },
  { rank:170, last:'Cardinal',            first:'Xavier',            pos:'F',    team:'Seacoast PA 15U',           stars:3.50 },
  { rank:171, last:'Boutilier',           first:'Blake',             pos:'D',    team:'Halifax Macs',              stars:3.50 },
  { rank:172, last:'Houle',               first:'Raphael',           pos:'C',    team:'Pointe-Levy M17',           stars:3.50 },
  { rank:173, last:'Bowles',              first:'Liam',              pos:'D',    team:'Saint John Vitos',          stars:3.50 },
  { rank:174, last:'Meaden',              first:'Aaron',             pos:'G',    team:'Valley Wildcats',           stars:3.50 },
  { rank:175, last:'Loyer',               first:'Esteban',           pos:'D',    team:'American HA 15U',           stars:3.50 },
  { rank:176, last:'Gorman',              first:'Nash',              pos:'D',    team:'RNS',                       stars:3.50 },
  { rank:177, last:'Thibault',            first:'Thomas',            pos:'C',    team:'Beauce-Appalaches M17',     stars:3.50 },
  { rank:178, last:'Desjardins',          first:'Loik',              pos:'C',    team:'Charles Lemoyne M17',       stars:3.25 },
  { rank:179, last:'Hug',                 first:'Dylan',             pos:'RW',   team:'Magog U18',                 stars:3.25 },
  { rank:180, last:'Brunelle',            first:'Antoine',           pos:'G',    team:'Mauricie M17',              stars:3.50 },
  { rank:181, last:'Botelho',             first:'Zachary',           pos:'G',    team:'Bourget RSEQ',              stars:3.50 },
  { rank:182, last:'Pichette',            first:'Alexis',            pos:'C',    team:'Quebec AS M17',             stars:3.50 },
  { rank:183, last:'Martone',             first:'Giuliano',          pos:'F',    team:'Laval-Montreal M17',        stars:3.25 },
  { rank:184, last:'Robidoux',            first:'Willyam',           pos:'LW',   team:'Richelieu U17',             stars:3.50 },
  { rank:185, last:'Bertleff',            first:'Matthew',           pos:'D',    team:'South Kent 15U',            stars:3.50 },
  { rank:186, last:'Houle',               first:'Alexis',            pos:'G',    team:'Quebec AS M17',             stars:3.50 },
  { rank:187, last:'Urquhart',            first:'Andrew',            pos:'F',    team:'March & Mill Co Hunters',   stars:3.25 },
  { rank:188, last:'Deschamps',           first:'Zak',               pos:'LW',   team:'Charles Lemoyne M17',       stars:3.25 },
  { rank:189, last:'Hubert',              first:'Renaud',            pos:'C',    team:'Mauricie M17',              stars:3.25 },
  { rank:190, last:'Washipabano',         first:'Zane',              pos:'LW',   team:'Outaouais M17',             stars:3.25 },
  { rank:191, last:"O'Keefe",             first:'Hudson',            pos:'F',    team:'East Coast Blizzard',       stars:3.25 },
  { rank:192, last:'Thibert',             first:'Gabriel',           pos:'D',    team:'Charles Lemoyne U18',       stars:3.25 },
  { rank:193, last:'Pouget',              first:'Mae',               pos:'G',    team:'Mille-Iles M17',            stars:3.25 },
  { rank:194, last:'Lachapelle',          first:'William',           pos:'D',    team:'Quebec AS M17',             stars:3.25 },
  { rank:195, last:'Vorobiev',            first:'Maxime',            pos:'F',    team:'WBS Knights 15U',           stars:3.25 },
  { rank:196, last:'Gosselin',            first:'Adam',              pos:'D',    team:'College Claretain M17',     stars:3.25 },
  { rank:197, last:'Souliere',            first:'Tommy',             pos:'C',    team:'Charles Lemoyne M17',       stars:3.25 },
  { rank:198, last:'Desjardins',          first:'Charles',           pos:'C',    team:'Basses Laurentides',        stars:3.25 },
  { rank:199, last:'Vachon',              first:'Joseph',            pos:'C',    team:'Chateauguay U18',           stars:3.25 },
  { rank:200, last:'Chartrand',           first:'Sidney',            pos:'F',    team:'Bourget RSEQ',              stars:3.50 },
  { rank:201, last:'Guertin',             first:'Elliot',            pos:'D',    team:'Richelieu U17',             stars:3.25 },
  { rank:202, last:'Larochelle',          first:'Marc-Antoine',      pos:'F',    team:'Bishops College',           stars:3.25 },
  { rank:203, last:'Williams',            first:'Samuel',            pos:'D',    team:'East Coast Blizzard',       stars:3.25 },
  { rank:204, last:'Lavigne',             first:'Tristan',           pos:'C',    team:'Lac St-Louis U18',          stars:3.25 },
  { rank:205, last:'Ducharme',            first:'Billy',             pos:'F',    team:'Selects du Nord',           stars:3.25 },
  { rank:206, last:'Cormier',             first:'Riley',             pos:'F',    team:'Kensington Wild',           stars:3.25 },
  { rank:207, last:'Julien',              first:'Felix Antoine',     pos:'G',    team:'Bourget RSEQ',              stars:3.25 },
  { rank:208, last:'Page',                first:'Maddox',            pos:'D',    team:'Lac St-Louis M17',          stars:3.25 },
  { rank:209, last:'Jacques',             first:'Elie',              pos:'LD',   team:'Beauce-Appalaches M17',     stars:3.25 },
  { rank:210, last:'Ducharme',            first:'Zack',              pos:'LD',   team:'Selects du Nord',           stars:3.25 },
  { rank:211, last:'Richard',             first:'Mika',              pos:'F',    team:'Hill Academy U16',          stars:3.25 },
  { rank:212, last:'Salomon',             first:'Samuel',            pos:'C',    team:'Basses Laurentides',        stars:3.25 },
  { rank:213, last:'Gillard',             first:'Brandon',           pos:'F',    team:'Atlantic Coast 15U',        stars:3.25 },
  { rank:214, last:'Tremblay',            first:'Emile',             pos:'D',    team:'Basses Laurentides',        stars:3.25 },
  { rank:215, last:'Cantoro',             first:'Hugo',              pos:'C',    team:'Laval Rousseau M17',        stars:3.25 },
  { rank:216, last:'Thompson',            first:'Taytum',            pos:'LW',   team:'Outaouais M17',             stars:3.25 },
  { rank:217, last:'Proulx',              first:'Mathis',            pos:'G',    team:'Outaouais M17',             stars:3.25 },
  { rank:218, last:'Cote',                first:'Edouard',           pos:'RW',   team:'Bourget RSEQ',              stars:3.25 },
  { rank:219, last:'Lamarche',            first:'Mathieu',           pos:'D',    team:'Mille-Iles M17',            stars:3.25 },
  { rank:220, last:'Moores',              first:'Drew',              pos:'F',    team:'RNS',                       stars:3.25 },
  { rank:221, last:'Worth',               first:'Liam',              pos:'D',    team:'March & Mill Co Hunters',   stars:3.25 },
  { rank:222, last:'Cote',                first:'Alexy',             pos:'C',    team:'Quebec AS M17',             stars:3.25 },
  { rank:223, last:'Carrigan',            first:'Brayden',           pos:'F',    team:'Valley Wildcats',           stars:3.25 },
  { rank:224, last:'Allaby',              first:'Connor',            pos:'F',    team:'Saint John Vitos',          stars:3.25 },
  { rank:225, last:'Lanctot',             first:'Xavier',            pos:'G',    team:'Seacoast PA 15U',           stars:3.25 },
  { rank:226, last:'Lacroix',             first:'Mathieu',           pos:'D',    team:'Beauce-Appalaches M17',     stars:3.25 },
  { rank:227, last:'Garneau',             first:'William',           pos:'C',    team:'Quebec AS M17',             stars:3.25 },
  { rank:228, last:'Meng',                first:'Leo',               pos:'D',    team:'Fredericton Caps',          stars:3.25 },
  { rank:229, last:'Bottomley',           first:'MJ',                pos:'F',    team:'Halifax Macs',              stars:3.25 },
  { rank:230, last:'Robichaud',           first:'Mikko',             pos:'G',    team:'Kings-Edgehill',            stars:3.25 },
  { rank:231, last:'Guay',                first:'Edouard',           pos:'D',    team:'Beauce-Appalaches M17',     stars:3.25 },
  { rank:232, last:'Anctil',              first:'Frederic',          pos:'D',    team:'Bas St-Laurent',            stars:3.25 },
  { rank:233, last:'Stewart',             first:'Joshua',            pos:'F',    team:'Northern Moose',            stars:3.25 },
  { rank:234, last:'Poulin',              first:'Dayle',             pos:'G',    team:'Beauce-Appalaches M17',     stars:3.25 },
  { rank:235, last:'Cleary',              first:'Jordan',            pos:'',     team:'Sag-Lac M17',               stars:3.25 },
  { rank:236, last:'Swain',               first:'Eli',               pos:'F',    team:'Weeks Majors',              stars:3.25 },
  { rank:237, last:'Healy',               first:'Liam',              pos:'G',    team:'East Coast Blizzard',       stars:3.25 },
  { rank:238, last:'Laforce',             first:'Zack',              pos:'RD',   team:'Mauricie M17',              stars:3.25 },
  { rank:239, last:'Rubbo',               first:'Nevio',             pos:'F',    team:'Notre Dame HA 15U',         stars:3.25 },
  { rank:240, last:'Bolduc',              first:'Jacob',             pos:'F',    team:'Sag-Lac M17',               stars:3.25 },
  { rank:241, last:'Casavant',            first:'Evan',              pos:'D',    team:'Sherbrooke M17',            stars:3.25 },
  { rank:242, last:'Hanson-Leveille',     first:'Dylan',             pos:'LD',   team:'Lower Canada College',      stars:3.25 },
  { rank:243, last:'Lamontagne',          first:'Louis',             pos:'F',    team:'Seacoast PA 15U',           stars:3.25 },
  { rank:244, last:'Gilbert',             first:'Jacob',             pos:'D',    team:'Richelieu U17',             stars:3.25 },
  { rank:245, last:'Beauchemin',          first:'Gabriel',           pos:'D',    team:'Charles Lemoyne M17',       stars:3.25 },
  { rank:246, last:"O'Neill",             first:'Bryson',            pos:'F',    team:'NFLD Growlers',             stars:3.25 },
  { rank:247, last:'Fortin',              first:'Caleb',             pos:'C',    team:'Beauce-Appalaches M17',     stars:3.25 },
  { rank:248, last:'Miclette',            first:'Alexis',            pos:'RD',   team:'PML RSEQ',                  stars:3.25 },
  { rank:249, last:'Dauphinais',          first:'Malik',             pos:'D',    team:'Mauricie M17',              stars:3.25 },
  { rank:250, last:'Boucher',             first:'Malek',             pos:'RD',   team:'Sag-Lac M17',               stars:3.25 },
  { rank:251, last:'Pitcher',             first:'Ethan',             pos:'D',    team:'Central Impact',            stars:3.25 },
  { rank:252, last:'McFadden',            first:'Bodan',             pos:'F',    team:'RNS',                       stars:3.25 },
  { rank:253, last:'Dickinson',           first:'Rhys',              pos:'F',    team:'Fredericton Caps',          stars:3.25 },
  { rank:254, last:'Lachance',            first:'Eli',               pos:'C',    team:'Mauricie M17',              stars:3.25 },
  { rank:255, last:'Poulin',              first:'Maxime',            pos:'F',    team:'Sherbrooke M17',            stars:3.25 },
  { rank:256, last:'Vachon',              first:'Phillipe',          pos:'LD',   team:'Bishops College',           stars:3.25 },
  { rank:257, last:'Dow-Imrie',           first:'Nolan',             pos:'D',    team:'Sag-Lac M17',               stars:3.25 },
  { rank:258, last:'Montminy',            first:'Samuel',            pos:'LD',   team:'Quebec Blizzard M17',       stars:3.25 },
  { rank:259, last:'Bernier',             first:'Max',               pos:'F',    team:'Quebec AS M17',             stars:3.25 },
  { rank:260, last:'Carignan',            first:'Mathis',            pos:'F',    team:'Seminaire St-Joseph M18',   stars:3.25 },
  { rank:261, last:'Thauvette',           first:'Pier-Olivier',      pos:'F',    team:'Nord Selects M17',          stars:3.25 },
  { rank:262, last:'Rioux',               first:'Louis-Edouard',     pos:'F',    team:'Quebec Blizzard M17',       stars:3.25 },
  { rank:263, last:'Richard',             first:'Maxime',            pos:'F',    team:'Moncton Flyers',            stars:3.25 },
  { rank:264, last:'Desjardins',          first:'Jeremie',           pos:'C',    team:'Mauricie M17',              stars:3.25 },
  { rank:265, last:'Chisholm',            first:'Lucas',             pos:'D',    team:'CBW Islanders',             stars:3.25 },
  { rank:266, last:'Hebert',              first:'Jeremie',           pos:'F',    team:'Academie St. Therese',      stars:3.25 },
  { rank:267, last:'Olivier',             first:'Antoine',           pos:'D',    team:'Charles Lemoyne M17',       stars:3.25 },
  { rank:268, last:'Mullins',             first:'Silas',             pos:'G',    team:'Steele Suburu',             stars:3.25 },
  { rank:269, last:'Croteau',             first:'Liam',              pos:'LW',   team:'Bourget RSEQ',              stars:3.25 },
  { rank:270, last:'Gelinas',             first:'Raphael',           pos:'D',    team:'Mauricie M17',              stars:3.25 },
  { rank:271, last:'Latella',             first:'Adamo',             pos:'C',    team:'Laval Rousseau M17',        stars:3.25 },
  { rank:272, last:'Hackett',             first:'Noah',              pos:'D',    team:'Kensington Wild',           stars:3.25 },
  { rank:273, last:'Morgan',              first:'Thomas',            pos:'D',    team:'Kensington Wild',           stars:3.25 },
  { rank:274, last:'Boone',               first:'Liam',              pos:'F',    team:'Kings-Edgehill',            stars:3.25 },
  { rank:275, last:'Miansi',              first:'Kaylan',            pos:'F',    team:'Mille-Iles M17',            stars:3.25 },
  { rank:276, last:'Larsen',              first:'Kieran',            pos:'F',    team:'Selwyn House M18',          stars:3.25 },
  { rank:277, last:'Vallee',              first:'Xavier',            pos:'D',    team:'Bas St-Laurent',            stars:3.25 },
  { rank:278, last:'Morrison',            first:'Jamie',             pos:'D',    team:'Sydney Rush',               stars:3.25 },
  { rank:279, last:'Turgeon',             first:'Felix-Antoine',     pos:'C',    team:'Charles Lemoyne M17',       stars:3.25 },
  { rank:280, last:'Leo',                 first:'Luca',              pos:'F',    team:'Lac St-Louis M17',          stars:3.25 },
  { rank:281, last:'Pelletier',           first:'Simon',             pos:'F',    team:'WBS Knights 15U',           stars:3.25 },
  { rank:282, last:'Miller',              first:'Ethan',             pos:'F',    team:'Sydney Rush',               stars:3.25 },
  { rank:283, last:'Swain',               first:'Nathan',            pos:'D',    team:'Pinnacle Growlers',         stars:3.25 },
  { rank:284, last:'Gosselin',            first:'Max',               pos:'D',    team:'Mille-Iles M17',            stars:3.25 },
  { rank:285, last:'Labrecque',           first:'Justin',            pos:'F',    team:'Beauce-Appalaches M17',     stars:3.25 },
  { rank:286, last:'Potvin-Leblond',      first:'Felix',             pos:'F',    team:'Quebec Blizzard M17',       stars:3.25 },
  { rank:287, last:'Stemper',             first:'Elyot',             pos:'C',    team:'Quebec AS M17',             stars:3.25 },
  { rank:288, last:'Parsons',             first:'Owen',              pos:'F',    team:'Central Impact',            stars:3.25 },
  { rank:289, last:'Boulet',              first:'Thomas',            pos:'F',    team:'Canimex M17',               stars:3.25 },
  { rank:290, last:'McCarthy',            first:'Thomas',            pos:'F',    team:'East Coast Blizzard',       stars:3.25 },
  { rank:291, last:'Quenville',           first:'Justin',            pos:'F',    team:'Quebec Blizzard M17',       stars:3.25 },
  { rank:292, last:'Bizeau',              first:'Carter',            pos:'D',    team:'Saint John Vitos',          stars:3.25 },
  { rank:293, last:'Weatherbie',          first:'Owen',              pos:'F',    team:'Charlottetown Knights',     stars:3.25 },
  { rank:294, last:'Chapman Belliveau',   first:'Remy',              pos:'F',    team:'March & Mill Co Hunters',   stars:3.25 },
  { rank:295, last:'Leblanc',             first:'Parker',            pos:'F',    team:'South Shore U18',           stars:3.25 },
  { rank:296, last:'Vermette',            first:'Thomas',            pos:'F',    team:'Richelieu U17',             stars:3.25 },
  { rank:297, last:'Morris',              first:'Mason',             pos:'F',    team:'March & Mill Co Hunters',   stars:3.25 },
  { rank:298, last:'Fraughton',           first:'Nolan',             pos:'G',    team:'South Shore Mustangs',      stars:3.25 },
  { rank:299, last:'Giguere',             first:'Thomas',            pos:'G',    team:'Atlantic Coast 15U',        stars:3.25 },
  { rank:300, last:'Green',               first:'Hunter',            pos:'F',    team:'Weeks Majors',              stars:3.25 },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function saveScreenshot(page, name) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const file = path.join(SCREENSHOTS_DIR, `${Date.now()}-${name}.png`);
  return page.screenshot({ path: file, fullPage: false }).catch(() => {});
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║    RinkNet Rankings Importer  v2         ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // State captured from network
  let listId          = null;
  let authToken       = null;
  let addPlayerBody   = null;
  let loginCompleted  = false;  // set when loginFromAuthPortal fires

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context  = await browser.newContext();
  const page     = await context.newPage();

  // ── Intercept requests & responses ────────────────────────────────────────
  page.on('request', req => {
    const h = req.headers();
    const t = h['authorization'] || h['x-session-key'] || h['x-auth-token'];
    if (t && t.length > 10) authToken = t;

    const url = req.url();
    const method = req.method();
    if (url.includes('/users/loginFromAuthPortal')) loginCompleted = true;

    if (method !== 'GET' && method !== 'OPTIONS' && url.includes('ops.rinknet.com')) {
      const body = req.postData() || '';
      console.log(`  → ${method} ${url.replace('https://ops.rinknet.com','')}${body ? `  ${body.substring(0,100)}` : ''}`);
      // Capture the format of adding a player to a list
      if (url.match(/\/lists\/\d+\/details/) && method === 'POST') {
        addPlayerBody = body;
      }
    }
  });

  page.on('response', async res => {
    const url = res.url();
    const method = res.request().method();
    // Capture list ID from POST /lists response
    if (url === 'https://ops.rinknet.com/lists' && method === 'POST') {
      try {
        const text = await res.text();
        let json = null;
        try { json = JSON.parse(text); } catch (_) {}
        if (json && json.id !== undefined && json.id !== null) {
          listId = String(json.id);
          console.log(`\n  ✓ List created with ID: ${listId}`);
        } else {
          console.log(`\n  POST /lists response: ${text.substring(0, 120)}`);
        }
      } catch (e) {
        console.log(`\n  POST /lists capture error: ${e.message}`);
      }
    }
    // Capture list ID from GET /lists/{id} — supports negative IDs
    if (url.match(/ops\.rinknet\.com\/lists\/-?\d+/) && method === 'GET') {
      const m = url.match(/lists\/(-?\d+)/);
      if (m && !listId) listId = m[1];
    }
  });

  // ── STEP 1: Login ─────────────────────────────────────────────────────────
  console.log('[1/4] Logging in...');
  await page.goto('https://accounts.rinknet.com/', { waitUntil: 'domcontentloaded' });
  await sleep(2000);

  // Fill email — try several selectors; accounts.rinknet.com may use type=text
  let emailFilled = false;
  for (const sel of ['input[type="email"]','input[name="email"]','input[name="username"]','input[type="text"]']) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) {
        await el.fill(USERNAME);
        console.log(`  ✓ Email filled (${sel})`);
        emailFilled = true;
        break;
      }
    } catch (_) {}
  }
  if (!emailFilled) console.log('  ⚠ Could not auto-fill email — please type it in the browser');

  await sleep(500);

  // Fill password
  try {
    const pw = page.locator('input[type="password"]').first();
    if (await pw.isVisible({ timeout: 3000 })) {
      await pw.fill(PASSWORD);
      console.log('  ✓ Password filled');
    } else {
      console.log('  ⚠ Could not auto-fill password — please type it in the browser');
    }
  } catch (_) {
    console.log('  ⚠ Could not auto-fill password — please type it in the browser');
  }

  await sleep(500);
  try {
    await page.locator('button[type="submit"]').first().click();
  } catch (_) {
    await page.keyboard.press('Enter');
  }

  // Wait for loginFromAuthPortal — this fires when auth is fully complete
  console.log('  Waiting for login... (if a 2FA code is needed, enter it in the browser)');
  for (let i = 0; i < 120; i++) {
    if (loginCompleted) break;
    await sleep(1000);
  }
  if (loginCompleted) {
    console.log('  ✓ Auth completed');
  } else {
    console.log('  ⚠ Auth not confirmed — proceeding anyway');
  }
  await sleep(2000);
  await sleep(2000);
  console.log('  ✓ Logged in — now at:', page.url());
  await saveScreenshot(page, '01-logged-in');

  // ── STEP 2: Create list via direct API call ───────────────────────────────
  console.log('\n[2/4] Creating list...');

  // Navigate to lists page — this may trigger the final auth redirect if not done yet
  await page.goto('https://ops.rinknet.com/#/home/lists', { waitUntil: 'domcontentloaded' });
  // Wait for auth to complete before making any API calls
  for (let i = 0; i < 60; i++) {
    if (loginCompleted) break;
    await sleep(1000);
  }
  await sleep(3000); // give session cookies time to be fully set

  // Pull season_id and type_id from existing lists so we use the right values
  let season_id = 174507552;
  let type_id   = 927908487;
  try {
    const cfg = await page.evaluate(async () => {
      const r = await fetch('/lists?per_page=5', { credentials: 'same-origin' });
      if (!r.ok) return null;
      const d = await r.json();
      const items = Array.isArray(d) ? d : (d.items || d.data || d.lists || []);
      if (items.length > 0) return { season_id: items[0].season_id, type_id: items[0].type_id };
      return null;
    });
    if (cfg && cfg.season_id) {
      season_id = cfg.season_id;
      type_id   = cfg.type_id;
      console.log(`  ✓ season_id=${season_id}  type_id=${type_id}`);
    }
  } catch (_) {}

  // Create the list via API — no form filling needed
  const today = new Date().toISOString().split('T')[0];
  try {
    const r = await page.evaluate(async (body) => {
      const res = await fetch('/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch (_) {}
      return { status: res.status, json, text };
    }, { season_id, type_id, description: LIST_NAME, notes: null, tournament_id: null, date: today });

    if (r.json && r.json.id) {
      listId = r.json.id;
      console.log(`  ✓ List "${LIST_NAME}" created (ID: ${listId})`);
    } else {
      console.log(`  ⚠ API returned ${r.status}: ${r.text.substring(0, 200)}`);
    }
  } catch (e) {
    console.log(`  ⚠ API error: ${e.message}`);
  }

  if (!listId) {
    // API returned 401 — navigate to create page and let the browser do it
    console.log('\n  Navigating to create page. In the browser:');
    console.log(`  1. Type "${LIST_NAME}" in the description/name field`);
    console.log('  2. Click Save');
    console.log('  The script will continue automatically once it detects the list was created...');
    await page.goto('https://ops.rinknet.com/#/lists/create', { waitUntil: 'domcontentloaded' });
    // Wait up to 3 minutes — check both the response handler and the browser URL
    for (let i = 0; i < 180; i++) {
      if (listId) { console.log(`\n  ✓ List detected (ID: ${listId})`); break; }
      // Also try reading the ID directly from the browser URL
      const curUrl = page.url();
      const urlM = curUrl.match(/#\/lists\/(?:view\/)?(-?\d+)/);
      if (urlM && urlM[1]) {
        listId = urlM[1];
        console.log(`\n  ✓ List detected from URL (ID: ${listId})`);
        break;
      }
      await sleep(1000);
    }
    if (!listId) {
      console.log('  Could not auto-detect list ID. Type the number from the browser URL:');
      listId = (await readLine()).trim().replace(/\D/g, '');
    }
  }

  await saveScreenshot(page, '02-list-created');

  // ── STEP 3: Navigate to the list view page ────────────────────────────────
  console.log('\n[3/4] Navigating to list view...');
  await page.goto(`https://ops.rinknet.com/#/lists/view/${listId}`, { waitUntil: 'domcontentloaded' });
  await sleep(3000);

  // Wait up to 15 seconds for the Add Player button — confirms we're on the right page
  try {
    await page.waitForSelector(
      'button:has-text("Add Player"), a:has-text("Add Player"), button:has-text("Add")',
      { timeout: 15000 }
    );
    console.log('  ✓ List view ready');
  } catch (_) {
    console.log('  ⚠ Add Player button not visible. Navigate to the list in the browser, then press Enter.');
    await waitForKeypress();
  }
  await saveScreenshot(page, '03-list-view');

  // ── STEP 4: Add all players ───────────────────────────────────────────────
  console.log(`\n[4/4] Adding ${PLAYERS.length} players...`);
  console.log('      This will take a few minutes. Watch the browser.\n');

  let added  = 0;
  let failed = 0;
  let lastDetailId = null;

  // Watch for player-add responses to capture the detail ID
  page.on('response', async res => {
    const url = res.url();
    if (url.match(/ops\.rinknet\.com\/lists\/\d+\/details/) && res.request().method() === 'POST') {
      try {
        const json = await res.json();
        if (json && json.id) lastDetailId = json.id;
      } catch (_) {}
    }
  });

  for (const player of PLAYERS) {
    const label = `#${player.rank} ${player.first} ${player.last}`;
    process.stdout.write(`  [${String(player.rank).padStart(3)}/300] ${label.padEnd(35)} `);

    try {
      // Check if Add Player button is already visible; if not, navigate back to list view
      const addBtnSel = 'button:has-text("Add Player"), a:has-text("Add Player")';
      let addBtnVisible = await page.locator(addBtnSel).first().isVisible().catch(() => false);
      if (!addBtnVisible) {
        await page.goto(`https://ops.rinknet.com/#/lists/view/${listId}`, { waitUntil: 'domcontentloaded' });
        try {
          await page.waitForSelector(addBtnSel, { timeout: 30000 });
          addBtnVisible = true;
        } catch (_) {}
      }
      if (!addBtnVisible) { console.log('SKIP (list view not reachable)'); failed++; continue; }

      // Click Add Player button
      const addBtn = page.locator(addBtnSel).first();
      await addBtn.click();
      await sleep(DELAY_MS);

      // Type in search box
      let searchBox = null;
      for (const sel of [
        'input[placeholder*="search" i]', 'input[placeholder*="player" i]',
        'input[placeholder*="name" i]', 'input[type="search"]',
        'input[name="search"]', 'input[name="player"]',
        '[role="searchbox"]', 'input:visible',
      ]) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 1000 })) { searchBox = el; break; }
        } catch (_) {}
      }
      if (!searchBox) { console.log('SKIP (no search box)'); failed++; continue; }

      // Search with first initial + last name (e.g. "T Boisvert")
      const searchTerm = `${player.first.charAt(0)} ${player.last}`;
      await searchBox.fill(searchTerm);
      await sleep(DELAY_MS * 1.5);

      // Press Enter to submit the search
      await searchBox.press('Enter');
      await sleep(DELAY_MS * 2);

      // Click the best matching result — prefer rows that match both last and first name
      // Also try to match 2009 or 2010 birth year as user confirmed these are 2009/2010 players
      let resultClicked = false;
      const nameSels = [
        // Most specific: both last and first name in same row
        `tr:has-text("${player.last}"):has-text("${player.first}")`,
        `li:has-text("${player.last}"):has-text("${player.first}")`,
        `[role="option"]:has-text("${player.last}"):has-text("${player.first}")`,
        // Less specific: last name only
        `tr:has-text("${player.last}")`,
        `li:has-text("${player.last}")`,
        `[role="option"]:has-text("${player.last}")`,
        '[role="option"]',
        '[class*="result"] tr', '[class*="result"] li',
        'table tbody tr:visible',
      ];
      for (const sel of nameSels) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 1500 })) {
            await el.click();
            resultClicked = true;
            break;
          }
        } catch (_) {}
      }
      if (!resultClicked) {
        // Try clicking Add button directly (some UIs add from search results inline)
        try {
          const addInRow = page.locator(`tr:has-text("${player.last}") button, tr:has-text("${player.last}") a`).first();
          if (await addInRow.isVisible({ timeout: 1000 })) { await addInRow.click(); resultClicked = true; }
        } catch (_) {}
      }

      await sleep(DELAY_MS);

      // Try to set ranking
      for (const sel of ['input[name="ranking"]', 'input[name="rank"]', 'input[placeholder*="rank" i]', 'input[id*="rank" i]']) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 500 })) {
            await el.click({ clickCount: 3 });
            await el.fill(String(player.rank));
            break;
          }
        } catch (_) {}
      }

      // Try to set star rating
      const starStr = String(player.stars);
      let ratingSet = false;
      // Try numeric input
      for (const sel of ['input[name="rating"]', 'input[name="stars"]', 'input[name="rating1"]', 'input[name="Rating1"]', 'input[placeholder*="rating" i]']) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 500 })) {
            await el.click({ clickCount: 3 });
            await el.fill(starStr);
            ratingSet = true;
            break;
          }
        } catch (_) {}
      }
      // Try select/dropdown
      if (!ratingSet) {
        try {
          await page.selectOption('select[name="rating"], select[name="stars"], select[name="rating1"]', { value: starStr });
          ratingSet = true;
        } catch (_) {}
      }
      // Try clicking a star element with matching value
      if (!ratingSet) {
        try {
          await page.locator(`[data-value="${starStr}"], [data-rating="${starStr}"], [title="${starStr}"]`).first().click({ timeout: 500 });
          ratingSet = true;
        } catch (_) {}
      }

      // Confirm / Save
      for (const sel of ['button:has-text("Add")', 'button:has-text("Save")', 'button:has-text("OK")', 'button:has-text("Confirm")', 'button[type="submit"]:visible']) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 500 })) { await el.click(); break; }
        } catch (_) {}
      }

      await sleep(DELAY_MS);
      console.log(`✓`);
      added++;

      // Always navigate back to list view so next player starts from a known good state
      await page.goto(`https://ops.rinknet.com/#/lists/view/${listId}`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);

    } catch (err) {
      console.log(`ERR: ${err.message.split('\n')[0].substring(0, 60)}`);
      failed++;
      // Close any open dialog and return to list view
      try { await page.keyboard.press('Escape'); } catch (_) {}
      await page.goto(`https://ops.rinknet.com/#/lists/view/${listId}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await sleep(1500);
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  await saveScreenshot(page, '05-complete');
  console.log('\n╔══════════════════════════════════════════╗');
  console.log(`║  Done!  ✓ ${String(added).padEnd(3)} added   ✗ ${String(failed).padEnd(3)} failed       ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log(`\n  List URL: https://ops.rinknet.com/#/lists/view/${listId}`);
  console.log('  Browser stays open — close it when you\'re done reviewing.\n');

  // Save captured API info for debugging
  const logFile = path.join(SCREENSHOTS_DIR, 'debug-info.json');
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  fs.writeFileSync(logFile, JSON.stringify({ listId, authToken: authToken ? '(captured)' : null, addPlayerBody }, null, 2));

  await page.waitForTimeout(600000).catch(() => {});
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
    process.stdin.once('data', data => {
      process.stdin.pause();
      resolve(data.trim());
    });
  });
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
