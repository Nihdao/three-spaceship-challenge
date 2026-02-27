# Epic 45: Player Experience Polish — Hitbox, Flash Fix, Balance & Nébuleuse

Sept améliorations directement issues du feedback joueurs post-publication : agrandissement des hitbox ennemies, carte en toggle, correction du flash de hit per-instance, allègement de la pression ennemie, enrichissement de la nébuleuse, uplift de lisibilité des interfaces (level-up, pause, menus), et ajout d'une tagline aléatoire sous le titre principal.

## Epic Goals

- Agrandir les hitbox ennemies de 30% pour rendre les tirs plus satisfaisants dès le début de partie
- Transformer la carte en toggle (M = ouvrir/fermer) au lieu du hold actuel
- Corriger le flash de hit pour n'affecter que l'ennemi réellement touché, pas tous ceux du même type
- Réduire la pression ennemie (40 max à l'écran, spawn rate allégé, HP base réduits d'un tier) pour que le joueur se sente puissant rapidement
- Enrichir le fond spatial avec une nébuleuse plus visible et un léger parallaxe pour rendre l'univers moins vide
- Augmenter les tailles de police dans les interfaces critiques (level-up, pause, menu principal) pour une meilleure lisibilité et accessibilité
- Ajouter une tagline humoristique aléatoire sous le titre du menu principal

## Epic Context

Ces items sont directement issus de retours de joueurs externes à la sortie du jeu :

**Hitbox** : "I recommend expanding the enemy hitbox a good bit, by like 30%. Missing so many shots in the early game just doesn't feel very good." Les `radius` actuels dans `enemyDefs.js` sont corrects pour la collision physique mais trop petits pour le gameplay — la résolution de collision projectile→ennemi utilise ces valeurs directement, et un +30% rendrait le tir nettement plus satisfaisant sans rendre le jeu trivial.

**Carte en hold** : "The map should be a toggle, not a press-and-hold, or put it closer to the movement controls." Le `MapOverlay.jsx` utilise `keydown`/`keyup` pour simuler un hold. Deux lignes à changer.

**Flash bug** : "Sometimes multiple instances highlight during the hit, without any feedback on which weapon caused that." Le `EnemyTypeMesh` dans `EnemyRenderer.jsx` calcule `maxFlashTimer = max(hitFlashTimer de tous les ennemis du type)` puis applique ce flash sur le **matériau partagé** de toutes les instances du même type. Résultat : si FODDER_BASIC #3 est touché, tous les FODDER_BASIC à l'écran flashent. La fix utilise `mesh.setColorAt()` pour un flash per-instance via `instanceColor`.

**Balance** : "The difficulty increases in a higher rate that player's abilities." Actuellement `MAX_ENEMIES_ON_SCREEN: 60` et les HP de base sont élevés. Réduire à 40 ennemis max + allonger les intervals de spawn + HP -33% sur tous les non-boss donnera une montée en puissance plus satisfaisante.

**Nébuleuse** : "I'd add parallax background, not even for visual effect, but to navigate around the map more efficiently." Une nébuleuse visible et avec léger parallaxe donne des repères visuels. Actuellement `nebulaOpacity: 0.05` est quasiment invisible. Deux blobs à 0.30–0.35 d'opacité + un `parallaxFactor: 0.008` sur le group nébuleuse combleront ce vide.

---

## Stories

### Story 45.1 — Agrandissement des hitbox ennemies (+30%)

As a player,
I want enemy hitboxes to be larger,
So that I can hit enemies reliably and feel powerful from the start of the run.

**Acceptance Criteria:**

1. **Given** `src/entities/enemyDefs.js`
   **When** les définitions d'ennemis sont ouvertes
   **Then** les champs `radius` de tous les ennemis non-boss sont multipliés par 1.3 et arrondis à 2 décimales :
   | typeId | radius avant | radius après |
   |---|---|---|
   | `FODDER_BASIC` | 1.5 | 2.0 |
   | `FODDER_TANK` | 2.0 | 2.6 |
   | `FODDER_SWARM` | 0.75 | 1.0 |
   | `SHOCKWAVE_BLOB` | 2.5 | 3.25 |
   | `SNIPER_MOBILE` | 1.5 | 2.0 |
   | `SNIPER_FIXED` | 1.5 | 2.0 |
   | `TELEPORTER` | 1.25 | 1.6 |

