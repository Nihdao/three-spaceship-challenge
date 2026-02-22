# Story 33.7: Pause Menu — Refonte 2 Volets Détaillés

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the pause menu to show a detailed overview of my run in two organized panels,
so that I can assess my full build state and decide whether to continue or quit.

## Acceptance Criteria

1. **[Modal sizing & overlay]** Le modal fait `width: clamp(640px, 65vw, 920px)` (au lieu de `clamp(320px, 40vw, 720px)`). L'overlay est `rgba(13, 11, 20, 0.85)` au lieu de `rgba(0,0,0,0.6)`.

2. **[Panel conteneur Redshift]** Le panel a `background: var(--rs-bg-surface)`, `border: 1px solid var(--rs-border)`, et `clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)'` (coin supérieur droit coupé). Le `border rounded-lg` Tailwind est supprimé.

3. **[Header restructuré]** Le titre `PAUSED` est en `fontFamily: 'Bebas Neue'`, `color: var(--rs-orange)`, `letterSpacing: '0.15em'`. Le bouton `[ESC/R] RESUME` est dans le header aligné à droite, style outline teal : `border: 1px solid var(--rs-teal)`, `color: var(--rs-teal)`, fond transparent. `data-testid="resume-button"` préservé sur ce bouton.

4. **[Layout 2 volets]** Le contenu (sous le header) est en `display: flex, alignItems: flex-start` avec un volet gauche (`width: '45%'`, `paddingRight: 20`, `borderRight: '1px solid var(--rs-border)'`) et un volet droit (`flex: 1`, `paddingLeft: 20`).

5. **[Volet gauche — Inventaire]** Contient deux sous-sections WEAPONS et BOONS avec titres de section en `Rajdhani 700`, `var(--rs-text-muted)`, `letterSpacing: 0.1em`, UPPERCASE. Chaque weapon card : layout `flex-col`, `borderLeft: '2px solid <projectileColor>'`, `paddingLeft: 8`, affichant nom (bold, couleur weapon), `Lv{n} · {damage}dmg · {cooldown.toFixed(1)}s` (Space Mono, var(--rs-text-muted)). Chaque boon card : `borderLeft: '2px solid var(--rs-violet)'`, nom (bold, var(--rs-violet)), `Lv{n}` + `statPreview` si disponible.

6. **[Volet droit — Stats]** Deux sous-sections avec titres de section identiques au volet gauche. **RUN STATS** : Time (`formatTimer(totalElapsedTime)`), Kills, Score, Fragments. **PLAYER STATS** : HP (`Math.ceil(currentHP) / maxHP`), Level, Speed, Damage× (`×${damageMultiplier.toFixed(2)}`), puis conditionnellement si > 0 : Rerolls, Skips, Banishes.

7. **[Icônes StatLine — sans emojis]** Si `src/ui/icons/index.jsx` existe (Story 33.1 done) : utiliser les composants SVG (`ShieldCrossIcon` HP, `ClockIcon` Time, `SkullIcon` Kills, `StarIcon` Score/Level, `FragmentIcon` Fragments, `SpeedIcon` Speed, `SwordIcon` Damage). Sinon : remplacer par symboles Unicode neutres — `♥`, `◷`, `☠`, `★`, `◆`, `→`, `×`. Aucun emoji dans le JSX final.

