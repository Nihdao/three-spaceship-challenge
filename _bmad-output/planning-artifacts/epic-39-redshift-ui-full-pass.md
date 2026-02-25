# Epic 39: Redshift UI — Full Design System Pass

Appliquer le Redshift Design System de manière cohérente sur **l'ensemble des composants UI** du jeu. L'Epic 33 a posé les bases (icônes SVG, PauseMenu, Armory, LevelUpModal layout) et `CreditsModal` sert de référence parfaite. Cette épic complète la migration sur tous les écrans restants.

## Epic Goals

- Éliminer tous les **anti-patterns** encore présents : `textShadow magenta`, `#cc66ff` hardcodé, `rounded-*` sur les éléments UI, `scale(1.05)` hover, `backdrop-blur`, `boxShadow` décoratif
- Aligner **PlanetRewardModal** sur la structure de `LevelUpModal` (incohérence majeure signalée)
- Appliquer la **typographie correcte** partout : Bebas Neue (titres 2.5rem+), Rajdhani (corps), Space Mono (labels)
- Ajouter la **ligne accent orange 32×2px** sous chaque titre de modal/écran principal
- Remplacer tous les `border-radius` par des **clip-path angulaires** (16px modals, 10px panels, 8px boutons)
- Standardiser les **overlays** à `rgba(13,11,20,0.88)` sans backdrop-filter

## Epic Context

`CreditsModal.jsx` est le composant de référence — patron `S`, clip-path, Bebas Neue + accent orange, hover `translateX(4px)`, overlay correct, `var(--rs-*)` partout. Tous les autres composants doivent converger vers ce standard.

Les composants déjà conformes (ne pas toucher) : `CreditsModal`, `PauseMenu` (corps principal), `CompanionDialogue`, `QuestTracker`, `MapOverlay`.

### Anti-patterns à traquer dans chaque story

1. `textShadow: '0 0 Xpx rgba(255, 0, 255, ...)'` → supprimer
2. `color: '#cc66ff'` hardcodé → `var(--rs-violet)`
3. `border: '1px solid rgba(255,255,255,0.1)'` → `var(--rs-border)`
4. `rounded-*` / `borderRadius` → clip-path angulaire (coin haut-droite)
5. `scale(1.05)` / `hover:scale-105` → `translateX(4px)` + `borderColor: var(--rs-orange)`
6. `bg-black/60` overlay → `rgba(13,11,20,0.88)`
7. `backdrop-blur-sm` → supprimer, fond opaque `var(--rs-bg-surface)`
8. `boxShadow: '0 0 Xpx ...'` décoratif → supprimer sauf boss/danger
9. `border-game-accent` (magenta) → `var(--rs-orange)`
10. Titres sans Bebas Neue et sans ligne accent orange 32×2px

---

## Stories

### Story 39.1 — MainMenu full Redshift pass

As a player,
I want the main menu to reflect the Redshift design identity,
So that the first screen seen matches the visual quality of the rest of the game.

**Acceptance Criteria:**

**Given** le composant `MainMenu.jsx`
**When** le joueur est sur l'écran principal
**Then** le titre "REDSHIFT SURVIVOR" utilise Bebas Neue, `clamp(3rem, 8vw, 6rem)`, `letterSpacing: '0.12em'`, couleur `var(--rs-text)`, **sans** textShadow magenta
**And** une ligne accent orange 32×2px apparaît sous le titre
**And** les 4 boutons de menu utilisent clip-path 8px + `border-left: 3px solid var(--rs-orange)` + hover `translateX(4px)` + borderColor → `var(--rs-orange)` (pattern identique à CreditsModal back button, étendu)
**And** les boutons n'utilisent plus `scale-105` ni `rounded`
**And** les labels "BEST RUN" et "FRAGMENTS" en haut-droite utilisent Space Mono 0.65rem UPPERCASE `var(--rs-text-muted)` pour les labels, Bebas Neue ou Rajdhani bold pour les valeurs
**And** `#cc66ff` est remplacé par `var(--rs-violet)` partout dans ce fichier
**And** les boutons STATS et CREDITS en bas-gauche utilisent clip-path 8px + hover translateX (pas de `rounded`)

**Given** `vitest run`
**When** la story est implémentée
**Then** tous les tests `MainMenu.test.jsx` passent sans modification

---

### Story 39.2 — PlanetRewardModal — alignement structurel sur LevelUpModal

As a player,
I want the planet reward screen to feel consistent with the level-up screen,
So that both reward moments have the same visual identity and weight.

**Acceptance Criteria:**

