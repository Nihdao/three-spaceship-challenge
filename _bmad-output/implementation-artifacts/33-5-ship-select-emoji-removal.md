# Story 33.5: Ship Select — Suppression des Emojis dans les Stats

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the Ship Select screen to display stat icons consistently with the rest of the UI,
so that no emojis appear anywhere in the ship selection screen.

## Acceptance Criteria

1. **[StatLine — 15 icônes remplacées]** Dans `ShipSelect.jsx`, tous les appels `<StatLine icon="..." />` avec des emojis sont mis à jour avec les composants SVG ou symboles Unicode neutres définis en Dev Notes. Les 15 stats suivantes sont couvertes : HP, REGEN, ARMOR, DAMAGE, ATTACK SPEED, ZONE, SPEED, MAGNET, LUCK, EXP BONUS, CURSE, REVIVAL, REROLL, SKIP, BANISH.

2. **[Icônes avec couleur explicite]** HP → `ShieldCrossIcon` `var(--rs-hp)`, DAMAGE → `SwordIcon` `var(--rs-orange)`, SPEED → `SpeedIcon` `var(--rs-teal)`, CURSE → `SkullIcon` `var(--rs-danger)`. Ces 4 icônes utilisent des wrappers arrow function pour forcer la couleur (voir Dev Notes).

3. **[Icônes sans couleur explicite]** ARMOR → `ShieldCrossIcon`, ATTACK SPEED → `ClockIcon`, ZONE → `ZoneIcon`, LUCK → `StarIcon`, EXP BONUS → `StarIcon`, REVIVAL → `ShieldCrossIcon`, REROLL → `RerollIcon`, SKIP → `SkipIcon`, BANISH → `BanishIcon` — tous passés directement comme composant (currentColor via StatLine).

4. **[Neutres Unicode]** REGEN `🔄` → `"+"`, MAGNET `🧲` → `"·"`. Pas de SVG équivalent dans la liste 33.1 pour ces deux stats.

5. **[Badge lock ship]** Le `🔒` à la ligne 261 (thumbnail de vaisseau verrouillé) est remplacé par un label `LOCKED` en `Space Mono`, couleur `var(--rs-text-dim, rgba(255,255,255,0.3))` — voir pattern Dev Notes.

6. **[Traits — TRAIT_ICON_MAP]** La section Traits (lignes 408–420) ne rend plus `{info.icon}` directement. Un objet `TRAIT_ICON_MAP` local mappe `traitId` → composant SVG : `highRisk → SwordIcon`, `tanky → ShieldCrossIcon`. Pour un traitId sans mapping, afficher `"·"`. `shipDefs.js` n'est PAS modifié.

7. **[Prérequis Story 33.1 respecté]** `src/ui/icons/index.jsx` existe, `StatLine.jsx` accepte des composants SVG (`typeof icon === 'function'`). Si 33.1 n'est pas `done`, l'implémenter en premier dans ce même contexte.

8. **[Pas de régression]** Sélection de vaisseau, level-up, skin selector, navigation clavier (flèches, Enter, ESC), affichage des effectiveStats avec bonuses permanents — tout fonctionne identiquement. `vitest run` passe (les tests ne testent pas les icônes).

## Tasks / Subtasks

- [x] Task 1: Vérifier que Story 33.1 est implémentée (prérequis)
  - [x] Confirmer que `src/ui/icons/index.jsx` existe et exporte : `ShieldCrossIcon`, `SwordIcon`, `SpeedIcon`, `SkullIcon`, `ClockIcon`, `ZoneIcon`, `StarIcon`, `RerollIcon`, `SkipIcon`, `BanishIcon`
  - [x] Confirmer que `StatLine.jsx` ligne 17 gère `typeof icon === 'function'`
  - [x] Confirmer que `src/style.css` définit `--rs-hp`, `--rs-orange`, `--rs-teal`, `--rs-danger`, `--rs-text-dim`

