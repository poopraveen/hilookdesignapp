'use client';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Edges, OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { catalogByKind } from '@/lib/catalog';
import { findCollisions, snapPosition } from '@/lib/geometry';
import { DND_MIME, useStore } from '@/lib/store';
import type { Item, Kind, Room } from '@/lib/types';
import { ItemModel, Opening } from './Items3D';

interface Api {
  camera: THREE.Camera;
  gl: THREE.WebGLRenderer;
  controls: { enabled: boolean; target: THREE.Vector3; object: THREE.Camera; update: () => void } | null;
  raycastPlane: (clientX: number, clientY: number, planeY: number) => THREE.Vector3 | null;
}

const OPENINGS = new Set(['door', 'window']);

export default function Scene3D() {
  const api = useRef<Api | null>(null);
  const [dropHint, setDropHint] = useState(false);
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const room = useStore((s) => s.design.room);

  const preset = (name: 'perspective' | 'top' | 'front' | 'side') => {
    const a = api.current;
    if (!a?.controls) return;
    const W = room.width / 1000, L = room.length / 1000, H = room.height / 1000;
    const cam = a.controls.object;
    const t = a.controls.target;
    if (name === 'perspective') { cam.position.set(W + 2.2, H + 1.5, L + 2.6); t.set(W * 0.4, 0.9, L * 0.45); }
    if (name === 'top') { cam.position.set(W / 2, Math.max(W, L) * 1.9 + 1, L / 2 + 0.001); t.set(W / 2, 0, L / 2); }
    if (name === 'front') { cam.position.set(W / 2, 1.6, L - 0.25); t.set(W / 2, 1.25, 0); }
    if (name === 'side') { cam.position.set(W - 0.25, 1.6, L / 2); t.set(0, 1.25, L / 2); }
    a.controls.update();
  };

  const screenshot = () => {
    const a = api.current;
    if (!a) return;
    const url = a.gl.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'interior-3d-view.png';
    link.click();
  };

  const onDrop = (e: React.DragEvent) => {
    setDropHint(false);
    const kind = e.dataTransfer.getData(DND_MIME) as Kind;
    if (!kind || !catalogByKind[kind] || !api.current) return;
    e.preventDefault();
    const p = api.current.raycastPlane(e.clientX, e.clientY, 0);
    if (!p) return;
    useStore.getState().addItem(kind, { x: p.x * 1000, y: p.z * 1000 });
  };

  return (
    <div
      className={`scene ${dropHint ? 'is-drop' : ''}`}
      onDragOver={(e) => { if (e.dataTransfer.types.includes(DND_MIME)) { e.preventDefault(); setDropHint(true); } }}
      onDragLeave={() => setDropHint(false)}
      onDrop={onDrop}
      onPointerDown={(e) => { downAt.current = { x: e.clientX, y: e.clientY }; }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ fov: 45, near: 0.05, far: 200, position: [room.width / 1000 + 2.2, room.height / 1000 + 1.5, room.length / 1000 + 2.6] }}
        onPointerMissed={(e) => {
          const d = downAt.current;
          if (d && Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) < 4) useStore.getState().select(null);
        }}
      >
        <SceneContent apiRef={api} />
      </Canvas>
      <div className="view-tag">3D</div>
      <div className="cam-bar" role="group" aria-label="Camera">
        <button type="button" onClick={() => preset('perspective')}>Corner</button>
        <button type="button" onClick={() => preset('front')}>Window wall</button>
        <button type="button" onClick={() => preset('side')}>Hob wall</button>
        <button type="button" onClick={() => preset('top')}>Top</button>
        <button type="button" onClick={screenshot}>Save image</button>
      </div>
      <p className="hint">Drag items along the floor · drag empty space to orbit · right-drag to pan · scroll to zoom</p>
    </div>
  );
}

