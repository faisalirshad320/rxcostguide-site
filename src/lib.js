// Core library: site config, helpers, schema builders, HTML shell, header, footer.
'use strict';

const SITE = {
  name: 'RxCostGuide',
  url: 'https://rxcostguide.com',
  tagline: 'What US prescription drugs actually cost — and how to pay less',
  desc: 'Independent, clinician-reviewed guides to US prescription drug prices, copay cards, patient-assistance programs and Medicare coverage.',
  author: {
    name: 'Dr. Faisal Irshad',
    creds: 'MBBS, M.Phil Chemical Pathology',
    pmdc: 'PMDC 54440-S',
    role: 'Pathologist and Blood Bank & Pathology Department In-Charge',
    url: 'https://rxcostguide.com/about/dr-faisal-irshad/',
  },
  nav: [
    ['Drugs', '/drugs/'],
    ['Diabetes', '/diabetes/'],
    ['Weight loss', '/glp-1-weight-loss/'],
    ['Heart', '/heart-blood-thinners/'],
    ['Mental health', '/mental-health/'],
    ['Guides', '/guides/'],
    ['Price tool', '/tools/drug-cost-estimator/'],
  ],
};

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// very small, safe inline-markdown: **bold**, [text](url), and paragraphs split on blank lines
function mdInline(s = '') {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$1" rel="noopener">$1</a>'.replace('$1', '$2').replace('$2', '$1'))
    // fix: correct order for link
    ;
}
// (mdInline link handling done cleanly below)
function md(s = '') {
  const linkFixed = esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(((?:https?:|\/)[^)\s]+)\)/g, (m, t, u) =>
      u.startsWith('/') ? `<a href="${u}">${t}</a>` : `<a href="${u}" rel="noopener">${t}</a>`);
  return linkFixed;
}
function paras(text = '') {
  return String(text).trim().split(/\n\s*\n/).map(p => `<p>${md(p.trim())}</p>`).join('\n');
}
const money = n => (n == null ? '—' : '$' + Number(n).toLocaleString('en-US'));

const jsonld = obj => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;

function orgSchema() {
  return {
    '@type': 'Organization', '@id': SITE.url + '/#org', name: SITE.name, url: SITE.url,
    logo: { '@type': 'ImageObject', url: SITE.url + '/assets/img/logo.png' },
    description: SITE.desc,
  };
}
function personSchema() {
  return {
    '@type': 'Person', '@id': SITE.url + '/#author', name: SITE.author.name,
    honorificSuffix: SITE.author.creds, jobTitle: SITE.author.role, url: SITE.author.url,
    identifier: SITE.author.pmdc,
    sameAs: [], // filled on the author page schema build with real profile URLs when provided
  };
}
function websiteSchema() {
  return {
    '@type': 'WebSite', '@id': SITE.url + '/#website', name: SITE.name, url: SITE.url,
    publisher: { '@id': SITE.url + '/#org' },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: SITE.url + '/drugs/?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    },
  };
}
function breadcrumb(items) { // items: [[name, path], ...]
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it[0],
      item: it[1] ? SITE.url + it[1] : undefined,
    })),
  };
}
function faqSchema(faqs) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') },
    })),
  };
}
function articleSchema({ title, desc, path, published, modified, image }) {
  return {
    '@type': 'Article', headline: title, description: desc,
    mainEntityOfPage: { '@type': 'WebPage', '@id': SITE.url + path },
    datePublished: published, dateModified: modified,
    author: { '@id': SITE.url + '/#author' },
    publisher: { '@id': SITE.url + '/#org' },
    image: image ? [SITE.url + image] : undefined,
  };
}

function head({ title, desc, path, schema = [], ogType = 'article', image }) {
  const canonical = SITE.url + path;
  const ogImage = SITE.url + (image || '/assets/img/og-default.png');
  const graph = { '@context': 'https://schema.org', '@graph': [orgSchema(), websiteSchema(), ...schema] };
  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogImage}">
