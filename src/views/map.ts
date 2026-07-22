// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { CouncilStats } from '../types';
import { formatNumber, categoryColor } from '../utils';
import L from 'leaflet';

let mapInstance: L.Map | null = null;

export function renderMapView(
  container: HTMLElement,
  councils: CouncilStats[],
  onCouncilClick: (slug: string) => void
): void {
  container.innerHTML = `<div id="da-map" class="map-container"></div>`;

  // Clean up previous map
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  const mapEl = document.getElementById('da-map');
  if (!mapEl) return;

  // Determine center and zoom based on data spread
  const hasMultipleStates = new Set(councils.map(c => c.state)).size > 1;
  const center: [number, number] = hasMultipleStates ? [-25.27, 133.77] : [-38.05, 145.30];
  const zoom = hasMultipleStates ? 5 : 10;

  const map = L.map(mapEl, { center, zoom, scrollWheelZoom: true });
  mapInstance = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);

  // Add council-level markers
  const maxCount = Math.max(...councils.map(c => c.recordCount), 1);

  for (const c of councils) {
    if (!c.lat || !c.lng) continue;

    const radius = Math.max(10, Math.min(50, (c.recordCount / maxCount) * 50));

    // Color by approval rate
    const approvalColor = c.approvalRate !== null
      ? c.approvalRate > 85 ? '#16a34a' : c.approvalRate > 70 ? '#d97706' : '#dc2626'
      : '#1e3a5f';

    const circle = L.circleMarker([c.lat, c.lng], {
      radius,
      fillColor: approvalColor,
      fillOpacity: 0.6,
      color: approvalColor,
      weight: 2,
      opacity: 0.8,
    }).addTo(map);

    // Hover tooltip: identify the council + exact headline stats without a click
    circle.bindTooltip(
      `<strong>${c.name}</strong><br>${formatNumber(c.recordCount)} applications${c.approvalRate !== null ? ` · ${c.approvalRate}% approved` : ''}`,
      { direction: 'top', offset: [0, -radius], opacity: 1 }
    );

    // Top categories for popup
    const topCats = Object.entries(c.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cat, count]) => `<span style="display:inline-block;background:${categoryColor(cat)};color:#fff;padding:1px 6px;border-radius:8px;font-size:10px;margin:1px;">${cat}: ${count}</span>`)
      .join(' ');

    circle.bindPopup(`
      <div style="font-family:var(--font-sans);min-width:240px;">
        <strong style="font-size:14px;cursor:pointer;color:#0d9488;" class="council-popup-link" data-slug="${c.slug}">${c.name}</strong>
        <div style="font-size:11px;color:#64748b;margin:2px 0;">${c.state} · Pop. ${c.population ? formatNumber(c.population) : 'N/A'}</div>
        <div style="margin:8px 0;font-size:12px;color:#475569;">
          <div><strong>${formatNumber(c.recordCount)}</strong> applications ${c.applicationsPerCapita !== null ? `(${c.applicationsPerCapita} per 10k pop)` : ''}</div>
          <div style="margin-top:4px;">
            <span style="color:#16a34a;">✓ ${c.approvalRate !== null ? c.approvalRate + '%' : '—'} approved</span> &nbsp;
            <span style="color:#dc2626;">✗ ${c.rejectionRate !== null ? c.rejectionRate + '%' : '—'} refused</span>
          </div>
          <div style="margin-top:4px;">
            Median processing: <strong>${c.medianProcessingDays !== null ? c.medianProcessingDays + ' days' : '—'}</strong>
          </div>
          ${c.stalledCount > 0 ? `<div style="margin-top:4px;color:#dc2626;">${formatNumber(c.stalledCount)} stalled (&gt;120 days)</div>` : ''}
        </div>
        <div style="margin-top:6px;">${topCats}</div>
        <div style="margin-top:8px;"><button class="council-popup-link" data-slug="${c.slug}" style="background:#1e3a5f;color:#fff;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:11px;">View full breakdown →</button></div>
      </div>
    `, { maxWidth: 350 });

    circle.on('popupopen', () => {
      document.querySelectorAll<HTMLElement>('.council-popup-link').forEach(el => {
        el.addEventListener('click', () => {
          const slug = el.dataset.slug;
          if (slug) onCouncilClick(slug);
        });
      });
    });

    // Label for larger councils
    if (c.recordCount > maxCount * 0.1) {
      const label = L.divIcon({
        className: '',
        html: `<div style="font-size:10px;font-weight:600;color:#1e3a5f;text-align:center;white-space:nowrap;text-shadow:0 0 3px #fff,0 0 3px #fff;">${c.name.replace(/^City of /, '')}<br><span style="font-family:var(--font-mono);font-size:9px;">${formatNumber(c.recordCount)}</span></div>`,
        iconSize: [100, 20],
        iconAnchor: [50, -radius - 2],
      });
      L.marker([c.lat, c.lng], { icon: label, interactive: false }).addTo(map);
    }
  }

  // Legend
  const legend = new (L.Control.extend({
    onAdd() {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = `
        <div class="map-legend-title">Council Performance</div>
        <div class="map-legend-item">
          <div class="map-legend-swatch" style="background:#16a34a;border-radius:50%;"></div>
          <span>&gt;85% approval</span>
        </div>
        <div class="map-legend-item">
          <div class="map-legend-swatch" style="background:#d97706;border-radius:50%;"></div>
          <span>70–85% approval</span>
        </div>
        <div class="map-legend-item">
          <div class="map-legend-swatch" style="background:#dc2626;border-radius:50%;"></div>
          <span>&lt;70% approval</span>
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
