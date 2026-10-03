'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { catalogByKind } from '@/lib/catalog';
import {
  attachToWall, bounds, distancesToWalls, findCollisions, mmToFtIn, snapPosition, type SnapGuide,
} from '@/lib/geometry';
import { DND_MIME, useStore } from '@/lib/store';
import type { Item, Kind } from '@/lib/types';

interface View { scale: number; ox: number; oy: number }
type Drag =
  | { mode: 'none' }
  | { mode: 'pan'; sx: number; sy: number; ox: number; oy: number; moved: boolean }
  | { mode: 'move'; id: string; dx: number; dy: number; started: boolean; sx: number; sy: number }
  | { mode: 'resize'; id: string; side: 1 | -1; start: Item; started: boolean };

const C = {
  ground: '#E6E9E7', floor: '#F7F7F5', gridMinor: '#E9ECEA', gridMajor: '#D6DBD9',
  wall: '#2B3438', ink: '#1D2528', muted: '#5B676C', select: '#2D5BD7', danger: '#C2412D', glass: '#9FC3D6',
};

const UPPER = new Set(['wall_cab', 'wall_glass', 'wall_shelf', 'loft', 'chimney']);

function localAxis(rot: number) {
  const r = (rot * Math.PI) / 180;
  return { ax: Math.cos(r), ay: Math.sin(r) }; // width direction, clockwise in plan (y down)
}

