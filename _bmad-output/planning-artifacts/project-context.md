# Project Context — Redshift Survivor

## Projet

Bullet-heaven roguelite spatial en **React Three Fiber + HTML overlay**. Créé pour le ThreeJS Journey Challenge #022 — Spaceship par Bruno Simon.

Stack : React 18, React Three Fiber, Drei, Zustand, Tailwind v4, Vite.

---

## Architecture (6 couches — respecter l'ordre)

```
Config/Data  →  Systems  →  Stores  →  GameLoop  →  Rendering  →  UI
```

- **Zustand stores** : pattern `create((set, get) => ({ ...state, tick(), actions, reset() }))`
- **GameLoop** : un seul `useFrame` haute priorité, ordre déterministe sections 1–9
- **SFX** : joué depuis GameLoop, jamais depuis les stores
- **HUD** : divs HTML overlay, pas de 3D UI
- **Timer decay** : `Math.max(0, timer - delta)` dans `tick()`

---

## Design System : Redshift UI

> **Toutes les stories UI doivent respecter ce design system. Le skill `/redshift-ui` documente les patterns complets.**

### Palette — variables CSS dans `src/style.css :root {}`

```
--rs-bg:          #0d0b14    fond principal
--rs-bg-surface:  #1a1528    modals, panels
--rs-bg-raised:   #241d35    éléments interactifs
--rs-border:      #2e2545    bordures neutres
--rs-text:        #f5f0e8    texte principal
--rs-text-muted:  #7a6d8a    texte secondaire
--rs-text-dim:    #4a3f5c    labels très secondaires
--rs-orange:      #ff4f1f    accent principal (action, danger)
--rs-violet:      #9b5de5    XP, magie, companion
--rs-teal:        #00b4d8    navigation, minimap, info
--rs-gold:        #ffd60a    récompenses, fragments
--rs-danger:      #ef233c    HP, avertissement
--rs-success:     #2dc653    confirmation
```

### Typographie — Google Fonts chargées dans `index.html`

```
Bebas Neue   → titres (2.5rem+), letter-spacing 0.15em
Rajdhani     → corps (0.95–1rem), labels (600–700)
Space Mono   → valeurs tech, catégories HUD (0.65rem)
JAMAIS Inter / system-ui dans les éléments visibles
```

### Formes — clip-path angulaire (coin haut-droite), jamais border-radius

```
Modals :  polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)
Panels :  polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)
Boutons : polygon(0 0, calc(100% - 8px)  0, 100% 8px,  100% 100%, 0 100%)
```

### Anti-patterns à ne JAMAIS introduire

1. `fontFamily: 'Inter, system-ui'` → Rajdhani ou Bebas Neue
2. `backgroundColor: 'rgba(0,0,0,0.75)'` + `backdropFilter: blur` → `var(--rs-bg-surface)` opaque
3. `border: '1px solid rgba(255,255,255,0.1)'` → `var(--rs-border)`
4. `borderRadius: 'Xrem'` → clip-path angulaire
5. Hex hardcodés (`#cc66ff`, `#00ffcc`, `#ff6b35`…) → `var(--rs-*)`
6. Emojis (💀 ⭐ ♥ ↻ ⏭) → SVG inline depuis `src/ui/icons/index.jsx`
7. `boxShadow: '0 0 20px …'` décoratif → supprimer (sauf boss/danger justifié)
8. `<>` dans `.map()` → `<Fragment key={…}>` (import React)

### Hover bouton

```js
onMouseEnter: borderColor → var(--rs-orange), color → var(--rs-text), transform → translateX(4px)
onMouseLeave: reset
// JAMAIS scale(1.05)
```

---

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/GameLoop.jsx` | useFrame unique, sections 1–9 |
| `src/stores/useGame.jsx` | phase, isPaused, selectedGalaxyId |
| `src/stores/usePlayer.jsx` | position, rotation, stats |
| `src/stores/useLevel.jsx` | planets, wormholeState, scanning |
| `src/stores/useEnemies.jsx` | enemies pool, spawnEnemies, tick |
| `src/config/gameConfig.js` | constantes globales (PLAY_AREA_SIZE=2000, etc.) |
| `src/entities/galaxyDefs.js` | profils galaxie (planetCount, wormholeThreshold…) |
| `src/entities/planetDefs.js` | CINDER/PULSE/VOID planet types |
| `src/style.css` | variables --rs-* + keyframes |
| `src/ui/HUD.jsx` | minimap, stats, dash cooldown |
| `src/ui/icons/index.jsx` | SVG icons system (Epic 33) |

---

## Conventions de test

- Framework : **Vitest**
- Pattern stores : `beforeEach(() => useStore.getState().reset())`
- `reset()` doit inclure **tous** les champs du state (omission = pollution entre tests)
- Pas de tests pour les composants visuels purs (SVG icons, animations CSS)
