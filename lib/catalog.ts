import type { CatalogItem, Category, FinishId, Rates, RoomType } from './types';

export const SAGE = '#5F7059';
export const OFFWHITE = '#EEEAE2';
export const OAK = '#B88A5A';
const WALNUT = '#7A5236';
const TEAK = '#9C6B3F';
const GREY = '#7D8A92';
const CHARCOAL = '#3B3B3B';
const STEEL = '#C9CDD0';
const BLACK = '#2A2C2E';
const BEIGE = '#C9B79C';
const NAVY = '#2F3E52';
const WHITE = '#F7F5F0';

export const CATEGORY_LABEL: Record<Category, string> = {
  kitchen_base: 'Kitchen · base units',
  kitchen_wall: 'Kitchen · wall units',
  kitchen_tall: 'Kitchen · tall units',
  appliance: 'Appliances & electronics',
  living: 'Living room / hall',
  dining: 'Dining',
  bedroom: 'Bedroom',
  storage: 'Storage & utility',
  decor: 'Decor, lighting & soft furnishing',
  opening: 'Doors & windows',
};

/** Category order shown in the component panel for each room type. */
export const CATEGORY_ORDER: Record<RoomType, Category[]> = {
  kitchen: ['kitchen_base', 'kitchen_wall', 'kitchen_tall', 'appliance', 'dining', 'storage', 'decor', 'opening', 'living', 'bedroom'],
  hall: ['living', 'dining', 'storage', 'decor', 'appliance', 'opening', 'bedroom', 'kitchen_base', 'kitchen_wall', 'kitchen_tall'],
  bedroom: ['bedroom', 'storage', 'decor', 'appliance', 'opening', 'living', 'dining', 'kitchen_base', 'kitchen_wall', 'kitchen_tall'],
  other: ['living', 'bedroom', 'dining', 'storage', 'decor', 'appliance', 'opening', 'kitchen_base', 'kitchen_wall', 'kitchen_tall'],
};

// Shorthands --------------------------------------------------------------------
const base = (o: Partial<CatalogItem> & Pick<CatalogItem, 'kind' | 'name' | 'short' | 'description'>): CatalogItem => ({
  category: 'kitchen_base', model: 'cabinet', mount: 'floor-wall', w: 600, d: 580, h: 844, elevation: 0,
  color: SAGE, finish: 'ply_acrylic', hasCounter: true, minW: 150, maxW: 1200, layout: { cols: 2, plinth: true, handles: 'gola' }, ...o,
});
const wallU = (o: Partial<CatalogItem> & Pick<CatalogItem, 'kind' | 'name' | 'short' | 'description'>): CatalogItem => ({
  category: 'kitchen_wall', model: 'cabinet', mount: 'wall', w: 600, d: 350, h: 760, elevation: 1423,
  color: OFFWHITE, finish: 'ply_acrylic', minW: 300, maxW: 1200, layout: { cols: 2, handles: 'none' }, ...o,
});
const fixed = (o: Partial<CatalogItem> & Pick<CatalogItem, 'kind' | 'name' | 'short' | 'description' | 'category' | 'model' | 'w' | 'd' | 'h' | 'price'>): CatalogItem => ({
  mount: 'free', elevation: 0, color: CHARCOAL, ...o,
});
const joinery = (o: Partial<CatalogItem> & Pick<CatalogItem, 'kind' | 'name' | 'short' | 'description' | 'category' | 'w' | 'd' | 'h'>): CatalogItem => ({
  model: 'cabinet', mount: 'floor-wall', elevation: 0, color: OFFWHITE, finish: 'ply_laminate', minW: 300, maxW: 3600,
  layout: { cols: 2, handles: 'bar' }, ...o,
});

