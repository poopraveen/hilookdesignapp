import { catalogByKind } from './catalog';
import type { Category, Design } from './types';

export const SQFT_MM2 = 304.8 * 304.8;
export const RFT_MM = 304.8;

export type Group = 'Woodwork' | 'Countertop' | 'Hardware & accessories' | 'Appliances' | 'Furniture & decor' | 'Lighting';

export interface EstimateLine {
  group: Group;
  label: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
  itemId?: string;
}

export interface Estimate {
  lines: EstimateLine[];
  subtotal: number;
  installation: number;
  gst: number;
  total: number;
  byGroup: Record<string, number>;
}

const round = (n: number) => Math.round(n);
const FURNITURE_CATS: Category[] = ['living', 'dining', 'bedroom', 'decor'];

export function estimate(design: Design): Estimate {
  const { items, rates, settings } = design;
  const lines: EstimateLine[] = [];

  for (const it of items) {
    const cat = catalogByKind[it.kind];
    if (!cat) continue;
    if (it.finish && rates.finish[it.finish]) {
      const fr = rates.finish[it.finish];
      const sqft = (it.w * it.h) / SQFT_MM2;
      lines.push({
        group: 'Woodwork',
        label: `${it.name} — ${fr.label} (${Math.round(it.w)}×${Math.round(it.h)} mm)`,
        qty: +sqft.toFixed(2), unit: 'sq ft', rate: fr.perSqft, amount: round(sqft * fr.perSqft), itemId: it.id,
      });
    }
    if (cat.addOnKey && rates.fixed[cat.addOnKey]) {
      const f = rates.fixed[cat.addOnKey];
      lines.push({ group: 'Hardware & accessories', label: f.label, qty: 1, unit: 'nos', rate: f.amount, amount: f.amount, itemId: it.id });
    }
    if (cat.price !== undefined && !it.finish) {
      const f = rates.fixed[it.kind];
      if (f && f.amount > 0) {
        lines.push({
          group: cat.category === 'appliance' ? 'Appliances' : FURNITURE_CATS.includes(cat.category) ? 'Furniture & decor' : 'Hardware & accessories',
          label: it.name, qty: 1, unit: 'nos', rate: f.amount, amount: f.amount, itemId: it.id,
        });
      }
    }
  }

  // Countertop: running feet of all base units that carry a top
  if (settings.countertop !== 'none') {
    const mm = items.filter((i) => catalogByKind[i.kind]?.hasCounter).reduce((s, i) => s + i.w, 0);
    if (mm > 0) {
      const rft = mm / RFT_MM;
      const r = rates.countertop[settings.countertop];
      lines.push({ group: 'Countertop', label: r.label, qty: +rft.toFixed(2), unit: 'rft', rate: r.perRft, amount: round(rft * r.perRft) });
    }
  }

  // LED strip under closed and glass kitchen wall cabinets
  const ledMm = items.filter((i) => catalogByKind[i.kind]?.category === 'kitchen_wall' && catalogByKind[i.kind]?.model === 'cabinet' && i.kind !== 'loft')
    .reduce((s, i) => s + i.w, 0);
  if (ledMm > 0 && rates.fixed.led_per_rft) {
    const rft = ledMm / RFT_MM;
    const r = rates.fixed.led_per_rft;
    lines.push({ group: 'Lighting', label: r.label, qty: +rft.toFixed(2), unit: 'rft', rate: r.amount, amount: round(rft * r.amount) });
  }

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const installBase = lines.filter((l) => l.group !== 'Appliances' && l.group !== 'Furniture & decor').reduce((s, l) => s + l.amount, 0);
  const installation = round((installBase * rates.installationPct) / 100);
  const gst = settings.gst ? round(((subtotal + installation) * rates.gstPct) / 100) : 0;
  const byGroup: Record<string, number> = {};
  for (const l of lines) byGroup[l.group] = (byGroup[l.group] ?? 0) + l.amount;
  return { lines, subtotal, installation, gst, total: subtotal + installation + gst, byGroup };
}

export function homeEstimate(rooms: Design[]) {
  const per = rooms.map((r) => ({ name: r.name, est: estimate(r) }));
  return { per, total: per.reduce((s, p) => s + p.est.total, 0) };
}

export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