2. **Given** `BOSS_SENTINEL` et `BOSS_SPACESHIP` dans `enemyDefs.js`
   **When** les boss sont définis
   **Then** leurs `radius` ne sont **pas** modifiés — les boss utilisent `GAME_CONFIG.BOSS_COLLISION_RADIUS` (5.0) et `3.0` respectivement, qui restent inchangés

3. **Given** le système de collision dans `GameLoop.jsx`
   **When** les projectiles testent les collisions ennemies
   **Then** ils utilisent le champ `radius` de `ENEMIES[typeId]` (ou `e.radius` dans le pool ennemi) — confirmer que ce champ est bien lu depuis `enemyDefs.js` et que la modification se propage automatiquement sans autre changement

4. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests existants passent — les tests de collision utilisent des valeurs hardcodées ou les valeurs de `enemyDefs.js` ; vérifier si des tests référencent `radius: 1.5` etc. et les mettre à jour si nécessaire

**Technical Notes:**
- Changement purement dans `enemyDefs.js` — 7 valeurs numériques
- Vérifier que `useEnemies.jsx` copie bien `ENEMIES[typeId].radius` dans le pool ennemi au spawn (ligne `enemy.radius = def.radius` ou équivalent). Si c'est le cas, aucun autre fichier à modifier.
- Le `FODDER_SWARM` passe de 0.75 à 1.0 (arrondi depuis 0.975) — acceptable car les swarms sont petits et rapides, cette augmentation est particulièrement bienvenue pour rendre la swarm fun à tirer.

**Files:**
| File | Changes |
|------|---------|
| `src/entities/enemyDefs.js` | 7 champs `radius` mis à jour |

---

### Story 45.2 — Carte en toggle (M = ouvrir/fermer)

As a player,
I want to press M to open the map and press M again to close it,
So that I can navigate the map without holding a key.

**Acceptance Criteria:**

1. **Given** `src/ui/MapOverlay.jsx`
   **When** le composant est ouvert
   **Then** le handler `onKeyDown` appelle `setIsOpen(prev => !prev)` quand `e.key === 'm' || e.key === 'M'` et que `!isPaused`
   **And** le handler `onKeyUp` est **supprimé** entièrement — il n'y a plus de fermeture à la release de la touche

2. **Given** l'état `isOpen`
   **When** le jeu passe en pause (`isPaused = true`)
   **Then** la carte se ferme automatiquement : ajouter un `useEffect` qui écoute `useGame.getState().isPaused` et appelle `setIsOpen(false)` si la carte est ouverte

3. **Given** l'état `isOpen`
   **When** la phase de jeu change (quitte `'gameplay'`)
   **Then** la carte se ferme automatiquement via le même `useEffect` ou un useEffect séparé sur `phase`

4. **Given** un joueur qui appuie sur M pendant que la carte est ouverte
   **When** M est pressé une deuxième fois
   **Then** `isOpen` passe à `false` et la carte disparaît

5. **Given** `e.repeat`
   **When** M est maintenu appuyé
   **Then** `e.repeat === true` → le toggle n'est PAS déclenché à nouveau (guard `if (!e.repeat)` conservé)

6. **Given** `src/ui/__tests__/MapOverlay.test.jsx`
   **When** les tests existants tournent
   **Then** ils passent — les tests de `worldToMapPct` ne testent pas le comportement du toggle et sont non impactés

**Technical Notes:**
- Supprimer `window.addEventListener('keyup', onKeyUp, true)` et le retirer du cleanup `return`
- Changer `setIsOpen(true)` en `setIsOpen(prev => !prev)`
- Le `useEffect` pour fermeture automatique au pause peut lire `useGame` via subscription : `const unsub = useGame.subscribe(s => s.isPaused, (paused) => { if (paused) setIsOpen(false) })`

**Files:**
| File | Changes |
|------|---------|
| `src/ui/MapOverlay.jsx` | Suppression onKeyUp, toggle au lieu d'open, fermeture auto au pause |

---

### Story 45.3 — Flash de hit per-instance (seul l'ennemi touché flashe)

As a player,
I want to see only the enemy I actually hit flash white,
So that hit feedback is precise and visually informative.

**Acceptance Criteria:**

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

4. **Given** le bloc de flash partagé en bas du `useFrame` (lignes actuelles ~142–150)
   **When** la story est implémentée
   **Then** les appels à `applyHitFlash(refs[j].material, ...)` et `restoreOriginalColor(refs[j].material)` sont **supprimés**
   **And** `wasFlashingRef` est supprimé (devenu inutile)