export const CATALOG: CatalogItem[] = [
  // ================= Kitchen · base units (countertop on top) =================
  base({ kind: 'base_drawer', name: 'Drawer unit (3 drawers)', short: 'Drawers', w: 600, layout: { rows: [1, 1, 2], plinth: true, handles: 'gola' }, addOnKey: 'tandem_drawers', minW: 300, maxW: 1000, description: 'Tandem soft-close drawers for cutlery, plates and pots' }),
  base({ kind: 'base_door', name: 'Base cabinet (2 doors)', short: 'Base unit', w: 800, description: 'Shutter cabinet with one shelf' }),
  base({ kind: 'base_single', name: 'Base cabinet (1 door)', short: 'Base 1-door', w: 450, layout: { cols: 1, plinth: true, handles: 'gola' }, minW: 300, maxW: 600, description: 'Narrow single-shutter cabinet' }),
  base({ kind: 'base_sink', name: 'Sink unit + sink', short: 'Sink', w: 900, layout: { cols: 2, plinth: true, handles: 'gola', extra: 'sink' }, addOnKey: 'sink', minW: 600, maxW: 1200, description: 'Single-bowl steel sink, waterproof BWP carcass' }),
  base({ kind: 'base_sink_double', name: 'Double-bowl sink unit', short: 'Double sink', w: 1200, layout: { cols: 2, plinth: true, handles: 'gola', extra: 'sink' }, addOnKey: 'sink_double', minW: 1000, maxW: 1500, description: 'Two-bowl sink with drainboard' }),
  base({ kind: 'base_hob', name: 'Hob unit + 3-burner hob', short: 'Hob', w: 900, layout: { rows: [1, 1], plinth: true, handles: 'gola', extra: 'hob' }, addOnKey: 'hob', minW: 750, maxW: 1200, description: 'Deep drawers for kadai, cooker and tawa' }),
  base({ kind: 'base_hob4', name: 'Hob unit + 4-burner hob', short: '4-burner hob', w: 900, layout: { rows: [1, 1], plinth: true, handles: 'gola', extra: 'hob' }, addOnKey: 'hob4', minW: 800, maxW: 1200, description: '4-burner auto-ignition glass hob' }),
  base({ kind: 'base_corner', name: 'Corner unit (magic corner)', short: 'Magic corner', w: 900, layout: { cols: 1, plinth: true, handles: 'gola' }, addOnKey: 'magic_corner', minW: 800, maxW: 1100, description: 'Swing-out magic corner for blind corners' }),
  base({ kind: 'base_carousel', name: 'Corner carousel (LeMans)', short: 'LeMans', w: 1000, layout: { cols: 1, plinth: true, handles: 'gola' }, addOnKey: 'lemans', minW: 900, maxW: 1100, description: 'Kidney-shaped swing-out trays' }),
  base({ kind: 'base_pullout', name: 'Bottle pull-out', short: 'Pull-out', w: 200, layout: { cols: 1, plinth: true, handles: 'gola' }, addOnKey: 'bottle_pullout', minW: 150, maxW: 300, description: 'Narrow pull-out for oil and spice bottles' }),
  base({ kind: 'base_thali', name: 'Cup-saucer & thali basket unit', short: 'Thali basket', w: 600, layout: { rows: [1, 1, 1], plinth: true, handles: 'gola' }, addOnKey: 'thali_basket', minW: 450, maxW: 900, description: 'SS thali, plate and cup-saucer baskets' }),
  base({ kind: 'base_cylinder', name: 'Gas cylinder trolley unit', short: 'Cylinder', w: 450, layout: { cols: 1, plinth: true, handles: 'gola' }, addOnKey: 'cylinder_trolley', minW: 400, maxW: 600, description: 'Pull-out trolley for LPG cylinder' }),
  base({ kind: 'base_wicker', name: 'Wicker basket unit', short: 'Wicker', w: 600, layout: { rows: [1, 1, 1], plinth: true, handles: 'gola' }, addOnKey: 'wicker', minW: 450, maxW: 900, description: 'Ventilated baskets for onion, potato, veg' }),
  base({ kind: 'base_dustbin', name: 'Dustbin pull-out unit', short: 'Dustbin', w: 450, layout: { cols: 1, plinth: true, handles: 'gola' }, addOnKey: 'dustbin', minW: 300, maxW: 600, description: 'Twin-bin pull-out under the sink side' }),
  base({ kind: 'base_open', name: 'Open end shelf', short: 'Open shelf', w: 300, layout: { extra: 'open', plinth: true, handles: 'none' }, finish: 'veneer', color: OAK, minW: 200, maxW: 450, description: 'Rounded open shelves to finish a run' }),
  base({ kind: 'island', name: 'Kitchen island / breakfast counter', short: 'Island', mount: 'free', w: 1500, d: 900, layout: { cols: 3, plinth: true, handles: 'gola' }, minW: 900, maxW: 2400, description: 'Free-standing island with storage' }),

  // ================= Kitchen · wall units =================
  wallU({ kind: 'wall_cab', name: 'Wall cabinet', short: 'Wall unit', description: 'Mounted 22" above counter' }),
  wallU({ kind: 'wall_glass', name: 'Fluted glass wall cabinet', short: 'Glass unit', color: OAK, finish: 'fluted_glass', layout: { extra: 'glass' }, minW: 300, maxW: 1000, description: 'Oak frame with fluted glass shutter' }),
  wallU({ kind: 'wall_profile', name: 'Aluminium profile glass cabinet', short: 'Profile unit', color: '#B08D57', finish: 'glass_profile', layout: { extra: 'glass' }, description: 'Champagne-gold profile with tinted glass' }),
  wallU({ kind: 'wall_lift', name: 'Lift-up wall cabinet', short: 'Lift-up', h: 400, elevation: 1783, layout: { cols: 1, extra: 'lift' }, addOnKey: 'lift_up', minW: 600, maxW: 1200, description: 'Gas-strut flap-up door (Aventos style)' }),
  wallU({ kind: 'wall_shelf', name: 'Open floating shelf', short: 'Shelf', model: 'shelf', variant: 'floating', w: 900, d: 250, h: 40, elevation: 1550, color: OAK, finish: 'veneer', minW: 300, maxW: 1800, description: 'Floating shelf for display' }),
  wallU({ kind: 'loft', name: 'Loft unit', short: 'Loft', h: 250, elevation: 2185, finish: 'ply_laminate', minW: 300, maxW: 1200, layout: { cols: 2 }, description: 'Top storage up to the ceiling' }),
  wallU({ kind: 'spice_rack', name: 'Wall spice rack', short: 'Spice rack', model: 'shelf', variant: 'rack', w: 600, d: 120, h: 450, elevation: 1000, color: '#9AA0A5', finish: undefined, price: 3500, minW: 300, maxW: 900, description: 'SS rail rack on the backsplash' }),

  // ================= Kitchen · tall units =================
  base({ kind: 'tall_pantry', name: 'Tall pantry unit', short: 'Pantry', category: 'kitchen_tall', h: 2150, hasCounter: false, layout: { cols: 2, plinth: true, handles: 'bar' }, addOnKey: 'pantry_rack', minW: 450, maxW: 900, description: 'Full-height pull-out pantry' }),
  base({ kind: 'tall_oven', name: 'Oven / microwave tower', short: 'Oven tower', category: 'kitchen_tall', h: 2150, hasCounter: false, layout: { plinth: true, handles: 'bar', extra: 'oven' }, minW: 600, maxW: 700, description: 'Built-in niche for OTG or microwave' }),
  base({ kind: 'tall_fridge', name: 'Fridge surround + loft', short: 'Fridge niche', category: 'kitchen_tall', w: 800, d: 600, h: 2150, hasCounter: false, layout: { extra: 'niche', handles: 'bar' }, minW: 700, maxW: 1100, description: 'Side panels and top loft around the fridge' }),
  base({ kind: 'tall_broom', name: 'Broom & utility tall unit', short: 'Broom unit', category: 'kitchen_tall', w: 450, h: 2150, hasCounter: false, layout: { cols: 1, plinth: true, handles: 'bar' }, finish: 'ply_laminate', minW: 300, maxW: 600, description: 'Mop, broom and cleaning supplies' }),

  // ================= Appliances & electronics =================
  fixed({ kind: 'fridge', name: 'Refrigerator (double door)', short: 'Fridge', category: 'appliance', model: 'appliance', variant: 'fridge', mount: 'floor-wall', w: 700, d: 700, h: 1800, color: STEEL, price: 0, description: 'Set a price if you are buying a new one' }),
  fixed({ kind: 'fridge_single', name: 'Refrigerator (single door)', short: 'Fridge', category: 'appliance', model: 'appliance', variant: 'fridge1', mount: 'floor-wall', w: 600, d: 650, h: 1450, color: '#8E3B3B', price: 0, description: 'Direct-cool single door' }),
  fixed({ kind: 'fridge_sbs', name: 'Refrigerator (side-by-side)', short: 'SBS fridge', category: 'appliance', model: 'appliance', variant: 'fridge', mount: 'floor-wall', w: 910, d: 720, h: 1780, color: '#4A4F54', price: 0, description: 'Side-by-side frost-free' }),
  fixed({ kind: 'chimney', name: 'Chimney 60 cm', short: 'Chimney', category: 'appliance', model: 'appliance', variant: 'chimney', mount: 'wall', w: 600, d: 480, h: 620, elevation: 1564, color: '#2F3236', price: 16000, noCollide: true, description: 'Auto-clean, filterless' }),
  fixed({ kind: 'chimney90', name: 'Chimney 90 cm', short: 'Chimney 90', category: 'appliance', model: 'appliance', variant: 'chimney', mount: 'wall', w: 900, d: 480, h: 620, elevation: 1564, color: '#2F3236', price: 22000, noCollide: true, description: 'For 4-burner hobs' }),
  fixed({ kind: 'dishwasher', name: 'Dishwasher', short: 'Dishwasher', category: 'appliance', model: 'appliance', variant: 'dishwasher', mount: 'floor-wall', w: 600, d: 580, h: 844, color: STEEL, price: 38000, description: 'Under-counter dishwasher' }),
  fixed({ kind: 'microwave', name: 'Microwave (countertop)', short: 'Microwave', category: 'appliance', model: 'appliance', variant: 'microwave', w: 500, d: 380, h: 300, elevation: 864, color: BLACK, price: 9000, noCollide: true, description: 'Sits on the counter' }),
  fixed({ kind: 'otg', name: 'OTG oven', short: 'OTG', category: 'appliance', model: 'appliance', variant: 'microwave', w: 520, d: 400, h: 330, elevation: 864, color: '#4A4F54', price: 7500, noCollide: true, description: 'Oven-toaster-grill, countertop' }),
  fixed({ kind: 'purifier', name: 'Water purifier (RO)', short: 'RO', category: 'appliance', model: 'appliance', variant: 'purifier', mount: 'wall', w: 280, d: 260, h: 480, elevation: 1350, color: '#F2F2F0', price: 14000, noCollide: true, description: 'Wall-mounted RO + UV' }),
  fixed({ kind: 'washing_front', name: 'Washing machine (front load)', short: 'Washer', category: 'appliance', model: 'appliance', variant: 'washer', mount: 'floor-wall', w: 600, d: 560, h: 850, color: '#F2F2F0', price: 32000, description: '7–8 kg front load' }),
  fixed({ kind: 'washing_top', name: 'Washing machine (top load)', short: 'Washer', category: 'appliance', model: 'appliance', variant: 'washer_top', mount: 'floor-wall', w: 560, d: 580, h: 950, color: '#E3E6E8', price: 18000, description: 'Fully automatic top load' }),
  fixed({ kind: 'ac_split', name: 'Split AC (indoor unit)', short: 'AC', category: 'appliance', model: 'appliance', variant: 'ac', mount: 'wall', w: 1000, d: 230, h: 320, elevation: 2050, color: '#F7F7F5', price: 42000, noCollide: true, description: '1.5 ton inverter split AC' }),
  fixed({ kind: 'tv55', name: 'LED TV 55"', short: 'TV 55"', category: 'appliance', model: 'appliance', variant: 'tv', mount: 'wall', w: 1230, d: 60, h: 710, elevation: 1000, color: '#111315', price: 45000, noCollide: true, description: 'Wall-mounted, centre at eye level' }),
  fixed({ kind: 'tv43', name: 'LED TV 43"', short: 'TV 43"', category: 'appliance', model: 'appliance', variant: 'tv', mount: 'wall', w: 960, d: 60, h: 560, elevation: 1050, color: '#111315', price: 26000, noCollide: true, description: 'Bedroom size TV' }),
  fixed({ kind: 'tv65', name: 'LED TV 65"', short: 'TV 65"', category: 'appliance', model: 'appliance', variant: 'tv', mount: 'wall', w: 1450, d: 60, h: 830, elevation: 950, color: '#111315', price: 70000, noCollide: true, description: 'Large hall TV' }),
  fixed({ kind: 'soundbar', name: 'Soundbar', short: 'Soundbar', category: 'appliance', model: 'box', mount: 'wall', w: 900, d: 100, h: 70, elevation: 880, color: '#1A1C1E', price: 12000, noCollide: true, description: 'Below the TV' }),

  // ================= Living room / hall =================
  fixed({ kind: 'sofa3', name: 'Sofa (3 seater)', short: 'Sofa 3S', category: 'living', model: 'sofa', variant: '3', mount: 'floor-wall', w: 2000, d: 850, h: 800, color: GREY, price: 35000, minW: 1700, maxW: 2400, description: 'Fabric sofa with cushions' }),
  fixed({ kind: 'sofa2', name: 'Sofa (2 seater)', short: 'Sofa 2S', category: 'living', model: 'sofa', variant: '2', w: 1500, d: 850, h: 800, color: GREY, price: 25000, minW: 1300, maxW: 1700, description: 'Loveseat' }),
  fixed({ kind: 'sofa_l', name: 'L-shaped sofa (sectional)', short: 'L-sofa', category: 'living', model: 'lsofa', mount: 'floor-wall', w: 2600, d: 1700, h: 800, color: '#8A8F86', price: 65000, minW: 2200, maxW: 3200, description: '5-seater with lounger' }),
  fixed({ kind: 'sofa_cum_bed', name: 'Sofa cum bed', short: 'Sofa-bed', category: 'living', model: 'sofa', variant: '3', w: 1900, d: 900, h: 820, color: NAVY, price: 28000, description: 'Pull-out bed for guests' }),
  fixed({ kind: 'recliner', name: 'Recliner (single)', short: 'Recliner', category: 'living', model: 'sofa', variant: '1', w: 950, d: 950, h: 1000, color: '#6B4A35', price: 28000, description: 'Leatherette manual recliner' }),
  fixed({ kind: 'armchair', name: 'Accent armchair', short: 'Armchair', category: 'living', model: 'sofa', variant: '1', w: 800, d: 800, h: 850, color: '#C08A3E', price: 15000, description: 'Wingback / lounge chair' }),
  fixed({ kind: 'diwan', name: 'Diwan / settee', short: 'Diwan', category: 'living', model: 'bed', variant: 'diwan', mount: 'floor-wall', w: 1900, d: 800, h: 450, color: TEAK, price: 18000, description: 'Traditional diwan with bolsters' }),
  fixed({ kind: 'coffee_table', name: 'Coffee table', short: 'Coffee table', category: 'living', model: 'table', variant: 'low', w: 1100, d: 600, h: 420, color: WALNUT, price: 9000, description: 'Wooden top, low height' }),
  fixed({ kind: 'center_round', name: 'Round centre table (marble)', short: 'Centre table', category: 'living', model: 'table', variant: 'round-low', w: 800, d: 800, h: 420, color: '#E8E4DC', price: 14000, description: 'Marble top, metal base' }),
  fixed({ kind: 'side_table', name: 'Side table', short: 'Side table', category: 'living', model: 'table', variant: 'round', w: 450, d: 450, h: 550, color: WALNUT, price: 4000, description: 'Next to sofa' }),
  fixed({ kind: 'pouf', name: 'Pouf / ottoman', short: 'Pouf', category: 'living', model: 'pouf', w: 450, d: 450, h: 420, color: '#B66A50', price: 3000, description: 'Upholstered round pouf' }),
  fixed({ kind: 'beanbag', name: 'Bean bag (XXL)', short: 'Bean bag', category: 'living', model: 'beanbag', w: 800, d: 800, h: 750, color: '#A43D3D', price: 3500, description: 'With beans' }),
  joinery({ kind: 'tv_unit', name: 'TV unit (floor)', short: 'TV unit', category: 'living', w: 1800, d: 400, h: 450, color: OAK, finish: 'veneer', layout: { cols: 3, plinth: true, handles: 'none' }, minW: 1200, maxW: 3000, description: 'Low console with drawers' }),
  joinery({ kind: 'tv_unit_wall', name: 'TV unit (wall-hung)', short: 'TV unit', category: 'living', mount: 'wall', w: 1800, d: 380, h: 350, elevation: 300, color: WALNUT, finish: 'veneer', layout: { cols: 3, handles: 'none' }, minW: 1200, maxW: 3000, description: 'Floating console, sweep-friendly' }),
  joinery({ kind: 'tv_panel', name: 'TV back panel (fluted)', short: 'TV panel', category: 'living', model: 'panel', variant: 'fluted', mount: 'wall', w: 2400, d: 40, h: 2400, color: '#8C6A4A', finish: 'veneer', noCollide: true, minW: 1200, maxW: 4000, description: 'Fluted veneer wall panel behind the TV' }),
  joinery({ kind: 'crockery', name: 'Crockery unit', short: 'Crockery', category: 'living', w: 1200, d: 400, h: 2000, color: WALNUT, finish: 'veneer', layout: { extra: 'glass', plinth: true, handles: 'bar' }, minW: 800, maxW: 2000, description: 'Glass display top, storage below' }),
  joinery({ kind: 'bookshelf', name: 'Bookshelf (open)', short: 'Bookshelf', category: 'living', model: 'shelf', variant: 'tall', w: 900, d: 320, h: 1950, color: OAK, finish: 'ply_laminate', minW: 600, maxW: 2400, description: 'Five open shelves' }),
  fixed({ kind: 'console', name: 'Console table', short: 'Console', category: 'living', model: 'table', variant: 'console', mount: 'floor-wall', w: 1200, d: 350, h: 780, color: WALNUT, price: 12000, description: 'Entryway / behind the sofa' }),
  joinery({ kind: 'pooja', name: 'Pooja unit (mandir)', short: 'Pooja', category: 'living', w: 900, d: 450, h: 1800, color: '#C9A06A', finish: 'veneer', layout: { extra: 'arch', plinth: true, handles: 'none' }, addOnKey: 'jaali_cnc', minW: 600, maxW: 1500, description: 'CNC jaali doors, bell hooks, drawer below' }),
  joinery({ kind: 'partition', name: 'Jaali partition', short: 'Partition', category: 'living', model: 'partition', mount: 'free', w: 1200, d: 50, h: 2100, color: '#9A7552', finish: 'cnc_jaali', minW: 600, maxW: 3600, description: 'CNC-cut MDF jaali room divider' }),

  // ================= Dining =================
  fixed({ kind: 'dining4', name: 'Dining table (4 seat)', short: 'Dining 4', category: 'dining', model: 'table', w: 1200, d: 750, h: 750, color: OAK, price: 22000, description: 'Solid wood top' }),
  fixed({ kind: 'dining6', name: 'Dining table (6 seat)', short: 'Dining 6', category: 'dining', model: 'table', w: 1800, d: 900, h: 750, color: WALNUT, price: 38000, description: 'Sheesham wood' }),
  fixed({ kind: 'dining_round', name: 'Round dining table', short: 'Round table', category: 'dining', model: 'table', variant: 'round', w: 1050, d: 1050, h: 750, color: '#E8E4DC', price: 26000, description: 'Marble top, 4 seat' }),
  fixed({ kind: 'chair', name: 'Dining chair', short: 'Chair', category: 'dining', model: 'chair', w: 450, d: 480, h: 900, color: CHARCOAL, price: 4500, description: 'Upholstered seat' }),
  fixed({ kind: 'bench', name: 'Dining bench', short: 'Bench', category: 'dining', model: 'stool', variant: 'bench', w: 1200, d: 380, h: 450, color: OAK, price: 8000, description: 'Backless bench' }),
  fixed({ kind: 'bar_stool', name: 'Bar stool', short: 'Stool', category: 'dining', model: 'stool', w: 400, d: 400, h: 750, color: '#2F3236', price: 4000, description: 'For counters and islands' }),
  joinery({ kind: 'bar_unit', name: 'Bar cabinet', short: 'Bar unit', category: 'dining', w: 1000, d: 450, h: 1500, color: CHARCOAL, finish: 'hdhmr_pu', layout: { extra: 'glass', plinth: true, handles: 'bar' }, description: 'Glass racks and bottle storage' }),

  // ================= Bedroom =================
  fixed({ kind: 'bed_king', name: 'King bed (6×6.5 ft)', short: 'King bed', category: 'bedroom', model: 'bed', mount: 'floor-wall', w: 1830, d: 2030, h: 450, color: '#9C7B5B', price: 45000, description: 'With upholstered headboard' }),
  fixed({ kind: 'bed_king_storage', name: 'King bed with hydraulic storage', short: 'King bed', category: 'bedroom', model: 'bed', variant: 'storage', mount: 'floor-wall', w: 1830, d: 2030, h: 450, color: '#5D4636', price: 58000, description: 'Lift-up box storage under the mattress' }),
  fixed({ kind: 'bed_queen', name: 'Queen bed (5×6.5 ft)', short: 'Queen bed', category: 'bedroom', model: 'bed', mount: 'floor-wall', w: 1525, d: 2030, h: 450, color: '#9C7B5B', price: 32000, description: 'With headboard' }),
  fixed({ kind: 'bed_single', name: 'Single bed (3×6.5 ft)', short: 'Single bed', category: 'bedroom', model: 'bed', mount: 'floor-wall', w: 915, d: 1980, h: 420, color: OAK, price: 15000, description: 'Kids / guest room' }),
  fixed({ kind: 'bunk', name: 'Bunk bed', short: 'Bunk bed', category: 'bedroom', model: 'bunk', mount: 'floor-wall', w: 1000, d: 2050, h: 1650, color: '#E8E4DC', price: 30000, description: 'Two single beds with ladder' }),
  fixed({ kind: 'bedside', name: 'Bedside table', short: 'Bedside', category: 'bedroom', model: 'cabinet', mount: 'floor-wall', w: 450, d: 400, h: 500, color: WALNUT, layout: { rows: [1, 1], handles: 'bar' }, price: 6000, description: 'Two drawers' }),
  joinery({ kind: 'wardrobe_sliding', name: 'Sliding wardrobe (2 shutter)', short: 'Sliding wardrobe', category: 'bedroom', w: 2400, d: 650, h: 2150, color: '#D9D4CA', finish: 'ply_laminate', layout: { cols: 2, handles: 'bar' }, addOnKey: 'sliding_track', minW: 1500, maxW: 3600, description: 'Soft-close sliding system, loft above optional' }),
  joinery({ kind: 'wardrobe3', name: 'Hinged wardrobe (3 door)', short: 'Wardrobe 3D', category: 'bedroom', w: 1800, d: 600, h: 2150, color: OFFWHITE, layout: { cols: 3, handles: 'bar' }, minW: 1350, maxW: 2400, description: 'Hanging + shelves + locker' }),
  joinery({ kind: 'wardrobe2', name: 'Hinged wardrobe (2 door)', short: 'Wardrobe 2D', category: 'bedroom', w: 1200, d: 600, h: 2150, color: OFFWHITE, layout: { cols: 2, handles: 'bar' }, minW: 900, maxW: 1500, description: 'Compact wardrobe' }),
  joinery({ kind: 'wardrobe_mirror', name: 'Wardrobe with mirror shutter', short: 'Mirror wardrobe', category: 'bedroom', w: 1800, d: 600, h: 2150, color: '#CFC6B8', layout: { cols: 3, handles: 'bar', extra: 'mirror' }, addOnKey: 'mirror_shutter', minW: 1350, maxW: 2700, description: 'One full-length mirror shutter' }),
  joinery({ kind: 'wardrobe_loft', name: 'Wardrobe loft', short: 'W. loft', category: 'bedroom', mount: 'wall', w: 1800, d: 600, h: 450, elevation: 2150, color: OFFWHITE, layout: { cols: 3, handles: 'none' }, minW: 900, maxW: 3600, description: 'Above wardrobe to the ceiling' }),
  joinery({ kind: 'dresser', name: 'Dressing table with mirror', short: 'Dresser', category: 'bedroom', w: 900, d: 420, h: 1600, color: WALNUT, finish: 'veneer', layout: { rows: [1, 1], handles: 'bar', extra: 'mirror' }, minW: 600, maxW: 1200, description: 'Mirror, drawers and stool space' }),
  joinery({ kind: 'study', name: 'Study table with shelves', short: 'Study', category: 'bedroom', model: 'table', variant: 'desk', w: 1200, d: 600, h: 750, color: OAK, finish: 'ply_laminate', minW: 900, maxW: 1800, description: 'Desk with drawer' }),
  fixed({ kind: 'office_chair', name: 'Office chair', short: 'Chair', category: 'bedroom', model: 'chair', variant: 'office', w: 600, d: 600, h: 1050, color: '#2A2C2E', price: 9000, description: 'Ergonomic mesh chair' }),
  joinery({ kind: 'chest', name: 'Chest of drawers', short: 'Chest', category: 'bedroom', w: 900, d: 450, h: 1000, color: WALNUT, finish: 'veneer', layout: { rows: [1, 1, 1, 1], handles: 'bar' }, minW: 600, maxW: 1200, description: 'Four deep drawers' }),

  // ================= Storage & utility =================
  joinery({ kind: 'shoe_rack', name: 'Shoe rack cabinet', short: 'Shoe rack', category: 'storage', w: 900, d: 350, h: 1050, color: OFFWHITE, layout: { cols: 2, handles: 'bar' }, addOnKey: 'shoe_flaps', minW: 600, maxW: 1800, description: 'Tilt-out shoe flaps + seat top' }),
  joinery({ kind: 'utility', name: 'Utility / laundry cabinet', short: 'Utility', category: 'storage', w: 900, d: 560, h: 850, color: '#E3E6E8', layout: { cols: 2, handles: 'bar', plinth: true }, minW: 600, maxW: 1800, description: 'Above or beside the washer' }),
  joinery({ kind: 'wall_shelves', name: 'Wall shelves (set of 3)', short: 'Shelves', category: 'storage', model: 'shelf', variant: 'wall', mount: 'wall', w: 900, d: 220, h: 900, elevation: 1100, color: OAK, finish: 'veneer', minW: 450, maxW: 1800, description: 'Stacked floating shelves' }),
  joinery({ kind: 'loft_generic', name: 'Loft (any room)', short: 'Loft', category: 'storage', mount: 'wall', w: 1500, d: 600, h: 450, elevation: 2150, color: OFFWHITE, layout: { cols: 3, handles: 'none' }, minW: 600, maxW: 3600, description: 'Overhead storage near the ceiling' }),

  // ================= Decor, lighting & soft furnishing =================
  fixed({ kind: 'rug', name: 'Rug (5×8 ft)', short: 'Rug', category: 'decor', model: 'rug', w: 1520, d: 2440, h: 10, color: BEIGE, price: 6000, noCollide: true, minW: 900, maxW: 4000, description: 'Area rug' }),
  fixed({ kind: 'rug_round', name: 'Round rug', short: 'Rug', category: 'decor', model: 'rug', variant: 'round', w: 1800, d: 1800, h: 10, color: '#9EA79A', price: 5000, noCollide: true, description: 'Under a round table' }),
  fixed({ kind: 'plant_big', name: 'Indoor plant (floor)', short: 'Plant', category: 'decor', model: 'plant', w: 450, d: 450, h: 1300, color: '#4E7A4A', price: 2500, description: 'Areca / rubber plant in planter' }),
  fixed({ kind: 'plant_small', name: 'Table plant', short: 'Plant', category: 'decor', model: 'plant', w: 250, d: 250, h: 450, color: '#5B8A4E', price: 800, noCollide: true, description: 'Small potted plant' }),
  fixed({ kind: 'floor_lamp', name: 'Floor lamp', short: 'Lamp', category: 'decor', model: 'lamp', w: 400, d: 400, h: 1650, color: '#E8DCC2', price: 6500, description: 'Fabric shade, warm light' }),
  fixed({ kind: 'mirror', name: 'Wall mirror', short: 'Mirror', category: 'decor', model: 'mirror', mount: 'wall', w: 600, d: 30, h: 900, elevation: 900, color: '#B08D57', price: 5000, noCollide: true, description: 'Gold-rim mirror' }),
  fixed({ kind: 'curtain', name: 'Curtains (pair)', short: 'Curtains', category: 'decor', model: 'curtain', mount: 'wall', w: 1800, d: 120, h: 2400, color: '#C9BFAE', price: 7000, noCollide: true, minW: 900, maxW: 4000, description: 'Pleated, with rod — place over a window' }),
  fixed({ kind: 'wall_art', name: 'Wall art (framed)', short: 'Art', category: 'decor', model: 'art', mount: 'wall', w: 900, d: 30, h: 600, elevation: 1350, color: '#C4693F', price: 4000, noCollide: true, description: 'Canvas print with frame' }),

  // ================= Doors & windows =================
  fixed({ kind: 'door', name: 'Door', short: 'Door', category: 'opening', model: 'opening', mount: 'opening', w: 900, d: 120, h: 2100, color: '#8B6A4A', price: 0, noCollide: true, minW: 700, maxW: 1200, description: 'Snaps to a wall' }),
  fixed({ kind: 'door_main', name: 'Main door (double)', short: 'Main door', category: 'opening', model: 'opening', variant: 'double', mount: 'opening', w: 1200, d: 120, h: 2100, color: '#6B4A35', price: 0, noCollide: true, minW: 1000, maxW: 1800, description: 'Teak double door' }),
  fixed({ kind: 'window', name: 'Window', short: 'Window', category: 'opening', model: 'opening', variant: 'window', mount: 'opening', w: 900, d: 120, h: 1100, elevation: 1000, color: '#9FC3D6', price: 0, noCollide: true, minW: 500, maxW: 2400, description: 'Snaps to a wall' }),
  fixed({ kind: 'window_slide', name: 'Sliding window (3 track)', short: 'Window', category: 'opening', model: 'opening', variant: 'window', mount: 'opening', w: 1500, d: 120, h: 1200, elevation: 900, color: '#9FC3D6', price: 0, noCollide: true, minW: 900, maxW: 3000, description: 'uPVC / aluminium sliding' }),
  fixed({ kind: 'balcony_door', name: 'Balcony / French door', short: 'Balcony door', category: 'opening', model: 'opening', variant: 'french', mount: 'opening', w: 1500, d: 120, h: 2100, color: '#9FC3D6', price: 0, noCollide: true, minW: 1000, maxW: 3000, description: 'Glass sliding door to balcony' }),
];

