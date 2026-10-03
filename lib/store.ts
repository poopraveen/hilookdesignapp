'use client';
import { create } from 'zustand';
import { catalogByKind } from './catalog';
import { attachToWall, bounds, rectsOverlap, rotationForNearestWall, uid } from './geometry';
import { kitchen7x10 } from './presets';
import type { Design, Item, Kind, Rates, Room, Settings } from './types';

export type ViewMode = '2d' | '3d' | 'split';
const STORAGE_KEY = 'interior-studio:design:v1';
const WALL_KINDS = new Set(['base', 'wall', 'tall', 'appliance']);

interface State {
  design: Design;
  selectedId: string | null;
  view: ViewMode;
  past: Design[];
  future: Design[];
  // actions
  select: (id: string | null) => void;
  setView: (v: ViewMode) => void;
  checkpoint: () => void;
  addItem: (kind: Kind, at?: { x: number; y: number }) => string;
  updateItem: (id: string, patch: Partial<Item>, record?: boolean) => void;
  removeItem: (id: string) => void;
  duplicate: (id: string) => void;
  rotate: (id: string, by?: number) => void;
  setRoom: (patch: Partial<Room>) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setRates: (fn: (r: Rates) => Rates) => void;
  setName: (name: string) => void;
  load: (d: Design) => void;
  undo: () => void;
  redo: () => void;
}

const clone = (d: Design): Design => structuredClone(d);

/** Place a new item: units go flush against the nearest wall with their back to it. */
export function placeNew(kind: Kind, x: number, y: number, room: Room): Item {
  const c = catalogByKind[kind];
  const base: Item = {
    id: uid(), kind, name: c.name, x, y, rot: 0,
    w: c.w, d: c.d, h: c.h, elevation: c.elevation, color: c.color, finish: c.finish,
  };
  if (c.category === 'opening') return { ...base, ...attachToWall(base, room) };
  if (WALL_KINDS.has(c.category) || kind === 'wardrobe' || kind === 'tv_unit') {
    const rot = rotationForNearestWall(x, y, room);
    const it = { ...base, rot };
    const half = it.d / 2;
    if (rot === 0) it.y = half;
    if (rot === 180) it.y = room.length - half;
    if (rot === 90) it.x = room.width - half;
    if (rot === 270) it.x = half;
    // keep inside the room along the wall
    const b = bounds(it);
    if (b.x1 < 0) it.x -= b.x1;
    if (b.x2 > room.width) it.x -= b.x2 - room.width;
    if (b.y1 < 0) it.y -= b.y1;
    if (b.y2 > room.length) it.y -= b.y2 - room.length;
    it.x = Math.round(it.x); it.y = Math.round(it.y);
    return it;
  }
  return { ...base, x: Math.round(x), y: Math.round(y) };
}

function loadInitial(): Design {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Design;
        if (d && d.version === 1 && Array.isArray(d.items)) return d;
      }
    } catch { /* ignore */ }
  }
  return kitchen7x10();
}

export const useStore = create<State>((set, get) => ({
  design: loadInitial(),
  selectedId: null,
  view: 'split',
  past: [],
  future: [],

  select: (id) => set({ selectedId: id }),
  setView: (view) => set({ view }),

  checkpoint: () => set((s) => ({ past: [...s.past.slice(-99), clone(s.design)], future: [] })),

  addItem: (kind, at) => {
    const { design } = get();
    get().checkpoint();
    const room = design.room;
    let it = placeNew(kind, at?.x ?? room.width / 2, at?.y ?? room.length / 2, room);
    // nudge along the wall if it lands on something
    for (let k = 0; k < 20 && !at; k++) {
      const clash = design.items.some((o) => o.elevation < it.elevation + it.h && it.elevation < o.elevation + o.h && rectsOverlap(bounds(o), bounds(it)));
      if (!clash) break;
      it = { ...it, ...(it.rot % 180 === 0 ? { x: it.x + 150 } : { y: it.y + 150 }) };
    }
    set((s) => ({ design: { ...s.design, items: [...s.design.items, it] }, selectedId: it.id }));
    return it.id;
  },

  updateItem: (id, patch, record = false) => {
    if (record) get().checkpoint();
    set((s) => ({ design: { ...s.design, items: s.design.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) } }));
  },

  removeItem: (id) => {
    get().checkpoint();
    set((s) => ({ design: { ...s.design, items: s.design.items.filter((i) => i.id !== id) }, selectedId: s.selectedId === id ? null : s.selectedId }));
  },

  duplicate: (id) => {
    const src = get().design.items.find((i) => i.id === id);
    if (!src) return;
    get().checkpoint();
    const off = src.rot % 180 === 0 ? { x: src.x + src.w } : { y: src.y + src.w };
    const copy = { ...src, id: uid(), ...off };
    set((s) => ({ design: { ...s.design, items: [...s.design.items, copy] }, selectedId: copy.id }));
  },

  rotate: (id, by = 90) => {
    const src = get().design.items.find((i) => i.id === id);
    if (!src) return;
    get().checkpoint();
    const rot = (((src.rot + by) % 360) + 360) % 360;
    set((s) => ({ design: { ...s.design, items: s.design.items.map((i) => (i.id === id ? { ...i, rot } : i)) } }));
  },

  setRoom: (patch) => { get().checkpoint(); set((s) => ({ design: { ...s.design, room: { ...s.design.room, ...patch } } })); },
  setSettings: (patch) => set((s) => ({ design: { ...s.design, settings: { ...s.design.settings, ...patch } } })),
  setRates: (fn) => set((s) => ({ design: { ...s.design, rates: fn(structuredClone(s.design.rates)) } })),
  setName: (name) => set((s) => ({ design: { ...s.design, name } })),
  load: (d) => { get().checkpoint(); set({ design: clone(d), selectedId: null }); },

  undo: () => {
    const { past, design, future } = get();
    if (!past.length) return;
    set({ design: past[past.length - 1], past: past.slice(0, -1), future: [clone(design), ...future].slice(0, 100), selectedId: null });
  },
  redo: () => {
    const { past, design, future } = get();
    if (!future.length) return;
    set({ design: future[0], future: future.slice(1), past: [...past, clone(design)], selectedId: null });
  },
}));

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function startAutosave() {
  return useStore.subscribe((s, prev) => {
    if (s.design === prev.design) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s.design)); } catch { /* quota */ }
    }, 400);
  });
}

/** Shared drag payload between the catalog (HTML5 DnD) and both views. */
export const DND_MIME = 'application/x-interior-kind';
