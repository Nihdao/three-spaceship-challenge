# Story 45.6: UI Font Accessibility Uplift

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want all menus, level-up screens, and in-game overlays to use larger, more readable text,
So that I can quickly understand my choices and navigate the UI without squinting.

## Acceptance Criteria

### Partie A — LevelUpModal (`src/ui/LevelUpModal.jsx`)

1. **Given** la colonne gauche "Current Build"
   **When** elle est rendue
   **Then** le titre "Current Build" passe de `fontSize: 12` à `fontSize: 14`
   **And** les labels (HP, Level, Speed, Damage Mult) `fontSize: 12` passent à `fontSize: 14`
   **And** les valeurs (Space Mono) `fontSize: 12` passent à `fontSize: 14`
   **And** la ligne "Weapons: X · Boons: Y" passe de `fontSize: 11` à `fontSize: 13`

2. **Given** le titre "LEVEL UP!" dans la colonne droite
   **When** il est rendu
   **Then** il passe de `fontSize: '2.5rem'` à `fontSize: '3.5rem'`

3. **Given** les cartes de choix dans la colonne droite
   **When** elles sont rendues
   **Then** le badge rareté passe de `fontSize: 11` à `fontSize: 13`
   **And** le shortcut `[1]` passe de `fontSize: 11` à `fontSize: 13`
   **And** la classe Tailwind `text-xs` sur le `<p>` de description est remplacée par `text-sm`
   **Note** : le `<h3>` est déjà `text-sm` dans le code actuel — aucun changement requis pour `<h3>`

4. **Given** le conteneur principal (2 colonnes)
   **When** il est rendu
   **Then** `maxWidth` passe de `860` à `980`
   **And** la colonne droite `minWidth` passe de `320` à `400`

