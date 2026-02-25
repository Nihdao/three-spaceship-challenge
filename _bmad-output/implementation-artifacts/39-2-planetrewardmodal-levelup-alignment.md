# Story 39.2: PlanetRewardModal — alignement structurel sur LevelUpModal

Status: done

## Story

As a player,
I want the planet reward screen to feel consistent with the level-up screen,
So that both reward moments have the same visual identity and weight.

## Acceptance Criteria

1. **Given** `PlanetRewardModal.jsx` **When** une planète est scannée et une récompense est présentée **Then** l'overlay utilise `rgba(13,11,20,0.88)` — pas `bg-black/60`.

2. **And** le layout adopte **2 colonnes** : colonne gauche "Scan Info" (type planète, tier, couleur thématique), colonne droite cards verticales — comme LevelUpModal.

3. **And** le titre "PLANET SCANNED!" utilise Bebas Neue 2.5rem + `letterSpacing: '0.15em'` + ligne accent de la couleur `tierColor` (32×2px) — justifié narrativement (chaque tier a sa couleur).

4. **And** les cards utilisent clip-path 10px + `var(--rs-bg-raised)` + `borderLeft: 3px solid rarityTier.color` — comme LevelUpModal.

5. **And** les cards n'ont plus de `boxShadow` décoratif ni de `borderWidth: 2px` avec hex hardcodé.

6. **And** le badge rareté en haut des cards utilise clip-path 4px au lieu de `rounded` + fond `rarityTier.color`.

7. **And** hover cards : `borderColor → var(--rs-border-hot)`, pas de `scale`.

8. **And** les touches `[1-3]` s'affichent en Space Mono `var(--rs-text-dim)` en bas-droite de chaque card.

9. **Given** `vitest run` **When** la story est implémentée **Then** tous les tests existants passent.

## Tasks / Subtasks

- [x] Task 1 — Corriger l'overlay (AC: #1)
  - [x] Remplacer `className="fixed inset-0 z-50 ... bg-black/60 font-game"` par `style={{ ... background: 'rgba(13,11,20,0.88)' }}` en inline pur
  - [x] Conserver `position: 'fixed'`, `inset: 0`, `zIndex: 50`, `display: 'flex'`, `alignItems: 'center'`, `justifyContent: 'center'`

