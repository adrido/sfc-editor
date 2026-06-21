# SFC Editor — IEC 61131-3

A browser-based visual editor for drawing **Sequential Function Chart (SFC)** diagrams conforming to **IEC 61131-3**, with export to **SVG** and **PNG**.

> Short reference: See [IEC-61131-3-SFC.md](IEC-61131-3-SFC.md) for the supported SFC model, validation rules, and JSON data format used by this editor.

## Features

- Visual canvas editor for IEC 61131-3 SFC elements
- **Steps** (including initial step with double border)
- **Transitions** with condition expressions
- **Actions** with all standard qualifiers: `N`, `S`, `R`, `P`, `D`, `L`, `SD`, `DS`, `SL`, `P1`, `P0`
- **Alternative branches** (single horizontal bar; lanes start/end with transitions)
- **Simultaneous branches** (double horizontal bar; lanes start/end with steps)
- Nested branching support
- Jump labels on branch bars
- IEC validation with diagnostics panel
- Save/load `.sfc.json` files
- Export to SVG and PNG (2× resolution)
- Undo/redo and keyboard shortcuts

## Getting started

```bash
cd ~/Projekte/sfc-editor
npm install
npm run dev
```

Open the URL shown by Vite (typically `http://localhost:5173`).

## Usage

1. Start with the initial step on a blank diagram.
2. Select a **step** → use the toolbox to add a transition, action, or alternative branch.
3. Select a **transition** → add a step below or insert a simultaneous branch.
4. Select a **branch** → add lanes or convert between alternative/parallel.
5. Edit names, conditions, qualifiers, and times in the **Properties** panel.
6. Click **Validate** to check IEC 61131-3 rules.
7. Use **Export SVG** or **Export PNG** for output.

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected element |

## File format

Diagrams are stored as JSON (`.sfc.json`):

```json
{
  "version": 1,
  "title": "MySequence",
  "root": [ /* steps, transitions, branches */ ]
}
```

Example diagrams are in [`examples/`](examples/).

## IEC 61131-3 element overview

| Element | Representation |
|---|---|
| Initial step | Double-bordered rectangle |
| Step | Rectangle with name |
| Transition | Horizontal bar with condition |
| Action | Attached block: `qualifier Name(time)` |
| Alternative branch | Single horizontal synchronization bar |
| Simultaneous branch | Double horizontal synchronization bar |

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm test         # Run unit tests
```

## Project structure

```
src/
├── model/         # SFC data types and defaults
├── store/         # Zustand diagram state + undo/redo
├── layout/        # Custom SFC layout engine
├── render/        # SVG renderer
├── validation/    # IEC 61131-3 rule engine
├── export/        # SVG/PNG/JSON export
└── editor/        # UI components
```

## License

MIT
