# Momentum v13 (GO build, 0.0.3)

Additions in this build:
- **Currency**: simplified (no extra short label). Numeric `amount` is **directly editable** and supports **mouse wheel** changes on hover:
  - Wheel up: +1 (Shift: +10)
  - Wheel down: −1 (Shift: −10)

Carried from prior build:
- v13 compatibility, basic Actor sheet.
- Reusable **track widget** with per-cell marks:
  - Left-click: outline (+1), Right-click: fill (−1), Shift+Left: slash (0), Shift+Right: cross (0).
- Display value = outlines − fills.
- Default shapes/colors: Anchor (red/circles), Aspect (green/triangles), Resource (blue/squares); other Tag types default to green triangles.
- **Facets** everywhere.
- Scaffolding for Aspect/Resource containment and future layout customization.

Next milestones:
- Parent/child links with compact chips + click-through.
- Drag-drop routing into parent panels.
- Layout persistence and “customize layout” mode.
