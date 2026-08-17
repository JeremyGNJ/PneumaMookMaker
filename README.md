# Pneuma Mook Maker


## Current behavior

- On startup, a GM creates (or reuses) `MookMaker/Templates` and
  `MookMaker/Promoted` in the Actors directory.
- A `Default Mook` Actor is created in `Templates` as a Cyberpunk RED
  `character`, with an unlinked prototype Token and its embedded skills and
  equipment.
- Dropping an Actor directly from `MookMaker/Templates` onto a scene marks the
  resulting unlinked Token with the module flag `CreatedByMookMaker`.
- Right-clicking a marked Token opens the normal Token HUD with a gold hammer
  control for the Mook Maker dialog.
- Apply can rename the synthetic Actor and Token, set BODY/WILL-derived HP,
  MOVE, Combat Number skill levels, armor, and Role rank.
- Purge Gear removes unused gear while preserving ammunition, carried/equipped
  items, and complete installed-item trees. Its warning can be disabled in
  module settings.
- Promote creates a linked Actor in `MookMaker/Promoted`, links the current
  Token to it, and marks the Token as promoted from MookMaker.