export default function PlanCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [view, setView] = useState<View>({ scale: 0.2, ox: 60, oy: 60 });
  const [guides, setGuides] = useState<SnapGuide[]>([]);
  const [cursor, setCursor] = useState('default');
  const [dropHint, setDropHint] = useState(false);
  const drag = useRef<Drag>({ mode: 'none' });
  const fitted = useRef(false);

  const design = useStore((s) => s.design);
  const selectedId = useStore((s) => s.selectedId);
  const { room, items, settings } = design;

  // ---------- sizing & fit ----------
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      setSize({ w: Math.max(200, Math.floor(r.width)), h: Math.max(200, Math.floor(r.height)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = useCallback(() => {
    const pad = 70;
    const tw = room.width + room.wall * 2;
    const th = room.length + room.wall * 2;
    const scale = Math.min((size.w - pad * 2) / tw, (size.h - pad * 2) / th);
    setView({ scale, ox: (size.w - room.width * scale) / 2, oy: (size.h - room.length * scale) / 2 });
  }, [room.width, room.length, room.wall, size.w, size.h]);

  useEffect(() => { fit(); fitted.current = true; }, [fit]);

  const toWorld = useCallback((sx: number, sy: number) => ({ x: (sx - view.ox) / view.scale, y: (sy - view.oy) / view.scale }), [view]);

  // ---------- hit testing ----------
  const drawOrder = useCallback((list: Item[]) => [...list].sort((a, b) => {
    const ua = UPPER.has(a.kind) ? 1 : 0;
    const ub = UPPER.has(b.kind) ? 1 : 0;
    if (a.kind === 'rug') return -1;
    if (b.kind === 'rug') return 1;
    return ua - ub || a.elevation - b.elevation;
  }), []);

  const hitItem = useCallback((wx: number, wy: number) => {
    const order = drawOrder(items);
    for (let i = order.length - 1; i >= 0; i--) {
      const r = bounds(order[i]);
      if (wx >= r.x1 && wx <= r.x2 && wy >= r.y1 && wy <= r.y2) return order[i];
    }
    return null;
  }, [items, drawOrder]);

  const handlePoints = useCallback((it: Item) => {
    const { ax, ay } = localAxis(it.rot);
    return ([1, -1] as const).map((side) => ({ side, x: it.x + ax * side * (it.w / 2), y: it.y + ay * side * (it.w / 2) }));
  }, []);

  const hitHandle = useCallback((sx: number, sy: number) => {
    const sel = items.find((i) => i.id === selectedId);
    if (!sel || sel.locked) return null;
    const c = catalogByKind[sel.kind];
    if (!c?.minW) return null;
    for (const h of handlePoints(sel)) {
      const px = h.x * view.scale + view.ox;
      const py = h.y * view.scale + view.oy;
      if (Math.abs(px - sx) <= 9 && Math.abs(py - sy) <= 9) return { item: sel, side: h.side };
    }
    return null;
  }, [items, selectedId, handlePoints, view]);

  // ---------- drawing ----------
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = size.w * dpr;
    cv.height = size.h * dpr;
    const ctx = cv.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { scale: s, ox, oy } = view;
    const X = (x: number) => x * s + ox;
    const Y = (y: number) => y * s + oy;

    ctx.fillStyle = C.ground;
    ctx.fillRect(0, 0, size.w, size.h);

    // floor + grid
    ctx.fillStyle = C.floor;
    ctx.fillRect(X(0), Y(0), room.width * s, room.length * s);
    const minor = 100;
    if (minor * s > 5) {
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= room.width; gx += minor) {
        ctx.strokeStyle = gx % 500 === 0 ? C.gridMajor : C.gridMinor;
        ctx.beginPath(); ctx.moveTo(Math.round(X(gx)) + 0.5, Y(0)); ctx.lineTo(Math.round(X(gx)) + 0.5, Y(room.length)); ctx.stroke();
      }
      for (let gy = 0; gy <= room.length; gy += minor) {
        ctx.strokeStyle = gy % 500 === 0 ? C.gridMajor : C.gridMinor;
        ctx.beginPath(); ctx.moveTo(X(0), Math.round(Y(gy)) + 0.5); ctx.lineTo(X(room.width), Math.round(Y(gy)) + 0.5); ctx.stroke();
      }
    }

    // walls
    const t = room.wall;
    ctx.fillStyle = C.wall;
    ctx.fillRect(X(-t), Y(-t), (room.width + 2 * t) * s, t * s);
    ctx.fillRect(X(-t), Y(room.length), (room.width + 2 * t) * s, t * s);
    ctx.fillRect(X(-t), Y(0), t * s, room.length * s);
    ctx.fillRect(X(room.width), Y(0), t * s, room.length * s);

    const collisions = findCollisions(items);
    const order = drawOrder(items);

    for (const it of order) {
      const cat = catalogByKind[it.kind];
      const sel = it.id === selectedId;
      const clash = collisions.has(it.id);
      const w = it.w * s;
      const d = it.d * s;
      ctx.save();
      ctx.translate(X(it.x), Y(it.y));
      ctx.rotate((it.rot * Math.PI) / 180);

      if (it.kind === 'window' || it.kind === 'door') {
        ctx.fillStyle = C.floor;
        ctx.fillRect(-w / 2, -(t * s) / 2 - 1, w, t * s + 2);
        if (it.kind === 'window') {
          ctx.strokeStyle = '#4C88AA'; ctx.lineWidth = 1.5;
          for (const f of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(-w / 2, (f * t * s)); ctx.lineTo(w / 2, f * t * s); ctx.stroke(); }
        } else {
          // door leaf and swing into the room (room side of the wall is local +y)
          const inside = (t * s) / 2;
          ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(w / 2, inside); ctx.lineTo(w / 2, inside + w); ctx.stroke();
          ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.arc(w / 2, inside, w, Math.PI / 2, Math.PI); ctx.stroke();
          ctx.setLineDash([]);
        }
        if (sel) { ctx.strokeStyle = C.select; ctx.lineWidth = 2; ctx.strokeRect(-w / 2, -(t * s) / 2, w, t * s); }
        ctx.restore();
        continue;
      }

      const upper = UPPER.has(it.kind);
      ctx.globalAlpha = upper ? (sel ? 0.55 : 0.14) : 1;

      if (cat?.hasCounter && settings.countertop !== 'none') {
        ctx.fillStyle = settings.countertopColor;
        ctx.fillRect(-w / 2, -d / 2, w, d);
        ctx.fillStyle = it.color; // shutter edge on the front
        ctx.fillRect(-w / 2, d / 2 - Math.max(3, 30 * s), w, Math.max(3, 30 * s));
      } else {
        ctx.fillStyle = it.color;
        ctx.fillRect(-w / 2, -d / 2, w, d);
      }
      ctx.globalAlpha = 1;
      if (!upper || sel) drawSymbol(ctx, it, w, d, s);

      ctx.lineWidth = upper ? 1 : 1.2;
      ctx.strokeStyle = upper ? 'rgba(29,37,40,.45)' : 'rgba(29,37,40,.75)';
      if (upper) ctx.setLineDash([5, 4]);
      ctx.strokeRect(-w / 2, -d / 2, w, d);
      ctx.setLineDash([]);

      if (clash) {
        ctx.save();
        ctx.beginPath(); ctx.rect(-w / 2, -d / 2, w, d); ctx.clip();
        ctx.strokeStyle = 'rgba(194,65,45,.55)'; ctx.lineWidth = 1;
        for (let k = -w - d; k < w + d; k += 9) { ctx.beginPath(); ctx.moveTo(-w / 2 + k, -d / 2); ctx.lineTo(-w / 2 + k + d, d / 2); ctx.stroke(); }
        ctx.restore();
        ctx.strokeStyle = C.danger; ctx.lineWidth = 2; ctx.strokeRect(-w / 2, -d / 2, w, d);
      }
      if (sel) {
        ctx.strokeStyle = C.select; ctx.lineWidth = 2.5;
        ctx.strokeRect(-w / 2 - 2, -d / 2 - 2, w + 4, d + 4);
        // front marker
        ctx.fillStyle = C.select;
        ctx.beginPath(); ctx.moveTo(-6, d / 2 + 4); ctx.lineTo(6, d / 2 + 4); ctx.lineTo(0, d / 2 + 11); ctx.closePath(); ctx.fill();
      }
      ctx.restore();

      // label (unrotated)
      const r = bounds(it);
      const sw = (r.x2 - r.x1) * s;
      const sh = (r.y2 - r.y1) * s;
      if (Math.min(sw, sh) > 26 && Math.max(sw, sh) > 60 && it.kind !== 'rug' && (!upper || sel)) {
        ctx.fillStyle = isDark(it.color) && !cat?.hasCounter && !upper ? '#FFFFFF' : C.ink;
        ctx.font = '500 11px "Schibsted Grotesk", system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const label = shortName(it);
        const maxW = Math.max(sw, sh) - 8;
        ctx.save();
        ctx.translate(X(it.x), Y(it.y) + (cat?.hasCounter && sw > sh ? -8 : 0));
        if (sh > sw * 1.4) ctx.rotate(-Math.PI / 2);
        ctx.fillText(fitText(ctx, label, maxW), 0, 0);
        ctx.restore();
      }
    }

    // resize handles + dimensions for selection
    const sel = items.find((i) => i.id === selectedId);
    if (sel) {
      const cat = catalogByKind[sel.kind];
      if (cat?.minW && !sel.locked) {
        for (const h of handlePoints(sel)) {
          ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = C.select; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.rect(X(h.x) - 6, Y(h.y) - 6, 12, 12); ctx.fill(); ctx.stroke();
        }
      }
      if (settings.showDims && sel.kind !== 'door' && sel.kind !== 'window') {
        const r = bounds(sel);
        const dist = distancesToWalls(sel, room);
        ctx.strokeStyle = C.select; ctx.fillStyle = C.select; ctx.lineWidth = 1;
        ctx.font = '600 11px "Schibsted Grotesk", system-ui, sans-serif';
        const cx = (r.x1 + r.x2) / 2;
        const cy = (r.y1 + r.y2) / 2;
        const seg = (x1: number, y1: number, x2: number, y2: number, v: number) => {
          if (v < 15) return;
          ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(X(x1), Y(y1)); ctx.lineTo(X(x2), Y(y2)); ctx.stroke();
          ctx.setLineDash([]);
          pill(ctx, `${Math.round(v)}`, (X(x1) + X(x2)) / 2, (Y(y1) + Y(y2)) / 2);
        };
        seg(r.x1, cy, 0, cy, dist.left);
        seg(r.x2, cy, room.width, cy, dist.right);
        seg(cx, r.y1, cx, 0, dist.top);
        seg(cx, r.y2, cx, room.length, dist.bottom);
      }
    }

    // snap guides
    ctx.strokeStyle = C.select; ctx.lineWidth = 1; ctx.setLineDash([6, 4]);
    for (const g of guides) {
      ctx.beginPath();
      if (g.axis === 'x') { ctx.moveTo(X(g.at), Y(-t)); ctx.lineTo(X(g.at), Y(room.length + t)); }
      else { ctx.moveTo(X(-t), Y(g.at)); ctx.lineTo(X(room.width + t), Y(g.at)); }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // room dimensions
    if (settings.showDims) {
      ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink; ctx.lineWidth = 1;
      ctx.font = '600 12px "Schibsted Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const yy = Y(-t) - 22;
      ctx.beginPath(); ctx.moveTo(X(0), yy); ctx.lineTo(X(room.width), yy); ctx.stroke();
      tick(ctx, X(0), yy); tick(ctx, X(room.width), yy);
      label(ctx, `${mmToFtIn(room.width)}  ·  ${room.width} mm`, (X(0) + X(room.width)) / 2, yy);
      const xx = X(-t) - 22;
      ctx.beginPath(); ctx.moveTo(xx, Y(0)); ctx.lineTo(xx, Y(room.length)); ctx.stroke();
      tick(ctx, xx, Y(0), true); tick(ctx, xx, Y(room.length), true);
      ctx.save(); ctx.translate(xx, (Y(0) + Y(room.length)) / 2); ctx.rotate(-Math.PI / 2);
      label(ctx, `${mmToFtIn(room.length)}  ·  ${room.length} mm`, 0, 0);
      ctx.restore();
    }
  }, [size, view, room, items, settings, selectedId, guides, drawOrder, handlePoints]);

  // ---------- pointer interaction ----------
  const local = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { sx: e.clientX - r.left, sy: e.clientY - r.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { sx, sy } = local(e);
    const { x, y } = toWorld(sx, sy);
    canvasRef.current!.setPointerCapture(e.pointerId);
    if (e.button === 1 || e.button === 2) {
      drag.current = { mode: 'pan', sx, sy, ox: view.ox, oy: view.oy, moved: false };
      return;
    }
    const h = hitHandle(sx, sy);
    if (h) {
      drag.current = { mode: 'resize', id: h.item.id, side: h.side, start: { ...h.item }, started: false };
      return;
    }
    const it = hitItem(x, y);
    if (it) {
      useStore.getState().select(it.id);
      if (!it.locked) drag.current = { mode: 'move', id: it.id, dx: x - it.x, dy: y - it.y, started: false, sx, sy };
    } else {
      drag.current = { mode: 'pan', sx, sy, ox: view.ox, oy: view.oy, moved: false };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { sx, sy } = local(e);
    const { x, y } = toWorld(sx, sy);
    const d = drag.current;
    const st = useStore.getState();
    if (d.mode === 'none') {
      if (hitHandle(sx, sy)) setCursor('ew-resize');
      else { const it = hitItem(x, y); setCursor(it ? (it.locked ? 'not-allowed' : 'grab') : 'default'); }
      return;
    }
    if (d.mode === 'pan') {
      if (Math.abs(sx - d.sx) + Math.abs(sy - d.sy) > 3) d.moved = true;
      setView((v) => ({ ...v, ox: d.ox + (sx - d.sx), oy: d.oy + (sy - d.sy) }));
      setCursor('grabbing');
      return;
    }
    if (d.mode === 'move') {
      if (!d.started) {
        if (Math.abs(sx - d.sx) + Math.abs(sy - d.sy) < 3) return;
        st.checkpoint(); d.started = true;
      }
      const it = st.design.items.find((i) => i.id === d.id);
      if (!it) return;
      setCursor('grabbing');
      if (it.kind === 'door' || it.kind === 'window') {
        st.updateItem(it.id, attachToWall({ ...it, x: x - d.dx, y: y - d.dy }, room));
        return;
      }
      const others = st.design.items.filter((o) => o.id !== it.id && o.kind !== 'door' && o.kind !== 'window' && o.kind !== 'rug');
      const snapped = snapPosition(it, x - d.dx, y - d.dy, room, others, {
        snap: settings.snap && !e.altKey, grid: settings.gridMm, threshold: 10 / view.scale,
      });
      setGuides(snapped.guides);
      st.updateItem(it.id, { x: snapped.x, y: snapped.y });
      return;
    }
    if (d.mode === 'resize') {
      if (!d.started) { st.checkpoint(); d.started = true; }
      const s0 = d.start;
      const cat = catalogByKind[s0.kind];
      const { ax, ay } = localAxis(s0.rot);
      const proj = (x - s0.x) * ax + (y - s0.y) * ay; // along width axis from the start centre
      let edge = d.side === 1 ? proj : -proj;          // distance of dragged edge from centre
      let newW = edge + s0.w / 2;
      newW = Math.round(newW / 10) * 10;
      newW = Math.min(Math.max(newW, cat.minW ?? 100), cat.maxW ?? 4000);
      edge = newW - s0.w / 2;
      const shift = ((newW - s0.w) / 2) * d.side;
      st.updateItem(s0.id, { w: newW, x: Math.round(s0.x + ax * shift), y: Math.round(s0.y + ay * shift) });
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (d.mode === 'pan' && !d.moved && e.button === 0) useStore.getState().select(null);
    drag.current = { mode: 'none' };
    setGuides([]);
    setCursor('default');
  };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const { sx, sy } = local(e);
    const k = Math.exp(-e.deltaY * 0.0015);
    setView((v) => {
      const scale = Math.min(Math.max(v.scale * k, 0.03), 3);
      const f = scale / v.scale;
      return { scale, ox: sx - (sx - v.ox) * f, oy: sy - (sy - v.oy) * f };
    });
  };

  const zoomBy = (k: number) => setView((v) => {
    const scale = Math.min(Math.max(v.scale * k, 0.03), 3);
    const f = scale / v.scale;
    const cx = size.w / 2, cy = size.h / 2;
    return { scale, ox: cx - (cx - v.ox) * f, oy: cy - (cy - v.oy) * f };
  });

  // ---------- drop from catalog ----------
  const onDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(DND_MIME)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDropHint(true); }
  };
  const onDrop = (e: React.DragEvent) => {
    setDropHint(false);
    const kind = e.dataTransfer.getData(DND_MIME) as Kind;
    if (!kind || !catalogByKind[kind]) return;
    e.preventDefault();
    const { sx, sy } = local(e);
    const { x, y } = toWorld(sx, sy);
    useStore.getState().addItem(kind, { x, y });
  };

  return (
    <div ref={wrapRef} className={`plan ${dropHint ? 'is-drop' : ''}`} onDragOver={onDragOver} onDragLeave={() => setDropHint(false)} onDrop={onDrop}>
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h, cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={(e) => { const { sx, sy } = local(e); const p = toWorld(sx, sy); if (!hitItem(p.x, p.y)) fit(); }}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Floor plan. Drag items to move them, drag the square handles to resize."
        role="img"
      />
      <div className="view-tag">Plan</div>
      <div className="zoom">
        <button type="button" onClick={() => zoomBy(1.25)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => zoomBy(0.8)} aria-label="Zoom out">−</button>
        <button type="button" onClick={fit}>Fit</button>
      </div>
      <p className="hint">Drag to move · square handles resize · hold Alt to skip snapping · scroll to zoom · drag empty floor to pan</p>
    </div>
  );
}

