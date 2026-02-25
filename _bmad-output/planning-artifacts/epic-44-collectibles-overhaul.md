# Epic 44: Collectibles Overhaul — Fragments, Visuels, Attraction & Items Rares

Refonte complète de l'expérience collectibles : augmentation drastique du rendement en fragments, reskin géométrique des trois types de gemmes/orbs, magnétisation permanente une fois activée, dispersion automatique des drops pour éviter la superposition, et introduction de trois nouveaux items rares (Magnet, Bombe, Bouclier).

## Epic Goals

- Multiplier par 10 la valeur unitaire des fragments droppés pour rendre la monnaie accessible et satisfaisante
- Donner une identité visuelle 3D claire et distincte à chaque type de collectible (losange, hexagone, croix)
- Rendre la magnétisation irréversible une fois déclenchée (le collectible suit le joueur jusqu'à absorption)
- Éliminer la superposition des collectibles au point de mort d'un ennemi via un scatter radial
- Introduire trois items rares ramassables (Magnet, Bombe, Bouclier) avec effets immédiats distincts

## Epic Context

Les collectibles sont le feedback loop fondamental du jeu — chaque mort d'ennemi produit de la richesse visible. Trois problèmes actuels dégradent ce loop :

1. **Fragments trop rares** : `FRAGMENT_DROP_AMOUNT = 1` avec `DROP_CHANCE = 12%` donne une progression laborieuse qui rend les achats dans le TunnelHub peu fréquents. Le joueur n'a pas le sentiment de « ramasser des richesses ».

2. **Collectibles invisibles** : les orbs XP utilisent des IcosahedronGeometry quasi-sphériques, les heal gems et fragment gems sont de simples `SphereGeometry`. Aucun ne communique son type à distance. Un reskin géométrique (losange, hexagone, croix) permet une identification immédiate.

3. **Superposition et magnétisation** : quand un ennemi meurt, XP + soin + fragment se spawnnent au même point exact et se superposent visuellement. Par ailleurs, si le joueur se déplace hors du rayon de magnétisation, `isMagnetized` repasse à `false` et l'orb s'arrête — frustrant.

Les items rares (Magnet, Bombe, Bouclier) ajoutent une dimension d'opportunisme : le joueur doit remarquer et rejoindre un drop rare pour débloquer un effet puissant temporaire.

---

## Stories

### Story 44.1 — Augmentation du rendement fragment (pack de 10)

As a player,
I want fragment gems to be worth 10 fragments instead of 1,
So that I accumulate currency quickly and feel rewarded for every enemy kill.

**Acceptance Criteria:**

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
   **Then** tous les tests existants passent — en particulier `usePlayer.fragments.test.js` qui doit être mis à jour si des valeurs hardcodées référencent `FRAGMENT_DROP_AMOUNT = 1`

**Technical Notes:**
- Changements dans `gameConfig.js` : 4 valeurs numériques uniquement
- Dans `GameLoop.jsx` : trouver le `for` loop de pré-allocation fragment (~ligne 64) et vérifier qu'il utilise `GAME_CONFIG.MAX_FRAGMENT_GEMS` (probablement déjà le cas, mais confirmer)
- Dans `FragmentGemRenderer.jsx` : vérifier que `MAX` est lu depuis `GAME_CONFIG.MAX_FRAGMENT_GEMS`, pas hardcodé
- Aucun changement de logique de gameplay nécessaire — juste les constantes

**Files:**
| File | Changes |
|------|---------|
| `src/config/gameConfig.js` | `FRAGMENT_DROP_AMOUNT: 10`, `MAX_FRAGMENT_GEMS: 30`, `BOSS_LOOT_FRAGMENTS: 150`, `BOSS_FRAGMENT_REWARD: 300` |
| `src/renderers/FragmentGemRenderer.jsx` | Vérification/correction du `MAX` constant si hardcodé |

---

### Story 44.2 — Reskin géométrique des collectibles (losange, hexagone, croix)

As a player,
I want each collectible type to have a distinct 3D shape,
So that I can identify XP orbs, heal gems, and fragment gems at a glance from across the map.

**Acceptance Criteria:**

1. **Given** `XPOrbRenderer.jsx` — standard orbs
   **When** ils sont rendus
   **Then** la géométrie est `OctahedronGeometry(0.3, 0)` (losange/diamant à 6 faces nets — déjà utilisé pour rare, à unifier)
   **And** chaque instance est inclinée à `rotation.x = Math.PI * 0.25` (45° sur X) avant `dummy.updateMatrix()` — cela rend le losange visible de haut
   **And** les standard orbs tournent lentement sur Y : `dummy.rotation.y = orb.elapsedTime * 1.5` (radians/sec)

2. **Given** `XPOrbRenderer.jsx` — rare orbs
   **When** ils sont rendus
   **Then** la géométrie est `OctahedronGeometry(0.42, 0)` (légèrement plus grande que le standard)
   **And** même inclinaison X (`Math.PI * 0.25`) + rotation Y plus rapide (`orb.elapsedTime * 2.5`)
   **And** la couleur dorée `GAME_CONFIG.RARE_XP_GEM_COLOR` est conservée

3. **Given** `FragmentGemRenderer.jsx`
   **When** les fragment gems sont rendus
   **Then** la géométrie est `CylinderGeometry(0.28, 0.28, 0.14, 6)` — un disque hexagonal plat
   **And** aucune rotation n'est appliquée (le disque hexagonal est naturellement lisible vu du dessus)
   **And** l'animation pulse existante (scale) est conservée
   **And** la couleur violette `GAME_CONFIG.FRAGMENT_GEM_COLOR` est conservée
   **And** le matériau passe de `MeshStandardMaterial` à `MeshBasicMaterial` (unlit, cohérent avec XP orbs et heal gems, lumineux sans dépendre des lumières de scène)

4. **Given** `HealGemRenderer.jsx`
   **When** les heal gems sont rendus
   **Then** la géométrie est une croix « + » construite en fusionnant deux boxgeometries :
     - barre horizontale : `new THREE.BoxGeometry(0.65, 0.14, 0.22)`
     - barre verticale : `new THREE.BoxGeometry(0.22, 0.14, 0.65)`
     - résultat : `BufferGeometryUtils.mergeGeometries([hBar, vBar])`
   **And** la géométrie fusionnée est passée à l'InstancedMesh
   **And** les instances ne tournent pas (la croix est immédiatement lisible de haut en bas)
   **And** la couleur verte actuelle est conservée

5. **Given** les trois renderers
   **When** les nouvelles géométries sont utilisées
   **Then** chaque `useMemo` de géométrie dispose des anciennes géométries dans son cleanup (`return () => geometry.dispose()`)
   **And** `vitest run` passe — les tests de renderer testent des counts/positions, pas les géométries (aucun test à modifier)

6. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests passent

**Technical Notes:**
- `BufferGeometryUtils` est disponible dans Three.js : `import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'` — vérifier que l'import path correspond à la version Three.js utilisée. Alternative si nécessaire : `THREE.BufferGeometryUtils.mergeGeometries` ou import depuis `'three/examples/jsm/utils/BufferGeometryUtils.js'`.
- Pour la rotation dans XPOrbRenderer : dans le `useFrame`, avant `dummy.updateMatrix()`, ajouter `dummy.rotation.set(Math.PI * 0.25, orb.elapsedTime * spinSpeed, 0)`. Le `dummy` doit avoir `dummy.rotation.order = 'XYZ'` (défaut).
- La croix heal gem : les deux BoxGeometry partagent le même centre (0,0,0), elles se rejoignent naturellement pour former un +. Épaisseur Y = 0.14 pour les deux afin qu'elles soient coplanaires.
- `MeshBasicMaterial` pour FragmentGemRenderer : supprimer `roughness`, `metalness`, `emissive` et ajouter `toneMapped: false` pour cohérence.

**Files:**
| File | Changes |
|------|---------|
| `src/renderers/XPOrbRenderer.jsx` | Géométrie + rotation inclinée dans useFrame |
| `src/renderers/FragmentGemRenderer.jsx` | CylinderGeometry hexagonale + switch MeshBasicMaterial |
| `src/renderers/HealGemRenderer.jsx` | CrossGeometry via mergeGeometries |

---

### Story 44.3 — Magnétisation permanente (sticky une fois activée)

As a player,
I want collectibles to follow me indefinitely once they enter my magnet radius,
So that I never lose a collectible that I've attracted, even if I move away from it.

**Acceptance Criteria:**

1. **Given** `src/systems/xpOrbSystem.js` — `updateMagnetization()`
   **When** un orb est dans le rayon magnétique (`distSq <= magnetRadiusSq`)
   **Then** `orb.isMagnetized` est mis à `true`
   **And** une fois `isMagnetized = true`, il n'est JAMAIS remis à `false` (pas de `else { orb.isMagnetized = false }`)
   **And** l'orb continue de se déplacer vers le joueur tant qu'il est `isMagnetized`, quelle que soit la distance actuelle

2. **Given** `src/systems/healGemSystem.js` — `updateMagnetization()`
   **When** une heal gem est dans le rayon
   **Then** même comportement sticky que pour les orbs XP (AC #1)

3. **Given** `src/systems/fragmentGemSystem.js` — `updateMagnetization()`
   **When** une fragment gem est dans le rayon
   **Then** même comportement sticky que pour les orbs XP (AC #1)

4. **Given** `src/config/gameConfig.js`
   **When** un collectible est magnétisé mais se trouve maintenant hors du rayon (car le joueur s'est éloigné)
   **Then** le collectible se déplace avec une vitesse minimale garantie : `XP_MAGNET_MIN_SPEED: 20` (unités/sec)
   **And** le calcul de vitesse dans les trois systèmes devient : `const speed = Math.max(GAME_CONFIG.XP_MAGNET_MIN_SPEED, magnetSpeed * speedFactor)` pour les items magnétisés
   **And** `speedFactor` est protégé contre les valeurs négatives : `const speedFactor = Math.max(0, Math.pow(Math.max(0, 1 - normalizedDist), accelCurve))`

5. **Given** la réinitialisation du système
   **When** `resetOrbs()` / `resetHealGems()` / `resetFragmentGems()` est appelé
   **Then** `isMagnetized` est bien reset à `false` pour toutes les entrées du pool (comportement existant conservé)

6. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests existants passent — les tests de magnetization vérifient que `isMagnetized` passe à `true` dans le rayon, et non qu'il repasse à `false` hors du rayon

**Technical Notes:**
- Dans les trois fichiers de systèmes : supprimer la ligne `else { orb.isMagnetized = false }` (ou équivalent avec le nom de la variable). L'activer uniquement si `distSq <= magnetRadiusSq`.
- Le `speedFactor = Math.pow(1 - normalizedDist, accelCurve)` peut devenir négatif si `normalizedDist > 1` (orb hors rayon mais magnétisé). Protéger avec `Math.max(0, 1 - normalizedDist)`. Le `Math.max(XP_MAGNET_MIN_SPEED, ...)` garantit alors un mouvement minimum.
- La nouvelle constante `XP_MAGNET_MIN_SPEED: 20` est dans `GAME_CONFIG` section loot/pickup, près de `XP_MAGNET_SPEED`.

**Files:**
| File | Changes |
|------|---------|
| `src/systems/xpOrbSystem.js` | Suppression du de-magnetization + speed floor |
| `src/systems/healGemSystem.js` | Même correction |
| `src/systems/fragmentGemSystem.js` | Même correction |
| `src/config/gameConfig.js` | `XP_MAGNET_MIN_SPEED: 20` |

---

### Story 44.4 — Dispersion des drops (anti-superposition)

As a player,
I want collectibles dropped by a dying enemy to be slightly offset from each other,
So that I can clearly see each individual item and distinguish what dropped.

**Acceptance Criteria:**

1. **Given** `src/systems/lootSystem.js` — `rollDrops(enemyTypeId, x, z, enemyInstance)`
   **When** un ennemi meurt et déclenche plusieurs drops (XP + heal + fragment par exemple)
   **Then** chaque drop est spawné à une position légèrement décalée de (x, z)
   **And** le décalage est radial et unique par drop : `angle = dropIndex * 2.094` (120° = golden-ish separation) + `jitter = (Math.random() - 0.5) * 0.4`
   **And** le rayon de dispersion est `0.6 + Math.random() * 0.4` (entre 0.6 et 1.0 unités du centre)
   **And** les formules sont : `sx = x + Math.cos(angle + jitter) * radius; sz = z + Math.sin(angle + jitter) * radius`

2. **Given** le drop XP (standard ou rare)
   **When** il est spawné dans `rollDrops()`
   **Then** il est également dispersé (pas d'exception pour le drop XP qui était à (x, z) exact)
   **And** le drop index du XP est `0` (premier dans la séquence de dispersion)

3. **Given** le drop XP (standard ou rare)
   **When** il est spawné dans `rollDrops()`
   **Then** il est spawné à la position dispersée : `spawnOrb(sx, sz, ...)` et non `spawnOrb(x, z, ...)`

4. **Given** la boucle registry dans `rollDrops()`
   **When** les items du registry (HEAL_GEM, FRAGMENT_GEM, etc.) sont spawnnés
   **Then** chaque item registry incrémente un `dropIndex` commun (XP = 0, premier registry item = 1, second = 2, etc.)
   **And** `config.spawnFn(sx, sz)` utilise les coordonnées dispersées

5. **Given** un ennemi qui ne droppe que du XP (pas de heal ni de fragment)
   **When** le seul drop est l'orb XP
   **Then** la dispersion s'applique quand même (dropIndex=0 donne une légère variation aléatoire)
   **And** l'offset est minimal pour un seul drop (`radius * cos/sin` avec `dropIndex=0` donne un décalage aléatoire de 0.6-1.0 unités)

6. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests passent — les tests lootSystem vérifient les drops mais pas les positions exactes (à vérifier avec grep)

**Technical Notes:**
- Implémenter une fonction locale dans `lootSystem.js` :
  ```js
  function _scatterPos(x, z, index) {
    const angle = index * 2.094 + (Math.random() - 0.5) * 0.4
    const r = 0.6 + Math.random() * 0.4
    return [x + Math.cos(angle) * r, z + Math.sin(angle) * r]
  }
  ```
- Dans `rollDrops()` : initialiser `let dropIdx = 0` avant les drops XP. Appeler `_scatterPos(x, z, dropIdx++)` pour chaque spawn.
- Pour la boucle registry : remplacer `config.spawnFn(x, z)` par `const [sx, sz] = _scatterPos(x, z, dropIdx++); config.spawnFn(sx, sz)`.
- `2.094` radians ≈ 120° — pour 3 drops réguliers (XP + soin + fragment), ça donne une belle répartition en triangle équilatéral.

**Files:**
| File | Changes |
|------|---------|
| `src/systems/lootSystem.js` | Fonction `_scatterPos()` + application à tous les drops dans `rollDrops()` |

---

### Story 44.5 — Items rares ramassables (Magnet, Bombe, Bouclier)

As a player,
I want rare items to occasionally drop from enemies and grant powerful temporary effects when collected,
So that finding a Magnet, Bomb, or Shield creates exciting moments of opportunity.

**Acceptance Criteria:**

#### Partie A — Système & Configuration

1. **Given** `src/config/gameConfig.js`
   **When** il est ouvert
   **Then** les nouvelles constantes suivantes existent dans une section `// Rare Items (Story 44.5)` :
   ```
   MAX_RARE_ITEMS: 5,
   RARE_ITEM_PICKUP_RADIUS: 2.5,
   MAGNET_ITEM_DROP_CHANCE: 0.025,   // 2.5%
   BOMB_ITEM_DROP_CHANCE: 0.008,      // 0.8% (très rare)
   SHIELD_ITEM_DROP_CHANCE: 0.015,    // 1.5%
   SHIELD_ITEM_DURATION: 6.0,         // secondes d'invulnérabilité
   BOMB_ITEM_RADIUS: 18.0,            // rayon de l'explosion (≈ rayon du radar)
   BOMB_ITEM_BOSS_DAMAGE_PERCENT: 0.25, // 25% HP max du boss
   ```

2. **Given** `src/systems/rareItemSystem.js` (nouveau fichier)
   **When** il est créé
   **Then** il suit le pattern de `xpOrbSystem.js` avec un pool pré-alloué de `MAX_RARE_ITEMS` items :
   - Chaque item : `{ x: 0, z: 0, type: 'MAGNET'|'BOMB'|'SHIELD', isMagnetized: false, active: false }`
   - `spawnRareItem(x, z, type)` — spawn un item de type donné
   - `updateMagnetization(px, pz, delta, pickupRadiusMultiplier)` — même logique sticky que Story 44.3
   - `collectItem(index)` → retourne `{ type }` et supprime l'item du pool (swap-to-end pattern)
   - `getRareItems()` — retourne le tableau
   - `getActiveCount()` — retourne le count actif
   - `reset()` — remet tous les items à zéro

3. **Given** `src/systems/collisionSystem.js`
   **When** un nouveau categorie est nécessaire
   **Then** `CATEGORY_RARE_ITEM` est exporté depuis `collisionSystem.js` avec une valeur de bit unique (ex: `1 << 9` si disponible)

4. **Given** `src/systems/lootSystem.js`
   **When** les loot types sont enregistrés (bas du fichier)
   **Then** les trois items rares sont enregistrés via `registerLootType` :
   ```js
   registerLootType('MAGNET_ITEM', {
     dropChanceKey: 'MAGNET_ITEM_DROP_CHANCE',
     spawnFn: (x, z) => spawnRareItem(x, z, 'MAGNET'),
   })
   registerLootType('BOMB_ITEM', {
     dropChanceKey: 'BOMB_ITEM_DROP_CHANCE',
     spawnFn: (x, z) => spawnRareItem(x, z, 'BOMB'),
   })
   registerLootType('SHIELD_ITEM', {
     dropChanceKey: 'SHIELD_ITEM_DROP_CHANCE',
     spawnFn: (x, z) => spawnRareItem(x, z, 'SHIELD'),
   })
   ```
   **And** `spawnRareItem` est importé depuis `'./rareItemSystem.js'`
   **And** `resetAll()` dans lootSystem.js appelle également `resetRareItems()` depuis rareItemSystem.js

#### Partie B — GameLoop Integration

5. **Given** `src/GameLoop.jsx`
   **When** la section 8a (update magnetization, ligne ~1352) s'exécute
   **Then** `updateRareItemMagnetization(playerPos[0], playerPos[2], clampedDelta, composedPickupRadius)` est appelé — importé depuis `'./systems/rareItemSystem.js'`
   **And** le pool de collision inclut les rare items dans la section 8b :
   ```js
   const activeRareItems = getActiveRareItems()
   const rareItemCount = getActiveRareItemCount()
   for (let i = 0; i < rareItemCount; i++) {
     assignEntity(pool[idx++], _rareItemIds[i], activeRareItems[i].x, activeRareItems[i].z, GAME_CONFIG.RARE_ITEM_PICKUP_RADIUS, CATEGORY_RARE_ITEM)
   }
   ```
   **And** un tableau pré-alloué `_rareItemIds` est créé en module-level (pattern identique à `_healGemIds`)

6. **Given** `src/GameLoop.jsx` — collision resolution
   **When** `cs.queryCollisions(pool[0], CATEGORY_RARE_ITEM)` retourne des hits
   **Then** pour chaque hit, `collectItem(index)` est appelé et retourne `{ type }`
   **And** selon le type :
     - `'MAGNET'` : force-magnetize tous les orbs XP, heal gems et fragment gems actifs (appelle `forceActivateMagnet()` sur chaque système)
     - `'BOMB'` : applique `Infinity` damage à tous les ennemis dans un rayon `GAME_CONFIG.BOMB_ITEM_RADIUS` du joueur (en utilisant `useEnemies.getState().damageEnemiesBatch()`), et applique 25% du maxHP du boss comme dommage si un boss est actif (`useBoss.getState().takeDamage(bossMaxHP * 0.25)`)
     - `'SHIELD'` : appelle `usePlayer.getState().activateShield(GAME_CONFIG.SHIELD_ITEM_DURATION)`
   **And** un SFX est joué pour chaque collection : `playSFX('rare-item-collect')` (placeholder audio, comme les autres)

#### Partie C — Effets dans les systèmes

7. **Given** `src/systems/xpOrbSystem.js`
   **When** l'effet Magnet est déclenché
   **Then** une nouvelle fonction exportée `forceActivateMagnet()` existe :
   ```js
   export function forceActivateMagnet() {
     for (let i = 0; i < activeCount; i++) orbs[i].isMagnetized = true
   }
   ```
   **And** la même fonction existe dans `healGemSystem.js` (`forceActivateMagnet`) et `fragmentGemSystem.js` (`forceActivateMagnet`)

8. **Given** `src/stores/usePlayer.jsx`
   **When** l'effet Bouclier est déclenché
   **Then** un nouveau champ `shieldTimer: 0` existe dans le state initial
   **And** une nouvelle action `activateShield(duration)` existe :
   ```js
   activateShield: (duration) => set({ isInvulnerable: true, shieldTimer: duration }),
   ```
   **And** dans `tick(delta)`, si `shieldTimer > 0`, le timer est décrémenté : `shieldTimer = Math.max(0, state.shieldTimer - delta)`
   **And** si `shieldTimer` atteint `0` et que le joueur n'est pas en train de dasher (`!state.isDashing`), `isInvulnerable` est remis à `false`
   **And** `reset()` inclut `shieldTimer: 0`

#### Partie D — Visuel Bouclier sur le vaisseau

9. **Given** `src/renderers/PlayerShip.jsx`
   **When** `shieldTimer > 0` dans le state joueur
   **Then** un mesh semi-transparent entoure le vaisseau : `<sphereGeometry args={[2.2, 20, 14]} />` avec `<meshBasicMaterial color="#4499ff" transparent opacity={0.25} toneMapped={false} />`
   **And** dans `useFrame`, l'opacité pulse : `material.opacity = 0.18 + Math.sin(elapsed * 4) * 0.1`
   **And** quand `shieldTimer` est à `0`, le mesh shield est `visible={false}` (ou retourne `null`)
   **And** l'état du shield est lu via `usePlayer.getState().shieldTimer` dans useFrame (pas de subscription Zustand)

#### Partie E — Renderer des items rares

10. **Given** `src/renderers/RareItemRenderer.jsx` (nouveau fichier)
    **When** des rare items sont actifs
    **Then** il utilise **un InstancedMesh par type** (3 meshes total) :
      - `MAGNET` : `TorusGeometry(0.28, 0.07, 8, 24)` — anneau, couleur `#00eeff` (cyan électrique)
      - `BOMB` : `IcosahedronGeometry(0.35, 0)` — sphère anguleuse, couleur `#ff3300` (rouge vif)
      - `SHIELD` : `OctahedronGeometry(0.32, 0)` — diamant, couleur `#44aaff` (bleu bouclier)
    **And** les trois meshes utilisent `MeshBasicMaterial({ toneMapped: false })`
    **And** dans `useFrame`, chaque item actif reçoit une rotation animée :
      - MAGNET : `dummy.rotation.set(0, elapsed * 3.0, 0)`
      - BOMB : `dummy.rotation.set(elapsed * 1.5, elapsed * 2.0, 0)`
      - SHIELD : `dummy.rotation.set(elapsed * 1.0, elapsed * 1.5, elapsed * 0.5)`
    **And** une légère oscillation verticale : `dummy.position.y = Math.sin(elapsed * 2.5 + i * 1.2) * 0.15`
    **And** `RareItemRenderer` est importé et rendu dans `GameplayScene.jsx` parmi les autres renderers

11. **Given** `src/scenes/GameplayScene.jsx`
    **When** les renderers sont listés
    **Then** `<RareItemRenderer />` est présent dans la liste des composants renderers

12. **Given** `vitest run`
    **When** la story est implémentée
    **Then** tous les tests existants passent
    **And** les tests suivants sont ajoutés (dans un nouveau fichier `src/stores/__tests__/usePlayer.shield.test.js`) :
      - `activateShield(5)` → `shieldTimer = 5`, `isInvulnerable = true`
      - `tick(3)` → `shieldTimer = 2`, `isInvulnerable = true`
      - `tick(3)` → `shieldTimer = 0`, `isInvulnerable = false`
      - `reset()` → `shieldTimer = 0`

**Technical Notes:**
- `rareItemSystem.js` : pool de 5 items max — rare enough qu'on n'en a jamais plus de 2-3 à la fois. Pattern identique à `healGemSystem.js`.
- Pré-allocation dans GameLoop : ajouter `const _rareItemIds = new Array(GAME_CONFIG.MAX_RARE_ITEMS).fill(0).map((_, i) => \`ritem_${i}\`)` en module-level.
- `forceActivateMagnet` dans les trois orb systems : opération O(n) simple, appelée une fois par activation donc aucun problème de perf.
- PlayerShip shield visual : l'état est lu via `usePlayer.getState()` dans `useFrame` (ref pattern), pas via un hook Zustand qui forcerait un re-render. `const shieldActive = useRef(false); useFrame(() => { shieldActive.current = usePlayer.getState().shieldTimer > 0; shieldMeshRef.current.visible = shieldActive.current; ... })`
- Bomb effect : for enemies in radius, utiliser le spatial hash existant ou itérer `useEnemies.getState().enemies` et filtrer par distance. Puisque c'est un event rare (pas every frame), la perf est non-critique. `const bombed = enemies.filter(e => Math.hypot(e.x - px, e.z - pz) <= BOMB_ITEM_RADIUS)` est acceptable.
- Pour le boss : `useBoss.getState()` — vérifier si `isActive` avant d'appeler `takeDamage`. Le 25% est calculé depuis `bossMaxHP` disponible dans le store boss.

**Files:**
| File | Changes |
|------|---------|
| `src/config/gameConfig.js` | 8 nouvelles constantes rares items |
| `src/systems/rareItemSystem.js` | Nouveau fichier — pool, spawn, magnetization, collect, reset |
| `src/systems/collisionSystem.js` | `CATEGORY_RARE_ITEM` export |
| `src/systems/lootSystem.js` | Import + registration des 3 items rares, reset update |
| `src/systems/xpOrbSystem.js` | `forceActivateMagnet()` export |
| `src/systems/healGemSystem.js` | `forceActivateMagnet()` export |
| `src/systems/fragmentGemSystem.js` | `forceActivateMagnet()` export |
| `src/stores/usePlayer.jsx` | `shieldTimer`, `activateShield()`, tick décrémentation |
| `src/GameLoop.jsx` | Magnetization, pool, collision, effect handlers rare items |
| `src/renderers/RareItemRenderer.jsx` | Nouveau fichier — 3 InstancedMesh + animation |
| `src/renderers/PlayerShip.jsx` | Shield visual mesh |
| `src/scenes/GameplayScene.jsx` | Import + render `<RareItemRenderer />` |
| `src/stores/__tests__/usePlayer.shield.test.js` | Nouveau fichier — tests du shield timer |

---

## Technical Notes globales

### Architecture Alignment

- **Config/Data** : Story 44.1, 44.3, 44.5A — nouvelles constantes dans `gameConfig.js`
- **Systems** : Stories 44.3, 44.4, 44.5 — modifications des 3 orb systems, lootSystem, nouveau rareItemSystem
- **Stores** : Story 44.5C — `usePlayer` shield state
- **GameLoop** : Story 44.5B — intégration magnétisation + collision + effect dispatch
- **Rendering** : Story 44.2, 44.5D/E — 3 renderers reskinned + nouveau RareItemRenderer + shield ship visual
- **UI** : Aucun changement UI direct (les fragments HUD reflètent automatiquement les nouvelles valeurs via le store existant)

### Ordre d'exécution recommandé

**Story 44.1 en premier** — changement de config isolé, impact immédiat visible, tests rapides à valider.

**Story 44.3 en second** — modification des systèmes orbs, correctif comportemental avec tests existants.

**Stories 44.2 et 44.4 en parallèle** — indépendantes, purement visuelles/système respectivement.

**Story 44.5 en dernier** — la plus large, dépend du lootSystem déjà stable (44.4) et des orb systems (44.3 pour `forceActivateMagnet`).

### Risques

- **44.2 Heal gem cross shape** : `BufferGeometryUtils.mergeGeometries` peut avoir des imports path différents selon la version Three.js. Vérifier le path avant implémentation avec `import * from 'three'` pour trouver BufferGeometryUtils.
- **44.5 ShieldTimer vs isDashing** : la résolution de `isInvulnerable` doit être `isDashing || shieldTimer > 0`. Dans `tick()`, le cas où le joueur est en train de dasher pendant que le shield expire doit conserver `isInvulnerable = true` (guard sur `!isDashing`).
- **44.5 Bomb vs Boss** : vérifier que `useBoss` est accessible depuis GameLoop (déjà importé) et que `takeDamage` existe sur le store boss (à grep avant implémentation).

### Fichiers impactés (estimation)

| Story | Fichiers principaux | Complexité |
|-------|-------------------|------------|
| 44.1  | `gameConfig.js`, `FragmentGemRenderer.jsx` | Faible |
| 44.2  | 3 renderers | Faible-Moyenne |
| 44.3  | 3 orb systems, `gameConfig.js` | Faible |
| 44.4  | `lootSystem.js` | Faible |
| 44.5  | 12 fichiers (8 modifs + 4 nouveaux) | Haute |

## Dependencies

- Epic 19 (Loot System) — done, provides `lootSystem.js` registry pattern extended in 44.5
- Epic 11 (XP Magnetization) — done, provides `xpOrbSystem.js` magnetization extended in 44.3
- Epic 43 (Performance) — done, pool patterns used in `rareItemSystem.js`

## Success Metrics

- Un fragment gem vaut `10` fragments à la collection
- Les orbs XP sont reconnaissables comme des losanges, les fragment gems comme des hexagones, les heal gems comme des croix
- Un collectible magnétisé ne s'arrête jamais — il suit le joueur jusqu'à absorption
- Jamais plus de 2 collectibles exactement superposés sur la même position au sol
- Les items rares (magnet, bombe, bouclier) droppent occasionally en combat et produisent leur effet immédiatement à la collection
- Le vaisseau affiche une sphère bleue semi-transparente pulsante pendant la durée du bouclier
- `vitest run` passe à 100%
