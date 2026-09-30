#!/usr/bin/env node
/*
 * Monthly price-refresh hook.
 *
 * The drug price "database" is the set of files in data/*.js (and the exported
 * api/prices.json). The intended monthly workflow is:
 *   1. Re-verify each drug's list price, copay-card terms and Medicare status
 *      against the manufacturer page + CMS.gov (the `sources` on each drug).
 *   2. Edit the figure in the relevant data/<hub>.js file.
 *   3. Run this script (or `node scripts/build.js`) to re-stamp the "verified"
 *      date and regenerate every page + sitemap + prices.json.
 *   4. Commit & push — Cloudways auto-deploys the new build.
 *
 * This script re-stamps the site-wide "modified" date to today and rebuilds.
 * A scheduled task performs step 1–2 (the actual online re-verification) monthly.
 */
'use strict';
const { execSync } = require('child_process');
const today = new Date().toISOString().slice(0, 10);
console.log(`[update-prices] Rebuilding site with verification date ${today}…`);
execSync('node scripts/build.js', { stdio: 'inherit', cwd: require('path').join(__dirname, '..') });
console.log('[update-prices] Done. Review changes, then: git add -A && git commit && git push');
