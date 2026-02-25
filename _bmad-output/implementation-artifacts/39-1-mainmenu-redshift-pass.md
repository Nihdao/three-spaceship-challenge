# Story 39.1: MainMenu full Redshift pass

Status: done

## Story

As a player,
I want the main menu to reflect the Redshift design identity,
So that the first screen seen matches the visual quality of the rest of the game.

## Acceptance Criteria

1. **Given** `MainMenu.jsx` **When** le joueur est sur l'écran principal **Then** le titre "REDSHIFT SURVIVOR" utilise Bebas Neue, `clamp(3rem, 8vw, 6rem)`, `letterSpacing: '0.12em'`, couleur `var(--rs-text)`, **sans** textShadow magenta.

2. **And** une ligne accent orange 32×2px apparaît sous le titre (pattern identique à CreditsModal).

3. **And** les 4 boutons de menu principaux (PLAY, UPGRADES, ARMORY, STATS) utilisent clip-path 8px + `border-left: 3px solid var(--rs-orange)` + hover inline `translateX(4px)` + `borderColor → var(--rs-orange)` — pas de `scale-105` ni de `rounded` ni de Tailwind `hover:`.

4. **And** les labels "BEST RUN" et "FRAGMENTS" en haut-droite utilisent Space Mono 0.65rem UPPERCASE `var(--rs-text-muted)`. Les valeurs utilisent Bebas Neue ou Rajdhani bold pour le score et `var(--rs-violet)` pour les fragments.

5. **And** `#cc66ff` est remplacé par `var(--rs-violet)` partout dans ce fichier.

6. **And** les boutons STATS et CREDITS en bas-gauche utilisent clip-path 8px + hover `translateX(4px)` — pas de `rounded`.

7. **Given** `vitest run` **When** la story est implémentée **Then** tous les tests `MainMenu.test.jsx` passent sans modification.

## Tasks / Subtasks

