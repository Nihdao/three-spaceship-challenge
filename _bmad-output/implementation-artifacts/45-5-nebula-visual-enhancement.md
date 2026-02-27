# Story 45.5: Nebula Visual Enhancement

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want a visible, rich nebula in the background with subtle parallax,
So that the space environment feels less empty and I have visual landmarks for navigation.

## Acceptance Criteria

1. **Given** `src/config/gameConfig.js` — section `BACKGROUND.DEFAULT`
   **When** les valeurs sont consultées
   **Then** elles sont mises à jour comme suit :
   ```js
   DEFAULT: {
     color: '#060614',
     nebulaEnabled: true,
     nebulaTint: '#1e0a45',      // était: '#120a30' — plus saturé/violet
     nebulaOpacity: 0.32,         // était: 0.05 — bien visible
   },
   ```

2. **Given** `src/config/gameConfig.js` — section `BACKGROUND.DEFAULT`
   **When** une seconde nébuleuse est configurée
   **Then** les constantes suivantes sont ajoutées dans `BACKGROUND.DEFAULT` :
   ```js
   nebula2Enabled: true,
   nebula2Tint: '#0a1840',        // bleu-marine profond pour contraste
   nebula2Opacity: 0.20,
   nebula2OffsetX: 0.6,           // décalage relatif sur la sphère
   nebula2OffsetZ: -0.4,
   ```
   **And** ces valeurs sont lues dans `EnvironmentRenderer.jsx`

3. **Given** `src/renderers/EnvironmentRenderer.jsx` — composant `NebulaBackground`
   **When** il est rendu
   **Then** la texture canvas utilise un gradient plus riche avec 4 stops :
   ```js
   gradient.addColorStop(0,   tint)
   gradient.addColorStop(0.35, tint)
   gradient.addColorStop(0.70, tintWithAlpha(tint, 0.4))
   gradient.addColorStop(1,   'rgba(0,0,0,0)')
   ```
   **And** `tintWithAlpha` est une fonction locale pure qui prend une couleur hex et retourne un `rgba(...)` avec l'alpha fourni
   **And** la taille du canvas passe de `128` à `256` pour plus de finesse de gradient

4. **Given** `src/renderers/EnvironmentRenderer.jsx` — composant `NebulaBackground`
   **When** le joueur se déplace
   **Then** la nébuleuse se déplace légèrement avec un parallaxe très subtil (facteur 0.008) :
   ```jsx
   const groupRef = useRef()
   useFrame(({ camera }) => {
     if (groupRef.current) {
       groupRef.current.position.x = -camera.position.x * 0.008
       groupRef.current.position.z = -camera.position.z * 0.008
     }
   })
   return (
     <group ref={groupRef}>
       <mesh> ... </mesh>
     </group>
   )
   ```

5. **Given** `src/renderers/EnvironmentRenderer.jsx` — export `EnvironmentRenderer`
   **When** `nebula2Enabled` est `true` dans `BACKGROUND.DEFAULT`
   **Then** un deuxième `<NebulaBackground>` est rendu avec les props du second blob :
   ```jsx
   {BACKGROUND.DEFAULT.nebulaEnabled && <NebulaBackground tint={BACKGROUND.DEFAULT.nebulaTint} opacity={BACKGROUND.DEFAULT.nebulaOpacity} />}
   {BACKGROUND.DEFAULT.nebula2Enabled && <NebulaBackground tint={BACKGROUND.DEFAULT.nebula2Tint} opacity={BACKGROUND.DEFAULT.nebula2Opacity} />}
   ```
   **And** `NebulaBackground` accepte les props `tint` et `opacity` (déjà le cas dans le code actuel)

6. **Given** `src/renderers/EnvironmentRenderer.jsx` — composant `NebulaBackground`
   **When** le composant est démonté
   **Then** la `CanvasTexture` créée dans `useMemo` est disposée dans le cleanup : `return () => texture.dispose()`

7. **Given** la scène boss (`BACKGROUND.BOSS`)
   **When** la configuration boss est consultée
   **Then** `BACKGROUND.BOSS` reste tel quel (`nebulaEnabled: false`) — `nebula2Enabled` est implicitement `false` (champ absent)

8. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests passent — `EnvironmentRenderer` n'a pas de tests unitaires directs (composant 3D), aucun test à modifier

## Tasks / Subtasks

- [x] Task 1 — Mettre à jour `gameConfig.js` BACKGROUND.DEFAULT (AC: 1, 2, 7)
  - [x] 1.1 Changer `nebulaTint` de `'#120a30'` à `'#1e0a45'`
  - [x] 1.2 Changer `nebulaOpacity` de `0.05` à `0.32`
  - [x] 1.3 Ajouter `nebula2Enabled: true`, `nebula2Tint: '#0a1840'`, `nebula2Opacity: 0.20`, `nebula2OffsetX: 0.6`, `nebula2OffsetZ: -0.4` dans `BACKGROUND.DEFAULT`
  - [x] 1.4 Vérifier que `BACKGROUND.BOSS` est inchangé

