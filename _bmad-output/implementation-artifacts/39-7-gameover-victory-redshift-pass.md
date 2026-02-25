# Story 39.7: GameOverScreen + VictoryScreen Redshift pass

Status: done

## Story

As a player,
I want the game over and victory screens to use strong Redshift typography and button styles,
So that both ending moments feel dramatic and visually consistent.

## Acceptance Criteria

1. **Given** `GameOverScreen.jsx` et `VictoryScreen.jsx` **When** la séquence cinématique se déroule **Then** le fond opaque utilise `var(--rs-bg)` (#0d0b14) — pas `bg-black` pur.

2. **And** le message principal (taunt / victory) utilise Bebas Neue + `clamp(3rem, 8vw, 5rem)` + `letterSpacing: '0.15em'`.

3. **And** "NEW HIGH SCORE!" utilise `var(--rs-gold)` + animation pulse (justifiée narrativement) — pas `text-game-accent`.

4. **And** les boutons d'action ([R] RETRY, [M] MENU, [R] NEW RUN etc.) utilisent clip-path 8px + hover `translateX(4px)` + `borderColor → var(--rs-orange)` — pas de `rounded hover:scale-105`.

5. **And** aucun `bg-game-accent/10` sur hover — le pattern est translateX + border color change.

6. **Given** `vitest run` **When** la story est implémentée **Then** `GameOverScreen.test.jsx` et `VictoryScreen.test.jsx` passent sans modification.

## Tasks / Subtasks

### GameOverScreen.jsx — `const S` et styles partagés

- [x] Task 1 — Créer `const S` avant `export default function GameOverScreen()` (AC: tous)
  - [x] Définir l'objet `S` à portée module, après les imports
  - [x] Inclure : `S.mainTitle`, `S.highScoreLabel`, `S.actionBtn`
  - [x] `S.mainTitle` :
    ```js
    mainTitle: {
      fontFamily: 'Bebas Neue, sans-serif',
      fontSize: 'clamp(3rem, 8vw, 5rem)',
      letterSpacing: '0.15em',
      color: 'var(--rs-text)',
      textAlign: 'center',
      margin: 0,
      lineHeight: 1,
      userSelect: 'none',
    },
    ```
  - [x] `S.highScoreLabel` :
    ```js
    highScoreLabel: {
      color: 'var(--rs-gold)',
      fontFamily: 'Bebas Neue, sans-serif',
      fontSize: 'clamp(1rem, 2vw, 1.75rem)',
      letterSpacing: '0.2em',
      userSelect: 'none',
      marginTop: '24px',
    },
    ```
  - [x] `S.actionBtn` :
    ```js
    actionBtn: {
      padding: '12px 24px',
      background: 'transparent',
      border: '1px solid var(--rs-border)',
      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
      color: 'var(--rs-text-muted)',
      fontFamily: "'Space Mono', monospace",
      fontSize: 'clamp(12px, 1.3vw, 16px)',
      letterSpacing: '0.1em',
      cursor: 'pointer',
      transition: 'border-color 150ms, color 150ms, transform 150ms',
      outline: 'none',
      userSelect: 'none',
    },
    ```

### GameOverScreen.jsx — Fond opaque

- [x] Task 2 — Migrer le fond "fade to black" (AC: #1)
  - [x] Remplacé `bg-black` par `backgroundColor: 'var(--rs-bg)'` en inline style
  - [x] Les overlays white flash et transition fade restent inchangés

### GameOverScreen.jsx — Titre taunt

- [x] Task 3 — Migrer le message taunt principal (AC: #2)
  - [x] Remplacé par `className="animate-fade-in"` + `style={S.mainTitle}`
  - [x] `font-bold`, `text-game-text`, `text-center` supprimés des classes

### GameOverScreen.jsx — "NEW HIGH SCORE!"

- [x] Task 4 — Migrer le label high score (AC: #3)
  - [x] Remplacé par `className="animate-pulse"` + `style={S.highScoreLabel}`
  - [x] `text-game-accent` supprimé — remplacé par `color: 'var(--rs-gold)'`
  - [x] `animate-pulse` conservé

### GameOverScreen.jsx — Boutons d'action

- [x] Task 5 — Migrer les boutons [R] RETRY et [M] MENU (AC: #4, #5)
  - [x] Remplacé className+style par `style={S.actionBtn}`
  - [x] Handlers hover complets avec playSFX + translateX + borderColor
  - [x] `rounded`, `hover:scale-105`, `hover:bg-game-accent/10` supprimés

---

### VictoryScreen.jsx — `const S` et styles partagés

- [x] Task 6 — Créer `const S` avant `export default function VictoryScreen()` (AC: tous)
  - [x] Même structure que GameOverScreen — mêmes valeurs (`S.mainTitle`, `S.highScoreLabel`, `S.actionBtn`)

### VictoryScreen.jsx — Fond opaque

- [x] Task 7 — Migrer le fond sombre (AC: #1)
  - [x] Remplacé `bg-black` + `opacity: 0.9` par `backgroundColor: 'var(--rs-bg)'` + `opacity: 0.95`
  - [x] Fade overlay action transitions inchangé

### VictoryScreen.jsx — Titre victory

- [x] Task 8 — Migrer le message victory principal (AC: #2)
  - [x] Remplacé par `className="animate-fade-in"` + `style={S.mainTitle}`
  - [x] `letterSpacing` standardisé à `0.15em`

### VictoryScreen.jsx — "NEW HIGH SCORE!"

- [x] Task 9 — Migrer le label high score (AC: #3)
  - [x] Remplacé par `className="animate-pulse"` + `style={S.highScoreLabel}`

### VictoryScreen.jsx — Boutons d'action

- [x] Task 10 — Migrer les boutons [R] NEW RUN et [M] MENU (AC: #4, #5)
  - [x] `style={S.actionBtn}` + handlers hover complets sur les deux boutons
  - [x] `handleNewRun` conservé pour le premier bouton

### Tests + vérification finale

- [x] Task 11 — Validation (AC: #6)
  - [x] `vitest run src/ui/__tests__/GameOverScreen.test.jsx` → 6 tests passent
  - [x] `vitest run src/ui/__tests__/VictoryScreen.test.jsx` → 12 tests passent
  - [x] Aucun `rounded`, `scale`, `game-accent`, `game-border`, `game-text` dans les deux fichiers

## Dev Notes

### Fichiers à modifier

Deux fichiers uniquement :
- `src/ui/GameOverScreen.jsx`
- `src/ui/VictoryScreen.jsx`

Aucune modification de tests, de `src/style.css`, ni d'autres fichiers.

### Fichiers de référence OBLIGATOIRES

1. **`src/ui/modals/CreditsModal.jsx`** — patron DS complet : `const S`, clip-path, hover translateX. Pattern `backBtn` à reproduire exactement pour les `actionBtn`.
2. **`src/ui/GalaxyChoice.jsx`** (Story 39.6) — migration récente, même pattern `actionBtn` (BACK button = même style que ces boutons d'action).

### Structure cinématique de GameOverScreen — attention aux overlays multiples

GameOverScreen utilise **3 overlays** superposés :

| Overlay | Classe actuelle | Rôle | Action |
|---------|----------------|------|--------|
| White flash (z-50) | `bg-white` | Coup de flash blanc mort | **Ne pas modifier** |
| Fade to black (z-50) | `bg-black` opacity stage | Fondu noir narratif | **→ `var(--rs-bg)`** |
| Transition fade (z-[60]) | `bg-black` | Fadeout avant retry/menu | **Ne pas modifier** |

Seul l'overlay "fade to black" (l'overlay narratif principal) doit utiliser `var(--rs-bg)`. Les deux autres sont des overlays de transition fonctionnels.

### Anti-patterns identifiés ligne par ligne

**GameOverScreen.jsx :**

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 131 | `bg-black` (fade to black overlay) | `backgroundColor: 'var(--rs-bg)'` inline |
| 149 | `text-game-text font-bold` (taunt h1, sans Bebas Neue) | `style={S.mainTitle}` |
| 150-153 | `fontSize: 'clamp(24px, 3vw, 48px)'` (trop petit) | `clamp(3rem, 8vw, 5rem)` dans `S.mainTitle` |
| 162 | `text-game-accent` (NEW HIGH SCORE!) | `color: 'var(--rs-gold)'` dans `S.highScoreLabel` |
| 190 | `border-game-border rounded hover:border-game-accent hover:scale-105 hover:bg-game-accent/10` | `style={S.actionBtn}` + hover JS |
| 199 | Même anti-patterns sur le bouton MENU | Idem |

**VictoryScreen.jsx :**

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 132-135 | `bg-black opacity:0.9` (fond sombre) | `backgroundColor: 'var(--rs-bg)'` + opacity: 0.95 |
| 148-150 | `text-game-text font-bold` (victory h1, sans Bebas Neue) | `style={S.mainTitle}` |
| 150-153 | `fontSize: 'clamp(28px, 4vw, 56px)'`, `letterSpacing: '0.2em'` | `clamp(3rem, 8vw, 5rem)` + `0.15em` dans `S.mainTitle` |
| 161 | `text-game-accent` (NEW HIGH SCORE!) | `color: 'var(--rs-gold)'` dans `S.highScoreLabel` |
| 190 | Bouton [R] NEW RUN : même anti-patterns | `style={S.actionBtn}` + hover JS |
| 199 | Bouton [M] MENU : même anti-patterns | Idem |

### Learnings des stories 39.1 → 39.6

- **Classes Tailwind de layout structurel peuvent rester** : `fixed inset-0`, `z-50`, `z-[60]`, `flex flex-col items-center justify-center`, `mt-10`, `animate-fade-in`, `animate-slide-up`, `pointer-events-none`, `pointer-events-auto` etc. — seules les classes de **couleur, border, radius, scale, hover** migrent en inline style.
- **`const S` avant le composant** — avant `export default function`.
- **Hover + restore explicite** : toujours nommer la valeur de restauration (`'var(--rs-border)'`), jamais `''` (string vide ne restaure pas en CSS).
- **Fusionner le playSFX dans le handler complet** : l'ancien `onMouseEnter={() => playSFX('button-hover')}` se transforme en handler complet qui appelle `playSFX` ET applique les styles.
- **`bg-game-accent/10` hover** = anti-pattern à supprimer (fond teinté orange au hover). Le DS Redshift utilise uniquement translateX + borderColor.

### Variables CSS disponibles (vérifiées dans style.css)

```
--rs-bg:          #0d0b14    fond principal (remplace bg-black pur)
--rs-border:      #2e2545    bordures neutres (état normal des boutons)
--rs-text:        #f5f0e8    texte principal (état hover des boutons)
--rs-text-muted:  #7a6d8a    texte secondaire (état normal des boutons)
--rs-orange:      #ff4f1f    sélection active, hover border
--rs-gold:        #ffd60a    NEW HIGH SCORE! (XP / victoire dorée)
```

### Pattern clip-path standard (rappel)

```
Bouton/petit  : polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)
```

Le coin coupé est **toujours en haut-droite**.

### Pattern hover bouton (référence exacte CreditsModal/GalaxyChoice)

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

### Tests — aucun test à modifier

- `GameOverScreen.test.jsx` : teste uniquement `TAUNT_MESSAGES` (array), `formatTimer` (réutilisé). Aucun rendu React. Export `TAUNT_MESSAGES` reste intact.
- `VictoryScreen.test.jsx` : teste `VICTORY_MESSAGES`, `resolveWeaponNames`, `resolveBoonNames`, `formatTimer`. Aucun rendu React. Exports restent intacts.

### Specificité de GameOverScreen : StatLine utilisé dans les deux composants

`StatLine` est importé et utilisé dans les sections stats. Ne pas toucher à `StatLine.jsx` dans cette story (c'est dans 39.9). Les appels `<StatLine label="..." value={...} />` restent identiques.

### Project Structure Notes

- `src/ui/GameOverScreen.jsx` : composant source à modifier (214 lignes)
- `src/ui/VictoryScreen.jsx` : composant source à modifier (214 lignes)
- `src/ui/__tests__/GameOverScreen.test.jsx` : ne pas toucher
- `src/ui/__tests__/VictoryScreen.test.jsx` : ne pas toucher
- `src/ui/primitives/StatLine.jsx` : ne pas toucher
- `src/style.css` : ne pas toucher

### References

- [Source: _bmad-output/planning-artifacts/epic-39-redshift-ui-full-pass.md#Story 39.7]
- [Source: src/ui/GameOverScreen.jsx — analysé ligne par ligne]
- [Source: src/ui/VictoryScreen.jsx — analysé ligne par ligne]
- [Source: src/ui/modals/CreditsModal.jsx — patron DS complet (const S, clip-path, hover translateX)]
- [Source: _bmad-output/implementation-artifacts/39-6-galaxychoice-redshift-pass.md — learnings stories précédentes (hover restore explicite, classes layout OK, fusionner playSFX dans handler)]
- [Source: src/style.css — variables --rs-* vérifiées (--rs-bg, --rs-gold, --rs-border, --rs-orange, --rs-text, --rs-text-muted)]
- [Source: src/ui/__tests__/GameOverScreen.test.jsx — exports logiques uniquement, 0 style]
- [Source: src/ui/__tests__/VictoryScreen.test.jsx — exports logiques uniquement, 0 style]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implémenté `const S` (mainTitle, highScoreLabel, actionBtn) dans les deux composants
- Migré les fonds opaques vers `var(--rs-bg)` (GameOverScreen: fondu narratif uniquement ; VictoryScreen: opacity 0.95)
- Migré titres h1 vers Bebas Neue `clamp(3rem, 8vw, 5rem)` + `letterSpacing: 0.15em`
- Migré "NEW HIGH SCORE!" vers `var(--rs-gold)` + `animate-pulse` conservé
- Migré boutons vers `clipPath 8px` + hover `translateX(4px)` + `borderColor → var(--rs-orange)` (playSFX fusionné dans handler)
- 18 tests passent (6 GameOverScreen + 12 VictoryScreen) sans modification des tests

### File List

- src/ui/GameOverScreen.jsx
- src/ui/VictoryScreen.jsx

## Change Log

- 2026-02-24: Story 39.7 implémentée — Redshift DS pass sur GameOverScreen et VictoryScreen (const S, bg → var(--rs-bg), h1 Bebas Neue, NEW HIGH SCORE gold, boutons clip-path + hover translateX)
- 2026-02-24: Code review (AI) — 5 LOW issues fixés : type="button" sur 4 boutons, z-[51] sur content wrappers (évite ambiguïté z-50 partagé), transition fade-to-black migrée vers Tailwind duration-300 (suppression inline transitionDuration). Note: const S dupliqué entre les deux fichiers — dette technique à traiter dans une story future. 18 tests ✓
