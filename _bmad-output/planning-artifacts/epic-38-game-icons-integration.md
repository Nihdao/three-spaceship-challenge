# Epic 38: Game Icons Integration — game-icons.net Library

Remplacer les icônes SVG géométriques custom (`icons/index.jsx`) par des icônes thématiques issues de la bibliothèque **game-icons.net** (`public/assets/1x1/`) pour enrichir l'identité visuelle sci-fi/roguelite du jeu.

## Epic Goals

- Remplacer les 12 icônes custom minimalistes par des icônes **game-icons.net** inlinées dans des composants React
- Choisir des icônes **thématiquement cohérentes** avec l'univers spatial et roguelite (laser, crâne sci-fi, propulseur, radar…)
- Maintenir l'**API existante** (`size`, `color`, `currentColor`) — zéro changement dans les consumers (HUD, ShipSelect, UpgradesScreen, etc.)
- Migrer `viewBox` de `0 0 16 16` vers `0 0 512 512` sans impacter les tailles d'affichage

## Epic Context

L'Epic 33 a remplacé les emojis par des icônes SVG inline custom dessinées à la main — minimalistes et correctes, mais génériques. Le projet dispose de 4 170 icônes game-icons.net dans `public/assets/1x1/` (répertoire organisé par auteur). Ces icônes sont pensées pour les jeux vidéo : skull-bolt, laser-burst, chain-lightning, thrust, radar-sweep… correspondent exactement aux stats du jeu.

Cette épic est **purement graphique** : seul `src/ui/icons/index.jsx` est modifié. Tous les composants consumers (`HUD.jsx`, `ShipSelect.jsx`, `UpgradesScreen.jsx`, `PauseMenu.jsx`, `StatLine.jsx`) restent intacts.

## Mapping des icônes

| Icône actuelle | Stat / Usage | Nouvelle icône | Fichier source |
|---|---|---|---|
| `SkullIcon` | kills, CURSE | `skull-bolt.svg` | `lorc/` |
| `SwordIcon` | ATTACK_POWER, highRisk | `laser-burst.svg` | `skoll/` |
| `LightningIcon` | ATTACK_SPEED | `chain-lightning.svg` | `willdabeast/` |
| `ShieldCrossIcon` | HP, MAX_HP, REGEN, revival | `health-normal.svg` | `sbed/` |
| `StarIcon` | score, EXP_BONUS, LUCK | `star-medal.svg` | `delapouite/` |
| `RerollIcon` | reroll charges | `dice-twenty-faces-twenty.svg` | `delapouite/` |
| `SkipIcon` | skip charges | `fast-forward-button.svg` | `delapouite/` |
| `BanishIcon` | banish | `cancel.svg` | `sbed/` |
| `FragmentIcon` | currency/fragments | `crystal-shine.svg` | `lorc/` |
| `ClockIcon` | cooldown timer | `hourglass.svg` | `lorc/` |
| `SpeedIcon` | vitesse vaisseau | `thrust.svg` | `felbrigg/` |
| `ZoneIcon` | zone / area | `radar-sweep.svg` | `lorc/` |

## Stories

### Story 38.1: Migration des icônes — game-icons.net dans `icons/index.jsx`

As a developer,
I want `src/ui/icons/index.jsx` to use paths extracted from game-icons.net SVGs,
So that all stats and HUD elements display thematic, game-appropriate icons.

**Acceptance Criteria:**

**Given** `src/ui/icons/index.jsx` mis à jour
**When** importé dans n'importe quel composant UI
**Then** les 12 composants exportés (`SkullIcon`, `SwordIcon`, `LightningIcon`, `ShieldCrossIcon`, `StarIcon`, `RerollIcon`, `SkipIcon`, `BanishIcon`, `FragmentIcon`, `ClockIcon`, `SpeedIcon`, `ZoneIcon`) utilisent les paths extraits des fichiers game-icons listés dans le mapping ci-dessus
**And** chaque composant accepte les props `size` (number, défaut 14) et `color` (string, défaut `'currentColor'`)
**And** le `fill` dans le SVG utilise `{color}` (pas `"#000"`) — pour que `currentColor` fonctionne
**And** le `viewBox` est `"0 0 512 512"` (viewBox original des game-icons)
**And** aucun `stroke` n'est utilisé — les game-icons sont fill-only

**Given** les consumers existants (`HUD.jsx`, `ShipSelect.jsx`, `UpgradesScreen.jsx`, `PauseMenu.jsx`)
**When** ils importent et utilisent les composants icônes
**Then** zéro modification dans ces fichiers — l'API est 100% rétrocompatible
**And** les couleurs explicites (via wrappers arrow function ou `color` prop) fonctionnent toujours

**Given** `vitest run`
**When** la migration est appliquée
**Then** tous les tests passent sans modification — aucun test n'inspecte le SVG path interne

## Dev Notes

### Approche technique : inline `<path>` avec `fill="currentColor"`

Chaque fichier source SVG game-icons a la structure :
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <path fill="#000" d="...long path data..." />
</svg>
```

Le composant React résultant remplace `fill="#000"` par `fill={color}` :
```jsx
export function SkullIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <path d="...path extrait du fichier source..." />
    </svg>
  )
}
```

Les SVGs avec plusieurs `<path>` (rares dans cette sélection) peuvent tous recevoir `fill={color}` via le `fill` sur la balise `<svg>` — les paths enfants héritent.

### Extraction des paths

Pour chaque icône, extraire uniquement la valeur `d="..."` du `<path>` dans le fichier source :

| Icône | Fichier source (chemin complet) |
|---|---|
| skull-bolt | `public/assets/1x1/lorc/skull-bolt.svg` |
| laser-burst | `public/assets/1x1/skoll/laser-burst.svg` |
| chain-lightning | `public/assets/1x1/willdabeast/chain-lightning.svg` |
| health-normal | `public/assets/1x1/sbed/health-normal.svg` |
| star-medal | `public/assets/1x1/delapouite/star-medal.svg` |
| dice-twenty-faces-twenty | `public/assets/1x1/delapouite/dice-twenty-faces-twenty.svg` |
| fast-forward-button | `public/assets/1x1/delapouite/fast-forward-button.svg` |
| cancel | `public/assets/1x1/sbed/cancel.svg` |
| crystal-shine | `public/assets/1x1/lorc/crystal-shine.svg` |
| hourglass | `public/assets/1x1/lorc/hourglass.svg` |
| thrust | `public/assets/1x1/felbrigg/thrust.svg` |
| radar-sweep | `public/assets/1x1/lorc/radar-sweep.svg` |

### CRITIQUE : viewBox 512 vs 16

Les icônes actuelles ont `viewBox="0 0 16 16"`. Les game-icons ont `viewBox="0 0 512 512"`. Le SVG `width={size} height={size}` gère le scaling automatiquement — le viewBox détermine le système de coordonnées interne, pas la taille affichée. **Aucun impact sur le rendu** tant que `width` et `height` sont fournis explicitement.

### Fichier unique modifié

`src/ui/icons/index.jsx` — remplacer le contenu entier.

Fichiers à lire avant (pour extraire les paths) :
- Les 12 fichiers SVG listés dans le tableau ci-dessus

Fichiers consumers à ne **pas** modifier :
- `src/ui/HUD.jsx`
- `src/ui/ShipSelect.jsx`
- `src/ui/UpgradesScreen.jsx`
- `src/ui/PauseMenu.jsx`
- `src/ui/primitives/StatLine.jsx`

### Tests

Aucun test n'inspecte le contenu SVG interne des icônes. `vitest run` passe sans modification de tests.
