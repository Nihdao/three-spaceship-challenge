# Story 45.2: Carte en toggle (M = ouvrir/fermer)

Status: done

## Story

As a player,
I want to press M to open the map and press M again to close it,
So that I can navigate the map without holding a key.

## Acceptance Criteria

1. **Given** `src/ui/MapOverlay.jsx` — `onKeyDown` handler
   **When** M est pressé et `!isPaused` et `!e.repeat`
   **Then** `setIsOpen(prev => !prev)` est appelé (toggle) — plus de `setIsOpen(true)` one-way

2. **Given** `src/ui/MapOverlay.jsx` — `onKeyUp` handler
   **When** le fichier est ouvert
   **Then** le handler `onKeyUp` est **entièrement supprimé** : ni la function, ni le `addEventListener`, ni le `removeEventListener` dans le cleanup

3. **Given** l'état `isOpen`
   **When** le jeu passe en pause (`isPaused` devient `true`)
   **Then** la carte se ferme automatiquement via un `useGame.subscribe` sur `isPaused` :
   ```js
   const unsub = useGame.subscribe(s => s.isPaused, (paused) => { if (paused) setIsOpen(false) })
   return unsub
   ```

4. **Given** l'état `isOpen`
   **When** la `phase` change et quitte `'gameplay'`
   **Then** la carte se ferme automatiquement via un `useGame.subscribe` sur `phase` :
   ```js
   const unsub = useGame.subscribe(s => s.phase, (phase) => { if (phase !== 'gameplay') setIsOpen(false) })
   return unsub
   ```

5. **Given** M maintenu appuyé (key repeat)
   **When** `e.repeat === true`
   **Then** le toggle n'est PAS déclenché — guard `if (!e.repeat)` conservé tel quel dans `onKeyDown`

6. **Given** `src/ui/__tests__/MapOverlay.test.jsx`
   **When** les tests tournent
   **Then** ils passent sans modification — ils testent uniquement `worldToMapPct` (fonction pure), aucun rapport avec le comportement toggle

## Tasks / Subtasks