**Given** le composant `PlanetRewardModal.jsx`
**When** une planète est scannée et une récompense est présentée
**Then** l'overlay utilise `rgba(13,11,20,0.88)` (pas `bg-black/60`)
**And** le layout adopte **2 colonnes** : colonne gauche "Scan Info" (type planète, tier, couleur thématique), colonne droite cards verticales — comme LevelUpModal
**And** le titre "PLANET SCANNED!" utilise Bebas Neue 2.5rem + `letterSpacing: '0.15em'` + ligne accent de la couleur `tierColor` (32×2px) — justifié narrativement (chaque tier a sa couleur)
**And** les cards utilisent clip-path 10px + `var(--rs-bg-raised)` + `borderLeft: 3px solid rarityTier.color` (comme LevelUpModal)
**And** les cards n'ont plus de `boxShadow` décoratif ni de `borderWidth: 2px` avec hex hardcodé
**And** le badge rareté en haut des cards utilise clip-path 4px au lieu de `rounded` + fond `rarityTier.color`
**And** hover cards : `borderColor → var(--rs-border-hot)`, pas de `scale`
**And** les touches `[1-3]` s'affichent en Space Mono `var(--rs-text-dim)` en bas-droite de chaque card

**Given** `vitest run`
**When** la story est implémentée
**Then** tous les tests existants passent

---

### Story 39.3 — TunnelHub Redshift pass

As a player,
I want the wormhole tunnel screen to use the full Redshift design language,
So that this critical transition moment feels as polished as the rest of the game.

**Acceptance Criteria:**

**Given** le composant `TunnelHub.jsx`
**When** le joueur est dans le tunnel entre deux systèmes
**Then** le panel droit utilise `var(--rs-bg-surface)` (pas `bg-[#0a0a0f]/90`) + `border-left: 1px solid var(--rs-border)` (pas `border-game-border`)
**And** le titre "WORMHOLE TUNNEL" utilise Bebas Neue + ligne accent orange 32×2px
**And** le label "ENTERING SYSTEM X" utilise Space Mono 0.65rem UPPERCASE `var(--rs-text-muted)`
**And** `#cc66ff` (diamant fragments) → `var(--rs-violet)`
**And** `#ff9944` (dilemme) → `var(--rs-orange)`
**And** la card dilemme utilise clip-path 10px + `var(--rs-border-hot)` + fond `rgba(255,79,31,0.05)` — pas de `rounded-lg` ni de `border-[#ff9944]/60`
**And** le `&#9888;` (⚠) est remplacé par un SVG inline (triangle warning 12×12)
**And** les boutons Accept/Refuse du dilemme utilisent clip-path 8px + hover `translateX(4px)` — pas de `rounded`
**And** les upgrade buttons utilisent clip-path 8px + hover translateX + `var(--rs-orange)` pour `canAfford` — pas de `border-game-accent rounded`
**And** le bouton "ENTER SYSTEM →" utilise clip-path 8px + hover translateX + `var(--rs-teal)` (navigation = teal)
**And** `border-game-success` → `var(--rs-success)`

**Given** `vitest run`
**When** la story est implémentée
**Then** tous les tests `tunnelHub.integration.test.js` passent

---

### Story 39.4 — RevivePrompt + OptionsModal Redshift pass

As a player,
I want the revive prompt and options screen to match the Redshift design system,
So that even rare/menu screens maintain visual consistency.

**Acceptance Criteria — RevivePrompt:**

**Given** `RevivePrompt.jsx`
**When** le joueur est mort avec des charges de revival
**Then** l'overlay utilise `rgba(13,11,20,0.88)` (pas `bg-black/60`)
**And** le titre "REVIVE?" utilise Bebas Neue 2.5rem + ligne accent orange 32×2px
**And** le bouton REVIVE utilise clip-path 8px + `border: 1px solid var(--rs-teal)` + `color: var(--rs-teal)` + hover `translateX(4px)` — pas de `rounded-lg border-2 border-game-accent`
**And** le bouton GAME OVER utilise clip-path 8px + `border: 1px solid var(--rs-border)` + hover translateX + border → `var(--rs-danger)`
**And** `bg-game-bg-medium` → `var(--rs-bg-raised)`

**Acceptance Criteria — OptionsModal:**

