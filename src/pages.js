// Page renderers for each content type.
'use strict';
const L = require('./lib');
const { SITE, esc, md, paras, money } = L;

function tocBlock(items) {
  return `<nav class="toc" aria-label="On this page"><b>On this page</b><ol>
${items.map(([t, id]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('\n')}
</ol></nav>`;
}
function faqBlock(faqs) {
  if (!faqs || !faqs.length) return '';
  return `<div class="faq">
${faqs.map(f => `<details><summary>${esc(f.q)}</summary><div class="a">${paras(f.a)}</div></details>`).join('\n')}
</div>`;
}
function sourcesBlock(sources) {
  if (!sources || !sources.length) return '';
  return `<h2 id="sources">Sources</h2><ul class="src-list">
${sources.map(s => `<li><a href="${esc(s.url)}" rel="noopener nofollow">${esc(s.name)}</a></li>`).join('\n')}
</ul>`;
}

// ---------- DRUG PAGE ----------
function drugPage(d, hub, siblings) {
  const path = `/${d.hub}/${d.slug}-cost/`;
  const published = d.published || '2026-09-30';
  const modified = d.modified || published;

  // cost rows: use explicit or derive
  const rows = d.costRows || [];
  const costTable = rows.length ? `<div class="tablewrap"><table>
<caption>Approximate ${esc(d.brand)} cost by payment situation. Verified ${esc(modified)}.</caption>
<thead><tr><th>Situation</th><th>Approximate cost</th><th>Notes</th></tr></thead>
<tbody>
${rows.map(r => `<tr><td>${esc(r.situation)}</td><td class="price">${esc(r.cost)}</td><td>${md(r.note || '')}</td></tr>`).join('\n')}
</tbody></table></div>` : '';

  const tags = [];
  if (d.medicare && d.medicare.negotiated) tags.push('<span class="tag good">Medicare negotiated price</span>');
  if (d.hasBiosimilar) tags.push('<span class="tag good">Biosimilar available</span>');
  if (d.copay) tags.push('<span class="tag">Manufacturer copay card</span>');
  if (d.assistance) tags.push('<span class="tag">Patient assistance</span>');

  const toc = tocBlock([
    ['Costs at a glance', 'glance'],
    d.copay ? ['Manufacturer copay card', 'copay'] : null,
    d.medicare ? ['Cost with Medicare', 'medicare'] : null,
    d.assistance ? ['Patient assistance', 'assistance'] : null,
    ['Cash-pay strategies', 'cash'],
    d.alternatives ? ['Cheaper alternatives', 'alts'] : null,
    ['FAQ', 'faq'],
  ].filter(Boolean));

  const copaySec = d.copay ? `<h2 id="copay">The ${esc(d.brand)} copay card</h2>
<p><strong>${esc(d.copay.lead)}</strong></p>
${paras(d.copay.body)}
<div class="tablewrap"><table><tbody>
${d.copay.maxPerFill ? `<tr><th>Most you save per fill</th><td>${esc(d.copay.maxPerFill)}</td></tr>` : ''}
${d.copay.maxPerYear ? `<tr><th>Most you save per year</th><td>${esc(d.copay.maxPerYear)}</td></tr>` : ''}
${d.copay.eligibility ? `<tr><th>Who qualifies</th><td>${md(d.copay.eligibility)}</td></tr>` : ''}
${d.copay.phone ? `<tr><th>Program phone</th><td>${esc(d.copay.phone)}</td></tr>` : ''}
${d.copay.enrollUrl ? `<tr><th>Enroll</th><td><a href="${esc(d.copay.enrollUrl)}" rel="noopener nofollow">Manufacturer savings page</a></td></tr>` : ''}
</tbody></table></div>` : '';

  const medSec = d.medicare ? `<h2 id="medicare">${esc(d.brand)} cost with Medicare</h2>
${paras(d.medicare.body)}` : '';

  const asstSec = d.assistance ? `<h2 id="assistance">Patient assistance for ${esc(d.brand)}</h2>
${paras(d.assistance.body)}
${d.assistance.url ? `<p><a href="${esc(d.assistance.url)}" rel="noopener nofollow">${esc(d.assistance.program || 'Manufacturer patient-assistance program')}</a></p>` : ''}` : '';

  const cashSec = `<h2 id="cash">Cash-pay strategies for ${esc(d.brand)}</h2>
${paras(d.cash)}`;

  const altSec = d.alternatives ? `<h2 id="alts">Cheaper alternatives to ${esc(d.brand)}</h2>
${paras(d.alternatives)}` : '';

  const practiceSec = d.practice ? `<div class="practice">${paras(d.practice)}
<div class="who">— <b>${esc(SITE.author.name)}</b>, ${esc(SITE.author.role)}</div></div>` : '';

  const relatedCards = (siblings || []).filter(s => s.slug !== d.slug).slice(0, 8).map(s =>
    `<a class="card" href="/${s.hub}/${s.slug}-cost/"><span class="drug">${esc(s.brand)}</span>
<span class="generic">${esc(s.generic)}</span><span class="from">See ${esc(s.brand)} costs →</span></a>`).join('\n');

  const schema = [
    {
      '@type': 'MedicalDrug', name: d.brand, nonProprietaryName: d.generic,
      drugClass: d.drugClass,
      manufacturer: d.manufacturer ? { '@type': 'Organization', name: d.manufacturer, url: d.manufacturerUrl } : undefined,
      indication: (d.conditions || []).map(c => ({ '@type': 'MedicalIndication', name: c })),
      description: d.metaDesc,
    },
    L.articleSchema({ title: d.title, desc: d.metaDesc, path, published, modified, image: d.image }),
    L.breadcrumb([['Home', '/'], [hub.name, `/${d.hub}/`], [d.brand, path]]),
    L.faqSchema(d.faqs || []),
    { '@type': 'Person', '@id': SITE.url + '/#author', name: SITE.author.name, honorificSuffix: SITE.author.creds, jobTitle: SITE.author.role, url: SITE.author.url },
  ];

  return L.head({ title: d.title, desc: d.metaDesc, path, schema, image: d.image }) +
    L.header() + `<main class="wrap"><article>
<nav class="crumbs"><a href="/">Home</a> › <a href="/${d.hub}/">${esc(hub.name)}</a> › ${esc(d.brand)} cost</nav>
<h1>${esc(d.h1)}</h1>
<p class="lede">${md(d.lede)}</p>
<div class="tags">${tags.join('')}</div>
<div class="byline"><b>Reviewed by ${esc(SITE.author.name)}, ${esc(SITE.author.creds)}</b>
<span>${SITE.author.pmdc}</span><span class="updated">Updated ${esc(modified)}</span></div>

<div class="answer"><div class="k">The short answer</div>${paras(d.shortAnswer)}</div>

${toc}

${paras(d.intro)}

<h2 id="glance">${esc(d.brand)} costs at a glance</h2>
${costTable}

${copaySec}
${medSec}
${asstSec}
${cashSec}
${altSec}
${practiceSec}

<h2 id="faq">${esc(d.brand)} cost — frequently asked questions</h2>
${faqBlock(d.faqs)}

<h2 id="related">Related ${esc(hub.name.toLowerCase())} drugs</h2>
<div class="grid">${relatedCards}</div>

<h2 id="guides">Guides that apply to ${esc(d.brand)}</h2>
<ul class="applies">
<li><a href="/guides/copay-cards/">How copay cards work</a></li>
<li><a href="/guides/patient-assistance/">Patient-assistance programs</a></li>
<li><a href="/guides/prior-authorization/">Prior authorization</a></li>
<li><a href="/guides/medicare-part-d/">Medicare Part D</a></li>
<li><a href="/guides/medicare-negotiated-prices/">Medicare negotiated prices</a></li>
<li><a href="/guides/uninsured/">If you have no insurance</a></li>
</ul>

${sourcesBlock(d.sources)}
${L.reviewedBlock()}
</article></main>` + L.footer();
}