// ---------------- helpers ----------------
function isDark(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
}

function shortName(it: Item) {
  const map: Partial<Record<Kind, string>> = {
    base_drawer: 'Drawers', base_door: 'Base unit', base_sink: 'Sink', base_hob: 'Hob', base_corner: 'Magic corner',
    base_pullout: 'Pull-out', wall_cab: 'Wall unit', wall_glass: 'Glass unit', wall_shelf: 'Shelf', loft: 'Loft',
    tall_pantry: 'Pantry', tall_oven: 'Oven tower', fridge: 'Fridge', chimney: 'Chimney', dishwasher: 'Dishwasher',
    microwave: 'Microwave', dining_table: 'Dining table', chair: 'Chair', sofa: 'Sofa', bed: 'Bed',
    wardrobe: 'Wardrobe', tv_unit: 'TV unit', plant: 'Plant',
  };
  return `${map[it.kind] ?? it.name} ${Math.round(it.w)}`;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 2 && ctx.measureText(t + '…').width > max) t = t.slice(0, -1);
  return t + '…';
}

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 10;
  ctx.fillStyle = '#2D5BD7';
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - 9, w, 18, 9); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.fillText(text, x, y + 0.5);
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  const w = ctx.measureText(text).width + 12;
  ctx.fillStyle = '#E6E9E7'; ctx.fillRect(x - w / 2, y - 9, w, 18);
  ctx.fillStyle = '#1D2528'; ctx.fillText(text, x, y + 0.5);
}