- [x] Task 1 — Migrer le titre vers inline styles Redshift (AC: #1, #2)
  - [x] Remplacer `className="text-5xl font-bold tracking-[0.15em] text-game-text mb-16 select-none"` + `style={{ textShadow: "..." }}` par un `style` inline complet : `fontFamily: 'Bebas Neue, sans-serif'`, `fontSize: 'clamp(3rem, 8vw, 6rem)'`, `letterSpacing: '0.12em'`, `color: 'var(--rs-text)'`, `margin: 0`, pas de textShadow
  - [x] Ajouter la div accent orange juste en dessous du h1 : `<div style={{ width: '32px', height: '2px', background: 'var(--rs-orange)', marginTop: '6px', marginBottom: '3rem' }} />`
  - [x] Retirer `mb-16` du h1 (le margin est maintenant géré par la div accent)

- [x] Task 2 — Migrer les labels BEST RUN / FRAGMENTS vers inline styles (AC: #4, #5)
  - [x] Label "BEST RUN" : `fontFamily: 'Space Mono, monospace'`, `fontSize: '0.65rem'`, `letterSpacing: '0.1em'`, `color: 'var(--rs-text-muted)'`, `textTransform: 'uppercase'`
  - [x] Valeur highScore : `fontFamily: 'Rajdhani, sans-serif'`, `fontWeight: 700`, `fontSize: '1.5rem'`, `color: 'var(--rs-text)'`, tabular-nums via `fontVariantNumeric: 'tabular-nums'`
  - [x] Label "FRAGMENTS" : même style Space Mono que BEST RUN
  - [x] Valeur fragments : même style Rajdhani bold, `color: 'var(--rs-violet)'` (remplace `text-[#cc66ff]`)

- [x] Task 3 — Migrer les 4 boutons principaux vers clip-path + hover inline (AC: #3)
  - [x] Définir un objet styles `S` en haut du composant avec `menuBtn` et `menuBtnSelected`
  - [x] `menuBtn` : `width: '12rem'`, `padding: '10px 16px'`, `background: 'transparent'`, `border: '1px solid var(--rs-border)'`, `borderLeft: '3px solid var(--rs-orange)'`, `clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)'`, `color: 'var(--rs-text-muted)'`, `fontFamily: 'Space Mono, monospace'` (ou Rajdhani pour les labels), `letterSpacing: '0.12em'`, `cursor: 'pointer'`, `transition: 'border-color 150ms, color 150ms, transform 150ms'`, `outline: 'none'`
  - [x] `menuBtnSelected` : ajouter `color: 'var(--rs-text)'`, `borderColor: 'var(--rs-orange)'`
  - [x] Remplacer la `className` complexe des boutons par `style={selectedIndex === i ? S.menuBtnSelected : S.menuBtn}`
  - [x] Ajouter `onMouseEnter` inline : `e.currentTarget.style.borderColor = 'var(--rs-orange)'; e.currentTarget.style.color = 'var(--rs-text)'; e.currentTarget.style.transform = 'translateX(4px)'` (conserver l'appel playSFX + setSelectedIndex)
  - [x] Ajouter `onMouseLeave` inline : reset borderColor/color/transform selon état selected

- [x] Task 4 — Migrer les boutons STATS et CREDITS en bas-gauche (AC: #6)
  - [x] Remplacer `className="px-4 py-2 text-sm tracking-widest border border-game-border text-game-text-muted hover:border-game-accent hover:text-game-text transition-all duration-150 rounded outline-none cursor-pointer"` par styles inline
  - [x] Style : `background: 'transparent'`, `padding: '6px 14px'`, `border: '1px solid var(--rs-border)'`, `clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)'`, `color: 'var(--rs-text-muted)'`, `fontFamily: 'Space Mono, monospace'`, `fontSize: '0.72rem'`, `letterSpacing: '0.1em'`, `cursor: 'pointer'`, `transition: 'border-color 150ms, color 150ms, transform 150ms'`, `outline: 'none'`
  - [x] Ajouter handlers onMouseEnter/onMouseLeave inline pour translateX + borderColor

- [x] Task 5 — Vérification et tests (AC: #7)
  - [x] `vitest run src/ui/__tests__/MainMenu.test.jsx` → tous passent (5/5 ✅)
  - [x] Vérification visuelle : aucun `#cc66ff` hardcodé, aucun `textShadow magenta`, aucun `rounded`, aucun `scale`

## Dev Notes

### Fichier à modifier

Un seul fichier : `src/ui/MainMenu.jsx`

### Fichier de référence OBLIGATOIRE

Lire `src/ui/modals/CreditsModal.jsx` avant de commencer. Tous les patterns utilisés dans cette story en sont directement extraits :
- Pattern `const S = { ... }` pour centraliser les styles en haut du composant
- Pattern titre + accent : `<h2 style={S.title}>...</h2><div style={S.titleAccent} />`
- Pattern bouton back : `style={S.backBtn}` + onMouseEnter/Leave inline
- Variables CSS : `var(--rs-bg-surface)`, `var(--rs-border)`, `var(--rs-orange)`, `var(--rs-text)`, `var(--rs-text-muted)`, `var(--rs-violet)`, `var(--rs-teal)`

### Anti-patterns actuels dans MainMenu.jsx

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 133 | `text-[#cc66ff]` hardcodé | `color: 'var(--rs-violet)'` |
| 141-145 | `text-5xl font-bold tracking-[0.15em]` + `textShadow magenta` | Inline Bebas Neue + clamp + sans shadow |
| 153-162 | `rounded`, `scale-105`, `bg-game-accent/10`, Tailwind hover | clip-path 8px + onMouseEnter/Leave inline |
| 180-181 | `rounded` sur boutons bas-gauche | clip-path 8px + hover inline |

### CSS Variables disponibles (src/style.css)

```css
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
```

### Pattern clip-path standard (Epic 39)

```
Modal (480px+) : polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)
Panel/card     : polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)
Bouton/petit   : polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)
```

### Pattern hover bouton (référence CreditsModal)

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

Pour le bouton sélectionné (état actif), `onMouseLeave` remet `borderColor: 'var(--rs-orange)'` plutôt que `var(--rs-border)`.

### Pattern titre de modal (référence CreditsModal)

```jsx
<h1 style={{
  fontFamily: 'Bebas Neue, sans-serif',
  fontSize: 'clamp(3rem, 8vw, 6rem)',
  letterSpacing: '0.12em',
  color: 'var(--rs-text)',
  lineHeight: 1,
  margin: 0,
  userSelect: 'none',
}}>
  REDSHIFT SURVIVOR
</h1>
<div style={{ width: '32px', height: '2px', background: 'var(--rs-orange)', marginTop: '6px', marginBottom: '3rem' }} />
```

### Notes sur les boutons principaux

Les 4 boutons PLAY/UPGRADES/ARMORY/STATS ont un double état : `selected` (navigué au clavier ou hover actif) et `default`. Le pattern `borderLeft: 3px solid var(--rs-orange)` est fixe (toujours présent), c'est la `borderColor` globale et le `color` qui changent :

- Default : `borderColor: var(--rs-border)`, `color: var(--rs-text-muted)`
- Selected/hover : `borderColor: var(--rs-orange)`, `color: var(--rs-text)`

Attention : l'état `selectedIndex` est géré par la navigation clavier. Le handler `onMouseEnter` existant appelle déjà `setSelectedIndex(i)` — conserver ce comportement en ajoutant seulement les style mutations inline.

### Tests — aucun changement requis

`MainMenu.test.jsx` teste uniquement :
1. Le contrat store `usePlayer.fragments` (pas touché)
2. L'export `MENU_ITEMS` (pas touché)

Aucun test n'inspecte les styles inline ni les classes CSS. Les 5 tests doivent passer sans modification.

### Composants déjà conformes — ne pas toucher

- `src/ui/modals/CreditsModal.jsx` ← référence
- `src/ui/modals/OptionsModal.jsx` ← sera traité en 39.4
- `src/ui/UpgradesScreen.jsx` ← sera traité en 39.9
- `src/ui/Armory.jsx` ← sera traité en 39.9
- `src/ui/StatsScreen.jsx` ← sera traité en 39.8

### Project Structure Notes

- Pas de nouveaux fichiers à créer
- Les styles inline centralisés via `const S = {}` en haut du composant (pattern CreditsModal)
- Tous les Tailwind `hover:` sur les boutons sont supprimés en faveur des handlers `onMouseEnter`/`onMouseLeave`
- Le `className` des boutons principaux peut conserver uniquement `select-none outline-none cursor-pointer` si nécessaire, ou être entièrement remplacé par inline

### References

- [Source: _bmad-output/planning-artifacts/epic-39-redshift-ui-full-pass.md#Story 39.1]
- [Source: src/ui/modals/CreditsModal.jsx — référence DS complète]
- [Source: src/style.css — variables CSS --rs-*]
- [Source: src/ui/__tests__/MainMenu.test.jsx — tests à faire passer]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Migrated MainMenu.jsx to full Redshift Design System inline styles
- Added `const S = { menuBtn, menuBtnSelected, cornerBtn }` at module level (pattern from CreditsModal)
- Title: Bebas Neue clamp(3rem,8vw,6rem) + accent div 32×2px orange, no textShadow
- BEST RUN / FRAGMENTS labels: Space Mono 0.65rem uppercase rs-text-muted
- Score / Fragments values: Rajdhani 700 1.5rem tabular-nums; fragments uses var(--rs-violet)
- 4 main buttons: clip-path 8px + borderLeft 3px orange + onMouseEnter/Leave inline translateX(4px)
- STATS/CREDITS corner buttons: clip-path 8px + same hover pattern
- No #cc66ff hardcoded, no textShadow, no `rounded`, no `scale-105`, no Tailwind `hover:`
- All 5 MainMenu.test.jsx tests pass
- [Code Review Fix] Replaced `◆` Unicode with `<FragmentIcon />` SVG component (Epic 33 icon system)
- [Code Review Fix] Added `transform: 'translateX(0)'` to S.menuBtn/menuBtnSelected — prevents stale shift after keyboard navigation while hovering
- [Code Review Fix] Added `fontSize: '0.75rem'` to S.menuBtn/menuBtnSelected — explicit DS-consistent sizing

### File List

- src/ui/MainMenu.jsx
