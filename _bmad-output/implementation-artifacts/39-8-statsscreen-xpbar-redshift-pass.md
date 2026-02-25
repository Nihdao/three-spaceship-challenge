# Story 39.8: StatsScreen + XPBarFullWidth Redshift pass

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the stats screen to display with Redshift styling and the XP bar to use the correct semantic color,
So that XP (violet = magic/progression) and career stats feel premium.

## Acceptance Criteria

**StatsScreen:**

1. **Given** `StatsScreen.jsx` **When** le joueur consulte ses statistiques de carrière **Then** le titre "CAREER STATISTICS" utilise Bebas Neue 2.5rem + `letterSpacing: '0.15em'` + ligne accent orange 32×2px — sans `textShadow`.

2. **And** `StatCard` utilise clip-path 8px + `var(--rs-bg-raised)` — pas de `rounded-lg bg-white/[0.05] backdrop-blur-sm`.

3. **And** les panels "TOP WEAPONS" / "TOP BOONS" utilisent clip-path 8px + `var(--rs-bg-raised)` — pas de `rounded-lg backdrop-blur-sm`.

4. **And** les labels de section ("CAREER", "BEST RUN", "FAVORITES") utilisent Space Mono 0.65rem UPPERCASE `var(--rs-text-muted)` — stylés avec `const S`.

5. **And** le bouton ← BACK utilise clip-path 8px + hover `translateX(4px)` + `borderColor → var(--rs-orange)` — pas de classes Tailwind couleur/radius.

**XPBarFullWidth:**

6. **Given** `XPBarFullWidth.jsx` **When** la barre XP est visible en haut de l'écran **Then** la couleur principale du fill est `var(--rs-violet)` — pas `#10B981` (vert).

7. **And** le gradient normal est `linear-gradient(90deg, var(--rs-violet), #7b3fe4)`.

8. **And** lors du flash level-up, le fill devient `linear-gradient(90deg, var(--rs-text), var(--rs-violet))`.

9. **And** quand `pulse` (>80%), le `boxShadow` utilise `rgba(155, 93, 229, 0.6)` (violet) — pas `rgba(6, 182, 212, 0.5)` (cyan).

10. **And** la track de fond utilise `rgba(0,0,0,0.4)` inline — pas `bg-black/30`.

**Tests:**

11. **Given** `vitest run` **When** la story est implémentée **Then** `StatsScreen.test.jsx` et `XPBarFullWidth.test.jsx` passent sans modification.

## Tasks / Subtasks

### StatsScreen.jsx — `const S`

- [x] Task 1 — Créer `const S` avant `export default function StatsScreen()` (AC: 1, 2, 3, 4, 5)
  - [x] Définir l'objet `S` à portée module, après les imports et avant `StatCard`
  - [x] Inclure : `S.title`, `S.accentLine`, `S.sectionLabel`, `S.panel`, `S.backBtn`
  - [x] `S.title` : Bebas Neue 2.5rem + letterSpacing 0.15em + var(--rs-text)
  - [x] `S.accentLine` : 32px × 2px orange
  - [x] `S.sectionLabel` : Space Mono 0.65rem muted uppercase
  - [x] `S.panel` : clip-path 8px + var(--rs-bg-raised) + border
  - [x] `S.backBtn` : clip-path 8px + transparent + Space Mono

### StatsScreen.jsx — StatCard migration

