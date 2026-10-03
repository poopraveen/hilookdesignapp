'use client';
import { useMemo, useRef } from 'react';
import { catalogByKind, DEFAULT_RATES, FINISH_IDS, SWATCHES } from '@/lib/catalog';
import { findCollisions, mmToFtIn, outOfRoom } from '@/lib/geometry';
import { estimate, inr } from '@/lib/pricing';
import { emptyRoom, kitchen7x10 } from '@/lib/presets';
import { useStore } from '@/lib/store';
import type { Design, FinishId, Item } from '@/lib/types';

function Num({ label, value, onChange, min, max, step = 10, suffix = 'mm', disabled }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string; disabled?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="num">
        <input
          type="number" value={Math.round(value)} min={min} max={max} step={step} disabled={disabled}
          onChange={(e) => { const v = Number(e.target.value); if (!Number.isNaN(v)) onChange(v); }}
        />
        <em>{suffix}</em>
      </div>
      {suffix === 'mm' && <small>{mmToFtIn(value)}</small>}
    </label>
  );
}

// ------------------------------------------------------------------ Inspector
export function Inspector() {
  const design = useStore((s) => s.design);
  const selectedId = useStore((s) => s.selectedId);
  const { updateItem, rotate, duplicate, removeItem, checkpoint } = useStore.getState();
  const it = design.items.find((i) => i.id === selectedId);
  const est = useMemo(() => estimate(design), [design]);
  const collisions = useMemo(() => findCollisions(design.items), [design.items]);

  if (!it) {
    const count = design.items.filter((i) => i.kind !== 'door' && i.kind !== 'window').length;
    return (
      <div className="tab-body">
        <div className="empty-state">
          <h3>Nothing selected</h3>
          <p>Click a unit on the plan or in 3D to change its size, colour and finish. {count} components in this design.</p>
          <ul className="keys">
            <li><kbd>R</kbd> rotate</li>
            <li><kbd>Del</kbd> delete</li>
            <li><kbd>Ctrl</kbd>+<kbd>D</kbd> duplicate</li>
            <li><kbd>Ctrl</kbd>+<kbd>Z</kbd> undo</li>
            <li>Arrow keys nudge 10 mm, with <kbd>Shift</kbd> 100 mm</li>
          </ul>
        </div>
      </div>
    );
  }

  const cat = catalogByKind[it.kind];
  const lines = est.lines.filter((l) => l.itemId === it.id);
  const itemCost = lines.reduce((s, l) => s + l.amount, 0);
  const set = (p: Partial<Item>) => { checkpoint(); updateItem(it.id, p); };
  const opening = cat.category === 'opening';

  return (
    <div className="tab-body">
      <div className="insp-head">
        <input className="insp-name" value={it.name} onChange={(e) => updateItem(it.id, { name: e.target.value })} aria-label="Item name" />
        <p className="insp-desc">{cat.description}</p>
        <p className="insp-cost">{inr(itemCost)} <span>for this item</span></p>
        {collisions.has(it.id) && <p className="warn">Overlaps another item at the same height. Move it or change its size.</p>}
        {!opening && outOfRoom(it, design.room) && <p className="warn">Part of this item is outside the room.</p>}
      </div>

      <fieldset>
        <legend>Size</legend>
        <div className="grid2">
          <Num label="Width" value={it.w} min={cat.minW ?? 100} max={cat.maxW ?? 4000} onChange={(v) => set({ w: v })} disabled={it.locked} />
          <Num label="Depth" value={it.d} min={50} max={3000} onChange={(v) => set({ d: v })} disabled={it.locked || opening} />
          <Num label="Height" value={it.h} min={5} max={3000} onChange={(v) => set({ h: v })} disabled={it.locked} />
          <Num label="From floor" value={it.elevation} min={0} max={3000} onChange={(v) => set({ elevation: v })} disabled={it.locked} />
        </div>
      </fieldset>

      {!opening && (
        <fieldset>
          <legend>Position</legend>
          <div className="grid2">
            <Num label="X (from left wall)" value={it.x} onChange={(v) => set({ x: v })} disabled={it.locked} />
            <Num label="Y (from top wall)" value={it.y} onChange={(v) => set({ y: v })} disabled={it.locked} />
          </div>
          <div className="btn-row">
            <button type="button" onClick={() => rotate(it.id, -90)} disabled={it.locked}>Rotate left</button>
            <button type="button" onClick={() => rotate(it.id, 90)} disabled={it.locked}>Rotate right</button>
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend>Colour</legend>
        <div className="swatches">
          {SWATCHES.map((c) => (
            <button
              key={c} type="button" className={`sw ${it.color.toLowerCase() === c.toLowerCase() ? 'on' : ''}`}
              style={{ background: c }} onClick={() => set({ color: c })} aria-label={`Colour ${c}`}
            />
          ))}
          <label className="sw custom" title="Pick any colour">
            <input type="color" value={it.color} onChange={(e) => updateItem(it.id, { color: e.target.value })} aria-label="Custom colour" />
          </label>
        </div>
      </fieldset>

      {it.finish && (
        <fieldset>
          <legend>Material & finish</legend>
          <select value={it.finish} onChange={(e) => set({ finish: e.target.value as FinishId })}>
            {FINISH_IDS.map((f) => (
              <option key={f} value={f}>{design.rates.finish[f].label} — {inr(design.rates.finish[f].perSqft)}/sq ft</option>
            ))}
          </select>
        </fieldset>
      )}

      {lines.length > 0 && (
        <fieldset>
          <legend>Cost breakdown</legend>
          <table className="mini">
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}><td>{l.label.split(' — ')[0]}</td><td>{l.qty} {l.unit} × {inr(l.rate)}</td><td>{inr(l.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        </fieldset>
      )}

      <div className="btn-row">
        <button type="button" onClick={() => set({ locked: !it.locked })}>{it.locked ? 'Unlock' : 'Lock'}</button>
        <button type="button" onClick={() => duplicate(it.id)}>Duplicate</button>
        <button type="button" className="danger" onClick={() => removeItem(it.id)}>Delete</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Estimate
export function EstimatePanel() {
  const design = useStore((s) => s.design);
  const setSettings = useStore((s) => s.setSettings);
  const est = useMemo(() => estimate(design), [design]);
  const groups = Object.keys(est.byGroup);

  const exportCsv = () => {
    const rows = [['Group', 'Item', 'Qty', 'Unit', 'Rate (INR)', 'Amount (INR)']];
    for (const l of est.lines) rows.push([l.group, l.label, String(l.qty), l.unit, String(l.rate), String(l.amount)]);
    rows.push([], ['', 'Subtotal', '', '', '', String(est.subtotal)], ['', `Installation ${design.rates.installationPct}%`, '', '', '', String(est.installation)]);
    if (design.settings.gst) rows.push(['', `GST ${design.rates.gstPct}%`, '', '', '', String(est.gst)]);
    rows.push(['', 'Total', '', '', '', String(est.total)]);
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    download(new Blob([csv], { type: 'text/csv' }), `${slug(design.name)}-estimate.csv`);
  };

  return (
    <div className="tab-body">
      <div className="est-total">
        <span>Estimated total</span>
        <strong>{inr(est.total)}</strong>
        <small>{design.settings.gst ? `incl. ${design.rates.gstPct}% GST` : 'GST not included'} · sample rates, edit them in Rates</small>
      </div>

      <fieldset>
        <legend>Options</legend>
        <label className="field">
          <span>Countertop</span>
          <select value={design.settings.countertop} onChange={(e) => setSettings({ countertop: e.target.value as Design['settings']['countertop'] })}>
            <option value="quartz">{design.rates.countertop.quartz.label}</option>
            <option value="granite">{design.rates.countertop.granite.label}</option>
            <option value="none">No countertop</option>
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={design.settings.gst} onChange={(e) => setSettings({ gst: e.target.checked })} /> Add GST</label>
      </fieldset>

      {groups.map((g) => (
        <details key={g} open={g === 'Woodwork'}>
          <summary><span>{g}</span><span>{inr(est.byGroup[g])}</span></summary>
          <table className="mini">
            <tbody>
              {est.lines.filter((l) => l.group === g).map((l, i) => (
                <tr key={i}>
                  <td>{l.label}</td>
                  <td>{l.qty} {l.unit}</td>
                  <td>{inr(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ))}

      <table className="totals">
        <tbody>
          <tr><td>Subtotal</td><td>{inr(est.subtotal)}</td></tr>
          <tr><td>Installation & transport ({design.rates.installationPct}%)</td><td>{inr(est.installation)}</td></tr>
          {design.settings.gst && <tr><td>GST ({design.rates.gstPct}%)</td><td>{inr(est.gst)}</td></tr>}
          <tr className="grand"><td>Total</td><td>{inr(est.total)}</td></tr>
        </tbody>
      </table>
      <div className="btn-row">
        <button type="button" onClick={exportCsv}>Download estimate (CSV)</button>
        <button type="button" onClick={() => window.print()}>Print</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Rates
export function RatesPanel() {
  const rates = useStore((s) => s.design.rates);
  const setRates = useStore((s) => s.setRates);
  const field = (label: string, value: number, apply: (v: number) => void, unit: string) => (
    <label className="rate" key={label}>
      <span>{label}</span>
      <div className="num"><em>₹</em><input type="number" min={0} step={50} value={value} onChange={(e) => apply(Math.max(0, Number(e.target.value) || 0))} /><em>{unit}</em></div>
    </label>
  );
  return (
    <div className="tab-body">
      <p className="note">These are sample Chennai-market rates. Replace them with your carpenter&rsquo;s or vendor&rsquo;s quote and the estimate updates instantly. Rates are saved with the design.</p>
      <fieldset>
        <legend>Cabinet finishes (per sq ft of front area)</legend>
        {FINISH_IDS.map((f) => field(rates.finish[f].label, rates.finish[f].perSqft, (v) => setRates((r) => { r.finish[f].perSqft = v; return r; }), '/sq ft'))}
      </fieldset>
      <fieldset>
        <legend>Countertop (per running ft)</legend>
        {(['quartz', 'granite'] as const).map((k) => field(rates.countertop[k].label, rates.countertop[k].perRft, (v) => setRates((r) => { r.countertop[k].perRft = v; return r; }), '/rft'))}
      </fieldset>
      <fieldset>
        <legend>Hardware, appliances & furniture</legend>
        {Object.keys(rates.fixed).map((k) => field(rates.fixed[k].label, rates.fixed[k].amount, (v) => setRates((r) => { r.fixed[k].amount = v; return r; }), k === 'led_per_rft' ? '/rft' : 'each'))}
      </fieldset>
      <fieldset>
        <legend>Charges</legend>
        <label className="rate"><span>Installation & transport</span><div className="num"><input type="number" min={0} max={50} value={rates.installationPct} onChange={(e) => setRates((r) => { r.installationPct = Number(e.target.value) || 0; return r; })} /><em>%</em></div></label>
        <label className="rate"><span>GST</span><div className="num"><input type="number" min={0} max={40} value={rates.gstPct} onChange={(e) => setRates((r) => { r.gstPct = Number(e.target.value) || 0; return r; })} /><em>%</em></div></label>
      </fieldset>
      <div className="btn-row"><button type="button" onClick={() => setRates(() => structuredClone(DEFAULT_RATES))}>Reset to sample rates</button></div>
    </div>
  );
}

// ------------------------------------------------------------------ Room & project
export function RoomPanel() {
  const design = useStore((s) => s.design);
  const { setRoom, setSettings, load } = useStore.getState();
  const fileRef = useRef<HTMLInputElement>(null);
  const r = design.room;

  const exportJson = () => download(new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' }), `${slug(design.name)}.json`);
  const importJson = (f: File) => {
    f.text().then((t) => {
      try {
        const d = JSON.parse(t) as Design;
        if (d.version !== 1 || !Array.isArray(d.items)) throw new Error('bad');
        load(d);
      } catch { alert('That file is not a design saved from this app.'); }
    });
  };

  return (
    <div className="tab-body">
      <fieldset>
        <legend>Room size</legend>
        <div className="grid2">
          <Num label="Width (left–right)" value={r.width} min={1200} max={15000} step={50} onChange={(v) => setRoom({ width: v })} />
          <Num label="Length (top–bottom)" value={r.length} min={1200} max={15000} step={50} onChange={(v) => setRoom({ length: v })} />
          <Num label="Ceiling height" value={r.height} min={2100} max={5000} step={50} onChange={(v) => setRoom({ height: v })} />
          <Num label="Wall thickness" value={r.wall} min={100} max={400} step={5} onChange={(v) => setRoom({ wall: v })} />
        </div>
        <div className="grid2">
          <label className="field"><span>Floor colour</span><input type="color" value={r.floorColor} onChange={(e) => setRoom({ floorColor: e.target.value })} /></label>
          <label className="field"><span>Wall colour</span><input type="color" value={r.wallColor} onChange={(e) => setRoom({ wallColor: e.target.value })} /></label>
          <label className="field"><span>Countertop colour</span><input type="color" value={design.settings.countertopColor} onChange={(e) => setSettings({ countertopColor: e.target.value })} /></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Drawing aids</legend>
        <label className="check"><input type="checkbox" checked={design.settings.snap} onChange={(e) => setSettings({ snap: e.target.checked })} /> Snap to walls, other units and grid</label>
        <label className="check"><input type="checkbox" checked={design.settings.showDims} onChange={(e) => setSettings({ showDims: e.target.checked })} /> Show dimensions</label>
        <label className="field"><span>Grid step</span>
          <select value={design.settings.gridMm} onChange={(e) => setSettings({ gridMm: Number(e.target.value) })}>
            {[10, 25, 50, 100].map((g) => <option key={g} value={g}>{g} mm</option>)}
          </select>
        </label>
      </fieldset>
      <fieldset>
        <legend>Project</legend>
        <div className="btn-row wrap">
          <button type="button" onClick={() => load(kitchen7x10())}>Load 7×10 kitchen</button>
          <button type="button" onClick={() => load(emptyRoom())}>New empty room</button>
          <button type="button" onClick={exportJson}>Save design file</button>
          <button type="button" onClick={() => fileRef.current?.click()}>Open design file</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }} />
        </div>
        <p className="note">Your work also saves automatically in this browser.</p>
      </fieldset>
    </div>
  );
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'design';