- [x] Task 2 — Restructurer en layout 2 colonnes (AC: #2)
  - [x] Envelopper le contenu dans un conteneur flex avec `gap: 24`, `alignItems: 'flex-start'`, `maxWidth: 720`, `padding: '0 16px'` (même que LevelUpModal)
  - [x] Créer colonne gauche `width: 200, flexShrink: 0` avec section "SCAN INFO" :
    - Label "SCAN INFO" : Space Mono 0.65rem uppercase `var(--rs-text-muted)`, `marginBottom: 12`
    - Pill tier : Bebas Neue 0.9rem, couleur `tierColor`, fond `${tierColor}18` (10% opacity), clip-path 4px, padding `4px 10px`
    - Label "TIER" : Space Mono 0.6rem uppercase `var(--rs-text-dim)`, `marginTop: 8`
    - Valeur tier (Standard / Rare / Legendary) : Rajdhani bold 0.9rem, couleur `tierColor`
    - Optionnel : ligne de séparation `borderTop: '1px solid var(--rs-border)', margin: '12px 0'`
    - Flavor text (1 ligne) selon tier — voir Dev Notes
  - [x] Créer colonne droite `flex: 1, minWidth: 280` contenant le titre + les cards

- [x] Task 3 — Corriger le titre (AC: #3)
  - [x] Remplacer le `<h1 className="text-3xl font-bold tracking-widest text-game-text ...">` par styles inline complets :
    ```jsx
    <h1 style={{
      fontFamily: 'Bebas Neue, sans-serif',
      fontSize: '2.5rem',
      letterSpacing: '0.15em',
      color: 'var(--rs-text)',
      margin: 0,
      lineHeight: 1,
    }}>PLANET SCANNED!</h1>
    ```
  - [x] Ajouter la div accent en couleur `tierColor` juste après le h1 :
    ```jsx
    <div style={{ width: '32px', height: '2px', background: tierColor, marginTop: '6px', marginBottom: '20px' }} />
    ```
  - [x] Supprimer le `<p>` de sous-titre `tierLabel Planet Reward` qui est redondant avec la colonne gauche (ou le déplacer dans la colonne gauche si souhaité)

- [x] Task 4 — Corriger les cards (AC: #4, #5)
  - [x] Remplacer les classes `bg-game-bg-medium rounded-lg` par `background: 'var(--rs-bg-raised)'` + `clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)'`
  - [x] Remplacer `borderWidth: '2px', borderStyle: 'solid', borderColor: ...` par `borderLeft: \`3px solid ${rarityTier.color}\`` uniquement — supprimer le `borderColor` multi-côté
  - [x] Supprimer entièrement `boxShadow` de chaque card
  - [x] Layout des cards : `display: 'flex', flexDirection: 'column', gap: 12` (identique à LevelUpModal)
  - [x] Chaque card : `position: 'relative', padding: 12, cursor: 'pointer'`

- [x] Task 5 — Corriger le badge rareté (AC: #6)
  - [x] Remplacer `className="px-2 py-0.5 text-xs font-bold rounded"` par styles inline :
    ```jsx
    style={{
      display: 'inline-block',
      padding: '2px 8px',
      fontSize: 11,
      fontFamily: "'Rajdhani', sans-serif",
      fontWeight: 700,
      color: '#000',
      backgroundColor: rarityTier.color,
      clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
    }}
    ```

- [x] Task 6 — Corriger le hover des cards (AC: #7)
  - [x] Ajouter `onMouseEnter` / `onMouseLeave` inline sur chaque card div :
    ```jsx
    onMouseEnter={(e) => {
      playSFX('button-hover')
      e.currentTarget.style.borderColor = 'var(--rs-border-hot)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = rarityTier.color
    }}
    ```
  - [x] Supprimer `hover:cursor-pointer transition-all` Tailwind (garder `cursor: 'pointer'` inline)
  - [x] S'assurer qu'aucun `scale` ou `transform` n'est appliqué au hover

- [x] Task 7 — Corriger l'affichage des touches [1-3] (AC: #8)
  - [x] Déplacer le `<span>[{i + 1}]</span>` en bas-droite de chaque card via `marginLeft: 'auto'` ou `position: 'absolute', bottom: 8, right: 8`
  - [x] Appliquer les styles : `fontFamily: "'Space Mono', monospace"`, `fontSize: 10`, `color: 'var(--rs-text-dim)'`
  - [x] Conserver le rendu `[1]`, `[2]`, `[3]` pour les 3 choix uniquement

- [x] Task 8 — Vérifier la variable `--rs-border-hot` (prérequis)
  - [x] Vérifier que `--rs-border-hot` est défini dans `src/style.css` — si absent, l'ajouter : `--rs-border-hot: rgba(255,79,31,0.6)` (orange ds à 60%)

- [x] Task 9 — Centraliser les styles avec `const S` (bonne pratique)
  - [x] Déclarer un objet `const S = { overlay, container, leftCol, sectionLabel, tierPill, rightCol, titleAccent, card, rarityBadge, shortcutKey }` en haut du composant, après les constantes TIER_COLORS / TIER_LABELS

- [x] Task 10 — Tests (AC: #9)
  - [x] `vitest run` → tous les tests passent (aucun test n'inspecte les styles inline de PlanetRewardModal)
  - [x] Vérification visuelle : aucun `bg-black/60`, aucun `rounded`, aucun `boxShadow` décoratif, aucun `scale` au hover

## Dev Notes

### Fichier à modifier

Un seul fichier : `src/ui/PlanetRewardModal.jsx`

Vérification préalable dans `src/style.css` pour la variable `--rs-border-hot`.

### Fichiers de référence OBLIGATOIRES

1. **`src/ui/modals/CreditsModal.jsx`** — patron DS complet : `const S`, overlay, titre + accent, clip-path, hover translateX, `var(--rs-*)` partout
2. **`src/ui/LevelUpModal.jsx`** — patron layout 2 colonnes à reproduire dans PlanetRewardModal (colonne gauche = Context Info, colonne droite = titre + cards verticales)

### Anti-patterns actuels dans PlanetRewardModal.jsx (avec lignes)

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 79 | `bg-black/60` Tailwind overlay | `background: 'rgba(13,11,20,0.88)'` inline |
| 79 | Pas de 2 colonnes — layout flat | Restructurer en `{ display: 'flex', gap: 24 }` avec col gauche + col droite |
| 80-85 | `text-3xl font-bold tracking-widest text-game-text` + color inline | Bebas Neue 2.5rem + letterSpacing 0.15em inline + div accent tierColor |
| 86 | `<p className="text-game-text-muted text-sm mb-8">` sous-titre | Supprimer ou déplacer en col gauche |
| 87 | `className="flex gap-4"` — cards horizontales | Flex column dans col droite |
| 96 | `bg-game-bg-medium rounded-lg` | `var(--rs-bg-raised)` + clip-path 10px |
| 97 | `transition-all` Tailwind sur card | Supprimer, gérer via onMouseEnter/Leave |
| 101-104 | `borderWidth: 2px`, `borderColor: hex` multi-côté + `boxShadow` | `borderLeft: 3px solid rarityTier.color` uniquement, pas de boxShadow |
| 107 | `onMouseEnter={() => playSFX('button-hover')` sans style | Ajouter `borderColor: 'var(--rs-border-hot)'` au hover |
| 112-116 | `className="... rounded"` badge rareté | clip-path 4px inline |
| 132 | `<span className="text-game-text-muted text-xs mt-2 block">` | Space Mono `var(--rs-text-dim)` position bas-droite |

### Structure attendue : colonne gauche "Scan Info"

```jsx
{/* ── Colonne gauche : Scan Info ── */}
<div style={{ width: 200, flexShrink: 0 }}>
  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--rs-text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
    Scan Info
  </p>

  {/* Pill tier coloré */}
  <div style={{ display: 'inline-block', padding: '4px 10px', fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.9rem', color: tierColor, backgroundColor: `${tierColor}18`, clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100)', letterSpacing: '0.1em' }}>
    {tierLabel}
  </div>

  <div style={{ borderTop: '1px solid var(--rs-border)', margin: '12px 0' }} />

  {/* Flavor text selon tier */}
  <p style={{ fontSize: 10, color: 'var(--rs-text-dim)', fontFamily: "'Space Mono', monospace", lineHeight: 1.5 }}>
    {TIER_FLAVOR[rewardTier]}
  </p>
</div>
```

**Flavor text à définir en constante :**
```js
const TIER_FLAVOR = {
  standard: 'Mineral deposits detected. Basic loot available.',
  rare:     'Anomalous readings. Rare tech signature.',
  legendary:'Void energy surge. Legendary cache found.',
}
```

### Structure attendue : colonne droite (titre + cards verticales)

```jsx
{/* ── Colonne droite : Titre + Cards ── */}
<div style={{ flex: 1, minWidth: 280 }}>
  <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', letterSpacing: '0.15em', color: 'var(--rs-text)', margin: 0, lineHeight: 1 }}>
    PLANET SCANNED!
  </h1>
  <div style={{ width: '32px', height: '2px', background: tierColor, marginTop: '6px', marginBottom: '20px' }} />

  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {choices.map((choice, i) => { ... })}
  </div>
</div>
```

### Pattern card (référence LevelUpModal + clip-path 10px)

```jsx
<div
  key={`${choice.type}_${choice.id}`}
  style={{
    position: 'relative',
    padding: 12,
    background: 'var(--rs-bg-raised)',
    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
    borderLeft: `3px solid ${rarityTier.color}`,
    cursor: 'pointer',
    animationDelay: `${i * 50}ms`,
    animationFillMode: 'backwards',
  }}
  className="animate-fade-in"
  onClick={() => applyChoice(choice)}
  onMouseEnter={(e) => {
    playSFX('button-hover')
    e.currentTarget.style.borderColor = 'var(--rs-border-hot)'
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = rarityTier.color
  }}
>
```

> Note : `borderColor` dans `onMouseLeave` réinitialise vers `rarityTier.color` car la card a `borderLeft` (couleur de gauche uniquement) — `e.currentTarget.style.borderColor` override globalement, donc au leave on remet la valeur correcte. Le `borderLeft: 3px solid` du style prop ne se réapplique pas automatiquement via React si overridden inline.

### Pattern badge rareté (clip-path 4px)

```jsx
{!isCommon && (
  <span style={{
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 11,
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    color: '#000',
    backgroundColor: rarityTier.color,
    clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
  }}>
    {rarityTier.name.toUpperCase()}
  </span>
)}
```

### Touche [1-3] : bas-droite de card (Space Mono)

```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
  {/* ... badge rareté + level/NEW ... */}
  <span style={{ marginLeft: 'auto', fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--rs-text-dim)' }}>
    [{i + 1}]
  </span>
</div>
```

### Vérification `--rs-border-hot` dans style.css

Cette variable est référencée dans l'Epic 39 mais peut ne pas encore être dans `src/style.css`. Si absente, l'ajouter dans la section `:root {}` :
```css
--rs-border-hot: rgba(255, 79, 31, 0.6);
```
(Orange DS à 60% — utilisé pour les hovers de cards)

### CSS Variables disponibles (src/style.css)

```
--rs-bg:          #0d0b14
--rs-bg-surface:  #1a1528
--rs-bg-raised:   #241d35
--rs-border:      #2e2545
--rs-text:        #f5f0e8
--rs-text-muted:  #7a6d8a
--rs-text-dim:    #4a3f5c
--rs-orange:      #ff4f1f
--rs-violet:      #9b5de5
--rs-teal:        #00b4d8
--rs-gold:        #ffd60a
--rs-success:     #2dc653
--rs-danger:      #ef233c
--rs-border-hot:  rgba(255,79,31,0.6)  ← à vérifier/ajouter
```

### Patterns clip-path standard (Epic 39)

```
Modal pleine (480px+) : polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)
Panel/card intermédiaire : polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)
Bouton/petit élément : polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)
Badge : polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)
```

### Learnings depuis Story 39.1 (MainMenu)

- Le pattern `const S = { ... }` centralise tous les styles en haut du composant — réduire les répétitions inline dans JSX
- `borderLeft: '3px solid ...'` est overridé par `e.currentTarget.style.borderColor` si on l'applique directement en inline style prop — au `onMouseLeave`, restaurer avec `e.currentTarget.style.borderColor = rarityTier.color` (et non `.borderLeftColor`)
- Les boutons/cards Tailwind `hover:scale-105` et `rounded` sont les deux anti-patterns les plus courants à traquer
- Les tests du projet n'inspectent pas les styles inline ni les classes CSS → aucun test à modifier pour des changements purement visuels

### Commits récents pertinents

- `cce84dc feat(33.2): HUD emoji → SVG icon replacement + review fixes` — pattern SVG inline
- `e493903 feat(33.1): SVG icon system + StatLine function icon support` — introduction du système d'icônes
- `c4842aa feat: redesign CreditsModal with Redshift design system + add RS CSS variables` — référence DS complète

### Project Structure Notes

- Pas de nouveaux fichiers à créer (sauf ajout possible dans `style.css` pour `--rs-border-hot`)
- Un seul composant modifié : `src/ui/PlanetRewardModal.jsx`
- Le layout 2 colonnes est identique à `LevelUpModal.jsx` — s'en inspirer directement (lignes 145-227)
- `PLANETS` est importé mais non utilisé dans le fichier actuel (import mort) — ne pas l'utiliser pour l'info de la colonne gauche, utiliser `TIER_LABELS` et `TIER_COLORS` déjà présents
- `className="animate-fade-in"` peut rester sur les cards pour l'animation — seuls les styles visuels sont remplacés par inline

### Tests

Aucun test `PlanetRewardModal.test.jsx` n'existe. La condition AC #9 se résume à : `vitest run` global passe (pas de régression sur d'autres composants). Aucun nouveau test à écrire pour des changements purement visuels.

### References

- [Source: _bmad-output/planning-artifacts/epic-39-redshift-ui-full-pass.md#Story 39.2]
- [Source: src/ui/modals/CreditsModal.jsx — référence DS complète]
- [Source: src/ui/LevelUpModal.jsx — patron layout 2 colonnes]
- [Source: src/ui/PlanetRewardModal.jsx — fichier cible]
- [Source: src/style.css — variables CSS --rs-*]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Rewrote `PlanetRewardModal.jsx` from scratch using Redshift DS patterns.
- Overlay: `rgba(13,11,20,0.88)` inline style replacing `bg-black/60` Tailwind.
- 2-column layout: left col (200px) = Scan Info with tier pill + separator + flavor text; right col (flex:1) = title + vertical cards.
- Title: Bebas Neue 2.5rem + letterSpacing 0.15em + 32×2px accent div in `tierColor`.
- Cards: `var(--rs-bg-raised)` + clip-path 10px + `borderLeft: 3px solid rarityTier.color` — no boxShadow, no rounded.
- Rarity badge: clip-path 4px + `rarityTier.color` background, Rajdhani bold.
- Hover: `borderColor → var(--rs-border-hot)`, leave restores `rarityTier.color` — no scale.
- Shortcut keys [1-3]: Space Mono, `var(--rs-text-dim)`, `marginLeft: 'auto'` in top row.
- `--rs-border-hot` already present in style.css (`rgba(255,79,31,0.4)`) — no change needed.
- `const S` centralizes all static styles above the component.
- Removed dead import `PLANETS` from `planetDefs.js`.
- Pre-existing `useWeapons.test.js` failure (unrelated to story 39.2) confirmed via git stash test.
- 2552 tests pass at implementation time; 2621 tests pass after code review fixes.
- Code review (39.2): fixed `--rs-border-hot` opacity 0.4 → 0.6 per story spec; added 43 interaction/contract tests in `PlanetRewardModal.test.jsx`.

### File List

- src/ui/PlanetRewardModal.jsx
- src/style.css (--rs-border-hot opacity 0.4 → 0.6)
- src/ui/__tests__/PlanetRewardModal.test.jsx (new — 43 tests)

### Change Log

- 2026-02-24: Story 39.2 implemented — PlanetRewardModal full Redshift DS pass (overlay, 2-col layout, title, cards, badge, hover, shortcuts)
