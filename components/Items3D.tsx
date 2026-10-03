'use client';
import { useMemo } from 'react';
import { catalogByKind } from '@/lib/catalog';
import type { CabinetLayout, Item, Settings } from '@/lib/types';

// All geometry here is in metres, in the item's local frame:
// origin at the bottom-centre of the footprint, width along X, depth along Z, front faces +Z.

const GOLD = '#B08D57';
const STEEL = '#C3C8CB';
const BLACK = '#25282B';
const PLINTH = '#2A2C2E';
const WOOD_LEG = '#6B5340';

type V3 = [number, number, number];

function Box({ p, s, c, rough = 0.6, metal = 0, opacity = 1, emissive }: {
  p: V3; s: V3; c: string; rough?: number; metal?: number; opacity?: number; emissive?: string;
}) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c} roughness={rough} metalness={metal}
        transparent={opacity < 1} opacity={opacity}
        emissive={emissive ?? '#000000'} emissiveIntensity={emissive ? 1.4 : 0}
      />
    </mesh>
  );
}

function Cyl({ p, r1, r2, h, c, rough = 0.6, metal = 0, seg = 24 }: { p: V3; r1: number; r2: number; h: number; c: string; rough?: number; metal?: number; seg?: number }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <cylinderGeometry args={[r1, r2, h, seg]} />
      <meshStandardMaterial color={c} roughness={rough} metalness={metal} />
    </mesh>
  );
}

export function shade(hex: string, k: number) {
  const h = hex.replace('#', '');
  const ch = (i: number) => Math.max(0, Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) * k)));
  return `#${[0, 2, 4].map((i) => ch(i).toString(16).padStart(2, '0')).join('')}`;
}

/** Front panels: doors side by side (cols) or a drawer stack (rows), with gaps and handles. */
function Fronts({ w, d, y0, y1, color, cols, rows, handles = 'gola', mirrorIdx = -1 }: {
  w: number; d: number; y0: number; y1: number; color: string; cols?: number; rows?: number[];
  handles?: CabinetLayout['handles']; mirrorIdx?: number;
}) {
  const gap = 0.004;
  const z = d / 2 + 0.009;
  const panels: { x: number; y: number; pw: number; ph: number }[] = [];
  const H = y1 - y0;
  if (H <= 0.01) return null;
  if (rows) {
    const total = rows.reduce((a, b) => a + b, 0);
    let y = y1;
    for (const r of rows) {
      const ph = (H * r) / total;
      panels.push({ x: 0, y: y - ph / 2, pw: w - gap * 2, ph: ph - gap * 2 });
      y -= ph;
    }
  } else {
    const n = Math.max(1, cols ?? 1);
    const pw = w / n;
    for (let i = 0; i < n; i++) panels.push({ x: -w / 2 + pw * (i + 0.5), y: y0 + H / 2, pw: pw - gap * 2, ph: H - gap * 2 });
  }
  return (
    <group>
      {panels.map((p, i) => (
        <group key={i}>
          {i === mirrorIdx ? (
            <>
              <Box p={[p.x, p.y, z]} s={[p.pw, p.ph, 0.018]} c={shade(color, 0.9)} />
              <Box p={[p.x, p.y, z + 0.01]} s={[p.pw - 0.06, p.ph - 0.08, 0.004]} c={'#DCE8EE'} rough={0.02} metal={0.9} />
            </>
          ) : (
            <Box p={[p.x, p.y, z]} s={[p.pw, p.ph, 0.018]} c={color} rough={0.45} />
          )}
          {handles === 'gola' && <Box p={[p.x, p.y + p.ph / 2 - 0.006, z + 0.0095]} s={[p.pw, 0.008, 0.002]} c={GOLD} rough={0.3} metal={0.8} />}
          {handles === 'bar' && (rows
            ? <Box p={[p.x, p.y + p.ph * 0.25, z + 0.018]} s={[Math.min(0.2, p.pw * 0.4), 0.014, 0.014]} c={GOLD} rough={0.3} metal={0.8} />
            : <Box p={[p.x + (i % 2 === 0 ? 1 : -1) * (p.pw / 2 - 0.04) * (panels.length > 1 ? 1 : 1), p.y, z + 0.018]} s={[0.014, Math.min(0.35, p.ph * 0.3), 0.014]} c={GOLD} rough={0.3} metal={0.8} />)}
        </group>
      ))}
    </group>
  );
}

