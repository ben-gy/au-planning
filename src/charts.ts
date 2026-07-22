// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import { formatNumber, categoryColor } from './utils';
import { showTooltip, hideTooltip } from './tooltip';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** Horizontal bar chart */
export function renderHorizontalBars(
  container: HTMLElement,
  data: [string, number][],
  opts: {
    width?: number;
    barHeight?: number;
    colorFn?: (label: string) => string;
    maxBars?: number;
    onClick?: (label: string) => void;
  } = {}
): void {
  const {
    width = container.clientWidth || 600,
    barHeight = 28,
    colorFn = categoryColor,
    maxBars = 20,
    onClick,
  } = opts;

  const items = data.slice(0, maxBars);
  if (items.length === 0) {
    container.innerHTML = '<div class="loading">No data</div>';
    return;
  }

  const labelWidth = 140;
  const valueWidth = 70;
  const chartWidth = width - labelWidth - valueWidth - 20;
  const maxVal = Math.max(...items.map(d => d[1]));
  const height = items.length * barHeight + 4;

  const svg = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}` });
  svg.style.display = 'block';

  items.forEach(([label, value], i) => {
    const y = i * barHeight + 2;
    const barW = maxVal > 0 ? (value / maxVal) * chartWidth : 0;

    // Label
    const text = svgEl('text', {
      x: labelWidth - 8,
      y: y + barHeight / 2 + 4,
      'text-anchor': 'end',
      class: 'bar-label',
    });
    text.textContent = label.length > 18 ? label.slice(0, 17) + '…' : label;
    svg.appendChild(text);

    // Bar
    const rect = svgEl('rect', {
      x: labelWidth,
      y: y + 4,
      width: Math.max(barW, 2),
      height: barHeight - 8,
      rx: 3,
      fill: colorFn(label),
      class: 'bar-rect',
    });

    rect.addEventListener('mouseenter', (e) => {
      showTooltip(`<strong>${label}</strong><br>${formatNumber(value)} applications`, (e as MouseEvent).clientX, (e as MouseEvent).clientY);
    });
    rect.addEventListener('mouseleave', hideTooltip);

    if (onClick) {
      rect.style.cursor = 'pointer';
      rect.addEventListener('click', () => onClick(label));
    }

    svg.appendChild(rect);

    // Value
    const valText = svgEl('text', {
      x: labelWidth + Math.max(barW, 2) + 8,
      y: y + barHeight / 2 + 4,
      class: 'bar-value',
    });
    valText.textContent = formatNumber(value);
    svg.appendChild(valText);
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

/** Timeline bar chart (monthly) */
export function renderTimeline(
  container: HTMLElement,
  data: [string, number][],
  opts: {
    width?: number;
    height?: number;
    colorFn?: (month: string) => string;
  } = {}
): void {
  const {
    width = container.clientWidth || 800,
    height = 300,
    colorFn = () => 'var(--accent-secondary)',
  } = opts;

  if (data.length === 0) {
    container.innerHTML = '<div class="loading">No data</div>';
    return;
  }

  const sorted = [...data].sort((a, b) => a[0].localeCompare(b[0]));
  const padLeft = 50;
  const padRight = 10;
  const padTop = 10;
  const padBottom = 50;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const maxVal = Math.max(...sorted.map(d => d[1]));
  const barW = Math.max(chartW / sorted.length - 2, 3);

  const svg = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}` });
  svg.style.display = 'block';

  // Y axis gridlines
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const val = Math.round((maxVal / yTicks) * i);
    const y = padTop + chartH - (val / maxVal) * chartH;
    const line = svgEl('line', {
      x1: padLeft, y1: y, x2: width - padRight, y2: y,
      stroke: '#e2e8f0', 'stroke-width': 1,
    });
    svg.appendChild(line);
    const label = svgEl('text', {
      x: padLeft - 8, y: y + 4, 'text-anchor': 'end',
      fill: '#94a3b8', 'font-size': '10', 'font-family': 'var(--font-mono)',
    });
    label.textContent = formatNumber(val);
    svg.appendChild(label);
  }

  // Bars
  sorted.forEach(([month, value], i) => {
    const x = padLeft + (i / sorted.length) * chartW + 1;
    const barH = maxVal > 0 ? (value / maxVal) * chartH : 0;
    const y = padTop + chartH - barH;

    const rect = svgEl('rect', {
      x, y, width: barW, height: barH, rx: 2,
      fill: colorFn(month),
      class: 'bar-rect',
    });

    rect.addEventListener('mouseenter', (e) => {
      showTooltip(`<strong>${month}</strong><br>${formatNumber(value)} applications`, (e as MouseEvent).clientX, (e as MouseEvent).clientY);
    });
    rect.addEventListener('mouseleave', hideTooltip);

    svg.appendChild(rect);

    // X labels (every 3rd month)
    if (i % 3 === 0) {
      const label = svgEl('text', {
        x: x + barW / 2, y: height - padBottom + 16,
        'text-anchor': 'middle', fill: '#94a3b8', 'font-size': '10',
        'font-family': 'var(--font-mono)',
      });
      label.textContent = month.slice(2); // "24-01"
      svg.appendChild(label);
    }
  });

  container.innerHTML = '';
  container.appendChild(svg);
}

