import type { DevelopmentApplication } from '../types';
import { formatNumber, categoryColor } from '../utils';
import L from 'leaflet';

// Suburb centroids for City of Casey (approximate lat/lng)
const SUBURB_COORDS: Record<string, [number, number]> = {
  'Berwick': [-38.0333, 145.3500],
  'Clyde': [-38.1300, 145.3600],
  'Clyde North': [-38.1100, 145.3700],
  'Cranbourne': [-38.1000, 145.2833],
  'Cranbourne East': [-38.0950, 145.3100],
  'Cranbourne North': [-38.0700, 145.2900],
  'Cranbourne South': [-38.1300, 145.2800],
  'Cranbourne West': [-38.0950, 145.2500],
  'Devon Meadows': [-38.1600, 145.2900],
  'Doveton': [-37.9900, 145.2300],
  'Endeavour Hills': [-37.9800, 145.2600],
  'Eumemmerring': [-37.9950, 145.2500],
  'Hallam': [-38.0200, 145.2700],
  'Hampton Park': [-38.0400, 145.2600],
  'Harkaway': [-38.0100, 145.3600],
  'Junction Village': [-38.1100, 145.3200],
  'Lynbrook': [-38.0500, 145.2700],
  'Lyndhurst': [-38.0650, 145.2500],
  'Lysterfield South': [-37.9700, 145.3100],
  'Narre Warren': [-38.0200, 145.3000],
  'Narre Warren North': [-37.9900, 145.3200],
  'Narre Warren South': [-38.0400, 145.3100],
  'Officer': [-38.0600, 145.4100],
  'Officer South': [-38.0900, 145.4000],
  'Pearcedale': [-38.2000, 145.2300],
  'Tooradin': [-38.2200, 145.3800],
  'Blind Bight': [-38.2100, 145.3300],
  'Cannons Creek': [-38.2200, 145.3100],
  'Warneet': [-38.2200, 145.3100],
  'Botanic Ridge': [-38.1400, 145.2700],
  'Beaconsfield': [-38.0500, 145.3700],
  'Beaconsfield Upper': [-38.0300, 145.3900],
};

let mapInstance: L.Map | null = null;

export function renderMapView(container: HTMLElement, apps: DevelopmentApplication[]): void {
  // Aggregate by suburb
  const suburbCounts = new Map<string, { total: number; approved: number; refused: number; pending: number; categories: Record<string, number> }>();
  for (const a of apps) {
    if (!a.suburb) continue;
    let s = suburbCounts.get(a.suburb);
    if (!s) {
      s = { total: 0, approved: 0, refused: 0, pending: 0, categories: {} };
      suburbCounts.set(a.suburb, s);
    }
    s.total++;
    if (a.decision === 'Approved') s.approved++;
    else if (a.decision === 'Refused') s.refused++;
    else if (a.decision === 'Pending') s.pending++;
    s.categories[a.category] = (s.categories[a.category] || 0) + 1;
  }

  container.innerHTML = `
    <div style="position:relative;height:100%;min-height:500px;">
      <div id="da-map" class="map-container"></div>
    </div>
  `;

  // Clean up previous map
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  const mapEl = document.getElementById('da-map');
  if (!mapEl) return;

  const map = L.map(mapEl, {
    center: [-38.05, 145.30],
    zoom: 11,
    scrollWheelZoom: true,
  });

  mapInstance = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);

  // Add suburb markers
  const maxCount = Math.max(...[...suburbCounts.values()].map(s => s.total));

  for (const [suburb, stats] of suburbCounts) {
    const coords = SUBURB_COORDS[suburb];
    if (!coords) continue;

    const radius = Math.max(8, Math.min(35, (stats.total / maxCount) * 35));
    const approvalRate = stats.approved + stats.refused > 0
      ? ((stats.approved / (stats.approved + stats.refused)) * 100).toFixed(0)
      : '—';

    // Top categories
    const topCats = Object.entries(stats.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, count]) => `<span style="display:inline-block;background:${categoryColor(cat)};color:#fff;padding:1px 6px;border-radius:8px;font-size:10px;margin:1px;">${cat}: ${count}</span>`)
      .join(' ');

    const circle = L.circleMarker(coords, {
      radius,
      fillColor: '#1e3a5f',
      fillOpacity: 0.6,
      color: '#1e3a5f',
      weight: 2,
      opacity: 0.8,
    }).addTo(map);

    circle.bindPopup(`
      <div style="font-family:var(--font-sans);min-width:200px;">
        <strong style="font-size:14px;">${suburb}</strong>
        <div style="margin:6px 0;font-size:12px;color:#475569;">
          <div><strong>${formatNumber(stats.total)}</strong> applications</div>
          <div style="margin-top:4px;">
            <span style="color:#16a34a;">✓ ${formatNumber(stats.approved)} approved</span> &nbsp;
            <span style="color:#dc2626;">✗ ${formatNumber(stats.refused)} refused</span> &nbsp;
            <span style="color:#0284c7;">⏳ ${formatNumber(stats.pending)} pending</span>
          </div>
          <div style="margin-top:4px;">Approval rate: <strong>${approvalRate}%</strong></div>
        </div>
        <div style="margin-top:6px;">${topCats}</div>
      </div>
    `, { maxWidth: 300 });

    // Label
    if (stats.total > 50) {
      const label = L.divIcon({
        className: '',
        html: `<div style="font-size:10px;font-weight:600;color:#1e3a5f;text-align:center;white-space:nowrap;text-shadow:0 0 3px #fff,0 0 3px #fff;">${suburb}<br><span style="font-family:var(--font-mono);font-size:9px;">${formatNumber(stats.total)}</span></div>`,
        iconSize: [80, 20],
        iconAnchor: [40, -radius - 2],
      });
      L.marker(coords, { icon: label, interactive: false }).addTo(map);
    }
  }

  // Legend
  const legend = new (L.Control.extend({
    onAdd() {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = `
        <div class="map-legend-title">Application Density</div>
        <div class="map-legend-item">
          <div class="map-legend-swatch" style="background:#1e3a5f;border-radius:50%;width:24px;height:24px;opacity:0.6;"></div>
          <span>High volume</span>
        </div>
        <div class="map-legend-item">
          <div class="map-legend-swatch" style="background:#1e3a5f;border-radius:50%;width:12px;height:12px;opacity:0.6;"></div>
          <span>Low volume</span>
        </div>
        <div style="margin-top:6px;font-size:10px;color:#94a3b8;">Circle size = total applications</div>
      `;
      return div;
    },
  }))({ position: 'bottomright' });
  legend.addTo(map);

  // Force resize
  setTimeout(() => map.invalidateSize(), 100);
}

export function destroyMap(): void {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
}