function Cabinet({ it, settings }: { it: Item; settings: Settings }) {
  const cat = catalogByKind[it.kind];
  const L: CabinetLayout = cat.layout ?? { cols: 2 };
  const w = it.w / 1000, d = it.d / 1000, h = it.h / 1000;
  const carcass = shade(it.color, 0.85);
  const plinth = L.plinth ? Math.min(0.1, h * 0.12) : 0;
  const counter = !!cat.hasCounter && settings.countertop !== 'none';
  const cols = L.cols ?? (w >= 0.5 ? 2 : 1);
  const handles = L.handles ?? 'gola';
  const e = L.extra;

  if (e === 'open') {
    const n = Math.max(2, Math.round((h - plinth) / 0.28));
    return (
      <group>
        {plinth > 0 && <Box p={[0, plinth / 2, -0.03]} s={[w, plinth, d - 0.06]} c={PLINTH} />}
        <Box p={[0, plinth + (h - plinth) / 2, -d / 2 + 0.01]} s={[w, h - plinth, 0.018]} c={carcass} />
        <Box p={[-w / 2 + 0.009, plinth + (h - plinth) / 2, 0]} s={[0.018, h - plinth, d]} c={it.color} />
        {Array.from({ length: n + 1 }).map((_, i) => <Box key={i} p={[0, plinth + ((h - plinth) * i) / n, 0]} s={[w, 0.018, d]} c={it.color} />)}
        {counter && <Box p={[0, h + 0.01, 0.01]} s={[w, 0.02, d + 0.02]} c={settings.countertopColor} rough={0.25} />}
      </group>
    );
  }

  if (e === 'niche') {
    const loftH = Math.max(0.3, h - 1.85);
    return (
      <group>
        <Box p={[-w / 2 + 0.009, h / 2, 0]} s={[0.018, h, d]} c={it.color} />
        <Box p={[w / 2 - 0.009, h / 2, 0]} s={[0.018, h, d]} c={it.color} />
        <Box p={[0, h - loftH / 2, -0.01]} s={[w, loftH, d - 0.02]} c={carcass} />
        <Fronts w={w} d={d - 0.02} y0={h - loftH} y1={h} color={it.color} cols={2} handles={handles} />
      </group>
    );
  }

  const glassDoors = e === 'glass';
  const glassTop = glassDoors && h > 1.2; // crockery / bar unit: glass above, doors below
  return (
    <group>
      {plinth > 0 && <Box p={[0, plinth / 2, -0.03]} s={[w, plinth, d - 0.06]} c={PLINTH} />}
      <Box p={[0, plinth + (h - plinth) / 2, -0.01]} s={[w, h - plinth, d - 0.02]} c={carcass} />

      {e === 'oven' ? (
        <group>
          <Fronts w={w} d={d - 0.02} y0={plinth} y1={0.85} color={it.color} rows={[1, 1]} handles={handles} />
          <Box p={[0, 1.05, d / 2 - 0.01]} s={[w - 0.04, 0.38, 0.02]} c={BLACK} rough={0.15} />
          <Box p={[0, 1.05, d / 2 + 0.002]} s={[w - 0.16, 0.22, 0.004]} c={'#3E4448'} rough={0.05} />
          <Fronts w={w} d={d - 0.02} y0={1.26} y1={h} color={it.color} cols={2} handles={handles} />
        </group>
      ) : e === 'arch' ? (
        <group>
          <Fronts w={w} d={d - 0.02} y0={plinth} y1={plinth + 0.25} color={it.color} rows={[1]} handles="bar" />
          {/* open shrine with back panel, arch top and jaali doors folded open */}
          <Box p={[0, plinth + 0.27, 0.0]} s={[w - 0.04, 0.02, d - 0.04]} c={shade(it.color, 1.1)} />
          <Box p={[0, (plinth + 0.29 + h - 0.32) / 2, -d / 2 + 0.03]} s={[w - 0.06, h - 0.32 - plinth - 0.29, 0.01]} c={'#E9D9B8'} emissive={'#FFE2A6'} />
          <Box p={[0, h - 0.16, d / 2 - 0.01]} s={[w, 0.32, 0.03]} c={it.color} />
          <mesh position={[0, h - 0.32, d / 2 - 0.01]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[(w - 0.1) / 2, (w - 0.1) / 2, 0.035, 32, 1, false, Math.PI / 2, Math.PI]} />
            <meshStandardMaterial color={shade(it.color, 0.9)} />
          </mesh>
          <Box p={[-w / 2 + 0.02, (plinth + 0.27 + h - 0.32) / 2, d / 2 - 0.01]} s={[0.04, h - 0.32 - plinth - 0.27, 0.03]} c={it.color} />
          <Box p={[w / 2 - 0.02, (plinth + 0.27 + h - 0.32) / 2, d / 2 - 0.01]} s={[0.04, h - 0.32 - plinth - 0.27, 0.03]} c={it.color} />
          <Cyl p={[-0.12, h - 0.45, 0.05]} r1={0.02} r2={0.035} h={0.06} c={GOLD} metal={0.9} rough={0.25} />
          <Cyl p={[0.12, h - 0.45, 0.05]} r1={0.02} r2={0.035} h={0.06} c={GOLD} metal={0.9} rough={0.25} />
        </group>
      ) : glassTop ? (
        <group>
          <Fronts w={w} d={d - 0.02} y0={plinth} y1={plinth + (h - plinth) * 0.42} color={it.color} cols={cols} handles={handles} />
          <GlassFronts w={w} d={d} y0={plinth + (h - plinth) * 0.42} y1={h} frame={it.color} cols={Math.max(2, cols)} fluted={false} />
        </group>
      ) : glassDoors ? (
        <GlassFronts w={w} d={d} y0={0} y1={h} frame={it.color} cols={w > 0.65 ? 2 : 1} fluted={cat.finish === 'fluted_glass'} />
      ) : e === 'mirror' && L.rows ? (
        // dresser: drawers below, mirror above
        <group>
          <Fronts w={w} d={d - 0.02} y0={0} y1={0.75} color={it.color} rows={L.rows} handles={handles} />
          <Box p={[0, 0.75 + 0.01, 0]} s={[w + 0.02, 0.02, d]} c={shade(it.color, 1.1)} />
          <Box p={[0, (0.78 + h) / 2, -d / 2 + 0.04]} s={[w * 0.7, h - 0.8, 0.03]} c={it.color} />
          <Box p={[0, (0.78 + h) / 2, -d / 2 + 0.058]} s={[w * 0.7 - 0.06, h - 0.86, 0.004]} c={'#DCE8EE'} rough={0.02} metal={0.9} />
        </group>
      ) : (
        <Fronts w={w} d={d - 0.02} y0={plinth} y1={h} color={it.color} cols={L.rows ? undefined : cols} rows={L.rows} handles={handles} mirrorIdx={e === 'mirror' ? cols - 1 : -1} />
      )}

      {/* dresser carcass must not cover the mirror */}
      {counter && <Box p={[0, h + 0.01, 0.01]} s={[w, 0.02, d + 0.02]} c={settings.countertopColor} rough={0.25} />}

      {e === 'sink' && (
        <group position={[0, h + 0.021, -0.01]}>
          {(it.w >= 1100 ? [-w / 4 + 0.03, w / 4 - 0.03] : [0]).map((x, i) => (
            <Box key={i} p={[x, 0, 0]} s={[Math.min(w / (it.w >= 1100 ? 2 : 1) - 0.12, 0.6), 0.004, Math.min(d - 0.15, 0.42)]} c={'#8E979C'} rough={0.25} metal={0.9} />
          ))}
          <Cyl p={[0, 0.15, -0.24]} r1={0.012} r2={0.015} h={0.3} c={STEEL} metal={0.9} rough={0.2} seg={16} />
          <Box p={[0, 0.29, -0.17]} s={[0.022, 0.022, 0.16]} c={STEEL} metal={0.9} rough={0.2} />
        </group>
      )}
      {e === 'hob' && (
        <group position={[0, h + 0.025, 0]}>
          <Box p={[0, 0, 0]} s={[Math.min(w - 0.08, 0.76), 0.008, Math.min(d - 0.1, 0.45)]} c={'#111315'} rough={0.08} />
          {(it.kind === 'base_hob4' ? [[-0.18, -0.1], [0.18, -0.1], [-0.18, 0.1], [0.18, 0.1]] : [[-0.22, 0], [0, 0], [0.22, 0]]).map(([x, z], i) => (
            <mesh key={i} position={[x, 0.008, z]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[i === 1 && it.kind !== 'base_hob4' ? 0.08 : 0.06, 0.01, 8, 28]} />
              <meshStandardMaterial color={'#6B7075'} metalness={0.7} roughness={0.35} />
            </mesh>
          ))}
        </group>
      )}
      {cat.category === 'kitchen_wall' && it.kind !== 'loft' && (
        <Box p={[0, -0.004, d / 2 - 0.05]} s={[w - 0.04, 0.006, 0.012]} c={'#FFE2A6'} emissive={'#FFC864'} />
      )}
    </group>
  );
}

