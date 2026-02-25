# Story 39.4: RevivePrompt + OptionsModal Redshift pass

Status: done

## Story

As a player,
I want the revive prompt and options screen to match the Redshift design system,
So that even rare/menu screens maintain visual consistency.

## Acceptance Criteria

### RevivePrompt

1. **Given** `RevivePrompt.jsx` **When** le joueur est mort avec des charges de revival **Then** l'overlay utilise `rgba(13,11,20,0.88)` — pas `bg-black/60`.

2. **And** le titre "REVIVE?" utilise Bebas Neue 2.5rem + ligne accent orange 32×2px.

3. **And** le bouton REVIVE utilise clip-path 8px + `border: 1px solid var(--rs-teal)` + `color: var(--rs-teal)` + hover `translateX(4px)` — pas de `rounded-lg border-2 border-game-accent hover:scale-105`.

4. **And** le bouton GAME OVER utilise clip-path 8px + `border: 1px solid var(--rs-border)` + hover translateX + border → `var(--rs-danger)` — pas de `rounded-lg hover:scale-105`.

5. **And** `bg-game-bg-medium` → `var(--rs-bg-raised)` sur les deux boutons.

### OptionsModal

6. **Given** `OptionsModal.jsx` **When** la modale options est ouverte **Then** l'overlay utilise `rgba(13,11,20,0.88)` — pas `bg-black/60`.

7. **And** la modal utilise `var(--rs-bg-surface)` + clip-path 16px + `var(--rs-border)` — pas de `bg-[#0a0a0f] border-2 border-game-primary rounded-lg`.

8. **And** le titre "OPTIONS" utilise Bebas Neue 2.5rem + ligne accent orange 32×2px.

9. **And** les labels des sliders volume utilisent Space Mono 0.65rem UPPERCASE `var(--rs-text-muted)` dans `VolumeSlider`.

10. **And** le bouton CLEAR LOCAL SAVE utilise clip-path 8px + `var(--rs-danger)` — pas de `rounded`.

11. **And** le bouton [ESC] BACK utilise clip-path 8px + hover translateX + `var(--rs-orange)` (pattern CreditsModal exact).

12. **And** la boite de confirmation utilise clip-path 10px + `var(--rs-bg-surface)` + `border: 1px solid var(--rs-danger)` — pas de `rounded-lg bg-[#0a0a0f]`.

13. **And** les boutons CANCEL/CLEAR DATA de la confirmation utilisent clip-path 8px.

### Tests

14. **Given** `vitest run` **When** la story est implémentée **Then** `OptionsModal.test.js` passe sans modification (teste uniquement les fonctions utilitaires exportées — aucun style inspecté).

15. **And** `useGame.revive.test.js` passe sans modification (teste le store, aucun style ni JSX inspecté).

## Tasks / Subtasks

### RevivePrompt.jsx

- [x] Task 1 — Créer `const S` et migrer l'overlay (AC: #1)
  - [x] Ajouter `const S = { overlay: {...}, ... }` juste avant `export default function RevivePrompt()`
  - [x] Remplacer `bg-black/60 font-game` sur le div racine par `style={S.overlay}` ; garder `fixed inset-0 z-50 flex flex-col items-center justify-center` en className
  - [x] `S.overlay` = `{ background: 'rgba(13,11,20,0.88)' }`

