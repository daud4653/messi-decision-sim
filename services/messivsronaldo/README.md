# Enrichment adapter, not a scraper

Inspected https://www.messivsronaldo.app/ on 2026-10-06: HTML contains `application/ld+json` metadata, but no `__NEXT_DATA__`, application/json statistical payload, or documented public download/API link was identified. The robots.txt URL returned 404; an assumed terms-and-conditions path could not be verified. A missing robots file is not permission to republish data.

Use the site's provided context manually, within applicable terms, and attach the precise source page and the site's metric definition. Do not infer event-level actions from totals. The app never requests historical pages at runtime. Do not add aggressive crawling.

`npm run enrichment:import -- --file /path/to/import.json` validates and merges into `data/enrichment/profiles.json`. Reimporting an identical field is idempotent. Different values or definitions remain separate, including conflicting values from the same source. No conflict is silently overwritten. Metric-level provenance is retained in Supabase metadata.

The JSON file contains an array of objects:

```json
[
  {
    "playerSourceId": 5503,
    "season": "2011/2012",
    "matchSourceId": null,
    "team": "Barcelona",
    "metrics": []
  }
]
```

Each metric must have `value` (nonnegative number), `source` (`messivsronaldo`, `statsbomb`, or `manual`), `sourceUrl`, `metric`, `definition`, and `retrievedAt` (`YYYY-MM-DD`). Supported metric names are in `lib/enrichment/schema.ts`. Empty metrics above intentionally avoid asserting unverified numbers.

Event actions are canonically StatsBomb. Season context is canonically MessiVsRonaldo. Match-level enrichment is stored for later post-match context but NEVER passed into a decision prompt: it could describe the answer. Season profiles are retrospective and labeled as such.
