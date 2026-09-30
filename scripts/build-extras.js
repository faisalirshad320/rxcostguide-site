// Home, guides, author/about, policy pages, drugs A–Z index, price-comparison tool.
'use strict';
module.exports = function (ctx) {
  const { L, P, SITE, hubs, allDrugs, write, writeRaw } = ctx;
  const esc = L.esc, md = L.md, paras = L.paras;
  const MOD = '2026-10-01';

  // -------- HOME --------
  const hubCards = hubs.map(m => `<a class="card" href="/${m.hub.slug}/">
<span class="drug">${esc(m.hub.name)}</span>
<span class="blurb">${(m.drugs || []).length} drug${(m.drugs || []).length === 1 ? '' : 's'} covered</span>
<span class="from">See costs &amp; savings →</span></a>`).join('\n');
  const popular = ['eliquis', 'mounjaro', 'wegovy', 'jardiance', 'repatha', 'rinvoq', 'ozempic', 'farxiga']
    .map(s => allDrugs.find(d => d.slug === s)).filter(Boolean)
    .map(d => `<a class="card" href="/${d.hub}/${d.slug}-cost/"><span class="drug">${esc(d.brand)}</span>
<span class="generic">${esc(d.generic)}</span><span class="from">See ${esc(d.brand)} cost →</span></a>`).join('\n');

  const homeSchema = [
    { '@type': 'WebPage', name: SITE.name, url: SITE.url, description: SITE.desc },
    L.breadcrumb([['Home', '/']]),
  ];
  const homeBody = `<section class="hero">
<h1>${esc(SITE.tagline)}</h1>
<p class="lede">Clear, clinician-reviewed answers on what US prescription drugs cost — list price, copay cards, patient assistance and 2026 Medicare-negotiated prices — so you can find the cheapest legitimate route for your situation.</p>
<div class="searchrow"><a class="btn" href="/drugs/">Browse all drugs A–Z</a>
<a class="btn ghost" href="/tools/drug-cost-estimator/">Compare drug prices</a></div>
</section>
<div class="answer"><div class="k">Start here</div>
<p>Your <strong>insurance type</strong> decides your cheapest route more than any coupon: <strong>commercial insurance</strong> → the manufacturer copay card; <strong>Medicare</strong> → the 2026 negotiated prices and the $2,100 Part D cap; <strong>uninsured</strong> → patient-assistance programs and discount cards. Every drug page below shows all three.</p></div>
<h2 class="kicker">Popular right now</h2>
<div class="grid">${popular}</div>
<h2 class="kicker">Browse by condition</h2>
<div class="grid">${hubCards}</div>
<h2>How RxCostGuide is different</h2>
<p>Every page is reviewed by <a href="${SITE.author.url}">${esc(SITE.author.name)}</a>, a practising pathologist and hospital department head, and every price is dated and sourced to the manufacturer or CMS.gov. We are independent — not owned by a pharmacy, manufacturer or insurer — and we make money from advertising, not from steering you to any product.</p>
${L.reviewedBlock()}`;
  write('index.html', P.basicPage({
    title: `${SITE.name} — ${SITE.tagline}`, desc: SITE.desc, path: '/', h1: null, bodyHtml: homeBody, schema: homeSchema,
  }).replace('<h1></h1>', ''), { changefreq: 'weekly', priority: '1.0', group: 'pages' });

  // -------- DRUGS A–Z --------
  const sorted = [...allDrugs].sort((a, b) => a.brand.localeCompare(b.brand));
  const azRows = sorted.map(d => `<tr>
<td><a href="/${d.hub}/${d.slug}-cost/"><strong>${esc(d.brand)}</strong></a></td>
<td>${esc(d.generic)}</td><td>${esc(d.drugClass)}</td>
<td>${esc(d.listPriceText || '—')}</td>
<td>${d.medicare && d.medicare.negotiated ? 'Yes' : '—'}</td></tr>`).join('\n');
  write('drugs/index.html', P.basicPage({
    title: 'All Drugs A–Z — Prices, Coupons & Copay Cards | RxCostGuide',
    desc: 'Alphabetical index of every drug we cover, with list price, drug class and whether it has a 2026 Medicare-negotiated price. Click any drug for full cost and savings details.',
    path: '/drugs/', h1: 'Every drug we cover, A–Z',
    lede: 'Prices are approximate US list figures, verified against manufacturer pages and updated regularly. Click any drug for copay-card, Medicare and patient-assistance details.',
    schema: [L.breadcrumb([['Home', '/'], ['All drugs', '/drugs/']]), {
      '@type': 'CollectionPage', name: 'All drugs A–Z',
      mainEntity: { '@type': 'ItemList', itemListElement: sorted.map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: d.brand, url: SITE.url + `/${d.hub}/${d.slug}-cost/` })) },
    }],
    bodyHtml: `<div class="tablewrap"><table>
<thead><tr><th>Brand</th><th>Generic</th><th>Class</th><th>List (approx.)</th><th>Medicare 2026 price</th></tr></thead>
<tbody>${azRows}</tbody></table></div>${L.reviewedBlock()}`,
  }), { changefreq: 'weekly', priority: '0.7', group: 'pages' });

  // -------- PRICE COMPARISON TOOL (static table) --------
  const toolRows = sorted.map(d => {
    const copay = d.copay ? (d.copay.maxPerFill || 'Yes') : '—';
    const mfp = d.medicare && d.medicare.negotiated && d.medicare.mfp ? '$' + d.medicare.mfp + '/mo' : '—';
    return `<tr><td><a href="/${d.hub}/${d.slug}-cost/"><strong>${esc(d.brand)}</strong></a></td>
<td>${esc(d.listPriceText || '—')}</td><td>${esc(copay)}</td><td>${mfp}</td>
<td>${d.assistance ? 'Yes' : '—'}</td></tr>`;
  }).join('\n');
  write('tools/drug-cost-estimator/index.html', P.basicPage({
    title: 'Drug Cost Comparison Table — List Price vs Copay vs Medicare | RxCostGuide',
    desc: 'Compare US drug costs side by side: approximate list price, manufacturer copay-card floor, 2026 Medicare-negotiated price and patient-assistance availability.',
    path: '/tools/drug-cost-estimator/', h1: 'Drug cost comparison',
    lede: 'Compare what each drug costs across the four routes that matter: cash/list price, the manufacturer copay-card floor (commercial insurance), the 2026 Medicare-negotiated price where one exists, and whether free patient assistance is available.',
    schema: [L.breadcrumb([['Home', '/'], ['Price tool', '/tools/drug-cost-estimator/']])],
    bodyHtml: `<div class="note"><p><strong>How to read this:</strong> find your drug, then look at the column that matches your insurance. Commercially insured? The copay column is your floor. On Medicare? Use the negotiated-price column (and remember the $2,100 annual Part D cap). Uninsured? Check the assistance column, then open the drug page for the program link.</p></div>
<div class="tablewrap"><table>
<caption>Approximate US costs, verified ${MOD}. Open any drug for full detail and sources.</caption>
<thead><tr><th>Drug</th><th>Cash / list</th><th>Copay card floor</th><th>Medicare 2026</th><th>Patient assistance</th></tr></thead>
<tbody>${toolRows}</tbody></table></div>
<p class="updated">Figures are approximate and change frequently. Always confirm current pricing on the drug\'s page and with your pharmacy or plan.</p>
${L.reviewedBlock()}`,
  }), { changefreq: 'weekly', priority: '0.6', group: 'pages' });

  // -------- GUIDES --------
  const guides = require('../data/_guides.js');
  write('guides/index.html', P.basicPage({
    title: 'Prescription Savings Guides — Copay Cards, Medicare & More | RxCostGuide',
    desc: 'Plain-English guides to lowering prescription costs: copay cards, patient assistance, Medicare Part D and negotiated prices, biosimilars, prior authorization and paying without insurance.',
    path: '/guides/', h1: 'Guides to paying less for your prescriptions',
    lede: 'The mechanics behind every drug page — how copay cards, assistance programs, Medicare and biosimilars actually work, and how to use each one.',
    schema: [L.breadcrumb([['Home', '/'], ['Guides', '/guides/']])],
    bodyHtml: `<div class="grid">${guides.map(g => `<a class="card" href="/guides/${g.slug}/">
<span class="drug">${esc(g.name)}</span><span class="blurb">${esc(g.cardBlurb || g.metaDesc)}</span>
<span class="from">Read the guide →</span></a>`).join('\n')}</div>${L.reviewedBlock()}`,
  }), { changefreq: 'monthly', priority: '0.6', group: 'pages' });
  for (const g of guides) {
    write(`guides/${g.slug}/index.html`, P.guidePage(g), { changefreq: 'monthly', priority: '0.7', group: 'guides' });
  }

  // -------- AUTHOR / ABOUT --------
  const a = SITE.author;
  const authorSchema = [
    { '@type': 'Person', '@id': SITE.url + '/#author', name: a.name, honorificSuffix: a.creds, jobTitle: a.role, url: a.url, identifier: a.pmdc, worksFor: { '@type': 'Organization', name: 'Suleman Roshan Medical College Hospital' }, sameAs: [] },
    { '@type': 'AboutPage', name: 'About ' + a.name, url: a.url },
    L.breadcrumb([['Home', '/'], ['About', '/about/dr-faisal-irshad/']]),
  ];
  write('about/dr-faisal-irshad/index.html', P.basicPage({
    title: `About Dr. Faisal Irshad, MBBS, M.Phil — Medical Reviewer | RxCostGuide`,
    desc: 'Dr. Faisal Irshad (PMDC 54440-S) is a pathologist and hospital Blood Bank & Pathology department in-charge who medically reviews every page on RxCostGuide.',
    path: '/about/dr-faisal-irshad/', h1: 'Dr. Faisal Irshad, MBBS, M.Phil Chemical Pathology',
    lede: 'Medical reviewer for RxCostGuide.',
    schema: authorSchema,
    bodyHtml: `<p><strong>Dr. Faisal Irshad</strong> (${a.pmdc}) is a pathologist with an MBBS and an M.Phil in Chemical Pathology and around 18 years of clinical experience. He is the <strong>in-charge of the Blood Bank and Pathology department</strong> at Suleman Roshan Medical College Hospital, where his responsibilities include laboratory operations, quality systems, regulatory compliance, and the procurement and stewardship of clinical products — work that involves dealing directly with government health regulators and public-sector supply. He also teaches pathology at Suleman Roshan Medical College.</p>
<h2>Why a pathologist reviews drug-cost content</h2>
<p>Drug pricing sits at the intersection of clinical medicine, procurement and health policy. As a department head who manages product procurement, regulatory compliance and patient-facing lab services, Dr. Irshad reviews RxCostGuide for factual accuracy on how coverage, assistance programs and pricing mechanisms actually work in practice. He does not provide individual medical advice, and RxCostGuide content is explicitly cost-and-coverage information, not treatment guidance.</p>
<h2>Scope of review</h2>
<p>Dr. Irshad reviews each page for the accuracy of pricing mechanisms (copay cards, patient assistance, Medicare rules), the correct framing of eligibility, and the clear separation of cost information from clinical advice. Therapeutic choices — which drug is right for a given patient — are always described as decisions for the reader\'s own prescriber.</p>
<h2>Credentials</h2>
<ul>
<li>MBBS; M.Phil Chemical Pathology</li>
<li>Registration: ${a.pmdc} (Pakistan Medical &amp; Dental Council)</li>
<li>In-charge, Blood Bank &amp; Pathology, Suleman Roshan Medical College Hospital</li>
<li>Faculty, Pathology, Suleman Roshan Medical College</li>
<li>~18 years of laboratory and clinical experience</li>
</ul>
<div class="note"><p>Credential verification links (PMDC public register, institutional faculty page, professional profiles) can be added here. Provide the exact URLs and they will be linked with <code>sameAs</code> in the author schema for maximum E-E-A-T signal.</p></div>
${L.reviewedBlock()}`,
  }), { changefreq: 'yearly', priority: '0.6', group: 'pages' });

  // -------- POLICY / STATIC PAGES --------
  const staticPages = [
    {
      slug: 'editorial-policy', title: 'Editorial Policy | RxCostGuide',
      desc: 'How RxCostGuide researches, writes, reviews and updates its prescription drug-cost content, and how we stay independent.',
      h1: 'Editorial policy',
      body: `<p>RxCostGuide publishes independent information about the cost of prescription drugs in the United States. This policy explains how we produce and maintain it.</p>
<h2>Independence</h2><p>We are not owned by, and do not take direction from, any pharmaceutical manufacturer, pharmacy, or insurer. We earn revenue from advertising, which never influences our pricing information or which programs we recommend.</p>
<h2>How we research prices</h2><p>Prices are gathered from manufacturer savings pages, official program terms, and CMS.gov for Medicare-negotiated prices. Each figure is approximate, carries the date it was verified, and links to its source. See <a href="/how-we-source-prices/">how we source prices</a>.</p>
<h2>Medical review</h2><p>Every substantive page is reviewed by <a href="/about/dr-faisal-irshad/">Dr. Faisal Irshad</a> (${a.pmdc}) for accuracy of how pricing and coverage mechanisms work. Content is cost-and-coverage information only and is not medical advice.</p>
<h2>Updates and corrections</h2><p>Drug prices and programs change frequently. We review pages on a rolling basis and update the "verified" date when we do. To report an error, use our <a href="/contact/">contact page</a>; we correct confirmed errors promptly.</p>
<h2>AI assistance</h2><p>We use software tools to help research and draft content, but a qualified human reviewer takes responsibility for the accuracy of every published page.</p>`,
    },
    {
      slug: 'how-we-source-prices', title: 'How We Source Drug Prices | RxCostGuide',
      desc: 'Our methodology for gathering, dating and verifying US prescription drug prices, copay-card terms and Medicare-negotiated prices.',
      h1: 'How we source prices',
      body: `<p>Every price on RxCostGuide is approximate and dated. Here is exactly where the numbers come from.</p>
<h2>List (cash) prices</h2><p>List prices reflect published wholesale acquisition cost (WAC) and typical US cash prices. They are rounded and labelled "approximate," because the actual cash price varies by pharmacy and region.</p>
<h2>Copay-card terms</h2><p>Copay-card figures ("as little as $X") come directly from the manufacturer\'s official savings page, which is linked as a source on each drug page. These programs are, by their own terms, limited to patients with commercial insurance.</p>
<h2>Medicare-negotiated prices</h2><p>Negotiated Maximum Fair Prices come from CMS.gov. The first ten took effect on 1 January 2026; a second group has negotiated prices effective 1 January 2027. We state which cycle a drug belongs to.</p>
<h2>What we do not do</h2><p>We do not quote real-time pharmacy prices, and we do not present any figure as a guarantee. Always confirm the current price with your pharmacy, plan, or the manufacturer before making a decision.</p>
<h2>Scope of medical review</h2><p>Our reviewer, a practising pathologist and department head, verifies that pricing and coverage mechanisms are described accurately. He does not provide individual medical or financial advice.</p>`,
    },
    {
      slug: 'contact', title: 'Contact | RxCostGuide', desc: 'Contact RxCostGuide to report a pricing error or ask a question about our content.',
      h1: 'Contact us',
      body: `<p>To report a pricing error or a broken program link, or to ask about our content, email <a href="mailto:hello@rxcostguide.com">hello@rxcostguide.com</a>. We aim to review corrections within a few business days.</p>
<p>Please note we cannot provide individual medical, insurance, or financial advice. For questions about your specific coverage, contact your plan, pharmacy, or the manufacturer\'s support line listed on each drug page.</p>`,
    },
    {
      slug: 'privacy-policy', title: 'Privacy Policy | RxCostGuide', desc: 'How RxCostGuide handles data and advertising cookies.',
      h1: 'Privacy policy',
      body: `<p>RxCostGuide is an information website. We do not ask you to create an account or submit health information to read our content.</p>
<h2>Analytics and advertising</h2><p>We use standard web analytics to understand which pages are useful, and we display advertising (including Google AdSense). Advertising partners may use cookies to serve relevant ads; you can control cookies in your browser settings and via Google\'s ad settings.</p>
<h2>What we collect</h2><p>We collect only standard, non-identifying analytics (pages viewed, general location, device type). We do not sell personal data.</p>
<h2>Contact</h2><p>Questions about privacy: <a href="mailto:hello@rxcostguide.com">hello@rxcostguide.com</a>.</p>`,
    },
    {
      slug: 'terms', title: 'Terms of Use | RxCostGuide', desc: 'Terms governing use of RxCostGuide content.',
      h1: 'Terms of use',
      body: `<p>By using RxCostGuide you agree to these terms.</p>
<h2>Information only</h2><p>All content is for general information about drug costs and coverage. It is <strong>not medical, legal, or financial advice</strong>, and it is not a substitute for guidance from your doctor, pharmacist, plan, or a qualified professional.</p>
<h2>No guarantee of accuracy</h2><p>Prices and program terms change frequently and vary by location and plan. We make no guarantee that any figure is current or applies to you. Always confirm with the primary source before acting.</p>
<h2>No affiliation</h2><p>RxCostGuide is independent and not affiliated with any manufacturer, pharmacy, or insurer. Links to manufacturer and government sites are provided for your convenience.</p>
<h2>Liability</h2><p>We are not liable for decisions made based on this information. Use it as a starting point for your own research and professional advice.</p>`,
    },
  ];
  // -------- machine-readable price database (JSON API + AEO/GEO asset) --------
  const priceDb = {
    source: 'RxCostGuide', updated: MOD,
    note: 'Approximate US prices, verified against manufacturer pages and CMS.gov. Not medical or financial advice.',
    reviewer: `${SITE.author.name}, ${SITE.author.creds} (${SITE.author.pmdc})`,
    drugs: allDrugs.map(d => ({
      brand: d.brand, generic: d.generic, class: d.drugClass, hub: d.hub,
      url: SITE.url + `/${d.hub}/${d.slug}-cost/`,
      list_price: d.listPriceText || null,
      copay_card_floor: d.copay ? (d.copay.maxPerFill || 'available') : null,
      medicare_negotiated_2026: !!(d.medicare && d.medicare.negotiated),
      medicare_price: d.medicare && d.medicare.mfp ? d.medicare.mfp : null,
      patient_assistance: !!d.assistance,
      has_generic_or_biosimilar: !!d.hasBiosimilar,
      updated: d.modified || d.published || MOD,
    })),
  };
  writeRaw('api/prices.json', JSON.stringify(priceDb, null, 2));

  // -------- 404 (not in sitemap) --------
  writeRaw('404.html', P.basicPage({
    title: 'Page not found | RxCostGuide', desc: 'That page could not be found.', path: '/404.html',
    h1: 'Page not found', noindex: true,
    lede: 'Sorry — that page doesn\'t exist. Try one of these:',
    bodyHtml: `<ul class="applies">
<li><a href="/drugs/">All drugs A–Z</a></li>
<li><a href="/tools/drug-cost-estimator/">Compare drug prices</a></li>
<li><a href="/guides/">Savings guides</a></li>
<li><a href="/diabetes/">Diabetes drugs</a></li>
<li><a href="/glp-1-weight-loss/">Weight-loss drugs</a></li>
<li><a href="/heart-blood-thinners/">Heart &amp; blood thinners</a></li>
</ul>`,
  }));

  for (const s of staticPages) {
    write(`${s.slug}/index.html`, P.basicPage({
      title: s.title, desc: s.desc, path: `/${s.slug}/`, h1: s.h1,
      schema: [L.breadcrumb([['Home', '/'], [s.h1, `/${s.slug}/`]])],
      bodyHtml: s.body + L.reviewedBlock(),
    }), { changefreq: 'yearly', priority: '0.3', group: 'pages' });
  }
};
