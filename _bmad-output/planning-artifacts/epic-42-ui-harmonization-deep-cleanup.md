# Epic 42: UI Harmonization — Deep Cleanup & Structural Consistency

Corriger les incohérences structurelles qui persistent après l'Epic 39 (Redshift Design System Pass). L'Epic 39 a migré chaque composant vers le DS individuellement, mais n'a pas traité les problèmes transversaux : le **double système de couleurs CSS**, les **écrans flottants sans conteneur**, les **polices trop petites**, le **curseur de visée pendant la pause**, l'**icône Fragment incohérente**, et le **bouton OPTIONS absent du menu principal**.

## Epic Goals

- Purger complètement le legacy `@theme` (variables `--color-game-*`, `--font-game`) de `style.css` et éliminer toutes les classes Tailwind qui en dépendent
- Envelopper les écrans "flottants" (GameOver, Victory, Revive, LevelUp, PlanetReward) dans un conteneur `--rs-bg-surface` visible
- Rehausser toutes les tailles de police minimales à 11px+ pour la lisibilité
- Cacher le crosshair et restaurer le curseur natif pendant la pause
- Unifier l'icône Fragment (SVG partout, plus de `◆` Unicode)
- Restaurer l'accès à OPTIONS depuis le menu principal
- Corriger le SystemNameBanner (Inter + magenta → Bebas Neue + palette Redshift)

## Epic Context

L'audit UI global a révélé que la source principale du chaos visuel ("des fois rouge, des fois bleu, des fois violet") est la coexistence de deux palettes dans `style.css` : le legacy `@theme` (magenta `#ff00ff`, cyan `#00f0ff`, pink `#ff00aa`) et le Redshift `:root` (orange `#ff4f1f`, violet `#9b5de5`, teal `#00b4d8`). Les classes Tailwind (`text-game-danger`, `text-game-text`, `text-yellow-400`, `bg-game-danger`, `font-game`) pointent toutes vers le legacy, tandis que les inline styles utilisent les `var(--rs-*)`. Ce conflit crée un mélange de teintes incohérent à travers toute l'UI.

Par ailleurs, plusieurs écrans présentent leur contenu "flottant" sur un overlay semi-transparent sans panel conteneur visible, ce qui rompt la cohérence avec les écrans qui en ont (PauseMenu, ShipSelect, TunnelHub). L'utilisateur demande explicitement que **chaque bloc de contenu soit contenu dans un conteneur visible**.

---

## Stories

### Story 42.1 — Purge legacy `@theme` & classes Tailwind héritage

As a developer,
I want all legacy color/font variables removed from style.css and replaced throughout the codebase,
So that a single coherent palette (Redshift) drives every visual element.

**Acceptance Criteria:**

1. **Given** `src/style.css`
   **When** le fichier est ouvert
   **Then** le bloc `@theme { }` ne contient plus les variables `--color-game-*` ni `--font-game`
   **And** les `@keyframes` qui étaient dans `@theme` sont déplacés hors du bloc (au niveau racine de la feuille)
   **And** les animations Tailwind (`--animate-fade-in`, `--animate-slide-up`, `--animate-pulse-glow`) restent fonctionnelles (via `@theme` ou redéfinies)

2. **Given** l'ensemble du dossier `src/ui/`
   **When** on cherche `text-game-`, `bg-game-`, `border-game-`, `text-yellow-`, `font-game`, `accent-game-`
   **Then** aucune occurrence n'existe — toutes remplacées par inline styles `var(--rs-*)` ou classes custom

3. **Given** `src/style.css` classe `.damage-number`
   **When** les damage numbers s'affichent
   **Then** `font-family` utilise `'Rajdhani', sans-serif` au lieu de `'Inter', system-ui, sans-serif`

4. **Given** `src/style.css` classes `.system-name-banner-text` et `.system-name-banner-subtitle`
   **When** la bannière système s'affiche
   **Then** `font-family` utilise `'Bebas Neue', sans-serif` pour le titre et `'Rajdhani', sans-serif` pour le sous-titre
   **And** `text-shadow` ne contient plus `rgba(255, 100, 255, ...)` (magenta) — remplacé par `rgba(255, 79, 31, 0.4)` (orange Redshift) ou supprimé

