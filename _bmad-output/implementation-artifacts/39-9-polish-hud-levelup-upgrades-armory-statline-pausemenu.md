# Story 39.9: Polish pass — HUD, LevelUpModal, UpgradesScreen, Armory, StatLine, PauseMenu quit dialog

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want all remaining minor deviations from the Redshift design system corrected,
So that no component retains anti-patterns from before the design system was established.

## Acceptance Criteria

**HUD.jsx:**

1. **Given** `HUD.jsx` **When** le HUD est affiché en jeu **Then** les `BoonSlots` n'utilisent plus de couleur magenta (`rgba(255, 20, 147, ...)`) — remplacé par `var(--rs-violet)` (boons = magie/espace).

2. **And** les `WeaponSlots` n'ont plus de `borderRadius: '4px'` — supprimé (ou valeur `0`).

3. **And** les `BoonSlots` n'ont plus de `borderRadius: '8px'` — supprimé.

4. **And** l'indicateur dash (bas-droite) n'utilise plus `rounded-full` ni `border rounded-full` — remplacé par clip-path 8px carré sans `border` Tailwind.

5. **And** `MINIMAP.boundaryBorder: '1px solid rgba(255,255,255,0.1)'` → `var(--rs-border)`.

6. **And** `MINIMAP.playerDotColor: '#00ffcc'` → `var(--rs-teal)`.

7. **And** `banishCharges` icon `'✕'` string → SVG inline (composant `CrossIcon` 12×12 défini en haut du fichier).

**LevelUpModal.jsx:**

8. **Given** `LevelUpModal.jsx` **When** le modal de level up est affiché **Then** l'overlay utilise `rgba(13,11,20,0.88)` (pas `bg-black/60`).

9. **And** le titre "LEVEL UP!" utilise Bebas Neue 2.5rem + `letterSpacing: '0.15em'` + ligne accent orange 32×2px.

10. **And** les cards utilisent clip-path 10px + `var(--rs-bg-raised)` — pas de `bg-game-bg-medium rounded-lg`.

11. **And** le bouton banish (X) utilise clip-path 4px + `var(--rs-danger)` — pas de `rounded-full #ff3366`.

12. **And** les boutons REROLL et SKIP utilisent clip-path 8px — pas de `rounded-lg`.

**UpgradesScreen.jsx:**

13. **Given** `UpgradesScreen.jsx` **When** l'écran d'upgrades permanents est affiché **Then** chaque `UpgradeCard` utilise clip-path 8px — pas de `border rounded-lg`.

14. **And** le bouton achat interne à la card utilise clip-path 4px — pas de `rounded border`.

**Armory.jsx:**

15. **Given** `Armory.jsx` **When** l'armurerie est affichée **Then** chaque `WeaponCard` et `BoonCard` utilise clip-path 8px — pas de `rounded-lg`.

**StatLine.jsx:**

16. **Given** `src/ui/primitives/StatLine.jsx` **When** un bonus est affiché **Then** le badge bonus utilise `color: var(--rs-success)` + `backgroundColor: rgba(45,198,83,0.1)` — pas `text-green-400 bg-green-400/10`.

**PauseMenu.jsx (quit dialog uniquement):**

17. **Given** `PauseMenu.jsx` — uniquement la Quit Confirmation Dialog **When** le joueur clique QUIT **Then** la dialog utilise `var(--rs-bg-surface)` + clip-path 10px + `var(--rs-border)` — pas `var(--color-game-bg) rounded-lg`.

18. **And** les variables `var(--color-game-*)` sont remplacées par leurs équivalents `var(--rs-*)`.

19. **And** les boutons Confirm/Cancel utilisent clip-path 8px — pas de `rounded`.

**Tests:**