- [x] Task 2: Ajouter les imports et constantes dans `ShipSelect.jsx`
  - [x] Lire `src/ui/ShipSelect.jsx` en entier avant modification
  - [x] Ajouter l'import en tête de fichier : `import { ShieldCrossIcon, SwordIcon, SpeedIcon, SkullIcon, ClockIcon, ZoneIcon, StarIcon, RerollIcon, SkipIcon, BanishIcon } from './icons/index.jsx'`
  - [x] Définir `TRAIT_ICON_MAP` au niveau module (après imports, avant `ShipSelect`) — voir Dev Notes

- [x] Task 3: Remplacer les 15 props `icon` des StatLine (lignes 310–401)
  - [x] HP ligne 314 : `icon="❤️"` → wrapper `() => <ShieldCrossIcon size={14} color="var(--rs-hp)" />`
  - [x] REGEN ligne 320 : `icon="🔄"` → `icon="+"`
  - [x] ARMOR ligne 326 : `icon="🛡️"` → `icon={ShieldCrossIcon}`
  - [x] DAMAGE ligne 333 : `icon="⚔️"` → wrapper `() => <SwordIcon size={14} color="var(--rs-orange)" />`
  - [x] ATTACK SPEED ligne 339 : `icon="⏱️"` → `icon={ClockIcon}`
  - [x] ZONE ligne 345 : `icon="💥"` → `icon={ZoneIcon}`
  - [x] SPEED ligne 350 : `icon="⚡"` → wrapper `() => <SpeedIcon size={14} color="var(--rs-teal)" />`
  - [x] MAGNET ligne 355 : `icon="🧲"` → `icon="·"`
  - [x] LUCK ligne 360 : `icon="🍀"` → `icon={StarIcon}`
  - [x] EXP BONUS ligne 365 : `icon="✨"` → `icon={StarIcon}`
  - [x] CURSE ligne 371 : `icon="☠️"` → wrapper `() => <SkullIcon size={14} color="var(--rs-danger)" />`
  - [x] REVIVAL ligne 378 : `icon="💚"` → `icon={ShieldCrossIcon}`
  - [x] REROLL ligne 384 : `icon="🎲"` → `icon={RerollIcon}`
  - [x] SKIP ligne 390 : `icon="⏭️"` → `icon={SkipIcon}`
  - [x] BANISH ligne 397 : `icon="🚫"` → `icon={BanishIcon}`

- [x] Task 4: Remplacer le badge `🔒` et adapter la section Traits
  - [x] Ligne 261 : remplacer le string `'🔒'` par le composant LOCKED text — voir Dev Notes
  - [x] Lignes 408–420 : remplacer `<span className="flex-shrink-0">{info.icon}</span>` par le rendu via `TRAIT_ICON_MAP` — voir Dev Notes

