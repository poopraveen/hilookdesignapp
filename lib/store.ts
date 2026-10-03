'use client';
import { create } from 'zustand';
import { catalogByKind } from './catalog';
import { attachToWall, bounds, rectsOverlap, rotationForNearestWall, uid } from './geometry';
import { defaultProject, normalizeDesign } from './presets';
import type { Design, Item, Kind, Project, Rates, Room, Settings } from './types';

export type ViewMode = '2d' | '3d' | 'split';
const STORAGE_KEY = 'hilook:project:v2';
const LEGACY_KEY = 'interior-studio:design:v1';

interface State {
  projectName: string;
  rooms: Design[];      // all rooms; rooms[active] may be stale — `design` is the live copy
  active: number;
  design: Design;
  selectedId: string | null;
  view: ViewMode;
  past: Design[];
  future: Design[];
  // rooms
  switchRoom: (i: number) => void;
  addRoom: (d: Design) => void;
  removeRoom: (i: number) => void;
  renameProject: (name: string) => void;
  allRooms: () => Design[];
  loadProject: (p: Project) => void;
  // design actions
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

const clone = <T,>(d: T): T => structuredClone(d);

/** Place a new item: wall-mounted and against-the-wall units go flush to the nearest wall, facing into the room. */
export function placeNew(kind: Kind, x: number, y: number, room: Room): Item {
  const c = catalogByKind[kind];
  const base: Item = {
    id: uid(), kind, name: c.name, x, y, rot: 0,
    w: c.w, d: c.d, h: c.h, elevation: c.elevation, color: c.color, finish: c.finish,
  };
  if (c.mount === 'opening') return { ...base, ...attachToWall(base, room) };
  if (c.mount === 'floor-wall' || c.mount === 'wall') {
    const rot = rotationForNearestWall(x, y, room);
    const it = { ...base, rot };
    const half = it.d / 2;
    if (rot === 0) it.y = half;
    if (rot === 180) it.y = room.length - half;
    if (rot === 90) it.x = room.width - half;
    if (rot === 270) it.x = half;
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

function loadInitial(): { projectName: string; rooms: Design[]; active: number } {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Project & { active?: number };
        if (p && p.version === 2 && Array.isArray(p.rooms) && p.rooms.length) {
          const rooms = p.rooms.map(normalizeDesign);
          return { projectName: p.name, rooms, active: Math.min(p.active ?? 0, rooms.length - 1) };
        }
      }
      // carry over a design saved by the first version of the app
      const legacy = window.localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const d = normalizeDesign(JSON.parse(legacy) as Design);
        const p = defaultProject();
        p.rooms[0] = { ...d, type: 'kitchen' };
        return { projectName: p.name, rooms: p.rooms, active: 0 };
      }
    } catch { /* ignore */ }
  }
  const p = defaultProject();
  return { projectName: p.name, rooms: p.rooms, active: 0 };
}

const initial = loadInitial();

export const useStore = create<State>((set, get) => ({
  projectName: initial.projectName,
  rooms: initial.rooms,
  active: initial.active,
  design: initial.rooms[initial.active],
  selectedId: null,
  view: 'split',
  past: [],
  future: [],

  allRooms: () => {
    const { rooms, active, design } = get();
    return rooms.map((r, i) => (i === active ? design : r));
  },
  switchRoom: (i) => {
    const s = get();
    if (i === s.active || i < 0 || i >= s.rooms.length) return;
    const rooms = s.allRooms();
    set({ rooms, active: i, design: rooms[i], selectedId: null, past: [], future: [] });
  },
  addRoom: (d) => {
    const rooms = [...get().allRooms(), normalizeDesign({ ...d, id: uid() })];
    set({ rooms, active: rooms.length - 1, design: rooms[rooms.length - 1], selectedId: null, past: [], future: [] });
  },
  removeRoom: (i) => {
    const s = get();
    if (s.rooms.length <= 1) return;
    const rooms = s.allRooms().filter((_, k) => k !== i);
    const active = Math.min(i === s.active ? Math.max(0, i - 1) : s.active > i ? s.active - 1 : s.active, rooms.length - 1);
    set({ rooms, active, design: rooms[active], selectedId: null, past: [], future: [] });
  },
  renameProject: (projectName) => set({ projectName }),
  loadProject: (p) => {
    const rooms = p.rooms.map(normalizeDesign);
    set({ projectName: p.name, rooms, active: 0, design: rooms[0], selectedId: null, past: [], future: [] });
  },

  select: (id) => set({ selectedId: id }),
  setView: (view) => set({ view }),

  checkpoint: () => set((s) => ({ past: [...s.past.slice(-99), clone(s.design)], future: [] })),

  addItem: (kind, at) => {
    const { design } = get();
    get().checkpoint();
    const room = design.room;
    const first = placeNew(kind, at?.x ?? room.width / 2, at?.y ?? room.length / 2, room);
    let it = first;
    // When added with the button, slide along until it finds a free spot inside the room.
    const clashes = (c: Item) => design.items.some((o) => !catalogByKind[o.kind]?.noCollide && catalogByKind[o.kind]?.mount !== 'opening'
      && o.elevation < c.elevation + c.h && c.elevation < o.elevation + o.h && rectsOverlap(bounds(o), bounds(c)));
    const inside = (c: Item) => { const b = bounds(c); return b.x1 >= -1 && b.y1 >= -1 && b.x2 <= room.width + 1 && b.y2 <= room.length + 1; };
    if (!at && clashes(it)) {
      let found: Item | null = null;
      for (let k = 1; k <= 40 && !found; k++) {
        for (const dir of [1, -1]) {
          const cand = { ...first, ...(first.rot % 180 === 0 ? { x: first.x + dir * k * 100 } : { y: first.y + dir * k * 100 }) };
          if (inside(cand) && !clashes(cand)) { found = cand; break; }
        }
      }
      it = found ?? first;
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
  load: (d) => { get().checkpoint(); set((s) => ({ design: normalizeDesign({ ...d, id: s.design.id }), selectedId: null })); },

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

export function currentProject(): Project {
  const s = useStore.getState();
  return { version: 2, name: s.projectName, rooms: s.allRooms() };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function startAutosave() {
  return useStore.subscribe((s, prev) => {
    if (s.design === prev.design && s.rooms === prev.rooms && s.active === prev.active && s.projectName === prev.projectName) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...currentProject(), active: useStore.getState().active })); } catch { /* quota */ }
    }, 400);
  });
}

/** Shared drag payload between the catalog (HTML5 DnD) and both views. */
export const DND_MIME = 'application/x-interior-kind';