- [x] Modifier `onKeyDown` dans le `useEffect` key handler (AC: #1)
  - [x] Remplacer `setIsOpen(true)` par `setIsOpen(prev => !prev)`
- [x] Supprimer `onKeyUp` complètement (AC: #2)
  - [x] Supprimer la function `onKeyUp`
  - [x] Supprimer `window.addEventListener('keyup', onKeyUp, true)`
  - [x] Supprimer `window.removeEventListener('keyup', onKeyUp, true)` du cleanup
- [x] Ajouter auto-close sur pause (AC: #3)
  - [x] Ajouter un `useEffect` avec `useGame.subscribe(s => s.isPaused, ...)`
- [x] Ajouter auto-close sur changement de phase (AC: #4)
  - [x] Ajouter un `useEffect` avec `useGame.subscribe(s => s.phase, ...)`
- [x] Vérifier `e.repeat` guard conservé (AC: #5)
- [x] Lancer `vitest run` et vérifier que les 5 tests `worldToMapPct` passent (AC: #6)

## Dev Notes

### Analyse du fichier cible

Le fichier `src/ui/MapOverlay.jsx` contient actuellement (lignes 32–48) un `useEffect` avec deux handlers :

```js
const onKeyDown = (e) => {
  if ((e.key === 'm' || e.key === 'M') && !e.repeat) {
    const { isPaused } = useGame.getState()
    if (!isPaused) setIsOpen(true)   // ← CHANGE: setIsOpen(prev => !prev)
  }
}
const onKeyUp = (e) => {              // ← SUPPRIMER ENTIÈREMENT
  if (e.key === 'm' || e.key === 'M') setIsOpen(false)
}
window.addEventListener('keydown', onKeyDown, true)
window.addEventListener('keyup', onKeyUp, true)    // ← SUPPRIMER
return () => {
  window.removeEventListener('keydown', onKeyDown, true)
  window.removeEventListener('keyup', onKeyUp, true)  // ← SUPPRIMER
}
```

### Changements exacts à apporter

**1. Dans le `useEffect` existant (lignes 33–37) :**
- Ligne 36 : `if (!isPaused) setIsOpen(true)` → `if (!isPaused) setIsOpen(prev => !prev)`
- La vérification `!isPaused` reste — si la carte est ouverte et que l'utilisateur est en pause, M ne la ferme pas non plus (cohérent : en pause, la carte est déjà forcée fermée par l'AC #3)

**2. Supprimer `onKeyUp` :**
- Supprimer lignes 39–41 (`const onKeyUp = ...`)
- Supprimer `window.addEventListener('keyup', onKeyUp, true)`
- Supprimer `window.removeEventListener('keyup', onKeyUp, true)` dans le cleanup

**3. Deux nouveaux `useEffect` à ajouter après le useEffect clavier :**

```js
// Auto-close map on pause
useEffect(() => {
  const unsub = useGame.subscribe(s => s.isPaused, (paused) => {
    if (paused) setIsOpen(false)
  })
  return unsub
}, [])

// Auto-close map when leaving gameplay phase
useEffect(() => {
  const unsub = useGame.subscribe(s => s.phase, (phase) => {
    if (phase !== 'gameplay') setIsOpen(false)
  })
  return unsub
}, [])
```

### Pattern `subscribe` disponible

`useGame` utilise le middleware `subscribeWithSelector` de Zustand (confirmé dans `src/ui/__tests__/MapOverlay.test.jsx` ligne 2 : `import { subscribeWithSelector } from 'zustand/middleware'`). La signature `useGame.subscribe(selector, callback)` est donc disponible et retourne directement la fonction `unsub`.

### Tests existants — aucun impact

`src/ui/__tests__/MapOverlay.test.jsx` contient uniquement 5 tests sur la fonction pure `worldToMapPct`. Cette fonction n'est pas modifiée. Aucun test à changer.

### Comportement final attendu

| Action | Avant (hold) | Après (toggle) |
|--------|-------------|----------------|
| Appui M (map fermée) | Ouvre | Ouvre |
| Relâche M | Ferme | Rien |
| Appui M (map ouverte) | Rien (déjà open) | Ferme |
| Pause pendant carte ouverte | Reste ouverte | Ferme automatiquement |
| Quitte 'gameplay' | Reste ouverte | Ferme automatiquement |
| M maintenu (repeat) | N/A | Ignoré (guard !e.repeat) |

### Project Structure Notes

- Le fichier unique à modifier est `src/ui/MapOverlay.jsx`
- Les `useEffect` auto-close s'alignent avec le pattern Zustand `subscribe` déjà utilisé dans d'autres composants du projet
- Le commentaire en ligne 31 ("Hold M to show map") sera mis à jour en "Toggle M to show/hide map"

### References

- [Source: epic-45-player-experience-polish.md#Story-45.2] — Story definition complète avec AC et Technical Notes
- [Source: src/ui/MapOverlay.jsx#L32-48] — useEffect key handler actuel à modifier
- [Source: src/ui/__tests__/MapOverlay.test.jsx] — Tests existants (non impactés)
- [Source: src/stores/useGame.jsx#L2] — `subscribeWithSelector` confirmé dans le store

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- AC #6 pre-existing failure (corrigé en code review 45.2) : `worldToMapPct` tests (4/5) échouaient sur HEAD avant cette story — désalignement PLAY_AREA_SIZE=1000 vs tests qui supposaient ±2000. Fix : tests mis à jour pour refléter le range réel ±1000 (WORLD_SIZE=2000). Tous les 5 tests passent désormais.

### Completion Notes List

- Toggle M implémenté : `setIsOpen(prev => !prev)` dans `onKeyDown`, guard `!e.repeat` conservé
- `onKeyUp` entièrement supprimé (function + addEventListener + removeEventListener)
- Deux `useEffect` avec `useGame.subscribe` ajoutés : auto-close sur pause, auto-close sur phase ≠ 'gameplay'
- Commentaire ligne 31 mis à jour : "Hold M" → "Toggle M to show/hide map"
- [Code Review] Tests `worldToMapPct` corrigés : valeurs de bord ±2000 → ±1000, ±1000→±500 pour 75/25% (PLAY_AREA_SIZE=1000)
- [Code Review] Commentaire d'en-tête `MapOverlay.jsx:2` mis à jour pour référencer Story 45.2

### File List

- src/ui/MapOverlay.jsx
- src/ui/__tests__/MapOverlay.test.jsx
- _bmad-output/implementation-artifacts/sprint-status.yaml