/** Sankey / flow diagram */
export function renderSankey(
  container: HTMLElement,
  flows: Record<string, number>,
  opts: { width?: number; height?: number } = {}
): void {
  const { width = container.clientWidth || 800, height = 500 } = opts;

  // Parse flows into left (category) → right (decision)
  const leftNodes = new Map<string, number>();
  const rightNodes = new Map<string, number>();
  const links: { from: string; to: string; value: number }[] = [];

  for (const [key, value] of Object.entries(flows)) {
    const [from, to] = key.split('→');
    if (!from || !to) continue;
    leftNodes.set(from, (leftNodes.get(from) || 0) + value);
    rightNodes.set(to, (rightNodes.get(to) || 0) + value);
    links.push({ from, to, value });
  }

  // Sort by value
  const leftSorted = [...leftNodes.entries()].sort((a, b) => b[1] - a[1]);
  const rightSorted = [...rightNodes.entries()].sort((a, b) => b[1] - a[1]);

  const padLeft = 140;
  const padRight = 120;
  const padY = 20;
  const nodeWidth = 18;
  const chartH = height - padY * 2;
  const totalLeft = leftSorted.reduce((s, d) => s + d[1], 0);
  const totalRight = rightSorted.reduce((s, d) => s + d[1], 0);
  const total = Math.max(totalLeft, totalRight);
  const gap = 4;

  // Position nodes
  const leftPositions = new Map<string, { y: number; h: number }>();
  let ly = padY;
  for (const [name, val] of leftSorted) {
    const h = Math.max((val / total) * (chartH - gap * leftSorted.length), 4);
    leftPositions.set(name, { y: ly, h });
    ly += h + gap;
  }

  const rightPositions = new Map<string, { y: number; h: number }>();
  let ry = padY;
  for (const [name, val] of rightSorted) {
    const h = Math.max((val / total) * (chartH - gap * rightSorted.length), 4);
    rightPositions.set(name, { y: ry, h });
    ry += h + gap;
  }

  const svg = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}` });
  svg.style.display = 'block';

  const decisionColors: Record<string, string> = {
    'Approved': '#16a34a',
    'Refused': '#dc2626',
    'Withdrawn': '#d97706',
    'Pending': '#0284c7',
    'No Permit Required': '#94a3b8',
    'Unknown': '#94a3b8',
  };

  // Track offsets for stacking links within nodes
  const leftOffsets = new Map<string, number>();
  const rightOffsets = new Map<string, number>();
  for (const [name, pos] of leftPositions) leftOffsets.set(name, pos.y);
  for (const [name, pos] of rightPositions) rightOffsets.set(name, pos.y);

  // Sort links for consistent rendering
  const sortedLinks = [...links].sort((a, b) => b.value - a.value);

  // Draw links
  for (const link of sortedLinks) {
    const lp = leftPositions.get(link.from);
    const rp = rightPositions.get(link.to);
    if (!lp || !rp) continue;

    const lTotal = leftNodes.get(link.from) || 1;
    const rTotal = rightNodes.get(link.to) || 1;
    const lh = (link.value / lTotal) * lp.h;
    const rh = (link.value / rTotal) * rp.h;

    const ly0 = leftOffsets.get(link.from) || 0;
    const ry0 = rightOffsets.get(link.to) || 0;

    leftOffsets.set(link.from, ly0 + lh);
    rightOffsets.set(link.to, ry0 + rh);

    const x0 = padLeft + nodeWidth;
    const x1 = width - padRight;
    const mx = (x0 + x1) / 2;

    const path = svgEl('path', {
      d: `M${x0},${ly0} C${mx},${ly0} ${mx},${ry0} ${x1},${ry0} L${x1},${ry0 + rh} C${mx},${ry0 + rh} ${mx},${ly0 + lh} ${x0},${ly0 + lh} Z`,
      fill: decisionColors[link.to] || '#94a3b8',
      opacity: 0.35,
      class: 'bar-rect',
    });

    path.addEventListener('mouseenter', (e) => {
      path.setAttribute('opacity', '0.6');
      showTooltip(
        `<strong>${link.from} → ${link.to}</strong><br>${formatNumber(link.value)} applications`,
        (e as MouseEvent).clientX, (e as MouseEvent).clientY
      );
    });
    path.addEventListener('mouseleave', () => {
      path.setAttribute('opacity', '0.35');
      hideTooltip();
    });

    svg.appendChild(path);
  }

  // Draw left nodes
  for (const [name, pos] of leftPositions) {
    const rect = svgEl('rect', {
      x: padLeft, y: pos.y, width: nodeWidth, height: pos.h,
      fill: categoryColor(name), rx: 3,
    });
    svg.appendChild(rect);

    const label = svgEl('text', {
      x: padLeft - 6, y: pos.y + pos.h / 2 + 4,
      'text-anchor': 'end', 'font-size': '11',
      fill: '#0f172a', 'font-family': 'var(--font-sans)',
    });
    label.textContent = name.length > 16 ? name.slice(0, 15) + '…' : name;
    svg.appendChild(label);
  }

  // Draw right nodes
  for (const [name, pos] of rightPositions) {
    const rect = svgEl('rect', {
      x: width - padRight, y: pos.y, width: nodeWidth, height: pos.h,
      fill: decisionColors[name] || '#94a3b8', rx: 3,
    });
    svg.appendChild(rect);

    const label = svgEl('text', {
      x: width - padRight + nodeWidth + 6, y: pos.y + pos.h / 2 + 4,
      'text-anchor': 'start', 'font-size': '11',
      fill: '#0f172a', 'font-family': 'var(--font-sans)',
    });
    label.textContent = name;
    svg.appendChild(label);
  }

  container.innerHTML = '';
  container.appendChild(svg);
}

/** Histogram */
export function renderHistogram(
  container: HTMLElement,
  values: number[],
  opts: {
    width?: number;
    height?: number;
    bins?: number;
    color?: string;
    xLabel?: string;
  } = {}
): void {
  const {
    width = container.clientWidth || 600,
    height = 300,
    bins = 20,
    color = 'var(--accent-secondary)',
    xLabel = 'Days',
  } = opts;

  if (values.length === 0) {
    container.innerHTML = '<div class="loading">No data</div>';
    return;
  }

  // Cap outliers at 95th percentile for display
  const sorted = [...values].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const maxVal = Math.min(p95 * 1.1, sorted[sorted.length - 1]);
  const binWidth = maxVal / bins;

  const buckets = new Array(bins).fill(0);
  for (const v of values) {
    const idx = Math.min(Math.floor(v / binWidth), bins - 1);
    if (idx >= 0) buckets[idx]++;
  }

  const padLeft = 50;
  const padRight = 10;
  const padTop = 10;
  const padBottom = 50;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const maxCount = Math.max(...buckets);
  const barW = chartW / bins - 2;

  const svg = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}` });
  svg.style.display = 'block';

  // Y gridlines
  for (let i = 0; i <= 4; i++) {
    const val = Math.round((maxCount / 4) * i);
    const y = padTop + chartH - (val / maxCount) * chartH;
    const line = svgEl('line', {
      x1: padLeft, y1: y, x2: width - padRight, y2: y,
      stroke: '#e2e8f0', 'stroke-width': 1,
    });
    svg.appendChild(line);
    const label = svgEl('text', {
      x: padLeft - 8, y: y + 4, 'text-anchor': 'end',
      fill: '#94a3b8', 'font-size': '10', 'font-family': 'var(--font-mono)',
    });
    label.textContent = formatNumber(val);
    svg.appendChild(label);
  }

  // Bars
  buckets.forEach((count, i) => {
    const x = padLeft + (i / bins) * chartW + 1;
    const barH = maxCount > 0 ? (count / maxCount) * chartH : 0;
    const y = padTop + chartH - barH;

    const rect = svgEl('rect', {
      x, y, width: barW, height: barH, fill: color, rx: 2, class: 'bar-rect',
    });

    const lo = Math.round(i * binWidth);
    const hi = Math.round((i + 1) * binWidth);
    rect.addEventListener('mouseenter', (e) => {
      showTooltip(
        `<strong>${lo}–${hi} ${xLabel}</strong><br>${formatNumber(count)} applications`,
        (e as MouseEvent).clientX, (e as MouseEvent).clientY
      );
    });
    rect.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(rect);

    // X label (every few bins)
    if (i % Math.max(1, Math.floor(bins / 8)) === 0) {
      const label = svgEl('text', {
        x: x + barW / 2, y: height - padBottom + 16,
        'text-anchor': 'middle', fill: '#94a3b8', 'font-size': '10',
        'font-family': 'var(--font-mono)',
      });
      label.textContent = String(lo);
      svg.appendChild(label);
    }
  });

  // X axis label
  const xLabelEl = svgEl('text', {
    x: padLeft + chartW / 2, y: height - 4,
    'text-anchor': 'middle', fill: '#64748b', 'font-size': '11',
    'font-family': 'var(--font-sans)',
  });
  xLabelEl.textContent = xLabel;
  svg.appendChild(xLabelEl);

  container.innerHTML = '';
  container.appendChild(svg);
}
