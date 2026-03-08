# Redshift Survivor

A bullet-heaven roguelite set in space, built with React Three Fiber. Pilot your spaceship through procedurally-spawned enemy waves, collect XP, choose boons, and fight your way across a galaxy of systems and boss encounters.

## Features

- Multiple playable ships with unique stats, starting weapons, and boon biases
- Weapon upgrade system with per-weapon progression
- Boon/rarity system with 40+ upgrades across 5 rarity tiers
- Galaxy map with planet rewards, dilemmas, and warp transitions
- Boss encounters with multi-phase behavior
- XP curve, level-up modal, and persistent run stats
- Companion dialogue and quest tracker systems
- Full audio system (music + SFX) via Howler
- Pause menu, game over, victory, and stats screens
- Ship skins and cosmetic unlocks

## Tech Stack

- **React Three Fiber / Three.js** — 3D rendering (R3F v9, Three.js r174)
- **Zustand v5** — state management
- **@react-three/drei** — helpers and utilities
- **@react-three/rapier** — physics (used for select interactions)
- **@react-three/postprocessing** — visual effects
- **Tailwind CSS v4** — UI styling
- **Howler** — audio engine
- **Vite** — build tool
- **Vitest** — unit testing

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Architecture

The project follows a 6-layer architecture:

```
Config/Data → Systems → Stores → GameLoop → Rendering → UI
```

- `src/config/` — game constants and tuning values
- `src/entities/` — data definitions (ships, enemies, weapons, boons, skins, galaxies…)
- `src/systems/` — pure logic (spawning, projectiles, collision, XP, upgrades…)
- `src/stores/` — Zustand stores (player, enemies, weapons, boss, boons…)
- `src/GameLoop.jsx` — single deterministic tick driving all systems
- `src/renderers/` — 3D visual components (ship, enemies, projectiles, VFX)
- `src/ui/` — HTML overlay UI (HUD, menus, modals)

## Controls

- **WASD / Arrow keys** — move
- **Mouse** — aim
- **Auto-fire** — weapons fire automatically
- **ESC / P** — pause

## Author

Adam Alet — [@nihdao](https://x.com/nihdao)

## License

MIT
