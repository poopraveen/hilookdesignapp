import type { CatalogItem, Category, Rates } from './types';

export const SAGE = '#5F7059';
export const OFFWHITE = '#EEEAE2';
export const OAK = '#B88A5A';

export const CATEGORY_LABEL: Record<Category, string> = {
  base: 'Base units',
  wall: 'Wall units & loft',
  tall: 'Tall units',
  appliance: 'Appliances',
  furniture: 'Furniture',
  opening: 'Doors & windows',
};

export const CATALOG: CatalogItem[] = [
  // ---- Base units (countertop on top) -------------------------------------------
  { kind: 'base_drawer', name: 'Drawer unit (3 drawers)', category: 'base', w: 600, d: 580, h: 844, elevation: 0, color: SAGE, finish: 'ply_acrylic', hasCounter: true, addOnKey: 'tandem_drawers', minW: 300, maxW: 1000, description: 'Tandem soft-close drawers for cutlery and plates' },
  { kind: 'base_door', name: 'Base cabinet (2 doors)', category: 'base', w: 800, d: 580, h: 844, elevation: 0, color: SAGE, finish: 'ply_acrylic', hasCounter: true, minW: 300, maxW: 1200, description: 'Shutter cabinet with one shelf' },
  { kind: 'base_sink', name: 'Sink unit + sink', category: 'base', w: 900, d: 580, h: 844, elevation: 0, color: SAGE, finish: 'ply_acrylic', hasCounter: true, addOnKey: 'sink', minW: 600, maxW: 1200, description: 'Single-bowl steel sink, waterproof BWP carcass' },
  { kind: 'base_hob', name: 'Hob unit + 3-burner hob', category: 'base', w: 900, d: 580, h: 844, elevation: 0, color: SAGE, finish: 'ply_acrylic', hasCounter: true, addOnKey: 'hob', minW: 750, maxW: 1200, description: 'Deep drawers for kadai, cooker and tawa' },
  { kind: 'base_corner', name: 'Corner unit (magic corner)', category: 'base', w: 900, d: 580, h: 844, elevation: 0, color: SAGE, finish: 'ply_acrylic', hasCounter: true, addOnKey: 'magic_corner', minW: 800, maxW: 1100, description: 'Swing-out magic corner for blind corners' },
  { kind: 'base_pullout', name: 'Bottle pull-out', category: 'base', w: 200, d: 580, h: 844, elevation: 0, color: SAGE, finish: 'ply_acrylic', hasCounter: true, addOnKey: 'bottle_pullout', minW: 150, maxW: 300, description: 'Narrow pull-out for oil and spice bottles' },

  // ---- Wall units ------------------------------------------------------------------
  { kind: 'wall_cab', name: 'Wall cabinet', category: 'wall', w: 600, d: 350, h: 760, elevation: 1423, color: OFFWHITE, finish: 'ply_acrylic', minW: 300, maxW: 1200, description: 'Mounted 22" above counter' },
  { kind: 'wall_glass', name: 'Fluted glass wall cabinet', category: 'wall', w: 600, d: 350, h: 760, elevation: 1423, color: OAK, finish: 'fluted_glass', minW: 300, maxW: 1000, description: 'Oak frame with fluted glass shutter' },
  { kind: 'wall_shelf', name: 'Open oak shelf', category: 'wall', w: 900, d: 250, h: 40, elevation: 1550, color: OAK, finish: 'veneer', minW: 300, maxW: 1800, description: 'Floating shelf for display' },
  { kind: 'loft', name: 'Loft unit', category: 'wall', w: 900, d: 350, h: 250, elevation: 2185, color: OFFWHITE, finish: 'ply_laminate', minW: 300, maxW: 1200, description: 'Top storage up to the ceiling' },

  // ---- Tall units --------------------------------------------------------------------
  { kind: 'tall_pantry', name: 'Tall pantry unit', category: 'tall', w: 600, d: 580, h: 2150, elevation: 0, color: SAGE, finish: 'ply_acrylic', addOnKey: 'pantry_rack', minW: 450, maxW: 900, description: 'Full-height pull-out pantry' },
  { kind: 'tall_oven', name: 'Oven / microwave tower', category: 'tall', w: 600, d: 580, h: 2150, elevation: 0, color: SAGE, finish: 'ply_acrylic', minW: 600, maxW: 700, description: 'Built-in niche for OTG or microwave' },

  // ---- Appliances ------------------------------------------------------------------------
  { kind: 'fridge', name: 'Refrigerator', category: 'appliance', w: 700, d: 700, h: 1800, elevation: 0, color: '#C9CDD0', fixedKey: 'fridge', description: 'Double-door fridge (set ₹0 if you already own one)' },
  { kind: 'chimney', name: 'Chimney 60 cm', category: 'appliance', w: 600, d: 480, h: 620, elevation: 1564, color: '#2F3236', fixedKey: 'chimney', description: 'Auto-clean, filterless' },
  { kind: 'dishwasher', name: 'Dishwasher', category: 'appliance', w: 600, d: 580, h: 844, elevation: 0, color: '#C9CDD0', fixedKey: 'dishwasher', description: 'Under-counter dishwasher' },
  { kind: 'microwave', name: 'Microwave (countertop)', category: 'appliance', w: 500, d: 380, h: 300, elevation: 864, color: '#2A2C2E', fixedKey: 'microwave', description: 'Sits on the counter' },

  // ---- Furniture ---------------------------------------------------------------------------
  { kind: 'dining_table', name: 'Dining table (4 seat)', category: 'furniture', w: 1200, d: 750, h: 750, elevation: 0, color: OAK, fixedKey: 'dining_table', description: 'Solid wood top' },
  { kind: 'chair', name: 'Dining chair', category: 'furniture', w: 450, d: 480, h: 900, elevation: 0, color: '#3B3B3B', fixedKey: 'chair', description: 'Upholstered seat' },
  { kind: 'sofa', name: 'Sofa (3 seater)', category: 'furniture', w: 2000, d: 850, h: 800, elevation: 0, color: '#7D8A92', fixedKey: 'sofa', description: 'Fabric sofa' },
  { kind: 'bed', name: 'Queen bed', category: 'furniture', w: 1600, d: 2050, h: 450, elevation: 0, color: '#9C7B5B', fixedKey: 'bed', description: 'With headboard' },
  { kind: 'wardrobe', name: 'Wardrobe (3 door)', category: 'furniture', w: 1800, d: 600, h: 2100, elevation: 0, color: OFFWHITE, finish: 'ply_laminate', minW: 900, maxW: 3000, description: 'Priced per sq ft like cabinets' },
  { kind: 'tv_unit', name: 'TV unit', category: 'furniture', w: 1800, d: 400, h: 450, elevation: 0, color: OAK, finish: 'veneer', minW: 1200, maxW: 2400, description: 'Low console with drawers' },
  { kind: 'rug', name: 'Rug', category: 'furniture', w: 1600, d: 2300, h: 10, elevation: 0, color: '#C9B79C', fixedKey: 'rug', description: 'Area rug' },
  { kind: 'plant', name: 'Indoor plant', category: 'furniture', w: 400, d: 400, h: 1100, elevation: 0, color: '#4E7A4A', fixedKey: 'plant', description: 'Potted plant' },

  // ---- Openings ------------------------------------------------------------------------------
  { kind: 'door', name: 'Door', category: 'opening', w: 900, d: 120, h: 2100, elevation: 0, color: '#8B6A4A', fixedKey: 'door', minW: 700, maxW: 1200, description: 'Snaps to a wall' },
  { kind: 'window', name: 'Window', category: 'opening', w: 900, d: 120, h: 1100, elevation: 1000, color: '#9FC3D6', fixedKey: 'window', minW: 500, maxW: 2400, description: 'Snaps to a wall' },
];

