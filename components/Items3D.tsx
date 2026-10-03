'use client';
import { useMemo } from 'react';
import type { Item, Settings } from '@/lib/types';

// All geometry here is in metres, in the item's local frame:
// origin at the bottom-centre of the footprint, width along X, depth along Z, front faces +Z.

const GOLD = '#B08D57';
const STEEL = '#C3C8CB';
const BLACK = '#25282B';
const PLINTH = '#2A2C2E';

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

function shade(hex: string, k: number) {
  const h = hex.replace('#', '');
  const ch = (i: number) => Math.max(0, Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) * k)));
  return `#${[0, 2, 4].map((i) => ch(i).toString(16).padStart(2, '0')).join('')}`;
}

/** A row of front panels (doors side by side) or a stack (drawers), with gaps and a gold gola strip. */
function Fronts({ w, d, y0, y1, color, layout, gola = true }: {
  w: number; d: number; y0: number; y1: number; color: string;
  layout: { cols?: number; rows?: number[] }; gola?: boolean;
}) {
  const gap = 0.004;
  const z = d / 2 + 0.009;
  const panels: { x: number; y: number; pw: number; ph: number }[] = [];
  const H = y1 - y0;
  if (layout.rows) {
    const total = layout.rows.reduce((a, b) => a + b, 0);
    let y = y1;
    for (const r of layout.rows) {
      const ph = (H * r) / total;
      panels.push({ x: 0, y: y - ph / 2, pw: w - gap * 2, ph: ph - gap * 2 });
      y -= ph;
    }
  } else {
    const n = layout.cols ?? 1;
    const pw = w / n;
    for (let i = 0; i < n; i++) panels.push({ x: -w / 2 + pw * (i + 0.5), y: y0 + H / 2, pw: pw - gap * 2, ph: H - gap * 2 });
  }
  return (
    <group>
      {panels.map((p, i) => (
        <group key={i}>
          <Box p={[p.x, p.y, z]} s={[p.pw, p.ph, 0.018]} c={color} rough={0.45} />
          {gola && <Box p={[p.x, p.y + p.ph / 2 - 0.006, z + 0.0095]} s={[p.pw, 0.008, 0.002]} c={GOLD} rough={0.3} metal={0.8} />}
        </group>
      ))}
    </group>
  );
}