function tick(ctx: CanvasRenderingContext2D, x: number, y: number, vertical = false) {
  ctx.beginPath();
  if (vertical) { ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); } else { ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); }
  ctx.stroke();
}

/** Plan symbols, drawn in the item's local frame (front = +y). */
function drawSymbol(ctx: CanvasRenderingContext2D, it: Item, w: number, d: number, s: number) {
  ctx.strokeStyle = 'rgba(29,37,40,.7)';
  ctx.lineWidth = 1;
  switch (it.kind) {
    case 'base_sink': {
      const bw = Math.min(w - 60 * s, 600 * s), bd = d - 160 * s;
      ctx.fillStyle = '#C9CED1';
      ctx.beginPath(); ctx.roundRect(-bw / 2, -d / 2 + 70 * s, bw, bd, 8 * s); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -d / 2 + 70 * s + bd / 2, 30 * s, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'base_hob': {
      ctx.fillStyle = '#2A2C2E';
      const hw = Math.min(w - 100 * s, 760 * s), hd = Math.min(d - 100 * s, 450 * s);
      ctx.fillRect(-hw / 2, -hd / 2, hw, hd);
      ctx.strokeStyle = '#9AA0A5';
      for (const [cx, r] of [[-hw / 3, 70], [0, 95], [hw / 3, 70]] as [number, number][]) { ctx.beginPath(); ctx.arc(cx, 0, r * s, 0, Math.PI * 2); ctx.stroke(); }
      break;
    }
    case 'base_corner': {
      ctx.beginPath(); ctx.arc(-w / 2, -d / 2, Math.min(w, d) * 0.8, 0, Math.PI / 2); ctx.stroke();
      break;
    }
    case 'fridge': case 'dishwasher': {
      ctx.beginPath(); ctx.moveTo(-w / 2, -d / 2); ctx.lineTo(w / 2, d / 2); ctx.moveTo(w / 2, -d / 2); ctx.lineTo(-w / 2, d / 2); ctx.stroke();
      break;
    }
    case 'chimney': {
      ctx.strokeRect(-w / 4, -d / 2, w / 2, d * 0.45);
      break;
    }
    case 'dining_table': {
      ctx.strokeRect(-w / 2 + 20 * s, -d / 2 + 20 * s, w - 40 * s, d - 40 * s);
      break;
    }
    case 'chair': {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-w / 2, -d / 2, w, 80 * s);
      break;
    }
    case 'sofa': {
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.fillRect(-w / 2, -d / 2, w, 220 * s);
      ctx.fillRect(-w / 2, -d / 2, 180 * s, d); ctx.fillRect(w / 2 - 180 * s, -d / 2, 180 * s, d);
      break;
    }
    case 'bed': {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-w / 2, -d / 2, w, 80 * s);
      ctx.fillStyle = '#F4F2EE';
      ctx.fillRect(-w / 2 + 60 * s, -d / 2 + 80 * s, w - 120 * s, d - 140 * s);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-w / 2 + 120 * s, -d / 2 + 140 * s, w / 2 - 180 * s, 300 * s);
      ctx.fillRect(60 * s, -d / 2 + 140 * s, w / 2 - 180 * s, 300 * s);
      break;
    }
    case 'wardrobe': case 'tall_pantry': case 'tall_oven': {
      ctx.beginPath(); ctx.moveTo(-w / 2, -d / 2); ctx.lineTo(w / 2, d / 2); ctx.stroke();
      break;
    }
    case 'plant': {
      ctx.fillStyle = '#3F6A3B';
      ctx.beginPath(); ctx.arc(0, 0, Math.min(w, d) / 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'rug': {
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
      ctx.strokeRect(-w / 2 + 80 * s, -d / 2 + 80 * s, w - 160 * s, d - 160 * s);
      break;
    }
    default: break;
  }
}