function GlassFronts({ w, d, y0, y1, frame, cols, fluted }: { w: number; d: number; y0: number; y1: number; frame: string; cols: number; fluted: boolean }) {
  const h = y1 - y0;
  const pw = w / cols;
  const z = (d - 0.02) / 2 + 0.01;
  return (
    <group position={[0, y0, z]}>
      {Array.from({ length: cols }).map((_, i) => {
        const cx = -w / 2 + pw * (i + 0.5);
        return (
          <group key={i} position={[cx, 0, 0]}>
            <Box p={[0, h - 0.025, 0]} s={[pw - 0.006, 0.05, 0.02]} c={frame} />
            <Box p={[0, 0.025, 0]} s={[pw - 0.006, 0.05, 0.02]} c={frame} />
            <Box p={[-pw / 2 + 0.028, h / 2, 0]} s={[0.05, h, 0.02]} c={frame} />
            <Box p={[pw / 2 - 0.028, h / 2, 0]} s={[0.05, h, 0.02]} c={frame} />
            <Box p={[0, h / 2, 0]} s={[pw - 0.1, h - 0.1, 0.006]} c={'#DCE6E6'} rough={0.1} opacity={0.5} />
            {fluted && Array.from({ length: Math.max(0, Math.floor((pw - 0.1) / 0.02)) }).map((_, k) => (
              <Box key={k} p={[-pw / 2 + 0.06 + k * 0.02, h / 2, 0.004]} s={[0.003, h - 0.1, 0.003]} c={'#C3D1D1'} opacity={0.7} />
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Appliance({ it, variant }: { it: Item; variant?: string }) {
  const w = it.w / 1000, d = it.d / 1000, h = it.h / 1000;
  const c = it.color;
  switch (variant) {
    case 'fridge': case 'fridge1': {
      const two = variant === 'fridge' && it.w >= 850;
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d]} c={c} rough={0.3} metal={0.6} />
          {two ? <Box p={[0, h / 2, d / 2 + 0.001]} s={[0.004, h - 0.04, 0.002]} c={'#7E868B'} />
            : <Box p={[0, h * 0.68, d / 2 + 0.001]} s={[w - 0.01, 0.004, 0.002]} c={'#7E868B'} />}
          {two ? (
            <>
              <Box p={[-0.04, h * 0.6, d / 2 + 0.02]} s={[0.015, 0.5, 0.02]} c={'#8E979C'} metal={0.9} rough={0.2} />
              <Box p={[0.04, h * 0.6, d / 2 + 0.02]} s={[0.015, 0.5, 0.02]} c={'#8E979C'} metal={0.9} rough={0.2} />
            </>
          ) : (
            <>
              <Box p={[w / 2 - 0.06, h * 0.82, d / 2 + 0.02]} s={[0.015, 0.25, 0.02]} c={'#8E979C'} metal={0.9} rough={0.2} />
              <Box p={[w / 2 - 0.06, h * 0.5, d / 2 + 0.02]} s={[0.015, 0.3, 0.02]} c={'#8E979C'} metal={0.9} rough={0.2} />
            </>
          )}
        </group>
      );
    }
    case 'chimney':
      return (
        <group>
          <Box p={[0, 0.06, 0]} s={[w, 0.12, d]} c={c} rough={0.3} metal={0.4} />
          <Box p={[0, 0.125, 0.04]} s={[w * 0.9, 0.01, d * 0.7]} c={'#1A1C1E'} rough={0.05} />
          <Box p={[0, 0.12 + (h - 0.12) / 2, -d / 2 + 0.14]} s={[0.26, h - 0.12, 0.26]} c={shade(c, 1.3)} rough={0.35} metal={0.4} />
        </group>
      );
    case 'dishwasher':
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d]} c={c} rough={0.3} metal={0.6} />
          <Box p={[0, h - 0.08, d / 2 + 0.012]} s={[w - 0.1, 0.02, 0.02]} c={'#8E979C'} metal={0.9} />
        </group>
      );
    case 'microwave':
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d]} c={c} rough={0.3} />
          <Box p={[-0.06, h / 2, d / 2 + 0.001]} s={[w * 0.6, h * 0.7, 0.002]} c={'#0E1012'} rough={0.05} />
        </group>
      );
    case 'washer':
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d]} c={c} rough={0.35} />
          <mesh position={[0, h * 0.45, d / 2 + 0.005]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[w * 0.32, w * 0.32, 0.02, 32]} />
            <meshStandardMaterial color={'#5E6A70'} roughness={0.1} metalness={0.5} />
          </mesh>
          <Box p={[0, h - 0.06, d / 2 + 0.002]} s={[w - 0.04, 0.08, 0.004]} c={'#D5D9DB'} />
        </group>
      );
    case 'washer_top':
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d]} c={c} rough={0.35} />
          <Box p={[0, h + 0.005, 0.03]} s={[w - 0.08, 0.01, d - 0.16]} c={'#9FB4BE'} rough={0.1} opacity={0.8} />
          <Box p={[0, h + 0.06, -d / 2 + 0.05]} s={[w, 0.12, 0.08]} c={shade(c, 0.95)} />
        </group>
      );
    case 'purifier':
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d]} c={c} rough={0.3} />
          <Box p={[0, h * 0.65, d / 2 + 0.002]} s={[w * 0.7, h * 0.35, 0.004]} c={'#2C3E50'} rough={0.1} />
          <Box p={[0, h * 0.2, d / 2 + 0.03]} s={[0.03, 0.05, 0.06]} c={'#9AA0A5'} metal={0.8} />
        </group>
      );
    case 'ac':
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d]} c={c} rough={0.35} />
          <Box p={[0, 0.06, d / 2 - 0.02]} s={[w * 0.85, 0.03, 0.04]} c={'#D9DCDD'} />
          <Box p={[w * 0.38, h * 0.6, d / 2 + 0.001]} s={[0.08, 0.02, 0.002]} c={'#7FB3D5'} emissive={'#4AA3DF'} />
        </group>
      );
    case 'tv':
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d * 0.5]} c={'#0F1113'} rough={0.2} />
          <Box p={[0, h / 2, d * 0.25 + 0.001]} s={[w - 0.02, h - 0.02, 0.002]} c={'#1B2733'} rough={0.05} metal={0.3} />
        </group>
      );
    default:
      return <Box p={[0, h / 2, 0]} s={[w, h, d]} c={c} rough={0.4} />;
  }
}

