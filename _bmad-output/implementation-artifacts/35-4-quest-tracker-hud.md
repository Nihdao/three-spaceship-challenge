# Story 35.4: Quest Tracker HUD

Status: backlog

## Story

As a player,
I want to see my current objective displayed below the minimap,
So that I always know what to do next without ambiguity.

## Acceptance Criteria

1. **[Nouveau composant]** `src/ui/QuestTracker.jsx` est créé et intégré dans `HUD.jsx` sous la minimap.

2. **[Objectif SCAN PLANETS]** Quand `wormholeState === 'hidden'` et `bossActive === false` :
   - Label : `SCAN PLANETS`
   - Compteur : `X / Y` où X = planètes scannées, Y = seuil (ex. `8 / 12`)
   - Couleur : `var(--rs-teal)`

3. **[Objectif LOCATE THE WORMHOLE]** Quand `wormholeState === 'visible'` ou `'activating'` :
   - Label : `LOCATE THE WORMHOLE`
   - Couleur : `var(--rs-violet)`
   - Animation : pulse lente `opacity` 0.7 → 1.0 en alternance 500ms

4. **[Objectif DESTROY THE GUARDIAN]** Quand `bossActive === true` :
   - Label : `DESTROY THE GUARDIAN`
   - Couleur : `var(--rs-danger)`
   - Animation : pulse rapide 300ms

5. **[Objectif ENTER THE WORMHOLE]** Quand `wormholeState === 'reactivated'` :
   - Label : `ENTER THE WORMHOLE`
   - Couleur : `var(--rs-violet)`
   - Animation : pulse lente 500ms

6. **[Caché hors gameplay]** Si `phase !== 'gameplay'` ou `isPaused === true`, le composant retourne `null`.

7. **[Style panel]** `border-left: 3px solid <questColor>` (la couleur change selon l'objectif). Background : `var(--rs-bg-surface)`. Width égale à la minimap (via className ou style calculé).

8. **[Typographie]** Label : Bebas Neue, UPPERCASE, `letter-spacing: 0.08em`, `fontSize: '0.75rem'`. Compteur X/Y : Space Mono, même taille.

9. **[Calcul du seuil]** Le seuil Y est calculé : `Math.ceil(galaxyConfig.planetCount * galaxyConfig.wormholeThreshold)`. Si `galaxyConfig` est null (pas de profil), fallback : `Math.ceil(planets.length * 0.75)`.

10. **[Pas de re-render à 60fps]** Le composant utilise des selectors Zustand granulaires (pas de `useLevel(state => state)` global) pour minimiser les re-renders.

## Tasks / Subtasks

- [ ] Task 1: Créer `src/ui/QuestTracker.jsx`
  - [ ] Props : `minimapWidth` (optionnel, pour aligner la largeur)
  - [ ] Lire `phase` et `isPaused` depuis `useGame`
  - [ ] Lire `wormholeState`, `planets` depuis `useLevel`
  - [ ] Lire `bossActive` depuis `useEnemies` (ou `useLevel` si stocké là)
  - [ ] Calculer `scannedCount` et `threshold`
  - [ ] Lire `selectedGalaxyId` depuis `useGame` → `getGalaxyById()` → `galaxyConfig`
  - [ ] Retourner null si non-gameplay ou paused

- [ ] Task 2: Logique d'objectif courant
  - [ ] Priorité : `bossActive` > `wormholeState === 'reactivated'` > `wormholeState !== 'hidden'` > default (scan)
  - [ ] Définir un objet `QUEST_CONFIG` local :
    ```js
    const QUEST_STATES = {
      scan:     { label: 'SCAN PLANETS',        color: 'var(--rs-teal)',   pulse: 'none' },
      locate:   { label: 'LOCATE THE WORMHOLE', color: 'var(--rs-violet)', pulse: 'slow' },
      boss:     { label: 'DESTROY THE GUARDIAN',color: 'var(--rs-danger)', pulse: 'fast' },
      enter:    { label: 'ENTER THE WORMHOLE',  color: 'var(--rs-violet)', pulse: 'slow' },
    }
    ```

- [ ] Task 3: CSS animations pulse
  - [ ] Ajouter dans `src/style.css` :
    ```css
    @keyframes quest-pulse-slow { 0%, 100% { opacity: 1 } 50% { opacity: 0.7 } }
    @keyframes quest-pulse-fast { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
    ```
  - [ ] Appliquer via inline style `animation: 'quest-pulse-slow 500ms infinite alternate'`

- [ ] Task 4: Intégrer dans `HUD.jsx`
  - [ ] Importer `<QuestTracker />` dans `HUD.jsx`
  - [ ] Positionner sous la minimap (`top-right` cluster)
  - [ ] Passer `minimapWidth` si nécessaire (ou utiliser même width fixe)

- [ ] Task 5: Tests
  - [ ] Vérifier le rendu à chaque état : scan (0/12), scan (11/12), locate, boss, enter
  - [ ] Vérifier que le composant est invisible en pause et hors gameplay
  - [ ] Vérifier que le seuil Y est correct pour Andromeda Reach (15 planètes × 75% = 12)

## Technical Notes

**Structure du composant :**
```jsx
import { useGame } from '../stores/useGame'
import { useLevel } from '../stores/useLevel'
import { useEnemies } from '../stores/useEnemies'
import { getGalaxyById } from '../entities/galaxyDefs'

export function QuestTracker() {
  const phase = useGame(s => s.phase)
  const isPaused = useGame(s => s.isPaused)
  const wormholeState = useLevel(s => s.wormholeState)
  const planets = useLevel(s => s.planets)
  const bossActive = useEnemies(s => s.bossActive)
  const selectedGalaxyId = useGame(s => s.selectedGalaxyId)

  if (phase !== 'gameplay' || isPaused) return null

  const galaxyConfig = getGalaxyById(selectedGalaxyId)
  const planetCount = galaxyConfig?.planetCount ?? planets.length
  const threshold = Math.ceil(planetCount * (galaxyConfig?.wormholeThreshold ?? 0.75))
  const scannedCount = planets.filter(p => p.scanned).length

  // Determine current quest
  let quest = 'scan'
  if (bossActive) quest = 'boss'
  else if (wormholeState === 'reactivated') quest = 'enter'
  else if (wormholeState !== 'hidden') quest = 'locate'

  const cfg = QUEST_STATES[quest]

  return (
    <div style={{
      borderLeft: `3px solid ${cfg.color}`,
      background: 'var(--rs-bg-surface)',
      padding: '4px 8px',
      // ...
    }}>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', color: cfg.color, /* ... */ }}>
        {cfg.label}
      </div>
      {quest === 'scan' && (
        <div style={{ fontFamily: 'Space Mono, monospace', color: cfg.color, /* ... */ }}>
          {scannedCount} / {threshold}
        </div>
      )}
    </div>
  )
}
```

**Note sur `bossActive` :** Vérifier où est stocké `bossActive` — dans `useEnemies` ou dans une variable de GameLoop. Si c'est uniquement une variable de GameLoop (ref), il faudra peut-être l'ajouter au store `useLevel` ou `useEnemies` pour que QuestTracker puisse y réagir. Sinon, dériver l'état boss depuis `wormholeState === 'active'` (qui correspond à la phase boss) comme fallback.

**Note sur le seuil planètes scannées :** Le composant QuestTracker calcule le threshold lui-même depuis galaxyConfig — ne pas l'importer depuis GameLoop (couplage non souhaité). Accepter une légère duplication du calcul.
