import { catalogByKind, withDefaultRates } from './catalog';
import { uid } from './geometry';
import type { Design, Item, Kind, Project, Room, RoomType, Settings } from './types';

function mk(kind: Kind, x: number, y: number, rot: number, over: Partial<Item> = {}): Item {
  const c = catalogByKind[kind];
  if (!c) throw new Error(`Unknown component ${kind}`);
  return {
    id: uid(), kind, name: c.name, x, y, rot,
    w: c.w, d: c.d, h: c.h, elevation: c.elevation, color: c.color, finish: c.finish,
    ...over,
  };
}

export const DEFAULT_SETTINGS: Settings = {
  countertop: 'quartz',
  countertopColor: '#ECE9E3',
  snap: true,
  gridMm: 50,
  showDims: true,
  gst: true,
};

const room = (width: number, length: number, height = 2743, floorColor = '#D9D4CC', wallColor = '#F4F2EE'): Room =>
  ({ width, length, height, wall: 230, floorColor, wallColor });

const design = (type: RoomType, name: string, r: Room, items: Item[], settings: Partial<Settings> = {}): Design => ({
  version: 1, id: uid(), type, name, room: r, items, settings: { ...DEFAULT_SETTINGS, ...settings }, rates: withDefaultRates(),
});

/**
 * The 7 ft x 10 ft L-shaped "Sage & Oak" kitchen (the original design).
 * Top wall (y = 0) = 7 ft window/sink wall, left wall (x = 0) = 10 ft hob wall, door on the bottom wall.
 */
export function kitchen7x10(): Design {
  const r = room(2134, 3048, 2438);
  const D = 580;
  const WD = 350;
  const L = 270;
  return design('kitchen', 'Kitchen 7×10 — Sage & Oak', r, [
    mk('base_corner', 450, D / 2, 0),
    mk('base_sink', 1350, D / 2, 0),
    mk('base_drawer', 1967, D / 2, 0, { w: 334 }),
    mk('base_drawer', D / 2, 580 + 225, L, { w: 450 }),
    mk('base_hob', D / 2, 1030 + 450, L),
    mk('base_pullout', D / 2, 1930 + 100, L),
    mk('fridge', 350, 2130 + 350, L),
    mk('wall_cab', 300, WD / 2, 0),
    mk('wall_cab', 1967, WD / 2, 0, { w: 334 }),
    mk('wall_glass', WD / 2, 350 + 300, L),
    mk('chimney', 240, 1480, L),
    mk('wall_cab', WD / 2, 1780 + 175, L, { w: 350 }),
    mk('loft', 533.5, WD / 2, 0, { w: 1067 }),
    mk('loft', 1600.5, WD / 2, 0, { w: 1067 }),
    mk('loft', WD / 2, 350 + 550, L, { w: 1100 }),
    mk('loft', WD / 2, 1450 + 340, L, { w: 680 }),
    mk('loft', WD / 2, 2130 + 350, L, { w: 700 }),
    mk('window', 1371, -r.wall / 2, 0, { w: 800 }),
    mk('door', 1700, r.length + r.wall / 2, 180, { w: 800 }),
  ], { countertop: 'quartz' });
}

/** 12 ft x 16 ft hall: TV wall with fluted panel, L-sofa, pooja unit, shoe rack by the main door. */
export function hall12x16(): Design {
  const r = room(3658, 4877, 2743, '#E2DCD2', '#F5F2EC');
  const W = r.width, L = r.length;
  return design('hall', 'Hall 12×16 — Walnut lounge', r, [
    mk('tv_panel', W / 2, 20, 0),
    mk('tv_unit_wall', W / 2, 190, 0),
    mk('tv55', W / 2, 70, 0),
    mk('soundbar', W / 2, 90, 0),
    mk('sofa_l', 1500, L - 850, 180),
    mk('rug', 1550, 2900, 90),
    mk('coffee_table', 1500, 2650, 0),
    mk('floor_lamp', 300, 2950, 0),
    mk('side_table', 3050, 3300, 0),
    mk('wall_art', 1500, L - 15, 180),
    mk('pooja', W - 225, 1000, 90),
    mk('shoe_rack', W - 175, 2950, 90),
    mk('plant_big', 300, 300, 0),
    mk('ac_split', 115, 3500, 270),
    mk('window_slide', -r.wall / 2, 1800, 270),
    mk('curtain', 60, 1800, 270),
    mk('door_main', W + r.wall / 2, 4200, 90),
  ], { countertop: 'none' });
}