function BaseUnit({ it, settings }: { it: Item; settings: Settings }) {
  const w = it.w / 1000, d = it.d / 1000, h = it.h / 1000;
  const carcass = shade(it.color, 0.85);
  let layout: { cols?: number; rows?: number[] } = { cols: w >= 0.5 ? 2 : 1 };
  if (it.kind === 'base_drawer') layout = { rows: [1, 1, 2] };
  if (it.kind === 'base_hob') layout = { rows: [1, 1] };
  if (it.kind === 'base_pullout') layout = { cols: 1 };
  const top = settings.countertop !== 'none';
  return (
    <group>
      <Box p={[0, 0.05, -0.03]} s={[w, 0.1, d - 0.06]} c={PLINTH} />
      <Box p={[0, 0.1 + (h - 0.1) / 2, -0.01]} s={[w, h - 0.1, d - 0.02]} c={carcass} />
      <Fronts w={w} d={d - 0.02} y0={0.1} y1={h} color={it.color} layout={layout} />
      {top && <Box p={[0, h + 0.01, 0.01]} s={[w, 0.02, d + 0.02]} c={settings.countertopColor} rough={0.25} />}
      {it.kind === 'base_sink' && (
        <group position={[0, h + 0.021, -0.01]}>
          <Box p={[0, 0, 0]} s={[Math.min(w - 0.12, 0.6), 0.004, Math.min(d - 0.15, 0.42)]} c={'#8E979C'} rough={0.25} metal={0.9} />
          <mesh position={[0, 0.15, -0.24]} castShadow>
            <cylinderGeometry args={[0.012, 0.015, 0.3, 16]} />
            <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.2} />
          </mesh>
          <Box p={[0, 0.29, -0.17]} s={[0.022, 0.022, 0.16]} c={STEEL} metal={0.9} rough={0.2} />
        </group>
      )}
      {it.kind === 'base_hob' && (
        <group position={[0, h + 0.025, 0]}>
          <Box p={[0, 0, 0]} s={[Math.min(w - 0.08, 0.76), 0.008, Math.min(d - 0.1, 0.45)]} c={'#111315'} rough={0.08} />
          {[-0.22, 0, 0.22].map((x, i) => (
            <mesh key={i} position={[x, 0.008, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[i === 1 ? 0.08 : 0.06, 0.01, 8, 28]} />
              <meshStandardMaterial color={'#6B7075'} metalness={0.7} roughness={0.35} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function WallUnit({ it }: { it: Item }) {
  const w = it.w / 1000, d = it.d / 1000, h = it.h / 1000;
  if (it.kind === 'wall_shelf') return <Box p={[0, h / 2, 0]} s={[w, h, d]} c={it.color} rough={0.7} />;
  const carcass = shade(it.color, 0.9);
  const glass = it.kind === 'wall_glass';
  const cols = it.kind === 'loft' ? Math.max(1, Math.round(w / 0.45)) : w >= 0.5 ? 2 : 1;
  return (
    <group>
      <Box p={[0, h / 2, -0.01]} s={[w, h, d - 0.02]} c={carcass} />
      {glass ? (
        <group position={[0, 0, (d - 0.02) / 2 + 0.01]}>
          {/* oak frame */}
          <Box p={[0, h - 0.025, 0]} s={[w, 0.05, 0.02]} c={it.color} />
          <Box p={[0, 0.025, 0]} s={[w, 0.05, 0.02]} c={it.color} />
          <Box p={[-w / 2 + 0.025, h / 2, 0]} s={[0.05, h, 0.02]} c={it.color} />
          <Box p={[w / 2 - 0.025, h / 2, 0]} s={[0.05, h, 0.02]} c={it.color} />
          <Box p={[0, h / 2, 0]} s={[w - 0.1, h - 0.1, 0.006]} c={'#DCE6E6'} rough={0.1} opacity={0.55} />
          {Array.from({ length: Math.floor((w - 0.1) / 0.02) }).map((_, i) => (
            <Box key={i} p={[-w / 2 + 0.06 + i * 0.02, h / 2, 0.004]} s={[0.003, h - 0.1, 0.003]} c={'#C3D1D1'} opacity={0.7} />
          ))}
        </group>
      ) : (
        <Fronts w={w} d={d - 0.02} y0={0} y1={h} color={it.color} layout={{ cols }} gola={false} />
      )}
      {it.kind !== 'loft' && <Box p={[0, -0.004, d / 2 - 0.05]} s={[w - 0.04, 0.006, 0.012]} c={'#FFE2A6'} emissive={'#FFC864'} />}
      {it.kind !== 'loft' && it.kind !== 'wall_glass' && (
        <Box p={[0, 0.012, (d - 0.02) / 2 + 0.02]} s={[w - 0.02, 0.006, 0.002]} c={GOLD} metal={0.8} rough={0.3} />
      )}
    </group>
  );
}

function TallUnit({ it }: { it: Item }) {
  const w = it.w / 1000, d = it.d / 1000, h = it.h / 1000;
  return (
    <group>
      <Box p={[0, 0.05, -0.03]} s={[w, 0.1, d - 0.06]} c={PLINTH} />
      <Box p={[0, 0.1 + (h - 0.1) / 2, -0.01]} s={[w, h - 0.1, d - 0.02]} c={shade(it.color, 0.85)} />
      {it.kind === 'tall_oven' ? (
        <group>
          <Fronts w={w} d={d - 0.02} y0={0.1} y1={0.85} color={it.color} layout={{ rows: [1, 1] }} />
          <Box p={[0, 1.05, d / 2 - 0.01]} s={[w - 0.04, 0.38, 0.02]} c={BLACK} rough={0.15} />
          <Box p={[0, 1.05, d / 2 + 0.002]} s={[w - 0.16, 0.22, 0.004]} c={'#3E4448'} rough={0.05} />
          <Fronts w={w} d={d - 0.02} y0={1.26} y1={h} color={it.color} layout={{ cols: 2 }} />
        </group>
      ) : (
        <Fronts w={w} d={d - 0.02} y0={0.1} y1={h} color={it.color} layout={{ cols: w >= 0.55 ? 2 : 1 }} />
      )}
    </group>
  );
}

function Appliance({ it }: { it: Item }) {
  const w = it.w / 1000, d = it.d / 1000, h = it.h / 1000;
  switch (it.kind) {
    case 'fridge':
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d]} c={it.color} rough={0.3} metal={0.6} />
          <Box p={[0, h / 2, d / 2 + 0.001]} s={[0.004, h - 0.04, 0.002]} c={'#7E868B'} />
          <Box p={[-0.04, h * 0.6, d / 2 + 0.02]} s={[0.015, 0.5, 0.02]} c={'#8E979C'} metal={0.9} rough={0.2} />
          <Box p={[0.04, h * 0.6, d / 2 + 0.02]} s={[0.015, 0.5, 0.02]} c={'#8E979C'} metal={0.9} rough={0.2} />
        </group>
      );
    case 'chimney':
      return (
        <group>
          <Box p={[0, 0.06, 0]} s={[w, 0.12, d]} c={it.color} rough={0.3} metal={0.4} />
          <Box p={[0, 0.125, 0.04]} s={[w * 0.9, 0.01, d * 0.7]} c={'#1A1C1E'} rough={0.05} />
          <Box p={[0, 0.12 + (h - 0.12) / 2, -d / 2 + 0.14]} s={[0.26, h - 0.12, 0.26]} c={shade(it.color, 1.3)} rough={0.35} metal={0.4} />
        </group>
      );
    case 'dishwasher':
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d]} c={it.color} rough={0.3} metal={0.6} />
          <Box p={[0, h - 0.08, d / 2 + 0.012]} s={[w - 0.1, 0.02, 0.02]} c={'#8E979C'} metal={0.9} />
        </group>
      );
    case 'microwave':
      return (
        <group>
          <Box p={[0, h / 2, 0]} s={[w, h, d]} c={it.color} rough={0.3} />
          <Box p={[-0.06, h / 2, d / 2 + 0.001]} s={[w * 0.6, h * 0.7, 0.002]} c={'#0E1012'} rough={0.05} />
        </group>
      );
    default:
      return <Box p={[0, h / 2, 0]} s={[w, h, d]} c={it.color} />;
  }
}

function Furniture({ it }: { it: Item }) {
  const w = it.w / 1000, d = it.d / 1000, h = it.h / 1000;
  const c = it.color;
  const legs = (lw: number, ld: number, lh: number, col: string, inset = 0.05) =>
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
      <Box key={i} p={[sx * (lw / 2 - inset), lh / 2, sz * (ld / 2 - inset)]} s={[0.04, lh, 0.04]} c={col} />
    ));
  switch (it.kind) {
    case 'dining_table':
      return <group><Box p={[0, h - 0.02, 0]} s={[w, 0.04, d]} c={c} rough={0.5} />{legs(w, d, h - 0.04, shade(c, 0.8), 0.08)}</group>;
    case 'chair':
      return (
        <group>
          <Box p={[0, 0.45, 0.02]} s={[w, 0.06, d - 0.04]} c={c} rough={0.8} />
          <Box p={[0, 0.45 + (h - 0.45) / 2, -d / 2 + 0.03]} s={[w, h - 0.45, 0.05]} c={c} rough={0.8} />
          {legs(w, d, 0.42, '#6B5340', 0.04)}
        </group>
      );
    case 'sofa':
      return (
        <group>
          <Box p={[0, 0.12, 0]} s={[w, 0.2, d]} c={shade(c, 0.8)} />
          <Box p={[0, 0.32, 0.08]} s={[w - 0.36, 0.2, d - 0.22]} c={c} rough={0.9} />
          <Box p={[0, (h + 0.22) / 2, -d / 2 + 0.11]} s={[w - 0.04, h - 0.22, 0.22]} c={c} rough={0.9} />
          <Box p={[-w / 2 + 0.09, 0.33, 0]} s={[0.18, 0.42, d]} c={shade(c, 0.92)} rough={0.9} />
          <Box p={[w / 2 - 0.09, 0.33, 0]} s={[0.18, 0.42, d]} c={shade(c, 0.92)} rough={0.9} />
        </group>
      );
    case 'bed':
      return (
        <group>
          <Box p={[0, 0.15, 0]} s={[w, 0.3, d]} c={c} />
          <Box p={[0, 0.4, 0.03]} s={[w - 0.08, 0.2, d - 0.12]} c={'#F4F2EE'} rough={0.95} />
          <Box p={[0, 0.55, -d / 2 + 0.04]} s={[w, 1.1, 0.08]} c={shade(c, 0.9)} />
          <Box p={[-w / 4, 0.54, -d / 2 + 0.3]} s={[w / 2 - 0.16, 0.1, 0.35]} c={'#FFFFFF'} rough={1} />
          <Box p={[w / 4, 0.54, -d / 2 + 0.3]} s={[w / 2 - 0.16, 0.1, 0.35]} c={'#FFFFFF'} rough={1} />
          <Box p={[0, 0.505, d * 0.18]} s={[w - 0.06, 0.02, d * 0.55]} c={'#9DAFA0'} rough={1} />
        </group>
      );
    case 'wardrobe': {
      const n = Math.max(2, Math.round(w / 0.6));
      return (
        <group>
          <Box p={[0, h / 2, -0.01]} s={[w, h, d - 0.02]} c={shade(c, 0.9)} />
          <Fronts w={w} d={d - 0.02} y0={0} y1={h} color={c} layout={{ cols: n }} gola={false} />
          {Array.from({ length: n }).map((_, i) => (
            <Box key={i} p={[-w / 2 + (w / n) * (i + 0.5) + (i % 2 ? -1 : 1) * (w / n / 2 - 0.05), h * 0.5, d / 2 + 0.02]} s={[0.015, 0.4, 0.02]} c={GOLD} metal={0.8} rough={0.3} />
          ))}
        </group>
      );
    }
    case 'tv_unit':
      return (
        <group>
          <Box p={[0, 0.05, -0.02]} s={[w - 0.04, 0.1, d - 0.06]} c={PLINTH} />
          <Box p={[0, 0.1 + (h - 0.1) / 2, -0.01]} s={[w, h - 0.1, d - 0.02]} c={shade(c, 0.85)} />
          <Fronts w={w} d={d - 0.02} y0={0.1} y1={h} color={c} layout={{ cols: 3 }} gola={false} />
        </group>
      );
    case 'rug':
      return <Box p={[0, 0.005, 0]} s={[w, 0.01, d]} c={c} rough={1} />;
    case 'plant':
      return (
        <group>
          <mesh position={[0, 0.17, 0]} castShadow><cylinderGeometry args={[w * 0.32, w * 0.24, 0.34, 24]} /><meshStandardMaterial color={'#D9CBB5'} roughness={0.8} /></mesh>
          <mesh position={[0, 0.34 + (h - 0.34) * 0.55, 0]} castShadow><icosahedronGeometry args={[Math.min(w / 2, (h - 0.34) / 2), 1]} /><meshStandardMaterial color={c} roughness={0.9} flatShading /></mesh>
        </group>
      );
    default:
      return <Box p={[0, h / 2, 0]} s={[w, h, d]} c={c} />;
  }
}