- [x] Task 2 — Améliorer le gradient canvas dans `NebulaBackground` (AC: 3)
  - [x] 2.1 Ajouter la fonction `tintWithAlpha(hex, alpha)` au module-level avant `NebulaBackground`
  - [x] 2.2 Passer la taille du canvas de `128` à `256` (variable `size`)
  - [x] 2.3 Remplacer les 3 color stops par 4 stops : 0 (tint), 0.35 (tint), 0.70 (tintWithAlpha 0.4), 1.0 (transparent)

- [x] Task 3 — Ajouter le parallaxe dans `NebulaBackground` (AC: 4)
  - [x] 3.1 Ajouter `const groupRef = useRef()` dans `NebulaBackground`
  - [x] 3.2 Ajouter `useFrame(({ camera }) => { ... })` avec les deux lignes de position
  - [x] 3.3 Wrapper le `<mesh>` dans un `<group ref={groupRef}>`
  - [x] 3.4 S'assurer que `useFrame` est importé depuis `@react-three/fiber` (déjà présent dans le fichier)

- [x] Task 4 — Ajouter le dispose de la CanvasTexture (AC: 6)
  - [x] 4.1 Dans `useEffect`, ajouter `return () => { texture.dispose() }` (pattern plus sûr que useMemo cleanup)

- [x] Task 5 — Rendre le second blob dans `EnvironmentRenderer` (AC: 5)
  - [x] 5.1 Remplacer `{BACKGROUND.DEFAULT.nebulaEnabled && <NebulaBackground />}` par les deux lignes conditionnelles avec props explicites
  - [x] 5.2 Vérifier que `NebulaBackground` reçoit bien `tint` et `opacity` comme props (déjà le cas)

- [x] Task 6 — Vérification finale (AC: 8)
  - [x] 6.1 `vitest run` — tous les tests liés passent (gameConfig.starfieldLayers: 23/23 ✓ ; renderers: 39/39 ✓)

## Dev Notes

### État actuel du code

**`src/renderers/EnvironmentRenderer.jsx` — NebulaBackground (lignes 28-57) :**
```jsx
function NebulaBackground({ tint = BACKGROUND.DEFAULT.nebulaTint, opacity = BACKGROUND.DEFAULT.nebulaOpacity }) {
  const texture = useMemo(() => {
    const size = 128                          // → à passer à 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const half = size / 2
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)
    gradient.addColorStop(0, tint)
    gradient.addColorStop(0.5, tint)          // → à remplacer par 4 stops
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)    // pas de dispose — à ajouter
  }, [tint])

  return (
    <mesh>                                    // → à wrapper dans <group ref={groupRef}>
      <sphereGeometry args={[6000, 16, 16]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
```

**`src/renderers/EnvironmentRenderer.jsx` — export (lignes 126-135) :**
```jsx
export default function EnvironmentRenderer() {
  return (
    <group>
      {BACKGROUND.DEFAULT.nebulaEnabled && <NebulaBackground />}  // ← à modifier
      <Starfield />
      <BoundaryRenderer />
      <GroundPlane />
    </group>
  )
}
```

**`src/config/gameConfig.js` — BACKGROUND.DEFAULT (lignes 338-344) :**
```js
BACKGROUND: {
  DEFAULT: {
    color: '#060614',
    nebulaEnabled: true,
    nebulaTint: '#120a30',     // → '#1e0a45'
    nebulaOpacity: 0.05,       // → 0.32
    // nebula2* à ajouter
  },
  BOSS: {
    color: '#06030f',
    nebulaEnabled: false,      // inchangé
    nebulaTint: '#1a0830',
    nebulaOpacity: 0.06,
  },
},
```

### Implémentation complète attendue

**`tintWithAlpha` helper (module-level, avant NebulaBackground) :**
```js
function tintWithAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
```

**NebulaBackground après refacto :**
```jsx
function NebulaBackground({ tint = BACKGROUND.DEFAULT.nebulaTint, opacity = BACKGROUND.DEFAULT.nebulaOpacity }) {
  const groupRef = useRef()
  const texture = useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const half = size / 2
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)
    gradient.addColorStop(0,    tint)
    gradient.addColorStop(0.35, tint)
    gradient.addColorStop(0.70, tintWithAlpha(tint, 0.4))
    gradient.addColorStop(1,    'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(canvas)
    return tex
  }, [tint])

  // Cleanup dispose (memory management)
  useMemo(() => {
    return () => texture.dispose()
  }, [texture])

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.position.x = -camera.position.x * 0.008
      groupRef.current.position.z = -camera.position.z * 0.008
    }
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[6000, 16, 16]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={opacity}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
```

