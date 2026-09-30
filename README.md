# RxCostGuide

Static, clinician-reviewed US prescription drug-cost site. Built for speed, SEO/AEO/GEO and AI-crawler friendliness. Deployed to Cloudways via Git.

## How it works

- **Content/price database:** `data/*.js` (one file per condition hub) + `data/_guides.js`. Each drug object carries its prices, copay-card terms, Medicare status, FAQs and sources. This is the single source of truth.
- **Generator:** `scripts/build.js` renders every page as static HTML into the repo root, plus segmented sitemaps, `robots.txt`, `llms.txt`, `llms-full.txt` and `api/prices.json`.
- **Templates & schema:** `src/lib.js` (shell, header/footer, schema builders) and `src/pages.js` (page types). One stylesheet: `src/style.css` → copied to `assets/css/style.css` at build.

## Build

```bash
npm run build        # regenerate the whole site
npm run update-prices # re-stamp verified date + rebuild (monthly hook)
```

## Deploy (GitHub → Cloudways)

The built HTML lives at the repo root, so Cloudways' native **Deployment via Git** serves it directly with no build step on the server. Push to `main` → Cloudways pulls and deploys. `data/`, `src/`, `scripts/` and `node_modules/` are blocked from the web by `.htaccess`.

## Monthly price refresh

1. Re-verify each drug's figures against its `sources` (manufacturer page + CMS.gov).
2. Edit the number in `data/<hub>.js`.
3. `npm run update-prices`, then commit & push.

## SEO/AEO/GEO built in

- `MedicalDrug` + `Article` + `FAQPage` + `BreadcrumbList` JSON-LD on every drug page; `CollectionPage`/`ItemList` on hubs; `Person`/`Organization`/`WebSite` graph site-wide.
- Answer-first sections, sourced & dated prices, semantic HTML tables.
- `llms.txt`, `llms-full.txt`, `api/prices.json`, and an AI-crawler-welcoming `robots.txt`.

Reviewed by Dr. Faisal Irshad, MBBS, M.Phil Chemical Pathology (PMDC 54440-S).