5. **Given** `html, body, #root` dans style.css
   **When** la page se charge
   **Then** `background` utilise `var(--rs-bg)` (`#0d0b14`) au lieu de `#0a0a0f`

6. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests existants passent — les tests ne vérifient pas les styles inline mais certains utilisent `text-game-*` en sélecteurs ; ajuster les sélecteurs de test si nécessaire

---

### Story 42.2 — Restaurer OPTIONS dans le menu principal

As a player,
I want to access audio settings and clear save from the main menu,
So that I don't lose the ability to configure the game after the menu reorganization.

**Acceptance Criteria:**

1. **Given** `MainMenu.jsx`
   **When** le menu principal s'affiche
   **Then** un bouton "OPTIONS" est visible en bas à gauche, dans la rangée des boutons corner (à côté de STATS et CREDITS)
   **And** le bouton utilise le même style `S.cornerBtn` que STATS et CREDITS
   **And** au clic, le `OptionsModal` s'ouvre
   **And** la navigation clavier (ArrowUp/Down) continue de fonctionner sur les 4 items principaux (PLAY, UPGRADES, ARMORY, STATS)

2. **Given** le joueur clique sur OPTIONS
   **When** le modal se ferme
   **Then** le focus revient au bouton OPTIONS (même pattern que CREDITS)

3. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests MainMenu passent

---

### Story 42.3 — Unifier l'icône Fragment (SVG partout)

As a player,
I want the fragment icon to look identical everywhere in the UI,
So that the currency has a consistent visual identity.

**Acceptance Criteria:**

1. **Given** `HUD.jsx`
   **When** les fragments sont affichés dans le stats cluster
   **Then** l'icône utilise `<FragmentIcon size={14} color="var(--rs-violet)" />` — plus le caractère Unicode `"◆"`

2. **Given** `TunnelHub.jsx`
   **When** le compteur de fragments est affiché
   **Then** l'icône utilise `<FragmentIcon>` — plus `&#9670;` ni `◆`

3. **Given** `ShipSelect.jsx`
   **When** le coût de level-up affiche le symbole diamant
   **Then** l'icône utilise `<FragmentIcon>` — plus `◆`

4. **Given** tout fichier dans `src/ui/`
   **When** on cherche `◆`, `&#9670;`, `&#x25C6;`
   **Then** aucune occurrence — tout remplacé par le composant `<FragmentIcon>`

5. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests passent

---

### Story 42.4 — Conteneuriser les écrans flottants

As a player,
I want every UI screen's content to be visually contained within a panel,
So that nothing feels like it's floating randomly on a dark background.

**Acceptance Criteria:**

1. **Given** `GameOverScreen.jsx`
   **When** les stats et boutons sont visibles (stage >= 4)
   **Then** le contenu (taunt, high score, stats, boutons) est enveloppé dans un panel central visible avec `background: var(--rs-bg-surface)`, `border: 1px solid var(--rs-border)`, clip-path 16px
   **And** le titre (taunt message) reste en dehors du panel, au-dessus — le panel contient stats + boutons
   **And** le panel a un `max-width` raisonnable (ex: `clamp(320px, 40vw, 480px)`) et un `padding: 24px`

2. **Given** `VictoryScreen.jsx`
   **When** les stats et boutons sont visibles (stage >= 2)
   **Then** même pattern : panel `--rs-bg-surface` contenant stats + boutons, titre au-dessus

3. **Given** `RevivePrompt.jsx`
   **When** le prompt s'affiche
   **Then** le contenu (titre, compteur, boutons) est enveloppé dans un panel `--rs-bg-surface` centré avec clip-path 16px et border `--rs-border`

4. **Given** `LevelUpModal.jsx`
   **When** le modal s'affiche
   **Then** le conteneur principal des 2 colonnes a un `background: var(--rs-bg-surface)`, `border: 1px solid var(--rs-border)`, clip-path 16px, `padding: 24px`