5. **Given** des ennemis non rendus ce frame (typeEnemies vide)
   **When** `count === 0`
   **Then** aucun appel à `instanceColor.needsUpdate` — les meshes avec count=0 sont masqués et pas besoin de màj

6. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests passent — les tests de `hitFlashSystem.js` testent les fonctions pures et ne dépendent pas du renderer

**Technical Notes:**
- `THREE.Color.setScalar(v)` est équivalent à `setRGB(v, v, v)` — utilise la version setScalar pour la concision.
- `brightness = 1.0 + flashIntensity` : à flash max intensity (1.0), `brightness = 2.0`. Three.js stocke les instanceColors en `Float32BufferAttribute` qui préserve les valeurs > 1.0 — le shader standard multiplie `diffuseColor.rgb *= vInstanceColor`, ce qui double la luminosité des textures/couleurs du material. Résultat : flash blanc-brillant sur l'instance touchée seulement.
- Ajouter `import * as THREE from 'three'` si non présent, ou vérifier que `THREE.Color` est accessible. Probablement déjà importé.
- `_instanceFlashColor` déclaré en module-level : `const _instanceFlashColor = new THREE.Color()`
- Ne pas supprimer les imports de `calculateFlashIntensity` depuis `hitFlashSystem.js` — toujours utilisé. Supprimer `applyHitFlash` et `restoreOriginalColor` des imports si plus utilisés.

**Files:**
| File | Changes |
|------|---------|
| `src/renderers/EnemyRenderer.jsx` | Suppression maxFlashTimer + shared material flash → per-instance setColorAt |

---

### Story 45.4 — Allègement de la pression ennemie (balance)

As a player,
I want to feel powerful from the beginning and not be overwhelmed by too many enemies,
So that the early game is satisfying and the difficulty curve feels intentional.

**Acceptance Criteria:**

1. **Given** `src/config/gameConfig.js`
   **When** les constantes de spawn sont consultées
   **Then** les valeurs suivantes sont mises à jour :
   | Constante | Avant | Après |
   |---|---|---|
   | `MAX_ENEMIES_ON_SCREEN` | 60 | 40 |
   | `SPAWN_INTERVAL_BASE` | 4.0 | 5.5 |
   | `SPAWN_INTERVAL_MIN` | 2.0 | 2.8 |
   | `SPAWN_RAMP_RATE` | 0.025 | 0.018 |

2. **Given** `src/entities/enemyDefs.js`
   **When** les HP de base des ennemis non-boss sont consultés
   **Then** ils sont réduits d'environ un tiers (-33%) et arrondis à l'entier supérieur :
   | typeId | hp avant | hp après |
   |---|---|---|
   | `FODDER_BASIC` | 20 | 14 |
   | `FODDER_TANK` | 40 | 27 |
   | `FODDER_SWARM` | 8 | 6 |
   | `SHOCKWAVE_BLOB` | 15 | 10 |
   | `SNIPER_MOBILE` | 25 | 17 |
   | `SNIPER_FIXED` | 10 | 7 |
   | `TELEPORTER` | 18 | 12 |

3. **Given** `BOSS_SENTINEL` et `BOSS_SPACESHIP`
   **When** la story est implémentée
   **Then** leurs HP (**BOSS_HP**, **BOSS_BASE_HP** dans `gameConfig.js`) ne sont **pas** modifiés — les boss doivent rester des challenges

4. **Given** le commentaire `// updated Story 28.4` dans `gameConfig.js` sur SPAWN_INTERVAL_BASE
   **When** les valeurs sont mises à jour
   **Then** le commentaire est mis à jour pour référencer cette story : `// Story 45.4: allègement pression ennemie`

5. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests passent — vérifier si des tests référencent les HP hardcodés des ennemis (ex: `hp: 20`) et les mettre à jour si nécessaire

**Technical Notes:**
- Vérifier que `useEnemies.jsx` copie `def.hp` dans le pool au spawn — la modification dans `enemyDefs.js` doit se propager automatiquement
- `SPAWN_BATCH_SIZE_BASE` et `SPAWN_BATCH_RAMP_INTERVAL` ne sont pas modifiés — la réduction de la densité passe par les intervals, pas la taille des batches
- L'effet combiné : 40 max sur écran + intervals plus longs = environ 40% moins d'ennemis à l'écran en mid-game, ce qui est significatif sans rendre le jeu trivial