5. **Given** les boutons REROLL et SKIP dans la colonne gauche
   **When** ils sont rendus
   **Then** `fontSize: '1rem'` est ajouté dans leur style inline (actuellement absent — le font size n'est pas défini)

### Partie B — PauseMenu (`src/ui/PauseMenu.jsx`)

6. **Given** les labels de sections (WEAPONS, BOONS, RUN STATS, PLAYER STATS) définis via `sectionTitleStyle`
   **When** ils sont rendus
   **Then** `sectionTitleStyle.fontSize: 12` passe à `14`

7. **Given** les noms et stats dans les listes weapons/boons
   **When** ils sont rendus
   **Then** `fontSize: 13` (noms Rajdhani) passe à `15`
   **And** `fontSize: 12` (stats Space Mono) passe à `14`
   **And** les dashes `—` des listes vides (`fontSize: 12`) passent à `14`

8. **Given** les boutons RESUME, QUIT et les textes du dialog de confirmation
   **When** ils sont rendus
   **Then** `fontSize: 'clamp(13px, 1.3vw, 16px)'` passe à `'clamp(14px, 1.4vw, 18px)'` sur :
   - le bouton `[ESC/R] RESUME`
   - le bouton `[Q] QUIT TO MENU`
   - le texte "Progress will be lost."
   - les boutons Confirm et Cancel du dialog

### Partie C — MainMenu (`src/ui/MainMenu.jsx`)

9. **Given** les boutons du menu principal (PLAY, UPGRADES, ARMORY, OPTIONS)
   **When** ils sont rendus
   **Then** `fontSize: "0.75rem"` dans `S.menuBtn` et `S.menuBtnSelected` passe à `"0.875rem"`
   **And** `width: "12rem"` dans `S.menuBtn` et `S.menuBtnSelected` passe à `"14rem"`

10. **Given** les labels stats en haut à droite (BEST RUN, FRAGMENTS)
    **When** ils sont rendus
    **Then** les `fontSize: "0.65rem"` passent à `"0.72rem"`
    **And** les valeurs numériques `fontSize: "1.5rem"` passent à `"1.75rem"`

11. **Given** les boutons de coin (STATS, CREDITS) via `S.cornerBtn`
    **When** ils sont rendus
    **Then** `fontSize: "0.72rem"` passe à `"0.8rem"`

12. **Given** `vitest run`
    **When** la story est implémentée
    **Then** tous les tests passent — les tests de PauseMenu vérifient des présences/absences de boutons (`data-testid`), pas les font sizes ; aucun test à modifier

## Tasks / Subtasks

- [x] Task 1 — LevelUpModal : colonne gauche font sizes (AC: 1)
  - [x] 1.1 `fontSize: 12` → `14` sur le titre "Current Build" (ligne ~162)
  - [x] 1.2 `fontSize: 12` → `14` sur les spans label ET valeur dans le `.map()` (lignes ~178, ~181)
  - [x] 1.3 `fontSize: 11` → `13` sur le `<p>` "Weapons: X · Boons: Y" (ligne ~187)

- [x] Task 2 — LevelUpModal : titre + layout (AC: 2, 4)
  - [x] 2.1 `fontSize: '2.5rem'` → `'3.5rem'` sur `<h1>` LEVEL UP! (ligne ~236)
  - [x] 2.2 `maxWidth: 860` → `980` sur le conteneur 2 colonnes (ligne ~150)
  - [x] 2.3 `minWidth: 320` → `400` sur la colonne droite (ligne ~235)

- [x] Task 3 — LevelUpModal : cartes de choix (AC: 3)
  - [x] 3.1 `fontSize: 11` → `13` sur le badge rareté `[{rarityTier.name.toUpperCase()}]` (ligne ~289)
  - [x] 3.2 `fontSize: 11` → `13` sur le shortcut `[{i+1}]` (ligne ~301)
  - [x] 3.3 `className="text-xs mt-0.5"` → `"text-sm mt-0.5"` sur le `<p>` de description (ligne ~309)

- [x] Task 4 — LevelUpModal : boutons REROLL/SKIP (AC: 5)
  - [x] 4.1 Ajouter `fontSize: '1rem'` dans le style du bouton REROLL (ligne ~200)
  - [x] 4.2 Ajouter `fontSize: '1rem'` dans le style du bouton SKIP (ligne ~220)

- [x] Task 5 — PauseMenu : section titles + inventory font sizes (AC: 6, 7)
  - [x] 5.1 `sectionTitleStyle.fontSize: 12` → `14` (ligne ~170)
  - [x] 5.2 `fontSize: 13` → `15` sur les noms armes Rajdhani (ligne ~256)
  - [x] 5.3 `fontSize: 12` → `14` sur les stats armes Space Mono (ligne ~259)
  - [x] 5.4 `fontSize: 13` → `15` sur les noms boons Rajdhani (ligne ~286)
  - [x] 5.5 `fontSize: 12` → `14` sur les stats boons Space Mono (ligne ~289)
  - [x] 5.6 `fontSize: 12` → `14` sur les dashes vides weapons et boons (lignes ~266, ~296)

- [x] Task 6 — PauseMenu : clamp font sizes (AC: 8)
  - [x] 6.1 RESUME button : `'clamp(13px, 1.3vw, 16px)'` → `'clamp(14px, 1.4vw, 18px)'` (ligne ~221)
  - [x] 6.2 QUIT button : idem (ligne ~342)
  - [x] 6.3 "Progress will be lost." `<p>` : idem (ligne ~378)
  - [x] 6.4 Confirm button : idem (ligne ~392)
  - [x] 6.5 Cancel button : idem (ligne ~403)

- [x] Task 7 — MainMenu : boutons principaux (AC: 9)
  - [x] 7.1 `S.menuBtn.fontSize: "0.75rem"` → `"0.875rem"` (ligne ~31)
  - [x] 7.2 `S.menuBtn.width: "12rem"` → `"14rem"` (ligne ~21)
  - [x] 7.3 `S.menuBtnSelected.fontSize: "0.75rem"` → `"0.875rem"` (ligne ~49)
  - [x] 7.4 `S.menuBtnSelected.width: "12rem"` → `"14rem"` (ligne ~39)

- [x] Task 8 — MainMenu : stats display + cornerBtn (AC: 10, 11)
  - [x] 8.1 BEST RUN label `fontSize: "0.65rem"` → `"0.72rem"` (ligne ~175)
  - [x] 8.2 BEST RUN value `fontSize: "1.5rem"` → `"1.75rem"` (ligne ~184)
  - [x] 8.3 FRAGMENTS label `fontSize: "0.65rem"` → `"0.72rem"` (ligne ~196)
  - [x] 8.4 FRAGMENTS value `fontSize: "1.5rem"` → `"1.75rem"` (ligne ~205)
  - [x] 8.5 `S.cornerBtn.fontSize: "0.72rem"` → `"0.8rem"` (ligne ~63)

- [x] Task 9 — Vérification finale (AC: 12)
  - [x] 9.1 `vitest run` — LevelUpModal (23 tests) + PauseMenu (23 tests) = 46 passed; 23 failures pré-existantes (weaponDefs, lootSystem, QuestTracker, useEnemies, etc.) hors scope story — note: chiffre post-implémentation complète de l'epic 45 (stories 45.1–45.5 ont corrigé certaines failures pré-existantes via enemyDefs.test.js et difficultyScaling.test.js)

## Dev Notes

### État actuel du code — LevelUpModal.jsx

**Colonne gauche (lignes ~158–231) :**
```jsx
// Titre "Current Build"
<p style={{ fontSize: 12, ... }}>Current Build</p>

// Labels/valeurs dans le .map()
<span style={{ fontSize: 12, color: 'var(--rs-text-muted)', ... }}>{label}</span>
<span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", ... }}>{value}</span>

// Ligne weapons/boons
<p style={{ fontSize: 11, color: 'var(--rs-text-dim)', ... }}>
  Weapons: {activeWeaponsCount} · Boons: {activeBoonsCount}
</p>

// Boutons REROLL/SKIP — PAS de fontSize dans le style inline
<button style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: '0.1em', ... }}>
  REROLL ({rerollCharges})
</button>
```

**Colonne droite (lignes ~234–316) :**
```jsx
// Titre principal — à modifier
<div style={{ flex: 1, minWidth: 320, paddingBottom: 16 }}>  // minWidth: 320 → 400
<h1 style={{ fontSize: '2.5rem', ... }}>LEVEL UP!</h1>       // → '3.5rem'

// Dans le .map() des cartes de choix :
// Badge rareté — à modifier
<span style={{ fontSize: 11, color: rarityTier.color, ... }}>[{rarityTier.name}]</span>  // → 13
// Shortcut — à modifier
<span style={{ fontSize: 11, color: 'var(--rs-text-dim)', ... }}>[{i + 1}]</span>        // → 13
// h3 — DÉJÀ text-sm, pas de changement
<h3 className="font-semibold text-sm" style={{ ... }}>{choice.name}</h3>
// p description — à modifier
<p className="text-xs mt-0.5" style={{ ... }}>{choice.statPreview ?? choice.description}</p>  // text-xs → text-sm
```

**Conteneur principal :**
```jsx
<div style={{ maxWidth: 860, ... }}>  // → 980
```

### État actuel du code — PauseMenu.jsx

**sectionTitleStyle (ligne ~168) :**
```js
const sectionTitleStyle = {
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 700,
  fontSize: 12,  // → 14
  letterSpacing: '0.1em',
  ...
}
```

**Inventaire weapons/boons (lignes ~243–298) :**
```jsx
// Nom arme
<span style={{ fontSize: 13, fontFamily: "'Rajdhani', sans-serif", ... }}>{info.name}</span>  // → 15
// Stats arme
<span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", ... }}>Lv{...}</span>     // → 14
// Nom boon
<span style={{ fontSize: 13, fontFamily: "'Rajdhani', sans-serif", ... }}>{info.name}</span>  // → 15
// Stats boon
<span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", ... }}>Lv{...}</span>     // → 14
// Dashes vides
<span style={{ color: 'var(--rs-text-dim)', fontSize: 12 }}>—</span>  // → 14 (×2)
```

**Boutons et dialog (tous avec clamp à modifier) :**
```jsx
// RESUME button
fontSize: 'clamp(13px, 1.3vw, 16px)'  // → 'clamp(14px, 1.4vw, 18px)'
// QUIT button
fontSize: 'clamp(13px, 1.3vw, 16px)'  // → 'clamp(14px, 1.4vw, 18px)'
// "Progress will be lost." text
fontSize: 'clamp(13px, 1.3vw, 16px)'  // → 'clamp(14px, 1.4vw, 18px)'
// Confirm button + Cancel button
fontSize: 'clamp(13px, 1.3vw, 16px)'  // → 'clamp(14px, 1.4vw, 18px)'
```

### État actuel du code — MainMenu.jsx

**Objet S (lignes ~19–68) :**
```js
const S = {
  menuBtn: {
    width: "12rem",      // → "14rem"
    fontSize: "0.75rem", // → "0.875rem"
    ...
  },
  menuBtnSelected: {
    width: "12rem",      // → "14rem"
    fontSize: "0.75rem", // → "0.875rem"
    ...
  },
  cornerBtn: {
    fontSize: "0.72rem", // → "0.8rem"
    ...
  },
}
```

**Stats display (lignes ~171–215) :**
```jsx
// BEST RUN label
<p style={{ fontSize: "0.65rem", ... }}>BEST RUN</p>   // → "0.72rem"
// BEST RUN value
<p style={{ fontSize: "1.5rem", ... }}>{highScore}</p>  // → "1.75rem"
// FRAGMENTS label
<p style={{ fontSize: "0.65rem", ... }}>FRAGMENTS</p>  // → "0.72rem"
// FRAGMENTS value
<p style={{ fontSize: "1.5rem", ... }}>{fragments}</p>  // → "1.75rem"
```

### Précisions importantes

**`<h3>` dans LevelUpModal déjà text-sm** : La ligne 308 est `<h3 className="font-semibold text-sm"` — pas de changement requis. Seul le `<p>` de description (ligne 309 : `text-xs`) doit passer à `text-sm`.

**`--rs-danger` existe** : Vérifié dans `src/style.css` ligne 169 : `--rs-danger: #ef233c;` — la variable est disponible (utilisée dans cette story pour la story 45.7 suivante mais confirmée ici).

**Boutons REROLL/SKIP** : Aucun `fontSize` n'est défini dans leur style inline. `fontSize: '1rem'` doit être **ajouté** (pas modifié). L'AC 5 s'applique uniquement si `rerollCharges > 0` / `skipCharges > 0` (les boutons sont conditionnellement rendus).

**Bouton BANISH (X) exclu de l'AC 5** : L'Epic AC 5 mentionne "REROLL / SKIP / BANISH" mais le bouton BANISH est architecturalement différent — c'est un petit overlay 24×24px positionné en `absolute -top-2 -right-2` sur chaque carte (lignes ~264-281), pas un bouton d'action pleine-largeur dans la colonne gauche. Il utilise intentionnellement `text-xs font-bold` (12px) pour rester compact et non-intrusif. L'appliquer à `1rem` (16px) dépasserait le conteneur 24px. La réduction de scope de l'Epic AC 5 à "REROLL et SKIP uniquement" est donc justifiée par la contrainte de layout.

**PauseMenu — clamp occurrences** : Il y a exactement 5 occurrences de `'clamp(13px, 1.3vw, 16px)'` dans PauseMenu.jsx. Toutes doivent être mises à jour. Vérifier avec grep avant de modifier pour ne pas en manquer :
```
grep -n "clamp(13px" src/ui/PauseMenu.jsx
```

**Aucun design token global à modifier** : Les changements sont purement localisés dans les 3 fichiers concernés. Pas de `style.css` à toucher, pas de fichier de thème partagé.

**Tests PauseMenu** : Les tests utilisent `data-testid` pour cibler les éléments (`data-testid="pause-overlay"`, `data-testid="resume-button"`, `data-testid="quit-button"`, `data-testid="confirm-quit-button"`, `data-testid="cancel-quit-button"`). Aucun test ne vérifie les valeurs fontSize. Les tests restent intacts.

**`text-xs` dans LevelUpModal** : La classe `text-xs` (12px) apparaît aussi sur les hints clavier en bas (`className="text-xs opacity-40 animate-fade-in"`) et sur les labels REROLL/SKIP (`<span className="block text-xs font-normal mt-0.5 opacity-50">R</span>`). Ces `text-xs` ne sont **pas** ciblés par la story — uniquement le `<p className="text-xs mt-0.5">` de description des cartes.

### Project Structure Notes

- **Couche UI** : Cette story touche exclusivement la couche UI (6th layer) — `LevelUpModal.jsx`, `PauseMenu.jsx`, `MainMenu.jsx`.
- Aucune logique game, aucun store, aucun système n'est modifié.
- Les 3 fichiers sont dans `src/ui/` — structure simple, pas de sous-composants à créer.
- Conventions : styles inline avec objets JS pour les px, classes Tailwind pour layout/utilitaire. Les deux patterns coexistent dans ces fichiers.
- `Rajdhani` = font display/titres. `Space Mono` = font monospace/valeurs. `Bebas Neue` = font titre principal (LEVEL UP!, PAUSED). Ne pas changer les familles de polices.

### Previous Story Intelligence (45.5)

- La story 45.5 (nebula) était la story précédente. Aucun impact sur les composants UI de cette story.
- Pattern établi dans cette série : changements déclaratifs, grep avant de modifier pour localiser les occurrences exactes, `vitest run` en fin de story pour validation.
- Aucun test cassé dans les 4 premières stories de l'epic 45 — le pattern est solide.

### References

- Epic 45 story 45.6 requirements: [Source: _bmad-output/planning-artifacts/epic-45-player-experience-polish.md#Story-45.6]
- LevelUpModal current code: [Source: src/ui/LevelUpModal.jsx:143-329]
- PauseMenu current code: [Source: src/ui/PauseMenu.jsx:168-415]
- MainMenu current code: [Source: src/ui/MainMenu.jsx:19-68, 171-215]
- `--rs-danger` CSS variable: [Source: src/style.css:169]
- Architecture: 6-layer system, cette story = couche UI uniquement [MEMORY.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- LevelUpModal: 9 font-size changes + 2 layout changes (maxWidth 860→980, minWidth 320→400) + 2 fontSize additions (REROLL/SKIP buttons) + 2 className changes (text-xs→text-sm on description `<p>` + Lv/NEW badge span)
- PauseMenu: sectionTitleStyle 12→14; weapon/boon names 13→15; weapon/boon stats 12→14; empty dashes 12→14; 5 clamp occurrences updated via replace_all
- MainMenu: menuBtn/menuBtnSelected width 12rem→14rem + fontSize 0.75rem→0.875rem; cornerBtn 0.72rem→0.8rem; stats labels 0.65rem→0.72rem; stats values 1.5rem→1.75rem
- Tests: 46 tests LevelUpModal+PauseMenu passent sans régression; 41 failures pré-existantes sans lien avec les fichiers modifiés

### File List

- src/ui/LevelUpModal.jsx
- src/ui/PauseMenu.jsx
- src/ui/MainMenu.jsx

## Change Log

- 2026-02-27: Font accessibility uplift across LevelUpModal, PauseMenu, MainMenu — font sizes increased throughout, layout widened in LevelUpModal (Date: 2026-02-27)
- 2026-02-27: Code review fix — Lv/NEW badge `text-xs` → `text-sm` in LevelUpModal card header row for consistency with adjacent 13px rarity badge and shortcut; updated task 9.1 failure count (41→23, post-epic-45 state); added BANISH button exclusion justification in Dev Notes
