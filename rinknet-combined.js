#!/usr/bin/env node
/**
 * RinkNet — QMJHL Combined Rankings (USA + Canada)
 * List ID: -1716928099
 * All players are 2009 or 2010 birth year.
 *
 * RUN:  node rinknet-combined.js
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
  { rank:1,   last:'Boisvert',              first:'Thomas',            stars:4.50 },
  { rank:2,   last:'McKinnon',              first:'Jacob',             stars:4.50 },
  { rank:3,   last:'Boutet',                first:'Vincent',           stars:4.50 },
  { rank:4,   last:'Bergeron',              first:'Julien',            stars:4.50 },
  { rank:5,   last:'Charbonneau',           first:'Zaac',              stars:4.50 },
  { rank:6,   last:'Queally',               first:'John',              stars:4.25 },
  { rank:7,   last:'Lemieux',               first:'Pierre-Alexandre',  stars:4.25 },
  { rank:8,   last:'Tremblay',              first:'Aslan',             stars:4.25 },
  { rank:9,   last:'Gagnon',                first:'Justin',            stars:4.25 },
  { rank:10,  last:'Royer',                 first:'Jakob',             stars:4.25 },
  { rank:11,  last:'Lee',                   first:'Samuel',            stars:4.25 },
  { rank:12,  last:'Leduc',                 first:'Damien',            stars:4.25 },
  { rank:13,  last:'Wilichoski',            first:'Blake',             stars:4.25 },
  { rank:14,  last:'Williams',              first:'Lawrence',          stars:4.25 },
  { rank:15,  last:'Nowlan',                first:'Samuel',            stars:4.25 },
  { rank:16,  last:'Cameron',               first:'Jack',              stars:4.25 },
  { rank:17,  last:'Brien',                 first:'Max',               stars:4.25 },
  { rank:18,  last:'Cotter',                first:'Logan',             stars:4.25 },
  { rank:19,  last:'Norris',                first:'Damian',            stars:4.25 },
  { rank:20,  last:'Guévin',                first:'Émile',             stars:4.25 },
  { rank:21,  last:'Sawyer',                first:'CJ',                stars:4.25 },
  { rank:22,  last:'Menard',                first:'Emrik',             stars:4.00 },
  { rank:23,  last:'Tremblay',              first:'Malik',             stars:4.00 },
  { rank:24,  last:'Dekleine',              first:'Robert',            stars:4.00 },
  { rank:25,  last:'Borsellino',            first:'Domenico',          stars:4.00 },
  { rank:26,  last:'Roy',                   first:'Enzo',              stars:4.00 },
  { rank:27,  last:'Thisdelle',             first:'Maveric',           stars:4.00 },
  { rank:28,  last:'Lazare',                first:'Bryce',             stars:4.00 },
  { rank:29,  last:'Roy',                   first:'Nathan-Nicolas',    stars:4.00 },
  { rank:30,  last:'Faucher',               first:'Eliot',             stars:4.00 },
  { rank:31,  last:'Lainesse',              first:'Zachary',           stars:4.00 },
  { rank:32,  last:'Frost',                 first:'Nathan',            stars:4.00 },
  { rank:33,  last:'Felt',                  first:'Carter',            stars:4.00 },
  { rank:34,  last:'Tétreault',             first:'Raphaël',           stars:4.00 },
  { rank:35,  last:'Leroux',                first:'Tommy',             stars:4.00 },
  { rank:36,  last:'Levy',                  first:'Enzo',              stars:4.00 },
  { rank:37,  last:'Blanchette',            first:'Alexy',             stars:4.00 },
  { rank:38,  last:'Conroy',                first:'Jackson',           stars:4.00 },
  { rank:39,  last:'Roy',                   first:'Matteo',            stars:4.00 },
  { rank:40,  last:'Currie',                first:'Dylan',             stars:4.00 },
  { rank:41,  last:'Stonacek',              first:'Mason',             stars:4.00 },
  { rank:42,  last:'Coache-Luqman',         first:'Gabriel',           stars:4.00 },
  { rank:43,  last:'Noel',                  first:'Alexandre',         stars:4.00 },
  { rank:44,  last:'Ware',                  first:'Nick',              stars:4.00 },
  { rank:45,  last:'Tillman',               first:'Jayden',            stars:4.00 },
  { rank:46,  last:'Bolduc',                first:'Axel',              stars:4.00 },
  { rank:47,  last:'Généreux',              first:'Mathieu',           stars:4.00 },
  { rank:48,  last:'Riendeau',              first:'Nathan',            stars:4.00 },
  { rank:49,  last:'Gingeleskie',           first:'Ethan',             stars:3.75 },
  { rank:50,  last:'Boulanger',             first:'Nathan',            stars:3.75 },
  { rank:51,  last:'Lackman',               first:'Joey',              stars:3.75 },
  { rank:52,  last:'Porter',                first:'Ryan',              stars:3.75 },
  { rank:53,  last:'Martin',                first:'Brendan',           stars:3.75 },
  { rank:54,  last:'Cleary',                first:'Chase',             stars:3.75 },
  { rank:55,  last:'Guérard',               first:'Simon-Olivier',     stars:3.75 },
  { rank:56,  last:'Ouellette',             first:'Mavrick',           stars:3.75 },
  { rank:57,  last:'Needham',               first:'Jameson',           stars:3.75 },
  { rank:58,  last:'Robichaud',             first:'Julien',            stars:3.75 },
  { rank:59,  last:'Bégin',                 first:'Joey',              stars:3.75 },
  { rank:60,  last:'Flemming',              first:'Morgan',            stars:3.75 },
  { rank:61,  last:'Cantin',                first:'Simon',             stars:3.75 },
  { rank:62,  last:'Deslauriers',           first:'Lou',               stars:3.75 },
  { rank:63,  last:'Leclair',               first:'Logan',             stars:3.75 },
  { rank:64,  last:'Panagakos',             first:'George',            stars:3.75 },
  { rank:65,  last:'Beaudoin',              first:'Maxime-Alexandre',  stars:3.75 },
  { rank:66,  last:'Fishbone',              first:'Samuel',            stars:3.75 },
  { rank:67,  last:'Sylla',                 first:'Elijah',            stars:3.75 },
  { rank:68,  last:'Lavoie',                first:'Zachary',           stars:3.75 },
  { rank:69,  last:'St. Laurent',           first:'Joey',              stars:3.75 },
  { rank:70,  last:'Poulin',                first:'Loïk',              stars:3.75 },
  { rank:71,  last:'Gervais',               first:'Xavier',            stars:3.75 },
  { rank:72,  last:'Deschamps',             first:'Alexandre',         stars:3.75 },
  { rank:73,  last:'Lundin',                first:'Owen',              stars:3.75 },
  { rank:74,  last:'Giberson',              first:'Carter',            stars:3.75 },
  { rank:75,  last:'Bélanger',              first:'Malek',             stars:3.75 },
  { rank:76,  last:'Roy',                   first:'Damien',            stars:3.75 },
  { rank:77,  last:'Perreault',             first:'Mikael',            stars:3.75 },
  { rank:78,  last:'Rioux',                 first:'Émile',             stars:3.75 },
  { rank:79,  last:'Fournier',              first:'Liam',              stars:3.75 },
  { rank:80,  last:'McGuire',               first:'Luke',              stars:3.75 },
  { rank:81,  last:'Duffy',                 first:'Liam',              stars:3.75 },
  { rank:82,  last:'Guo',                   first:'Alexander',         stars:3.75 },
  { rank:83,  last:'Delarosbil',            first:'Simon',             stars:3.75 },
  { rank:84,  last:'Leblanc',               first:'Nathan',            stars:3.75 },
  { rank:85,  last:'Calla',                 first:'Jamie',             stars:3.75 },
  { rank:86,  last:'Shea',                  first:'Jayden',            stars:3.75 },
  { rank:87,  last:"O'Connell",             first:'Noah',              stars:3.75 },
  { rank:88,  last:'Odell',                 first:'Carter',            stars:3.75 },
  { rank:89,  last:'Barrett',               first:'Michael',           stars:3.75 },
  { rank:90,  last:'Walsh',                 first:'Colin',             stars:3.75 },
  { rank:91,  last:'Salvas',                first:'Edouard',           stars:3.75 },
  { rank:92,  last:'Vincent',               first:'William',           stars:3.75 },
  { rank:93,  last:'Walsh',                 first:'Kasen',             stars:3.75 },
  { rank:94,  last:'Khoury',                first:'Mathis',            stars:3.75 },
  { rank:95,  last:'Hanley',                first:'Eric',              stars:3.75 },
  { rank:96,  last:'Torres',                first:'Will',              stars:3.75 },
  { rank:97,  last:'Chartrand-Bongono',     first:'Pierre-Antoine',    stars:3.75 },
  { rank:98,  last:'Proulx',                first:'Keaven',            stars:3.75 },
  { rank:99,  last:'Jaillet',               first:'Jamie',             stars:3.75 },
  { rank:100, last:'Blanchette',            first:'Louka',             stars:3.75 },
  { rank:101, last:'Sproule',               first:'William',           stars:3.75 },
  { rank:102, last:'Lesage',                first:'Xavier',            stars:3.75 },
  { rank:103, last:'Légaré',                first:'Hugo',              stars:3.75 },
  { rank:104, last:'Donatelli',             first:'Jake',              stars:3.75 },
  { rank:105, last:'Pelletier',             first:'Caleb',             stars:3.75 },
  { rank:106, last:'Necak',                 first:'Olivier',           stars:3.75 },
  { rank:107, last:'Wohlers',               first:'Mason',             stars:3.75 },
  { rank:108, last:'Poti',                  first:'Tyler',             stars:3.75 },
  { rank:109, last:'Short',                 first:'Drew',              stars:3.75 },
  { rank:110, last:'Théorêt',               first:'Félix',             stars:3.75 },
  { rank:111, last:'Bergeron',              first:'Hugo',              stars:3.75 },
  { rank:112, last:'Truchon',               first:'Raphaël',           stars:3.75 },
  { rank:113, last:'Strong',                first:'Cooper',            stars:3.75 },
  { rank:114, last:'Turcotte',              first:'Alexis',            stars:3.75 },
  { rank:115, last:'Kelly',                 first:'Colten',            stars:3.75 },
  { rank:116, last:'Cardillo',              first:'Justin',            stars:3.75 },
  { rank:117, last:"O'Shaughnessy",         first:'Colby',             stars:3.75 },
  { rank:118, last:'Durocher',              first:'Thomas',            stars:3.75 },
  { rank:119, last:'Bernardinelli',         first:'Jesse',             stars:3.75 },
  { rank:120, last:'Vaillancourt',          first:'Hugo',              stars:3.75 },
  { rank:121, last:'Sorgini',               first:'Gabriel',           stars:3.75 },
  { rank:122, last:'Pavlik',                first:'Kuba',              stars:3.75 },
  { rank:123, last:'Petropoulos',           first:'TJ',                stars:3.75 },
  { rank:124, last:"D'Elia",                first:'Tristan',           stars:3.75 },
  { rank:125, last:'Lacelle',               first:'Henry',             stars:3.75 },
  { rank:126, last:'Lafreniere',            first:'Olivier',           stars:3.75 },
  { rank:127, last:'De Franco',             first:'Isaac',             stars:3.75 },
  { rank:128, last:'Leduc',                 first:'Noah',              stars:3.75 },
  { rank:129, last:'Gagnon',                first:'Thomas',            stars:3.75 },
  { rank:130, last:'Wu',                    first:'Austin',            stars:3.75 },
  { rank:131, last:'Renaud',                first:'Zackary',           stars:3.75 },
  { rank:132, last:'Letendre',              first:'Justin',            stars:3.75 },
  { rank:133, last:'Toms',                  first:'Cole',              stars:3.50 },
  { rank:134, last:'Noonan',                first:'Cade',              stars:3.50 },
  { rank:135, last:'White',                 first:'Brayden',           stars:3.50 },
  { rank:136, last:'Di Marzo',              first:'Daniele',           stars:3.50 },
  { rank:137, last:'Lalonde',               first:'Jeremy',            stars:3.50 },
  { rank:138, last:'Cleaves',               first:'Colton',            stars:3.50 },
  { rank:139, last:'MacKay',                first:'Nate',              stars:3.50 },
  { rank:140, last:'Boulay',                first:'Xavier',            stars:3.50 },
  { rank:141, last:'Herrera',               first:'Julian',            stars:3.50 },
  { rank:142, last:'Gaudet',                first:'Justin',            stars:3.50 },
  { rank:143, last:'Martineau',             first:'Andrew',            stars:3.50 },
  { rank:144, last:'Savoie',                first:'Loïk',              stars:3.50 },
  { rank:145, last:'Frick',                 first:'Owen',              stars:3.50 },
  { rank:146, last:'Daigle',                first:'Cameron',           stars:3.50 },
  { rank:147, last:'Graham',                first:'Aiden',             stars:3.50 },
  { rank:148, last:'Jardine',               first:'Brycen',            stars:3.50 },
  { rank:149, last:'Rheaume',               first:'Mickael',           stars:3.50 },
  { rank:150, last:'Anderson',              first:'Brodie',            stars:3.50 },
  { rank:151, last:'Wood',                  first:'Dawson',            stars:3.50 },
  { rank:152, last:'Rowley',                first:'Grady',             stars:3.50 },
  { rank:153, last:'Waterhouse',            first:'Brayden',           stars:3.50 },
  { rank:154, last:'Hamel',                 first:'Justin',            stars:3.50 },
  { rank:155, last:'Chale',                 first:'Nathan',            stars:3.50 },
  { rank:156, last:'Warsofsky',             first:'Chase',             stars:3.50 },
  { rank:157, last:'Bolduc',                first:'Edward',            stars:3.50 },
  { rank:158, last:'Wang',                  first:'Alex',              stars:3.50 },
  { rank:159, last:'MacLean',               first:'Hunter',            stars:3.50 },
  { rank:160, last:'Desmeules',             first:'Nathan',            stars:3.50 },
  { rank:161, last:'Lacombe',               first:'Rayan',             stars:3.50 },
  { rank:162, last:'Bouchard',              first:'Émile',             stars:3.50 },
  { rank:163, last:'Labelle',               first:'Zack',              stars:3.50 },
  { rank:164, last:'Ethier',                first:'Eliot',             stars:3.50 },
  { rank:165, last:"O'Leary",               first:'Colin',             stars:3.50 },
  { rank:166, last:'St-Denis',              first:'Eloïk',             stars:3.50 },
  { rank:167, last:'Leblanc',               first:'Xavier',            stars:3.50 },
  { rank:168, last:'Machado',               first:'Ethan',             stars:3.50 },
  { rank:169, last:'Wragg',                 first:'Yoan',              stars:3.50 },
  { rank:170, last:'Sabourin',              first:'Jacob',             stars:3.50 },
  { rank:171, last:'Fraser',                first:'Jaxon',             stars:3.50 },
  { rank:172, last:'Carlin',                first:'Liam',              stars:3.50 },
  { rank:173, last:'Harvey',                first:'Philippe',          stars:3.50 },
  { rank:174, last:'Stafylakis',            first:'Konstantinos',      stars:3.50 },
  { rank:175, last:'Paradis',               first:'Alexandre',         stars:3.50 },
  { rank:176, last:'Collingwood',           first:'Henry',             stars:3.50 },
  { rank:177, last:'Fenstad',               first:'Kellan',            stars:3.50 },
  { rank:178, last:'MacDonald',             first:'Matt',              stars:3.50 },
  { rank:179, last:'Hekle',                 first:'Brayden',           stars:3.50 },
  { rank:180, last:'Abbott',                first:'Preston',           stars:3.50 },
  { rank:181, last:'Sy Lam Pham',           first:'Florent',           stars:3.50 },
  { rank:182, last:'Bond',                  first:'Thomas',            stars:3.50 },
  { rank:183, last:'Ward',                  first:'Blake',             stars:3.50 },
  { rank:184, last:'Perreault',             first:'Zac',               stars:3.50 },
  { rank:185, last:'Erickson',              first:'Brayden',           stars:3.50 },
  { rank:186, last:'Barrett',               first:'Nathan',            stars:3.50 },
  { rank:187, last:'Liarakos',              first:'Constantin',        stars:3.50 },
  { rank:188, last:'Laforce',               first:'Derek',             stars:3.50 },
  { rank:189, last:'Rumsey',                first:'Ben',               stars:3.50 },
  { rank:190, last:'Rossignol',             first:'Thomas',            stars:3.50 },
  { rank:191, last:'Robert',                first:'Maxim',             stars:3.50 },
  { rank:192, last:'Smith',                 first:'Jaden',             stars:3.50 },
  { rank:193, last:'Scranton',              first:'Kai',               stars:3.50 },
  { rank:194, last:'Roe',                   first:'Landon',            stars:3.50 },
  { rank:195, last:'Sleigher',              first:'Zack',              stars:3.50 },
  { rank:196, last:'Plante',                first:'Ludovic',           stars:3.50 },
  { rank:197, last:'Laplante',              first:'William',           stars:3.50 },
  { rank:198, last:'Duplantie',             first:'Dominic',           stars:3.50 },
  { rank:199, last:'Bibeau',                first:'Zachary',           stars:3.50 },
  { rank:200, last:'Kimura',                first:'Senji',             stars:3.50 },
  { rank:201, last:'Land',                  first:'Quinton',           stars:3.50 },
  { rank:202, last:"O'Neil",                first:'Sawyer',            stars:3.50 },
  { rank:203, last:'Alden',                 first:'Eben',              stars:3.50 },
  { rank:204, last:'De Pastena',            first:'Luca',              stars:3.50 },
  { rank:205, last:'Brotto',                first:'Lucca',             stars:3.50 },
  { rank:206, last:'Wilson',                first:'Matt',              stars:3.50 },
  { rank:207, last:'Hung',                  first:'Ethan',             stars:3.50 },
  { rank:208, last:'Oliveri',               first:'AJ',                stars:3.50 },
  { rank:209, last:'Woodley',               first:'Brayden',           stars:3.50 },
  { rank:210, last:'Boucher',               first:'Hudson',            stars:3.50 },
  { rank:211, last:'Grégoire',              first:'Benjamin',          stars:3.50 },
  { rank:212, last:'Hannah',                first:'Owen',              stars:3.50 },
  { rank:213, last:'Fils-Aime',             first:'Silas',             stars:3.50 },
  { rank:214, last:'Archange-Bourassa',     first:'Nathan',            stars:3.50 },
  { rank:215, last:'Darby',                 first:'Matthew',           stars:3.50 },
  { rank:216, last:'Luedke',                first:'Jackson',           stars:3.50 },
  { rank:217, last:'Boivin',                first:'Lucas',             stars:3.50 },
  { rank:218, last:'Baldwin',               first:'Jack',              stars:3.50 },
  { rank:219, last:'Egan',                  first:'Tommy',             stars:3.50 },
  { rank:220, last:'Côté',                  first:'William',           stars:3.50 },
  { rank:221, last:'Germain-Lacroix',       first:'Edouard',           stars:3.50 },
  { rank:222, last:'Marzi',                 first:'Jorden',            stars:3.50 },
  { rank:223, last:'Fleming',               first:'Jaxson',            stars:3.50 },
  { rank:224, last:'Gillis',                first:'London',            stars:3.50 },
  { rank:225, last:'Haverstock',            first:'Nash',              stars:3.50 },
  { rank:226, last:'Carlomusto',            first:'Nico',              stars:3.50 },
  { rank:227, last:'Beck',                  first:'Alexander',         stars:3.50 },
  { rank:228, last:'Duplessis',             first:'Miguel',            stars:3.50 },
  { rank:229, last:'Dickie',                first:'Brayden',           stars:3.50 },
  { rank:230, last:'Dwyer',                 first:'Sean',              stars:3.50 },
  { rank:231, last:'Noel',                  first:'Alexis',            stars:3.50 },
  { rank:232, last:'Morasse',               first:'Zach-Olivier',      stars:3.50 },
  { rank:233, last:'Guerriero',             first:'Jake',              stars:3.50 },
  { rank:234, last:'Wilson',                first:'Jeremy',            stars:3.50 },
  { rank:235, last:'Bélanger',              first:'Leo',               stars:3.50 },
  { rank:236, last:'Beaudry',               first:'Ben',               stars:3.50 },
  { rank:237, last:'MacPhee',               first:'Alistair',          stars:3.50 },
  { rank:238, last:'Delisle',               first:'Kingston',          stars:3.50 },
  { rank:239, last:'Allred',                first:'Andrew',            stars:3.50 },
  { rank:240, last:'Ouellette',             first:'Marc-Olivier',      stars:3.50 },
  { rank:241, last:'Shook',                 first:'Michael',           stars:3.50 },
  { rank:242, last:'Tulipano',              first:'Nicholas',          stars:3.50 },
  { rank:243, last:'Cardinal',              first:'Xavier',            stars:3.50 },
  { rank:244, last:'Boutilier',             first:'Blake',             stars:3.50 },
  { rank:245, last:'Houle',                 first:'Raphaël',           stars:3.50 },
  { rank:246, last:'Bowles',                first:'Liam',              stars:3.50 },
  { rank:247, last:'Meaden',                first:'Aaron',             stars:3.50 },
  { rank:248, last:'Loyer',                 first:'Esteban',           stars:3.50 },
  { rank:249, last:'Gorman',                first:'Nash',              stars:3.50 },
  { rank:250, last:'Thibault',              first:'Thomas',            stars:3.50 },
  { rank:251, last:'Stickney',              first:'Grady',             stars:3.50 },
  { rank:252, last:'Desjardins',            first:'Loïk',              stars:3.50 },
  { rank:253, last:'Hug',                   first:'Dylan',             stars:3.50 },
  { rank:254, last:'Brown',                 first:'Quinn',             stars:3.50 },
  { rank:255, last:'Brunelle',              first:'Antoine',           stars:3.50 },
  { rank:256, last:'Botelho',               first:'Zachary',           stars:3.50 },
  { rank:257, last:'Pichette',              first:'Alexis',            stars:3.50 },
  { rank:258, last:'Groeling',              first:'Phil',              stars:3.50 },
  { rank:259, last:'Martone',               first:'Giuliano',          stars:3.50 },
  { rank:260, last:'Robidoux',              first:'Willyam',           stars:3.50 },
  { rank:261, last:'Bertleff',              first:'Matthew',           stars:3.50 },
  { rank:262, last:'Gwaltney',              first:'Will',              stars:3.50 },
  { rank:263, last:'Houle',                 first:'Alexis',            stars:3.50 },
  { rank:264, last:'Urquhart',              first:'Andrew',            stars:3.25 },
  { rank:265, last:'Deschamps',             first:'Zak',               stars:3.25 },
  { rank:266, last:'Hubert',                first:'Renaud',            stars:3.25 },
  { rank:267, last:'Washipabano',           first:'Zane',              stars:3.25 },
  { rank:268, last:"O'Keefe",               first:'Hudson',            stars:3.25 },
  { rank:269, last:'Thibert',               first:'Gabriel',           stars:3.25 },
  { rank:270, last:'Furness',               first:'Graham',            stars:3.25 },
  { rank:271, last:'Pouget',                first:'Mae',               stars:3.25 },
  { rank:272, last:'Lachapelle',            first:'William',           stars:3.25 },
  { rank:273, last:'Hamlin',                first:'James',             stars:3.25 },
  { rank:274, last:'Olympia',               first:'Keith',             stars:3.25 },
  { rank:275, last:'Vorobiev',              first:'Maxime',            stars:3.25 },
  { rank:276, last:'Gosselin',              first:'Adam',              stars:3.25 },
  { rank:277, last:'Soulière',              first:'Tommy',             stars:3.25 },
  { rank:278, last:'Mohamed',               first:'Zachary',           stars:3.25 },
  { rank:279, last:'Desjardins',            first:'Charles',           stars:3.25 },
  { rank:280, last:'Vachon',                first:'Joseph',            stars:3.25 },
  { rank:281, last:'Chartrand',             first:'Sidney',            stars:3.50 },
  { rank:282, last:'Coccaro',               first:'Matthew',           stars:3.25 },
  { rank:283, last:'Funk',                  first:'Jack',              stars:3.25 },
  { rank:284, last:'Guertin',               first:'Elliot',            stars:3.25 },
  { rank:285, last:'Larochelle',            first:'Marc-Antoine',      stars:3.25 },
  { rank:286, last:'Williams',              first:'Samuel',            stars:3.25 },
  { rank:287, last:'Lavigne',               first:'Tristan',           stars:3.25 },
  { rank:288, last:'Ducharme',              first:'Billy',             stars:3.25 },
  { rank:289, last:'Cormier',               first:'Riley',             stars:3.25 },
  { rank:290, last:'Julien',                first:'Felix-Antoine',     stars:3.25 },
  { rank:291, last:'Page',                  first:'Maddox',            stars:3.25 },
  { rank:292, last:'Jacques',               first:'Elie',              stars:3.25 },
  { rank:293, last:'Wright',                first:'Connor',            stars:3.25 },
  { rank:294, last:'Ducharme',              first:'Zach',              stars:3.25 },
  { rank:295, last:'Richard',               first:'Mika',              stars:3.25 },
  { rank:296, last:'Salomon',               first:'Samuel',            stars:3.25 },
  { rank:297, last:'Gillard',               first:'Brandon',           stars:3.25 },
  { rank:298, last:'Proulx',                first:'Mason',             stars:3.25 },
  { rank:299, last:'Tremblay',              first:'Émile',             stars:3.25 },
  { rank:300, last:'Cantoro',               first:'Hugo',              stars:3.25 },
  { rank:301, last:'Dunlap',                first:'Colin',             stars:3.25 },
  { rank:302, last:'Thompson',              first:'Taytum',            stars:3.25 },
  { rank:303, last:'Patch',                 first:'Danny',             stars:3.25 },
  { rank:304, last:'Simas',                 first:'Colton',            stars:3.25 },
  { rank:305, last:'Jackson',               first:'James',             stars:3.25 },
  { rank:306, last:'Proulx',                first:'Mathis',            stars:3.25 },
  { rank:307, last:'Côté',                  first:'Edouard',           stars:3.25 },
  { rank:308, last:'Lamarche',              first:'Mathieu',           stars:3.25 },
  { rank:309, last:'Moores',                first:'Drew',              stars:3.25 },
  { rank:310, last:'Worth',                 first:'Liam',              stars:3.25 },
  { rank:311, last:'Mink',                  first:'Gunnar',            stars:3.25 },
  { rank:312, last:'Côté',                  first:'Alexy',             stars:3.25 },
  { rank:313, last:'Simon',                 first:'Cam',               stars:3.25 },
  { rank:314, last:'Holmes',                first:'Ryan',              stars:3.25 },
  { rank:315, last:'Carrigan',              first:'Brayden',           stars:3.25 },
  { rank:316, last:'Allaby',                first:'Connor',            stars:3.25 },
  { rank:317, last:'Lanctôt',               first:'Xavier',            stars:3.25 },
  { rank:318, last:'Zinger',                first:'Whitaker',          stars:3.25 },
  { rank:319, last:'Lacroix',               first:'Mathieu',           stars:3.25 },
  { rank:320, last:'Garneau',               first:'William',           stars:3.25 },
  { rank:321, last:'Meng',                  first:'Leo',               stars:3.25 },
  { rank:322, last:'Heise',                 first:'Carter',            stars:3.25 },
  { rank:323, last:'Bottomley',             first:'MJ',                stars:3.25 },
  { rank:324, last:'Robichaud',             first:'Mikko',             stars:3.25 },
  { rank:325, last:'Guay',                  first:'Edouard',           stars:3.25 },
  { rank:326, last:'Peel',                  first:'Greyson',           stars:3.25 },
  { rank:327, last:'Anctil',                first:'Frederic',          stars:3.25 },
  { rank:328, last:'Stewart',               first:'Joshua',            stars:3.25 },
  { rank:329, last:'Smith',                 first:'Logan',             stars:3.25 },
  { rank:330, last:'Cook',                  first:'Nathan',            stars:3.25 },
  { rank:331, last:'Poulin',                first:'Dayle',             stars:3.25 },
  { rank:332, last:'Cleary',                first:'Jordan',            stars:3.25 },
  { rank:333, last:'Swain',                 first:'Eli',               stars:3.25 },
  { rank:334, last:'Healy',                 first:'Liam',              stars:3.25 },
  { rank:335, last:'Quinn',                 first:'Connor',            stars:3.25 },
  { rank:336, last:'Laforce',               first:'Zack',              stars:3.25 },
  { rank:337, last:'Burns',                 first:'Jackson',           stars:3.25 },
  { rank:338, last:'Rubbo',                 first:'Nevio',             stars:3.25 },
  { rank:339, last:'Bolduc',                first:'Jacob',             stars:3.25 },
  { rank:340, last:'Gaudette',              first:'Luke',              stars:3.25 },
  { rank:341, last:'Casavant',              first:'Evan',              stars:3.25 },
  { rank:342, last:'Hanson-Leveille',       first:'Dylan',             stars:3.25 },
  { rank:343, last:'Gallucci',              first:'Drew',              stars:3.25 },
  { rank:344, last:'Lamontagne',            first:'Louis',             stars:3.25 },
  { rank:345, last:'Gilbert',               first:'Jacob',             stars:3.25 },
  { rank:346, last:'Santella',              first:'Nico',              stars:3.25 },
  { rank:347, last:'Beauchemin',            first:'Gabriel',           stars:3.25 },
  { rank:348, last:"O'Neill",               first:'Bryson',            stars:3.25 },
  { rank:349, last:'Fortin',                first:'Caleb',             stars:3.25 },
  { rank:350, last:'McCullough',            first:'Leo',               stars:3.25 },
  { rank:351, last:'Miclette',              first:'Alexis',            stars:3.25 },
  { rank:352, last:'Dauphinais',            first:'Malik',             stars:3.25 },
  { rank:353, last:'Cokinos',               first:'Devin',             stars:3.25 },
  { rank:354, last:'Boucher',               first:'Malek',             stars:3.25 },
  { rank:355, last:'Pitcher',               first:'Ethan',             stars:3.25 },
  { rank:356, last:'Mcfadden',              first:'Bodan',             stars:3.25 },
  { rank:357, last:'Mazzola',               first:'Noah',              stars:3.25 },
  { rank:358, last:'Dickinson',             first:'Rhys',              stars:3.25 },
  { rank:359, last:'Lachance',              first:'Eli',               stars:3.25 },
  { rank:360, last:'Poulin',                first:'Maxime',            stars:3.25 },
  { rank:361, last:'Moore',                 first:'Tommy',             stars:3.25 },
  { rank:362, last:'Tzouganatos',           first:'Nikolaos',          stars:3.25 },
  { rank:363, last:'Vachon',                first:'Philippe',          stars:3.25 },
  { rank:364, last:'Dow-Imrie',             first:'Nolan',             stars:3.25 },
  { rank:365, last:'Montminy',              first:'Samuel',            stars:3.25 },
  { rank:366, last:'Grace',                 first:'RJ',                stars:3.25 },
  { rank:367, last:'Bernier',               first:'Maxime',            stars:3.25 },
  { rank:368, last:'Carignan',              first:'Mathis',            stars:3.25 },
  { rank:369, last:'Thauvette',             first:'Pier-Olivier',      stars:3.25 },
  { rank:370, last:'Dickson',               first:'Luke',              stars:3.25 },
  { rank:371, last:'Bisson',                first:'Ryder',             stars:3.25 },
  { rank:372, last:'Rioux',                 first:'Louis-Edouard',     stars:3.25 },
  { rank:373, last:'Richard',               first:'Maxime',            stars:3.25 },
  { rank:374, last:'Desjardins',            first:'Jeremie',           stars:3.25 },
  { rank:375, last:'Chisholm',              first:'Lucas',             stars:3.25 },
  { rank:376, last:'Hebert',                first:'Jeremie',           stars:3.25 },
  { rank:377, last:'Olivier',               first:'Antoine',           stars:3.25 },
  { rank:378, last:'Mullins',               first:'Silas',             stars:3.25 },
  { rank:379, last:'Croteau',               first:'Liam',              stars:3.25 },
  { rank:380, last:'Gelinas',               first:'Raphael',           stars:3.25 },
  { rank:381, last:'Méthot',                first:'Oliver',            stars:3.25 },
  { rank:382, last:'Latella',               first:'Adamo',             stars:3.25 },
  { rank:383, last:'Hackett',               first:'Noah',              stars:3.25 },
  { rank:384, last:'Tasca',                 first:'Dylan',             stars:3.25 },
  { rank:385, last:'Morgan',                first:'Thomas',            stars:3.25 },
  { rank:386, last:'Boone',                 first:'Liam',              stars:3.25 },
  { rank:387, last:'Miansi',                first:'Kaylan',            stars:3.25 },
  { rank:388, last:'Farrell',               first:'Shaun',             stars:3.25 },
  { rank:389, last:'Unal',                  first:'Deniz',             stars:3.25 },
  { rank:390, last:'Larsen',                first:'Kieran',            stars:3.25 },
  { rank:391, last:'Vallee',                first:'Xavier',            stars:3.25 },
  { rank:392, last:'Morrison',              first:'Jamie',             stars:3.25 },
  { rank:393, last:'Rostowsky',             first:'Trevor',            stars:3.25 },
  { rank:394, last:'Turgeon',               first:'Felix-Antoine',     stars:3.25 },
  { rank:395, last:'Leo',                   first:'Luca',              stars:3.25 },
  { rank:396, last:'Pelletier',             first:'Simon',             stars:3.25 },
  { rank:397, last:'Miller',                first:'Ethan',             stars:3.25 },
  { rank:398, last:'Pandolfo',              first:'Robert',            stars:3.25 },
  { rank:399, last:'Swain',                 first:'Nathan',            stars:3.25 },
  { rank:400, last:'Gosselin',              first:'Maxim',             stars:3.25 },
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

// 3-char prefix (or full name if shorter, e.g. RJ, TJ, MJ).
// No last-name-only fallback — avoids selecting wrong players with common surnames.
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
  console.log('║  QMJHL Combined Rankings (USA + Canada) — 400   ║');
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

      // Close any modal left open from previous player
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

      // ── Search — only declare found if rows with 2009/2010 birth year appear
      const terms = buildSearchTerms(player);
      let rowFound = false;

      for (const term of terms) {
        console.log(`  → Searching: "${term}"`);
        await searchInput.click({ clickCount: 3 });
        await searchInput.fill('');
        await sleep(300);
        await searchInput.fill(term);
        await sleep(2500);

        const rows2010 = await page.locator('table tbody tr:has-text("/2010")').count().catch(() => 0);
        const rows2009 = await page.locator('table tbody tr:has-text("/2009")').count().catch(() => 0);
        if (rows2010 + rows2009 > 0) {
          rowFound = true;
          console.log(`  ✓ Found rows (${rows2010 + rows2009} with 2009/2010 birth year)`);
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

      // ── Select best matching row (prefer last name + 2010, then 2009) ─────
      const nameA = player.last.split(/[-\s]/)[0];
      const nameS = stripAccents(nameA);
      const rowSelectors = [
        `tr:has-text("${nameA}"):has-text("/2010")`,
        `tr:has-text("${nameS}"):has-text("/2010")`,
        `tr:has-text("${nameA}"):has-text("/2009")`,
        `tr:has-text("${nameS}"):has-text("/2009")`,
        `tr:has-text("${nameA}")`,
        `tr:has-text("${nameS}")`,
        `tr:has-text("/2010")`,
        `tr:has-text("/2009")`,
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
