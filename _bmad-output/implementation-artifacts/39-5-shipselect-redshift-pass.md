# Story 39.5: ShipSelect full Redshift pass

Status: done

## Story

As a player,
I want the ship selection screen to fully adopt the Redshift design language,
So that this key pre-game moment feels premium and cohesive.

## Acceptance Criteria

1. **Given** `ShipSelect.jsx` **When** le joueur est sur l'écran de sélection de vaisseau **Then** le titre "SELECT YOUR SHIP" utilise Bebas Neue + ligne accent orange 32×2px — sans `textShadow`.

2. **And** les cards vaisseaux dans la grille utilisent clip-path 8px + `var(--rs-bg-raised)` — pas de `rounded-lg`.

3. **And** la sélection active utilise `borderColor: var(--rs-orange)` — pas de `border-game-accent ring-1 ring-game-accent/40`.

4. **And** le panel détail droit utilise `var(--rs-bg-surface)` + clip-path 16px + `var(--rs-border)` — sans `rounded-lg backdrop-blur-sm`.

5. **And** le nom du vaisseau utilise Bebas Neue — sans `textShadow`.

6. **And** le badge niveau (LV.X / MAX) utilise clip-path 4px — pas de `rounded`.

7. **And** `#cc66ff` (coût level up) → `var(--rs-violet)`.

8. **And** le badge "★ MAX LEVEL" utilise `var(--rs-gold)` — pas de `text-yellow-400`.

9. **And** le bouton LEVEL UP : clip-path 8px + `var(--rs-teal)` si affordable, hover translateX — pas de `border-cyan-400/60 rounded-lg hover:scale-105`.

10. **And** le bouton SELECT : clip-path 8px + `var(--rs-orange)` — pas de `border-game-accent rounded-lg hover:scale-105`.

11. **And** le bouton ← BACK : clip-path 8px + hover translateX — pas de texte brut sans style.

12. **And** les boutons skins (petits ronds de couleur) conservent leur forme circulaire (exception justifiée — représentent des couleurs, clip-path angulaire inadapté).

13. **And** hover sur toutes les cards et boutons (sauf skins) : `translateX(4px)`, jamais `scale`.

14. **Given** `vitest run` **When** la story est implémentée **Then** `ShipSelect.enrichedStats.test.js` passe sans modification.

## Tasks / Subtasks

### Préparer const S

- [x] Task 1 — Créer `const S` avant `export default function ShipSelect()` (AC: tous)
  - [x] Définir tous les styles dans l'objet `S` à portée module (avant le composant, après les imports)
  - [x] Inclure : `S.backBtn`, `S.title`, `S.titleAccent`, `S.shipCard`, `S.shipCardSelected`, `S.shipCardLocked`, `S.detailPanel`, `S.previewContainer`, `S.shipName`, `S.levelBadge`, `S.maxBadge`, `S.btnLevelUp`, `S.btnLevelUpDisabled`, `S.btnSelect`

### Bouton ← BACK

