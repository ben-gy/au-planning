let tooltipEl: HTMLDivElement | null = null;

function ensureTooltip(): HTMLDivElement {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'chart-tooltip';
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

export function showTooltip(html: string, x: number, y: number): void {
  const el = ensureTooltip();
  el.innerHTML = html;
  el.classList.add('visible');
  // Position with viewport clamping
  const rect = el.getBoundingClientRect();
  const px = Math.min(x + 12, window.innerWidth - rect.width - 8);
  const py = Math.min(y - 8, window.innerHeight - rect.height - 8);
  el.style.left = `${Math.max(4, px)}px`;
  el.style.top = `${Math.max(4, py)}px`;
}

export function hideTooltip(): void {
  if (tooltipEl) tooltipEl.classList.remove('visible');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Attribute-driven hover tooltips: any element with [data-tip] shows its exact
// value in the shared styled tooltip on hover. Reuses showTooltip/hideTooltip.
export function initDataTips(): void {
  let activeTip = '';
  document.addEventListener('mouseover', (e) => {
    const target = (e.target as Element).closest('[data-tip]') as HTMLElement | null;
    if (!target) return;
    const text = target.getAttribute('data-tip') ?? '';
    if (!text) return;
    activeTip = text;
    showTooltip(escapeHtml(text), (e as MouseEvent).clientX, (e as MouseEvent).clientY);
  });
  document.addEventListener('mousemove', (e) => {
    if (!activeTip) return;
    const target = (e.target as Element).closest('[data-tip]') as HTMLElement | null;
    if (!target || target.getAttribute('data-tip') !== activeTip) {
      activeTip = '';
      hideTooltip();
      return;
    }
    showTooltip(escapeHtml(activeTip), (e as MouseEvent).clientX, (e as MouseEvent).clientY);
  });
  document.addEventListener('mouseout', (e) => {
    const target = (e.target as Element).closest('[data-tip]');
    if (target) {
      activeTip = '';
      hideTooltip();
    }
  });
}

// Glossary tooltip (separate element)
let glossaryEl: HTMLDivElement | null = null;

function ensureGlossaryTooltip(): HTMLDivElement {
  if (!glossaryEl) {
    glossaryEl = document.createElement('div');
    glossaryEl.className = 'glossary-tooltip';
    document.body.appendChild(glossaryEl);
  }
  return glossaryEl;
}

export function showGlossaryTooltip(term: string, definition: string, anchor: HTMLElement): void {
  const el = ensureGlossaryTooltip();
  el.innerHTML = `<div class="term-name">${term}</div><div>${definition}</div>`;
  el.classList.add('visible');
  const rect = anchor.getBoundingClientRect();
  const px = rect.left;
  const py = rect.bottom + 6;
  el.style.left = `${Math.max(8, Math.min(px, window.innerWidth - 360))}px`;
  el.style.top = `${py}px`;
}

export function hideGlossaryTooltip(): void {
  if (glossaryEl) glossaryEl.classList.remove('visible');
}

export function initGlossaryLinks(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('glossary-link')) {
      e.preventDefault();
      const term = target.dataset.term || '';
      const def = target.dataset.def || '';
      if (glossaryEl?.classList.contains('visible')) {
        hideGlossaryTooltip();
      } else {
        showGlossaryTooltip(term, def, target);
      }
    } else {
      hideGlossaryTooltip();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideGlossaryTooltip();
  });
}
