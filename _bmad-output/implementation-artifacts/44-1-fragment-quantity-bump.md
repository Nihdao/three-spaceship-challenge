# Story 44.1: Fragment Quantity Bump

Status: done

## Story

As a player,
I want fragment gems to be worth 10 fragments instead of 1,
So that I accumulate currency quickly and feel rewarded for every enemy kill.

## Acceptance Criteria

1. **Given** `src/config/gameConfig.js`
   **When** le fichier est ouvert
   **Then** `FRAGMENT_DROP_AMOUNT` est `10` (au lieu de `1`)
   **And** `MAX_FRAGMENT_GEMS` est `30` (au lieu de `20`) pour absorber le flux plus important
   **And** `BOSS_LOOT_FRAGMENTS` est `150` (au lieu de `50`) pour maintenir la valeur relative du boss
   **And** `BOSS_FRAGMENT_REWARD` est `300` (au lieu de `100`) — même principe

2. **Given** `src/systems/fragmentGemSystem.js`
   **When** `spawnGem(x, z, fragmentValue)` est appelé depuis `lootSystem.js`
   **Then** le `fragmentValue` passé est `GAME_CONFIG.FRAGMENT_DROP_AMOUNT` (i.e., `10`)
   **And** l'affichage HUD du compteur de fragments met à jour de +10 par gem collectée

3. **Given** l'architecture existante (pre-allocated pool, InstancedMesh)
   **When** le pool `MAX_FRAGMENT_GEMS` est augmenté à 30
   **Then** le pool fragment dans `GameLoop.jsx` (boucle `for` ligne ~64) est étendu à `GAME_CONFIG.MAX_FRAGMENT_GEMS`
   **And** l'InstancedMesh dans `FragmentGemRenderer.jsx` est créé avec `args={[geometry, material, MAX]}` — `MAX` lit `GAME_CONFIG.MAX_FRAGMENT_GEMS`
   **And** aucune allocation dynamique n'est introduite

4. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests existants passent — en particulier `usePlayer.fragments.test.js` qui doit être vérifié pour des valeurs hardcodées référençant `FRAGMENT_DROP_AMOUNT = 1`

## Tasks / Subtasks