5. **Given** `PlanetRewardModal.jsx`
   **When** le modal s'affiche
   **Then** le conteneur principal des 2 colonnes a un `background: var(--rs-bg-surface)`, `border: 1px solid var(--rs-border)`, clip-path 16px, `padding: 24px`

6. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests passent

---

### Story 42.5 — Cacher le crosshair et montrer le curseur natif pendant la pause

As a player,
I want the crosshair to disappear and the normal mouse cursor to appear when I pause the game,
So that I can navigate the pause menu comfortably without the crosshair interfering.

**Acceptance Criteria:**

1. **Given** `Crosshair.jsx`
   **When** le jeu est en pause (`useGame.isPaused === true`)
   **Then** le composant retourne `null` (crosshair masqué)

2. **Given** le style global ou le composant qui applique `cursor: none` pendant le gameplay
   **When** le jeu passe en pause
   **Then** `cursor: none` est retiré du body/root — le curseur natif redevient visible
   **And** quand le jeu reprend, `cursor: none` est réappliqué

3. **Given** les phases `levelUp`, `planetReward`, `revive`
   **When** ces modals s'affichent (le jeu est effectivement en pause pour ces phases)
   **Then** le crosshair est toujours visible (ces phases sont des choix de gameplay, pas une vraie pause)
   **And** le comportement existant est préservé — seule la pause ESC/P cache le crosshair

4. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests passent

---

### Story 42.6 — Rehausser les tailles de police minimales

As a player,
I want all text in the UI to be comfortably readable,
So that small labels and stats don't strain my eyes during gameplay.

**Acceptance Criteria:**

1. **Given** `HUD.jsx`
   **When** le HUD est affiché
   **Then** `AnimatedStat` utilise `clamp(13px, 1.3vw, 18px)` au lieu de `clamp(11px, 1.1vw, 16px)`
   **And** le dash label "SPACE" utilise `clamp(10px, 1vw, 12px)` au lieu de `clamp(8px, 0.8vw, 10px)`
   **And** les weapon/boon slot names utilisent `clamp(9px, 0.9vw, 11px)` au lieu de `clamp(7px, 0.7vw, 10px)`
   **And** les weapon/boon slot levels utilisent `clamp(9px, 0.9vw, 11px)` au lieu de `clamp(7px, 0.7vw, 9px)`
   **And** le dash cooldown value utilise `clamp(11px, 1.1vw, 14px)` au lieu de `clamp(9px, 0.9vw, 12px)`

2. **Given** `PauseMenu.jsx`
   **When** le menu pause est affiché
   **Then** `sectionTitleStyle.fontSize` est `12` au lieu de `11`
   **And** les weapon/boon info names utilisent `fontSize: 13` au lieu de `12`
   **And** les weapon/boon stat lines utilisent `fontSize: 12` au lieu de `11`

3. **Given** `LevelUpModal.jsx`
   **When** le modal level-up est affiché
   **Then** les labels du "Current Build" utilisent `fontSize: 12` au lieu de `11`
   **And** les valeurs du "Current Build" utilisent `fontSize: 12` au lieu de `11`
   **And** le footer "Weapons: X · Boons: Y" utilise `fontSize: 11` au lieu de `10`

4. **Given** `StatLine.jsx`
   **When** le mode `compact` est actif
   **Then** le label utilise `text-[11px]` au lieu de `text-[10px]`
   **And** la valeur utilise `fontSize: 12` au lieu de `11`

5. **Given** aucun texte dans `src/ui/`
   **When** on cherche des `fontSize` inférieurs à 10px (ou `clamp(Xpx,` avec X < 9)
   **Then** aucune occurrence — le minimum absolu est 9px (réservé aux badges et annotations très secondaires)

6. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests passent

---

### Story 42.7 — Purge couleurs hardcodées résiduelles dans le HUD

As a developer,
I want all remaining hardcoded hex colors in HUD.jsx replaced by Redshift CSS variables,
So that the HUD palette is fully driven by the design system.

**Acceptance Criteria:**

