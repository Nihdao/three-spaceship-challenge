# Story 33.6: Level Up Modal — Layout Vertical 2 Colonnes

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want level-up choices to be displayed vertically with my current build stats on the side,
so that I can make informed decisions without losing sight of my build state.

## Acceptance Criteria

1. **[Layout 2 colonnes]** `LevelUpModal.jsx` adopte un layout `flex-row` avec `flex-wrap: wrap` : colonne gauche (`width: 220px`, fixe, non-shrinkable) + colonne droite (flex-grow, choix verticaux). Les deux colonnes ont `gap: 24px` et sont alignées par le haut (`align-items: flex-start`).

2. **[Colonne gauche — CURRENT BUILD]** La colonne gauche contient :
   - Titre `CURRENT BUILD` en `Rajdhani 700`, `color: var(--rs-text-muted)`, `letter-spacing: 0.12em`
   - HP : `Math.round(currentHP) / Math.round(maxHP)`
   - Level : `currentLevel`
   - Speed : `shipBaseSpeed.toFixed(2)`
   - Damage Mult : `×` + `(modifiers.damageMultiplier ?? 1).toFixed(2)` depuis `useBoons`
   - Weapons + Boons count : `Weapons: N · Boons: M`

3. **[Séparation et boutons stratégiques dans la colonne gauche]** Une ligne `border-top: 1px solid var(--rs-border)` précède les boutons REROLL/SKIP. Ces boutons sont dans la colonne gauche (supprimés de leur position actuelle sous les cards). Labels : `REROLL (N)` et `SKIP (N)` — sans emoji `↻` ni `⏭`. Le hint clavier `R`/`S` reste sous le label.

4. **[Colonne droite — choix verticaux]** Le titre "LEVEL UP!" est dans la colonne droite. Les cards sont en `flex-col gap-3` (au lieu de `flex gap-4`). Largeur `100%` (plus de `w-52` fixe).

5. **[Cards refactorisées]** Chaque card : layout `flex-row`, `border-left: 3px solid <rarityColor>`. Le `boxShadow` glow est supprimé. Badge rareté : label inline `[EPIC]` en `Rajdhani 700`, `color: rarityTier.color`, fond transparent.

6. **[Keyboard shortcut aligné à droite]** Le `[1]`–`[4]` est en `Space Mono`, `color: var(--rs-text-dim)`, `margin-left: auto`.

7. **[Banish button — suppression glow]** Le `boxShadow: '0 0 6px ...'` sur le bouton banish est supprimé. Le `✕` et le reste du style sont inchangés.

8. **[Keyboard hints inchangés]** La ligne `[1-4] Select · R Reroll · S Skip · X+# Banish` en bas reste présente et inchangée.

9. **[Responsive <700px]** `flex-wrap: wrap` sur le conteneur principal fait que la colonne gauche (220px) se place au-dessus de la colonne droite sur petits écrans.

10. **[Pas de régression comportementale]** `applyChoice`, `handleReroll`, `handleSkip`, `handleBanish`, le keyboard handler — aucune logique modifiée. `vitest run` passe.

## Tasks / Subtasks

- [ ] Task 1: Vérifier les prérequis Story 33.1
  - [ ] Confirmer que `src/style.css` définit `--rs-border`, `--rs-text-muted`, `--rs-text-dim`
  - [ ] Si absent : ajouter les fallbacks en attendant Story 33.1 (voir Dev Notes "CSS Vars fallback")

- [ ] Task 2: Ajouter les subscriptions aux stores dans `LevelUpModal.jsx`
  - [ ] Lire `src/ui/LevelUpModal.jsx` en entier avant toute modification (255 lignes)
  - [ ] Ajouter au bloc de subscriptions Zustand (après `banishCharges` ligne 19) :
    ```jsx
    const currentHP = usePlayer(s => s.currentHP)
    const maxHP = usePlayer(s => s.maxHP)
    const currentLevel = usePlayer(s => s.currentLevel)
    const shipBaseSpeed = usePlayer(s => s.shipBaseSpeed)
    const activeWeaponsCount = useWeapons(s => s.activeWeapons.length)
    const activeBoonsCount = useBoons(s => s.activeBoons.length)
    const damageMultiplier = useBoons(s => s.modifiers.damageMultiplier ?? 1)
    ```
  - [ ] Note : `useWeapons` et `useBoons` sont déjà importés (lignes 3-5) — pas de nouveaux imports

- [ ] Task 3: Refactorer le JSX — layout principal (lignes 135-254)
  - [ ] Remplacer le conteneur `flex-col items-center justify-center` par le layout 2 colonnes — voir Dev Notes "Structure JSX cible"
  - [ ] Le titre "LEVEL UP!" se déplace dans la colonne droite
  - [ ] Le conteneur des choix passe de `flex gap-4` (horizontal) à `flex-col gap-3` (vertical)
  - [ ] Mettre les hints clavier en `position: absolute; bottom: 24px` (hors du flow flex)