function SceneContent({ apiRef }: { apiRef: MutableRefObject<Api | null> }) {
  const { camera, gl } = useThree();
  const controls = useThree((s) => s.controls) as Api['controls'];
  const design = useStore((s) => s.design);
  const selectedId = useStore((s) => s.selectedId);
  const { room, items } = design;
  const W = room.width / 1000, L = room.length / 1000;

  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    apiRef.current = {
      camera, gl, controls,
      raycastPlane: (cx, cy, planeY) => {
        const r = gl.domElement.getBoundingClientRect();
        ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const out = new THREE.Vector3();
        return raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY), out);
      },
    };
  }, [camera, gl, controls, apiRef]);

  const collisions = useMemo(() => findCollisions(items), [items]);

  // first framing
  const framed = useRef(false);
  useEffect(() => {
    if (framed.current || !controls) return;
    controls.target.set(W * 0.4, 0.9, L * 0.45);
    controls.update();
    framed.current = true;
  }, [controls, W, L]);

  return (
    <>
      <color attach="background" args={['#DDE1DF']} />
      <hemisphereLight args={['#FFFFFF', '#B9B2A6', 0.85]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[W / 2 + 2.5, 5, L / 2 + 3]} intensity={1.6} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
      />
      <pointLight position={[W / 2, room.height / 1000 - 0.15, L / 2]} intensity={2.2} distance={8} decay={1.6} color={'#FFF1DA'} />

      {/* outside ground + floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, -0.002, L / 2]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={'#CDD2CF'} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, 0, L / 2]} receiveShadow>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color={room.floorColor} roughness={0.85} />
      </mesh>
      <FloorTiles room={room} />

      <Walls room={room} items={items} />

      {items.filter((i) => !OPENINGS.has(i.kind)).map((it) => (
        <ItemNode key={it.id} it={it} selected={it.id === selectedId} clash={collisions.has(it.id)} apiRef={apiRef} />
      ))}

      <OrbitControls makeDefault enableDamping dampingFactor={0.12} maxPolarAngle={Math.PI / 2 - 0.02} minDistance={0.5} maxDistance={30} />
    </>
  );
}

function FloorTiles({ room }: { room: Room }) {
  // subtle 600x600 tile joints
  const geo = useMemo(() => {
    const pts: number[] = [];
    const W = room.width / 1000, L = room.length / 1000, s = 0.6;
    for (let x = s; x < W; x += s) pts.push(x, 0.001, 0, x, 0.001, L);
    for (let z = s; z < L; z += s) pts.push(0, 0.001, z, W, 0.001, z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [room.width, room.length]);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color={'#BDB6AB'} />
    </lineSegments>
  );
}

function ItemNode({ it, selected, clash, apiRef }: { it: Item; selected: boolean; clash: boolean; apiRef: MutableRefObject<Api | null> }) {
  const settings = useStore((s) => s.design.settings);

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const st = useStore.getState();
    st.select(it.id);
    if (it.locked) return;
    const a = apiRef.current;
    if (!a) return;
    const planeY = e.point.y;
    const dx = e.point.x * 1000 - it.x;
    const dy = e.point.z * 1000 - it.y;
    const startX = e.clientX, startY = e.clientY;
    let started = false;
    if (a.controls) a.controls.enabled = false;
    document.body.style.cursor = 'grabbing';

    const move = (ev: PointerEvent) => {
      if (!started) {
        if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 4) return;
        useStore.getState().checkpoint();
        started = true;
      }
      const p = a.raycastPlane(ev.clientX, ev.clientY, planeY);
      if (!p) return;
      const s = useStore.getState();
      const cur = s.design.items.find((i) => i.id === it.id);
      if (!cur) return;
      const px = p.x * 1000 - dx, py = p.z * 1000 - dy;
      const others = s.design.items.filter((o) => o.id !== cur.id && !OPENINGS.has(o.kind) && o.kind !== 'rug');
      const snapped = snapPosition(cur, px, py, s.design.room, others, {
        snap: s.design.settings.snap && !ev.altKey, grid: s.design.settings.gridMm, threshold: 60,
      });
      s.updateItem(cur.id, { x: snapped.x, y: snapped.y });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (a.controls) a.controls.enabled = true;
      document.body.style.cursor = '';
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const w = it.w / 1000, d = it.d / 1000, h = it.h / 1000;
  return (
    <group
      position={[it.x / 1000, it.elevation / 1000, it.y / 1000]}
      rotation={[0, (-it.rot * Math.PI) / 180, 0]}
      onPointerDown={onPointerDown}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = it.locked ? 'not-allowed' : 'grab'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <ItemModel it={it} settings={settings} />
      {(selected || clash) && (
        <mesh position={[0, h / 2 + (catalogByKind[it.kind]?.hasCounter && settings.countertop !== 'none' ? 0.01 : 0), 0]} raycast={() => null}>
          <boxGeometry args={[w + 0.012, h + 0.03, d + 0.012]} />
          <meshBasicMaterial visible={false} />
          <Edges color={selected ? '#2D5BD7' : '#C2412D'} lineWidth={selected ? 2.5 : 1.5} />
        </mesh>
      )}
    </group>
  );
}

// ---------------- walls with door/window openings, auto-hidden when they block the view ----------
interface WallDef { key: string; normal: THREE.Vector3; point: THREE.Vector3; rot: number; axis: 'x' | 'z' }

function Walls({ room, items }: { room: Room; items: Item[] }) {
  const W = room.width, L = room.length, H = room.height, t = room.wall;
  const defs: WallDef[] = useMemo(() => [
    { key: 'top', normal: new THREE.Vector3(0, 0, 1), point: new THREE.Vector3(W / 2000, 0, 0), rot: 0, axis: 'x' },
    { key: 'bottom', normal: new THREE.Vector3(0, 0, -1), point: new THREE.Vector3(W / 2000, 0, L / 1000), rot: 180, axis: 'x' },
    { key: 'left', normal: new THREE.Vector3(1, 0, 0), point: new THREE.Vector3(0, 0, L / 2000), rot: 270, axis: 'z' },
    { key: 'right', normal: new THREE.Vector3(-1, 0, 0), point: new THREE.Vector3(W / 1000, 0, L / 2000), rot: 90, axis: 'z' },
  ], [W, L]);
  const refs = useRef<Record<string, THREE.Group | null>>({});
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }) => {
    for (const d of defs) {
      const g = refs.current[d.key];
      if (!g) continue;
      tmp.copy(camera.position).sub(d.point);
      g.visible = tmp.dot(d.normal) > -0.05;
    }
  });

  const wallColor = room.wallColor;
  return (
    <group>
      {defs.map((def) => {
        const ops = items.filter((i) => OPENINGS.has(i.kind) && i.rot === def.rot);
        const uStart = -t, uEnd = (def.axis === 'x' ? W : L) + t;
        const intervals = ops
          .map((o) => {
            const c = def.axis === 'x' ? o.x : o.y;
            return { u1: c - o.w / 2, u2: c + o.w / 2, e: o.elevation, h: o.h };
          })
          .sort((a, b) => a.u1 - b.u1);
        const segs: { u1: number; u2: number; y1: number; y2: number }[] = [];
        let cur = uStart;
        for (const o of intervals) {
          if (o.u1 > cur) segs.push({ u1: cur, u2: o.u1, y1: 0, y2: H });
          if (o.e > 0) segs.push({ u1: o.u1, u2: o.u2, y1: 0, y2: o.e });
          if (o.e + o.h < H) segs.push({ u1: o.u1, u2: o.u2, y1: o.e + o.h, y2: H });
          cur = Math.max(cur, o.u2);
        }
        if (cur < uEnd) segs.push({ u1: cur, u2: uEnd, y1: 0, y2: H });
        const fixed = def.key === 'top' ? -t / 2 : def.key === 'bottom' ? L + t / 2 : def.key === 'left' ? -t / 2 : W + t / 2;
        return (
          <group key={def.key} ref={(g) => { refs.current[def.key] = g; }}>
            {segs.map((s, i) => {
              const len = (s.u2 - s.u1) / 1000, hh = (s.y2 - s.y1) / 1000;
              const u = (s.u1 + s.u2) / 2000, y = (s.y1 + s.y2) / 2000, f = fixed / 1000;
              const pos: [number, number, number] = def.axis === 'x' ? [u, y, f] : [f, y, u];
              const size: [number, number, number] = def.axis === 'x' ? [len, hh, t / 1000] : [t / 1000, hh, len];
              return (
                <mesh key={i} position={pos} castShadow receiveShadow raycast={() => null}>
                  <boxGeometry args={size} />
                  <meshStandardMaterial color={wallColor} roughness={0.95} />
                </mesh>
              );
            })}
            {ops.map((o) => (
              <OpeningNode key={o.id} it={o} room={room} />
            ))}
          </group>
        );
      })}
    </group>
  );
}

function OpeningNode({ it, room }: { it: Item; room: Room }) {
  const selected = useStore((s) => s.selectedId === it.id);
  return (
    <group
      position={[it.x / 1000, it.elevation / 1000, it.y / 1000]}
      rotation={[0, (-it.rot * Math.PI) / 180, 0]}
      onPointerDown={(e) => { e.stopPropagation(); useStore.getState().select(it.id); }}
    >
      <Opening it={it} wallT={room.wall} />
      {selected && (
        <mesh position={[0, it.h / 2000, 0]} raycast={() => null}>
          <boxGeometry args={[it.w / 1000 + 0.01, it.h / 1000 + 0.01, room.wall / 1000 + 0.01]} />
          <meshBasicMaterial visible={false} />
          <Edges color={'#2D5BD7'} />
        </mesh>
      )}
    </group>
  );
}