function Furniture({ it, model, variant }: { it: Item; model: string; variant?: string }) {
  const w = it.w / 1000, d = it.d / 1000, h = it.h / 1000;
  const c = it.color;
  const legs = (lw: number, ld: number, lh: number, col: string, inset = 0.05, t = 0.04) =>
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
      <Box key={i} p={[sx * (lw / 2 - inset), lh / 2, sz * (ld / 2 - inset)]} s={[t, lh, t]} c={col} />
    ));

  switch (model) {
    case 'table': {
      if (variant === 'round' || variant === 'round-low') {
        const r = Math.min(w, d) / 2;
        return (
          <group>
            <Cyl p={[0, h - 0.02, 0]} r1={r} r2={r} h={0.04} c={c} rough={variant === 'round-low' ? 0.2 : 0.5} seg={40} />
            <Cyl p={[0, (h - 0.04) / 2, 0]} r1={0.05} r2={0.07} h={h - 0.04} c={variant === 'round-low' ? GOLD : shade(c, 0.7)} metal={variant === 'round-low' ? 0.8 : 0} rough={0.4} />
            <Cyl p={[0, 0.015, 0]} r1={r * 0.45} r2={r * 0.5} h={0.03} c={variant === 'round-low' ? GOLD : shade(c, 0.7)} metal={variant === 'round-low' ? 0.8 : 0} rough={0.4} />
          </group>
        );
      }
      if (variant === 'desk') {
        return (
          <group>
            <Box p={[0, h - 0.015, 0]} s={[w, 0.03, d]} c={c} />
            <Box p={[-w / 2 + 0.2, (h - 0.03) / 2, 0]} s={[0.4, h - 0.03, d - 0.02]} c={shade(c, 0.9)} />
            <Box p={[-w / 2 + 0.2, h * 0.75, d / 2]} s={[0.36, 0.14, 0.02]} c={shade(c, 1.05)} />
            <Box p={[-w / 2 + 0.2, h * 0.4, d / 2]} s={[0.36, 0.3, 0.02]} c={shade(c, 1.05)} />
            <Box p={[w / 2 - 0.015, (h - 0.03) / 2, 0]} s={[0.03, h - 0.03, d - 0.02]} c={shade(c, 0.9)} />
            {/* shelf above */}
            <Box p={[0.1, h + 0.5, -d / 2 + 0.12]} s={[w * 0.7, 0.025, 0.24]} c={c} />
          </group>
        );
      }
      if (variant === 'console') {
        return (
          <group>
            <Box p={[0, h - 0.02, 0]} s={[w, 0.04, d]} c={c} />
            <Box p={[0, 0.12, 0]} s={[w - 0.06, 0.025, d - 0.04]} c={shade(c, 0.9)} />
            {legs(w, d, h - 0.04, '#2B2B2B', 0.03, 0.025)}
          </group>
        );
      }
      const low = variant === 'low';
      return (
        <group>
          <Box p={[0, h - 0.02, 0]} s={[w, 0.04, d]} c={c} rough={0.5} />
          {low && <Box p={[0, 0.1, 0]} s={[w - 0.1, 0.02, d - 0.1]} c={shade(c, 0.85)} />}
          {legs(w, d, h - 0.04, shade(c, 0.75), low ? 0.05 : 0.08)}
        </group>
      );
    }
    case 'chair': {
      if (variant === 'office') {
        return (
          <group>
            <Cyl p={[0, 0.04, 0]} r1={0.28} r2={0.28} h={0.03} c={'#1A1C1E'} seg={5} />
            <Cyl p={[0, 0.25, 0]} r1={0.025} r2={0.025} h={0.4} c={'#8E979C'} metal={0.8} />
            <Box p={[0, 0.48, 0.02]} s={[w * 0.8, 0.08, d * 0.75]} c={c} rough={0.9} />
            <Box p={[0, 0.8, -d / 2 + 0.08]} s={[w * 0.75, 0.55, 0.05]} c={c} rough={0.9} />
          </group>
        );
      }
      return (
        <group>
          <Box p={[0, 0.45, 0.02]} s={[w, 0.06, d - 0.04]} c={c} rough={0.8} />
          <Box p={[0, 0.45 + (h - 0.45) / 2, -d / 2 + 0.03]} s={[w, h - 0.45, 0.05]} c={c} rough={0.8} />
          {legs(w, d, 0.42, WOOD_LEG, 0.04)}
        </group>
      );
    }
    case 'stool':
      if (variant === 'bench') return <group><Box p={[0, h - 0.025, 0]} s={[w, 0.05, d]} c={c} />{legs(w, d, h - 0.05, shade(c, 0.75), 0.06)}</group>;
      return (
        <group>
          <Cyl p={[0, h - 0.03, 0]} r1={w / 2} r2={w / 2 - 0.02} h={0.06} c={'#7A5236'} seg={28} />
          <Cyl p={[0, (h - 0.06) / 2, 0]} r1={0.025} r2={0.04} h={h - 0.06} c={c} metal={0.6} rough={0.3} />
          <mesh position={[0, h * 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[w * 0.3, 0.008, 6, 24]} /><meshStandardMaterial color={c} metalness={0.6} /></mesh>
          <Cyl p={[0, 0.01, 0]} r1={w * 0.38} r2={w * 0.4} h={0.02} c={c} metal={0.6} rough={0.3} />
        </group>
      );
    case 'sofa': {
      const seats = Number(variant ?? 3);
      const arm = seats === 1 ? 0.14 : 0.18;
      const seatW = (w - arm * 2) / seats;
      return (
        <group>
          <Box p={[0, 0.12, 0]} s={[w, 0.2, d]} c={shade(c, 0.8)} />
          {Array.from({ length: seats }).map((_, i) => (
            <Box key={i} p={[-w / 2 + arm + seatW * (i + 0.5), 0.32, 0.08]} s={[seatW - 0.01, 0.2, d - 0.22]} c={c} rough={0.9} />
          ))}
          <Box p={[0, (h + 0.22) / 2, -d / 2 + 0.11]} s={[w - 0.04, h - 0.22, 0.22]} c={c} rough={0.9} />
          <Box p={[-w / 2 + arm / 2, 0.33, 0]} s={[arm, 0.42 + (seats === 1 ? 0.1 : 0), d]} c={shade(c, 0.92)} rough={0.9} />
          <Box p={[w / 2 - arm / 2, 0.33, 0]} s={[arm, 0.42 + (seats === 1 ? 0.1 : 0), d]} c={shade(c, 0.92)} rough={0.9} />
          {seats > 1 && <Box p={[-w / 2 + arm + 0.2, 0.55, -d / 2 + 0.3]} s={[0.4, 0.35, 0.12]} c={shade(c, 1.25)} rough={1} />}
          {seats > 1 && <Box p={[w / 2 - arm - 0.2, 0.55, -d / 2 + 0.3]} s={[0.4, 0.35, 0.12]} c={shade(c, 1.25)} rough={1} />}
        </group>
      );
    }
    case 'lsofa': {
      const sd = 0.9; // seat depth of the long run
      return (
        <group>
          {/* long run along the back (-z) */}
          <Box p={[0, 0.12, -d / 2 + sd / 2]} s={[w, 0.2, sd]} c={shade(c, 0.8)} />
          <Box p={[0, 0.32, -d / 2 + sd / 2 + 0.08]} s={[w - 0.36, 0.2, sd - 0.22]} c={c} rough={0.9} />
          <Box p={[0, (h + 0.22) / 2, -d / 2 + 0.11]} s={[w, h - 0.22, 0.22]} c={c} rough={0.9} />
          {/* lounger on the right (+x), coming forward */}
          <Box p={[w / 2 - sd / 2, 0.12, sd / 2 - 0.0]} s={[sd, 0.2, d - sd]} c={shade(c, 0.8)} />
          <Box p={[w / 2 - sd / 2 - 0.05, 0.32, sd / 2]} s={[sd - 0.25, 0.2, d - sd]} c={c} rough={0.9} />
          <Box p={[w / 2 - 0.09, 0.33, 0]} s={[0.18, 0.42, d]} c={shade(c, 0.92)} rough={0.9} />
          <Box p={[-w / 2 + 0.09, 0.33, -d / 2 + sd / 2]} s={[0.18, 0.42, sd]} c={shade(c, 0.92)} rough={0.9} />
          {[-0.6, 0, 0.6].map((x, i) => <Box key={i} p={[x, 0.58, -d / 2 + 0.3]} s={[0.4, 0.35, 0.12]} c={shade(c, 1.25)} rough={1} />)}
        </group>
      );
    }
    case 'bed': {
      if (variant === 'diwan') {
        return (
          <group>
            <Box p={[0, 0.17, 0]} s={[w, 0.34, d]} c={c} />
            <Box p={[0, 0.39, 0]} s={[w - 0.04, 0.1, d - 0.04]} c={'#B8475A'} rough={1} />
            {[-1, 1].map((sx) => (
              <mesh key={sx} position={[sx * (w / 2 - 0.12), 0.52, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, d - 0.1, 20]} /><meshStandardMaterial color={'#D9A441'} roughness={1} />
              </mesh>
            ))}
          </group>
        );
      }
      const storage = variant === 'storage';
      const single = it.w < 1100;
      return (
        <group>
          <Box p={[0, 0.15, 0]} s={[w, 0.3, d]} c={c} />
          {storage && <Box p={[0, 0.15, d / 2 + 0.001]} s={[w - 0.04, 0.24, 0.002]} c={shade(c, 0.85)} />}
          <Box p={[0, 0.4, 0.03]} s={[w - 0.08, 0.2, d - 0.12]} c={'#F4F2EE'} rough={0.95} />
          <Box p={[0, 0.6, -d / 2 + 0.05]} s={[w + 0.04, 1.1, 0.1]} c={shade(c, 0.9)} />
          <Box p={[0, 0.75, -d / 2 + 0.105]} s={[w - 0.1, 0.6, 0.02]} c={shade(c, 1.15)} rough={1} />
          {(single ? [0] : [-w / 4, w / 4]).map((x, i) => (
            <Box key={i} p={[x, 0.54, -d / 2 + 0.3]} s={[single ? w - 0.25 : w / 2 - 0.16, 0.1, 0.35]} c={'#FFFFFF'} rough={1} />
          ))}
          <Box p={[0, 0.505, d * 0.18]} s={[w - 0.06, 0.02, d * 0.55]} c={'#9DAFA0'} rough={1} />
        </group>
      );
    }
    case 'bunk': {
      const post = (x: number, z: number, k: number) => <Box key={k} p={[x, h / 2, z]} s={[0.05, h, 0.05]} c={c} />;
      return (
        <group>
          {post(-w / 2 + 0.025, -d / 2 + 0.025, 1)}{post(w / 2 - 0.025, -d / 2 + 0.025, 2)}
          {post(-w / 2 + 0.025, d / 2 - 0.025, 3)}{post(w / 2 - 0.025, d / 2 - 0.025, 4)}
          {[0.25, h - 0.55].map((y, i) => (
            <group key={i}>
              <Box p={[0, y, 0]} s={[w, 0.06, d]} c={shade(c, 0.9)} />
              <Box p={[0, y + 0.1, 0]} s={[w - 0.08, 0.14, d - 0.08]} c={'#9DB4C0'} rough={1} />
            </group>
          ))}
          <Box p={[0, h - 0.25, d / 2 - 0.02]} s={[w - 0.05, 0.04, 0.03]} c={c} />
          <Box p={[0, h - 0.25, -d / 2 + 0.02]} s={[w - 0.05, 0.04, 0.03]} c={c} />
          {[0.35, 0.65, 0.95, 1.25].map((y, i) => <Box key={i} p={[w / 2 + 0.03, y, d / 2 - 0.3]} s={[0.03, 0.03, 0.4]} c={c} />)}
        </group>
      );
    }
    case 'shelf': {
      if (variant === 'floating') return <Box p={[0, h / 2, 0]} s={[w, h, d]} c={c} rough={0.7} />;
      if (variant === 'rack') {
        return (
          <group>
            {[0.05, h / 2, h - 0.05].map((y, i) => <Box key={i} p={[0, y, 0]} s={[w, 0.015, d]} c={c} metal={0.8} rough={0.3} />)}
            <Box p={[-w / 2 + 0.01, h / 2, -d / 2 + 0.01]} s={[0.015, h, 0.015]} c={c} metal={0.8} />
            <Box p={[w / 2 - 0.01, h / 2, -d / 2 + 0.01]} s={[0.015, h, 0.015]} c={c} metal={0.8} />
          </group>
        );
      }
      if (variant === 'wall') {
        return <group>{[0.02, h / 2, h - 0.02].map((y, i) => <Box key={i} p={[(i - 1) * 0.08, y, 0]} s={[w * (i === 1 ? 0.8 : 1), 0.035, d]} c={c} />)}</group>;
      }
      const n = Math.max(3, Math.round(h / 0.38));
      return (
        <group>
          <Box p={[0, h / 2, -d / 2 + 0.008]} s={[w, h, 0.016]} c={shade(c, 0.85)} />
          <Box p={[-w / 2 + 0.009, h / 2, 0]} s={[0.018, h, d]} c={c} />
          <Box p={[w / 2 - 0.009, h / 2, 0]} s={[0.018, h, d]} c={c} />
          {Array.from({ length: n + 1 }).map((_, i) => <Box key={i} p={[0, 0.04 + ((h - 0.06) * i) / n, 0]} s={[w, 0.018, d]} c={c} />)}
          {Array.from({ length: n - 1 }).map((_, i) => (
            <Box key={`b${i}`} p={[-w / 4 + (i % 2) * 0.08, 0.04 + ((h - 0.06) * (i + 1)) / n + 0.12, -0.02]} s={[0.22, 0.22, d * 0.6]} c={['#8E3B3B', '#2F3E52', '#C08A3E'][i % 3]} rough={0.8} />
          ))}
        </group>
      );
    }
    case 'panel': {
      const n = Math.floor(w / 0.04);
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d * 0.5]} c={shade(c, 0.85)} />
          {variant === 'fluted' && Array.from({ length: n }).map((_, i) => (
            <Box key={i} p={[-w / 2 + 0.02 + i * 0.04, h / 2, d * 0.25 + 0.006]} s={[0.026, h, 0.012]} c={c} rough={0.6} />
          ))}
          <Box p={[0, h * 0.42, d * 0.25 + 0.02]} s={[w * 0.92, 0.006, 0.006]} c={'#FFE2A6'} emissive={'#FFC864'} />
        </group>
      );
    }
    case 'partition': {
      const cell = 0.15;
      const nx = Math.max(1, Math.floor((w - 0.08) / cell));
      const ny = Math.max(1, Math.floor((h - 0.08) / cell));
      return (
        <group>
          <Box p={[-w / 2 + 0.02, h / 2, 0]} s={[0.04, h, d]} c={c} />
          <Box p={[w / 2 - 0.02, h / 2, 0]} s={[0.04, h, d]} c={c} />
          <Box p={[0, h - 0.02, 0]} s={[w, 0.04, d]} c={c} />
          <Box p={[0, 0.02, 0]} s={[w, 0.04, d]} c={c} />
          {Array.from({ length: nx - 1 }).map((_, i) => <Box key={`v${i}`} p={[-w / 2 + 0.04 + (i + 1) * ((w - 0.08) / nx), h / 2, 0]} s={[0.018, h - 0.08, d * 0.6]} c={c} />)}
          {Array.from({ length: ny - 1 }).map((_, i) => <Box key={`h${i}`} p={[0, 0.04 + (i + 1) * ((h - 0.08) / ny), 0]} s={[w - 0.08, 0.018, d * 0.6]} c={c} />)}
        </group>
      );
    }
    case 'plant': {
      const potH = Math.min(0.34, h * 0.3);
      return (
        <group>
          <Cyl p={[0, potH / 2, 0]} r1={w * 0.32} r2={w * 0.24} h={potH} c={'#D9CBB5'} rough={0.8} />
          <mesh position={[0, potH + (h - potH) * 0.55, 0]} castShadow>
            <icosahedronGeometry args={[Math.min(w / 2, (h - potH) / 2), 1]} />
            <meshStandardMaterial color={c} roughness={0.9} flatShading />
          </mesh>
          {h > 0.8 && <mesh position={[0.05, potH + (h - potH) * 0.9, 0.04]} castShadow><icosahedronGeometry args={[w * 0.3, 1]} /><meshStandardMaterial color={shade(c, 1.15)} roughness={0.9} flatShading /></mesh>}
        </group>
      );
    }
    case 'rug':
      if (variant === 'round') return <Cyl p={[0, 0.005, 0]} r1={w / 2} r2={w / 2} h={0.01} c={c} rough={1} seg={48} />;
      return (
        <group>
          <Box p={[0, 0.005, 0]} s={[w, 0.01, d]} c={c} rough={1} />
          <Box p={[0, 0.011, 0]} s={[w - 0.16, 0.002, d - 0.16]} c={shade(c, 1.12)} rough={1} />
        </group>
      );
    case 'lamp':
      return (
        <group>
          <Cyl p={[0, 0.015, 0]} r1={0.15} r2={0.16} h={0.03} c={'#2B2B2B'} metal={0.6} />
          <Cyl p={[0, h / 2, 0]} r1={0.012} r2={0.012} h={h - 0.3} c={'#2B2B2B'} metal={0.6} />
          <mesh position={[0, h - 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.14, w / 2, 0.3, 28, 1, true]} />
            <meshStandardMaterial color={c} emissive={'#FFE2B0'} emissiveIntensity={0.6} side={2} />
          </mesh>
          <pointLight position={[0, h - 0.2, 0]} intensity={0.6} distance={3} color={'#FFE2B0'} />
        </group>
      );
    case 'mirror':
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d]} c={c} metal={0.8} rough={0.3} />
          <Box p={[0, h / 2, d / 2 + 0.001]} s={[w - 0.05, h - 0.05, 0.002]} c={'#DCE8EE'} metal={0.9} rough={0.02} />
        </group>
      );
    case 'curtain': {
      const half = w / 2;
      return (
        <group>
          <mesh position={[0, h - 0.03, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, w + 0.2, 12]} />
            <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} />
          </mesh>
          {[-1, 1].map((sx) => (
            <group key={sx} position={[sx * (w / 2 - half * 0.25), 0, 0]}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Box key={i} p={[(i - 2) * (half * 0.1), (h - 0.06) / 2, (i % 2) * 0.03 - 0.015]} s={[half * 0.1 + 0.01, h - 0.06, 0.02]} c={i % 2 ? shade(c, 0.92) : c} rough={1} />
              ))}
            </group>
          ))}
        </group>
      );
    }
    case 'art':
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d]} c={'#2B2B2B'} />
          <Box p={[0, h / 2, d / 2 + 0.001]} s={[w - 0.06, h - 0.06, 0.002]} c={'#EFE8DC'} />
          <Box p={[-w * 0.12, h * 0.55, d / 2 + 0.003]} s={[w * 0.35, h * 0.5, 0.002]} c={c} />
          <Box p={[w * 0.18, h * 0.42, d / 2 + 0.004]} s={[w * 0.25, h * 0.35, 0.002]} c={'#2F3E52'} />
        </group>
      );
    case 'beanbag':
      return (
        <group>
          <mesh position={[0, h * 0.4, 0]} scale={[1, h / w * 1.1, 1]} castShadow>
            <sphereGeometry args={[w / 2, 24, 16]} />
            <meshStandardMaterial color={c} roughness={0.95} />
          </mesh>
        </group>
      );
    case 'pouf':
      return <Cyl p={[0, h / 2, 0]} r1={w / 2 - 0.02} r2={w / 2} h={h} c={c} rough={1} seg={32} />;
    case 'box':
    default:
      return <Box p={[0, h / 2, 0]} s={[w, h, d]} c={c} />;
  }
}

