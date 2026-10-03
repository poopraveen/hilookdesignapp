# hilookdesignapp

**HiLook Design** is a local interior and modular-kitchen planner built with Next.js. Drag components onto a 2D floor plan, see them live in 3D (WebGL), and get a running cost estimate in rupees.

It opens with a three-room project, each room already laid out:

- **Kitchen 7×10** — the L-shaped "Sage & Oak" modular kitchen
- **Hall 12×16** — TV wall with fluted panel, L-sofa, pooja unit, shoe rack
- **Bedroom 11×12** — queen bed, sliding wardrobe with loft, dresser

Add more rooms from templates (kitchen, hall, bedroom, or empty) with **+ Add room**. The estimate shows each room and the whole home.

## Run it on your computer

**Windows, quickest:** download this repo (Code → Download ZIP), unzip it, and double-click **`start.bat`**. It installs packages on the first run and opens <http://localhost:3000>.

Or with a terminal — you need **Node.js 20 or newer** ([nodejs.org](https://nodejs.org)):

```bash
git clone https://github.com/poopraveen/hilookdesignapp.git
cd hilookdesignapp
npm install
npm run dev
```

Open <http://localhost:3000>.

For a faster production build: `npm run build` then `npm start`.

## What you can do

**Components (100+, Indian market style)**
- Kitchen: drawer, sink, hob, magic corner, LeMans, thali basket, cylinder trolley, wicker, dustbin, island, wall/glass/profile/lift-up units, loft, tall pantry, oven tower, fridge niche.
- Living / hall: sofas (3/2-seater, L-shaped, sofa-cum-bed), recliner, diwan, coffee/centre/side tables, TV units, fluted TV panel, crockery, bookshelf, pooja unit, jaali partition.
- Dining, bedroom (king/queen/single/bunk beds, hydraulic storage, sliding/hinged/mirror wardrobes, dresser, study), storage, appliances (fridges, chimney, washer, AC, TVs), decor (rugs, plants, lamps, mirror, curtains, art), doors and windows.

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
- Save the whole project or a single room as `.json`, and import either one (an imported room is added as a new room).
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

Add one entry to `CATALOG` in `lib/catalog.ts`: size, colour, how it mounts (`floor-wall`, `wall`, `free`, `opening`), a `model` style (`cabinet`, `sofa`, `bed`, `table`, `appliance`…) and either a `finish` (priced per sq ft) or a `price` (priced each). The 3D model, plan symbol, thumbnail and rate all follow from those fields.

All dimensions are in millimetres.
