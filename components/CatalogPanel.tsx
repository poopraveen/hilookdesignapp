'use client';
import { useMemo, useState } from 'react';
import { CATALOG, CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/catalog';
import { DND_MIME, useStore } from '@/lib/store';
import type { CatalogItem, Category } from '@/lib/types';

/** Small front-view thumbnail, drawn from the item's size, colour and style. */
function Thumb({ c }: { c: CatalogItem }) {
  const k = 38 / Math.max(c.w, c.h, 600);
  const w = Math.max(6, c.w * k), h = Math.max(3, c.h * k);
  const x = (44 - w) / 2, y = 42 - h;
  const ink = 'rgba(29,37,40,.55)';
  const cols = c.layout?.rows ? 0 : (c.layout?.cols ?? 0);
  const rows = c.layout?.rows?.length ?? 0;
  const round = c.model === 'plant' || c.model === 'pouf' || c.model === 'beanbag' || c.variant?.startsWith('round');
  if (c.model === 'sofa' || c.model === 'lsofa') {
    const sh = Math.max(10, h);
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <rect x={x} y={42 - sh} width={w} height={sh * 0.55} rx="2" fill={c.color} stroke={ink} />
        <rect x={x} y={42 - sh * 0.5} width={w} height={sh * 0.42} rx="2" fill={c.color} stroke={ink} />
        <rect x={x - 1} y={42 - sh * 0.6} width="4" height={sh * 0.55} rx="1.5" fill={c.color} stroke={ink} />
        <rect x={x + w - 3} y={42 - sh * 0.6} width="4" height={sh * 0.55} rx="1.5" fill={c.color} stroke={ink} />
      </svg>
    );
  }
  if (c.model === 'bed' || c.model === 'bunk') {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <rect x={x} y={20} width={w} height={14} rx="1.5" fill={c.color} stroke={ink} />
        <rect x={x + 1} y={30} width={w - 2} height={6} fill="#F4F2EE" stroke={ink} />
        <rect x={x} y={36} width={w} height={6} fill={c.color} stroke={ink} />
        {c.model === 'bunk' && <rect x={x} y={8} width={w} height={6} fill="#9DB4C0" stroke={ink} />}
      </svg>
    );
  }
  if (c.model === 'table' || c.model === 'chair' || c.model === 'stool') {
    const th = Math.max(14, h);
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <rect x={x} y={42 - th} width={w} height="3" fill={c.color} stroke={ink} />
        <rect x={x + 1} y={42 - th + 3} width="2" height={th - 3} fill={c.color} />
        <rect x={x + w - 3} y={42 - th + 3} width="2" height={th - 3} fill={c.color} />
        {c.model === 'chair' && <rect x={x + 1} y={42 - th - 10} width="2.5" height="11" fill={c.color} />}
      </svg>
    );
  }
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      {round
        ? <ellipse cx="22" cy={42 - h / 2} rx={w / 2} ry={h / 2} fill={c.model === 'plant' ? '#4E7A4A' : c.color} stroke={ink} />
        : <rect x={x} y={y} width={w} height={h} rx="1.5" fill={c.color} stroke={ink} />}
      {cols > 1 && Array.from({ length: cols - 1 }).map((_, i) => <line key={i} x1={x + (w * (i + 1)) / cols} x2={x + (w * (i + 1)) / cols} y1={y} y2={42} stroke={ink} />)}
      {rows > 1 && Array.from({ length: rows - 1 }).map((_, i) => <line key={i} x1={x} x2={x + w} y1={y + (h * (i + 1)) / rows} y2={y + (h * (i + 1)) / rows} stroke={ink} />)}
      {c.hasCounter && <rect x={x - 1} y={y - 2} width={w + 2} height="2" fill="#B9B3A8" />}
      {c.layout?.extra === 'glass' && <rect x={x + 2} y={y + 2} width={w - 4} height={Math.max(2, h * 0.5 - 4)} fill="#DCE6E6" stroke={ink} strokeWidth=".6" />}
    </svg>
  );
}

export default function CatalogPanel() {
  const [q, setQ] = useState('');
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const addItem = useStore((s) => s.addItem);
  const roomType = useStore((s) => s.design.type ?? 'other');

  const order = CATEGORY_ORDER[roomType];
  const groups = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = t ? CATALOG.filter((c) => (c.name + ' ' + c.description + ' ' + CATEGORY_LABEL[c.category]).toLowerCase().includes(t)) : CATALOG;
    return order.map((cat) => ({ cat, items: list.filter((c) => c.category === cat) })).filter((g) => g.items.length);
  }, [q, order]);

  // Categories that matter for this room start open; the rest start folded.
  const relevant: Category[] = order.slice(0, roomType === 'kitchen' ? 4 : 3);
  const isOpen = (cat: Category) => (q ? true : closed[cat] === undefined ? relevant.includes(cat) : !closed[cat]);

  return (
    <aside className="catalog" aria-label="Components">
      <div className="panel-head">
        <h2>Components <span className="count">{CATALOG.length}</span></h2>
        <p>Drag onto the plan or 3D view, or press Add.</p>
        <input className="search" type="search" placeholder="Search sofa, wardrobe, hob…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search components" />
      </div>
      <div className="catalog-scroll">
        {groups.map((g) => (
          <section key={g.cat}>
            <button type="button" className="cat-group" aria-expanded={isOpen(g.cat)} onClick={() => setClosed((c) => ({ ...c, [g.cat]: isOpen(g.cat) }))}>
              <span>{CATEGORY_LABEL[g.cat]}</span>
              <span className="n">{g.items.length}</span>
            </button>
            {isOpen(g.cat) && (
              <ul>
                {g.items.map((c) => (
                  <li
                    key={c.kind}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData(DND_MIME, c.kind); e.dataTransfer.effectAllowed = 'copy'; }}
                    className="cat-item"
                    title={c.description}
                  >
                    <Thumb c={c} />
                    <div className="cat-text">
                      <span className="cat-name">{c.name}</span>
                      <span className="cat-size">{c.w} × {c.d} × {c.h}</span>
                    </div>
                    <button type="button" className="add" onClick={() => addItem(c.kind)} aria-label={`Add ${c.name}`}>Add</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
        {!groups.length && <p className="empty">Nothing matches “{q}”. Try “sofa”, “wardrobe” or “window”.</p>}
      </div>
    </aside>
  );
}
