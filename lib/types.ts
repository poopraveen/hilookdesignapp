// All dimensions are millimetres. Plan coordinates: origin = inner top-left corner
// of the room, x to the right, y downwards (towards the door). 3D: X = x, Z = y, Y up.

export type Category = 'base' | 'wall' | 'tall' | 'appliance' | 'furniture' | 'opening';

export type Kind =
  | 'base_door' | 'base_drawer' | 'base_sink' | 'base_hob' | 'base_corner' | 'base_pullout'
  | 'wall_cab' | 'wall_glass' | 'wall_shelf' | 'loft'
  | 'tall_pantry' | 'tall_oven'
  | 'fridge' | 'chimney' | 'dishwasher' | 'microwave'
  | 'dining_table' | 'chair' | 'sofa' | 'bed' | 'wardrobe' | 'tv_unit' | 'rug' | 'plant'
  | 'door' | 'window';

export type FinishId = 'ply_laminate' | 'ply_acrylic' | 'hdhmr_pu' | 'fluted_glass' | 'veneer';

export interface CatalogItem {
  kind: Kind;
  name: string;
  category: Category;
  w: number;            // width (along the front)
  d: number;            // depth (front to back)
  h: number;            // height
  elevation: number;    // bottom height above floor
  color: string;
  finish?: FinishId;    // for cabinets priced per sq ft of front area
  hasCounter?: boolean; // base units carry the countertop
  addOnKey?: string;    // key into rates.fixed for appliance/accessory included with the unit
  fixedKey?: string;    // whole item priced as a fixed rate (appliances, furniture)
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
  name: string;
  room: Room;
  items: Item[];
  settings: Settings;
  rates: Rates;
}
