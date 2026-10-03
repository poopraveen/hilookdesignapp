import { catalogByKind } from './catalog';
import type { Item, Room } from './types';

export interface Rect { x1: number; y1: number; x2: number; y2: number }

/** Footprint size in plan, taking the 90° rotation into account. */
export function footprint(it: Pick<Item, 'w' | 'd' | 'rot'>) {
  const turned = ((it.rot % 180) + 180) % 180 === 90;
  return { fw: turned ? it.d : it.w, fd: turned ? it.w : it.d };
}

export function bounds(it: Pick<Item, 'x' | 'y' | 'w' | 'd' | 'rot'>): Rect {
  const { fw, fd } = footprint(it);
  return { x1: it.x - fw / 2, y1: it.y - fd / 2, x2: it.x + fw / 2, y2: it.y + fd / 2 };
}

export function rectsOverlap(a: Rect, b: Rect, eps = 1) {
  return a.x1 < b.x2 - eps && a.x2 > b.x1 + eps && a.y1 < b.y2 - eps && a.y2 > b.y1 + eps;
}

function verticalOverlap(a: Item, b: Item) {
  return a.elevation < b.elevation + b.h - 1 && b.elevation < a.elevation + a.h - 1;
}

const ignores = (it: Item) => !!catalogByKind[it.kind]?.noCollide || catalogByKind[it.kind]?.mount === 'opening';

/** Ids of items that clash with another item (same floor area and height band). */
export function findCollisions(items: Item[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    if (ignores(a)) continue;
    for (let j = i + 1; j < items.length; j++) {
      const b = items[j];
      if (ignores(b)) continue;
      if (verticalOverlap(a, b) && rectsOverlap(bounds(a), bounds(b))) {
        out.add(a.id);
        out.add(b.id);
      }
    }
  }
  return out;
}

export function outOfRoom(it: Item, room: Room) {
  const r = bounds(it);
  return r.x1 < -1 || r.y1 < -1 || r.x2 > room.width + 1 || r.y2 > room.length + 1;
}

/** Rotation that puts the back of the unit against the nearest wall. */
export function rotationForNearestWall(x: number, y: number, room: Room): number {
  const d = [
    { rot: 0, dist: y },                  // top wall  -> front faces down
    { rot: 90, dist: room.width - x },    // right wall -> front faces left
    { rot: 180, dist: room.length - y },  // bottom wall
    { rot: 270, dist: x },                // left wall
  ];
  d.sort((a, b) => a.dist - b.dist);
  return d[0].rot;
}

export interface SnapGuide { axis: 'x' | 'y'; at: number }

/**
 * Snap a proposed centre position: walls first, then edges of other items,
 * then the grid. Returns the snapped centre and the guide lines that fired.
 */
export function snapPosition(
  it: Item,
  px: number,
  py: number,
  room: Room,
  others: Item[],
  opts: { snap: boolean; grid: number; threshold: number },
) {
  const { fw, fd } = footprint(it);
  let x = px;
  let y = py;
  const guides: SnapGuide[] = [];
  if (!opts.snap) return { x: Math.round(x), y: Math.round(y), guides };

  const t = opts.threshold;
  const xTargets: number[] = [0, room.width];
  const yTargets: number[] = [0, room.length];
  for (const o of others) {
    const r = bounds(o);
    xTargets.push(r.x1, r.x2);
    yTargets.push(r.y1, r.y2);
  }

  const bestX = bestSnap([x - fw / 2, x + fw / 2], xTargets, t);
  if (bestX) { x += bestX.delta; guides.push({ axis: 'x', at: bestX.target }); }
  else x = Math.round(x / opts.grid) * opts.grid;

  const bestY = bestSnap([y - fd / 2, y + fd / 2], yTargets, t);
  if (bestY) { y += bestY.delta; guides.push({ axis: 'y', at: bestY.target }); }
  else y = Math.round(y / opts.grid) * opts.grid;

  return { x: Math.round(x), y: Math.round(y), guides };
}

function bestSnap(edges: number[], targets: number[], t: number) {
  let best: { delta: number; target: number } | null = null;
  for (const e of edges) {
    for (const tg of targets) {
      const delta = tg - e;
      if (Math.abs(delta) <= t && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, target: tg };
    }
  }
  return best;
}

/** Keep openings (doors/windows) stuck inside a wall. */
export function attachToWall(it: Item, room: Room): Pick<Item, 'x' | 'y' | 'rot'> {
  const rot = rotationForNearestWall(it.x, it.y, room);
  const mid = room.wall / 2; // centre line of the wall
  const clampX = (v: number) => Math.round(Math.min(Math.max(v, it.w / 2), room.width - it.w / 2));
  const clampY = (v: number) => Math.round(Math.min(Math.max(v, it.w / 2), room.length - it.w / 2));
  if (rot === 0) return { x: clampX(it.x), y: -mid, rot };
  if (rot === 180) return { x: clampX(it.x), y: room.length + mid, rot };
  if (rot === 90) return { x: room.width + mid, y: clampY(it.y), rot };
  return { x: -mid, y: clampY(it.y), rot };
}

export function distancesToWalls(it: Item, room: Room) {
  const r = bounds(it);
  return { left: r.x1, right: room.width - r.x2, top: r.y1, bottom: room.length - r.y2 };
}

export const mmToFtIn = (mm: number) => {
  const totalIn = Math.round(mm / 25.4);
  const ft = Math.floor(totalIn / 12);
  const inch = totalIn - ft * 12;
  return `${ft}'-${inch}"`;
};

export const isOpening = (it: Pick<Item, 'kind'>) => catalogByKind[it.kind]?.mount === 'opening';

export const uid = () => Math.random().toString(36).slice(2, 9);
