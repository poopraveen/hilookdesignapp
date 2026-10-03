import { catalogByKind, DEFAULT_RATES } from './catalog';
import type { Design, Item, Kind, Room, Settings } from './types';

let n = 0;
function mk(kind: Kind, x: number, y: number, rot: number, over: Partial<Item> = {}): Item {
  const c = catalogByKind[kind];
  n += 1;
  return {
    id: `p${n}`, kind, name: c.name, x, y, rot,
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

/**
 * The 7 ft x 10 ft L-shaped "Sage & Oak" kitchen.
 * Top wall (y = 0) = 7 ft window/sink wall, left wall (x = 0) = 10 ft hob wall,
 * door on the bottom wall.
 */
export function kitchen7x10(): Design {
  n = 0;
  const room: Room = { width: 2134, length: 3048, height: 2438, wall: 230, floorColor: '#D9D4CC', wallColor: '#F4F2EE' };
  const D = 580; // base depth
  const WD = 350; // wall-unit depth
  const L = 270;  // rotation for units on the left wall (front faces into the room)
  const items: Item[] = [
    // top wall base run (front faces down)
    mk('base_corner', 450, D / 2, 0),
    mk('base_sink', 1350, D / 2, 0),
    mk('base_drawer', 1967, D / 2, 0, { w: 334 }),
    // left wall base run
    mk('base_drawer', D / 2, 580 + 225, L, { w: 450 }),
    mk('base_hob', D / 2, 1030 + 450, L),
    mk('base_pullout', D / 2, 1930 + 100, L),
    mk('fridge', 350, 2130 + 350, L),
    // wall units
    mk('wall_cab', 300, WD / 2, 0),
    mk('wall_cab', 1967, WD / 2, 0, { w: 334 }),
    mk('wall_glass', WD / 2, 350 + 300, L),
    mk('chimney', 240, 1480, L),
    mk('wall_cab', WD / 2, 1780 + 175, L, { w: 350 }),
    // lofts
    mk('loft', 533.5, WD / 2, 0, { w: 1067 }),
    mk('loft', 1600.5, WD / 2, 0, { w: 1067 }),
    mk('loft', WD / 2, 350 + 550, L, { w: 1100 }),
    mk('loft', WD / 2, 1450 + 340, L, { w: 680 }),
    mk('loft', WD / 2, 2130 + 350, L, { w: 700 }),
    // openings
    mk('window', 1371, -room.wall / 2, 0, { w: 800 }),
    mk('door', 1700, room.length + room.wall / 2, 180, { w: 800 }),
  ];
  return { version: 1, name: '7x10 L-shaped kitchen — Sage & Oak', room, items, settings: { ...DEFAULT_SETTINGS }, rates: structuredClone(DEFAULT_RATES) };
}

export function emptyRoom(width = 3600, length = 4200): Design {
  return {
    version: 1,
    name: 'New room',
    room: { width, length, height: 2700, wall: 230, floorColor: '#D9D4CC', wallColor: '#F4F2EE' },
    items: [mk('door', width - 600, length + 115, 180)],
    settings: { ...DEFAULT_SETTINGS },
    rates: structuredClone(DEFAULT_RATES),
  };
}