**Files:**
| File | Changes |
|------|---------|
| `src/config/gameConfig.js` | 4 constantes de spawn mises à jour |
| `src/entities/enemyDefs.js` | 7 champs `hp` réduits de 33% |

---

### Story 45.5 — Nébuleuse enrichie (opacité, double blob, parallaxe)

As a player,
I want a visible, rich nebula in the background with subtle parallax,
So that the space environment feels less empty and I have visual landmarks for navigation.

**Acceptance Criteria:**

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
   **Then** les constantes suivantes sont ajoutées dans `BACKGROUND.DEFAULT` (ou dans un sous-objet `NEBULA_LAYERS`) :
   ```js
   nebula2Enabled: true,
   nebula2Tint: '#0a1840',        // bleu-marine profond pour contraste
   nebula2Opacity: 0.20,
   nebula2OffsetX: 0.6,           // décalage relatif sur la sphère (en fraction de la taille)
   nebula2OffsetZ: -0.4,
   ```
   **And** ces valeurs sont lues dans `EnvironmentRenderer.jsx`

3. **Given** `src/renderers/EnvironmentRenderer.jsx` — composant `NebulaBackground`
   **When** il est rendu
   **Then** la texture canvas utilise un gradient plus riche avec 4 stops :
   ```js
   gradient.addColorStop(0,   tint)                        // centre solide
   gradient.addColorStop(0.35, tint)                       // maintient la densité
   gradient.addColorStop(0.70, tintWithAlpha(tint, 0.4))  // fondu progressif
   gradient.addColorStop(1,   'rgba(0,0,0,0)')            // transparent au bord
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
   **And** `NebulaBackground` accepte les props `tint` et `opacity` (déjà le cas selon le code existant)

6. **Given** `src/renderers/EnvironmentRenderer.jsx` — composant `NebulaBackground`
   **When** le composant est démonté
   **Then** la `CanvasTexture` créée dans `useMemo` est disposée dans le cleanup : `return () => texture.dispose()`

7. **Given** la scène boss (`BACKGROUND.BOSS`)
   **When** la configuration boss est consultée
   **Then** `BACKGROUND.BOSS` reste tel quel (`nebulaEnabled: false`) — les boss n'affichent pas de nébuleuse, ce comportement est conservé
   **And** `nebula2Enabled` est implicitement `false` pour la config boss (pas de champ `nebula2Enabled` dans `BOSS`)

8. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests passent — `EnvironmentRenderer` n'a pas de tests unitaires directs (composant 3D), aucun test à modifier

**Technical Notes:**
- `tintWithAlpha` helper local :
  ```js
  function tintWithAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }
  ```
- Le parallaxe 0.008 : pour un joueur qui traverse les 1000 unités de PLAY_AREA_SIZE, la nébuleuse se décalera de `1000 * 0.008 = 8 unités` sur une sphère de rayon 6000 — imperceptible comme rotation, mais visible comme glissement latéral subtilement cosmétique.
- Les deux blobs auront le même parallaxe (même facteur 0.008) — pas de complexité à gérer des facteurs différents.
- `useMemo([tint])` : la texture est recalculée si `tint` change (ex: au changement de scène). Le dispose dans le cleanup évite les fuites GPU. Pattern conforme aux guidelines `<webgl_memory_management>`.
- La taille canvas 256x256 reste très légère (256KB VRAM max pour une texture non-mipmapped) — pas de problème de perf.

**Files:**
| File | Changes |
|------|---------|
| `src/config/gameConfig.js` | `nebulaTint`, `nebulaOpacity` updatés + `nebula2*` constants ajoutées dans `BACKGROUND.DEFAULT` |
| `src/renderers/EnvironmentRenderer.jsx` | Gradient canvas amélioré, parallaxe group, second blob, dispose texture |

---

### Story 45.6 — Lisibilité & accessibilité des interfaces (font uplift)

As a player,
I want all menus, level-up screens, and in-game overlays to use larger, more readable text,
So that I can quickly understand my choices and navigate the UI without squinting.

**Acceptance Criteria:**

#### Partie A — LevelUpModal (`src/ui/LevelUpModal.jsx`)

1. **Given** la colonne gauche "Current Build"
   **When** elle est rendue
   **Then** les valeurs `fontSize: 12` passent à `fontSize: 14` et `fontSize: 11` passe à `fontSize: 13`
   **And** le titre "Current Build" passe de `fontSize: 12` à `fontSize: 14`
   **And** la ligne "Weapons: X · Boons: Y" passe de `fontSize: 11` à `fontSize: 13`

2. **Given** le titre "LEVEL UP!" dans la colonne droite
   **When** il est rendu
   **Then** il passe de `fontSize: '2.5rem'` à `fontSize: '3.5rem'`

3. **Given** les cartes de choix dans la colonne droite
   **When** elles sont rendues
   **Then** le badge rareté passe de `fontSize: 11` à `fontSize: 13`
   **And** le shortcut `[1]` passe de `fontSize: 11` à `fontSize: 13`
   **And** les classes Tailwind `text-xs` (nom du choix et description) sur les éléments `<h3>` et `<p>` sont remplacées par `text-sm` (14px)

4. **Given** le conteneur principal (2 colonnes)
   **When** il est rendu
   **Then** `maxWidth` passe de `860` à `980` pour accueillir les contenus agrandis
   **And** la colonne droite `minWidth` passe de `320` à `400`

5. **Given** les boutons REROLL / SKIP / BANISH
   **When** ils sont rendus
   **Then** ils utilisent `fontSize: '1rem'` sur le label principal (via classe ou style inline) au lieu de la taille Tailwind par défaut

#### Partie B — PauseMenu (`src/ui/PauseMenu.jsx`)

6. **Given** les labels de la section stats (weapons/boons, ligne par ligne)
   **When** ils sont rendus
   **Then** les `fontSize: 13` et `fontSize: 12` passent respectivement à `15` et `14`
   **And** le `fontSize: 'clamp(13px, 1.3vw, 16px)'` sur les textes de body passe à `clamp(14px, 1.4vw, 18px)`

7. **Given** le séparateur dash `—` entre les valeurs vides
   **When** il est rendu
   **Then** son `fontSize: 12` passe à `14`

#### Partie C — MainMenu (`src/ui/MainMenu.jsx`)

8. **Given** les boutons du menu principal (PLAY, UPGRADES, ARMORY, OPTIONS)
   **When** ils sont rendus
   **Then** `fontSize: "0.75rem"` dans les styles `menuBtn` et `menuBtnSelected` passe à `"0.875rem"`
   **And** `width: "12rem"` passe à `"14rem"` pour absorber la police plus grande sans overflow

9. **Given** les labels de stats en haut à droite (BEST RUN, FRAGMENTS)
   **When** ils sont rendus
   **Then** les `fontSize: "0.65rem"` passent à `"0.72rem"`
   **And** les valeurs numériques `fontSize: "1.5rem"` passent à `"1.75rem"`

10. **Given** les boutons de coin (STATS, CREDITS)
    **When** ils sont rendus
    **Then** `fontSize: "0.72rem"` dans `S.cornerBtn` passe à `"0.8rem"`

11. **Given** `vitest run`
    **When** la story est implémentée
    **Then** tous les tests passent — les tests de PauseMenu vérifient des présences/absences de boutons, pas les font sizes

**Technical Notes:**
- Pas de variables CSS globales à modifier — les changements sont localisés dans les styles inline et les classes Tailwind des 3 fichiers. Aucun système de design token global à mettre à jour.
- Les tailles `fontSize` en px (12, 11) sont pour les éléments internes des composants — les augmenter de 2px est la correction minimale pour l'accessibilité (WCAG recommande 14px minimum pour le body text).
- `clamp()` dans PauseMenu : ajuster les bornes min/max de manière cohérente (+1px à chaque borne).

**Files:**
| File | Changes |
|------|---------|
| `src/ui/LevelUpModal.jsx` | Font sizes +2px sur labels/valeurs, titre 3.5rem, maxWidth 980, colonne droite minWidth 400 |
| `src/ui/PauseMenu.jsx` | Font sizes +2px sur stats/body text |
| `src/ui/MainMenu.jsx` | Menu buttons 0.875rem/14rem, stats labels 0.72rem, valeurs 1.75rem |

---

### Story 45.7 — Tagline aléatoire sous le titre du menu principal

As a player,
I want to see a small random humorous phrase below the game title each time I visit the main menu,
So that the game has personality and returning to the menu after a run is slightly rewarding.

**Acceptance Criteria:**

1. **Given** `src/ui/MainMenu.jsx`
   **When** le composant est monté (mount initial ou retour au menu)
   **Then** une tagline est sélectionnée aléatoirement parmi le pool de phrases et affichée — elle ne change **pas** pendant la session (stable à l'initialisation du `useState`)

2. **Given** la position de la tagline
   **When** le menu principal est affiché
   **Then** elle apparaît entre la ligne orange décorative et les boutons du menu :
   ```
   REDSHIFT SURVIVOR          ← h1 titre
   ————                       ← ligne orange (width 32px)
   THE VOID STARES BACK.      ← tagline ici
   IT LOOKS DISAPPOINTED.
                              ← gap avant les boutons
   [ PLAY ]
   [ UPGRADES ]
   ...
   ```

3. **Given** le style de la tagline
   **When** elle est rendue
   **Then** elle utilise ces styles :
   - `fontFamily: "'Space Mono', monospace"`
   - `fontSize: '0.65rem'`
   - `letterSpacing: '0.12em'`
   - `color: 'var(--rs-danger, #e63946)'` — rouge distinctif, différent de l'orange du titre
   - `textTransform: 'uppercase'`
   - `textAlign: 'center'`
   - `marginBottom: '2.5rem'` (remplace le `marginBottom: "3rem"` de la ligne orange)
   - `opacity: 0.85`
   - `userSelect: 'none'`
   **And** la ligne orange passe à `marginBottom: '1rem'` (la tagline prend le relais du gap)

4. **Given** le pool de taglines dans `MainMenu.jsx`
   **When** le fichier est ouvert
   **Then** la constante `TAGLINES` est définie au module-level (avant le composant) et contient au minimum ces phrases :
   ```js
   const TAGLINES = [
     "THE UNIVERSE IS BIGGER THAN YOUR PROBLEMS. FOR NOW.",
     "SPACE IS INFINITE. YOUR HEALTH BAR IS NOT.",
     "EVERY DEATH IS A LEARNING OPPORTUNITY.\nYOU HAVE LEARNED NOTHING.",
     "RECOMMENDED BY 0 OUT OF 1 SENTIENT VOIDS.",
     "TECHNICALLY STILL ALIVE.",
     "YOUR SHIP IS FINE. YOU ARE NOT FINE.",
     "ENEMIES HAVE FAMILIES TOO. (THEY DON'T.)",
     "THE VOID STARES BACK.\nIT LOOKS DISAPPOINTED.",
     "SKILL ISSUE (OPTIONAL DISCLAIMER)",
     "LAST SEEN: ALIVE. STATUS: DEBATABLE.",
     "IF YOU LISTEN CLOSELY, THE ASTEROIDS LAUGH.",
     "NOT ALL WHO WANDER ARE LOST.\nMOST ARE JUST BAD AT THE GAME.",
     "STARS DIED FOR BILLIONS OF YEARS TO MAKE THIS.\nPLEASE DON'T CRASH INTO THEM.",
     "REDSHIFT: WHAT HAPPENS TO YOUR DOPPLER WHEN YOU FLEE.",
     "PRESS PLAY. REGRET LATER.",
   ]
   ```

5. **Given** les taglines avec `\n`
   **When** elles sont rendues
   **Then** la balise contenant la tagline utilise `whiteSpace: 'pre-line'` pour respecter les sauts de ligne

6. **Given** un retour au menu après une partie
   **When** le composant `MainMenu` se remonte
   **Then** une nouvelle tagline aléatoire est sélectionnée (comportement naturel via `useState` init)

7. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests passent — aucun test existant ne teste le contenu textuel du MainMenu

**Technical Notes:**
- `const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)])` — l'initializer function garantit un seul appel à random par mount.
- `var(--rs-danger)` : vérifier dans `style.css` que la variable existe. Si non définie, utiliser `#e63946` directement (rouge WCAG-accessible sur fond sombre).
- Les taglines à `\n` avec `whiteSpace: 'pre-line'` créent un effet 2 lignes compact sans `<br>` dans le JSX.
- Le pool peut être enrichi librement sans impacter les tests — c'est un array de strings.