export const catalogByKind = Object.fromEntries(CATALOG.map((c) => [c.kind, c])) as Record<string, CatalogItem>;

// Sample Chennai-market rates in INR. Every number is editable in the Rates tab —
// replace them with your carpenter / vendor quotes.
export const DEFAULT_RATES: Rates = {
  finish: {
    ply_laminate: { label: 'BWP plywood + laminate', perSqft: 1450 },
    ply_acrylic: { label: 'BWP plywood + acrylic', perSqft: 2200 },
    hdhmr_pu: { label: 'HDHMR + PU paint', perSqft: 2600 },
    fluted_glass: { label: 'Aluminium/oak frame + fluted glass', perSqft: 2800 },
    veneer: { label: 'Plywood + oak veneer', perSqft: 2400 },
  },
  countertop: {
    granite: { label: 'Granite (black galaxy / tan brown)', perRft: 750 },
    quartz: { label: 'Quartz (white)', perRft: 1900 },
  },
  fixed: {
    tandem_drawers: { label: 'Tandem drawer set', amount: 4500 },
    sink: { label: 'Steel sink + tap', amount: 7500 },
    hob: { label: '3-burner glass hob', amount: 12000 },
    magic_corner: { label: 'Magic corner fitting', amount: 14000 },
    bottle_pullout: { label: 'Bottle pull-out basket', amount: 4500 },
    pantry_rack: { label: 'Pantry pull-out rack', amount: 18000 },
    fridge: { label: 'Refrigerator', amount: 0 },
    chimney: { label: 'Chimney 60 cm', amount: 16000 },
    dishwasher: { label: 'Dishwasher', amount: 38000 },
    microwave: { label: 'Microwave', amount: 9000 },
    dining_table: { label: 'Dining table', amount: 22000 },
    chair: { label: 'Dining chair', amount: 4500 },
    sofa: { label: 'Sofa 3 seater', amount: 35000 },
    bed: { label: 'Queen bed', amount: 32000 },
    rug: { label: 'Rug', amount: 6000 },
    plant: { label: 'Indoor plant', amount: 1500 },
    door: { label: 'Door', amount: 0 },
    window: { label: 'Window', amount: 0 },
    led_per_rft: { label: 'LED strip (per running ft, under wall units)', amount: 450 },
  },
  installationPct: 8,
  gstPct: 18,
};

export const FINISH_IDS = Object.keys(DEFAULT_RATES.finish) as (keyof Rates['finish'])[];

export const SWATCHES = ['#5F7059', '#2F3E52', '#8A5A44', '#3B3B3B', '#EEEAE2', '#F7F5F0', '#D9D4CA', '#B88A5A', '#9C7B5B', '#7D8A92', '#C9CDD0', '#FFFFFF'];
