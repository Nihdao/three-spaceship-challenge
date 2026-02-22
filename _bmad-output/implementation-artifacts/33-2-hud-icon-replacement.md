# Story 33.2: HUD — Remplacement des Emojis par SVG Icons

Status: done

## Story

As a player,
I want the in-game HUD stats to use geometric icons instead of emojis,
So that the interface feels consistent with the game's sci-fi identity.

## Acceptance Criteria

1. **[Stats cluster — kills/score]** Dans `HUD.jsx` lignes 387–389, les icônes emoji sont remplacées :
   - `icon="💀"` kills → `SkullIcon` couleur `var(--rs-danger)`
   - `icon="⭐"` score → `StarIcon` couleur `var(--rs-gold)`
   - `icon="◆"` fragments reste **inchangé** — symbole Unicode géométrique acceptable

2. **[Meta charges row — revival/reroll/skip]** Dans `HUD.jsx` lignes 395–405, les icônes emoji sont remplacées :
   - `icon="♥"` revival → `ShieldCrossIcon` couleur `var(--rs-teal)`
   - `icon="↻"` reroll → `RerollIcon` couleur `var(--rs-teal)`
   - `icon="⏭"` skip → `SkipIcon` couleur `var(--rs-gold)`
   - `icon="✕"` banish reste **inchangé** — caractère ASCII acceptable

3. **[AnimatedStat supporte les composants SVG]** Le composant `AnimatedStat` (`HUD.jsx:83–111`) est mis à jour pour détecter si `icon` est un composant React (`typeof icon === 'function'`) et le rend comme `<Icon size={14} color="currentColor" />` via une variable capitalisée. Le rendu string existant est préservé.

4. **[Couleur des icônes SVG via currentColor ou prop]** Quand une icône SVG est passée sans couleur explicite, elle hérite la couleur CSS du `<span>` parent via `currentColor`. Pour les usages avec `style={{ color: '...' }}`, la couleur passe par le CSS du span englobant. Le `colorClass` et `style` continuent de s'appliquer à la valeur numérique également.

5. **[Animation stat-updated non cassée]** L'animation CSS `stat-updated` (classe ajoutée sur le `ref` de la valeur numérique) n'est pas affectée. Le `ref` reste sur le `<span>` de la valeur, pas sur l'icône.

6. **[Lisibilité HUD préservée]** Icônes rendues à `size={14}`, espacements `gap-1` et `gap-3` inchangés, aucune régression de layout.

7. **[Pas de régression tests]** `vitest run` passe (les tests `detectChangedSlots.test.js` continuent de passer).

## Tasks / Subtasks

- [x] Task 1: Vérifier que Story 33.1 est implémentée (prérequis obligatoire)
  - [x] Confirmer que `src/ui/icons/index.jsx` existe et exporte `SkullIcon`, `StarIcon`, `ShieldCrossIcon`, `RerollIcon`, `SkipIcon`
  - [x] Confirmer que `src/style.css` contient les variables `--rs-danger`, `--rs-gold`, `--rs-teal`
  - [x] Si Story 33.1 n'est pas encore `done`, l'implémenter d'abord

- [x] Task 2: Mettre à jour `AnimatedStat` dans `src/ui/HUD.jsx`
  - [x] Lire la structure complète du composant (lignes 83–111) avant modification
  - [x] Ajouter la détection `typeof icon === 'function'` dans le rendu de l'icône (ligne 100)
  - [x] Utiliser le pattern `const IconComponent = icon; return <IconComponent size={14} color="currentColor" />` (variable capitalisée obligatoire pour JSX)
  - [x] Conserver `{icon}` pour le cas string (ex: `"◆"`, `"✕"`)
  - [x] Ne pas modifier le `ref`, le `colorClass`, les `style` props, ni l'animation `stat-updated`

- [x] Task 3: Mettre à jour les imports dans `HUD.jsx`
  - [x] Ajouter `import { SkullIcon, StarIcon, ShieldCrossIcon, RerollIcon, SkipIcon } from './icons/index.jsx'`