- [x] Task 2 — Titre + accent orange (AC: #2)
  - [x] Remplacer `<h1 className="text-3xl font-bold tracking-widest text-game-text mb-3 animate-fade-in">` par `<h1 style={S.title}>` + `<div style={S.titleAccent} />`
  - [x] Conserver `animate-fade-in` si l'animation est utile (classe CSS non-anti-pattern)
  - [x] `S.title` :
    ```js
    title: {
      fontFamily: 'Bebas Neue, sans-serif',
      fontSize: '2.5rem',
      letterSpacing: '0.15em',
      color: 'var(--rs-text)',
      margin: 0,
      lineHeight: 1,
    },
    titleAccent: {
      width: '32px', height: '2px',
      background: 'var(--rs-orange)',
      marginTop: '6px', marginBottom: '12px',
    },
    ```

- [x] Task 3 — Label "N Revivals Remaining" (cohérence) (AC: cohérence visuelle)
  - [x] Remplacer `className="text-game-text-muted text-sm mb-8"` par `style={S.subLabel}`
  - [x] `S.subLabel` :
    ```js
    subLabel: {
      fontFamily: "'Space Mono', monospace",
      fontSize: '0.75rem',
      color: 'var(--rs-text-muted)',
      marginBottom: '32px',
    },
    ```

- [x] Task 4 — Bouton REVIVE (AC: #3, #5)
  - [x] Remplacer toutes les classes Tailwind sur le bouton REVIVE par `style={S.btnRevive}`
  - [x] Conserver le `onClick={handleRevive}` et `animationDelay` inline
  - [x] `S.btnRevive` :
    ```js
    btnRevive: {
      padding: '16px 32px',
      background: 'var(--rs-bg-raised)',
      border: '1px solid var(--rs-teal)',
      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
      color: 'var(--rs-teal)',
      fontFamily: "'Space Mono', monospace",
      fontSize: '1.1rem',
      letterSpacing: '0.15em',
      cursor: 'pointer',
      transition: 'border-color 150ms, color 150ms, transform 150ms',
      outline: 'none',
      userSelect: 'none',
    },
    ```
  - [x] Ajouter handlers hover :
    ```jsx
    onMouseEnter={(e) => {
      playSFX('button-hover')
      e.currentTarget.style.borderColor = 'var(--rs-teal)'
      e.currentTarget.style.color = 'var(--rs-text)'
      e.currentTarget.style.transform = 'translateX(4px)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--rs-teal)'
      e.currentTarget.style.color = 'var(--rs-teal)'
      e.currentTarget.style.transform = 'translateX(0)'
    }}
    ```
  - [x] Le label `[1]` en bas : `<span style={{ display: 'block', fontSize: '0.65rem', fontFamily: "'Space Mono', monospace", opacity: 0.7, marginTop: 4 }}>[1]</span>`

- [x] Task 5 — Bouton GAME OVER (AC: #4, #5)
  - [x] Remplacer toutes les classes Tailwind sur le bouton GAME OVER par `style={S.btnGameOver}`
  - [x] `S.btnGameOver` :
    ```js
    btnGameOver: {
      padding: '16px 32px',
      background: 'var(--rs-bg-raised)',
      border: '1px solid var(--rs-border)',
      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
      color: 'var(--rs-text-muted)',
      fontFamily: "'Space Mono', monospace",
      fontSize: '1.1rem',
      letterSpacing: '0.15em',
      cursor: 'pointer',
      transition: 'border-color 150ms, color 150ms, transform 150ms',
      outline: 'none',
      userSelect: 'none',
    },
    ```
  - [x] Hover : borderColor → `var(--rs-danger)`, color → `var(--rs-text)`, transform → `translateX(4px)`. onMouseLeave : restaurer `var(--rs-border)` et `var(--rs-text-muted)` explicitement.

### OptionsModal.jsx

- [x] Task 6 — Créer `const S` et migrer l'overlay principal (AC: #6)
  - [x] Ajouter `const S = { ... }` avant `export default function OptionsModal`
  - [x] Le `<div className="absolute inset-0 bg-black/60" />` → `<div style={S.overlay} />`
  - [x] `S.overlay` = `{ position: 'absolute', inset: 0, background: 'rgba(13,11,20,0.88)' }`
  - [x] Garder `position: 'fixed', inset: 0, zIndex: 55, display: 'flex', ...` sur le div racine (ou en className, c'est OK)

- [x] Task 7 — Modal card (AC: #7)
  - [x] Remplacer `className="relative bg-[#0a0a0f] border-2 border-game-primary rounded-lg p-8 w-full max-w-md"` par `style={S.modal}` + `className="relative w-full max-w-md"`
  - [x] `S.modal` :
    ```js
    modal: {
      position: 'relative',
      background: 'var(--rs-bg-surface)',
      border: '1px solid var(--rs-border)',
      clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
      padding: '32px 32px 24px',
    },
    ```

- [x] Task 8 — Titre OPTIONS + accent orange (AC: #8)
  - [x] Remplacer `<h2 className="text-3xl font-bold text-game-text text-center mb-8 tracking-widest select-none">` par :
    ```jsx
    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
      <h2 style={S.title}>OPTIONS</h2>
      <div style={S.titleAccent} />
    </div>
    ```
  - [x] `S.title` = `{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', letterSpacing: '0.15em', color: 'var(--rs-text)', margin: 0, lineHeight: 1 }`
  - [x] `S.titleAccent` = `{ width: '32px', height: '2px', background: 'var(--rs-orange)', marginTop: '6px', marginLeft: 'auto', marginRight: 'auto' }`

- [x] Task 9 — Séparateur (cohérence)
  - [x] `className="border-t border-game-border my-6"` → `style={{ borderTop: '1px solid var(--rs-border)', margin: '24px 0' }}`

- [x] Task 10 — Bouton CLEAR LOCAL SAVE (AC: #10)
  - [x] Remplacer toutes les classes Tailwind par `style={S.btnDanger}`
  - [x] `S.btnDanger` :
    ```js
    btnDanger: {
      width: '100%',
      padding: '12px 0',
      background: 'rgba(239,35,60,0.08)',
      border: '1px solid var(--rs-danger)',
      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
      color: 'var(--rs-danger)',
      fontFamily: "'Space Mono', monospace",
      fontSize: '0.75rem',
      letterSpacing: '0.12em',
      cursor: 'pointer',
      transition: 'border-color 150ms, color 150ms, transform 150ms',
      outline: 'none',
      userSelect: 'none',
      marginBottom: '8px',
    },
    ```
  - [x] Hover : `translateX(4px)` + borderColor → `var(--rs-danger)` + color → `var(--rs-text)`

- [x] Task 11 — Bouton [ESC] BACK (AC: #11)
  - [x] Remplacer toutes les classes Tailwind par `style={S.backBtn}` — **pattern identique à CreditsModal.jsx** (source : ligne 131–146)
  - [x] Garder `ref={backButtonRef}`
  - [x] `S.backBtn` (même valeurs que CreditsModal) :
    ```js
    backBtn: {
      width: '100%',
      padding: '10px 0',
      background: 'transparent',
      border: '1px solid var(--rs-border)',
      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
      color: 'var(--rs-text-muted)',
      fontFamily: "'Space Mono', monospace",
      fontSize: '0.72rem',
      letterSpacing: '0.1em',
      cursor: 'pointer',
      transition: 'border-color 150ms, color 150ms, transform 150ms',
      outline: 'none',
    },
    ```
  - [x] Hover (pattern CreditsModal exact) :
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

- [x] Task 12 — Dialog confirmation overlay + card (AC: #12)
  - [x] Overlay confirmation `className="absolute inset-0 bg-black/80"` → `style={{ position: 'absolute', inset: 0, background: 'rgba(13,11,20,0.92)' }}`
  - [x] Dialog card `className="relative bg-[#0a0a0f] border-2 border-game-danger rounded-lg p-6 max-w-sm"` → `style={S.confirmCard}` + `className="relative max-w-sm"`
  - [x] `S.confirmCard` :
    ```js
    confirmCard: {
      position: 'relative',
      background: 'var(--rs-bg-surface)',
      border: '1px solid var(--rs-danger)',
      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
      padding: '24px',
    },
    ```

- [x] Task 13 — Boutons CANCEL + CLEAR DATA (AC: #13)
  - [x] CANCEL : remplacer `border border-game-border rounded text-game-text-muted hover:border-game-accent hover:text-game-text` par clip-path 8px + hover translateX
    ```js
    btnCancel: {
      flex: 1, padding: '8px 0',
      background: 'transparent',
      border: '1px solid var(--rs-border)',
      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
      color: 'var(--rs-text-muted)',
      fontFamily: "'Space Mono', monospace",
      fontSize: '0.72rem', letterSpacing: '0.1em',
      cursor: 'pointer',
      transition: 'border-color 150ms, color 150ms, transform 150ms',
      outline: 'none',
    },
    ```
  - [x] CLEAR DATA : `rounded bg-game-danger text-white hover:bg-red-700` → clip-path 8px + fond `var(--rs-danger)` + couleur blanche
    ```js
    btnClearData: {
      flex: 1, padding: '8px 0',
      background: 'var(--rs-danger)',
      border: '1px solid var(--rs-danger)',
      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
      color: 'var(--rs-text)',
      fontFamily: "'Space Mono', monospace",
      fontSize: '0.72rem', letterSpacing: '0.12em', fontWeight: 700,
      cursor: 'pointer',
      transition: 'opacity 150ms, transform 150ms',
      outline: 'none',
    },
    ```
  - [x] Hover CANCEL : `translateX(4px)` + `borderColor: 'var(--rs-orange)'`
  - [x] Hover CLEAR DATA : `translateX(4px)` + opacity légèrement réduite

- [x] Task 14 — VolumeSlider : labels (AC: #9)
  - [x] Dans `VolumeSlider`, `<label className="block text-game-text text-sm mb-1 select-none">` → style inline Space Mono 0.65rem UPPERCASE `var(--rs-text-muted)` :
    ```jsx
    <label style={{ display: 'block', fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--rs-text-muted)', textTransform: 'uppercase', marginBottom: '6px', userSelect: 'none' }}>
    ```
  - [x] Value display `<span className="text-game-text tabular-nums w-10 text-right text-sm select-none">` → style inline Rajdhani `var(--rs-text-muted)` :
    ```jsx
    <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.9rem', color: 'var(--rs-text-muted)', tabularNums: 'tabular-nums', minWidth: '40px', textAlign: 'right', userSelect: 'none' }}>
    ```

- [x] Task 15 — Tests (AC: #14, #15)
  - [x] `vitest run` → `src/ui/__tests__/OptionsModal.test.js` passe : les exports `readAudioSettings`, `saveAudioSettings`, `clampVolume` restent en place — aucune modification de logique
  - [x] `vitest run` → `src/stores/__tests__/useGame.revive.test.js` passe : teste le store uniquement — aucun style inspecté
  - [x] Vérification manuelle : aucun `rounded`, aucun `scale`, aucun `bg-black/60`, aucun `bg-game-*` ni `border-game-*` Tailwind dans les deux composants

## Dev Notes

### Fichiers à modifier

Deux fichiers uniquement :
- `src/ui/RevivePrompt.jsx`
- `src/ui/modals/OptionsModal.jsx`

Aucune modification de `src/style.css` — toutes les variables `--rs-*` nécessaires sont déjà définies.

### Fichiers de référence OBLIGATOIRES

1. **`src/ui/modals/CreditsModal.jsx`** — patron DS complet : `const S`, overlay `rgba(13,11,20,0.88)`, titre + accent, clip-path, hover translateX, `var(--rs-*)` partout. Le `backBtn` et son hover dans CreditsModal sont à copier **exactement** pour le [ESC] BACK d'OptionsModal.
2. **`src/ui/TunnelHub.jsx`** (Story 39.3) — même pattern de migration Tailwind → inline styles avec `const S`
3. **`src/ui/MainMenu.jsx`** (Story 39.1) — migration buttons avec clip-path 8px + hover translateX

### Anti-patterns actuels identifiés (avec lignes)

#### RevivePrompt.jsx

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 67 | `bg-black/60 font-game` sur overlay | `style={S.overlay}` = `rgba(13,11,20,0.88)` |
| 69 | `text-3xl font-bold tracking-widest text-game-text` | Bebas Neue 2.5rem + div accent orange |
| 74 | `text-game-text-muted text-sm mb-8` | Space Mono 0.65rem `var(--rs-text-muted)` |
| 84-88 | `bg-game-bg-medium border-2 border-game-accent rounded-lg hover:bg-game-accent hover:scale-105 transition-all` | clip-path 8px + `var(--rs-teal)` + hover translateX |
| 98-101 | `bg-game-bg-medium border-2 border-game-border rounded-lg hover:border-game-text hover:scale-105 transition-all` | clip-path 8px + `var(--rs-border)` + hover → `var(--rs-danger)` |

#### OptionsModal.jsx

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 140 | `absolute inset-0 bg-black/60` (overlay div) | `style={{ position:'absolute', inset:0, background:'rgba(13,11,20,0.88)' }}` |
| 143 | `relative bg-[#0a0a0f] border-2 border-game-primary rounded-lg p-8` | `style={S.modal}` = `var(--rs-bg-surface)` + clip-path 16px + `var(--rs-border)` |
| 144 | `text-3xl font-bold text-game-text text-center mb-8 tracking-widest` | Bebas Neue 2.5rem + div accent orange |
| 172 | `border-t border-game-border my-6` | `style={{ borderTop:'1px solid var(--rs-border)', margin:'24px 0' }}` |
| 176-180 | `w-full py-3 ... rounded bg-game-danger/20 border border-game-danger text-game-danger hover:bg-game-danger` | clip-path 8px + `var(--rs-danger)` + hover translateX |
| 192-195 | `border border-game-border rounded text-game-text-muted hover:border-game-accent hover:text-game-text` | clip-path 8px + hover translateX (pattern CreditsModal) |
| 214 | `absolute inset-0 bg-black/80` (confirmation overlay) | `rgba(13,11,20,0.92)` |
| 215 | `relative bg-[#0a0a0f] border-2 border-game-danger rounded-lg p-6` | clip-path 10px + `var(--rs-bg-surface)` + `border: 1px solid var(--rs-danger)` |
| 222-225 | `border border-game-border rounded text-game-text-muted hover:border-game-accent` (CANCEL) | clip-path 8px + hover translateX |
| 236-239 | `rounded bg-game-danger text-white hover:bg-red-700` (CLEAR DATA) | clip-path 8px + `var(--rs-danger)` background |
| 256 | `block text-game-text text-sm mb-1` (VolumeSlider label) | Space Mono 0.65rem UPPERCASE `var(--rs-text-muted)` |
| 270 | `text-game-text tabular-nums w-10 text-right text-sm` (VolumeSlider value) | Rajdhani `var(--rs-text-muted)` |

### Patterns clip-path standard (rappel)

```
Modal pleine  : polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)
Panel/card    : polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)
Bouton/petit  : polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)
```

Le coin coupé est **toujours en haut-droite**.

### Variables CSS disponibles (vérifiées dans style.css)

```
--rs-bg-surface:  #1a1528    modals, panels
--rs-bg-raised:   #241d35    éléments interactifs (remplace bg-game-bg-medium)
--rs-border:      #2e2545    bordures neutres
--rs-text:        #f5f0e8    texte principal
--rs-text-muted:  #7a6d8a    texte secondaire
--rs-orange:      #ff4f1f    accent principal / hover BACK button
--rs-teal:        #00b4d8    navigation, action positive (REVIVE)
--rs-danger:      #ef233c    HP, avertissement, CLEAR DATA, GAME OVER hover
--rs-success:     #2dc653    confirmation
```

### Learnings des stories précédentes (39.2 + 39.3)

- **`e.currentTarget.style.borderColor` override `borderLeft`** quand appliqué au hover — au `onMouseLeave`, restaurer explicitement avec la valeur originale (ex: `'var(--rs-teal)'` pour le bouton REVIVE, pas juste `''`)
- **`const S` avant le composant** — centralise tous les styles, évite les répétitions inline dans JSX. Pour OptionsModal, le `const S` va avant `export default function OptionsModal`.
- **VolumeSlider** est un sous-composant dans le même fichier — ses styles inline n'ont pas besoin d'être dans `const S` (trop couplés au sous-composant). Les mettre directement dans le JSX de `VolumeSlider` est acceptable.
- **Les classes Tailwind de layout structurel peuvent rester** (`flex`, `items-center`, `gap-3`, `flex-1`, `space-y-5`, `fixed inset-0`, etc.) — seules les classes de **couleur, border, radius, shadow, scale** migrent en inline style.
- **Ne pas oublier** que `readAudioSettings`, `saveAudioSettings`, `clampVolume` sont **exportées** depuis OptionsModal.jsx et testées — elles ne bougent pas.

### Comportement hover bouton REVIVE (précision learning 39.2)

Le bouton REVIVE a `border: 1px solid var(--rs-teal)` en état de base. Au hover, on ne change pas la bordure (déjà teal), on change seulement la couleur du texte et on applique `translateX(4px)`. Au `onMouseLeave`, restaurer explicitement `color: 'var(--rs-teal)'` et `transform: 'translateX(0)'`.

### Structure du composant après migration

Les deux composants gardent leur structure logique identique — uniquement les styles visuels changent. La logique de revive, les handlers keyboard, le focus trap d'OptionsModal, la gestion du localStorage restent intacts.

### Tests — aucun test à modifier

- `src/ui/__tests__/OptionsModal.test.js` : teste uniquement `readAudioSettings`, `saveAudioSettings`, `clampVolume` — fonctions purement logiques, aucun style inspecté. Doivent passer sans modification.
- `src/stores/__tests__/useGame.revive.test.js` : teste le store Zustand `useGame` (phases `revive`, `gameplay`, `gameOver`) — aucun composant React ni style inspecté. Doit passer sans modification.
- Aucun nouveau test à écrire pour des changements purement visuels.

### Project Structure Notes

- Deux fichiers uniquement : `src/ui/RevivePrompt.jsx` et `src/ui/modals/OptionsModal.jsx`
- Pas de modifications dans `src/style.css`
- `src/ui/modals/` est le dossier des modales — OptionsModal y est déjà, CreditsModal aussi

### References

- [Source: _bmad-output/planning-artifacts/epic-39-redshift-ui-full-pass.md#Story 39.4]
- [Source: src/ui/modals/CreditsModal.jsx — patron DS complet (const S, backBtn hover, overlay)]
- [Source: src/ui/RevivePrompt.jsx — fichier cible analysé ligne par ligne]
- [Source: src/ui/modals/OptionsModal.jsx — fichier cible analysé ligne par ligne]
- [Source: src/style.css — variables --rs-* vérifiées]
- [Source: _bmad-output/implementation-artifacts/39-3-tunnelhub-redshift-pass.md — learnings story précédente]
- [Source: src/ui/__tests__/OptionsModal.test.js — tests logique utilitaire uniquement]
- [Source: src/stores/__tests__/useGame.revive.test.js — tests store uniquement]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_none_

### Completion Notes List

- Migrated `src/ui/RevivePrompt.jsx` to Redshift DS: overlay `rgba(13,11,20,0.88)`, Bebas Neue title + orange accent, Space Mono subLabel, clip-path 8px buttons (teal REVIVE / border→danger GAME OVER), hover translateX pattern
- Migrated `src/ui/modals/OptionsModal.jsx` to Redshift DS: overlay RS, modal clip-path 16px + `var(--rs-bg-surface)`, Bebas Neue title + accent, separator inline, btnDanger clip-path + danger token, backBtn = CreditsModal exact pattern, confirmCard clip-path 10px + danger border, btnCancel + btnClearData clip-path 8px
- VolumeSlider: label → Space Mono 0.65rem UPPERCASE `var(--rs-text-muted)`, value → Rajdhani `var(--rs-text-muted)`
- `readAudioSettings`, `saveAudioSettings`, `clampVolume` exports left intact
- 28/28 tests pass (16 OptionsModal + 12 useGame.revive). Zero regressions.

### File List

- src/ui/RevivePrompt.jsx
- src/ui/modals/OptionsModal.jsx

### Change Log

- 2026-02-24: Redshift design system pass — RevivePrompt + OptionsModal migrated from Tailwind game-* classes to inline RS var() styles, clip-path buttons, hover translateX pattern (Story 39.4)
