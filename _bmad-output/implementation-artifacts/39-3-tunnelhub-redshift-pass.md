# Story 39.3: TunnelHub Redshift pass

Status: done

## Story

As a player,
I want the wormhole tunnel screen to use the full Redshift design language,
So that this critical transition moment feels as polished as the rest of the game.

## Acceptance Criteria

1. **Given** `TunnelHub.jsx` **When** le joueur est dans le tunnel **Then** le panel droit utilise `var(--rs-bg-surface)` (pas `bg-[#0a0a0f]/90`) + `border-left: 1px solid var(--rs-border)` (pas `border-game-border`).

2. **And** le titre "WORMHOLE TUNNEL" utilise Bebas Neue + ligne accent orange 32×2px.

3. **And** le label "ENTERING SYSTEM X" utilise Space Mono 0.65rem UPPERCASE `var(--rs-text-muted)`.

4. **And** `#cc66ff` (diamant fragments) → `var(--rs-violet)`.

5. **And** `#ff9944` (dilemme) → `var(--rs-orange)`.

6. **And** la card dilemme utilise clip-path 10px + `var(--rs-border-hot)` + fond `rgba(255,79,31,0.05)` — pas de `rounded-lg` ni de `border-[#ff9944]/60`.

7. **And** le `&#9888;` (⚠) est remplacé par un SVG inline (triangle warning 12×12).

8. **And** les boutons Accept/Refuse du dilemme utilisent clip-path 8px + hover `translateX(4px)` — pas de `rounded`.

9. **And** les upgrade buttons utilisent clip-path 8px + hover translateX + `var(--rs-orange)` pour `canAfford` — pas de `border-game-accent rounded`.

10. **And** le bouton "ENTER SYSTEM →" utilise clip-path 8px + hover translateX + `var(--rs-teal)` (navigation = teal).

11. **And** `border-game-success` → `var(--rs-success)`, `border-game-danger` → `var(--rs-danger)`.

12. **Given** `vitest run` **When** la story est implémentée **Then** tous les tests `tunnelHub.integration.test.js` passent.

## Tasks / Subtasks

- [x] Task 1 — Créer l'objet `const S` et migrer le panel droit (AC: #1)
  - [x] Ajouter `const S = { ... }` en haut du composant (après les imports, avant `export function computeCanEnterSystem`)
  - [x] Supprimer les classes `bg-[#0a0a0f]/90 border-l border-game-border` du panel droit (ligne 175)
  - [x] Appliquer `style={S.panel}` avec `{ background: 'var(--rs-bg-surface)', borderLeft: '1px solid var(--rs-border)' }`
  - [x] Conserver `w-1/3 flex flex-col p-5 overflow-y-auto` (structure Tailwind OK, seulement les couleurs changent)

