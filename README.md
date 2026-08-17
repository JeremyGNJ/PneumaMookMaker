# Pneuma Mook Maker

A TypeScript module for Foundry Virtual Tabletop v12 and Cyberpunk RED Core.

## Development

Requirements: Node.js 20 or newer.

```sh
npm install
npm run check
npm run build
```

The build is written to `dist/`. For local Foundry development, place or link that directory at:

```text
<Foundry user data>/Data/modules/pneuma-mook-maker
```

The module requires Cyberpunk RED Core v0.92.1 or newer. Its implementation
entry point is `src/scripts/main.ts`.

### Source layout

- `tokens.ts` registers token creation and Token HUD hooks.
- `mook-form.ts` renders the Mook Maker form and validates user input.
- `apply-mook.ts` applies changes transactionally and rolls back failures.
- `armor.ts`, `skills.ts`, and `stats.ts` contain calculation/update helpers.
- `purge.ts` and `promotion.ts` own their respective workflows.
- `folders.ts` manages MookMaker folders and the versioned default template.

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
