// Segmented sitemaps + sitemap index, robots.txt, llms.txt, llms-full.txt.
'use strict';
module.exports = function (ctx) {
  const { SITE, hubs, allDrugs, urls, writeRaw } = ctx;
  const today = new Date().toISOString().slice(0, 10);

  const byGroup = g => urls.filter(u => u.group === g);
  function sm(list) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${list.map(u => `<url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq || 'monthly'}</changefreq><priority>${u.priority || '0.6'}</priority></url>`).join('\n')}
</urlset>`;
  }
  writeRaw('sitemap-drugs.xml', sm(byGroup('drugs')));
  writeRaw('sitemap-hubs.xml', sm(byGroup('hubs')));
  writeRaw('sitemap-guides.xml', sm(byGroup('guides')));
  writeRaw('sitemap-pages.xml', sm(byGroup('pages')));

  const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['sitemap-drugs.xml', 'sitemap-hubs.xml', 'sitemap-guides.xml', 'sitemap-pages.xml']
      .map(s => `<sitemap><loc>${SITE.url}/${s}</loc><lastmod>${today}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`;
  writeRaw('sitemap.xml', index);

  // robots.txt — explicitly welcome AI crawlers
  writeRaw('robots.txt', `# RxCostGuide
User-agent: *
Allow: /
Disallow: /data/
Disallow: /src/
Disallow: /scripts/

# AI / answer-engine crawlers — explicitly welcome
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-Web
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /
User-agent: Bingbot
Allow: /
User-agent: CCBot
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`);

  // llms.txt — curated index for LLM crawlers
  const drugLines = allDrugs.map(d => `- [${d.brand} (${d.generic}) cost](${SITE.url}/${d.hub}/${d.slug}-cost/): ${d.metaDesc}`).join('\n');
  const hubLines = hubs.map(h => `- [${h.hub.name} costs](${SITE.url}/${h.hub.slug}/): ${h.hub.metaDesc}`).join('\n');
  const guideLines = urls.filter(u => u.group === 'guides').map(u => `- ${u.loc}`).join('\n');
  writeRaw('llms.txt', `# RxCostGuide

> ${SITE.desc} Reviewed by ${SITE.author.name} (${SITE.author.pmdc}). Prices are approximate US figures and are verified against manufacturer pages and CMS.gov, with the retrieval date shown on each page.

## Drug cost pages
${drugLines}

## Condition hubs
${hubLines}

## Guides
${guideLines}

## About
- [Our reviewer, ${SITE.author.name}](${SITE.author.url})
- [How we source prices](${SITE.url}/how-we-source-prices/)
- [Editorial policy](${SITE.url}/editorial-policy/)
`);

  writeRaw('llms-full.txt', `# RxCostGuide — full index

${SITE.desc}
All prices approximate, US, verified against manufacturer savings pages and CMS.gov; retrieval date shown per page.
Reviewer: ${SITE.author.name}, ${SITE.author.creds} (${SITE.author.pmdc}).

${allDrugs.map(d => `## ${d.brand} (${d.generic})
URL: ${SITE.url}/${d.hub}/${d.slug}-cost/
Class: ${d.drugClass}
Short answer: ${d.shortAnswer.replace(/\*\*/g, '').replace(/\n+/g, ' ')}
`).join('\n')}
`);
};