**Files:**
| File | Changes |
|------|---------|
| `src/ui/MainMenu.jsx` | Constante `TAGLINES` au module-level, `useState` tagline, rendu entre ligne orange et boutons |

---

## Technical Notes globales

### Architecture Alignment

- **Config/Data** : Stories 45.1, 45.4 (enemyDefs.js) + 45.5 (gameConfig BACKGROUND) — changements purement déclaratifs
- **Systems** : Aucun système modifié dans cette epic
- **Stores** : Aucun store modifié
- **GameLoop** : Non modifié — la collision utilise déjà `e.radius` du pool ennemi
- **Rendering** : Story 45.3 (EnemyRenderer per-instance flash) + Story 45.5 (EnvironmentRenderer nebula)
- **UI** : Story 45.2 (MapOverlay toggle) + Story 45.6 (font uplift LevelUpModal/PauseMenu/MainMenu) + Story 45.7 (tagline MainMenu)

### Ordre d'exécution recommandé

**45.2 en premier** — 2 lignes de code, zéro risque, impact immédiat.

**45.7 en second** — constante + une ligne de JSX, totalement isolé, fun à tester.

**45.1 et 45.4 en parallèle** — changements dans des fichiers différents, indépendants.

**45.6** — UI only, après avoir vérifié que les autres stories n'impactent pas les composants concernés.

