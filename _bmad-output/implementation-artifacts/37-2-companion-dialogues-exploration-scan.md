# Story 37.2: Companion Dialogues — Exploration & Scan Guidance

Status: backlog

## Story

As a player,
I want ARIA to hint at scanning planets when I arrive in a system,
So that the exploration objective is clear from the start without reading a tutorial.

## Acceptance Criteria

1. **[Nouvelles lignes system-arrival-*]** Chaque événement `system-arrival-1`, `system-arrival-2`, `system-arrival-3` dans `companionDefs.js` reçoit au moins 2 nouvelles lignes mentionnant explicitement le scan des planètes et/ou le trou de ver.

2. **[Lignes existantes préservées]** Les lignes actuelles de `system-arrival-*` ne sont pas supprimées — les nouvelles lignes sont ajoutées à la pool existante.

3. **[system-arrival-1 impératif]** Pour le premier système (première impression), au moins une ligne est directive et sans ambiguïté : le joueur comprend immédiatement que scanner les planètes est son objectif.

4. **[Nouvel événement near-wormhole-threshold]** `companionDefs.js` définit un nouvel événement `'near-wormhole-threshold'` avec 3 lignes possibles, duration 4 secondes.

5. **[Trigger near-wormhole-threshold dans GameLoop]** Dans la section 7g de `GameLoop.jsx` (après `scanResult.completed`), le trigger `'near-wormhole-threshold'` est appelé quand `scannedCount === threshold - 1`, en one-shot via `markShown`.

6. **[near-wormhole-threshold est one-shot par système]** L'événement ne se déclenche qu'une fois par système. À chaque transition vers un nouveau système, il doit pouvoir se redéclencher (le one-shot doit être reset avec les autres shown flags).

7. **[Compatibilité wormhole-spawn]** Les lignes existantes de `'wormhole-spawn'` sont vérifiées et déclarées compatibles avec le nouveau déclencheur scan-based (pas de changement nécessaire — le wording est déjà neutre sur le déclencheur).

## Tasks / Subtasks

- [ ] Task 1: Lire `companionDefs.js` pour connaître les lignes existantes
  - [ ] Lire les pools de `system-arrival-1`, `system-arrival-2`, `system-arrival-3`
  - [ ] Vérifier le format exact (array of strings ou objects avec duration)
  - [ ] Lire `'wormhole-spawn'` pour vérifier la compatibilité

- [ ] Task 2: Ajouter les nouvelles lignes dans `system-arrival-*`
  - [ ] `system-arrival-1` : ajouter au moins :
    - `"Scan the planets in this sector. That's how we find the passage out."`
    - `"Multiple planet signatures detected. Start scanning — the wormhole won't appear on its own."`
  - [ ] `system-arrival-2` : ajouter au moins :
    - `"New system. Get those planets scanned — same rules as before."`
    - `"Detecting planets across the sector. We need to scan enough of them to wake the wormhole."`
  - [ ] `system-arrival-3` : ajouter au moins :
    - `"Last system. Don't let your guard down — scan the planets, find the wormhole, get out."`
    - `"Final sector. You know the drill: scan planets, trigger the wormhole, survive."`

- [ ] Task 3: Ajouter l'événement `'near-wormhole-threshold'` dans `companionDefs.js`
  - [ ] Format cohérent avec les autres événements
  - [ ] `duration: 4` (secondes)
  - [ ] Lines :
    - `"One more scan. The wormhole is almost ready."`
    - `"Almost there — one more planet and the passage opens."`
    - `"Last scan. Do it and we're through."`

- [ ] Task 4: Vérifier le mécanisme `markShown` / `hasShown` dans `useCompanion`
  - [ ] Confirmer que `markShown(eventId)` et `hasShown(eventId)` existent et fonctionnent
  - [ ] Confirmer que les shown flags sont reset lors des transitions de système

- [ ] Task 5: Ajouter le trigger `near-wormhole-threshold` dans `GameLoop.jsx`
  - [ ] Section 7g, dans le bloc `if (scanResult.completed)`
  - [ ] Après le calcul de `scannedCount` et `threshold` (déjà présents pour Story 34.4)
  - [ ] Ajouter :
    ```js
    if (scannedCount === threshold - 1 &&
        !useCompanion.getState().hasShown('near-wormhole-threshold')) {
      useCompanion.getState().trigger('near-wormhole-threshold')
      useCompanion.getState().markShown('near-wormhole-threshold')
    }
    ```
  - [ ] Ce bloc doit être AVANT le check du wormhole spawn (qui teste `scannedCount >= threshold`)

- [ ] Task 6: Tests
  - [ ] Test : au 11e scan (threshold = 12), near-wormhole-threshold se déclenche
  - [ ] Test : au 12e scan, near-wormhole-threshold ne se déclenche PAS (déjà `markShown`)
  - [ ] Test : re-déclenche bien si reset (nouveau système)
  - [ ] Test : les nouvelles lignes de system-arrival-1 apparaissent (aléatoire → tester plusieurs fois)

## Technical Notes

**Format des événements dans companionDefs.js :**
Vérifier le format exact avant d'écrire — les événements peuvent être :
```js
// Format A : array de strings avec duration sur l'event
{ id: 'near-wormhole-threshold', duration: 4, lines: [...] }
// Format B : lines sont des objets
{ id: 'near-wormhole-threshold', lines: [{ text: '...', duration: 4 }, ...] }
```
Adapter selon le format existant.

**Insertion dans GameLoop section 7g :**
```js
// Dans if (scanResult.completed) { ... }
// Ordre recommandé :
// 1. stopScanLoop()
// 2. playSFX('scan-complete')
// 3. useGame.getState().triggerPlanetReward(scanResult.tier)
// 4. ← NOUVEAU : near-wormhole-threshold check
// 5. ← EXISTANT (34.4) : wormhole spawn check (scannedCount >= threshold)
```

**Ordre important :** Le check `near-wormhole-threshold` (scannedCount === threshold - 1) doit précéder le check wormhole spawn (scannedCount >= threshold). Sinon, au passage de threshold - 1 à threshold dans le même tick (edge case théorique), le near-threshold ne se déclenche pas.

**Cohérence avec Story 30.3 :** Les événements contextuels existants (boss-spawn, wormhole-spawn, low-hp-warning) ont déjà un pattern one-shot via `markShown`. S'assurer que `near-wormhole-threshold` suit exactement le même pattern.

**Note sur le reset des shown flags :** Si `useCompanion.reset()` efface tous les `shownEvents` lors d'un `new game`, et si `advanceSystem()` dans GameLoop appelle un reset partiel du companion, vérifier que `near-wormhole-threshold` est bien inclus dans ce reset (pour se redéclencher au système suivant). Cela peut nécessiter soit un reset total des shown flags à chaque système, soit de ne pas inclure `near-wormhole-threshold` dans les one-shots permanents (contrairement à `wormhole-spawn` qui ne doit se déclencher qu'une fois).