- [ ] Task 4: Implémenter la colonne gauche — Build Overview
  - [ ] Créer la colonne gauche avec `width: 220px`, `flex-shrink: 0`
  - [ ] Titre `CURRENT BUILD` — style Rajdhani (voir Dev Notes)
  - [ ] Lignes stats HP, Level, Speed, Damage Mult — voir Dev Notes "Build Overview stats"
  - [ ] Ligne `Weapons: N · Boons: M`
  - [ ] Séparateur `border-top: 1px solid var(--rs-border)`
  - [ ] Déplacer les boutons REROLL et SKIP depuis leur position actuelle (lignes 218-246) vers cette colonne
  - [ ] Supprimer les emojis `↻` et `⏭` — labels `REROLL (N)` et `SKIP (N)` uniquement
  - [ ] Supprimer le wrapper conditionnel `(rerollCharges > 0 || skipCharges > 0)` du bas — chaque bouton a sa propre conditionnelle dans la colonne gauche

- [ ] Task 5: Refactorer les cards de choix
  - [ ] Chaque card : `flex-row` avec `border-left: 3px solid rarityColor`, padding left `12px`
  - [ ] Supprimer `boxShadow` glow des cards (ligne 159 actuel)
  - [ ] Supprimer `width: w-52` — les cards sont `width: 100%`
  - [ ] Badge rareté : inline `[EPIC]` en `Rajdhani 700` avec la couleur de rareté (plus de pill colorée)
  - [ ] Keyboard shortcut `[1]`–`[4]` : `Space Mono`, `color: var(--rs-text-dim)`, `margin-left: auto`
  - [ ] Bouton banish : supprimer `boxShadow: '0 0 6px ...'` (ligne ~172 actuel)

- [ ] Task 6: QA et vérification
  - [ ] `vitest run` passe (aucun test existant pour LevelUpModal — aucun test cassé attendu)
  - [ ] Vérifier visuellement : colonne gauche avec stats HP/Level/Speed/Dmg visibles
  - [ ] Vérifier que REROLL/SKIP sont dans la colonne gauche, sans emoji
  - [ ] Vérifier les cards verticales avec border-left colorée par rareté (EPIC = violet, RARE = bleu, etc.)
  - [ ] Vérifier que le glow boxShadow a disparu (cards et banish button)
  - [ ] Vérifier le keyboard handler : [1-4] fonctionne, R reroll, S skip, X+# banish — comportement inchangé
  - [ ] Vérifier responsive : rétrécir la fenêtre < 700px → colonne unique (gauche au-dessus)

## Dev Notes

### CRITIQUE : Prérequis Story 33.1

Cette story utilise des variables CSS `--rs-*` dont certaines peuvent être absentes si Story 33.1 n'est pas encore implémentée. Variables requises :
- `--rs-border` : séparateur
- `--rs-text-muted` : titre CURRENT BUILD
- `--rs-text-dim` : keyboard shortcuts

**CSS Vars fallback** — si Story 33.1 n'est pas `done`, ajouter temporairement dans `style.css` (ou dans le composant via style inline) :
```css
/* Fallback Story 33.1 — à supprimer une fois 33.1 implémentée */
--rs-border: rgba(232, 232, 240, 0.1);
--rs-text-muted: rgba(232, 232, 240, 0.45);
--rs-text-dim: rgba(232, 232, 240, 0.25);
```

Variables déjà présentes depuis Story 33.1 (ou vérifier) : `--rs-orange`, `--rs-teal`, `--rs-hp`, `--rs-violet`, `--rs-gold`.

### Structure JSX cible — Layout complet

```jsx
return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-game">
    {/* Conteneur 2 colonnes avec responsive wrap */}
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 24,
      alignItems: 'flex-start',
      maxWidth: 860,
      padding: '0 16px',
      position: 'relative',
    }}>

      {/* ── Colonne gauche : Build Overview ── */}
      <div style={{ width: 220, flexShrink: 0 }}>
        {/* titre CURRENT BUILD */}
        {/* stats rows */}
        {/* separator */}
        {/* REROLL / SKIP buttons conditionnels */}
      </div>

      {/* ── Colonne droite : Titre + Cards verticales ── */}
      <div style={{ flex: 1, minWidth: 320 }}>
        <h1 className="text-3xl font-bold tracking-widest text-game-text mb-6 animate-fade-in">
          LEVEL UP!
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {choices.map((choice, i) => { /* card refactorisée */ })}
        </div>
      </div>

    </div>

    {/* Keyboard hints — position absolute en bas, hors du flow 2 colonnes */}
    <p
      className="text-game-text-muted text-xs opacity-40 animate-fade-in"
      style={{ position: 'absolute', bottom: 24, animationDelay: '300ms', animationFillMode: 'backwards' }}
    >
      [1-4] Select{rerollCharges > 0 ? ' · R Reroll' : ''}{skipCharges > 0 ? ' · S Skip' : ''}{banishCharges > 0 ? ' · X+# Banish' : ''}
    </p>
  </div>
)
```

