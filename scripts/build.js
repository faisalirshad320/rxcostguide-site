#!/usr/bin/env node
// Build orchestrator: reads data/*.js, renders static HTML into repo root, then guides/home/static + sitemaps.
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('../src/lib');
const P = require('../src/pages');
const { SITE } = L;

const ROOT = path.join(__dirname, '..');
const OUT = ROOT; // build into repo root so Cloudways git-deploy serves it directly
const DATA = path.join(ROOT, 'data');

const urls = [];
function write(rel, html, meta = {}) {
  const full = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html);
  let loc = '/' + rel.replace(/index\.html$/, '');
  urls.push({ loc: SITE.url + loc, ...meta });
}
function writeRaw(rel, content) {
  const full = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

// load hubs
const hubs = [];
const allDrugs = [];
for (const f of fs.readdirSync(DATA).filter(f => f.endsWith('.js'))) {
  const mod = require(path.join(DATA, f));
  if (!mod.hub) continue;
  hubs.push(mod);
  (mod.drugs || []).forEach(d => allDrugs.push(d));
}

// hub + drug + comparison pages
for (const mod of hubs) {
  const hub = mod.hub, drugs = mod.drugs || [];
  write(`${hub.slug}/index.html`, P.hubPage(hub, drugs), { changefreq: 'weekly', priority: '0.8', group: 'hubs' });
  for (const d of drugs) {
    write(`${d.hub}/${d.slug}-cost/index.html`, P.drugPage(d, hub, drugs), { changefreq: 'weekly', priority: '0.9', group: 'drugs' });
  }
  for (const c of (mod.comparisons || [])) {
    const rel = c.path.replace(/^\//, '').replace(/\/$/, '') + '/index.html';
    write(rel, P.comparisonPage(c, hub), { changefreq: 'monthly', priority: '0.7', group: 'drugs' });
  }
}

// copy stylesheet into servable assets path
fs.mkdirSync(path.join(OUT, 'assets/css'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src/style.css'), path.join(OUT, 'assets/css/style.css'));

const ctx = { L, P, SITE, hubs, allDrugs, write, writeRaw, urls, OUT, ROOT };
require('./build-extras.js')(ctx);
require('./build-sitemaps.js')(ctx);
console.log(`Built ${urls.length} URLs across ${hubs.length} hubs and ${allDrugs.length} drugs.`);