// ---------- HUB PAGE ----------
function hubPage(hub, drugs) {
  const path = `/${hub.slug}/`;
  const cards = drugs.map(d => `<a class="card" href="/${d.hub}/${d.slug}-cost/">
<span class="drug">${esc(d.brand)}</span><span class="generic">${esc(d.generic)}</span>
<span class="blurb">${esc(d.cardBlurb || '')}</span>
<span class="from">List about ${esc(d.listPriceText || '—')} · see savings →</span></a>`).join('\n');

  const schema = [
    { '@type': 'CollectionPage', name: hub.title, description: hub.metaDesc, url: SITE.url + path },
    {
      '@type': 'ItemList', itemListElement: drugs.map((d, i) => ({
        '@type': 'ListItem', position: i + 1, url: SITE.url + `/${d.hub}/${d.slug}-cost/`, name: d.brand,
      })),
    },
    L.breadcrumb([['Home', '/'], [hub.name, path]]),
    L.articleSchema({ title: hub.title, desc: hub.metaDesc, path, published: hub.published || '2026-09-28', modified: hub.modified || '2026-10-01' }),
  ];
  const compRows = hub.comparisons || [];
  const compBlock = compRows.length ? `<h2>Compare ${esc(hub.name.toLowerCase())} drugs</h2><div class="grid">
${compRows.map(c => `<a class="card" href="${c.url}"><span class="drug">${esc(c.title)}</span><span class="from">Compare cost &amp; coverage →</span></a>`).join('\n')}
</div>` : '';

  return L.head({ title: hub.title, desc: hub.metaDesc, path, schema, ogType: 'website' }) +
    L.header() + `<main class="wrap"><article>
<nav class="crumbs"><a href="/">Home</a> › ${esc(hub.name)}</nav>
<h1>${esc(hub.h1)}</h1>
<p class="lede">${md(hub.lede)}</p>
<div class="byline"><b>Reviewed by ${esc(SITE.author.name)}, ${esc(SITE.author.creds)}</b>
<span>${SITE.author.pmdc}</span><span class="updated">Updated ${esc(hub.modified || '2026-10-01')}</span></div>

<div class="answer"><div class="k">The short answer</div>${paras(hub.shortAnswer)}</div>

<h2>Costs for each ${esc(hub.name.toLowerCase())} drug</h2>
<div class="grid">${cards}</div>

${compBlock}

${hub.sections ? hub.sections.map(s => `<h2>${esc(s.h)}</h2>${paras(s.body)}`).join('\n') : ''}

<h2>Guides that apply to every drug on this page</h2>
<ul class="applies">
<li><a href="/guides/copay-cards/">Copay cards</a></li>
<li><a href="/guides/patient-assistance/">Patient assistance</a></li>
<li><a href="/guides/prior-authorization/">Prior authorization</a></li>
<li><a href="/guides/medicare-part-d/">Medicare Part D</a></li>
<li><a href="/guides/medicare-negotiated-prices/">Medicare negotiated prices</a></li>
<li><a href="/guides/uninsured/">No insurance</a></li>
</ul>
${sourcesBlock(hub.sources)}
${L.reviewedBlock()}
</article></main>` + L.footer();
}