<meta name="author" content="${esc(SITE.author.name)}, ${esc(SITE.author.creds)}">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/style.css">
${jsonld(graph)}
</head>
<body>`;
}

const LOGO = `<svg class="mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="8" fill="var(--brand)"/><path d="M11 9h6.2c3 0 5 1.9 5 4.7 0 2.2-1.3 3.9-3.4 4.5l3.6 5.3h-3.5l-3.2-4.9H14v4.9h-3V9Zm3 2.6v4.3h3c1.5 0 2.4-.8 2.4-2.1 0-1.4-.9-2.2-2.4-2.2h-3Z" fill="#fff"/></svg>`;

function header() {
  return `<header class="site-head"><div class="wrap">
<a class="brand" href="/">${LOGO}${SITE.name}</a>
<button class="menu-btn" aria-label="Menu" onclick="document.getElementById('nav').classList.toggle('open')">☰</button>
<nav class="nav" id="nav">
${SITE.nav.map(n => `<a href="${n[1]}">${esc(n[0])}</a>`).join('\n')}
</nav>
</div></header>`;
}

function reviewedBlock() {
  const a = SITE.author;
  return `<div class="reviewed"><div class="ic" aria-hidden="true">⚕</div><div>
<b>Medically reviewed</b> by <a href="${a.url}">${esc(a.name)}, ${esc(a.creds)}</a> (${a.pmdc}) — ${esc(a.role)}.
Cost and coverage information only; not medical advice. Prices change frequently — confirm current pricing with your pharmacy or plan.
</div></div>`;
}

function footer() {
  const y = new Date().getFullYear();
  return `${footerNav()}<footer class="site-foot"><div class="wrap">
<div class="foot-cols">
<div><h4>Conditions</h4>
<a href="/diabetes/">Diabetes</a><a href="/glp-1-weight-loss/">Weight loss (GLP-1)</a>
<a href="/heart-blood-thinners/">Heart &amp; blood thinners</a><a href="/migraine/">Migraine</a>
<a href="/autoimmune/">Autoimmune</a><a href="/asthma-allergy-eczema/">Asthma, allergy &amp; eczema</a>
<a href="/hiv-hepatitis/">HIV &amp; hepatitis</a><a href="/mental-health/">Mental health</a></div>
<div><h4>Save on drugs</h4>
<a href="/guides/copay-cards/">Copay cards</a><a href="/guides/patient-assistance/">Patient assistance</a>
<a href="/guides/medicare-negotiated-prices/">Medicare negotiated prices</a><a href="/guides/uninsured/">No insurance</a>
<a href="/guides/biosimilars/">Generics &amp; biosimilars</a><a href="/tools/drug-cost-estimator/">Price comparison tool</a></div>
<div><h4>About</h4>
<a href="/about/dr-faisal-irshad/">Our reviewer</a><a href="/editorial-policy/">Editorial policy</a>
<a href="/how-we-source-prices/">How we source prices</a><a href="/drugs/">All drugs A–Z</a>
<a href="/contact/">Contact</a></div>
</div>
<div class="foot-legal">
&copy; ${y} ${SITE.name}. Independent drug-cost information reviewed by ${esc(SITE.author.name)} (${SITE.author.pmdc}).
RxCostGuide is not affiliated with any manufacturer, pharmacy or insurer. Content is for information only and is not medical,
legal or financial advice. Always confirm prices and coverage directly with your pharmacy, plan or the manufacturer.
<a href="/privacy-policy/">Privacy</a> · <a href="/terms/">Terms</a>
</div>
</div></footer>
</body></html>`;
}
function footerNav() { return ''; }

module.exports = {
  SITE, esc, md, paras, money, jsonld, head, header, footer, reviewedBlock,
  orgSchema, personSchema, websiteSchema, breadcrumb, faqSchema, articleSchema, LOGO,
};