### Build Overview — colonne gauche (JSX complet)

```jsx
<div style={{ width: 220, flexShrink: 0 }}>
  {/* Titre section */}
  <p style={{
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.12em',
    color: 'var(--rs-text-muted)',
    marginBottom: 12,
    textTransform: 'uppercase',
  }}>
    Current Build
  </p>

  {/* Stats rows */}
  {[
    ['HP',    `${Math.round(currentHP)} / ${Math.round(maxHP)}`],
    ['Level', currentLevel],
    ['Speed', shipBaseSpeed.toFixed(2)],
    ['Dmg ×', damageMultiplier.toFixed(2)],
  ].map(([label, value]) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--rs-text-muted)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: '#e8e8f0' }}>
        {value}
      </span>
    </div>
  ))}

  {/* Weapons + Boons count */}
  <p style={{ fontSize: 10, color: 'var(--rs-text-dim)', marginTop: 6, fontFamily: "'Space Mono', monospace" }}>
    Weapons: {activeWeaponsCount} · Boons: {activeBoonsCount}
  </p>

  {/* Separator */}
  <div style={{ borderTop: '1px solid var(--rs-border)', margin: '16px 0' }} />

  {/* REROLL — conditionnel */}
  {rerollCharges > 0 && (
    <button
      onClick={handleReroll}
      className="w-full mb-2 px-4 py-2 rounded-lg font-bold tracking-wider transition-all cursor-pointer"
      style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: 'var(--rs-teal, #00ffcc)',
        border: '1px solid var(--rs-teal, #00ffcc)',
        background: 'transparent',
      }}
    >
      REROLL ({rerollCharges})
      <span className="block text-xs font-normal mt-0.5 opacity-50">R</span>
    </button>
  )}

  {/* SKIP — conditionnel */}
  {skipCharges > 0 && (
    <button
      onClick={handleSkip}
      className="w-full px-4 py-2 rounded-lg font-bold tracking-wider transition-all cursor-pointer"
      style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: 'var(--rs-gold, #ffdd00)',
        border: '1px solid var(--rs-gold, #ffdd00)',
        background: 'transparent',
      }}
    >
      SKIP ({skipCharges})
      <span className="block text-xs font-normal mt-0.5 opacity-50">S</span>
    </button>
  )}
</div>
```

### Cards de choix refactorisées

**Avant (lignes 147-213 — card horizontale, glow, w-52) :**
```jsx
<div
  className="relative w-52 p-4 bg-game-bg-medium rounded-lg cursor-pointer ..."
  style={{
    borderWidth: '2px', borderStyle: 'solid', borderColor: rarityTier.color,
    boxShadow: isCommon ? 'none' : `0 0 ${glowPx}px ${rarityTier.color}`,
  }}
>
```

**Après (card verticale, border-left, sans glow) :**
```jsx
<div
  className="relative p-3 bg-game-bg-medium rounded-lg cursor-pointer transition-all animate-fade-in"
  style={{
    animationDelay: `${i * 50}ms`,
    animationFillMode: 'backwards',
    opacity: banishingIndex === i ? 0.2 : 1,
    transform: banishingIndex === i ? 'scale(0.95)' : undefined,
    transition: 'opacity 200ms ease-out, transform 200ms ease-out',
    borderLeft: `3px solid ${rarityTier.color}`,
    paddingLeft: 12,
    // PAS de boxShadow, PAS de borderWidth/borderStyle global
  }}
  onClick={() => applyChoice(choice)}
>
  {/* Bouton banish — position identique, sans boxShadow */}
  {banishCharges > 0 && choice.type !== 'stat_boost' && (
    <button
      className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center
                 rounded-full text-white text-xs font-bold
                 hover:scale-110 transition-transform cursor-pointer"
      style={{
        backgroundColor: '#ff3366',
        // boxShadow supprimé
        zIndex: 10,
      }}
      onClick={(e) => { e.stopPropagation(); handleBanish(choice, i) }}
      aria-label={`banish ${choice.name}`}
    >
      ✕
    </button>
  )}

  {/* Top row : badge rareté inline + level/NEW + shortcut aligné à droite */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
    {!isCommon && (
      <span style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        fontSize: 11,
        color: rarityTier.color,
        letterSpacing: '0.05em',
      }}>
        [{rarityTier.name.toUpperCase()}]
      </span>
    )}
    <span className={choice.level ? 'text-game-text-muted text-xs' : 'text-game-accent text-xs font-bold'}>
      {choice.level ? `Lv${choice.level}` : 'NEW'}
    </span>
    {/* Shortcut aligné à droite */}
    <span style={{
      marginLeft: 'auto',
      fontFamily: "'Space Mono', monospace",
      fontSize: 10,
      color: 'var(--rs-text-dim)',
    }}>
      [{i + 1}]
    </span>
  </div>

  <h3 className="text-game-text font-semibold text-sm">{choice.name}</h3>
  <p className="text-game-text-muted text-xs mt-0.5">
    {choice.statPreview ?? choice.description}
  </p>
</div>
```