8. **[Valeurs numériques]** Les valeurs des StatLine dans le volet droit utilisent `font-family: Space Mono` et `tabular-nums` — déjà géré par la prop `value` de `StatLine`. Les labels utiliseront `Rajdhani 600`, `letterSpacing: 0.1em`, `color: var(--rs-text-muted)` (via inline style direct si StatLine n'est pas adaptée).

9. **[Zone actions]** `[Q] QUIT TO MENU` est seul en bas, centré, style `color: var(--rs-danger)`, `border: 1px solid var(--rs-danger)`, fond transparent. `data-testid="quit-button"` préservé.

10. **[Dialog de confirmation inchangé]** Le `showQuitConfirm` dialog garde son style actuel. Aucun emoji dedans (vérifié : il n'y en a pas). Aucun changement nécessaire.

11. **[Keyboard handler inchangé]** ESC/R → resume, Q → quit confirm, ESC/Enter dans confirm → annuler/valider. Aucune logique modifiée.

12. **[Tests existants passent]** `vitest run` passe. Les tests `PauseMenu.test.jsx` testent uniquement les fonctions pures exportées — aucune DOM, aucune régression attendue.

## Tasks / Subtasks

- [ ] Task 1: Prérequis — vérification
  - [ ] Vérifier que `src/style.css` contient toutes les vars RS requises (confirmé : voir Dev Notes)
  - [ ] Vérifier si `src/ui/icons/index.jsx` existe (Story 33.1 status) → choisir icônes SVG ou Unicode fallbacks

- [ ] Task 2: Lire `src/ui/PauseMenu.jsx` en entier avant modification
  - [ ] Identifier les lignes exactes : overlay (162-165), modal div (169-177), h1 titre (179-184), section inventory (187-280), section stats (283-300), section actions (303-329), quit dialog (333-384)
  - [ ] Lister tous les `data-testid` à préserver : `pause-overlay`, `resume-button`, `quit-button`, `confirm-quit-button`, `cancel-quit-button`

- [ ] Task 3: Ajouter subscriptions stores manquantes
  - [ ] Après `const fragments = usePlayer((s) => s.fragments)` (ligne 80) : ajouter
    ```jsx
    const rerollCharges = usePlayer((s) => s.rerollCharges)
    const skipCharges = usePlayer((s) => s.skipCharges)
    const banishCharges = usePlayer((s) => s.banishCharges)
    ```

- [ ] Task 4: Modifier l'overlay et le panel
  - [ ] `backgroundColor: 'rgba(13, 11, 20, 0.85)'` sur l'overlay `data-testid="pause-overlay"`
  - [ ] Modifier la div modal : width → `clamp(640px, 65vw, 920px)`, ajouter `background: var(--rs-bg-surface)`, `border: 1px solid var(--rs-border)`, `clipPath: polygon(...)`, supprimer `border rounded-lg` Tailwind

- [ ] Task 5: Restructurer le header
  - [ ] Remplacer `<h1 className="font-bold text-center mb-6" ...>PAUSED</h1>` par un header flex : titre Bebas Neue RS-orange à gauche + bouton RESUME outline-teal à droite
  - [ ] Supprimer l'actuel bouton RESUME de la section actions (lignes 304-315)

- [ ] Task 6: Implémenter le layout 2 volets
  - [ ] Remplacer `<section aria-label="inventory">` et `<section aria-label="stats">` par un `<div style={{ display: 'flex', alignItems: 'flex-start' }}>` avec 2 divs enfants
  - [ ] Volet gauche : `width: '45%'`, `paddingRight: 20`, `borderRight: '1px solid var(--rs-border)'`
  - [ ] Volet droit : `flex: 1`, `paddingLeft: 20`

- [ ] Task 7: Volet gauche — refactorer les weapon cards
  - [ ] Supprimer `width: 'clamp(72px, 7vw, 100px)'` des cards
  - [ ] Appliquer `borderLeft: '2px solid ${info.color}'`, `paddingLeft: 8`, layout `flex-col gap-1`
  - [ ] Remplacer les 3 `<span>` de taille variable par : nom (Rajdhani 600 12px, couleur info.color), sous-ligne (Space Mono 11px, var(--rs-text-muted)) : `Lv{level} · {damage}dmg · {cooldown.toFixed(1)}s`
  - [ ] Idem pour les boon cards avec `borderLeft: '2px solid var(--rs-violet)'`

- [ ] Task 8: Volet droit — implémenter les stats
  - [ ] Titre `RUN STATS` (pattern SectionTitle — voir Dev Notes)
  - [ ] 4 StatLine avec icônes (SVG ou Unicode selon disponibilité 33.1) : Time, Kills, Score, Fragments
  - [ ] Séparateur `borderTop: '1px solid var(--rs-border)'`, `margin: '16px 0'`
  - [ ] Titre `PLAYER STATS`
  - [ ] 4 StatLine obligatoires : HP, Level, Speed, Dmg×
  - [ ] 3 StatLine conditionnelles (si > 0) : Rerolls, Skips, Banishes

- [ ] Task 9: Zone actions — bouton QUIT centré
  - [ ] Remplacer `<section aria-label="actions">` par `<div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>`
  - [ ] Un seul bouton : `[Q] QUIT TO MENU`, `color: var(--rs-danger)`, `border: 1px solid var(--rs-danger)`, fond transparent
  - [ ] Préserver `data-testid="quit-button"`

- [ ] Task 10: QA
  - [ ] `vitest run` passe
  - [ ] Vérifier : modal élargi, 2 volets, séparateur vertical, clip-path coin coupé
  - [ ] Vérifier : RESUME dans le header (outline teal), QUIT en bas (outline danger)
  - [ ] Vérifier : weapon cards avec border-left colorée, boon cards avec border-left violet
  - [ ] Vérifier : charges conditionnelles (ne s'affichent qu'en début de run si > 0)
  - [ ] Vérifier : keyboard handler ESC/R resume, Q quit, ESC cancel confirm, Enter confirm
  - [ ] Grep : `'💀\|⭐\|♥\|❤️\|⚡\|🗡️\|⏱️\|🎖️'` dans PauseMenu.jsx → vide

## Dev Notes

### CRITIQUE : Prérequis Story 33.1 et stratégie icônes

Story 33.1 (`ready-for-dev` au moment de la rédaction — pas encore implémentée) définit `src/ui/icons/index.jsx` avec les composants SVG. Cette story doit vérifier l'existence du fichier avant d'importer les icônes.

**Si `src/ui/icons/index.jsx` existe (Story 33.1 done) :**
```jsx
import { ShieldCrossIcon, ClockIcon, SkullIcon, StarIcon, FragmentIcon, SpeedIcon, SwordIcon } from '../icons/index.jsx'
// Puis dans les StatLine : icon={ShieldCrossIcon}
// StatLine (après Story 33.1) détecte typeof icon === 'function' → render <Icon size={14} color={color} />
```

**Sinon — fallbacks Unicode (aucun emoji) :**

| Stat | Emoji supprimé | Fallback Unicode |
|------|---------------|-----------------|
| HP | ❤️ | `♥` |
| Level | 🎖️ | `★` |
| Speed | ⚡ | `→` |
| Damage | 🗡️ | `×` |
| Time | ⏱️ | `◷` |
| Kills | 💀 | `☠` |
| Score | ⭐ | `★` |
| Fragments | (◆ déjà Unicode) | `◆` inchangé |

> `◆` pour Fragments est déjà un symbole Unicode géométrique acceptable selon les specs de l'epic (non-emoji). Garder tel quel.

### CSS Variables disponibles — confirmées dans `src/style.css` (lignes 152-176)

```css
--rs-bg:         #0d0b14      /* utilisé pour overlay: rgba(13, 11, 20, 0.85) */
--rs-bg-surface: #1a1528      /* fond du panel principal */
--rs-bg-raised:  #241d35      /* fond des cards */
--rs-border:     #2e2545      /* bordures et séparateurs */
--rs-text:       #f5f0e8      /* texte principal */
--rs-text-muted: #7a6d8a      /* labels de sections */
--rs-text-dim:   #4a3f5c      /* hints discrets */
--rs-orange:     #ff4f1f      /* titre PAUSED */
--rs-violet:     #9b5de5      /* boon cards, Fragments */
--rs-gold:       #ffd60a      /* Score (si SVG icons) */
--rs-teal:       #00b4d8      /* bouton RESUME */
--rs-hp:         #ef233c      /* HP (si SVG icons) */
--rs-success:    #2dc653      /* non utilisé dans cette story */
--rs-danger:     #ef233c      /* bouton QUIT, danger label */
```

**Aucun fallback CSS nécessaire** — toutes les vars sont présentes.

### Structure JSX cible — Layout complet

```jsx
return (
  <div
    data-testid="pause-overlay"
    className="fixed inset-0 z-50 flex items-center justify-center font-game"
    style={{
      backgroundColor: 'rgba(13, 11, 20, 0.85)',
      animation: isClosing ? 'fadeOut 150ms ease-out forwards' : 'fadeIn 150ms ease-out',
    }}
  >
    {/* ── Panel principal ── */}
    <div
      style={{
        width: 'clamp(640px, 65vw, 920px)',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        background: 'var(--rs-bg-surface)',
        border: '1px solid var(--rs-border)',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
        margin: '0 16px',
      }}
    >

      {/* ── Header : Titre + RESUME ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(32px, 3.5vw, 48px)',
          color: 'var(--rs-orange)',
          letterSpacing: '0.15em',
          margin: 0,
        }}>
          PAUSED
        </h1>
        <button
          data-testid="resume-button"
          onClick={handleResume}
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(13px, 1.3vw, 16px)',
            letterSpacing: '0.1em',
            color: 'var(--rs-teal)',
            border: '1px solid var(--rs-teal)',
            background: 'transparent',
            padding: '8px 20px',
            cursor: 'pointer',
          }}
        >
          [ESC/R] RESUME
        </button>
      </div>

      {/* ── Corps 2 volets ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>

        {/* ── Volet gauche : Inventaire ── */}
        <div style={{ width: '45%', paddingRight: 20, borderRight: '1px solid var(--rs-border)' }}>

          {/* WEAPONS */}
          <p style={sectionTitleStyle}>WEAPONS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {equippedWeapons.map((weapon, idx) => {
              const info = getWeaponDisplayInfo(weapon)
              return (
                <div key={`${weapon.weaponId}-${idx}`} style={{
                  borderLeft: `2px solid ${info.color}`,
                  paddingLeft: 8,
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: info.color }}>
                    {info.name}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: 'var(--rs-text-muted)' }}>
                    Lv{info.level} · {info.damage}dmg · {info.cooldown.toFixed(1)}s
                  </span>
                </div>
              )
            })}
            {equippedWeapons.length === 0 && (
              <span style={{ color: 'var(--rs-text-dim)', fontSize: 11 }}>—</span>
            )}
          </div>

          {/* BOONS */}
          <p style={sectionTitleStyle}>BOONS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {equippedBoons.map((boon, idx) => {
              const info = getBoonDisplayInfo(boon)
              return (
                <div key={`${boon.boonId}-${idx}`} style={{
                  borderLeft: '2px solid var(--rs-violet)',
                  paddingLeft: 8,
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--rs-violet)' }}>
                    {info.name}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: 'var(--rs-text-muted)' }}>
                    Lv{info.level}{info.statPreview ? ` · ${info.statPreview}` : ''}
                  </span>
                </div>
              )
            })}
            {equippedBoons.length === 0 && (
              <span style={{ color: 'var(--rs-text-dim)', fontSize: 11 }}>—</span>
            )}
          </div>
        </div>

        {/* ── Volet droit : Stats ── */}
        <div style={{ flex: 1, paddingLeft: 20 }}>
          {/* RUN STATS */}
          <p style={sectionTitleStyle}>RUN STATS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <StatLine label="Time"      value={formatTimer(totalElapsedTime)} icon="◷" />
            <StatLine label="Kills"     value={kills.toLocaleString('en-US')}  icon="☠" />
            <StatLine label="Score"     value={score.toLocaleString('en-US')}  icon="★" />
            <StatLine label="Fragments" value={fragments.toLocaleString('en-US')} icon="◆" />
          </div>

          {/* Séparateur */}
          <div style={{ borderTop: '1px solid var(--rs-border)', margin: '16px 0' }} />

          {/* PLAYER STATS */}
          <p style={sectionTitleStyle}>PLAYER STATS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <StatLine label="HP"    value={`${Math.ceil(currentHP)} / ${maxHP}`}   icon="♥" />
            <StatLine label="Level" value={String(currentLevel)}                    icon="★" />
            <StatLine label="Speed" value={String(shipBaseSpeed)}                   icon="→" />
            <StatLine label="Dmg ×" value={`×${damageMultiplier.toFixed(2)}`}       icon="×" />
            {rerollCharges > 0 && <StatLine label="Rerolls"  value={String(rerollCharges)}  icon="↺" />}
            {skipCharges   > 0 && <StatLine label="Skips"    value={String(skipCharges)}    icon="»" />}
            {banishCharges > 0 && <StatLine label="Banishes" value={String(banishCharges)}  icon="✕" />}
          </div>
        </div>
      </div>

      {/* ── Zone actions : QUIT seul ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button
          data-testid="quit-button"
          onClick={handleQuit}
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(13px, 1.3vw, 16px)',
            letterSpacing: '0.1em',
            color: 'var(--rs-danger)',
            border: '1px solid var(--rs-danger)',
            background: 'transparent',
            padding: '8px 24px',
            cursor: 'pointer',
          }}
        >
          [Q] QUIT TO MENU
        </button>
      </div>

    </div>

    {/* ── Dialog confirmation quit — INCHANGÉ ── */}
    {showQuitConfirm && (
      /* ... conserver le JSX existant (lignes 333-384) identique ... */
    )}
  </div>
)
```

### `sectionTitleStyle` — constante locale (pas un composant)

Définir en haut du return ou juste avant comme const :

```jsx
const sectionTitleStyle = {
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.1em',
  color: 'var(--rs-text-muted)',
  textTransform: 'uppercase',
  marginBottom: 8,
  marginTop: 0,
}
```

### Icônes SVG — upgrade si Story 33.1 done

Si Story 33.1 est implémentée, le StatLine supporte les composants React comme icône. Dans ce cas, remplacer les strings Unicode par les imports SVG :

```jsx
import { ShieldCrossIcon, ClockIcon, SkullIcon, StarIcon, FragmentIcon, SpeedIcon, SwordIcon } from '../icons/index.jsx'

// Puis :
<StatLine label="HP"    value={...} icon={ShieldCrossIcon} />
<StatLine label="Time"  value={...} icon={ClockIcon} />
<StatLine label="Kills" value={...} icon={SkullIcon} />
// etc.
```

Le dev doit vérifier si `src/ui/icons/index.jsx` existe. Si la story est implémentée après 33.1, utiliser directement les SVG.

### Suppressions dans le JSX actuel de `PauseMenu.jsx`

| Élément | Ligne actuelle | Action |
|---------|---------------|--------|
| `backgroundColor: 'var(--color-game-primary)'` RESUME button | 310 | Supprimer → outline teal |
| `color: '#000'` RESUME button | 311 | Supprimer |
| `width: 'clamp(320px, 40vw, 720px)'` | 171 | → `clamp(640px, 65vw, 920px)` |
| `backgroundColor: 'rgba(0,0,0,0.6)'` overlay | 163 | → `rgba(13, 11, 20, 0.85)` |
| `backgroundColor: 'var(--color-game-bg)'` panel | 174 | → `background: var(--rs-bg-surface)` |
| `borderColor: 'var(--color-game-border)'` panel | 175 | → `border: 1px solid var(--rs-border)` |
| `border rounded-lg shadow-2xl` Tailwind | 169 | Supprimer (remplacé par inline + clipPath) |
| `<section aria-label="inventory">` layout | 187 | Remplacer par volet gauche |
| `<section aria-label="stats">` layout | 283 | Remplacer par volet droit |
| `<section aria-label="actions">` avec 2 buttons | 303 | → div centered, QUIT seulement |
| Icônes emoji dans StatLine | 291-298 | → Unicode ou SVG |
| `clamp(72px, 7vw, 100px)` weapon card width | 211 | Supprimer → flex-col full-width |
| `rgba(255, 20, 147, 0.1)` boon bg | 256 | → `background: transparent` (ou var(--rs-bg-raised)) |
| `rgba(255, 182, 219, 1)` boon name color | 259 | → `color: var(--rs-violet)` |

### Aucune modification des éléments suivants

- Logique `handleResume`, `handleQuit`, `handleConfirmQuit`, `handleCancelQuit` — **inchangée**
- Keyboard handler (lignes 130-151) — **inchangé**
- Dialog confirmation quit JSX (lignes 333-384) — **inchangé**
- Fonctions exportées `shouldShowPauseMenu`, `getWeaponDisplayInfo`, `getBoonDisplayInfo`, `getPlayerStats`, `getRunStats` — **signatures inchangées**
- `isClosing` state + `useEffect` cleanup — **inchangés**
- Stores `useGame`, `usePlayer`, `useWeapons`, `useBoons`, `useEnemies`, `useLevel` — **non modifiés**

### Project Structure Notes

**Fichier unique modifié :** `src/ui/PauseMenu.jsx` (387 lignes)
- Ajout de 3 subscriptions Zustand : `rerollCharges`, `skipCharges`, `banishCharges` (après ligne 80)
- Refonte complète du JSX : overlay couleur, panel dimensions + RS styles + clipPath, header flex (titre RS + RESUME), 2 volets (inventaire gauche, stats droite), zone actions simplifiée (QUIT seul)
- `data-testid` préservés sur tous les boutons

**Fichiers lus, non modifiés :**
- `src/style.css` — variables RS confirmées présentes (lignes 152-176)
- `src/ui/primitives/StatLine.jsx` — interface inchangée
- `src/stores/usePlayer.jsx` — `rerollCharges`, `skipCharges`, `banishCharges` confirmés (lignes 67-69)
- `src/ui/__tests__/PauseMenu.test.jsx` — tests pures fonctions, aucun impact DOM

**Fichier optionnel :**
- `src/ui/icons/index.jsx` — si Story 33.1 done, importer les SVG icons

### References

- Epic 33 spec Story 33.7: `_bmad-output/planning-artifacts/epic-33-ui-design-identity.md#Story-33.7`
- Source actuelle PauseMenu: `src/ui/PauseMenu.jsx` (387 lignes, lue intégralement)
- Tests: `src/ui/__tests__/PauseMenu.test.jsx`
- StatLine: `src/ui/primitives/StatLine.jsx` — rend `{icon}` comme React node (string ou composant si 33.1 done)
- CSS vars RS: `src/style.css` (lignes 152-176) — toutes disponibles
- usePlayer charges: `src/stores/usePlayer.jsx` lignes 67-69 : `rerollCharges`, `skipCharges`, `banishCharges`
- `formatTimer` importé de `HUD.jsx` — déjà importé dans PauseMenu.jsx (ligne 10)
- Story 33.6 (pattern 2 colonnes, RS vars): `_bmad-output/implementation-artifacts/33-6-levelup-vertical-layout.md`
- CreditsModal RS (référence récente, commit c4842aa) : pattern clipPath + RS vars dans un modal

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
