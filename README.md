# hilookdesignapp

**HiLook Design** is a local interior and modular-kitchen planner built with Next.js. Drag components onto a 2D floor plan, see them live in 3D (WebGL), and get a running cost estimate in rupees.

It opens with a 7 ft × 10 ft L-shaped "Sage & Oak" kitchen already laid out.

## Run it on your computer

You need **Node.js 20 or newer** ([nodejs.org](https://nodejs.org)).

```bash
git clone https://github.com/poopraveen/hilookdesignapp.git
cd hilookdesignapp
npm install
npm run dev
```

Open <http://localhost:3000>.

For a faster production build: `npm run build` then `npm start`.

## What you can do

**2D plan (HTML canvas)**
- Drag a component from the left panel onto the plan, or press **Add**. Cabinets land flush against the nearest wall, facing into the room.
- Drag to move. Units snap to walls, to the edges of other units and to the grid. Hold **Alt** to move freely.
- Drag the square handles to change the width.
- Live distances to every wall are shown in blue.
- Overlapping units are hatched in red.
- Scroll to zoom, drag empty floor to pan, double-click to fit.

**3D view (react-three-fiber / three.js)**
- Drag items along the floor directly in 3D.
- Orbit, pan and zoom the camera. The wall nearest the camera hides itself so you can always see inside.
- Camera presets, and **Save image** for a PNG.

**Estimate & rates**
- Cabinets are priced per sq ft of front area for each material and finish.
- Countertop is priced per running foot (quartz or granite).
- Hardware, appliances, LED strip, installation % and GST are included.
- Every rate is editable in the **Rates** tab. The defaults are sample Chennai-market numbers; replace them with your vendor quotes.
- Download the estimate as CSV, or print it.

**Project**
- Autosaves in the browser.
- Save or open a design as a `.json` file.
- Change the room size, ceiling height, wall thickness and colours.
- Undo / redo.

## Keyboard

| Key | Action |
| --- | --- |
| `R` / `Shift+R` | Rotate 90° |
| `Delete` | Delete selected |
| `Ctrl+D` | Duplicate |
| `Ctrl+Z` / `Ctrl+Y` | Undo / redo |
| Arrow keys | Nudge 10 mm (`Shift` = 100 mm) |
| `Esc` | Deselect |

## Project layout

```
app/                 Next.js app router (page + global styles)
components/
  Planner.tsx        App shell, top bar, keyboard shortcuts
  PlanCanvas.tsx     2D canvas: drawing, snapping, drag/resize, drop target
  Scene3D.tsx        3D scene: walls with openings, lights, drag on floor
  Items3D.tsx        3D models for every component type
  CatalogPanel.tsx   Component library (drag source)
  SidePanels.tsx     Item inspector, estimate, rates, room/project
lib/
  catalog.ts         Component catalogue + default rates  ← add new items here
  pricing.ts         Estimate / bill-of-quantities logic
  geometry.ts        Footprints, snapping, collisions
  store.ts           Zustand store with undo/redo + autosave
  presets.ts         The 7×10 kitchen and an empty room
```

### Add a new component

1. Add a `Kind` in `lib/types.ts`.
2. Add a catalogue entry (size, colour, finish, rate key) in `lib/catalog.ts`.
3. Give it a 3D model in `components/Items3D.tsx`. Unknown kinds fall back to a box.
4. Optionally give it a plan symbol in `drawSymbol` in `components/PlanCanvas.tsx`.

All dimensions are in millimetres.