export const catalogByKind = Object.fromEntries(CATALOG.map((c) => [c.kind, c])) as Record<string, CatalogItem>;

// Sample Chennai-market rates in INR. Every number is editable in the Rates tab.
const ADDONS: Record<string, { label: string; amount: number }> = {
  tandem_drawers: { label: 'Tandem drawer set', amount: 4500 },
  sink: { label: 'Steel sink + tap', amount: 7500 },
  sink_double: { label: 'Double-bowl sink + tap', amount: 12500 },
  hob: { label: '3-burner glass hob', amount: 12000 },
  hob4: { label: '4-burner glass hob', amount: 16000 },
  magic_corner: { label: 'Magic corner fitting', amount: 14000 },
  lemans: { label: 'LeMans corner carousel', amount: 18000 },
  bottle_pullout: { label: 'Bottle pull-out basket', amount: 4500 },
  thali_basket: { label: 'Thali + cup-saucer baskets', amount: 6500 },
  cylinder_trolley: { label: 'Cylinder trolley', amount: 3500 },
  wicker: { label: 'Wicker baskets (set)', amount: 5500 },
  dustbin: { label: 'Twin dustbin pull-out', amount: 4000 },
  lift_up: { label: 'Lift-up gas-strut fitting', amount: 6000 },
  pantry_rack: { label: 'Pantry pull-out rack', amount: 18000 },
  jaali_cnc: { label: 'CNC jaali doors + bells', amount: 6000 },
  sliding_track: { label: 'Soft-close sliding track', amount: 9000 },
  mirror_shutter: { label: 'Mirror on shutter', amount: 4500 },
  shoe_flaps: { label: 'Tilt-out shoe flaps', amount: 3000 },
  led_per_rft: { label: 'LED strip (per running ft, under wall units)', amount: 450 },
};