**Given** `OptionsModal.jsx`
**When** la modale options est ouverte
**Then** l'overlay utilise `rgba(13,11,20,0.88)` (pas `bg-black/60`)
**And** la modal utilise `var(--rs-bg-surface)` + clip-path 16px + `var(--rs-border)` — pas de `bg-[#0a0a0f] border-2 border-game-primary rounded-lg`
**And** le titre "OPTIONS" utilise Bebas Neue 2.5rem + ligne accent orange 32×2px
**And** les labels des sliders volume utilisent Space Mono 0.65rem UPPERCASE `var(--rs-text-muted)`
**And** le bouton CLEAR LOCAL SAVE utilise clip-path 8px + `var(--rs-danger)` — pas de `rounded`
**And** le bouton [ESC] BACK utilise clip-path 8px + hover translateX + `var(--rs-orange)` (pattern CreditsModal)
**And** la boite de confirmation utilise clip-path 10px + `var(--rs-bg-surface)` + `var(--rs-border)` — pas de `rounded-lg bg-[#0a0a0f]`
**And** les boutons CANCEL/CLEAR DATA de la confirmation utilisent clip-path 8px

**Given** `vitest run`
**When** la story est implémentée
**Then** tous les tests existants passent

---

### Story 39.5 — ShipSelect full Redshift pass

As a player,
I want the ship selection screen to fully adopt the Redshift design language,
So that this key pre-game moment feels premium and cohesive.

**Acceptance Criteria:**

**Given** `ShipSelect.jsx`
**When** le joueur est sur l'écran de sélection de vaisseau
**Then** le titre "SELECT YOUR SHIP" utilise Bebas Neue + ligne accent orange 32×2px — sans `textShadow`
**And** les cards vaisseaux dans la grille utilisent clip-path 8px + `var(--rs-bg-raised)` — pas de `rounded-lg`
**And** la sélection active utilise `borderColor: var(--rs-orange)` — pas de `border-game-accent ring-1 ring-game-accent/40`
**And** le panel détail droit utilise `var(--rs-bg-surface)` + clip-path 16px + `var(--rs-border)` — sans `rounded-lg backdrop-blur-sm`
**And** le nom du vaisseau utilise Bebas Neue — sans `textShadow`
**And** le badge niveau (LV.X / MAX) utilise clip-path 4px — pas de `rounded`
**And** `#cc66ff` (coût level up) → `var(--rs-violet)`
**And** le badge "★ MAX LEVEL" utilise `var(--rs-gold)` — pas de `text-yellow-400`
**And** le bouton LEVEL UP : clip-path 8px + `var(--rs-teal)` si affordable, hover translateX — pas de `border-cyan-400/60 rounded-lg hover:scale-105`
**And** le bouton SELECT : clip-path 8px + `var(--rs-orange)` — pas de `border-game-accent rounded-lg hover:scale-105`
**And** le bouton ← BACK : clip-path 8px + hover translateX — pas de texte brut sans style
**And** les boutons skins (petits ronds de couleur) conservent leur forme circulaire (exception justifiée — représentent des couleurs)
**And** hover sur toutes les cards et boutons : `translateX(4px)`, jamais `scale`

**Given** `vitest run`
**When** la story est implémentée
**Then** tous les tests existants passent

---

### Story 39.6 — GalaxyChoice full Redshift pass

As a player,
I want the galaxy selection screen to match the Redshift design language,
So that this second pre-game screen feels consistent with ship selection.

**Acceptance Criteria:**

**Given** `GalaxyChoice.jsx`
**When** le joueur choisit une galaxie
**Then** le titre "SELECT GALAXY" utilise Bebas Neue + ligne accent orange 32×2px — sans `textShadow`
**And** les cards galaxie utilisent clip-path 8px + `var(--rs-bg-raised)` — pas de `rounded-lg`
**And** la sélection active utilise `borderColor: var(--rs-orange)` + `borderLeft: 3px solid galaxy.colorTheme` — pas de `border-game-accent/70 ring-1`
**And** l'accent coloré de la galaxie (remplace le `w-2 h-10 rounded-full`) devient `borderLeft: 3px solid galaxy.colorTheme` sur la card — cohérent avec le pattern accent du DS
**And** le panel détail droit utilise `var(--rs-bg-surface)` + clip-path 16px + `var(--rs-border)` — sans `rounded-lg backdrop-blur-sm`
**And** aucun `boxShadow` décoratif sur le panel ni les cards (`0 0 16px/24px`)
**And** aucun `textShadow` sur le nom de galaxie
**And** le bouton TRAVEL utilise clip-path 8px + `color: galaxy.colorTheme` + `border: 1px solid galaxy.colorTheme` + hover `translateX(4px)` — pas de `hover:scale-[1.02]`
**And** le bouton ← BACK utilise clip-path 8px + hover translateX

