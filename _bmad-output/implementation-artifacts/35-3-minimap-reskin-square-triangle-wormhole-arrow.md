# Story 35.3: Minimap Reskin — Carré, Triangle Joueur, Flèche Trou de Ver

Status: backlog

## Story

As a player,
I want the minimap to show my direction of travel and point me toward the wormhole when it's off-screen,
So that navigation is intuitive without opening the full map.

## Acceptance Criteria

1. **[Forme carrée angulaire]** Le container minimap utilise `clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)` au lieu de `borderRadius: '50%'`. La forme est carrée et angulaire dans le style Redshift.

2. **[Bordure et fond Redshift]** `border: '2px solid var(--rs-teal)'` (remplace l'ancienne bordure cyan rgba). Background: `var(--rs-bg-surface)` (remplace `rgba(0,0,0,0.65)`).

3. **[Triangle joueur]** Le point joueur (actuellement un cercle blanc) est remplacé par un triangle SVG inline 8×10px, couleur `var(--rs-teal)`, centré au milieu de la minimap (position fixe sur le canvas 2D de la minimap).

4. **[Rotation du triangle]** Le triangle rotate avec `usePlayer.rotation` via CSS `transform: rotate(${rotation}rad)`. Les labels NESW restent fixes — ils NE tournent PAS.

5. **[Wormhole dans le radar]** Quand le trou de ver est présent (`wormholeState !== 'hidden'`) et que sa position est dans `MINIMAP_VISIBLE_RADIUS` du joueur, il est affiché comme un point violet pulsant (comportement actuel préservé, juste restyled `var(--rs-violet)`).

6. **[Flèche trou de ver hors radar]** Quand le trou de ver est présent MAIS sa position dépasse `MINIMAP_VISIBLE_RADIUS`, un petit triangle-flèche SVG de 6px (`var(--rs-violet)`) est positionné sur le bord de la minimap, dans la direction du trou de ver.

7. **[Calcul de la position de la flèche]** La flèche se place à l'intersection de la droite joueur→trou de ver avec le bord carré de la minimap :
   ```
   angle = atan2(wormhole.z - player.z, wormhole.x - player.x)
   scale = 0.5 / max(|cos(angle)|, |sin(angle)|)
   edgeX = 50 + cos(angle) * scale * 100  (%)
   edgeZ = 50 + sin(angle) * scale * 100  (%)
   ```
   La flèche pointe dans la direction `angle`.

8. **[Pas de flèche si wormholeState === 'hidden']** Aucune flèche n'est affichée avant que le trou de ver soit spawné.

9. **[Anti-patterns supprimés]** `borderRadius: '50%'`, `rgba(0,0,0,0.65)`, le hex `#0ff` ou tout cyan hardcodé → remplacés par les variables `--rs-*`.

10. **[NESW labels restyled]** Couleur `var(--rs-text-muted)`, `fontFamily: 'Space Mono, monospace'`, `fontSize: '0.5rem'`.

## Tasks / Subtasks

- [ ] Task 1: Modifier le container minimap dans `HUD.jsx`
  - [ ] Remplacer `borderRadius: '50%'` par `clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)'`
  - [ ] Mettre à jour `border` → `'2px solid var(--rs-teal)'`
  - [ ] Mettre à jour `background` → `'var(--rs-bg-surface)'`

- [ ] Task 2: Remplacer le point joueur par un triangle SVG
  - [ ] Identifier le rendu du joueur dans la minimap (div cercle blanc centré)
  - [ ] Remplacer par un `<svg>` inline : triangle `▲` (path ou polygon)
  - [ ] Lire `usePlayer.getState().rotation` dans le composant (ou via selector)
  - [ ] Appliquer `transform: rotate(${rotation}rad)` sur le SVG triangle
  - [ ] Dimensions : 8px large × 10px haut, couleur `var(--rs-teal)`

- [ ] Task 3: Wormhole edge arrow
  - [ ] Lire `useLevel.getState().wormhole` et `wormholeState`
  - [ ] Calculer si le trou de ver est dans le rayon ou hors rayon
  - [ ] Si hors rayon : calculer `angle`, `edgeX`, `edgeZ` avec la formule du bord carré
  - [ ] Rendre un SVG flèche (triangle 6px) positionné en `position: absolute`, `left: edgeX%`, `top: edgeZ%`
  - [ ] La flèche rotate de `angle` radians pour pointer vers le trou de ver

- [ ] Task 4: Restyler les labels NESW
  - [ ] `fontFamily: 'Space Mono, monospace'`
  - [ ] `color: 'var(--rs-text-muted)'`
  - [ ] `fontSize: '0.5rem'`

- [ ] Task 5: Tests visuels
  - [ ] Vérifier que le triangle tourne correctement quand le joueur fait un cercle
  - [ ] Vérifier que la flèche apparaît au bord correct quand wormhole est spawné hors minimap
  - [ ] Vérifier que la minimap est visuellement carrée et angulaire (pas de coins ronds)

## Technical Notes

**Triangle SVG inline pour le joueur :**
```jsx
<svg
  width="8"
  height="10"
  viewBox="0 0 8 10"
  style={{
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: `translate(-50%, -50%) rotate(${rotation}rad)`,
    color: 'var(--rs-teal)',
    zIndex: 10,
    pointerEvents: 'none',
  }}
>
  <polygon points="4,0 8,10 0,10" fill="var(--rs-teal)" />
</svg>
```

**Triangle flèche pour le trou de ver (hors radar) :**
```jsx
<svg
  width="6"
  height="8"
  viewBox="0 0 6 8"
  style={{
    position: 'absolute',
    left: `${edgeX}%`,
    top: `${edgeZ}%`,
    transform: `translate(-50%, -50%) rotate(${wormholeAngle}rad)`,
    pointerEvents: 'none',
  }}
>
  <polygon points="3,0 6,8 0,8" fill="var(--rs-violet)" />
</svg>
```

**Calcul position bord :**
```js
function getMinimapEdgePosition(playerX, playerZ, targetX, targetZ) {
  const dx = targetX - playerX
  const dz = targetZ - playerZ
  const angle = Math.atan2(dz, dx)
  const abscos = Math.abs(Math.cos(angle))
  const abssin = Math.abs(Math.sin(angle))
  const scale = 0.5 / Math.max(abscos, abssin)
  return {
    edgeX: 50 + Math.cos(angle) * scale * 100,  // %
    edgeZ: 50 + Math.sin(angle) * scale * 100,  // %
    angle,
  }
}
```

**Note sur la rotation joueur :** `usePlayer.rotation` est en radians (radians depuis la Story 21.1). La minimap est orientée nord = haut = Z négatif en world space. Vérifier l'axe de rotation (Y axis) et l'offset angulaire si nécessaire pour que le triangle pointe dans la bonne direction.

**Note sur les performances :** Le composant HUD est rendu à 60fps côté React. La lecture de `usePlayer.getState().rotation` dans un selector provoque un re-render à chaque changement de rotation — acceptable pour la minimap mais surveiller si d'autres usages s'accumulent. Alternative : ne lire rotation que toutes les 100ms via `useState + setInterval`.
