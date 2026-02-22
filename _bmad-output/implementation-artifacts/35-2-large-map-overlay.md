# Story 35.2: Large Map Overlay (Touche M)

Status: backlog

## Story

As a player,
I want to open a large semi-transparent map with the M key that shows my exploration progress without pausing the game,
So that I can plan my route through the system while staying exposed to danger.

## Acceptance Criteria

1. **[M key toggle]** Pendant `phase === 'gameplay'` et `isPaused === false`, appuyer sur M ouvre/ferme la grande carte (toggle). Appuyer sur Escape ferme aussi la carte si ouverte.

2. **[Game not paused]** `useGame.isPaused` reste `false` quand la carte est ouverte. Le jeu continue de tourner.

3. **[Semi-transparent overlay]** Background `var(--rs-bg)` à 85% opacity, couvre environ 80% de l'écran centré. Le gameplay reste visible et lisible derrière.

4. **[Shape]** Bordure `1px solid var(--rs-border)`, clip-path angulaire coin haut-droite 16px. Pas de border-radius générique.

5. **[Fog rendering]** Les cellules non-découvertes : fond sombre `var(--rs-bg)` à 95% opacity. Les cellules découvertes : `var(--rs-bg-raised)` à 60% opacity. Rendu via canvas 2D (60×60px canvas scalé CSS).

6. **[Planets on map]** Les planètes découvertes (dont la position est dans une zone explorée OU qui ont été vues sur minimap) sont affichées : CINDER `#a07855`, PULSE `#00b4d8`, VOID `#9b5de5`. Planètes scannées : 30% opacity. Non-scannées : 100% opacity.

7. **[Wormhole on map]** Si `wormholeState !== 'hidden'`, le trou de ver est affiché comme un point pulsant `var(--rs-violet)` à sa position sur la carte.

8. **[Player on map]** Triangle SVG à la position du joueur, orienté selon `usePlayer.rotation`, couleur `var(--rs-teal)`.

9. **[No enemies on map]** Les ennemis NE sont PAS affichés sur la grande carte.

10. **[Cardinal directions]** N / S / E / W aux bords de la carte, font `Space Mono`, `var(--rs-text-muted)`.

11. **[Refresh rate]** La carte se met à jour toutes les 100ms (setInterval ou useEffect polling) — pas de subscription temps-réel à 60fps.

12. **[Closes on phase change]** Si le jeu passe en `levelUp`, `planetReward`, `paused`, etc., la carte se ferme automatiquement.

## Tasks / Subtasks

- [ ] Task 1: Créer `src/ui/MapOverlay.jsx`
  - [ ] State local `isOpen` (ou géré par HUD parent)
  - [ ] keydown handler sur `window` pour M et Escape
  - [ ] Fermeture automatique si phase change (useEffect sur phase)
  - [ ] Rendu conditionnel : `if (!isOpen) return null`

- [ ] Task 2: Canvas fog rendering
  - [ ] `useRef` pour le canvas 60×60
  - [ ] `useEffect` + `setInterval(100ms)` pour refresh
  - [ ] Dans l'intervalle : lire `getDiscoveredCells()`, dessiner cellule par cellule
  - [ ] CSS scale sur le canvas pour le rendre à taille affichée

- [ ] Task 3: Planets et wormhole overlay
  - [ ] Positions monde → coordonnées canvas (world [−2000,+2000] → canvas [0,60])
  - [ ] SVG ou canvas overlay pour dots planètes et wormhole
  - [ ] Lire `useLevel.getState().planets` et `wormhole` / `wormholeState` dans l'interval de refresh

- [ ] Task 4: Player triangle
  - [ ] Lire `usePlayer.getState().position` et `usePlayer.getState().rotation` dans l'interval
  - [ ] SVG triangle inline positionné absolument sur la carte
  - [ ] CSS `transform: rotate(${rotation}rad)`

- [ ] Task 5: Intégrer dans HUD ou Interface
  - [ ] Ajouter `<MapOverlay />` dans `HUD.jsx` ou `Interface.jsx`
  - [ ] S'assurer que `pointer-events-none` est overridé pour la carte (elle doit recevoir les events clavier via window listener, pas besoin de pointer events sur l'overlay lui-même)

## Technical Notes

**World coord → canvas pixel:**
```js
function worldToCanvas(wx, wz) {
  const HALF = 2000
  const cx = ((wx + HALF) / (HALF * 2)) * 60
  const cz = ((wz + HALF) / (HALF * 2)) * 60
  return { cx, cz }
}
```

**Canvas fog rendering:**
```js
const ctx = canvasRef.current.getContext('2d')
const cells = getDiscoveredCells()
ctx.clearRect(0, 0, 60, 60)
for (let z = 0; z < 60; z++) {
  for (let x = 0; x < 60; x++) {
    const discovered = cells[z * 60 + x] === 1
    ctx.fillStyle = discovered
      ? 'rgba(36, 29, 53, 0.6)'   // --rs-bg-raised 60%
      : 'rgba(13, 11, 20, 0.95)'   // --rs-bg 95%
    ctx.fillRect(x, z, 1, 1)
  }
}
```

**Map overlay style:**
```js
{
  position: 'fixed',
  top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80vw', height: '80vh',
  backgroundColor: 'rgba(13, 11, 20, 0.85)',
  border: '1px solid var(--rs-border)',
  clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
  zIndex: 45,
  pointerEvents: 'none',  // fermeture via keydown seulement
}
```

**Note zoom canvas:** Le canvas natif est 60×60. CSS: `width: 100%; height: 100%; image-rendering: pixelated` pour un rendu net de la grille sans interpolation.