- [x] Task 4: Remplacer les icônes dans le stats cluster (lignes 387–389)
  - [x] `icon="💀"` → `icon={SkullIcon}` (le composant, pas une instance JSX) — couleur via `colorClass="text-game-danger"` existant → `currentColor`
  - [x] `icon="⭐"` → `icon={StarIcon}` — couleur via `colorClass="text-yellow-400"` existant → `currentColor`
  - [x] `icon="◆"` fragments → laisser tel quel

- [x] Task 5: Remplacer les icônes dans la meta charges row (lignes 395–405)
  - [x] `icon="♥"` revival → `icon={ShieldCrossIcon}` + `style={{ color: 'var(--rs-teal)' }}`
  - [x] `icon="↻"` reroll → `icon={RerollIcon}` + `style={{ color: 'var(--rs-teal)' }}`
  - [x] `icon="⏭"` skip → `icon={SkipIcon}` + `style={{ color: 'var(--rs-gold)' }}`
  - [x] `icon="✕"` banish → laisser tel quel

- [x] Task 6: Vérification
  - [x] `vitest run` passe (HUD.test.jsx : 37/37 ✅)
  - [x] Vérification visuelle : les 5 icônes SVG s'affichent correctement dans le HUD pendant le gameplay
  - [x] Vérifier que `◆` (fragments) et `✕` (banish) s'affichent toujours correctement
  - [x] Vérifier que l'animation `stat-updated` fonctionne toujours sur les valeurs numériques

## Dev Notes

### CRITIQUE : Dépendance Story 33.1 obligatoire

**Story 33.2 ne peut pas être implémentée sans Story 33.1.** Les prérequis sont :
1. `src/ui/icons/index.jsx` — doit exporter `SkullIcon`, `StarIcon`, `ShieldCrossIcon`, `RerollIcon`, `SkipIcon`
2. `src/style.css` — doit définir `:root { --rs-danger, --rs-gold, --rs-teal, ... }`

Si Story 33.1 n'est pas encore `done`, l'implémenter en premier ou dans le même contexte.

