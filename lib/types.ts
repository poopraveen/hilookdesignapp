// All dimensions are millimetres. Plan coordinates: origin = inner top-left corner
// of the room, x to the right, y downwards (towards the door). 3D: X = x, Z = y, Y up.

export type Category =
  | 'kitchen_base' | 'kitchen_wall' | 'kitchen_tall' | 'appliance'
  | 'living' | 'dining' | 'bedroom' | 'storage' | 'decor' | 'opening';

export type Kind = string;

export type RoomType = 'kitchen' | 'hall' | 'bedroom' | 'other';

/** How an item is placed: against a wall on the floor, hung on a wall, free-standing, or cut into a wall. */
export type Mount = 'floor-wall' | 'wall' | 'free' | 'opening';

/** Which 3D/plan drawing style an item uses. */
export type Model =
  | 'cabinet' | 'appliance' | 'table' | 'chair' | 'stool' | 'sofa' | 'lsofa' | 'bed' | 'bunk'
  | 'shelf' | 'panel' | 'partition' | 'plant' | 'rug' | 'lamp' | 'mirror' | 'curtain' | 'art'
  | 'beanbag' | 'pouf' | 'opening' | 'box';

export type FinishId =
  | 'ply_laminate' | 'ply_acrylic' | 'hdhmr_pu' | 'fluted_glass' | 'veneer'
  | 'mdf_laminate' | 'glass_profile' | 'cnc_jaali';

export interface CabinetLayout {
  cols?: number;          // doors side by side
  rows?: number[];        // drawer stack, relative heights, top first
  extra?: 'sink' | 'hob' | 'glass' | 'open' | 'oven' | 'niche' | 'mirror' | 'arch' | 'lift';
  plinth?: boolean;
  handles?: 'gola' | 'bar' | 'none';
}

export interface CatalogItem {
  kind: Kind;
  name: string;
  short: string;          // label on the plan
  category: Category;
  model: Model;
  variant?: string;       // model-specific variation (fridge, tv, ac, round, storage…)
  layout?: CabinetLayout; // for model 'cabinet'
  mount: Mount;
  w: number;              // width (along the front)
  d: number;              // depth (front to back)
  h: number;              // height
  elevation: number;      // bottom height above floor
  color: string;
  finish?: FinishId;      // priced per sq ft of front area
  hasCounter?: boolean;   // base units carry the countertop
  addOnKey?: string;      // hardware/appliance included with the unit (rates.fixed)
  price?: number;         // whole item priced as a fixed rate (rates.fixed[kind])
  noCollide?: boolean;
  minW?: number;
  maxW?: number;
  description: string;
}

export interface Item {
  id: string;
  kind: Kind;
  name: string;
  x: number;        // centre in plan
  y: number;        // centre in plan
  rot: number;      // 0 | 90 | 180 | 270, clockwise in plan; front faces +y at 0
  w: number;
  d: number;
  h: number;
  elevation: number;
  color: string;
  finish?: FinishId;
  locked?: boolean;
}

export interface Room {
  width: number;   // x
  length: number;  // y
  height: number;
  wall: number;    // wall thickness, drawn outside the room
  floorColor: string;
  wallColor: string;
}

export interface Settings {
  countertop: 'granite' | 'quartz' | 'none';
  countertopColor: string;
  snap: boolean;
  gridMm: number;
  showDims: boolean;
  gst: boolean;
}

export interface Rates {
  finish: Record<FinishId, { label: string; perSqft: number }>;
  countertop: Record<'granite' | 'quartz', { label: string; perRft: number }>;
  fixed: Record<string, { label: string; amount: number }>;
  installationPct: number;
  gstPct: number;
}

export interface Design {
  version: 1;
  id?: string;
  type?: RoomType;
  name: string;
  room: Room;
  items: Item[];
  settings: Settings;
  rates: Rates;
}

export interface Project {
  version: 2;
  name: string;
  rooms: Design[];
}
