# Pneuma Mook Maker

A TypeScript module for Foundry Virtual Tabletop v12 (verified against v12.331).

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

The module is intentionally system-agnostic at this stage. Its implementation entry point is `src/scripts/main.ts`.