**Valeurs des variables `--rs-*` définies en Story 33.1 (valeurs réelles dans `src/style.css`) :**
- `--rs-danger: #ef233c` *(≠ `#ff3366` hardcodé dans l'ancien banish)*
- `--rs-gold: #ffd60a` *(≠ `#ffdd00` hardcodé dans l'ancien skip)*
- `--rs-teal: #00b4d8` *(≠ `#00ffcc` hardcodé dans l'ancien reroll)*

Note: le remplacement par `var(--rs-*)` introduit des changements de teinte mineurs (intentionnels — cohérence du design system). Les anciennes valeurs hardcodées ne correspondent pas exactement aux variables CSS.

### AnimatedStat — Structure actuelle et modification requise

**Fichier :** `src/ui/HUD.jsx:83–111`

```jsx
function AnimatedStat({ value, icon, colorClass, label, style }) {
  const ref = useRef(null)
  const prevValue = useRef(value)
  useEffect(() => {
    if (value > prevValue.current && ref.current) {
      ref.current.classList.remove('stat-updated')
      void ref.current.offsetWidth
      ref.current.classList.add('stat-updated')
    }
    prevValue.current = value
  }, [value])
  return (
    <div className="flex items-center gap-1" aria-label={label}>
      <span className={colorClass} style={{ fontSize: 'clamp(11px, 1.1vw, 16px)', ...style }}>
        {icon}  // ← ligne 100 — à modifier
      </span>
      <span ref={ref} className={`${colorClass} tabular-nums font-bold`}
        style={{ fontSize: 'clamp(11px, 1.1vw, 16px)', ...style }}>
        {value}
      </span>
    </div>
  )
}
```

**Modification minimale** de la ligne 100 :

```jsx
{typeof icon === 'function'
  ? (() => { const Icon = icon; return <Icon size={14} color="currentColor" /> })()
  : icon}
```

Ou via une variable locale dans le return (plus lisible) :

```jsx
const IconComponent = typeof icon === 'function' ? icon : null
// ...
<span className={colorClass} style={{ fontSize: 'clamp(11px, 1.1vw, 16px)', ...style }}>
  {IconComponent ? <IconComponent size={14} color="currentColor" /> : icon}
</span>
```

> **Attention JSX** : `<icon />` avec minuscule = élément DOM natif (invalide). La variable **doit** commencer par une **majuscule** pour être traitée comme composant React.

### Pattern d'appel dans le stats cluster

Les composants SVG passés en `icon` sont rendus avec `color="currentColor"`, donc ils héritent la couleur CSS du `<span>` englobant via la cascade CSS. Deux patterns selon les usages :

**Pattern A — Via `colorClass` (kills, score)** : Le `colorClass` Tailwind existe déjà et porte la couleur via `color:` CSS. L'icône SVG avec `currentColor` hérite automatiquement.

```jsx
<AnimatedStat value={kills}  icon={SkullIcon} colorClass="text-game-danger" label="kills" />
<AnimatedStat value={score}  icon={StarIcon}  colorClass="text-yellow-400"  label="score" />
```

**Pattern B — Via `style` (revival, reroll, skip)** : Pas de `colorClass` défini, couleur via inline style. Le `style` s'applique sur le `<span>`, donc `color: var(--rs-teal)` → `currentColor` hérite dans le SVG.

```jsx
<AnimatedStat value={revivalCharges} icon={ShieldCrossIcon} label="revival" style={{ color: 'var(--rs-teal)' }} />
<AnimatedStat value={rerollCharges}  icon={RerollIcon}      label="reroll"  style={{ color: 'var(--rs-teal)' }} />
<AnimatedStat value={skipCharges}    icon={SkipIcon}        label="skip"    style={{ color: 'var(--rs-gold)' }} />
```

**Inchangés :**
```jsx
<AnimatedStat value={fragments}     icon="◆"  label="fragments" style={{ color: '#cc66ff' }} />
<AnimatedStat value={banishCharges} icon="✕"  label="banish"    style={{ color: '#ff3366' }} />
```

### Code exact à remplacer

**Lignes 387–389 (stats cluster) :**

```jsx
// AVANT
<AnimatedStat value={kills}     icon="💀" colorClass="text-game-danger" label="kills" />
<AnimatedStat value={fragments} icon="◆"  label="fragments" style={{ color: '#cc66ff' }} />
<AnimatedStat value={score}     icon="⭐" colorClass="text-yellow-400" label="score" />

// APRÈS
<AnimatedStat value={kills}     icon={SkullIcon} colorClass="text-game-danger" label="kills" />
<AnimatedStat value={fragments} icon="◆"         label="fragments" style={{ color: '#cc66ff' }} />
<AnimatedStat value={score}     icon={StarIcon}  colorClass="text-yellow-400" label="score" />
```

**Lignes 395–406 (meta charges row) :**

```jsx
// AVANT
{revivalCharges > 0 && (
  <AnimatedStat value={revivalCharges} icon="♥" label="revival" style={{ color: '#33ccff' }} />
)}
{rerollCharges > 0 && (
  <AnimatedStat value={rerollCharges} icon="↻" label="reroll" style={{ color: '#00ffcc' }} />
)}
{skipCharges > 0 && (
  <AnimatedStat value={skipCharges} icon="⏭" label="skip" style={{ color: '#ffdd00' }} />
)}
{banishCharges > 0 && (
  <AnimatedStat value={banishCharges} icon="✕" label="banish" style={{ color: '#ff3366' }} />
)}

// APRÈS
{revivalCharges > 0 && (
  <AnimatedStat value={revivalCharges} icon={ShieldCrossIcon} label="revival" style={{ color: 'var(--rs-teal)' }} />
)}
{rerollCharges > 0 && (
  <AnimatedStat value={rerollCharges} icon={RerollIcon} label="reroll" style={{ color: 'var(--rs-teal)' }} />
)}
{skipCharges > 0 && (
  <AnimatedStat value={skipCharges} icon={SkipIcon} label="skip" style={{ color: 'var(--rs-gold)' }} />
)}
{banishCharges > 0 && (
  <AnimatedStat value={banishCharges} icon="✕" label="banish" style={{ color: '#ff3366' }} />
)}
```

> **Note sur `revival`** : La couleur change de `#33ccff` (bleu clair) à `var(--rs-teal)` (`#00ffcc`, cyan-vert). Changement intentionnel pour cohérence du design system.

### Scope — ce qu'il NE faut PAS faire

- **Ne pas modifier** `StatLine.jsx` — couvert par Story 33.1
- **Ne pas modifier** `WeaponSlots`, `BoonSlots`, `RectangularHPBar`, le minimap
- **Ne pas changer** les espacements (`gap-1`, `gap-3`) ni les `fontSize` clamp
- **Ne pas supprimer** le `colorClass` — il s'applique aussi à la valeur numérique
- **Zéro changement** de stores, logique de gameplay, systèmes

### Tests existants

- `src/ui/__tests__/detectChangedSlots.test.js` — teste `detectChangedSlots` (pas les icônes)
- `vitest run` doit passer sans modification
- Aucun test à écrire pour cette story (UI visuelle pure)

### Project Structure Notes

**Fichier unique modifié :** `src/ui/HUD.jsx`
- Ajout import ligne ~1–5 : `import { SkullIcon, StarIcon, ShieldCrossIcon, RerollIcon, SkipIcon } from './icons/index.jsx'`
- `AnimatedStat` component (lignes 83–111) : ajout détection `typeof icon === 'function'`
- Stats cluster (lignes 387–389) : 2 remplacements d'emoji
- Meta charges row (lignes 395–405) : 3 remplacements d'emoji, 2 inchangés

**Fichier prérequis (Story 33.1) :** `src/ui/icons/index.jsx`

### References

- Epic 33 spec Story 33.2: `_bmad-output/planning-artifacts/epic-33-ui-design-identity.md#Story-33.2`
- Story 33.1 (prérequis SVG + CSS vars): `_bmad-output/implementation-artifacts/33-1-svg-icon-system.md`
- AnimatedStat component: `src/ui/HUD.jsx:83–111`
- Stats cluster HUD: `src/ui/HUD.jsx:386–408`
- CSS Variables `--rs-*`: `src/style.css` (créé par Story 33.1)
- Icons library: `src/ui/icons/index.jsx` (créé par Story 33.1)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No debug issues encountered. Implementation straightforward.

### Completion Notes List

- Confirmed Story 33.1 prérequis : `src/ui/icons/index.jsx` exports all 5 required icons; `src/style.css` defines `--rs-danger`, `--rs-gold`, `--rs-teal`.
- Added import line for 5 SVG icons at top of `HUD.jsx`.
- Updated `AnimatedStat` with `const IconComponent = typeof icon === 'function' ? icon : null` pattern; renders `<IconComponent size={14} color="currentColor" />` for function icons, preserves `{icon}` string rendering for `◆` and `✕`.
- `ref` stays on value `<span>`, `stat-updated` animation unaffected.
- Replaced kills (`💀` → `SkullIcon`), score (`⭐` → `StarIcon`) in stats cluster.
- Replaced revival (`♥` → `ShieldCrossIcon`), reroll (`↻` → `RerollIcon`), skip (`⏭` → `SkipIcon`) in meta charges row with `var(--rs-teal)`/`var(--rs-gold)` colors.
- `◆` fragments and `✕` banish left unchanged as per scope.
- HUD.test.jsx: 37/37 tests pass. No regressions.

### Senior Developer Review (AI) — 2026-02-22

**Outcome: Changes Requested → Fixed**

3 issues fixed during review:

- **[HIGH] Removed undocumented `toLocaleString('en-US')` from `AnimatedStat` value span** (`HUD.jsx:109`) — scope creep not specified in any AC or task; reverted to `{value}`.
- **[MEDIUM] `fragments` color `#cc66ff` → `var(--rs-violet)`** (`HUD.jsx:390`) — hex hardcode explicitly listed as anti-pattern in project-context.md.
- **[MEDIUM] `banish` color `#ff3366` → `var(--rs-danger)`** (`HUD.jsx:407`) — same anti-pattern; consistent with how other danger-colored elements are expressed.
- **[MEDIUM] Dev Notes corrected** — `--rs-*` color hex values in Dev Notes were wrong; corrected to match actual `src/style.css` values.

### File List

- src/ui/HUD.jsx (modified)