**45.3** — après validation que les tests existants passent avec les nouvelles valeurs de radius/HP. Modifier EnemyRenderer est isolé.

**45.5 en dernier** — purement visuel, aucun impact gameplay, peut être itéré visuellement.

### Risques

- **45.3 THREE.Color > 1.0** : Bien que la spec Three.js permette des valeurs > 1.0 dans `Float32BufferAttribute`, le rendu final dépend du tone mapping et du color space de la scène. Si le résultat visuel n'est pas satisfaisant (pas de brightening visible), fallback : remplacer par une couleur de tint distincte (ex: `Color(1,1,0.5)` = tint jaune) pour différencier visuellement.
- **45.4 Tests HP** : Des tests dans `useEnemies` ou `collisionSystem` peuvent hardcoder `hp: 20` pour FODDER_BASIC. Faire un grep avant implémentation : `grep -r "hp: 20" src/` et `grep -r "hp: 40" src/`.
- **45.5 Canvas texture VRAM** : Deux textures 256x256 = ~0.25MB VRAM chacune. Très acceptable.
- **45.6 Tailwind classes** : `text-xs` → `text-sm` dans les cartes level-up peut casser des layouts si les cartes n'ont pas assez de hauteur. Vérifier visuellement que les descriptions longues ne débordent pas.
- **45.7 `--rs-danger`** : vérifier avec `grep -n "rs-danger" src/style.css` si la variable existe. Si non, ajouter `--rs-danger: #e63946;` dans `:root` de `style.css`.

