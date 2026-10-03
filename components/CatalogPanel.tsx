'use client';
import { useMemo, useState } from 'react';
import { CATALOG, CATEGORY_LABEL } from '@/lib/catalog';
import { DND_MIME, useStore } from '@/lib/store';
import type { CatalogItem, Category } from '@/lib/types';

const ORDER: Category[] = ['base', 'wall', 'tall', 'appliance', 'furniture', 'opening'];

function Thumb({ c }: { c: CatalogItem }) {
  // front elevation thumbnail, scaled to fit 44x44
  const k = 40 / Math.max(c.w, c.h, 600);
  const w = Math.max(6, c.w * k), h = Math.max(4, c.h * k);
  const doors = c.category === 'base' || c.category === 'wall' || c.category === 'tall' ? (c.w >= 500 ? 2 : 1) : 0;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <rect x={(44 - w) / 2} y={42 - h} width={w} height={h} rx="1.5" fill={c.color} stroke="rgba(29,37,40,.55)" strokeWidth="1" />
      {doors === 2 && <line x1={22} x2={22} y1={42 - h} y2={42} stroke="rgba(29,37,40,.45)" />}
      {c.hasCounter && <rect x={(44 - w) / 2 - 1} y={42 - h - 2} width={w + 2} height="2" fill="#B9B3A8" />}
    </svg>
  );
}

export default function CatalogPanel() {
  const [q, setQ] = useState('');
  const addItem = useStore((s) => s.addItem);
  const groups = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = t ? CATALOG.filter((c) => (c.name + ' ' + c.description).toLowerCase().includes(t)) : CATALOG;
    return ORDER.map((cat) => ({ cat, items: list.filter((c) => c.category === cat) })).filter((g) => g.items.length);
  }, [q]);

  return (
    <aside className="catalog" aria-label="Components">
      <div className="panel-head">
        <h2>Components</h2>
        <p>Drag onto the plan or 3D view, or press Add.</p>
        <input className="search" type="search" placeholder="Search cabinets, appliances…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search components" />
      </div>
      <div className="catalog-scroll">
        {groups.map((g) => (
          <section key={g.cat}>
            <h3>{CATEGORY_LABEL[g.cat]}</h3>
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
          </section>
        ))}
        {!groups.length && <p className="empty">Nothing matches “{q}”. Try “cabinet”, “sofa” or “window”.</p>}
      </div>
    </aside>
  );
}
