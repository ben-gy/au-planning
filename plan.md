# Site Plan: Development Applications (AU)

## Overview
- **Name:** Development Applications (AU)
- **Repo name:** au-planning
- **Tagline:** Unified planning and development application explorer across Australian councils

### Naming Convention
Country-specific: "Development Applications (AU)" — uses the bracket suffix convention.

## Target Audience
Australian homebuyers researching suburbs for development activity, property developers checking what's being built nearby, local residents monitoring neighbourhood planning decisions, and planning researchers comparing council activity. Device: desktop-primary (data-dense), with mobile support for quick lookups. These users want fast answers about "what's being built near me" and "how does this council compare."

## Value Proposition
Every Australian council has its own planning portal with inconsistent formats, different terminology, and no way to compare across boundaries. This site normalises development application data from multiple councils into a single, searchable interface with map views, category breakdowns, and processing time analysis. Bookmark it to track development activity in your suburb or compare councils before buying a home.

## Data Sources
| Source | URL | What it provides | Update frequency | Auth required? |
|--------|-----|-------------------|-----------------|----------------|
| City of Casey (VIC) | https://data.casey.vic.gov.au/api/explore/v2.1/catalog/datasets/planning-permit-applications-register-only/records | 23,000+ planning permit applications with type, status, decision, suburb, dates | Continuous | No |
| PlanningAlerts API | https://api.planningalerts.org.au/ | DAs from 212 authorities covering 89% of Australia | Daily | Yes (API key — add as GitHub secret) |

## Key Features
1. **Interactive map** — Leaflet choropleth showing DA density by suburb with click-to-drill-down
2. **Searchable table** — Sort by date, status, type, suburb; full-text search on descriptions
3. **Category breakdown** — Horizontal bar charts showing DA types (subdivision, dwelling, commercial, etc.)
4. **Timeline view** — Monthly DA volume over time with trend lines
5. **Status flow** — Sankey diagram showing how applications flow from lodged → in progress → approved/rejected/withdrawn
6. **Suburb analysis** — Compare suburbs by DA volume, approval rate, and average processing time
7. **Processing time distribution** — Histogram of days from lodged to decision, by category
8. **Glossary & education** — Inline tooltips explaining planning jargon (DA, VicSmart, S72, etc.)

## Target Audience (detailed)
Primary: Australian homebuyers aged 25-45 researching suburbs before purchasing. They're on desktop at night after work, comparing areas for development activity that might affect property values or liveability. They want to quickly see "is this suburb getting a lot of new development?" and "what kind of development?"

Secondary: Local residents concerned about specific developments near them. They want to find a specific DA by address or description and understand its status.

Tertiary: Planning researchers, journalists, and council staff comparing development patterns across suburbs and time periods. They want aggregate stats and trends.

## Style Direction
**Tone:** Professional/civic — clean, trustworthy, authoritative like a government information portal
**Colour palette:** Clean white backgrounds with navy (#1e3a5f) and teal (#0d9488) accents. Government-blue feel that conveys authority and trustworthiness. Subtle warm greys for text hierarchy.
**UI density:** Balanced — data-dense where showing tables/charts, spacious for search and navigation
**Dark/light theme:** Light — civic, general-audience tool for the public
**Reference sites for tone:** planningalerts.org.au (civic, functional), abs.gov.au (government data, authoritative)

## Technical Architecture
- **Stack:** Vanilla TypeScript + Vite
- **Data strategy:** Pipeline (GitHub Actions fetches from council APIs, stores as JSON in public/data/)
- **Key libraries:** Leaflet (map), hand-rolled SVG (charts, Sankey)

## Layout
- Fixed header (48px) with site name, search bar, and view tabs
- Main content area fills remaining viewport height
- View tabs switch between: Map | Table | Categories | Timeline | Flow | Suburbs | Processing
- Footer (28px) with attribution and data update timestamp
- Responsive: tabs become a dropdown on mobile, panels stack vertically

## Pages/Views
Single-page application with tab-based views:
1. Map — default view, Leaflet choropleth
2. Table — sortable/filterable data table
3. Categories — horizontal bar charts by DA type
4. Timeline — monthly volume chart
5. Flow — Sankey status flow diagram
6. Suburbs — suburb comparison bars + stats
7. Processing — processing time histogram

## Visualization Strategy

1. **Where is development happening?** → **Leaflet choropleth map** with suburb boundaries shaded by DA density. Click a suburb to see its DAs. Markers for individual recent DAs. Cluster markers at low zoom.

2. **What types of development?** → **Horizontal bar chart** by classified category (Residential, Subdivision, Commercial, Industrial, Change of Use, etc.). A categories.ts module classifies DA descriptions into groups using keyword matching.

3. **How do applications flow through the system?** → **Sankey/flow diagram** from Application Type → Status → Decision. Shows how many of each type end up approved vs rejected vs withdrawn.

4. **How does it change over time?** → **Timeline bar chart** showing monthly DA volume, with colour-coded stacks by category. Hoverable for exact counts.

5. **How do suburbs compare?** → **Suburb comparison view** with horizontal bars ranked by total DAs, approval rate, and average processing days. Click to drill into a suburb.

6. **How long does it take?** → **Processing time histogram** showing distribution of days from lodged to decision. Filterable by category and decision outcome.

7. **What's the detail?** → **Searchable table** with all DAs, sortable columns, text search, and filters for status/category/suburb.