### Fichiers impactés (estimation)

| Story | Fichiers principaux | Complexité |
|-------|-------------------|------------|
| 45.1  | `enemyDefs.js` | Triviale |
| 45.2  | `MapOverlay.jsx` | Triviale |
| 45.3  | `EnemyRenderer.jsx` | Faible |
| 45.4  | `gameConfig.js`, `enemyDefs.js` | Triviale |
| 45.5  | `gameConfig.js`, `EnvironmentRenderer.jsx` | Faible |
| 45.6  | `LevelUpModal.jsx`, `PauseMenu.jsx`, `MainMenu.jsx` | Triviale |
| 45.7  | `MainMenu.jsx` | Triviale |

## Dependencies

- Epic 27 (Combat Feedback System) — done, fournit `hitFlashSystem.js` et le pattern `hitFlashTimer` étendu en 45.3
- Epic 35 (MapOverlay) — done, fournit `MapOverlay.jsx` modifié en 45.2
- Epic 15 (Space Environment) — done, fournit `NebulaBackground` étendu en 45.5

## Success Metrics

- Les projectiles touchent les ennemis nettement plus souvent en early game — le tir "claque" dès le début
- M ouvre la carte, M la ferme — aucun besoin de maintenir la touche
- Quand on tire dans un groupe d'ennemis mélangés, seul l'ennemi touché flashe blanc — les autres restent normaux
- À 2 minutes de jeu, le joueur n'est jamais cerné par plus de 40 ennemis simultanément
- Les FODDER_BASIC meurent en 1-2 tirs avec l'arme de départ (14 HP vs 10 damage/shot)
- La nébuleuse violette est clairement visible en background, se décale légèrement quand on se déplace
- Le texte du level-up modal est lisible sans effort, les cartes de choix sont grandes et claires
- À chaque visite du menu, une phrase rouge différente apparaît sous le titre — "SKILL ISSUE (OPTIONAL DISCLAIMER)" ou équivalent
- `vitest run` passe à 100%