- [x] Task 2 — Migrer le bouton BACK absolu (AC: #11, #13)
  - [x] Remplacer `className="absolute top-8 left-8 px-4 py-2 text-sm tracking-widest text-game-text-muted hover:text-game-text transition-colors select-none"` par `style={S.backBtn}` + `className="absolute top-8 left-8"`
  - [x] `S.backBtn` défini dans const S
  - [x] Ajouter handlers hover (pattern CreditsModal exact)

### Titre SELECT YOUR SHIP

- [x] Task 3 — Migrer le titre + ajouter accent orange (AC: #1)
  - [x] Remplacer h2 avec textShadow par div + h2(S.title) + div(S.titleAccent)

### Grid cards vaisseaux

- [x] Task 4 — Migrer les cards vaisseaux (AC: #2, #3, #13)
  - [x] Retirer `rounded-lg` de toutes les classes des boutons ship
  - [x] États shipCard / shipCardSelected / shipCardLocked définis dans const S
  - [x] Appliquer via `style={ship.locked ? S.shipCardLocked : { ...S.shipCard, ...(selectedShipId === ship.id ? S.shipCardSelected : {}) }}`
  - [x] Hover : translateX(4px) + orange sur enter, restaurer sur leave via selectedShipIdRef
  - [x] Supprimer `rounded` du conteneur thumbnail

### Panel détail droit

- [x] Task 5 — Migrer le panel droit (AC: #4)
  - [x] Remplacer className avec rounded-lg/backdrop-blur-sm par `style={S.detailPanel}`
  - [x] S.previewContainer : aspectRatio + marginBottom + overflow (sans borderWidth)
  - [x] Conserver backgroundColor colorTheme via spread sur S.previewContainer

### Nom vaisseau + badge niveau

- [x] Task 6 — Migrer le nom et le badge niveau (AC: #5, #6, #8)
  - [x] Nom vaisseau : style={S.shipName} Bebas Neue sans textShadow
  - [x] Badge LV.X : S.levelBadge(selectedShip.colorTheme) avec clipPath 4px
  - [x] Badge MAX : S.maxBadge avec var(--rs-gold) + clipPath 4px

### Bouton LEVEL UP

- [x] Task 7 — Migrer le bouton LEVEL UP (AC: #7, #9, #13)
  - [x] style={canAffordLevelUp ? S.btnLevelUp : S.btnLevelUpDisabled}
  - [x] Hover translateX + color restore (seulement si canAffordLevelUp)
  - [x] #cc66ff → var(--rs-violet)

### Bouton SELECT

- [x] Task 8 — Migrer le bouton SELECT (AC: #10, #13)
  - [x] style={S.btnSelect} + hover translateX + background restore

### Badge MAX LEVEL (élément dédié)

- [x] Task 9 — Migrer l'affichage MAX LEVEL (AC: #8)
  - [x] style={S.maxLevelDisplay} avec var(--rs-gold) + clipPath 8px

### Séparateurs

- [x] Task 10 — Migrer les séparateurs (cohérence)
  - [x] Tous les `border-t border-game-border/20` → `style={{ borderTop: '1px solid var(--rs-border)', marginBottom: '...' }}`

### Tests

- [x] Task 11 — Validation tests (AC: #14)
  - [x] `vitest run src/ui/__tests__/ShipSelect.enrichedStats.test.js` : 12/12 passent
  - [x] `grep rounded` → uniquement skin buttons (exception justifiée)
  - [x] `grep scale` → uniquement skin buttons (exception justifiée)
  - [x] `grep game-accent|game-border|game-bg|game-text` → uniquement skin buttons (exception justifiée)
  - [x] `grep #cc66ff|textShadow|backdrop-blur` → 0 résultat
  - [x] Suite complète : 152 fichiers / 2621 tests passent

## Dev Notes

### Fichiers à modifier

Un seul fichier :
- `src/ui/ShipSelect.jsx`

Aucune modification de `src/style.css` — toutes les variables `--rs-*` nécessaires sont déjà définies.

### Fichiers de référence OBLIGATOIRES

1. **`src/ui/modals/CreditsModal.jsx`** — patron DS complet : `const S`, overlay `rgba(13,11,20,0.88)`, titre + accent, clip-path, hover translateX. Copier exactement le pattern `backBtn` et son hover.
2. **`src/ui/RevivePrompt.jsx`** (Story 39.4) — migration d'un écran plein avec boutons d'action (teal + danger) et pattern `const S`.
3. **`src/ui/modals/OptionsModal.jsx`** (Story 39.4) — panel avec clip-path 16px, titre Bebas Neue.

### Anti-patterns actuels identifiés dans ShipSelect.jsx

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 256-260 | `top-8 left-8 text-game-text-muted hover:text-game-text transition-colors` (BACK sans clip-path) | `style={S.backBtn}` + hover translateX (pattern CreditsModal) |
| 268-270 | `textShadow: '0 0 30px rgba(255, 0, 255, 0.2)'` + `text-2xl` sans Bebas Neue | `style={S.title}` Bebas Neue 2.5rem + `<div style={S.titleAccent} />` |
| 285-295 | `border rounded-lg` + `border-game-accent ring-1 ring-game-accent/40` | clip-path 8px + sélection `var(--rs-orange)` |
| 298 | `rounded mb-2` (thumbnail container) | Supprimer `rounded` |
| 319 | `bg-game-bg/60 border-game-border/40 rounded-lg backdrop-blur-sm` (panel droit) | `style={S.detailPanel}` clip-path 16px + `var(--rs-bg-surface)` |
| 322-323 | `rounded-lg mb-3` (preview container) | Supprimer `rounded-lg` → `style={S.previewContainer}` |
| 332-335 | `textShadow: \`0 0 20px ${colorTheme}40\`` | `style={S.shipName}` Bebas Neue sans textShadow |
| 337-343 | `rounded` (badge LV./MAX) | `clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)'` |
| 339-340 | `'#ffd700'` hardcodé (badge MAX) | `var(--rs-gold)` |
| 532 | `text-yellow-400 border-yellow-400/30 rounded-lg bg-yellow-400/10` (MAX LEVEL) | `style={S.maxLevelDisplay}` + `var(--rs-gold)` + clip-path 8px |
| 543-545 | `border-cyan-400/60 text-cyan-300 rounded-lg hover:scale-105` (LEVEL UP affordable) | `style={S.btnLevelUp}` + `var(--rs-teal)` + hover translateX |
| 548 | `<span style={{ color: '#cc66ff' }}>` | `color: 'var(--rs-violet)'` |
| 553-564 | `border-game-accent rounded-lg hover:scale-105` (SELECT) | `style={S.btnSelect}` + `var(--rs-orange)` + hover translateX |

### Exceptions justifiées (ne pas modifier)

- **Boutons skins (lignes 501-514)** : `w-8 h-8 rounded-lg border-2` + `scale-110` sur sélection active. Ces petits ronds colorés représentent des couleurs de skin — un clip-path angulaire serait visuellement absurde. **Exception approuvée dans les AC.** Le `hover:scale-110` et `scale-110` sur l'actif sont également retenus (navigation couleur, pas un bouton d'action).

### Pattern `const S` — placement

```js
// Juste avant le shipList = Object.values(SHIPS) ou juste avant export default function ShipSelect()
const S = {
  backBtn: { ... },
  title: { ... },
  titleAccent: { ... },
  shipCard: { ... },
  shipCardSelected: { ... },
  shipCardLocked: { ... },
  detailPanel: { ... },
  previewContainer: { ... },
  shipName: { ... },
  // badges et boutons...
}
```

### Pattern clips-path standard (rappel)

```
Modal pleine  : polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)
Panel/card    : polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)
Bouton/petit  : polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)
Badge         : polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)
```

Le coin coupé est **toujours en haut-droite**.

### Variables CSS disponibles (vérifiées dans style.css)

```
--rs-bg:          #0d0b14    fond principal (non utilisé directement ici)
--rs-bg-surface:  #1a1528    panel droit
--rs-bg-raised:   #241d35    ship cards background
--rs-border:      #2e2545    bordures neutres
--rs-text:        #f5f0e8    texte principal
--rs-text-muted:  #7a6d8a    texte secondaire, BACK button par défaut
--rs-text-dim:    #4a3f5c    labels très secondaires
--rs-orange:      #ff4f1f    sélection active, SELECT button, hover
--rs-violet:      #9b5de5    coût fragments (◆) dans LEVEL UP
--rs-teal:        #00b4d8    LEVEL UP button affordable
--rs-gold:        #ffd60a    MAX LEVEL badge, ★
--rs-danger:      #ef233c    (non utilisé dans cette story)
--rs-success:     #2dc653    (non utilisé dans cette story)
```

### Learnings des stories précédentes (39.2 → 39.4)

- **`e.currentTarget.style.borderColor` override `borderLeft`** — au onMouseLeave, restaurer explicitement la valeur originale (ex: `'var(--rs-orange)'` pour la card sélectionnée, `'var(--rs-border)'` pour les autres).
- **`const S` avant le composant** — centralise tous les styles, évite les inline multiples dans JSX. La définir juste avant `export default function ShipSelect()`.
- **Les classes Tailwind de layout structurel peuvent rester** (`flex`, `items-center`, `gap-4`, `grid grid-cols-3`, `overflow-y-auto`, `fixed inset-0`, `z-50`, `animate-fade-in`, `space-y-0.5`, etc.) — seules les classes de **couleur, border, radius, shadow, scale** migrent en inline style.
- **Hover sur card sélectionnée** : quand `selectedShipId === ship.id`, le `onMouseEnter` met déjà à jour `selectedShipId` via `setSelectedShipId` + audio. Le `borderColor` du hover doit déjà être `var(--rs-orange)` (la card est sélectionnée). Donc le hover peut se limiter à `transform: 'translateX(4px)'` sans changer le border.
- **Pattern hover + `onMouseLeave` robuste** : ne pas utiliser `e.currentTarget.style.borderColor = ''` pour reset — utiliser la valeur explicite. Sinon le style computed CSS prend le dessus.
- **Vérification rapide post-migration** : `grep -n "rounded\|scale-1\|game-accent\|game-border\|game-text\|game-bg\|cc66ff\|textShadow\|backdrop" ShipSelect.jsx` doit retourner uniquement les lignes skin buttons.

### Structure du composant après migration

Le composant garde sa structure et logique identiques — keyboard navigation, `useRef`, `useMemo`, `useState`, handlers — seuls les styles visuels changent. Les `StatLine` components ne sont pas touchés (déjà conformes via Story 39.9 à venir).

### Tests — aucun test à modifier

- `src/ui/__tests__/ShipSelect.enrichedStats.test.js` : teste le calcul des `effectiveStats` (combinaison stats de base vaisseau + multiplicateurs niveau + bonuses permanents). Aucun composant React rendu, aucun style inspecté. Doit passer sans modification.
- Aucun nouveau test à écrire pour des changements purement visuels.

### Project Structure Notes

- Fichier unique : `src/ui/ShipSelect.jsx`
- `src/ui/primitives/StatLine.jsx` : ne pas toucher (Story 39.9)
- `src/ui/ShipModelPreview.jsx` : ne pas toucher (rendu 3D)
- `src/ui/modals/CreditsModal.jsx` est la référence — le lire avant d'implémenter

### References

- [Source: _bmad-output/planning-artifacts/epic-39-redshift-ui-full-pass.md#Story 39.5]
- [Source: src/ui/ShipSelect.jsx — fichier cible analysé ligne par ligne]
- [Source: src/ui/modals/CreditsModal.jsx — patron DS complet (const S, backBtn hover, overlay)]
- [Source: _bmad-output/implementation-artifacts/39-4-reviveprompt-optionsmodal-pass.md — learnings story précédente (pattern const S, hover restore explicite, layout classes OK)]
- [Source: src/style.css — variables --rs-* vérifiées]
- [Source: _bmad-output/planning-artifacts/project-context.md — design system, anti-patterns]
- [Source: src/ui/__tests__/ShipSelect.enrichedStats.test.js — test stats calcul uniquement]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- Migrated `ShipSelect.jsx` to full Redshift Design System in a single pass (Tasks 1–10)
- Created `const S` module-scope object with all styles: backBtn, title, titleAccent, shipCard, shipCardSelected, shipCardLocked, detailPanel, previewContainer, shipName, levelBadge (factory fn), maxBadge, maxLevelDisplay, btnLevelUp, btnLevelUpDisabled, btnSelect
- Hover pattern: `e.currentTarget.style.*` overrides, explicit restore values (never empty string)
- Card hover uses `selectedShipIdRef.current` to correctly restore border color on mouseleave
- Skin buttons retained `rounded-lg + scale-110 + game-* tokens` per approved exception (AC #12)
- Separators migrated from `border-t border-game-border/20` to inline `borderTop: '1px solid var(--rs-border)'`
- `#cc66ff` → `var(--rs-violet)`, `textShadow` removed, `backdrop-blur-sm` removed
- All 12 ShipSelect.enrichedStats tests pass; full suite 152 files / 2621 tests — 0 regressions

### File List

- src/ui/ShipSelect.jsx

### Change Log

- 2026-02-24: Story 39-5 — ShipSelect full Redshift pass implemented (single file: src/ui/ShipSelect.jsx)
- 2026-02-24: Code review — fixed 9 residual `game-text*` color tokens (L.478, 492, 515, 622, 629, 652, 655, 657, 684) migrated to `var(--rs-text)` / `var(--rs-text-muted)` inline styles; updated Task 11 grep pattern to include `game-text`