20. **Given** `vitest run` **When** la story est implémentée **Then** tous les tests affectés passent sans modification (les tests n'inspectent pas les styles inline).

## Tasks / Subtasks

### HUD.jsx — MINIMAP constants

- [x] Task 1 — Mettre à jour `MINIMAP.playerDotColor` et `MINIMAP.boundaryBorder` (AC: 5, 6)
  - [x] L23: `playerDotColor: '#00ffcc'` → `'var(--rs-teal)'`
  - [x] L37: `boundaryBorder: '1px solid rgba(255,255,255,0.1)'` → `'var(--rs-border)'`

### HUD.jsx — CrossIcon SVG

- [x] Task 2 — Définir `CrossIcon` composant SVG et remplacer `icon="✕"` (AC: 7)
  - [x] Ajouter `const CrossIcon` avant `AnimatedStat` (ou après les imports)
  - [x] SVG 12×12 croix avec 2 lignes strokeLinecap="round" strokeWidth="2"
  - [x] L419: `icon="✕"` → `icon={CrossIcon}`

### HUD.jsx — WeaponSlots borderRadius

- [x] Task 3 — Supprimer `borderRadius: '4px'` des WeaponSlots (AC: 2)
  - [x] L177: empty slot → supprimer `borderRadius: '4px'`
  - [x] L197: filled slot → supprimer `borderRadius: '4px'`

### HUD.jsx — BoonSlots magenta → violet

- [x] Task 4 — Remplacer toutes les couleurs magenta dans `BoonSlots` par violet (AC: 1, 3)
  - [x] L281: empty slot → supprimer `borderRadius: '8px'`
  - [x] L282: `border: '1px dashed rgba(255, 20, 147, 0.1)'` → `'1px dashed rgba(155,93,229,0.15)'`
  - [x] L286: `color: 'rgba(255, 20, 147, 0.2)'` → `'rgba(155,93,229,0.3)'`
  - [x] L303: filled slot → supprimer `borderRadius: '8px'`
  - [x] L302: `border: '2px solid rgba(255, 20, 147, 0.3)'` → `'2px solid rgba(155,93,229,0.3)'`
  - [x] L303-304: `backgroundColor: 'rgba(255, 20, 147, 0.15)'` → `'rgba(155,93,229,0.12)'`
  - [x] L305: `boxShadow: '... rgba(255, 20, 147, 0.6)'` → `'rgba(155,93,229,0.6)'`
  - [x] L311: label `color: 'rgba(255, 182, 219, 1)'` → `'var(--rs-violet)'`

### HUD.jsx — Dash indicator clip-path

- [x] Task 5 — Remplacer `border rounded-full` du dash indicator par clip-path 8px (AC: 4)
  - [x] L631: supprimer `className="border rounded-full flex items-center justify-center"`
  - [x] Remplacer par `className="flex items-center justify-center"` + `clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)'` dans le style inline
  - [x] Supprimer la prop `borderColor` du style (déjà dans style mais avec `border` Tailwind — garder `borderColor` dans le style inline en remplaçant par une `border: '1px solid ...'` inline)

---

### LevelUpModal.jsx — Overlay

- [x] Task 6 — Migrer l'overlay (AC: 8)
  - [x] L143: supprimer `bg-black/60` de la className
  - [x] Ajouter `style={{ backgroundColor: 'rgba(13,11,20,0.88)' }}` sur ce div

### LevelUpModal.jsx — Titre "LEVEL UP!"

- [x] Task 7 — Migrer le titre (AC: 9)
  - [x] L231: remplacer `<h1 className="text-3xl font-bold tracking-widest text-game-text mb-6 animate-fade-in">LEVEL UP!</h1>`
  - [x] Par `<h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', letterSpacing: '0.15em', color: 'var(--rs-text)', margin: 0 }}>LEVEL UP!</h1>`
  - [x] Ajouter `<div style={{ width: 32, height: 2, background: 'var(--rs-orange)', marginTop: 6, marginBottom: 24 }} />`

### LevelUpModal.jsx — Cards

- [x] Task 8 — Migrer les cards (AC: 10)
  - [x] L242: supprimer `bg-game-bg-medium rounded-lg` de la className
  - [x] Ajouter dans le style existant : `clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)'` + `backgroundColor: 'var(--rs-bg-raised)'`

### LevelUpModal.jsx — Bouton banish

- [x] Task 9 — Migrer le bouton banish (AC: 11)
  - [x] L255-271: supprimer `rounded-full text-white text-xs font-bold hover:scale-110 transition-transform cursor-pointer`
  - [x] Ajouter `style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)', backgroundColor: 'var(--rs-danger)', color: '#fff', ... }}`

### LevelUpModal.jsx — REROLL et SKIP

- [x] Task 10 — Migrer les boutons REROLL et SKIP (AC: 12)
  - [x] REROLL L192: supprimer `rounded-lg` de className; ajouter `clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)'` dans style
  - [x] SKIP L211: supprimer `rounded-lg` de className; ajouter même clip-path dans style

---

### UpgradesScreen.jsx — UpgradeCard clip-path

- [x] Task 11 — Migrer `UpgradeCard` (AC: 13)
  - [x] L99: supprimer `border rounded-lg` de className
  - [x] Ajouter `clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)'` dans le style inline existant
  - [x] Ajouter `border: '1px solid var(--rs-border)'` inline (retire la classe `border` Tailwind)

### UpgradesScreen.jsx — Buy button clip-path

- [x] Task 12 — Migrer le bouton achat (AC: 14)
  - [x] L169-182: buy button — supprimer `rounded` de className
  - [x] Ajouter `clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)'` dans le style (inline si `canAfford`, dans les className via override sinon)
  - [x] Note: le bouton a une className conditionnelle — traiter les deux branches

---

### Armory.jsx — WeaponCard et BoonCard clip-path

- [x] Task 13 — Migrer `WeaponCard` et `BoonCard` (AC: 15)
  - [x] WeaponCard L64: supprimer `rounded-lg` de className; ajouter `clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)'` dans le style inline existant
  - [x] BoonCard L130: supprimer `rounded-lg` de className; même opération

---

### StatLine.jsx — Badge bonus

- [x] Task 14 — Migrer le badge bonus (AC: 16)
  - [x] L31: supprimer `className="text-[9px] text-green-400 bg-green-400/10 px-1 rounded"`
  - [x] Remplacer par `style={{ fontSize: '9px', color: 'var(--rs-success)', backgroundColor: 'rgba(45,198,83,0.1)', padding: '0 4px', clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }}`

---

### PauseMenu.jsx — Quit Confirmation Dialog

- [x] Task 15 — Migrer la quit dialog (AC: 17, 18, 19)
  - [x] L350: wrapper → supprimer `className="rounded-lg p-6 max-w-md mx-4"`; ajouter style avec `clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)'` + `backgroundColor: 'var(--rs-bg-surface)'` + `border: '1px solid var(--rs-border)'` + `padding: '24px'` + `maxWidth: '28rem'` + `margin: '0 16px'`
  - [x] L353: supprimer `backgroundColor: 'var(--color-game-bg)'` → `'var(--rs-bg-surface)'`
  - [x] L354: `border: '2px solid var(--color-game-danger)'` → supprimer (déjà dans clipPath container)
  - [x] L360: h2 `color: 'var(--color-game-danger)'` → `'var(--rs-danger)'`; supprimer `className="font-bold mb-4"`; style complet
  - [x] L364: p `color: 'var(--color-game-text)'` → `'var(--rs-text)'`; supprimer `className="mb-6"`; style complet
  - [x] L372: Confirm button — supprimer `className="px-6 py-2 font-bold rounded"`, ajouter `clipPath` 8px + style
  - [x] L373: `backgroundColor: 'var(--color-game-danger)'` → `backgroundColor: 'var(--rs-danger)'` (garde le remplissage danger pour le bouton Confirm)
  - [x] L381: Cancel button — supprimer `className="px-6 py-2 font-bold rounded"`, ajouter `clipPath` 8px + style
  - [x] L385: `color: 'var(--color-game-text)'` → `'var(--rs-text)'`
  - [x] L387: `border: '1px solid var(--color-game-border)'` → `'1px solid var(--rs-border)'`

---

### Tests + vérification finale

- [x] Task 16 — Validation (AC: 20)
  - [x] `vitest run` → 155 fichiers, 2664 tests passent
  - [x] `grep -n "rounded-full\|rounded-lg\|bg-black/60\|bg-game-bg-medium\|255, 20, 147\|ff3366\|green-400\|color-game-" src/ui/HUD.jsx` → 0
  - [x] `grep -n "rounded-full\|bg-black/60\|bg-game-bg-medium\|rounded-lg\|ff3366" src/ui/LevelUpModal.jsx` → 0
  - [x] `grep -n "rounded-lg\|rounded\b" src/ui/UpgradesScreen.jsx | grep -v "REFUND\|//\|aria"` → 0 (REFUND ALL button aussi migré vers clip-path)
  - [x] `grep -n "rounded-lg" src/ui/Armory.jsx` → 0
  - [x] `grep -n "green-400\|rounded" src/ui/primitives/StatLine.jsx` → 0
  - [x] `grep -n "color-game-" src/ui/PauseMenu.jsx` → 0

## Dev Notes

### Fichiers à modifier (6 total)

1. `src/ui/HUD.jsx` (680 lignes) — 5 tâches
2. `src/ui/LevelUpModal.jsx` (321 lignes) — 4 tâches
3. `src/ui/UpgradesScreen.jsx` (279 lignes) — 2 tâches
4. `src/ui/Armory.jsx` (379 lignes) — 1 tâche
5. `src/ui/primitives/StatLine.jsx` (38 lignes) — 1 tâche
6. `src/ui/PauseMenu.jsx` (399 lignes) — 1 tâche (quit dialog seulement, lignes 344-396)

**Ne PAS modifier** : tests, `src/style.css`, `src/ui/modals/CreditsModal.jsx`, ni aucun autre composant.

### Fichier de référence OBLIGATOIRE

**`src/ui/modals/CreditsModal.jsx`** — patron DS complet : `const S`, clip-path, hover translateX, overlay, titre Bebas Neue + accent. Lire AVANT de commencer.

### Anti-patterns identifiés ligne par ligne

#### HUD.jsx

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 23 | `playerDotColor: '#00ffcc'` | `'var(--rs-teal)'` |
| 37 | `boundaryBorder: '1px solid rgba(255,255,255,0.1)'` | `'var(--rs-border)'` |
| 177 | `borderRadius: '4px'` (WeaponSlot empty) | supprimer |
| 197 | `borderRadius: '4px'` (WeaponSlot filled) | supprimer |
| 281 | `borderRadius: '8px'` (BoonSlot empty) | supprimer |
| 282 | `border: '1px dashed rgba(255, 20, 147, 0.1)'` | `'1px dashed rgba(155,93,229,0.15)'` |
| 286 | `color: 'rgba(255, 20, 147, 0.2)'` | `'rgba(155,93,229,0.3)'` |
| 303 | `borderRadius: '8px'` (BoonSlot filled) | supprimer |
| 302 | `border: '2px solid rgba(255, 20, 147, 0.3)'` | `'2px solid rgba(155,93,229,0.3)'` |
| 303-304 | `backgroundColor: 'rgba(255, 20, 147, 0.15)'` | `'rgba(155,93,229,0.12)'` |
| 305 | boxShadow `rgba(255, 20, 147, 0.6)` | `rgba(155,93,229,0.6)` |
| 311 | `color: 'rgba(255, 182, 219, 1)'` | `'var(--rs-violet)'` |
| 419 | `icon="✕"` (banishCharges) | `icon={CrossIcon}` |
| 631 | `className="border rounded-full ..."` | retirer `border rounded-full`, clip-path 8px inline |

#### LevelUpModal.jsx

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 143 | `bg-black/60` dans className | `style={{ backgroundColor: 'rgba(13,11,20,0.88)' }}` |
| 231 | `text-3xl font-bold tracking-widest text-game-text mb-6` | Bebas Neue 2.5rem + accent line |
| 242 | `bg-game-bg-medium rounded-lg` | clip-path 10px + var(--rs-bg-raised) |
| 257-258 | `rounded-full text-white text-xs font-bold hover:scale-110` | clip-path 4px + var(--rs-danger) |
| 261 | `backgroundColor: '#ff3366'` | `var(--rs-danger)` |
| 192 | REROLL `rounded-lg` | clip-path 8px |
| 211 | SKIP `rounded-lg` | clip-path 8px |

#### UpgradesScreen.jsx

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 99 | `border rounded-lg` dans className | clip-path 8px + `border: '1px solid ...'` inline |
| 169-172 | buy button `rounded border` dans className | clip-path 4px |

#### Armory.jsx

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 64 | WeaponCard `rounded-lg` | clip-path 8px |
| 130 | BoonCard `rounded-lg` | clip-path 8px |

#### StatLine.jsx

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 31 | `text-green-400 bg-green-400/10 px-1 rounded` | `var(--rs-success)` + rgba + clip-path 4px |

#### PauseMenu.jsx (quit dialog, lignes 344-396)

| Ligne | Anti-pattern | Correction |
|-------|-------------|------------|
| 350-352 | `className="rounded-lg p-6 max-w-md mx-4"` | clip-path 10px + style inline |
| 353 | `backgroundColor: 'var(--color-game-bg)'` | `'var(--rs-bg-surface)'` |
| 354 | `border: '2px solid var(--color-game-danger)'` | `'1px solid var(--rs-border)'` |
| 360 | h2 `color: 'var(--color-game-danger)'` | `'var(--rs-danger)'` |
| 364 | p `color: 'var(--color-game-text)'` | `'var(--rs-text)'` |
| 372 | Confirm `className="px-6 py-2 font-bold rounded"` | clip-path 8px |
| 373 | `backgroundColor: 'var(--color-game-danger)'` | `'var(--rs-danger)'` |
| 381 | Cancel `className="px-6 py-2 font-bold rounded"` | clip-path 8px |
| 385 | `color: 'var(--color-game-text)'` | `'var(--rs-text)'` |
| 387 | `border: '1px solid var(--color-game-border)'` | `'1px solid var(--rs-border)'` |

### Patterns de référence

#### CrossIcon (nouveau, à définir dans HUD.jsx)

```jsx
const CrossIcon = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <line x1="1" y1="1" x2="11" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="11" y1="1" x2="1" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)
```

#### Clip-paths (tailles standard DS)

```
Modal pleine  (16px) : polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)
Panel/card    (10px) : polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)
Bouton/petit  (8px)  : polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)
Badge/micro   (4px)  : polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)
```

#### Titre de modal (pattern CreditsModal)

```jsx
<h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', letterSpacing: '0.15em', color: 'var(--rs-text)', margin: 0 }}>
  LEVEL UP!
</h2>
<div style={{ width: 32, height: 2, background: 'var(--rs-orange)', marginTop: 6, marginBottom: 24 }} />
```

#### Dash indicator — avant/après

```jsx
// AVANT (anti-pattern)
<div
  className="border rounded-full flex items-center justify-center"
  style={{
    width: ..., height: ...,
    borderColor: ...,
    backgroundColor: ...,
    boxShadow: ...,
  }}
>

// APRÈS (Redshift DS)
<div
  className="flex items-center justify-center"
  style={{
    width: ..., height: ...,
    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    border: `1px solid ${dashCooldownTimer > 0 || isDashing ? '#ffaa00' : 'var(--rs-teal)'}`,
    backgroundColor: ...,
    boxShadow: ...,
  }}
>
```

#### UpgradeCard — traitement de la className conditionnelle du buy button

Le bouton achat dans `UpgradeCard` a une className complexe :
```jsx
className={`
  px-2.5 py-1 text-xs font-semibold tracking-wider rounded border
  outline-none pointer-events-none
  ${!info.canAfford ? 'border-game-border/40 text-game-text-muted' : ''}
`}
```
Après migration :
- Supprimer `rounded border` de la className
- Supprimer la classe conditionnelle `border-game-border/40` (migrer vers style inline)
- Ajouter `clipPath` dans le style inline existant (conditionnel sur `canAfford`)
- Pour `canAfford=false` : `borderColor: 'rgba(46,37,69,0.4)'` (var(--rs-border) à 40% opacity)

### Variables CSS disponibles (vérifiées dans style.css)

```
--rs-bg:          #0d0b14    fond principal
--rs-bg-surface:  #1a1528    surface modale
--rs-bg-raised:   #241d35    surface card/panel élevée
--rs-border:      #2e2545    bordures neutres (état normal)
--rs-text:        #f5f0e8    texte principal
--rs-text-muted:  #7a6d8a    texte secondaire
--rs-orange:      #ff4f1f    sélection active, hover border, accent line
--rs-violet:      #9b5de5    XP, magie, boons
--rs-teal:        #00b4d8    navigation, déplacement
--rs-danger:      #ff3346    danger (rouge)
--rs-success:     #2dc653    succès (vert)
--rs-gold:        #ffd60a    victoire, meilleur score
```

`rgba(155,93,229,0.x)` = `var(--rs-violet)` #9b5de5 décomposé en RGB.

### Learnings des stories 39.1 → 39.8

- **`const S` avant le composant** — avant `export default function`. Pour cette story, les changements sont suffisamment ciblés pour ne pas nécessiter un `const S` complet dans chaque fichier — préférer les corrections chirurgicales.
- **Classes Tailwind de layout peuvent rester** : `fixed inset-0`, `z-50`, `flex`, `items-center`, `gap-*`, `animate-fade-in`, `pointer-events-none`, `w-full`, `transition-all`, `min-w-0`, `flex-1`, `truncate`, `leading-tight`, etc.
- **Seules migrent** : classes de couleur, border-radius, scale, hover couleur.
- **Hover + restore explicite** : toujours nommer la valeur de restauration.
- **`bg-game-bg-medium`** = `var(--rs-bg-raised)` (vérifier si l'une de ces conversions est encore requise dans d'autres fichiers après migration).
- **`text-game-text`** = `var(--rs-text)`, **`text-game-text-muted`** = `var(--rs-text-muted)`.

### Cas particuliers

**WeaponSlot borderRadius** : le borderRadius `4px` sur les slots armes est dans le style inline, pas une classe Tailwind. Le supprimer retire simplement la clé du style object.

**MINIMAP.boundaryBorder** : cette constante est définie mais les bords sont rendus avec `rgba(255,255,255,0.15)` hardcodé dans le JSX (pas via MINIMAP.boundaryBorder). Mettre à jour la constante la rend cohérente mais ne change pas le rendu visible (il faudra aussi mettre à jour les 4 `backgroundColor: 'rgba(255,255,255,0.15)'` dans les boundary edges si l'on veut l'effet complet — AC 5 concerne la constante, pas les usages directs).

**LevelUpModal overlay** : le div racine est `<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-game">`. Retirer `bg-black/60` et ajouter un style inline `backgroundColor: 'rgba(13,11,20,0.88)'`.

**PauseMenu quit dialog** — ne modifier QUE le bloc `{showQuitConfirm && (...)}` (lignes 344-396). Le reste du PauseMenu est déjà conforme Redshift DS.

### Tests — aucun test à modifier

Les tests des 6 composants affectés testent les **comportements** (clicks, keyboard, store, exports logiques) — zéro inspection de styles inline ou de classes CSS.
- `HUD.test.jsx` + `HUD.minimap.test.jsx` : testent `formatTimer`, `shouldPulseHP`, `isLowTime`, `minimapDotPosition`, `detectChangedSlots`, `detectChangedBoons`, `getBoonLabel`, `MINIMAP` export — les valeurs de MINIMAP sont exportées mais les tests ne testent pas `playerDotColor` ou `boundaryBorder` directement dans cette story.
- `LevelUpModal.test.jsx` : teste store interactions, keyboard shortcuts, choices generation.
- `UpgradesScreen.test.jsx` : teste `getUpgradeDisplayInfo`, `BONUS_FORMATS`, `UPGRADE_IDS`, `getUpgradeDisplayInfo`.
- `Armory.test.jsx` : teste `getArmoryTabData`, `getWeaponCardDisplayData`, `getBoonCardDisplayData`, `computeNextTab`.
- `StatLine.test.jsx` : teste le rendu du composant avec bonusValue.
- `PauseMenu.test.jsx` : teste `shouldShowPauseMenu`, `getWeaponDisplayInfo`, `getBoonDisplayInfo`, `getPlayerStats`, `getRunStats`.

### Project Structure Notes

Composants à modifier :
- `src/ui/HUD.jsx` (680 lignes) — touches MINIMAP const (top) + BoonSlots/WeaponSlots (milieu) + dash indicator (bas)
- `src/ui/LevelUpModal.jsx` (321 lignes)
- `src/ui/UpgradesScreen.jsx` (279 lignes)
- `src/ui/Armory.jsx` (379 lignes)
- `src/ui/primitives/StatLine.jsx` (38 lignes)
- `src/ui/PauseMenu.jsx` (399 lignes) — seulement lignes 344-396

Composants de référence (ne pas modifier) :
- `src/ui/modals/CreditsModal.jsx` — référence DS absolue
- `src/ui/PauseMenu.jsx` corps principal (déjà conforme) — seulement quit dialog

### References

- [Source: _bmad-output/planning-artifacts/epic-39-redshift-ui-full-pass.md#Story 39.9]
- [Source: src/ui/HUD.jsx — analysé ligne par ligne (680 lignes)]
- [Source: src/ui/LevelUpModal.jsx — analysé ligne par ligne (321 lignes)]
- [Source: src/ui/UpgradesScreen.jsx — analysé ligne par ligne (279 lignes)]
- [Source: src/ui/Armory.jsx — analysé ligne par ligne (379 lignes)]
- [Source: src/ui/primitives/StatLine.jsx — analysé ligne par ligne (38 lignes)]
- [Source: src/ui/PauseMenu.jsx — analysé ligne par ligne (399 lignes)]
- [Source: _bmad-output/implementation-artifacts/39-8-statsscreen-xpbar-redshift-pass.md — learnings 39.1→39.8]
- [Source: src/style.css — variables --rs-* vérifiées]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- M1: `useWeapons.test.js` + `useWeapons.rarity.test.js` — LASER_FRONT `critChance: 0.05` rendait les tests de damage non-déterministes dans la full suite. Ajout de `critBonus = -(def.critChance ?? 0)` avant chaque tick de vérification de damage.
- M2: `LevelUpModal.jsx` — `text-game-accent` = `#ff00ff` (magenta pur) sur le badge "NEW" — remplacé par `var(--rs-orange)` inline.
- M3: `HUD.jsx` — `MINIMAP.boundaryBorder` était mis à jour mais les 4 boundary edges utilisaient `rgba(255,255,255,0.15)` hardcodé. Rendu connecté à `MINIMAP.boundaryBorder`.

### Completion Notes List

- HUD.jsx: MINIMAP constants (`playerDotColor`, `boundaryBorder`) → vars RS. CrossIcon SVG ajouté (12×12). WeaponSlots `borderRadius:4px` supprimé ×2. BoonSlots: magenta intégral remplacé par violet (`rgba(155,93,229,x)`). Dash indicator: `border rounded-full` → `clipPath 8px` + `border` inline. **Review fix**: boundary edges rendering connecté à `MINIMAP.boundaryBorder` (était hardcodé).
- LevelUpModal.jsx: Overlay `bg-black/60` → `rgba(13,11,20,0.88)`. Titre LEVEL UP! → Bebas Neue 2.5rem + accent orange. Cards → clip-path 10px + `var(--rs-bg-raised)`. Bouton banish → clip-path 4px + `var(--rs-danger)`. REROLL/SKIP → clip-path 8px. **Review fix**: badge "NEW" `text-game-accent` (magenta) → `var(--rs-orange)` inline.
- UpgradesScreen.jsx: UpgradeCard → clip-path 8px + border inline. Buy button → clip-path 4px (les deux branches). REFUND ALL button → clip-path 8px.
- Armory.jsx: WeaponCard + BoonCard → clip-path 8px dans le style inline.
- StatLine.jsx: Badge bonus → style inline `var(--rs-success)` + `rgba(45,198,83,0.1)` + clip-path 4px.
- PauseMenu.jsx: Quit dialog intégrale migrée → clip-path 10px, `var(--rs-bg-surface)`, `var(--rs-border)`, `var(--rs-danger)`, `var(--rs-text)`. Tous les `var(--color-game-*)` supprimés.
- useWeapons.test.js + useWeapons.rarity.test.js: **Review fix** — ajout de `critBonus` force-no-crit dans 3 tests de damage (flaky en full suite à cause de `def.critChance=0.05`).

### File List

- src/ui/HUD.jsx
- src/ui/LevelUpModal.jsx
- src/ui/UpgradesScreen.jsx
- src/ui/Armory.jsx
- src/ui/primitives/StatLine.jsx
- src/ui/PauseMenu.jsx
- src/stores/__tests__/useWeapons.test.js
- src/stores/__tests__/useWeapons.rarity.test.js