// ---------- GUIDE PAGE ----------
function guidePage(g) {
  const path = `/guides/${g.slug}/`;
  const schema = [
    L.articleSchema({ title: g.title, desc: g.metaDesc, path, published: g.published || '2026-09-30', modified: g.modified || '2026-10-01' }),
    L.breadcrumb([['Home', '/'], ['Guides', '/guides/'], [g.name, path]]),
    L.faqSchema(g.faqs || []),
  ];
  const applies = g.applies ? `<h2 id="applies">Drugs this applies to</h2>
<ul class="applies">${g.applies.map(a => `<li><a href="${a[1]}">${esc(a[0])}</a></li>`).join('\n')}</ul>` : '';
  return L.head({ title: g.title, desc: g.metaDesc, path, schema }) +
    L.header() + `<main class="wrap"><article>
<nav class="crumbs"><a href="/">Home</a> › <a href="/guides/">Guides</a> › ${esc(g.name)}</nav>
<h1>${esc(g.h1)}</h1>
<p class="lede">${md(g.lede)}</p>
<div class="byline"><b>Reviewed by ${esc(SITE.author.name)}, ${esc(SITE.author.creds)}</b>
<span>${SITE.author.pmdc}</span><span class="updated">Updated ${esc(g.modified || '2026-10-01')}</span></div>
<div class="answer"><div class="k">The short answer</div>${paras(g.shortAnswer)}</div>
${g.sections.map(s => `<h2 id="${s.id || ''}">${esc(s.h)}</h2>${paras(s.body)}`).join('\n')}
${applies}
${g.faqs && g.faqs.length ? `<h2 id="faq">FAQ</h2>${faqBlock(g.faqs)}` : ''}
${sourcesBlock(g.sources)}
${L.reviewedBlock()}
</article></main>` + L.footer();
}