- [x] Task 2 — Migrer `StatCard` en inline styles (AC: #2)
  - [x] `S.panel` spread + override padding 12px
  - [x] `rounded-lg`, `bg-white/[0.05]`, `backdrop-blur-sm`, `border-game-border` supprimés
  - [x] `<dl>` porte uniquement `style` inline

### StatsScreen.jsx — Header et titre

- [x] Task 3 — Migrer le titre "CAREER STATISTICS" et le bouton ← BACK (AC: #1, #5)
  - [x] `textShadow` magenta supprimé
  - [x] `text-2xl font-bold tracking-[0.15em] text-game-text` remplacés par `style={S.title}`
  - [x] Bouton BACK : `style={S.backBtn}` + handlers hover complets (orange/translateX)
  - [x] Ligne accent `S.accentLine` ajoutée sous le titre

### StatsScreen.jsx — Section labels

- [x] Task 4 — Migrer les 3 labels de section avec `S.sectionLabel` (AC: #4)
  - [x] CAREER, BEST RUN, FAVORITES : `style={S.sectionLabel}`

### StatsScreen.jsx — Panels TOP WEAPONS / TOP BOONS

- [x] Task 5 — Migrer les panels favoris (AC: #3)
  - [x] TOP WEAPONS : `style={S.panel}`
  - [x] TOP BOONS : `style={S.panel}`
  - [x] `<h3>` internes : inline style Space Mono muted
  - [x] `rounded-lg`, `bg-white/[0.05]`, `backdrop-blur-sm`, `border-game-border` supprimés

---

### XPBarFullWidth.jsx — Track de fond

- [x] Task 6 — Migrer la track de fond (AC: #10)
  - [x] `bg-black/30` → `style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}`

### XPBarFullWidth.jsx — Fill bar couleurs

- [x] Task 7 — Migrer les gradients et boxShadow du fill (AC: #6, #7, #8, #9)
  - [x] Gradient normal : `var(--rs-violet), #7b3fe4`
  - [x] Gradient flash : `var(--rs-text), var(--rs-violet)`
  - [x] Pulse boxShadow : `rgba(155, 93, 229, 0.6)`

---

### Tests + vérification finale

- [x] Task 8 — Validation (AC: #11)
  - [x] `StatsScreen.test.jsx` : 13/13 ✓
  - [x] `XPBarFullWidth.test.jsx` : 11/11 ✓
  - [x] `grep rounded StatsScreen.jsx` → 0
  - [x] `grep backdrop-blur StatsScreen.jsx` → 0
  - [x] `grep textShadow StatsScreen.jsx` → 0
  - [x] `grep game-border|game-text|game-accent StatsScreen.jsx` → 0
  - [x] `grep 10B981|06B6D4|182, 212 XPBarFullWidth.jsx` → 0
  - [x] `grep bg-black XPBarFullWidth.jsx` → 0

## Dev Notes

### Fichiers à modifier

Deux fichiers uniquement :
- `src/ui/StatsScreen.jsx` (173 lignes)
- `src/ui/XPBarFullWidth.jsx` (59 lignes)

Aucune modification de tests, de `src/style.css`, ni d'autres fichiers.

### Fichier de référence OBLIGATOIRE

**`src/ui/modals/CreditsModal.jsx`** — patron DS complet : `const S`, clip-path, hover translateX. Lire avant de commencer.

### Anti-patterns identifiés ligne par ligne

**StatsScreen.jsx :**

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 20 | `border-game-border rounded-lg bg-white/[0.05] backdrop-blur-sm` (StatCard) | `style={S.panel}` |
| 66-72 | `px-4 py-2 text-game-text-muted hover:text-game-text` (BACK button) | `style={S.backBtn}` + hover JS |
| 75-80 | `text-2xl font-bold text-game-text` + `textShadow magenta` (titre) | `style={S.title}` + `S.accentLine` |
| 96 | `text-xs tracking-[0.4em] text-game-text-muted uppercase mb-3` (section CAREER) | `style={S.sectionLabel}` |
| 107 | Même anti-pattern (section BEST RUN) | `style={S.sectionLabel}` |
| 118 | Même anti-pattern (section FAVORITES) | `style={S.sectionLabel}` |
| 125 | `border-game-border rounded-lg p-4 bg-white/[0.05] backdrop-blur-sm` (TOP WEAPONS panel) | `style={S.panel}` |
| 145 | Même anti-pattern (TOP BOONS panel) | `style={S.panel}` |

**XPBarFullWidth.jsx :**

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 43 | `bg-black/30` (track) | `style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}` |
| 50-51 | `linear-gradient(90deg, #10B981, #06B6D4)` (gradient normal) | `linear-gradient(90deg, var(--rs-violet), #7b3fe4)` |
| 50 | `linear-gradient(90deg, #ffffff, #06B6D4)` (gradient flash) | `linear-gradient(90deg, var(--rs-text), var(--rs-violet))` |
| 52 | `rgba(6, 182, 212, 0.5)` (pulse boxShadow cyan) | `rgba(155, 93, 229, 0.6)` (violet) |

### Sémantique des couleurs — justification XP violet

Dans le Redshift Design System, les couleurs ont une sémantique narrative :
- `var(--rs-violet)` `#9b5de5` = magie, progression, niveau — XP représente la progression du joueur → **violet**
- `var(--rs-teal)` `#00b4d8` = navigation, déplacement — était utilisé à tort pour l'XP
- `var(--rs-gold)` `#ffd60a` = victoire, meilleur score — NEW HIGH SCORE!
- `var(--rs-orange)` `#ff4f1f` = sélection active, action immédiate

`#7b3fe4` est le violet foncé de fin de gradient (approfondit `--rs-violet` vers le purple) — pas une variable nommée, valeur hardcodée intentionnelle.

### Learnings des stories 39.1 → 39.7

- **`const S` avant le composant** — avant `export default function`
- **Classes Tailwind de layout peuvent rester** : `fixed inset-0`, `z-50`, `flex flex-col items-center justify-center`, `space-y-8`, `grid grid-cols-*`, `animate-fade-in`, `pointer-events-none`, `w-full h-full`, `origin-left`, `transition-transform` etc. Seules les classes de **couleur, border, radius, scale, hover** migrent en inline style.
- **Hover + restore explicite** : toujours nommer la valeur de restauration (`'var(--rs-border)'`), jamais `''`
- **Fusionner le playSFX dans le handler complet** : l'ancien `onMouseEnter={() => playSFX('button-hover')}` standalone devient le handler complet
- **`bg-game-accent/10` hover** = anti-pattern à supprimer. Le DS Redshift utilise uniquement translateX + borderColor
- **Clip-path coin haut-droite** : `polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)` pour boutons/petits éléments

### Pattern hover bouton (référence exacte CreditsModal / stories 39.*)

```jsx
onMouseEnter={(e) => {
  playSFX('button-hover')
  e.currentTarget.style.borderColor = 'var(--rs-orange)'
  e.currentTarget.style.color = 'var(--rs-text)'
  e.currentTarget.style.transform = 'translateX(4px)'
}}
onMouseLeave={(e) => {
  e.currentTarget.style.borderColor = 'var(--rs-border)'
  e.currentTarget.style.color = 'var(--rs-text-muted)'
  e.currentTarget.style.transform = 'translateX(0)'
}}
```

### Pattern titre de modal / écran (référence CreditsModal)

```jsx
<h1 style={S.title}>CAREER STATISTICS</h1>
<div style={S.accentLine} />
```

où `S.title` = Bebas Neue 2.5rem + letterSpacing 0.15em + `var(--rs-text)`
et `S.accentLine` = width 32px, height 2px, background `var(--rs-orange)`, marginTop 6px

### Variables CSS disponibles (vérifiées dans style.css)

```
--rs-bg:          #0d0b14    fond principal
--rs-bg-surface:  #1a1528    surface modale
--rs-bg-raised:   #241d35    surface card/panel élevée ← utilisé pour StatCard et panels
--rs-border:      #2e2545    bordures neutres (état normal)
--rs-text:        #f5f0e8    texte principal / état hover bouton
--rs-text-muted:  #7a6d8a    texte secondaire / état normal bouton
--rs-orange:      #ff4f1f    sélection active, hover border, accent line
--rs-violet:      #9b5de5    XP, magie, progression ← couleur principale XPBar
```

### Tests — aucun test à modifier

- `StatsScreen.test.jsx` : teste uniquement `formatTime` (export logique), le store `useGlobalStats`, et `MENU_ITEMS` de `MainMenu.jsx`. Zéro rendu React, zéro inspection de style. `formatTime` reste intact.
- `XPBarFullWidth.test.jsx` : teste uniquement `calculateXPProgress` et `shouldPulseXPBar`. Zéro rendu React, zéro inspection de style. Les deux fonctions restent intactes.

### Project Structure Notes

- `src/ui/StatsScreen.jsx` — composant source à modifier (173 lignes)
- `src/ui/XPBarFullWidth.jsx` — composant source à modifier (59 lignes)
- `src/ui/__tests__/StatsScreen.test.jsx` — ne pas toucher
- `src/ui/__tests__/XPBarFullWidth.test.jsx` — ne pas toucher
- `src/style.css` — ne pas toucher
- `src/ui/modals/CreditsModal.jsx` — fichier de référence, ne pas modifier

### References

- [Source: _bmad-output/planning-artifacts/epic-39-redshift-ui-full-pass.md#Story 39.8]
- [Source: src/ui/StatsScreen.jsx — analysé ligne par ligne (173 lignes)]
- [Source: src/ui/XPBarFullWidth.jsx — analysé ligne par ligne (59 lignes)]
- [Source: src/ui/__tests__/StatsScreen.test.jsx — formatTime + store contract + MENU_ITEMS, 0 rendu]
- [Source: src/ui/__tests__/XPBarFullWidth.test.jsx — calculateXPProgress + shouldPulseXPBar, 0 rendu]
- [Source: src/style.css — variables --rs-* vérifiées (--rs-violet, --rs-bg-raised, --rs-orange, --rs-border, --rs-text, --rs-text-muted)]
- [Source: _bmad-output/implementation-artifacts/39-7-gameover-victory-redshift-pass.md — learnings stories 39.1 → 39.7]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Migré `StatsScreen.jsx` : `const S` avec 5 tokens (title, accentLine, sectionLabel, panel, backBtn) + StatCard inline + header Bebas Neue + section labels Space Mono + panels clip-path + hover JS complet sur BACK button + toutes classes `game-text*` migrées en `var(--rs-text*)` inline
- Migré `XPBarFullWidth.jsx` : track fond `rgba(0,0,0,0.4)` inline + gradient XP violet `var(--rs-violet), #7b3fe4` + flash `var(--rs-text), var(--rs-violet)` + pulse boxShadow violet `rgba(155, 93, 229, 0.6)`
- 24/24 tests story passent, 2694/2694 suite complète — 0 régression
- Toutes vérifications grep → 0 (rounded, backdrop-blur, textShadow, game-*, 10B981, 06B6D4, bg-black)

### Change Log

- 2026-02-24 — Story 39.8 implemented: StatsScreen + XPBarFullWidth Redshift pass
- 2026-02-24 — Code review fixes: dead code removed (XPBarFullWidth:46), S.accentLine centered (margin auto), StatCard dl margin reset

### File List

- src/ui/StatsScreen.jsx
- src/ui/XPBarFullWidth.jsx