const fixedFromCatalog = Object.fromEntries(
  CATALOG.filter((c) => c.price !== undefined).map((c) => [c.kind, { label: c.name, amount: c.price as number }]),
);

export const FINISH_LABELS: Record<FinishId, { label: string; perSqft: number }> = {
  ply_laminate: { label: 'BWP plywood + laminate', perSqft: 1450 },
  ply_acrylic: { label: 'BWP plywood + acrylic', perSqft: 2200 },
  hdhmr_pu: { label: 'HDHMR + PU paint', perSqft: 2600 },
  fluted_glass: { label: 'Oak frame + fluted glass', perSqft: 2800 },
  veneer: { label: 'Plywood + veneer', perSqft: 2400 },
  mdf_laminate: { label: 'MDF + laminate (budget)', perSqft: 1100 },
  glass_profile: { label: 'Aluminium profile + glass', perSqft: 2500 },
  cnc_jaali: { label: 'CNC jaali (MDF, PU paint)', perSqft: 1300 },
};

export const DEFAULT_RATES: Rates = {
  finish: FINISH_LABELS,
  countertop: {
    granite: { label: 'Granite (black galaxy / tan brown)', perRft: 750 },
    quartz: { label: 'Quartz (white)', perRft: 1900 },
  },
  fixed: { ...ADDONS, ...fixedFromCatalog },
  installationPct: 8,
  gstPct: 18,
};

export const FINISH_IDS = Object.keys(FINISH_LABELS) as FinishId[];

/** Fill in any rates added in newer versions of the catalogue. */
export function withDefaultRates(r?: Partial<Rates>): Rates {
  const d = structuredClone(DEFAULT_RATES);
  if (!r) return d;
  return {
    finish: { ...d.finish, ...(r.finish ?? {}) },
    countertop: { ...d.countertop, ...(r.countertop ?? {}) },
    fixed: { ...d.fixed, ...(r.fixed ?? {}) },
    installationPct: r.installationPct ?? d.installationPct,
    gstPct: r.gstPct ?? d.gstPct,
  };
}

export const SWATCHES = ['#5F7059', '#2F3E52', '#8A5A44', '#3B3B3B', '#EEEAE2', '#F7F5F0', '#D9D4CA', '#B88A5A', '#7A5236', '#7D8A92', '#C9CDD0', '#FFFFFF', '#A43D3D', '#C08A3E'];