/** 11 ft x 12 ft bedroom: queen bed, sliding wardrobe with loft, dresser, AC, curtains. */
export function bedroom11x12(): Design {
  const r = room(3353, 3658, 2743, '#D8CDBE', '#EFEAE3');
  const W = r.width, L = r.length;
  return design('bedroom', 'Bedroom 11×12 — Calm neutrals', r, [
    mk('bed_queen', W / 2, 1015, 0),
    mk('bedside', W / 2 - 762 - 225, 200, 0),
    mk('bedside', W / 2 + 762 + 225, 200, 0),
    mk('wall_art', W / 2, 15, 0, { elevation: 1250 }),
    mk('ac_split', W / 2, 115, 0, { elevation: 2150 }),
    mk('rug', W / 2, 1500, 90, { color: '#B9AE9C' }),
    mk('wardrobe_sliding', W / 2, L - 325, 180),
    mk('wardrobe_loft', W / 2, L - 300, 180, { w: 2400 }),
    mk('dresser', 210, 2400, 270),
    mk('plant_big', W - 300, L - 900, 0),
    mk('window', -r.wall / 2, 1000, 270, { w: 1200 }),
    mk('curtain', 60, 1000, 270, { w: 1600 }),
    mk('door', W + r.wall / 2, 2300, 90),
  ], { countertop: 'none' });
}

export function emptyRoom(type: RoomType = 'other', width = 3600, length = 4200): Design {
  const names: Record<RoomType, string> = { kitchen: 'New kitchen', hall: 'New hall', bedroom: 'New bedroom', other: 'New room' };
  const r = room(width, length);
  return design(type, names[type], r, [mk('door', width - 600, length + r.wall / 2, 180)], { countertop: type === 'kitchen' ? 'quartz' : 'none' });
}

export const ROOM_TEMPLATES: { id: string; label: string; make: () => Design }[] = [
  { id: 'kitchen7x10', label: 'Kitchen 7×10 (Sage & Oak)', make: kitchen7x10 },
  { id: 'hall12x16', label: 'Hall 12×16 (living room)', make: hall12x16 },
  { id: 'bedroom11x12', label: 'Bedroom 11×12', make: bedroom11x12 },
  { id: 'empty_kitchen', label: 'Empty kitchen', make: () => emptyRoom('kitchen', 2438, 3048) },
  { id: 'empty_hall', label: 'Empty hall', make: () => emptyRoom('hall', 3658, 4877) },
  { id: 'empty_bedroom', label: 'Empty bedroom', make: () => emptyRoom('bedroom', 3353, 3658) },
];

export function defaultProject(): Project {
  return { version: 2, name: 'My home — HiLook Design', rooms: [kitchen7x10(), hall12x16(), bedroom11x12()] };
}

/** Bring an older or imported design up to date (new rates, ids, room type). */
export function normalizeDesign(d: Design): Design {
  const type: RoomType = d.type ?? (d.items.some((i) => i.kind.startsWith('base_')) ? 'kitchen' : 'other');
  return {
    ...d,
    version: 1,
    id: d.id ?? uid(),
    type,
    settings: { ...DEFAULT_SETTINGS, ...d.settings },
    rates: withDefaultRates(d.rates),
    items: d.items.filter((i) => catalogByKind[i.kind]),
  };
}
