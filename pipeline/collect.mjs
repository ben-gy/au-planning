/**
 * Data pipeline: fetches ALL development applications from council open data APIs
 * and writes normalised, chunked JSON to public/data/
 *
 * Sources:
 * - City of Casey (VIC) — OpenDataSoft API, no auth
 * - PlanningAlerts API — 212+ authorities (requires PLANNING_ALERTS_KEY env var)
 *
 * Output:
 *   public/data/council-stats.json — per-council aggregate stats (leaderboard data)
 *   public/data/aggregates.json    — global aggregates
 *   public/data/meta.json          — metadata + council list
 *   public/data/councils/{slug}.json — full detail records per council
 *
 * NEVER cap the data. Fetch ALL records from every source.
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');
const COUNCILS_DIR = join(DATA_DIR, 'councils');

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(COUNCILS_DIR, { recursive: true });

// ── LGA Population Data (ABS 2021 Census) ──
let lgaPopulation = {};
try {
  lgaPopulation = JSON.parse(readFileSync(join(__dirname, 'data', 'lga-population.json'), 'utf-8'));
} catch { /* population data optional */ }

function lookupPopulation(councilName) {
  // Try direct match, then fuzzy
  const key = councilName.toLowerCase().replace(/^city of |^shire of |^municipality of /i, '').trim();
  if (lgaPopulation[key]) return lgaPopulation[key];
  // Try with "city of" prefix
  if (lgaPopulation[`city of ${key}`]) return lgaPopulation[`city of ${key}`];
  // Fallback: partial match
  for (const [k, v] of Object.entries(lgaPopulation)) {
    if (k.includes(key) || key.includes(k)) return v;
  }
  return null;
}

// ── Normalisation ──

function normalise(raw, council, state) {
  return {
    id: `${council.slug}-${raw.application_number || raw.council_reference || raw.id || ''}`,
    council: council.name,
    councilSlug: council.slug,
    state,
    applicationNumber: raw.application_number || raw.council_reference || raw.id || '',
    description: raw.description || '',
    category: classifyDescription(raw.description || ''),
    rawCategory: raw.application_category || '',
    address: raw.plnpermitaddress || raw.address || '',
    suburb: raw.suburb || extractSuburb(raw.plnpermitaddress || raw.address || ''),
    postcode: raw.postcode || extractPostcode(raw.plnpermitaddress || raw.address || ''),
    status: normaliseStatus(raw.status || raw.respauth || ''),
    decision: normaliseDecision(raw.decision_new || raw.stage_decision || ''),
    lodgedDate: raw.lodged_date || raw.date_received || raw.date_scraped || '',
    decisionDate: raw.decision_date || '',
    processingDays: calcProcessingDays(raw.lodged_date || raw.date_received, raw.decision_date),
    lat: raw.lat || null,
    lng: raw.lng || null,
  };
}