> Note : La variable `glowPx` calculée à ligne 144 devient inutilisée — la supprimer pour éviter le warning lint.

### `damageMultiplier` — source correcte

`useBoons.getState().modifiers.damageMultiplier` est le multiplicateur de dégâts appliqué pendant la run (calculé par `computeFromBoons(activeBoons)` dans `useBoons.jsx`). Valeur par défaut : `1`.

Ce n'est **pas** `permanentUpgradeBonuses.attackPower` de `usePlayer` (celui-ci est le bonus permanent inter-run). Pour la colonne Build Overview, on affiche `modifiers.damageMultiplier` : valeur plus pertinente en cours de run.

La subscription Zustand `useBoons(s => s.modifiers.damageMultiplier ?? 1)` sera réactive : si un boon est sélectionné dans ce même niveau (applyChoice), le modal se fermera avant que la valeur change. La réactivité n'est donc pas critique ici — une lecture `getState()` au moment du mount suffirait aussi — mais la subscription est plus propre et cohérente avec le reste du composant.

### Suppressions dans le JSX actuel

| Élément à supprimer | Emplacement actuel |
|--------------------|--------------------|
| Block REROLL/SKIP sous les cards | Lignes 218-246 |
| `boxShadow` glow sur les cards | Ligne 159 |
| `boxShadow` sur le banish button | Ligne 172 |
| `w-52` et `p-4` sur les cards | Ligne 149 |
| Calcul `glowPx` | Ligne 144 |
| Emojis `↻` et `⏭` | Lignes 229, 242 |

### Aucune modification des éléments suivants

- Logique `applyChoice`, `handleReroll`, `handleSkip`, `handleBanish` — **inchangée**
- Keyboard handler (lignes 98-133) — **inchangé**
- `buildChoices`, `useEffect` mount — **inchangés**
- Stores : `usePlayer.jsx`, `useWeapons.jsx`, `useBoons.jsx` — **non modifiés**
- Systèmes : `progressionSystem.js`, `raritySystem.js` — **non modifiés**

### Project Structure Notes

**Fichier unique modifié :** `src/ui/LevelUpModal.jsx` (255 lignes)
- Ajout de 7 subscriptions Zustand (après ligne 19)
- Refonte du JSX retourné (lignes 135-254) : layout 2 colonnes, cards verticales, boutons dans colonne gauche
- La variable `glowPx` (ligne 144) devient orpheline — la supprimer

**Prérequis Story 33.1 (non modifiés dans cette story) :**
- `src/style.css` — variables `--rs-border`, `--rs-text-muted`, `--rs-text-dim`

**Fichiers lus mais non modifiés :**
- `src/stores/usePlayer.jsx` — confirmation des champs `currentHP`, `maxHP`, `currentLevel`, `shipBaseSpeed`
- `src/stores/useBoons.jsx` — confirmation de `modifiers.damageMultiplier`
- `src/stores/useWeapons.jsx` — confirmation de `activeWeapons.length`

### References

- Epic 33 spec Story 33.6: `_bmad-output/planning-artifacts/epic-33-ui-design-identity.md#Story-33.6`
- `LevelUpModal.jsx` source à lire en entier: `src/ui/LevelUpModal.jsx` (255 lignes)
- `usePlayer.jsx` — champs: `currentHP`, `maxHP`, `currentLevel`, `shipBaseSpeed`
- `useBoons.jsx` — champ: `modifiers.damageMultiplier`
- `useWeapons.jsx` — champ: `activeWeapons.length`
- `raritySystem.js` — `getRarityTier(rarity)` retourne `{ color, name, glowIntensity }` — `glowIntensity` n'est plus utilisé (glow supprimé)
- Story 33.5 (patterns SVG + StatLine): `_bmad-output/implementation-artifacts/33-5-ship-select-emoji-removal.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