- [x] Task 5: QA et vérification
  - [x] `vitest run` passe (`ShipSelect.enrichedStats.test.js` — ne teste pas les icônes) — 2295 tests ✅
  - [x] Vérifier visuellement : HP en rouge (#rs-hp), DAMAGE en orange, SPEED en teal, CURSE en rouge danger
  - [x] Vérifier que les 11 icônes currentColor s'affichent en couleur muted du texte
  - [x] Vérifier `+` et `·` pour REGEN et MAGNET — lisibles et alignés avec les autres
  - [x] Vérifier que le badge `LOCKED` remplace bien `🔒` sur les ships verrouillés
  - [x] Vérifier les traits `highRisk` (SwordIcon) et `tanky` (ShieldCrossIcon) dans la section Traits
  - [x] Vérifier navigation clavier, sélection ship, level-up, skin selector — comportement inchangé

## Dev Notes

### CRITIQUE : Dépendance Story 33.1 obligatoire

Cette story utilise massivement l'infrastructure de Story 33.1 :
- `src/ui/icons/index.jsx` — les 10 composants SVG requis
- `src/ui/primitives/StatLine.jsx` — mise à jour `typeof icon === 'function'`
- `src/style.css` — variables `--rs-hp: #ff3355`, `--rs-orange: #ff6b35`, `--rs-teal: #00ffcc`, `--rs-danger: #ff3366`, `--rs-text-dim: rgba(232,232,240,0.3)`

Si Story 33.1 n'est pas implémentée, l'implémenter d'abord (les CSS vars seront absentes et les composants SVG inexistants).

### CRITIQUE : Comment passer des couleurs explicites via StatLine

**Problème** : `StatLine` (après Story 33.1) rend toujours `<Icon size={14} color="currentColor" />`. Le parent `<span>` a `text-game-text-muted` comme couleur CSS — donc `currentColor` hérite cette couleur muted (blanc à 55%).

**Solution pour les 4 icônes avec couleur sémantique** (HP, DAMAGE, SPEED, CURSE) : passer une **arrow function wrapper** qui ignore les props et force la couleur :

```jsx
// HP — couleur var(--rs-hp) forcée
<StatLine compact
  label="HP"
  value={Math.round(effectiveStats.maxHP)}
  bonusValue={bonuses.maxHP}
  icon={() => <ShieldCrossIcon size={14} color="var(--rs-hp)" />}
/>
```

Le `typeof icon === 'function'` de StatLine est `true` pour une arrow function. StatLine appelle `<Icon size={14} color="currentColor" />` mais Icon (l'arrow function) ignore ses props et rend directement `<ShieldCrossIcon size={14} color="var(--rs-hp)" />` — la couleur explicite prime.

**Pour les 11 icônes sans couleur spécifique** : passer le composant directement — StatLine le rend avec `currentColor` (couleur muted = OK visuellement).

```jsx
// ARMOR — currentColor (hérite text-game-text-muted)
<StatLine compact label="ARMOR" value={...} icon={ShieldCrossIcon} />
```

### Mapping complet des 15 StatLine

| Label | Ligne | Emoji actuel | Remplacement | Couleur |
|-------|-------|--------------|--------------|---------|
| HP | 314 | `❤️` | `() => <ShieldCrossIcon size={14} color="var(--rs-hp)" />` | #ff3355 |
| REGEN | 320 | `🔄` | `"+"` | neutral |
| ARMOR | 326 | `🛡️` | `ShieldCrossIcon` | currentColor |
| DAMAGE | 333 | `⚔️` | `() => <SwordIcon size={14} color="var(--rs-orange)" />` | #ff6b35 |
| ATTACK SPEED | 339 | `⏱️` | `ClockIcon` | currentColor |
| ZONE | 345 | `💥` | `ZoneIcon` | currentColor |
| SPEED | 350 | `⚡` | `() => <SpeedIcon size={14} color="var(--rs-teal)" />` | #00ffcc |
| MAGNET | 355 | `🧲` | `"·"` | neutral |
| LUCK | 360 | `🍀` | `StarIcon` | currentColor |
| EXP BONUS | 365 | `✨` | `StarIcon` | currentColor |
| CURSE | 371 | `☠️` | `() => <SkullIcon size={14} color="var(--rs-danger)" />` | #ff3366 |
| REVIVAL | 378 | `💚` | `ShieldCrossIcon` | currentColor |
| REROLL | 384 | `🎲` | `RerollIcon` | currentColor |
| SKIP | 390 | `⏭️` | `SkipIcon` | currentColor |
| BANISH | 397 | `🚫` | `BanishIcon` | currentColor |

> **Note sur les doublons** : `ShieldCrossIcon` est utilisé pour HP (rouge) et ARMOR/REVIVAL (currentColor). `StarIcon` est utilisé pour LUCK et EXP BONUS (currentColor). C'est acceptable — les labels texte différencient les stats.

### Badge LOCKED — remplacement de '🔒' (ligne 261)

**Actuel (ligne 259–264) :**
```jsx
<div className="aspect-square bg-game-text-muted/5 rounded mb-2 flex items-center justify-center text-3xl overflow-hidden">
  {ship.locked
    ? '🔒'
    : <ShipModelPreview modelPath={ship.modelPath} />
  }
</div>
```

**Cible — remplacer `'🔒'` par :**
```jsx
{ship.locked ? (
  <span style={{
    fontSize: 10,
    fontFamily: "'Space Mono', monospace",
    color: 'var(--rs-text-dim, rgba(255,255,255,0.3))',
    letterSpacing: '0.05em',
    userSelect: 'none',
  }}>
    LOCKED
  </span>
) : (
  <ShipModelPreview modelPath={ship.modelPath} />
)}
```

Note : le bouton parent a déjà `opacity-40 grayscale` pour les ships locked — le `LOCKED` text est un complément visuel léger, pas la seule indication de verrouillage.

### TRAIT_ICON_MAP et section Traits

**Constante à ajouter au niveau module** (après imports, avant le composant `ShipSelect`) :
```js
const TRAIT_ICON_MAP = {
  highRisk: SwordIcon,    // ⚔ High Risk — lame de combat
  tanky: ShieldCrossIcon, // 🛡 Heavy Armor — bouclier
}
```

**Render actuel (lignes 408–420) :**
```jsx
{selectedShip.traits.map(traitId => {
  const info = TRAIT_INFO[traitId]
  if (!info) return null
  return (
    <div key={traitId} className="flex items-center gap-1.5 text-sm text-game-text" title={info.description}>
      <span className="flex-shrink-0">{info.icon}</span>  {/* ← emoji ici */}
      <span>{info.label}</span>
    </div>
  )
})}
```

**Cible — remplacer le span emoji :**
```jsx
{selectedShip.traits.map(traitId => {
  const info = TRAIT_INFO[traitId]
  if (!info) return null
  const TraitIcon = TRAIT_ICON_MAP[traitId]
  return (
    <div key={traitId} className="flex items-center gap-1.5 text-sm text-game-text" title={info.description}>
      <span className="flex-shrink-0">
        {TraitIcon
          ? <TraitIcon size={14} color="currentColor" />
          : '·'
        }
      </span>
      <span>{info.label}</span>
    </div>
  )
})}
```

`shipDefs.js` n'est PAS modifié — `info.icon` existe toujours dans les defs mais n'est plus utilisé dans le rendu.

### Import à ajouter — ligne 1–12 (après les imports existants)

```jsx
// Ajouter après la ligne 11 (import ShipModelPreview) :
import {
  ShieldCrossIcon,
  SwordIcon,
  SpeedIcon,
  SkullIcon,
  ClockIcon,
  ZoneIcon,
  StarIcon,
  RerollIcon,
  SkipIcon,
  BanishIcon,
} from './icons/index.jsx'
```

### Éléments hors scope (ne pas modifier)

- `★ MAX LEVEL` badge (ligne 480) : `★` est U+2605 — caractère Unicode, pas un emoji. Acceptable.
- `◆` dans le bouton LEVEL UP (ligne 495) : losange Unicode. Acceptable.
- `selectedShip.colorTheme` dans les styles — inline, pas un emoji.
- `✓ Discovered` si présent ailleurs — caractère ASCII.
- Les skin buttons utilisent `tintColor` CSS (couleur), pas d'emoji.
- **Ne pas modifier** `shipDefs.js` (`TRAIT_INFO.icon` reste, juste ignoré dans le rendu).
- **Ne pas modifier** les stores (`useShipProgression`, `usePlayer`, `useUpgrades`).
- **Zéro changement** de la logique de sélection, level-up, skin.

### Tests existants

`src/ui/__tests__/ShipSelect.enrichedStats.test.js` (270 lignes) — teste la logique de calcul des `effectiveStats` et `bonuses`. **Aucun test n'inspecte les props `icon` des StatLine.** La story 33.5 ne modifie aucune logique de calcul : aucun test ne devrait casser.

`vitest run` doit passer sans modification de logique.

### Previous Story Intelligence (from 33.3, 33.4)

- Pattern de rendu icône avec couleur via arrow wrapper : `icon={() => <SomeIcon size={14} color="var(--rs-color)" />}` — établi pour les cas où currentColor ne suffit pas
- Pattern `const IconComp = MAP[id]` → `<IconComp size={14} />` — pour le render conditionnel depuis une map

### Project Structure Notes

**Fichier unique modifié :** `src/ui/ShipSelect.jsx` (517 lignes)
- Ajout de l'import des 10 icônes SVG (après ligne 11)
- Ajout de `TRAIT_ICON_MAP` (niveau module, après imports)
- Remplacement des 15 props `icon` dans la section StatLine (lignes 310–401)
- Remplacement de `'🔒'` par le label texte (ligne 261)
- Mise à jour du rendu Traits (lignes 408–420)

**Fichiers prérequis (Story 33.1, non modifiés dans cette story) :**
- `src/ui/icons/index.jsx` — composants SVG
- `src/ui/primitives/StatLine.jsx` — détection `typeof icon === 'function'`
- `src/style.css` — variables `--rs-*`

**Fichier lu mais non modifié :** `src/entities/shipDefs.js` (TRAIT_INFO)

### References

- Epic 33 spec Story 33.5: `_bmad-output/planning-artifacts/epic-33-ui-design-identity.md#Story-33.5`
- Story 33.1 (prérequis SVG + StatLine update): `_bmad-output/implementation-artifacts/33-1-svg-icon-system.md`
- Story 33.4 (pattern TRAIT_ICON_MAP analogue à WEAPON_ICONS — pas utilisé ici mais similaire): `_bmad-output/implementation-artifacts/33-4-armory-panel.md`
- ShipSelect source à lire en entier: `src/ui/ShipSelect.jsx` (517 lignes)
- StatLine actuel: `src/ui/primitives/StatLine.jsx`
- shipDefs TRAIT_INFO (emojis à bypasser): `src/entities/shipDefs.js:69-80`
- Tests à ne pas casser: `src/ui/__tests__/ShipSelect.enrichedStats.test.js`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_No issues encountered._

### Completion Notes List

- Prérequis 33.1 entièrement satisfaits : icons/index.jsx, StatLine typeof-function, CSS vars --rs-*.
- 15 props `icon` des StatLine remplacées : 4 wrappers avec couleur explicite (HP, DAMAGE, SPEED, CURSE), 9 composants directs currentColor, 2 chaînes Unicode (REGEN `+`, MAGNET `·`).
- Badge `🔒` remplacé par label `LOCKED` en Space Mono avec var(--rs-text-dim).
- `TRAIT_ICON_MAP` ajouté au niveau module : highRisk → SwordIcon, tanky → ShieldCrossIcon. Les traitIds sans mapping affichent `·`.
- `shipDefs.js` non modifié — `TRAIT_INFO.icon` conservé mais ignoré dans le rendu.
- 2295 tests passent sans régression.
- **Code review fix**: 4 arrow function wrappers pour icônes colorées (HP, DAMAGE, SPEED, CURSE) déplacés en constantes module-level (`HPIcon`, `DamageIcon`, `SpeedStatIcon`, `CurseIcon`) — évite la création de nouvelles instances par render et donne un displayName aux composants. `userSelect: 'none'` redondant retiré du span LOCKED (parent button a déjà `select-none`).

### File List

- src/ui/ShipSelect.jsx

## Change Log

- 2026-02-23: Story 33.5 implémentée — suppression des emojis dans ShipSelect.jsx. Import de 10 composants SVG depuis icons/index.jsx, TRAIT_ICON_MAP module-level, 15 StatLine icons remplacées (4 wrappers couleur + 9 currentColor + 2 Unicode), badge LOCKED texte, rendu Traits via map SVG.
- 2026-02-23: Code review — 4 icon wrappers hoistés en constantes module-level (HPIcon, DamageIcon, SpeedStatIcon, CurseIcon) ; userSelect:none redondant retiré du span LOCKED.