- [x] Modifier les 4 constantes dans `gameConfig.js` (AC: #1)
  - [x] `FRAGMENT_DROP_AMOUNT: 1` → `10`
  - [x] `MAX_FRAGMENT_GEMS: 20` → `30`
  - [x] `BOSS_LOOT_FRAGMENTS: 50` → `150`
  - [x] `BOSS_FRAGMENT_REWARD: 100` → `300`
- [x] Vérifier que `lootSystem.js` passe bien `GAME_CONFIG.FRAGMENT_DROP_AMOUNT` à `spawnGem` (AC: #2)
- [x] Vérifier/confirmer que `GameLoop.jsx` et `FragmentGemRenderer.jsx` lisent depuis la config (AC: #3)
- [x] Lancer `vitest run` et corriger tout test cassé (AC: #4)

## Dev Notes

Cette story est un **changement de constantes uniquement** — 4 valeurs numériques dans `gameConfig.js`. L'analyse pré-implémentation confirme que toute l'infrastructure lit déjà dynamiquement depuis la config.

### Analyse des fichiers impactés

**`src/config/gameConfig.js`** — seul fichier vraiment modifié :
- Ligne 75 : `FRAGMENT_DROP_AMOUNT: 1` → changer à `10`
- Ligne 79 : `MAX_FRAGMENT_GEMS: 20` → changer à `30`
- Ligne 232 : `BOSS_LOOT_FRAGMENTS: 50` → changer à `150`
- Ligne 241 : `BOSS_FRAGMENT_REWARD: 100` → changer à `300`

**`src/renderers/FragmentGemRenderer.jsx`** — ✅ AUCUNE MODIFICATION NÉCESSAIRE :
- Ligne 7 : `const MAX = GAME_CONFIG.MAX_FRAGMENT_GEMS` — déjà lu depuis la config
- Ligne 70 : `args={[geometry, material, MAX]}` — déjà utilise MAX dynamique
- Le renderer s'adapte automatiquement quand `MAX_FRAGMENT_GEMS` change à 30

**`src/GameLoop.jsx`** — ✅ AUCUNE MODIFICATION NÉCESSAIRE :
- Lignes 63-65 : pré-allocation du pool fragment :
  ```js
  const _fragmentGemIds = []
  for (let i = 0; i < GAME_CONFIG.MAX_FRAGMENT_GEMS; i++) {
    _fragmentGemIds[i] = `fragmentGem_${i}`
  }
  ```
  Lit déjà depuis `GAME_CONFIG.MAX_FRAGMENT_GEMS` → sera automatiquement 30 entrées

### Analyse des tests

**`src/stores/__tests__/usePlayer.fragments.test.js`** — ✅ AUCUNE MODIFICATION NÉCESSAIRE :
- Les tests utilisent `addFragments(100)`, `addFragments(50)`, etc. — valeurs arbitraires explicites
- Aucune référence à `FRAGMENT_DROP_AMOUNT` ou à la valeur `1`
- Aucune mise à jour de test requise

**Vérification à faire avant de fermer** : s'assurer qu'aucun autre test file ne compare des compteurs de fragments à `1` (valeur attendue d'un seul drop). Commande utile : `grep -rn "FRAGMENT_DROP_AMOUNT\|toBe(1)" src/stores/__tests__/usePlayer.fragments`

### Vérifier `lootSystem.js` (AC #2)

Confirmer que l'appel à `spawnGem` passe bien `GAME_CONFIG.FRAGMENT_DROP_AMOUNT` comme `fragmentValue`. Ce point est dans l'AC mais ne nécessite probablement pas de modification — c'est une vérification de conformité. Si ce n'est pas le cas, corriger pour passer la constante plutôt qu'un literal `1`.

### Project Structure Notes

- Config : `src/config/gameConfig.js` — section loot/gem constants (~lignes 70-85 et 230-245)
- Renderer : `src/renderers/FragmentGemRenderer.jsx` — InstancedMesh avec pool size dynamique
- GameLoop : `src/GameLoop.jsx` lignes 62-65 — pré-allocation statique (module-level)
- Système : `src/systems/fragmentGemSystem.js` — spawnGem/collectGem, doit utiliser `GAME_CONFIG.FRAGMENT_DROP_AMOUNT`

### References

- [Source: epic-44-collectibles-overhaul.md#Story 44.1] — Acceptance Criteria complets
- [Source: src/config/gameConfig.js:75] — `FRAGMENT_DROP_AMOUNT: 1` actuel
- [Source: src/config/gameConfig.js:79] — `MAX_FRAGMENT_GEMS: 20` actuel
- [Source: src/config/gameConfig.js:232] — `BOSS_LOOT_FRAGMENTS: 50` actuel
- [Source: src/config/gameConfig.js:241] — `BOSS_FRAGMENT_REWARD: 100` actuel
- [Source: src/renderers/FragmentGemRenderer.jsx:7] — `const MAX = GAME_CONFIG.MAX_FRAGMENT_GEMS` (déjà dynamique)
- [Source: src/GameLoop.jsx:63-65] — pré-allocation `_fragmentGemIds` utilise `GAME_CONFIG.MAX_FRAGMENT_GEMS`
- [Source: src/stores/__tests__/usePlayer.fragments.test.js] — aucune valeur hardcodée à `1`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_none_

### Completion Notes List

- Modifié 4 constantes dans `src/config/gameConfig.js` : `FRAGMENT_DROP_AMOUNT` 1→10, `MAX_FRAGMENT_GEMS` 20→30, `BOSS_LOOT_FRAGMENTS` 50→150, `BOSS_FRAGMENT_REWARD` 100→300.
- Confirmé AC #2 : `lootSystem.js:127` utilise déjà `GAME_CONFIG.FRAGMENT_DROP_AMOUNT` — aucune modification nécessaire.
- Confirmé AC #3 : `FragmentGemRenderer.jsx:7` lit `GAME_CONFIG.MAX_FRAGMENT_GEMS`, `GameLoop.jsx:63` pareil — aucune modification nécessaire.
- 158 test files / 2694 tests — tous passent, 0 régression.
- **[Code Review Fix]** `BOSS_FRAGMENT_REWARD: 300` est un constant orphelin — jamais consommé dans le codebase (la récompense boss réelle est `BOSS_LOOT_FRAGMENTS` à `GameLoop.jsx:1254`). Commentaire ajouté dans `gameConfig.js:241` pour documenter cet état.
- **[Code Review Fix]** Tests de régression renforcés dans `fragmentGemSystem.test.js` : assertions exactes sur les nouvelles valeurs (10, 30, 150) au lieu de simples `toBeGreaterThan(0)`.
- **[Code Review Fix]** `FragmentGemRenderer.jsx` ajouté au File List (vérifié, aucune modification nécessaire).

### File List

- `src/config/gameConfig.js` (modified)
- `src/renderers/FragmentGemRenderer.jsx` (verified — reads `GAME_CONFIG.MAX_FRAGMENT_GEMS` dynamically, no modification needed)
- `src/systems/__tests__/fragmentGemSystem.test.js` (modified — regression tests strengthened by code review)
