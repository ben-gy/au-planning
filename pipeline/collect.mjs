/**
 * Data pipeline: fetches development applications from council open data APIs
 * and writes normalised JSON to public/data/
 *
 * Currently supported sources:
 * - City of Casey (VIC) — OpenDataSoft API, no auth required
 *
 * To add PlanningAlerts:
 *   Set PLANNING_ALERTS_KEY as a GitHub Actions secret, then uncomment the
 *   PlanningAlerts section below.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');

mkdirSync(DATA_DIR, { recursive: true });

/** Normalised DA record */
function normalise(raw, council, state) {
  return {
    id: `${council.slug}-${raw.application_number || raw.id}`,
    council: council.name,
    councilSlug: council.slug,
    state,
    applicationNumber: raw.application_number || raw.id || '',
    description: raw.description || '',
    category: classifyDescription(raw.description || ''),
    rawCategory: raw.application_category || '',
    address: raw.plnpermitaddress || raw.address || '',
    suburb: raw.suburb || '',
    postcode: raw.postcode || '',
    status: normaliseStatus(raw.status || raw.respauth || ''),
    decision: normaliseDecision(raw.decision_new || raw.stage_decision || ''),
    lodgedDate: raw.lodged_date || raw.date_scraped || '',
    decisionDate: raw.decision_date || '',
    processingDays: calcProcessingDays(raw.lodged_date, raw.decision_date),
  };
}

function classifyDescription(desc) {
  const d = desc.toLowerCase();
  if (/subdivi/.test(d)) return 'Subdivision';
  if (/dwell|house|residen|unit|apartment|townhouse/.test(d)) return 'Residential';
  if (/commercial|shop|retail|office/.test(d)) return 'Commercial';
  if (/industr|warehouse|factory/.test(d)) return 'Industrial';
  if (/change of use/.test(d)) return 'Change of Use';
  if (/signage|sign|adverti/.test(d)) return 'Signage';
  if (/vegetation|tree|remov/.test(d)) return 'Vegetation';
  if (/fence|carport|shed|garage|pool|deck|pergola/.test(d)) return 'Ancillary';
  if (/childcare|child care|education|school/.test(d)) return 'Community';
  if (/telecomm|tower|antenna/.test(d)) return 'Infrastructure';
  if (/liquor|food|cafe|restaurant/.test(d)) return 'Hospitality';
  if (/medical|health|aged care|community care/.test(d)) return 'Health/Aged Care';
  return 'Other';
}

function normaliseStatus(s) {
  const sl = s.toLowerCase();
  if (/current|in progress|active|lodged|pending/.test(sl)) return 'In Progress';
  if (/past|complet|decided|closed|finalised/.test(sl)) return 'Decided';
  if (/no permit/.test(sl)) return 'No Permit Required';
  return s || 'Unknown';
}

function normaliseDecision(d) {
  const dl = d.toLowerCase();
  if (/approved|permit issued|granted/.test(dl)) return 'Approved';
  if (/refused|rejected|denied/.test(dl)) return 'Refused';
  if (/withdrawn|lapsed/.test(dl)) return 'Withdrawn';
  if (/in progress|pending|allocated|assessment/.test(dl)) return 'Pending';
  if (/no permit/.test(dl)) return 'No Permit Required';
  return d || 'Unknown';
}

function calcProcessingDays(lodged, decided) {
  if (!lodged || !decided) return null;
  const l = new Date(lodged);
  const d = new Date(decided);
  if (isNaN(l.getTime()) || isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - l.getTime()) / (1000 * 60 * 60 * 24));
}

// --- Council sources ---

const SOURCES = [
  {
    name: 'City of Casey',
    slug: 'casey',
    state: 'VIC',
    async fetch() {
      const BASE = 'https://data.casey.vic.gov.au/api/explore/v2.1/catalog/datasets/planning-permit-applications-register-only/records';
      const all = [];
      let offset = 0;
      const limit = 100;
      while (true) {
        const url = `${BASE}?limit=${limit}&offset=${offset}&order_by=lodged_date%20desc`;
        console.log(`  Fetching Casey offset=${offset}...`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Casey API ${res.status}: ${res.statusText}`);
        const data = await res.json();
        const results = data.results || [];
        if (results.length === 0) break;
        all.push(...results);
        offset += limit;
        // Limit to 5000 records per run to stay within reasonable bounds
        if (offset >= 5000) break;
        // Small delay to be respectful
        await new Promise(r => setTimeout(r, 200));
      }
      return all;
    },
  },
];

// --- Main ---

async function main() {
  const allRecords = [];
  const meta = { lastUpdated: new Date().toISOString(), councils: [] };

  for (const source of SOURCES) {
    console.log(`Fetching from ${source.name}...`);
    try {
      const raw = await source.fetch();
      console.log(`  Got ${raw.length} records`);
      const normalised = raw.map(r => normalise(r, source, source.state));
      allRecords.push(...normalised);
      meta.councils.push({
        name: source.name,
        slug: source.slug,
        state: source.state,
        recordCount: normalised.length,
      });
    } catch (err) {
      console.error(`  Error fetching ${source.name}:`, err.message);
      meta.councils.push({
        name: source.name,
        slug: source.slug,
        state: source.state,
        recordCount: 0,
        error: err.message,
      });
    }
  }

  // Write full dataset
  writeFileSync(join(DATA_DIR, 'applications.json'), JSON.stringify(allRecords));
  console.log(`Wrote ${allRecords.length} records to applications.json`);

  // Write metadata
  writeFileSync(join(DATA_DIR, 'meta.json'), JSON.stringify(meta, null, 2));
  console.log('Wrote meta.json');

  // Write aggregates for faster loading
  const aggregates = buildAggregates(allRecords);
  writeFileSync(join(DATA_DIR, 'aggregates.json'), JSON.stringify(aggregates));
  console.log('Wrote aggregates.json');
}

function buildAggregates(records) {
  const byCategory = {};
  const bySuburb = {};
  const byMonth = {};
  const byStatus = {};
  const byDecision = {};
  const processingTimes = [];

  for (const r of records) {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    bySuburb[r.suburb] = (bySuburb[r.suburb] || 0) + 1;
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    byDecision[r.decision] = (byDecision[r.decision] || 0) + 1;

    if (r.lodgedDate) {
      const month = r.lodgedDate.slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }

    if (r.processingDays !== null && r.processingDays >= 0 && r.processingDays < 3650) {
      processingTimes.push(r.processingDays);
    }
  }

  // Status flow: category → decision
  const flows = {};
  for (const r of records) {
    const key = `${r.category}→${r.decision}`;
    flows[key] = (flows[key] || 0) + 1;
  }

  return {
    totalRecords: records.length,
    byCategory,
    bySuburb,
    byMonth,
    byStatus,
    byDecision,
    flows,
    processingTimes: processingTimes.sort((a, b) => a - b),
  };
}

main().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