/** Doors and windows sit inside the wall (local depth = wall thickness). */
export function Opening({ it, wallT }: { it: Item; wallT: number }) {
  const w = it.w / 1000, h = it.h / 1000, t = wallT / 1000;
  if (it.kind === 'window') {
    return (
      <group>
        <Box p={[0, h - 0.03, 0]} s={[w, 0.06, t]} c={'#F2F2F0'} />
        <Box p={[0, 0.03, 0]} s={[w, 0.06, t]} c={'#F2F2F0'} />
        <Box p={[-w / 2 + 0.03, h / 2, 0]} s={[0.06, h, t]} c={'#F2F2F0'} />
        <Box p={[w / 2 - 0.03, h / 2, 0]} s={[0.06, h, t]} c={'#F2F2F0'} />
        <Box p={[0, h / 2, 0]} s={[0.04, h, 0.05]} c={'#F2F2F0'} />
        <Box p={[0, h / 2, 0]} s={[w - 0.1, h - 0.1, 0.008]} c={it.color} rough={0.05} opacity={0.35} />
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
    switch (it.kind) {
      case 'base_door': case 'base_drawer': case 'base_sink': case 'base_hob': case 'base_corner': case 'base_pullout':
        return <BaseUnit it={it} settings={settings} />;
      case 'wall_cab': case 'wall_glass': case 'wall_shelf': case 'loft':
        return <WallUnit it={it} />;
      case 'tall_pantry': case 'tall_oven':
        return <TallUnit it={it} />;
      case 'fridge': case 'chimney': case 'dishwasher': case 'microwave':
        return <Appliance it={it} />;
      default:
        return <Furniture it={it} />;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [it.kind, it.w, it.d, it.h, it.color, settings.countertop, settings.countertopColor]);
}