**Given** `vitest run`
**When** la story est implémentée
**Then** tous les tests `GalaxyChoice.test.jsx` passent

---

### Story 39.7 — GameOverScreen + VictoryScreen Redshift pass

As a player,
I want the game over and victory screens to use strong Redshift typography and button styles,
So that both ending moments feel dramatic and visually consistent.

**Acceptance Criteria — communes aux deux écrans:**

**Given** `GameOverScreen.jsx` et `VictoryScreen.jsx`
**When** la séquence cinématique se déroule
**Then** le fond opaque utilise `var(--rs-bg)` (#0d0b14) — pas `bg-black` pur
**And** le message principal (taunt / victory) utilise Bebas Neue + `clamp(3rem, 8vw, 5rem)` + `letterSpacing: '0.15em'`
**And** "NEW HIGH SCORE!" utilise `var(--rs-gold)` + animation pulse (justifiée narrativement) — pas `text-game-accent`
**And** les boutons d'action ([R] RETRY, [M] MENU etc.) utilisent clip-path 8px + hover `translateX(4px)` + `borderColor → var(--rs-orange)` — pas de `rounded hover:scale-105`
**And** aucun `bg-game-accent/10` sur hover — le pattern est translateX + border color change

**Given** `vitest run`
**When** la story est implémentée
**Then** `GameOverScreen.test.jsx` et `VictoryScreen.test.jsx` passent

---

### Story 39.8 — StatsScreen + XPBarFullWidth Redshift pass

As a player,
I want the stats screen to display with Redshift styling and the XP bar to use the correct semantic color,
So that XP (violet = magic/progression) and career stats feel premium.

**Acceptance Criteria — StatsScreen:**

**Given** `StatsScreen.jsx`
**When** le joueur consulte ses statistiques de carrière
**Then** le titre "CAREER STATISTICS" utilise Bebas Neue + ligne accent orange 32×2px — sans `textShadow`
**And** `StatCard` utilise clip-path 8px + `var(--rs-bg-raised)` — pas de `rounded-lg bg-white/[0.05] backdrop-blur-sm`
**And** les panels "TOP WEAPONS" / "TOP BOONS" utilisent clip-path 8px + `var(--rs-bg-raised)` — pas de `rounded-lg backdrop-blur-sm`
**And** les labels de section ("CAREER", "BEST RUN", "FAVORITES") utilisent Space Mono 0.65rem UPPERCASE `var(--rs-text-muted)` — stylés avec `const S`
**And** le bouton ← BACK utilise clip-path 8px + hover translateX

**Acceptance Criteria — XPBarFullWidth:**

**Given** `XPBarFullWidth.jsx`
**When** la barre XP est visible en haut de l'écran
**Then** la couleur principale du fill est `var(--rs-violet)` (XP = niveau/magie dans le DS) — pas `#10B981` (vert)
**And** le gradient est `linear-gradient(90deg, var(--rs-violet), #7b3fe4)` en état normal
**And** lors du flash level-up, le fill devient `linear-gradient(90deg, var(--rs-text), var(--rs-violet))`
**And** quand `pulse` (>80%), le `boxShadow` utilise `rgba(155, 93, 229, 0.6)` (violet) — justifié narrativement (presque level up)
**And** la track de fond utilise `rgba(0,0,0,0.4)` — pas `bg-black/30`

**Given** `vitest run`
**When** la story est implémentée
**Then** `StatsScreen.test.jsx` et `XPBarFullWidth.test.jsx` passent

---

### Story 39.9 — Polish pass : HUD, LevelUpModal, UpgradesScreen, Armory, StatLine, PauseMenu quit dialog

As a developer,
I want all remaining minor deviations from the Redshift design system corrected,
So that no component retains anti-patterns from before the design system was established.

**Acceptance Criteria — HUD.jsx:**

**Given** `HUD.jsx`
**When** le HUD est affiché en jeu
**Then** les `BoonSlots` n'utilisent plus de couleur magenta (`rgba(255, 20, 147, ...)`) — remplacé par `var(--rs-violet)` (boons = magie/espace)
**And** les `WeaponSlots` n'ont plus de `borderRadius: '4px'` — supprimé (ou `0`)
**And** les `BoonSlots` n'ont plus de `borderRadius: '8px'` — supprimé
**And** l'indicateur dash (bas-droite) n'utilise plus `rounded-full` ni `border rounded-full` — remplacé par clip-path 8px carré
**And** `MINIMAP.boundaryBorder: '1px solid rgba(255,255,255,0.1)'` → `var(--rs-border)`
**And** `MINIMAP.playerDotColor: '#00ffcc'` → `var(--rs-teal)` (const référencée dans les styles)
**And** `banishCharges` icon `'✕'` string → SVG inline (croix 12×12)

**Acceptance Criteria — LevelUpModal.jsx:**

**Given** `LevelUpModal.jsx`
**When** le modal de level up est affiché
**Then** l'overlay utilise `rgba(13,11,20,0.88)` (pas `bg-black/60`)
**And** le titre "LEVEL UP!" utilise Bebas Neue + ligne accent orange 32×2px
**And** les cards utilisent clip-path 10px + `var(--rs-bg-raised)` — pas de `bg-game-bg-medium rounded-lg`
**And** le bouton banish (X) utilise clip-path 4px + `var(--rs-danger)` — pas de `rounded-full #ff3366`
**And** les boutons REROLL et SKIP utilisent clip-path 8px — pas de `rounded-lg`

**Acceptance Criteria — UpgradesScreen.jsx:**

**Given** `UpgradesScreen.jsx`
**When** l'écran d'upgrades permanents est affiché
**Then** chaque `UpgradeCard` utilise clip-path 8px — pas de `border rounded-lg`
**And** le bouton achat interne à la card utilise clip-path 4px — pas de `rounded border`

**Acceptance Criteria — Armory.jsx:**

**Given** `Armory.jsx`
**When** l'armurerie est affichée
**Then** chaque `WeaponCard` et `BoonCard` utilise clip-path 8px — pas de `rounded-lg`

**Acceptance Criteria — StatLine.jsx:**

**Given** `src/ui/primitives/StatLine.jsx`
**When** un bonus est affiché
**Then** le badge bonus utilise `color: var(--rs-success)` + `backgroundColor: rgba(45,198,83,0.1)` — pas `text-green-400 bg-green-400/10`

**Acceptance Criteria — PauseMenu.jsx (quit dialog):**

**Given** `PauseMenu.jsx` — uniquement la Quit Confirmation Dialog
**When** le joueur clique QUIT
**Then** la dialog utilise `var(--rs-bg-surface)` + clip-path 10px + `var(--rs-border)` — pas `var(--color-game-bg) rounded-lg`
**And** les variables `var(--color-game-*)` sont remplacées par leurs équivalents `var(--rs-*)`
**And** les boutons Confirm/Cancel utilisent clip-path 8px — pas de `rounded`

**Given** `vitest run`
**When** la story est implémentée
**Then** tous les tests affectés passent sans modification (les tests n'inspectent pas les styles inline)

---

## Dev Notes

### Règle du coin coupé

Le coin coupé est **toujours en haut-droite**. Tailles standard :
- Modal pleine (480px+) : `polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)`
- Panel/card intermédiaire : `polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)`
- Bouton/petit élément : `polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)`

### Pattern hover bouton (reference CreditsModal)

```jsx
onMouseEnter={(e) => {
  e.currentTarget.style.borderColor = 'var(--rs-orange)';
  e.currentTarget.style.color = 'var(--rs-text)';
  e.currentTarget.style.transform = 'translateX(4px)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.borderColor = 'var(--rs-border)';
  e.currentTarget.style.color = 'var(--rs-text-muted)';
  e.currentTarget.style.transform = 'translateX(0)';
}}
```

### Pattern titre de modal (reference CreditsModal)

```jsx
<h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', letterSpacing: '0.15em', color: 'var(--rs-text)', margin: 0 }}>
  TITRE
</h2>
<div style={{ width: '32px', height: '2px', background: 'var(--rs-orange)', marginTop: '6px' }} />
```

### Fichier de référence

`src/ui/modals/CreditsModal.jsx` — lire ce fichier avant chaque story pour les patterns définitifs.

### Composants déjà conformes — ne pas modifier

- `src/ui/modals/CreditsModal.jsx`
- `src/ui/PauseMenu.jsx` (corps principal — seulement la quit dialog dans 39.9)
- `src/ui/CompanionDialogue.jsx`
- `src/ui/QuestTracker.jsx`
- `src/ui/MapOverlay.jsx`
- `src/ui/primitives/RectangularHPBar.jsx`
- `src/ui/BossHPBar.jsx`
- `src/ui/SystemNameBanner.jsx`

### Tests

Les tests existants n'inspectent généralement pas les styles inline ni les classes CSS. Les ACs de chaque story précisent les tests à faire passer. Aucun nouveau test à écrire pour des changements purement visuels — les comportements (clicks, keyboard, store updates) sont déjà couverts.