1. **Given** `HUD.jsx` — dash cooldown indicator
   **When** le dash est en cooldown
   **Then** la border utilise `var(--rs-dash-cd)` au lieu de `'#ffaa00'`
   **And** le backgroundColor utilise `rgba(255, 79, 31, 0.08)` (orange RS) au lieu de `'#ffaa0015'`
   **And** le texte utilise `var(--rs-dash-cd)` au lieu de `'#ffaa00'`

2. **Given** `HUD.jsx` — dash ready indicator
   **When** le dash est prêt
   **Then** la border utilise `var(--rs-dash-ready)` au lieu de `'var(--rs-teal)'` (déjà correct pour certains, vérifier cohérence)
   **And** le backgroundColor utilise `rgba(0, 180, 216, 0.12)` au lieu de `'#00ffcc20'`
   **And** le boxShadow utilise `rgba(0, 180, 216, 0.4)` au lieu de `'#00ffcc60'`

3. **Given** `HUD.jsx` — MINIMAP constants
   **When** la minimap s'affiche
   **Then** `enemyDotColor` utilise `var(--rs-danger)` au lieu de `'#ff4444'`
   **And** `playerDotGlow` utilise `rgba(0, 180, 216, 0.8)` au lieu de `'rgba(0, 255, 204, 0.8)'`

4. **Given** `HUD.jsx` — weapon slot empty state
   **When** un slot arme est vide
   **Then** la border utilise `var(--rs-border)` (via `1px dashed`) au lieu de `'rgba(255,255,255,0.1)'`
   **And** le texte placeholder utilise `var(--rs-text-dim)` au lieu de `'rgba(255,255,255,0.2)'`

5. **Given** `HUD.jsx` — scan progress bar
   **When** la barre de scan s'affiche
   **Then** le fond de la track utilise `var(--rs-bg-raised)` au lieu de `'rgba(255,255,255,0.1)'`

6. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests HUD passent

---

## Technical Notes

### Architecture Alignment

- **Config/Data** : Aucun changement
- **Systems** : Aucun changement
- **Stores** : Aucun changement
- **GameLoop** : Aucun changement
- **Rendering** : Aucun changement
- **UI** : Tous les changements sont dans `src/ui/` et `src/style.css`

### Ordre d'exécution recommandé

**Story 42.1 en premier** (purge legacy CSS) car elle pose les fondations. Les stories 42.2 à 42.7 sont indépendantes entre elles et peuvent être parallélisées.

### Risques

- **42.1** est la plus risquée car elle touche les classes Tailwind qui pourraient être référencées dans des tests (sélecteurs `querySelector('.text-game-*')`). Vérifier les tests avant/après.
- **42.4** (conteneuriser) pourrait casser le timing des animations cinématiques de GameOverScreen/VictoryScreen (staging). Le panel doit apparaître en même temps que le contenu, pas avant.

### Fichiers impactés (estimation)

| Story | Fichiers principaux |
|-------|-------------------|
| 42.1  | `style.css`, tous les `src/ui/*.jsx`, potentiellement des fichiers test |
| 42.2  | `MainMenu.jsx` |
| 42.3  | `HUD.jsx`, `TunnelHub.jsx`, `ShipSelect.jsx` |
| 42.4  | `GameOverScreen.jsx`, `VictoryScreen.jsx`, `RevivePrompt.jsx`, `LevelUpModal.jsx`, `PlanetRewardModal.jsx` |
| 42.5  | `Crosshair.jsx`, potentiellement `GameplayScene.jsx` ou style global |
| 42.6  | `HUD.jsx`, `PauseMenu.jsx`, `LevelUpModal.jsx`, `StatLine.jsx` |
| 42.7  | `HUD.jsx` |

## Dependencies

- Epic 39 (Redshift UI Full Pass) — done
- Epic 40 (Bugfixes) — done

## Success Metrics

- Zéro occurrence de `--color-game-*` ou `font-game` dans le codebase
- Zéro occurrence de `◆` / `&#9670;` dans `src/ui/`
- Zéro `fontSize` < 9px dans `src/ui/`
- Le bouton OPTIONS est accessible depuis le menu principal
- Tous les écrans ont un panel conteneur visible
- Le crosshair disparaît et le curseur natif apparaît pendant la pause
- `vitest run` passe à 100%
