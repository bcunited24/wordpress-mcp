#!/usr/bin/env node
/**
 * RinkNet Rankings Importer
 *
 * Automates importing 300 player rankings into a RinkNet List with star ratings.
 *
 * ── SETUP (one-time) ──────────────────────────────────────────────────────────
 *  1. Install Node.js  →  https://nodejs.org  (download the LTS version)
 *  2. Open a terminal / command prompt in this folder, then run:
 *       npm install playwright
 *       npx playwright install chromium
 *  3. Run the script:
 *       node rinknet-import.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

// ── CONFIGURATION ─────────────────────────────────────────────────────────────
const USERNAME  = 'bcollins@neutralzone.net';
const PASSWORD  = 'NZhockey24!';
const LIST_NAME = '2026 NZ Rankings';   // ← Change this to whatever you want the list called
const DELAY_MS  = 600;                  // Pause between actions (increase if your internet is slow)
const SCREENSHOTS_DIR = './rinknet-screenshots';
// ─────────────────────────────────────────────────────────────────────────────

// ── PLAYER DATA (from Google Sheet) ──────────────────────────────────────────
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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function screenshot(page, name) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const file = path.join(SCREENSHOTS_DIR, `${Date.now()}-${name}.png`);
  return page.screenshot({ path: file, fullPage: true }).then(() => console.log(`  📸 Saved: ${file}`));
}

// Attempt to click the first matching selector from a list
async function tryClick(page, selectors, description) {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) {
        await el.click();
        console.log(`  ✓ Clicked: ${description} (${sel})`);
        return true;
      }
    } catch (_) {}
  }
  console.log(`  ⚠ Could not find: ${description}`);
  return false;
}

// Fill the first visible input from a list of selectors
async function tryFill(page, selectors, value, description) {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) {
        await el.fill(value);
        console.log(`  ✓ Filled: ${description}`);
        return true;
      }
    } catch (_) {}
  }
  console.log(`  ⚠ Could not fill: ${description}`);
  return false;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║      RinkNet Rankings Importer            ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  // Track all non-GET API calls so we can learn the write API
  const capturedWrites = [];
  let sessionKey = null;

  const browser = await chromium.launch({
    headless: false,           // You can watch the browser work
    slowMo: 150,               // Slight slow-down so you can follow along
  });

  const context = await browser.newContext();
  const page    = await context.newPage();

  // ── Intercept every request ──────────────────────────────────────────────
  await page.route('**/*', async route => {
    const req     = route.request();
    const url     = req.url();
    const method  = req.method();
    const headers = req.headers();

    // Capture session/auth tokens
    const auth = headers['authorization'] || headers['x-session-key'] || headers['x-api-key'];
    if (auth && auth.length > 10) sessionKey = auth;

    // Log and capture non-GET calls (these are writes)
    if (method !== 'GET' && method !== 'OPTIONS' && url.includes('rinknet')) {
      const body = req.postData();
      capturedWrites.push({ url, method, headers, body });
      console.log(`  → ${method} ${url}`);
      if (body) console.log(`     Body: ${body.substring(0, 120)}`);
    }

    await route.continue();
  });

  // ── STEP 1: Login ─────────────────────────────────────────────────────────
  console.log('\n[1/4] Logging in to RinkNet...');
  await page.goto('https://accounts.rinknet.com/', { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  await screenshot(page, '01-login-page');

  // Try common email/password field selectors
  await tryFill(page, [
    'input[type="email"]',
    'input[name="email"]',
    'input[name="username"]',
    'input[name="login"]',
    'input[placeholder*="email" i]',
    'input[placeholder*="user" i]',
    'input[id*="email" i]',
    'input[id*="user" i]',
  ], USERNAME, 'email/username field');

  await tryFill(page, [
    'input[type="password"]',
    'input[name="password"]',
    'input[placeholder*="pass" i]',
    'input[id*="pass" i]',
  ], PASSWORD, 'password field');

  await sleep(500);

  // Click submit
  const submitted = await tryClick(page, [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Login")',
    'button:has-text("Sign in")',
    'button:has-text("Log in")',
    'button:has-text("Connexion")',
    '[class*="login" i] button',
    '[class*="submit" i]',
  ], 'login button');

  if (!submitted) {
    console.log('\n  Browser is open — please log in manually, then press Enter here.');
    await waitForKeypress();
  }

  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await sleep(2000);
  await screenshot(page, '02-after-login');
  console.log('  ✓ Login complete');

  // ── STEP 2: Navigate to Lists ─────────────────────────────────────────────
  console.log('\n[2/4] Navigating to Lists...');

  const navClicked = await tryClick(page, [
    'a:has-text("Lists")',
    '[href*="list" i]',
    '[routerlink*="list" i]',
    'nav a:has-text("List")',
    '[class*="menu" i] a:has-text("List")',
    '[class*="nav" i] a:has-text("List")',
    'li:has-text("Lists") a',
    'li:has-text("List") a',
    'span:has-text("Lists")',
  ], 'Lists navigation item');

  await sleep(2000);
  await screenshot(page, '03-lists-page');

  if (!navClicked) {
    console.log('\n  ⚠ Could not find the Lists menu automatically.');
    console.log('  Please click on "Lists" in the RinkNet menu, then press Enter here.');
    await waitForKeypress();
    await screenshot(page, '03b-lists-manual');
  }

  // ── STEP 3: Create new list ───────────────────────────────────────────────
  console.log(`\n[3/4] Creating new list: "${LIST_NAME}"...`);

  const createClicked = await tryClick(page, [
    'button:has-text("New List")',
    'button:has-text("Create List")',
    'button:has-text("Add List")',
    'button:has-text("New")',
    'button:has-text("Create")',
    'a:has-text("New List")',
    'a:has-text("Create List")',
    '[class*="add" i]:has-text("List")',
    '[data-action="create"]',
    '[title*="new" i]',
    '[title*="create" i]',
    '[aria-label*="new list" i]',
  ], 'Create/New List button');

  await sleep(1500);

  if (!createClicked) {
    console.log('\n  ⚠ Could not find the "New List" button automatically.');
    console.log('  Please click the button to create a new list, then press Enter here.');
    await waitForKeypress();
  }

  // Fill in the list name
  await tryFill(page, [
    'input[placeholder*="name" i]',
    'input[placeholder*="list" i]',
    'input[name="name"]',
    'input[name="description"]',
    'input[name="listName"]',
    'input[id*="name" i]',
    'input[id*="description" i]',
    'textarea[placeholder*="name" i]',
    'input[type="text"]:visible',
  ], LIST_NAME, 'list name field');

  await sleep(500);

  // Save the new list
  await tryClick(page, [
    'button:has-text("Save")',
    'button:has-text("Create")',
    'button:has-text("OK")',
    'button:has-text("Confirm")',
    'button[type="submit"]',
    '[class*="save" i]',
    '[class*="confirm" i]',
  ], 'Save list button');

  await sleep(2000);
  await screenshot(page, '04-list-created');

  // ── STEP 4: Add players ───────────────────────────────────────────────────
  console.log(`\n[4/4] Adding ${PLAYERS.length} players to the list...`);
  console.log('      This will take several minutes — the browser will do it automatically.\n');

  let added  = 0;
  let failed = 0;

  for (const player of PLAYERS) {
    const label = `#${player.rank} ${player.first} ${player.last}`;
    process.stdout.write(`  [${player.rank}/300] ${label} ... `);

    try {
      // Click "Add Player" button
      const addClicked = await tryClick(page, [
        'button:has-text("Add Player")',
        'button:has-text("Add")',
        '[class*="add-player" i]',
        '[class*="addPlayer" i]',
        '[data-action="add-player"]',
        '[aria-label*="add player" i]',
        '[title*="add player" i]',
      ], `add player for ${label}`);

      if (!addClicked) {
        console.log('SKIP (no Add button)');
        failed++;
        continue;
      }

      await sleep(DELAY_MS);

      // Search for the player by last name then first name
      const searchFilled = await tryFill(page, [
        'input[placeholder*="search" i]',
        'input[placeholder*="player" i]',
        'input[placeholder*="name" i]',
        'input[type="search"]',
        'input[name="search"]',
        'input[name="player"]',
        '[class*="search" i] input',
        '[class*="player-search" i] input',
      ], player.last, `search for ${label}`);

      if (!searchFilled) {
        await tryClick(page, ['button:has-text("Cancel")', 'button:has-text("Close")', '[aria-label*="close" i]'], 'close dialog');
        console.log('SKIP (no search field)');
        failed++;
        continue;
      }

      await sleep(DELAY_MS * 1.5);

      // Look for the player in search results
      const playerSelectors = [
        `tr:has-text("${player.last}"):has-text("${player.first}")`,
        `li:has-text("${player.last}"):has-text("${player.first}")`,
        `[class*="result" i]:has-text("${player.last}")`,
        `[class*="player" i]:has-text("${player.last}")`,
        `td:has-text("${player.last}")`,
      ];

      let playerSelected = false;
      for (const sel of playerSelectors) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 2000 })) {
            await el.click();
            playerSelected = true;
            break;
          }
        } catch (_) {}
      }

      if (!playerSelected) {
        // Try clicking the first result
        try {
          const firstResult = page.locator('[class*="result" i], [class*="option" i], tr[class*="player" i]').first();
          if (await firstResult.isVisible({ timeout: 1500 })) {
            await firstResult.click();
            playerSelected = true;
          }
        } catch (_) {}
      }

      await sleep(DELAY_MS);

      // Set the ranking
      await tryFill(page, [
        'input[name="ranking"]',
        'input[name="rank"]',
        'input[placeholder*="rank" i]',
        'input[id*="rank" i]',
      ], String(player.rank), `rank for ${label}`);

      // Set the star rating — try a dropdown or select first
      const starStr = String(player.stars);
      const ratingSet = await tryFill(page, [
        'input[name="rating"]',
        'input[name="stars"]',
        'input[name="rating1"]',
        'input[name="Rating1"]',
        'input[placeholder*="rating" i]',
        'input[placeholder*="star" i]',
      ], starStr, `star rating for ${label}`);

      if (!ratingSet) {
        // Try selecting from a dropdown
        await tryClick(page, [
          `select option[value="${starStr}"]`,
          `[class*="rating" i] [value="${starStr}"]`,
          `[class*="star" i][data-value="${starStr}"]`,
        ], `star rating dropdown for ${label}`);
      }

      await sleep(DELAY_MS / 2);

      // Confirm / Save this player
      await tryClick(page, [
        'button:has-text("Add")',
        'button:has-text("Save")',
        'button:has-text("OK")',
        'button:has-text("Confirm")',
        'button[type="submit"]:visible',
      ], `confirm add for ${label}`);

      await sleep(DELAY_MS);
      console.log('✓');
      added++;

    } catch (err) {
      console.log(`ERROR: ${err.message.split('\n')[0]}`);
      failed++;
      // Try to close any open dialog and continue
      await tryClick(page, ['button:has-text("Cancel")', 'button:has-text("Close")', '[aria-label*="close" i]'], 'close on error');
      await sleep(DELAY_MS);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  await screenshot(page, '05-complete');

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log(`║  Done!  Added: ${String(added).padEnd(3)}  Failed: ${String(failed).padEnd(3)}  Total: 300  ║`);
  console.log('╚═══════════════════════════════════════════╝');

  if (capturedWrites.length > 0) {
    const logFile = path.join(SCREENSHOTS_DIR, 'api-calls.json');
    fs.writeFileSync(logFile, JSON.stringify(capturedWrites, null, 2));
    console.log(`\n  API calls saved to: ${logFile}`);
  }

  console.log('\n  The browser will stay open so you can review the results.');
  console.log('  Close the browser window when you are done.\n');

  // Keep browser open for review
  await page.waitForTimeout(600000).catch(() => {});
  await browser.close();
}

// Wait for Enter key in terminal
function waitForKeypress() {
  return new Promise(resolve => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
