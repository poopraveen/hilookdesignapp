'use client';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { estimate, inr } from '@/lib/pricing';
import { startAutosave, useStore, type ViewMode } from '@/lib/store';
import CatalogPanel from './CatalogPanel';
import PlanCanvas from './PlanCanvas';
import { EstimatePanel, Inspector, RatesPanel, RoomPanel } from './SidePanels';

const Scene3D = dynamic(() => import('./Scene3D'), { ssr: false, loading: () => <div className="scene loading">Loading 3D…</div> });

type Tab = 'item' | 'estimate' | 'rates' | 'room';

export default function Planner() {
  const design = useStore((s) => s.design);
  const view = useStore((s) => s.view);
  const selectedId = useStore((s) => s.selectedId);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const { setView, undo, redo, setName } = useStore.getState();
  const [tab, setTab] = useState<Tab>('item');
  const total = useMemo(() => estimate(design).total, [design]);

  useEffect(() => startAutosave(), []);
  useEffect(() => { if (selectedId) setTab('item'); }, [selectedId]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return;
      const s = useStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) s.redo(); else s.undo(); return; }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); s.redo(); return; }
      const id = s.selectedId;
      if (!id) return;
      const it = s.design.items.find((i) => i.id === id);
      if (!it) return;
      if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); s.duplicate(id); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); s.removeItem(id); return; }
      if (e.key === 'Escape') { s.select(null); return; }
      if (it.locked) return;
      if (e.key.toLowerCase() === 'r') { s.rotate(id, e.shiftKey ? -90 : 90); return; }
      const step = e.shiftKey ? 100 : 10;
      const nudge: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (nudge[e.key]) {
        e.preventDefault();
        s.checkpoint();
        s.updateItem(id, { x: it.x + nudge[e.key][0], y: it.y + nudge[e.key][1] });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const views: { id: ViewMode; label: string }[] = [
    { id: '2d', label: 'Plan' }, { id: 'split', label: 'Plan + 3D' }, { id: '3d', label: '3D' },
  ];
  const tabs: { id: Tab; label: string }[] = [
    { id: 'item', label: 'Item' }, { id: 'estimate', label: 'Estimate' }, { id: 'rates', label: 'Rates' }, { id: 'room', label: 'Room' },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <rect x="2" y="2" width="22" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M2 10h9V2M11 10v14" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>HiLook Design</span>
        </div>
        <input className="project" value={design.name} onChange={(e) => setName(e.target.value)} aria-label="Project name" />
        <div className="seg" role="group" aria-label="History">
          <button type="button" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">Undo</button>
          <button type="button" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">Redo</button>
        </div>
        <div className="seg" role="radiogroup" aria-label="View">
          {views.map((v) => (
            <button key={v.id} type="button" role="radio" aria-checked={view === v.id} className={view === v.id ? 'on' : ''} onClick={() => setView(v.id)}>{v.label}</button>
          ))}
        </div>
        <button type="button" className="total" onClick={() => setTab('estimate')} title="Open the estimate">
          <span>Estimate</span>
          <strong>{inr(total)}</strong>
        </button>
      </header>

      <div className="body">
        <CatalogPanel />
        <main className={`views v-${view}`}>
          {view !== '3d' && <PlanCanvas />}
          {view !== '2d' && <Scene3D />}
        </main>
        <aside className="side">
          <div className="tabs" role="tablist">
            {tabs.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>
          {tab === 'item' && <Inspector />}
          {tab === 'estimate' && <EstimatePanel />}
          {tab === 'rates' && <RatesPanel />}
          {tab === 'room' && <RoomPanel />}
        </aside>
      </div>
    </div>
  );
}
