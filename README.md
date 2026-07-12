# Development Applications (AU)

**Unified planning and development application explorer across Australian councils — search, filter, and visualise DAs by type, status, suburb, and processing time.**

[Live](https://au-planning.benrichardson.dev)

## What is this?

Every Australian council has its own planning portal with inconsistent formats, different terminology, and no way to compare data across boundaries. This site normalises development application data from multiple councils into a single, searchable interface.

A development application (DA) — or "planning permit application" in Victoria — is a formal request to a local council for permission to build, demolish, or change how land or buildings are used. Every significant change to the built environment goes through this process, and the data is public record.

Currently focused on the **City of Casey** in Victoria (23,000+ applications), with pipeline infrastructure to add more councils as their data becomes available via open data portals.

## Who is this for?

- **Homebuyers** researching suburbs for development activity before purchasing — "is this suburb getting a lot of new development?"
- **Local residents** monitoring planning decisions near them — find a specific DA by address and check its status
- **Planners and researchers** comparing development patterns across suburbs and time periods — aggregate stats, approval rates, processing times
- **Journalists** investigating planning trends — which suburbs have the highest refusal rates? Which types of development take longest?

## Data Sources

| Source | What it provides | Update frequency |
|--------|-------------------|-----------------|
| City of Casey (VIC) | 23,000+ planning permit applications with type, status, decision, suburb, dates | Continuous (pipeline batches monthly) |
| PlanningAlerts API | DAs from 212 authorities covering 89% of Australia | Daily (requires API key) |

## Features

- **Interactive map** — Leaflet choropleth showing DA density by suburb with click-to-drill-down
- **Searchable table** — Sort by date, status, type, suburb; full-text search on descriptions
- **Category breakdown** — Horizontal bar charts showing DA types (subdivision, dwelling, commercial, etc.)
- **Timeline view** — Monthly DA volume over time with annual comparisons
- **Status flow diagram** — Sankey showing how applications flow from category to decision (approved/refused/withdrawn)
- **Suburb comparison** — Compare suburbs by DA volume, approval rate, and average processing time
- **Processing time analysis** — Histogram of days from lodged to decision, with percentile breakdown
- **Glossary** — Inline tooltips and modal glossary explaining planning jargon

## Tech Stack

- **Runtime:** Vanilla TypeScript
- **Build:** Vite 6
- **Testing:** Vitest (62 tests)
- **Hosting:** GitHub Pages (static, no backend)
- **Data:** GitHub Actions pipeline fetching from council open data APIs
- **Maps:** Leaflet
- **Charts:** Hand-rolled SVG (no chart library dependency)

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Production build
npm run build

# Preview production build
npm run preview
```

## How it works

A GitHub Actions data pipeline runs monthly:

1. **Collect** — `pipeline/collect.mjs` fetches development application records from council open data APIs (currently City of Casey via their OpenDataSoft API)
2. **Normalise** — Raw data is normalised into a consistent schema: category classification via keyword matching, status normalisation, processing time calculation
3. **Aggregate** — Pre-computed aggregates (by category, suburb, month, decision, flows, processing times) are stored alongside the full dataset
4. **Commit** — Processed JSON is committed to `public/data/` and served as static files

The frontend loads `/data/applications.json` and `/data/aggregates.json` on page load, then renders 7 interactive views. All filtering happens client-side for instant response.

## Adding more councils

The pipeline is designed to be extended. To add a new council data source:

1. Add a new source object to the `SOURCES` array in `pipeline/collect.mjs`
2. Implement the `fetch()` method to retrieve records from the council's API
3. The normalisation functions handle the rest — category classification, status mapping, and processing time calculation

For PlanningAlerts integration (covers 212 authorities, 89% of Australia), add a `PLANNING_ALERTS_KEY` secret to the GitHub repository.

## License

MIT