- [x] Task 2 — Titre + accent orange (AC: #2)
  - [x] Remplacer le `<h1 className="text-game-text font-bold tracking-[0.2em] ...">` par styles inline Bebas Neue
  - [x] Ajouter la div accent orange 32×2px sous le titre
  - [x] Structure cible :
    ```jsx
    <h1 style={S.title}>WORMHOLE TUNNEL</h1>
    <div style={S.titleAccent} />
    ```
    ```js
    title: {
      fontFamily: 'Bebas Neue, sans-serif',
      fontSize: 'clamp(18px, 2vw, 28px)',
      letterSpacing: '0.2em',
      color: 'var(--rs-text)',
      margin: 0,
      lineHeight: 1,
      textAlign: 'center',
      userSelect: 'none',
    },
    titleAccent: {
      width: '32px', height: '2px',
      background: 'var(--rs-orange)',
      margin: '6px auto 8px',
    },
    ```

- [x] Task 3 — Label "ENTERING SYSTEM X" (AC: #3)
  - [x] Remplacer `className="text-game-text-muted text-xs tracking-widest text-center mb-2 select-none"` par style inline Space Mono
  - [x] Style cible :
    ```js
    systemLabel: {
      fontFamily: "'Space Mono', monospace",
      fontSize: '0.65rem',
      letterSpacing: '0.1em',
      color: 'var(--rs-text-muted)',
      textTransform: 'uppercase',
      textAlign: 'center',
      marginBottom: 8,
      userSelect: 'none',
    },
    ```

- [x] Task 4 — Fragment diamond `#cc66ff` → `var(--rs-violet)` (AC: #4)
  - [x] Ligne 194 : `className="text-[#cc66ff]"` → `style={{ color: 'var(--rs-violet)' }}`

- [x] Task 5 — Section Dilemma : couleur + card + SVG warning (AC: #5, #6, #7)
  - [x] Titre `text-[#ff9944]` → `style={{ color: 'var(--rs-orange)', ... }}` avec Space Mono
  - [x] Remplacer `&#9888;` par SVG inline triangle warning 12×12 : composant `<WarningIcon />`
  - [x] Card dilemma active : remplacer `border-2 border-[#ff9944]/60 rounded-lg` par clip-path 10px + `var(--rs-border-hot)` + fond `rgba(255,79,31,0.05)`
  - [x] Card dilemma résolue/absente : remplacer `border border-game-border rounded` par `S.emptyCard` (clip-path 8px + `var(--rs-border)`)

- [x] Task 6 — Boutons Accept / Refuse (AC: #8, #11)
  - [x] Remplacer `border-2 border-game-success/50 rounded` sur Accept par clip-path 8px + `border: '1px solid var(--rs-success)'`
  - [x] Remplacer `border-2 border-game-danger/50 rounded` sur Refuse par clip-path 8px + `border: '1px solid var(--rs-danger)'`
  - [x] Supprimer `hover:bg-game-success/10 hover:border-game-success` Tailwind → `onMouseEnter/Leave` inline avec `translateX(4px)` + borderColor
  - [x] Pattern hover pour Accept avec `var(--rs-success)`
  - [x] Pattern hover pour Refuse avec `var(--rs-danger)`

- [x] Task 7 — Upgrade buttons (AC: #9)
  - [x] Remplacer `border rounded` → clip-path 8px sur les 3 états (justPurchased / canAfford / cannot)
  - [x] `border-game-accent` → `var(--rs-orange)` pour l'état `canAfford` hover
  - [x] `border-game-success/20 scale-[1.02]` (justPurchased) → `var(--rs-success)` + pas de scale, `background: 'rgba(45,198,83,0.1)'`
  - [x] Supprimer `transition-all` Tailwind sur les buttons, gérer via onMouseEnter/Leave inline
  - [x] `text-[#cc66ff]` sur le coût fragment → `canAfford ? 'var(--rs-orange)' : 'var(--rs-text-muted)'`
  - [x] Hover uniquement si canAfford : `borderColor: 'var(--rs-orange)'` + `transform: 'translateX(4px)'`

- [x] Task 8 — Bouton "ENTER SYSTEM →" (AC: #10)
  - [x] Remplacer `border border-game-border rounded hover:border-game-accent hover:scale-[1.02] hover:bg-game-accent/10` par clip-path 8px + `var(--rs-teal)` en état actif
  - [x] Hover si `canEnterSystem` : `translateX(4px)` + `borderColor: 'var(--rs-teal)'`

- [x] Task 9 — État vide "All upgrades purchased" (cohérence)
  - [x] `border border-game-border rounded p-2` → `style={S.emptyCard}` (clip-path 8px + `var(--rs-border)`)
  - [x] État dilemma absent/résolu aussi migré vers `S.emptyCard`

- [x] Task 10 — Tests (AC: #12)
  - [x] `vitest run` → `tunnelHub.integration.test.js` passe : 30/30 tests ✅
  - [x] Vérification visuelle : aucun `rounded`, aucun `scale`, aucun `#cc66ff` ni `#ff9944` hardcodé, aucun `border-game-*` Tailwind

## Dev Notes

### Fichier à modifier

Un seul fichier : `src/ui/TunnelHub.jsx`

Aucun ajout dans `src/style.css` — `--rs-border-hot` est déjà défini à `rgba(255, 79, 31, 0.4)`.

### Fichiers de référence OBLIGATOIRES

1. **`src/ui/modals/CreditsModal.jsx`** — patron DS complet : `const S`, overlay, titre + accent, clip-path, hover translateX, `var(--rs-*)` partout
2. **`src/ui/PlanetRewardModal.jsx`** (Story 39.2) — même pattern de migration Tailwind → inline styles
3. **`src/ui/MainMenu.jsx`** (Story 39.1) — migration buttons avec clip-path 8px + hover translateX

### Anti-patterns actuels dans TunnelHub.jsx (avec lignes)

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 175 | `bg-[#0a0a0f]/90 border-l border-game-border` | `var(--rs-bg-surface)` + `var(--rs-border)` inline style |
| 178-180 | `text-game-text font-bold tracking-[0.2em]` | Bebas Neue inline + div accent orange 32×2px |
| 185-187 | `text-game-text-muted text-xs tracking-widest` | Space Mono 0.65rem `var(--rs-text-muted)` inline |
| 194 | `text-[#cc66ff]` diamant | `style={{ color: 'var(--rs-violet)' }}` |
| 201 | `text-[#ff9944]` + `&#9888;` | `var(--rs-orange)` + SVG triangle warning inline |
| 203 | `border border-game-border rounded` | clip-path 8px + `var(--rs-border)` |
| 207 | `border-2 border-[#ff9944]/60 rounded-lg` | clip-path 10px + `var(--rs-border-hot)` + fond `rgba(255,79,31,0.05)` |
| 213-216 | `border-2 border-game-success/50 rounded text-game-success hover:bg-game-success/10` | clip-path 8px + `var(--rs-success)` + hover translateX |
| 222-225 | `border-2 border-game-danger/50 rounded text-game-danger hover:bg-game-danger/10` | clip-path 8px + `var(--rs-danger)` + hover translateX |
| 240 | `border border-game-border rounded` | clip-path 8px + `var(--rs-border)` |
| 251-257 | `border rounded border-game-accent` | clip-path 8px + hover translateX |
| 265 | `text-[#cc66ff]` coût upgrade | `canAfford ? 'var(--rs-orange)' : 'var(--rs-text-muted)'` |
| 286-291 | `border rounded hover:border-game-accent hover:scale-[1.02]` | clip-path 8px + `var(--rs-teal)` + hover translateX |

### Pattern `const S` attendu (à placer avant `export function computeCanEnterSystem`)

```jsx
const S = {
  panel: {
    // w-1/3 flex flex-col p-5 overflow-y-auto conservés en className
    background: 'var(--rs-bg-surface)',
    borderLeft: '1px solid var(--rs-border)',
  },
  title: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: 'clamp(18px, 2vw, 28px)',
    letterSpacing: '0.2em',
    color: 'var(--rs-text)',
    margin: 0,
    lineHeight: 1,
    textAlign: 'center',
    userSelect: 'none',
  },
  titleAccent: {
    width: '32px',
    height: '2px',
    background: 'var(--rs-orange)',
    margin: '6px auto 8px',
  },
  systemLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    color: 'var(--rs-text-muted)',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
    userSelect: 'none',
  },
  fragLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    color: 'var(--rs-text-muted)',
    textTransform: 'uppercase',
  },
  sectionLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    color: 'var(--rs-text-muted)',
    textTransform: 'uppercase',
    marginBottom: 6,
    userSelect: 'none',
  },
  dilemmaCard: {
    border: '1px solid var(--rs-border-hot)',
    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
    padding: 12,
    background: 'rgba(255,79,31,0.05)',
  },
  emptyCard: {
    border: '1px solid var(--rs-border)',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    padding: '12px',
    color: 'var(--rs-text-muted)',
    fontSize: '0.75rem',
    textAlign: 'center',
    userSelect: 'none',
  },
  btnBase: {
    background: 'transparent',
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 150ms, color 150ms, transform 150ms',
    userSelect: 'none',
  },
}
```

### SVG Warning inline (remplace `&#9888;`)

```jsx
const WarningIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
    style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }}>
    <path d="M6 1.5L11 10.5H1L6 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
  </svg>
)
```

Placer ce composant mini juste après `const S` dans le fichier (pas d'import externe nécessaire).

### Pattern hover bouton (référence CreditsModal)

```jsx
onMouseEnter={(e) => {
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

Adapter les couleurs selon le type de bouton : teal pour Enter System, success/danger pour Accept/Refuse, orange pour upgrades.

### Patterns clip-path standard

```
Panel/card intermédiaire : polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)
Bouton/petit élément : polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)
```

### Variables CSS disponibles dans style.css (vérifiées)

```
--rs-bg-surface:  #1a1528
--rs-border:      #2e2545
--rs-border-hot:  rgba(255, 79, 31, 0.4)   ← déjà défini
--rs-text:        #f5f0e8
--rs-text-muted:  #7a6d8a
--rs-text-dim:    #4a3f5c
--rs-orange:      #ff4f1f
--rs-violet:      #9b5de5
--rs-teal:        #00b4d8
--rs-success:     #2dc653
--rs-danger:      #ef233c
```

### Structure du composant après migration

Le composant garde sa structure logique identique — uniquement les styles visuels changent. Les `className` de layout (`w-1/3 flex flex-col p-5 overflow-y-auto`, `grid grid-cols-2 gap-1.5`, `flex gap-2`, etc.) peuvent rester en Tailwind car ils sont structurels. Seules les classes de **couleur, border, radius, shadow, scale** sont migrées en inline style.

### Tests

`src/stores/__tests__/tunnelHub.integration.test.js` teste uniquement la logique des stores (achat d'upgrade, résolution de dilemme, transitions). Aucun style n'est inspecté → aucun test à modifier. `vitest run` doit passer sans changement de test.

### Learnings depuis Story 39.2 (PlanetRewardModal)

- `e.currentTarget.style.borderColor` override `borderLeft` quand appliqué au hover — au `onMouseLeave`, restaurer explicitement avec la couleur originale (ex: `'var(--rs-success)'` pour Accept)
- `const S` évite les répétitions inline dans JSX — centraliser avant le composant
- Les classes Tailwind de layout structurel (`flex`, `grid`, `p-X`, `gap-X`, `w-*`) peuvent rester — seules les couleurs/formes migrent
- `--rs-border-hot` est déjà à `0.4` d'opacité dans style.css (pas `0.6` comme dans l'epic doc) — utiliser la valeur existante

### Project Structure Notes

- Un seul fichier modifié : `src/ui/TunnelHub.jsx`
- Pas de modifications dans `src/style.css` (toutes les variables nécessaires sont déjà présentes)
- Composants de référence à lire avant implem : `CreditsModal.jsx`, `MainMenu.jsx` (39.1)

### References

- [Source: _bmad-output/planning-artifacts/epic-39-redshift-ui-full-pass.md#Story 39.3]
- [Source: src/ui/modals/CreditsModal.jsx — patron DS complet]
- [Source: src/ui/TunnelHub.jsx — fichier cible (analysé ligne par ligne)]
- [Source: src/style.css — variables CSS --rs-* vérifiées]
- [Source: _bmad-output/implementation-artifacts/39-2-planetrewardmodal-levelup-alignment.md — learnings story précédente]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_none_

### Completion Notes List

- Migrated `src/ui/TunnelHub.jsx` to full Redshift design system
- Added `const S` style object before `computeCanEnterSystem` export
- Added `<WarningIcon>` mini-component replacing `&#9888;` HTML entity
- Panel right: `var(--rs-bg-surface)` bg + `var(--rs-border)` borderLeft (was Tailwind `bg-[#0a0a0f]/90 border-game-border`)
- Title: Bebas Neue inline + 32×2px orange accent div
- System label: Space Mono 0.65rem `var(--rs-text-muted)`
- Fragment diamond: `var(--rs-violet)` (was hardcoded `#cc66ff`)
- Dilemma card: clip-path 10px + `var(--rs-border-hot)` + `rgba(255,79,31,0.05)` bg
- Empty/resolved states: `S.emptyCard` (clip-path 8px + `var(--rs-border)`)
- Accept/Refuse buttons: clip-path 8px + success/danger tokens + hover translateX(4px)
- Upgrade buttons: clip-path 8px, orange for canAfford cost, hover translateX
- Enter System button: clip-path 8px + `var(--rs-teal)`, hover translateX
- All 30 tunnelHub.integration tests pass. No regressions introduced.

### File List

- src/ui/TunnelHub.jsx

### Change Log

- 2026-02-24: Redshift design system pass — migrated all Tailwind color/border/radius classes to inline RS vars, added clip-path buttons, SVG warning icon, const S style object (Story 39.3)
