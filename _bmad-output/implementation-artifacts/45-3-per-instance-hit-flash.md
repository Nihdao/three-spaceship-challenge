# Story 45.3: Per-Instance Hit Flash (seul l'ennemi touché flashe)

Status: done

## Story

As a player,
I want to see only the enemy I actually hit flash white,
So that hit feedback is precise and visually informative.

## Acceptance Criteria

1. **Given** `src/renderers/EnemyRenderer.jsx` — `EnemyTypeMesh` component
   **When** un ennemi de type X est touché
   **Then** seul cet ennemi individuel flashe — les autres ennemis du même type (`typeId`) ne sont **pas** affectés

2. **Given** le `useFrame` de `EnemyTypeMesh`
   **When** les matrices des instances sont calculées
   **Then** la variable `maxFlashTimer` et son calcul (`if (e.hitFlashTimer > maxFlashTimer)`) sont **supprimés**
   **And** à la place, pour chaque instance rendue à l'index `count` :
   ```js
   const flashIntensity = e.hitFlashTimer > 0
     ? calculateFlashIntensity(e.hitFlashTimer, GAME_CONFIG.HIT_FLASH.DURATION, GAME_CONFIG.HIT_FLASH.FADE_CURVE) * GAME_CONFIG.HIT_FLASH.INTENSITY
     : 0
   const brightness = 1.0 + flashIntensity
   _instanceFlashColor.setScalar(brightness)
   for (let j = 0; j < refs.length; j++) {
     if (refs[j]) refs[j].setColorAt(count, _instanceFlashColor)
   }
   ```
   **And** `_instanceFlashColor` est un `THREE.Color` pré-alloué au module-level (pas de `new THREE.Color()` dans le loop)