function extractSuburb(address) {
  if (!address) return '';
  // Pattern: "123 Street Name SUBURB STATE POSTCODE"
  const parts = address.split(/\s+/);
  // Try to find suburb by looking for a word before a state code
  const stateIdx = parts.findIndex(p => /^(VIC|NSW|QLD|SA|WA|TAS|ACT|NT)$/i.test(p));
  if (stateIdx > 0) {
    // Walk back from state to find suburb (capitalized words before state)
    let suburbParts = [];
    for (let i = stateIdx - 1; i >= 0; i--) {
      if (/^\d/.test(parts[i])) break; // hit postcode or street number
      if (parts[i] === parts[i].toUpperCase() && parts[i].length > 1) {
        suburbParts.unshift(parts[i]);
      } else break;
    }
    if (suburbParts.length > 0) {
      return suburbParts.join(' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\b(\w)(\w*)/g, (_, f, r) => f + r.toLowerCase());
    }
  }
  return '';
}

function extractPostcode(address) {
  if (!address) return '';
  const match = address.match(/\b(\d{4})\b\s*$/);
  return match ? match[1] : '';
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
  if (/demoli/.test(d)) return 'Demolition';
  if (/multi.?storey|high.?rise|mixed.?use/.test(d)) return 'Multi-Storey';
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
  if (/deferred/.test(dl)) return 'Deferred';
  return d || 'Unknown';
}

function calcProcessingDays(lodged, decided) {
  if (!lodged || !decided) return null;
  const l = new Date(lodged);
  const d = new Date(decided);
  if (isNaN(l.getTime()) || isNaN(d.getTime())) return null;
  const days = Math.round((d.getTime() - l.getTime()) / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : null;
}

function median(arr) {
  if (arr.length === 0) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// ── Council Sources ──

const SOURCES = [
  {
    name: 'City of Casey',
    slug: 'casey',
    state: 'VIC',
    lat: -38.05,
    lng: 145.30,
    async fetch() {
      // Use the export endpoint — returns ALL records in one call (no 10k offset limit)
      const url = 'https://data.casey.vic.gov.au/api/explore/v2.1/catalog/datasets/planning-permit-applications-register-only/exports/json?limit=-1';
      console.log('  Fetching ALL Casey records via export endpoint...');
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Casey API ${res.status}: ${res.statusText}`);
      return await res.json();
    },
  },
];

// PlanningAlerts — add when API key is available
if (process.env.PLANNING_ALERTS_KEY) {
  const PA_KEY = process.env.PLANNING_ALERTS_KEY;
  SOURCES.push({
    name: 'PlanningAlerts',
    slug: 'planningalerts',
    state: 'ALL',
    lat: -25.27,
    lng: 133.77,
    async fetch() {
      const all = [];
      let page = 1;
      while (true) {
        const url = `https://api.planningalerts.org.au/applications.json?key=${PA_KEY}&page=${page}&count=100`;
        if (page % 10 === 1) console.log(`  Fetching PlanningAlerts page=${page}...`);
        const res = await fetch(url);
        if (res.status === 429) {
          console.log('  Rate limited, waiting 60s...');
          await new Promise(r => setTimeout(r, 60000));
          continue;
        }
        if (!res.ok) throw new Error(`PlanningAlerts API ${res.status}`);
        const data = await res.json();
        const apps = data.application ? [data.application] : (data || []);
        if (!Array.isArray(apps) || apps.length === 0) break;
        // PlanningAlerts has different field structure
        for (const app of apps) {
          const a = app.application || app;
          all.push({
            council_reference: a.council_reference || '',
            description: a.description || '',
            address: a.address || '',
            date_scraped: a.date_scraped || '',
            date_received: a.date_received || '',
            lat: a.lat,
            lng: a.lng,
            authority: a.authority?.full_name || '',
            on_notice_from: a.on_notice_from || '',
            on_notice_to: a.on_notice_to || '',
          });
        }
        page++;
        await new Promise(r => setTimeout(r, 500));
      }
      return all;
    },
  });
}

// ── Main ──

async function main() {
  const councilRecords = new Map(); // slug → normalised records
  const meta = { lastUpdated: new Date().toISOString(), councils: [] };

  for (const source of SOURCES) {
    console.log(`Fetching from ${source.name}...`);
    try {
      const raw = await source.fetch();
      console.log(`  Got ${raw.length} records`);

      // For PlanningAlerts, split by authority into separate councils
      if (source.slug === 'planningalerts') {
        const byAuthority = new Map();
        for (const r of raw) {
          const auth = r.authority || 'Unknown';
          if (!byAuthority.has(auth)) byAuthority.set(auth, []);
          byAuthority.get(auth).push(r);
        }
        for (const [authName, records] of byAuthority) {
          const slug = authName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const council = { name: authName, slug };
          const normalised = records.map(r => normalise(r, council, guessState(r.address)));
          councilRecords.set(slug, (councilRecords.get(slug) || []).concat(normalised));
          meta.councils.push({
            name: authName,
            slug,
            state: guessState(records[0]?.address || ''),
            recordCount: normalised.length,
            lat: records[0]?.lat || null,
            lng: records[0]?.lng || null,
          });
        }
      } else {
        const normalised = raw.map(r => normalise(r, source, source.state));
        councilRecords.set(source.slug, normalised);
        meta.councils.push({
          name: source.name,
          slug: source.slug,
          state: source.state,
          recordCount: normalised.length,
          lat: source.lat || null,
          lng: source.lng || null,
        });
      }
    } catch (err) {
      console.error(`  Error fetching ${source.name}:`, err.message);
      meta.councils.push({
        name: source.name,
        slug: source.slug,
        state: source.state,
        recordCount: 0,
        error: err.message,
        lat: source.lat || null,
        lng: source.lng || null,
      });
    }
  }

  // Merge all records
  const allRecords = [];
  for (const records of councilRecords.values()) {
    allRecords.push(...records);
  }

  console.log(`\nTotal: ${allRecords.length} records across ${councilRecords.size} councils`);

  // ── Write per-council detail files ──
  for (const [slug, records] of councilRecords) {
    writeFileSync(join(COUNCILS_DIR, `${slug}.json`), JSON.stringify(records));
    console.log(`  Wrote councils/${slug}.json (${records.length} records)`);
  }

  // ── Build and write council stats (leaderboard data) ──
  const councilStats = [];
  for (const [slug, records] of councilRecords) {
    const council = meta.councils.find(c => c.slug === slug);
    const stats = buildCouncilStats(records, council);
    councilStats.push(stats);
  }
  writeFileSync(join(DATA_DIR, 'council-stats.json'), JSON.stringify(councilStats));
  console.log(`Wrote council-stats.json (${councilStats.length} councils)`);

  // ── Write global aggregates ──
  const aggregates = buildGlobalAggregates(allRecords);
  writeFileSync(join(DATA_DIR, 'aggregates.json'), JSON.stringify(aggregates));
  console.log('Wrote aggregates.json');

  // ── Write metadata ──
  writeFileSync(join(DATA_DIR, 'meta.json'), JSON.stringify(meta, null, 2));
  console.log('Wrote meta.json');

  // ── Write backward-compat applications.json (all records) ──
  writeFileSync(join(DATA_DIR, 'applications.json'), JSON.stringify(allRecords));
  console.log(`Wrote applications.json (${allRecords.length} records)`);
}

function guessState(address) {
  const a = (address || '').toUpperCase();
  if (/\bVIC\b/.test(a)) return 'VIC';
  if (/\bNSW\b/.test(a)) return 'NSW';
  if (/\bQLD\b/.test(a)) return 'QLD';
  if (/\bSA\b/.test(a)) return 'SA';
  if (/\bWA\b/.test(a)) return 'WA';
  if (/\bTAS\b/.test(a)) return 'TAS';
  if (/\bACT\b/.test(a)) return 'ACT';
  if (/\bNT\b/.test(a)) return 'NT';
  return 'Unknown';
}

function buildCouncilStats(records, councilMeta) {
  const population = lookupPopulation(councilMeta?.name || '');
  const byCategory = {};
  const byDecision = {};
  const byMonth = {};
  const bySuburb = {};
  const processingTimes = [];

  let approved = 0, refused = 0, withdrawn = 0, pending = 0;

  for (const r of records) {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    byDecision[r.decision] = (byDecision[r.decision] || 0) + 1;
    if (r.suburb) bySuburb[r.suburb] = (bySuburb[r.suburb] || 0) + 1;
    if (r.lodgedDate) {
      const month = r.lodgedDate.slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }
    if (r.processingDays !== null && r.processingDays >= 0 && r.processingDays < 3650) {
      processingTimes.push(r.processingDays);
    }
    if (r.decision === 'Approved') approved++;
    else if (r.decision === 'Refused') refused++;
    else if (r.decision === 'Withdrawn') withdrawn++;
    else if (r.decision === 'Pending') pending++;
  }

  const decided = approved + refused + withdrawn;
  const medProcessing = median(processingTimes);
  const avgProcessing = processingTimes.length > 0
    ? Math.round(processingTimes.reduce((s, t) => s + t, 0) / processingTimes.length)
    : null;

  // Stalled: pending for >120 days
  const now = new Date();
  let stalled = 0;
  for (const r of records) {
    if (r.decision === 'Pending' && r.lodgedDate) {
      const lodged = new Date(r.lodgedDate);
      const daysSinceLodged = Math.round((now.getTime() - lodged.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLodged > 120) stalled++;
    }
  }

  const topSuburbs = Object.entries(bySuburb)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Category→decision flows
  const flows = {};
  for (const r of records) {
    const key = `${r.category}→${r.decision}`;
    flows[key] = (flows[key] || 0) + 1;
  }

  return {
    slug: councilMeta?.slug || '',
    name: councilMeta?.name || '',
    state: councilMeta?.state || '',
    lat: councilMeta?.lat || null,
    lng: councilMeta?.lng || null,
    recordCount: records.length,
    population,
    applicationsPerCapita: population ? Math.round((records.length / population) * 10000) / 10 : null,
    medianProcessingDays: medProcessing !== null ? Math.round(medProcessing) : null,
    avgProcessingDays: avgProcessing,
    approvalRate: decided > 0 ? Math.round((approved / decided) * 1000) / 10 : null,
    rejectionRate: decided > 0 ? Math.round((refused / decided) * 1000) / 10 : null,
    withdrawalRate: decided > 0 ? Math.round((withdrawn / decided) * 1000) / 10 : null,
    stalledCount: stalled,
    stalledRate: pending > 0 ? Math.round((stalled / pending) * 1000) / 10 : null,
    pendingCount: pending,
    approvedCount: approved,
    refusedCount: refused,
    decidedCount: decided,
    byCategory,
    byDecision,
    byMonth,
    topSuburbs,
    flows,
    processingTimes: processingTimes.sort((a, b) => a - b),
  };
}

function buildGlobalAggregates(records) {
  const byCategory = {};
  const bySuburb = {};
  const byMonth = {};
  const byStatus = {};
  const byDecision = {};
  const byCouncil = {};
  const byState = {};
  const processingTimes = [];
  const flows = {};

  for (const r of records) {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    if (r.suburb) bySuburb[r.suburb] = (bySuburb[r.suburb] || 0) + 1;
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    byDecision[r.decision] = (byDecision[r.decision] || 0) + 1;
    byCouncil[r.council] = (byCouncil[r.council] || 0) + 1;
    byState[r.state] = (byState[r.state] || 0) + 1;

    if (r.lodgedDate) {
      const month = r.lodgedDate.slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }

    if (r.processingDays !== null && r.processingDays >= 0 && r.processingDays < 3650) {
      processingTimes.push(r.processingDays);
    }

    const key = `${r.category}→${r.decision}`;
    flows[key] = (flows[key] || 0) + 1;
  }

  return {
    totalRecords: records.length,
    councilCount: Object.keys(byCouncil).length,
    byCategory,
    bySuburb,
    byMonth,
    byStatus,
    byDecision,
    byCouncil,
    byState,
    flows,
    processingTimes: processingTimes.sort((a, b) => a - b),
  };
}

main().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