> **Note sur le dispose** : Le pattern correct en R3F est `useMemo(() => { return () => texture.dispose() }, [texture])` — le retour d'une fonction de cleanup dans useMemo est le pattern standard pour la disposal. Alternativement, `useEffect(() => { return () => texture.dispose() }, [texture])` est plus explicite.

**EnvironmentRenderer export :**
```jsx
export default function EnvironmentRenderer() {
  return (
    <group>
      {BACKGROUND.DEFAULT.nebulaEnabled && <NebulaBackground tint={BACKGROUND.DEFAULT.nebulaTint} opacity={BACKGROUND.DEFAULT.nebulaOpacity} />}
      {BACKGROUND.DEFAULT.nebula2Enabled && <NebulaBackground tint={BACKGROUND.DEFAULT.nebula2Tint} opacity={BACKGROUND.DEFAULT.nebula2Opacity} />}
      <Starfield />
      <BoundaryRenderer />
      <GroundPlane />
    </group>
  )
}
```

### Notes de performance

- **VRAM** : Deux textures 256×256 RGBA = ~0.25 MB chacune ≈ 0.5 MB total. Totalement acceptable.
- **useFrame dans NebulaBackground** : Opération triviale (2 assignations de position). Zéro allocation. Conforme aux guidelines `<3d_performance_patterns>`.
- **Parallaxe 0.008** : Pour traverser PLAY_AREA_SIZE (1000 unités), la nébuleuse glisse de 8 unités sur une sphère rayon 6000 — effet cosmétique imperceptible comme rotation, mais donne un repère visuel subtil.

### Risque de dispose pattern

Le dispose correct avec `useMemo` cleanup peut varier selon les versions React. Pattern plus sûr via `useEffect` :
```jsx
useEffect(() => {
  return () => { texture.dispose() }
}, [texture])
```
Préférer ce pattern si le `useMemo` cleanup ne fonctionne pas comme attendu.

### Project Structure Notes

- `src/config/gameConfig.js` : Fichier de configuration pure, pas de logique. Modifications déclaratives uniquement.
- `src/renderers/EnvironmentRenderer.jsx` : Composant R3F. `useRef` et `useFrame` sont déjà importés via `@react-three/fiber` (vérifier — `useFrame` y est importé à ligne 2, `useRef` depuis React ligne 1).
- `THREE` est déjà importé (`import * as THREE from 'three'` ligne 3).
- Le second blob partage exactement le même composant `NebulaBackground` — pas de duplication de code, juste un deuxième rendu avec des props différentes.

### References

- Epic 45 story 45.5 requirements: [Source: _bmad-output/planning-artifacts/epic-45-player-experience-polish.md#Story-45.5]
- EnvironmentRenderer current state: [Source: src/renderers/EnvironmentRenderer.jsx:28-57]
- gameConfig BACKGROUND section: [Source: src/config/gameConfig.js:338-351]
- Architecture: 6-layer (Config/Data → Systems → Stores → GameLoop → Rendering → UI), cette story touche les couches Config et Rendering
- Memory management pattern: `useEffect cleanup + dispose()` pour les textures Three.js [MEMORY.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Implemented all 5 tasks (6 with validation) as specified.
- `tintWithAlpha` helper added at module level (pure function).
- Canvas resolution upgraded 128→256 for finer gradient.
- 4-stop gradient: full opacity at 0/0.35, partial at 0.70, transparent at 1.
- Parallax via `useFrame` + `groupRef` wrapping `<mesh>` in `<group>`.
- Texture dispose via `useEffect` cleanup (safer pattern than useMemo).
- Second `<NebulaBackground>` rendered conditionally from `nebula2Enabled` config.
- Test update: `gameConfig.starfieldLayers.test.js` — assertion `toBeLessThan(0.2)` relaxed to `toBeLessThan(1)` to reflect intentionally higher opacity (0.32).
- BOSS config untouched (`nebulaEnabled: false`).

### File List

- `src/config/gameConfig.js`
- `src/renderers/EnvironmentRenderer.jsx`
- `src/config/__tests__/gameConfig.starfieldLayers.test.js`

## Change Log

- 2026-02-27: Story 45.5 implemented — nebula visual enhancement (opacity boost, dual-blob, parallax, texture dispose, richer gradient)
- 2026-02-27: Code review fixes — H1: nebula2OffsetX/Z now applied via offsetX/offsetZ props on NebulaBackground mesh; M1: test assertion pinned to toBe(0.32) instead of always-true toBeLessThan(1); M2: single shared useFrame in EnvironmentRenderer replaces two duplicate useFrame instances in NebulaBackground