3. **Given** la fin du `useFrame` (après la boucle d'instances)
   **When** `count > 0`
   **Then** `mesh.instanceColor.needsUpdate = true` est appelé pour chaque mesh dans `refs` :
   ```js
   for (let j = 0; j < refs.length; j++) {
     if (refs[j] && refs[j].instanceColor) refs[j].instanceColor.needsUpdate = true
   }
   ```

4. **Given** le bloc de flash partagé en bas du `useFrame` (lignes actuelles ~142–154 de EnemyRenderer.jsx)
   **When** la story est implémentée
   **Then** les appels à `applyHitFlash(refs[j].material, ...)` et `restoreOriginalColor(refs[j].material)` sont **supprimés**
   **And** `wasFlashingRef` est supprimé (devenu inutile)
   **And** les imports `applyHitFlash` et `restoreOriginalColor` sont retirés de la ligne 9

5. **Given** des ennemis non rendus ce frame (typeEnemies vide)
   **When** `count === 0`
   **Then** aucun appel à `instanceColor.needsUpdate` — les meshes avec count=0 sont masqués, pas besoin de màj

6. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests passent — les tests de `hitFlashSystem.js` testent les fonctions pures et ne dépendent pas du renderer

## Tasks / Subtasks

- [x] Supprimer `wasFlashingRef` (AC: 4)
  - [x] Retirer `const wasFlashingRef = useRef(false)` à la ligne 49
- [x] Ajouter `_instanceFlashColor` au module-level (AC: 2)
  - [x] Ajouter `const _instanceFlashColor = new THREE.Color()` après les constantes module-level existantes (~ligne 17)
- [x] Modifier le `useFrame` — supprimer `maxFlashTimer` et injecter per-instance flash (AC: 2)
  - [x] Supprimer la ligne `let maxFlashTimer = 0` (~ligne 95)
  - [x] Supprimer la ligne `if (e.hitFlashTimer > maxFlashTimer) maxFlashTimer = e.hitFlashTimer` (~ligne 100)
  - [x] Après `dummy.updateMatrix()` et `refs[j].setMatrixAt(count, dummy.matrix)`, insérer le bloc per-instance flash (voir AC 2)
- [x] Après la boucle `count++`, mettre à jour `instanceColor.needsUpdate` (AC: 3)
  - [x] Dans le bloc d'après-boucle (après `mesh.count = count`), ajouter le loop `instanceColor.needsUpdate`
- [x] Supprimer le bloc de flash partagé (lignes ~141-154) (AC: 4)
  - [x] Supprimer les lignes `// Story 27.3: Apply hit flash emissive...` jusqu'à la fin du `if/else if`
- [x] Nettoyer les imports (AC: 4)
  - [x] Retirer `applyHitFlash` et `restoreOriginalColor` de l'import ligne 9 — conserver `calculateFlashIntensity`
- [x] Vérifier `vitest run` (AC: 6)

## Dev Notes

### Analyse du code existant — ce qui change

**Fichier concerné :** `src/renderers/EnemyRenderer.jsx`

**Problème actuel (lignes 95–154) :**
Le `useFrame` de `EnemyTypeMesh` calcule `maxFlashTimer = max(hitFlashTimer de tous les ennemis du type)` puis applique ce flash sur le **matériau partagé** (`refs[j].material`) via `applyHitFlash()`. Comme le material est partagé entre toutes les instances du même `typeId`, toutes les instances flashent simultanément quand n'importe laquelle est touchée.

**Fix :** Remplacer le flash sur matériau partagé par un flash per-instance via `instanceColor`. L'API Three.js `InstancedMesh.setColorAt(index, color)` écrit dans le buffer `instanceColor` (`Float32BufferAttribute`), qui est multiplié par la couleur de diffuse du material dans le vertex shader — ce qui donne un effet de brightening sur l'instance individuelle uniquement.

**Architecture du fix :**
```
Avant (shared material) :
  maxFlashTimer = max(all e.hitFlashTimer)
  → applyHitFlash(material, intensity)   ← TOUS les ennemis du type

Après (per-instance color) :
  pour chaque instance i :
    brightness = 1.0 + calculateFlash(e.hitFlashTimer)
    mesh.setColorAt(i, Color(brightness))   ← seule l'instance i
  → mesh.instanceColor.needsUpdate = true
```

### Constantes et config utilisées

| Constante | Source | Valeur typique |
|-----------|--------|----------------|
| `GAME_CONFIG.HIT_FLASH.DURATION` | `src/config/gameConfig.js` | 0.12 |
| `GAME_CONFIG.HIT_FLASH.FADE_CURVE` | `src/config/gameConfig.js` | `'easeOut'` |
| `GAME_CONFIG.HIT_FLASH.INTENSITY` | `src/config/gameConfig.js` | 1.0 |

`calculateFlashIntensity` retourne [0, 1] → multiplié par `INTENSITY` → `flashIntensity` ∈ [0, 1]. `brightness = 1.0 + flashIntensity` ∈ [1.0, 2.0]. `_instanceFlashColor.setScalar(brightness)` produit `Color(brightness, brightness, brightness)`.

### Risque principal : THREE.Color > 1.0 et tone mapping

`brightness = 2.0` au pic du flash. Three.js stocke les `instanceColor` dans un `Float32BufferAttribute` qui supporte les valeurs > 1.0. Dans le vertex shader, la couleur diffuse est multipliée par `vInstanceColor`. **Cependant**, si la scène utilise le tone mapping par défaut (`ACESFilmicToneMapping` ou similar) avec HDR désactivé, les valeurs > 1.0 peuvent être clampées avant rendu final, rendant l'effet invisible ou subtil.

**Fallback si le brightening n'est pas visible :** Utiliser une couleur de tint blanche fixe à la place du brightening, ex. : `_instanceFlashColor.setRGB(1 + flashIntensity * 0.5, 1 + flashIntensity * 0.5, 1)` ou `_instanceFlashColor.set(0xffffff)` avec opacity. L'essentiel est l'isolation per-instance — l'intensité visuelle peut être ajustée. Alternativement, si le projet a `toneMapping = THREE.NoToneMapping`, la valeur > 1.0 fonctionnera.

### Initialisation de instanceColor

`instanceColor` n'existe pas par défaut sur un `InstancedMesh` — Three.js le crée automatiquement lors du premier appel à `setColorAt()`. Après ce premier appel, toutes les instances qui n'ont pas encore été assignées ont une couleur par défaut `(1, 1, 1)` (blanc neutre = aucun effet sur la couleur diffuse). En appelant `setColorAt` pour **chaque** instance dans la boucle (les non-flashing reçoivent `Color(1, 1, 1)`), on garantit que le buffer est cohérent à chaque frame.

### Structure du useFrame après modification

```js
useFrame((state) => {
  const refs = meshRefs.current
  if (refs.length === 0) return

  const enemies = useEnemies.getState().enemies
  const playerPos = usePlayer.getState().position
  const dummy = dummyRef.current
  const now = state.clock.elapsedTime * 1000
  const frameId = Math.floor(now)
  const typeEnemies = _getBuckets(enemies, frameId).get(typeId) ?? _empty

  let count = 0
  for (let i = 0; i < typeEnemies.length; i++) {
    const e = typeEnemies[i]

    dummy.position.set(e.x, 0, e.z)

    const dx = playerPos[0] - e.x
    const dz = playerPos[2] - e.z
    dummy.rotation.set(0, Math.atan2(dx, dz), 0)

    const hitAge = now - e.lastHitTime
    let scaleMult = hitAge >= 0 && hitAge < GAME_CONFIG.SCALE_FLASH_DURATION_MS ? GAME_CONFIG.SCALE_FLASH_MULT : 1

    if (e.attackState === 'telegraph') {
      scaleMult *= 1.0 + 0.15 * Math.sin(e.telegraphTimer * Math.PI * 4)
    }

    dummy.scale.set(
      e.meshScale[0] * scaleMult,
      e.meshScale[1] * scaleMult,
      e.meshScale[2] * scaleMult,
    )
    dummy.updateMatrix()

    for (let j = 0; j < refs.length; j++) {
      if (refs[j]) refs[j].setMatrixAt(count, dummy.matrix)
    }

    // Per-instance hit flash via instanceColor (Story 45.3)
    const flashIntensity = e.hitFlashTimer > 0
      ? calculateFlashIntensity(e.hitFlashTimer, GAME_CONFIG.HIT_FLASH.DURATION, GAME_CONFIG.HIT_FLASH.FADE_CURVE) * GAME_CONFIG.HIT_FLASH.INTENSITY
      : 0
    const brightness = 1.0 + flashIntensity
    _instanceFlashColor.setScalar(brightness)
    for (let j = 0; j < refs.length; j++) {
      if (refs[j]) refs[j].setColorAt(count, _instanceFlashColor)
    }

    count++
  }

  for (let j = 0; j < refs.length; j++) {
    const mesh = refs[j]
    if (!mesh) continue
    mesh.count = count
    if (count > 0) mesh.instanceMatrix.needsUpdate = true
  }

  // Story 45.3: flag instanceColor dirty after writing all instances
  if (count > 0) {
    for (let j = 0; j < refs.length; j++) {
      if (refs[j] && refs[j].instanceColor) refs[j].instanceColor.needsUpdate = true
    }
  }
})
```

### Import line après modification (ligne 9)

```js
// Avant :
import { calculateFlashIntensity, applyHitFlash, restoreOriginalColor } from '../systems/hitFlashSystem.js'

// Après :
import { calculateFlashIntensity } from '../systems/hitFlashSystem.js'
```

### Module-level constant à ajouter

Placer après les constantes existantes (après ligne 17 `const _empty = []`) :
```js
const _instanceFlashColor = new THREE.Color() // Story 45.3: pre-allocated, avoid GC
```

### Tests — aucun changement requis

| Test file | Impacté | Raison |
|-----------|---------|--------|
| `src/systems/__tests__/hitFlashSystem.test.js` | Non | Teste les fonctions pures — `calculateFlashIntensity` est toujours importée/utilisée |
| `src/stores/__tests__/useEnemies.hitFlash.test.js` | Non | Teste le store Zustand — pas de lien avec le renderer |

Note : `applyHitFlash` et `restoreOriginalColor` restent dans `hitFlashSystem.js` (potentiellement utilisées ailleurs, ex: boss). Vérifier avec `grep -r "applyHitFlash\|restoreOriginalColor" src/` avant de les supprimer du module — **seulement les supprimer de l'import dans EnemyRenderer.jsx**.

### Project Structure Notes

- `src/renderers/EnemyRenderer.jsx` — unique fichier modifié
- Pattern instances : le projet utilise déjà `InstancedMesh` + `setMatrixAt` + `instanceMatrix.needsUpdate` — `instanceColor` suit exactement le même pattern
- Pas de store modifié, pas de gameConfig modifié, pas de system modifié
- Aligné avec la 6-layer architecture : changement purement dans la couche **Rendering**

### References

- Code actuel : `src/renderers/EnemyRenderer.jsx` lignes 49, 95–100, 140–154
- Hit flash system : `src/systems/hitFlashSystem.js` — `calculateFlashIntensity` toujours utilisée
- Epic source : `_bmad-output/planning-artifacts/epic-45-player-experience-polish.md` — Story 45.3, AC 1-6
- Three.js InstancedMesh.instanceColor API : `InstancedMesh.setColorAt(index: number, color: Color)` + `instanceColor.needsUpdate = true`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- Replaced shared-material hit flash (Story 27.3 pattern) with per-instance `instanceColor` brightening via `InstancedMesh.setColorAt()`
- Removed `wasFlashingRef`, `maxFlashTimer` and the shared `applyHitFlash`/`restoreOriginalColor` block
- Added module-level `_instanceFlashColor = new THREE.Color()` to avoid per-frame GC allocation
- Each instance receives `brightness = 1.0 + flashIntensity` via `setColorAt` every frame; non-flashing instances get `Color(1,1,1)` (neutral)
- `instanceColor.needsUpdate = true` called after the instance loop when `count > 0`
- `applyHitFlash` and `restoreOriginalColor` remain exported from `hitFlashSystem.js` (may be used by boss or other renderers)
- All 37 hitFlash tests (hitFlashSystem + useEnemies.hitFlash) pass; 30 pre-existing failures in other test suites are unrelated

### File List

- src/renderers/EnemyRenderer.jsx

## Senior Developer Review (AI)

**Date:** 2026-02-27
**Outcome:** Changes Requested → Fixed (auto)
**Issues Fixed:** 2 (Medium)

### Action Items

- [x] [Med] `HIT_FLASH.COLOR` dead config — `setScalar(brightness)` ignored the config value; replaced with `setRGB` driven by `_hitFlashBaseColor` [EnemyRenderer.jsx:132]
- [x] [Med] Stale misleading comment in `useMemo` — "Materials are cloned so emissive can be modified for hit flash (Story 27.3)" was false after 45.3; updated to accurate description [EnemyRenderer.jsx:55-58]

### Low Issues (accepted, no action)

- [Low] No unit test for per-instance isolation (AC 1) — acknowledged in story, visual-only verification
- [Low] Tone-mapping visibility risk — documented in Dev Notes, no runtime test possible without rendering environment
- [Low] Double `refs` loop after instance boucle — matches story spec exactly, merging would deviate from AC 3

## Change Log

- 2026-02-27: Implemented per-instance hit flash via `InstancedMesh.instanceColor` — replaced shared-material emissive approach. Removed `wasFlashingRef`, `maxFlashTimer`, `applyHitFlash`/`restoreOriginalColor` usage from renderer. Added pre-allocated `_instanceFlashColor` and `_hitFlashBaseColor` module constants.
- 2026-02-27: Code review fixes — `HIT_FLASH.COLOR` now drives flash tint via `_hitFlashBaseColor`; updated stale useMemo comment.