// ---------- COMPARISON PAGE ----------
function comparisonPage(c, hub) {
  const path = c.path;
  const schema = [
    L.articleSchema({ title: c.title, desc: c.metaDesc, path, published: c.published || '2026-09-30', modified: c.modified || '2026-10-01' }),
    L.breadcrumb([['Home', '/'], [hub.name, `/${hub.slug}/`], [c.name, path]]),
    L.faqSchema(c.faqs || []),
  ];
  const table = `<div class="tablewrap"><table>
<caption>${esc(c.a.name)} vs ${esc(c.b.name)} — cost and coverage, verified ${esc(c.modified || '2026-10-01')}.</caption>
<thead><tr><th>&nbsp;</th><th>${esc(c.a.name)}</th><th>${esc(c.b.name)}</th></tr></thead>
<tbody>
${c.rows.map(r => `<tr><th>${esc(r[0])}</th><td>${md(r[1])}</td><td>${md(r[2])}</td></tr>`).join('\n')}
</tbody></table></div>`;
  return L.head({ title: c.title, desc: c.metaDesc, path, schema }) +
    L.header() + `<main class="wrap"><article>
<nav class="crumbs"><a href="/">Home</a> › <a href="/${hub.slug}/">${esc(hub.name)}</a> › ${esc(c.name)}</nav>
<h1>${esc(c.h1)}</h1>
<p class="lede">${md(c.lede)}</p>
<div class="byline"><b>Reviewed by ${esc(SITE.author.name)}, ${esc(SITE.author.creds)}</b>
<span>${SITE.author.pmdc}</span><span class="updated">Updated ${esc(c.modified || '2026-10-01')}</span></div>
<div class="answer"><div class="k">The short answer</div>${paras(c.shortAnswer)}</div>
<h2 id="compare">${esc(c.a.name)} vs ${esc(c.b.name)} side by side</h2>
${table}
${c.sections.map(s => `<h2>${esc(s.h)}</h2>${paras(s.body)}`).join('\n')}
${c.faqs && c.faqs.length ? `<h2 id="faq">FAQ</h2>${faqBlock(c.faqs)}` : ''}
${sourcesBlock(c.sources)}
${L.reviewedBlock()}
</article></main>` + L.footer();
}

// ---------- SIMPLE / STATIC PAGES ----------
function basicPage({ title, desc, path, h1, lede, bodyHtml, schema = [], noindex }) {
  let h = L.head({ title, desc, path, schema });
  if (noindex) h = h.replace('index,follow', 'noindex,follow');
  return h + L.header() + `<main class="wrap"><article>
${h1 ? `<h1>${esc(h1)}</h1>` : ''}${lede ? `<p class="lede">${md(lede)}</p>` : ''}
${bodyHtml}
</article></main>` + L.footer();
}

module.exports = { drugPage, hubPage, guidePage, comparisonPage, basicPage, faqBlock, sourcesBlock, tocBlock };