/** Doors and windows sit inside the wall (local depth = wall thickness). */
export function Opening({ it, wallT }: { it: Item; wallT: number }) {
  const cat = catalogByKind[it.kind];
  const v = cat?.variant;
  const w = it.w / 1000, h = it.h / 1000, t = wallT / 1000;
  if (v === 'window' || v === 'french') {
    const panes = v === 'french' || it.w > 1300 ? 3 : 2;
    return (
      <group>
        <Box p={[0, h - 0.03, 0]} s={[w, 0.06, t]} c={'#F2F2F0'} />
        <Box p={[0, 0.03, 0]} s={[w, 0.06, t]} c={'#F2F2F0'} />
        <Box p={[-w / 2 + 0.03, h / 2, 0]} s={[0.06, h, t]} c={'#F2F2F0'} />
        <Box p={[w / 2 - 0.03, h / 2, 0]} s={[0.06, h, t]} c={'#F2F2F0'} />
        {Array.from({ length: panes - 1 }).map((_, i) => <Box key={i} p={[-w / 2 + (w * (i + 1)) / panes, h / 2, 0]} s={[0.04, h, 0.05]} c={'#F2F2F0'} />)}
        <Box p={[0, h / 2, 0]} s={[w - 0.1, h - 0.1, 0.008]} c={it.color} rough={0.05} opacity={0.35} />
      </group>
    );
  }
  if (v === 'double') {
    return (
      <group>
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <Box p={[sx * w / 4, h / 2, t / 2 - 0.03]} s={[w / 2 - 0.03, h - 0.02, 0.045]} c={it.color} rough={0.5} />
            <Box p={[sx * w / 4, h * 0.7, t / 2 - 0.005]} s={[w / 2 - 0.2, h * 0.35, 0.01]} c={shade(it.color, 1.15)} />
            <Box p={[sx * 0.06, h * 0.48, t / 2 + 0.01]} s={[0.02, 0.4, 0.03]} c={GOLD} metal={0.8} rough={0.3} />
          </group>
        ))}
      </group>
    );
  }
  return (
    <group>
      <Box p={[0, h / 2, t / 2 - 0.03]} s={[w - 0.04, h - 0.02, 0.04]} c={it.color} rough={0.55} />
      <Box p={[w / 2 - 0.1, h * 0.48, t / 2 + 0.005]} s={[0.12, 0.02, 0.03]} c={GOLD} metal={0.8} rough={0.3} />
    </group>
  );
}

export function ItemModel({ it, settings }: { it: Item; settings: Settings }) {
  return useMemo(() => {
    const cat = catalogByKind[it.kind];
    if (!cat) return null;
    if (cat.model === 'cabinet') return <Cabinet it={it} settings={settings} />;
    if (cat.model === 'appliance') return <Appliance it={it} variant={cat.variant} />;
    return <Furniture it={it} model={cat.model} variant={cat.variant} />;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [it.kind, it.w, it.d, it.h, it.color, settings.countertop, settings.countertopColor]);
}
