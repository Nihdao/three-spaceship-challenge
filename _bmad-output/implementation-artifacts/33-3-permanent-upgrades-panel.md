# Story 33.3: Permanent Upgrades — Panel Conteneur & Design System

Status: ready-for-dev

## Story

As a player,
I want the Permanent Upgrades screen to feel anchored and contained,
So that it doesn't look like floating cards over the 3D scene.

## Acceptance Criteria

1. **[Panel conteneur — layout principal]** `UpgradesScreen.jsx` : le contenu principal est enveloppé dans un `<div>` avec `background: var(--rs-bg-surface)` et `border: 1px solid var(--rs-border)`. Le panel a `clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)` (coin supérieur droit coupé). La largeur est `clamp(640px, 70vw, 960px)`, `maxHeight: '85vh'`, avec `overflowY: 'auto'` interne.

2. **[Suppression du fond flou]** Le `backdrop-blur-sm` et `bg-black/40` présents sur les `UpgradeCard` et l'ancien conteneur principal sont supprimés. Plus de `.backdrop-blur-sm` dans ce composant.

3. **[Header — titre]** Le titre `PERMANENT UPGRADES` utilise `fontFamily: 'Bebas Neue, sans-serif'`, `letterSpacing: '0.15em'`. Le `textShadow: '0 0 30px rgba(204, 102, 255, 0.3)'` existant est **supprimé**.

4. **[Header — solde fragments]** L'affichage du solde (actuellement couleur `#cc66ff` hardcodée) utilise `color: 'var(--rs-violet)'` à la place.

5. **[Header — bouton REFUND ALL]** Le bouton REFUND ALL (actuellement `bg-red-600 hover:bg-red-700 text-white`) est remplacé par un style outline danger : `border: '1px solid var(--rs-danger)'`, `color: 'var(--rs-danger)'`, fond `transparent`. Hover : `background: 'rgba(255, 51, 102, 0.1)'` via onMouseEnter/Leave.

6. **[UpgradeCard — fond et bordure]** Chaque card utilise `background: 'var(--rs-bg-raised)'` et `border: '1px solid var(--rs-border)'` au repos. Les classes Tailwind `bg-black/40 backdrop-blur-sm` sont supprimées.

7. **[UpgradeCard — hover affordable]** Le hover quand `canAfford` et non maxé remplace `hover:border-[#cc66ff]/60` par `borderColor: 'rgba(204, 102, 255, 0.6)'` (= `var(--rs-violet)` à 60%). Le `hover:bg-black/50` est remplacé par `background: 'rgba(26, 24, 40, 0.95)'` (légèrement plus clair que bg-raised).

8. **[UpgradeCard — couleurs violet]** `text-[#cc66ff]` (bonus text) est remplacé par `color: 'var(--rs-violet)'`. Le bouton coût inline `border-[#cc66ff]/60 text-[#cc66ff]` est remplacé par `borderColor: 'var(--rs-violet)'` et `color: 'var(--rs-violet)'`.

9. **[UpgradeCard — icône upgrade]** L'icône emoji (`info.icon` ligne 94, rendue en `<span className="text-2xl">`) est remplacée par un composant conditionnel :
   - Si `UPGRADE_ICON_MAP[upgradeId]` existe → rendre `<IconComp size={16} color="var(--rs-orange)" />`
   - Sinon → rendre un carré `20×20px` inline avec les 2 premières lettres de `upgradeId` en `Space Mono`, `color: var(--rs-orange)`, `border: 1px solid var(--rs-border)`, `fontSize: 9px`
   - La propriété `info.icon` (emoji dans `permanentUpgradesDefs.js`) n'est plus utilisée dans ce rendu mais le champ est **conservé** dans les defs.

10. **[UpgradeCard — état MAX]** Le badge `MAX` (actuellement `text-game-success`) utilise `color: 'var(--rs-success)'`. La bordure `border-game-success/40` est remplacée par `borderColor: 'rgba(45, 198, 83, 0.4)'` (= `var(--rs-success)` à 40%).

11. **[Prérequis Story 33.1 respectés]** Les variables `--rs-*` sont définies dans `src/style.css`. Les icônes SVG existent dans `src/ui/icons/index.jsx`. Si 33.1 n'est pas encore `done`, elle doit être implémentée en premier.

12. **[Pas de régression]** L'achat, le refund all, la navigation clavier ESC, et les états disabled/canAfford/maxed fonctionnent identiquement. `vitest run` passe.

## Tasks / Subtasks

- [ ] Task 1: Vérifier que Story 33.1 est implémentée (prérequis)
  - [ ] Confirmer que `src/ui/icons/index.jsx` existe et exporte `SwordIcon`, `LightningIcon`, `ShieldCrossIcon`, `ZoneIcon`, `SkullIcon`, `StarIcon`, `RerollIcon`, `SkipIcon`, `BanishIcon`
  - [ ] Confirmer que `src/style.css` contient `--rs-bg-surface`, `--rs-bg-raised`, `--rs-border`, `--rs-violet`, `--rs-orange`, `--rs-danger`, `--rs-success`
  - [ ] Confirmer que `index.html` charge Bebas Neue et Space Mono via Google Fonts
  - [ ] Si 33.1 n'est pas `done`, l'implémenter d'abord dans ce même contexte

- [ ] Task 2: Ajouter `UPGRADE_ICON_MAP` dans `UpgradesScreen.jsx`
  - [ ] Ajouter l'import en ligne 1–5 : `import { SwordIcon, LightningIcon, ShieldCrossIcon, ZoneIcon, SkullIcon, StarIcon, RerollIcon, SkipIcon, BanishIcon } from './icons/index.jsx'`
  - [ ] Définir la constante (niveau module, après imports, avant `getUpgradeDisplayInfo`) :
    ```js
    const UPGRADE_ICON_MAP = {
      ATTACK_POWER: SwordIcon,
      ATTACK_SPEED: LightningIcon,
      MAX_HP: ShieldCrossIcon,
      REGEN: ShieldCrossIcon,
      ZONE: ZoneIcon,
      EXP_BONUS: StarIcon,
      CURSE: SkullIcon,
      REROLL: RerollIcon,
      SKIP: SkipIcon,
      BANISH: BanishIcon,
    }
    // MAGNET, LUCK, ARMOR, REVIVAL → fallback initiales
    ```
  - [ ] Ne pas modifier `permanentUpgradesDefs.js`

- [ ] Task 3: Modifier `UpgradeCard` (lignes 47–134)
  - [ ] Lire le composant complet avant modification
  - [ ] Remplacer la ligne 94 (`<span className="text-2xl flex-shrink-0">{info.icon}</span>`) par le rendu conditionnel UPGRADE_ICON_MAP vs fallback initiales (voir Dev Notes)
  - [ ] Changer la className principale : supprimer `bg-black/40 backdrop-blur-sm`, ajouter `background: 'var(--rs-bg-raised)'` en style inline
  - [ ] Gérer les bordures via style inline conditionnel (voir Dev Notes)
  - [ ] Ligne 108 : remplacer `text-[#cc66ff]` → `style={{ color: 'var(--rs-violet)' }}`
  - [ ] Lignes 119–122 : remplacer `border-[#cc66ff]/60 text-[#cc66ff]` → `borderColor: 'var(--rs-violet)', color: 'var(--rs-violet)'`
  - [ ] Ligne 113 : remplacer `text-game-success` → `style={{ color: 'var(--rs-success)' }}`
  - [ ] Ligne 77 : remplacer `border-game-success/40` → `borderColor: 'rgba(45, 198, 83, 0.4)'`

- [ ] Task 4: Modifier `UpgradesScreen` conteneur et header (lignes 136–206)
  - [ ] Lire le composant complet avant modification
  - [ ] Envelopper le contenu interne dans un panel avec style `background`, `border`, `clipPath`, `width: clamp(...)`, `maxHeight: '85vh'`, `overflowY: 'auto'` (voir Dev Notes)
  - [ ] Retirer `max-w-4xl max-h-[90vh] overflow-y-auto` de l'ancien wrapper — déplacé dans le panel
  - [ ] Ligne 167–170 (h1 titre) : ajouter `fontFamily: 'Bebas Neue, sans-serif'`, `letterSpacing: '0.15em'`, supprimer `textShadow`
  - [ ] Ligne 176 (fragment balance `text-[#cc66ff]`) : remplacer par `style={{ color: 'var(--rs-violet)' }}`
  - [ ] Ligne 188 (REFUND ALL button) : remplacer `bg-red-600 hover:bg-red-700 text-white` par style outline danger (voir Dev Notes)
  - [ ] Ajouter `onMouseEnter`/`onMouseLeave` hover sur REFUND ALL pour le background léger

- [ ] Task 5: QA et vérification
  - [ ] `vitest run` passe
  - [ ] Vérification visuelle : panel ancré avec fond sombre, coin coupé haut-droit visible
  - [ ] Vérifier les icônes SVG pour ATTACK_POWER, ATTACK_SPEED, MAX_HP, REGEN, ZONE, EXP_BONUS, CURSE, REROLL, SKIP, BANISH
  - [ ] Vérifier les fallbacks initiales pour MAGNET, LUCK, ARMOR, REVIVAL
  - [ ] Vérifier les 3 états de card : affordable (hover violet), not-affordable (dim), maxed (vert)
  - [ ] Vérifier l'absence de backdrop-blur dans DevTools (aucun `backdrop-filter` dans l'inspector)
  - [ ] Vérifier que le bouton REFUND ALL ne s'affiche que quand `totalFragmentsSpent > 0`
  - [ ] Vérifier ESC → close (comportement inchangé)

## Dev Notes

### CRITIQUE : Dépendance Story 33.1 obligatoire

Story 33.3 ne peut pas être implémentée sans Story 33.1. Prérequis stricts :
1. `src/ui/icons/index.jsx` — doit exporter les icônes listées dans `UPGRADE_ICON_MAP`
2. `src/style.css` — doit définir `:root { --rs-bg-surface, --rs-bg-raised, --rs-border, --rs-violet, --rs-orange, --rs-danger, --rs-success, ... }`
3. `index.html` — doit charger Bebas Neue et Space Mono

Valeurs attendues (définies en Story 33.1) :
```css
--rs-bg-surface: #13111e;
--rs-bg-raised: #1a1828;
--rs-border: rgba(255, 255, 255, 0.08);
--rs-violet: #cc66ff;
--rs-orange: #ff6b35;
--rs-danger: #ff3366;
--rs-success: #2dc653;
```

### Structure actuelle UpgradesScreen.jsx — lignes clés

**Conteneur externe actuel (ligne 154) :**
```jsx
<div className="fixed inset-0 z-50 flex flex-col items-center justify-center font-game animate-fade-in">
```

**Conteneur interne actuel (ligne 156) :**
```jsx
<div className="relative w-full max-w-4xl px-6 py-8 max-h-[90vh] overflow-y-auto">
```

**Titre h1 actuel (lignes 166–170) :**
```jsx
<h1
  className="text-2xl font-bold tracking-[0.15em] text-game-text select-none"
  style={{ textShadow: '0 0 30px rgba(204, 102, 255, 0.3)' }}
>
  PERMANENT UPGRADES
</h1>
```

**Solde fragments actuel (ligne 176) :**
```jsx
<span className="text-[#cc66ff] text-lg">◆</span>
```

**REFUND ALL actuel (ligne 188) :**
```jsx
className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold tracking-wider rounded transition-colors select-none"
```

**UpgradeCard div principale actuelle (lignes 73–83) :**
```jsx
<div
  className={`
    border rounded-lg p-3 transition-all duration-150 select-none
    bg-black/40 backdrop-blur-sm
    ${info.isMaxed
      ? 'border-game-success/40'
      : info.canAfford
        ? 'border-game-border hover:border-[#cc66ff]/60 hover:bg-black/50 cursor-pointer'
        : 'border-game-border/40 opacity-60 cursor-not-allowed'
    }
  `}
```

**Icône emoji actuelle (ligne 94) :**
```jsx
<span className="text-2xl flex-shrink-0">{info.icon}</span>
```

**Bonus text actuel (ligne 108) :**
```jsx
<div className="text-xs text-[#cc66ff] font-medium">
```

**Bouton coût actuel (lignes 119–122) :**
```jsx
${info.canAfford
  ? 'border-[#cc66ff]/60 text-[#cc66ff]'
  : 'border-game-border/40 text-game-text-muted'
}
```

**Badge MAX actuel (ligne 113) :**
```jsx
<span className="text-xs font-bold text-game-success tracking-wider">MAX</span>
```

### Pattern rendu icône avec fallback initiales

```jsx
// Dans UpgradeCard, ajouter avant le return :
const IconComp = UPGRADE_ICON_MAP[upgradeId]

// Remplacer la ligne 94 :
{IconComp ? (
  <IconComp size={16} color="var(--rs-orange)" />
) : (
  <div style={{
    width: 20,
    height: 20,
    border: '1px solid var(--rs-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: 'var(--rs-orange)',
    flexShrink: 0,
    userSelect: 'none',
    letterSpacing: '-0.05em',
  }}>
    {upgradeId.slice(0, 2)}
  </div>
)}
```

> **Attention JSX** : le composant SVG passé via `UPGRADE_ICON_MAP[upgradeId]` est une référence de fonction. Pour le rendre, assigner à une variable capitalisée : `const IconComp = UPGRADE_ICON_MAP[upgradeId]` puis `<IconComp size={16} />`.

### Panel clip-path — structure HTML cible

```jsx
// Outer — positioning + overlay (inchangé, pas de fond overlay)
<div className="fixed inset-0 z-50 flex flex-col items-center justify-center font-game animate-fade-in">

  {/* Inner panel ancré — remplace l'ancien div max-w-4xl */}
  <div style={{
    background: 'var(--rs-bg-surface)',
    border: '1px solid var(--rs-border)',
    clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
    width: 'clamp(640px, 70vw, 960px)',
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: '2rem',
    position: 'relative',
  }}>

    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      ...
    </div>

    {/* Upgrade grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      ...
    </div>

  </div>
</div>
```

> **Note CSS** : `clipPath` (camelCase) en style inline JSX. `clip-path` en CSS natif.

### UpgradeCard — styles inline cibles pour les bordures

Stratégie : garder les classNames Tailwind pour layout (rounded, p-3, transition, etc.), overrider les couleurs via `style` inline conditionnel.

```jsx
// Calculer les styles de bordure conditionnels :
const cardBorderStyle = info.isMaxed
  ? { borderColor: 'rgba(45, 198, 83, 0.4)' }
  : info.canAfford
    ? { borderColor: 'var(--rs-border)' }
    : { borderColor: 'var(--rs-border)', opacity: 0.6 }

// Div principale :
<div
  className="border rounded-lg p-3 transition-all duration-150 select-none cursor-pointer"
  style={{
    background: 'var(--rs-bg-raised)',
    ...cardBorderStyle,
  }}
  onMouseEnter={(e) => {
    if (info.canAfford && !info.isMaxed) {
      e.currentTarget.style.borderColor = 'rgba(204, 102, 255, 0.6)'
      playSFX('button-hover')
    }
  }}
  onMouseLeave={(e) => {
    if (info.canAfford && !info.isMaxed) {
      e.currentTarget.style.borderColor = 'var(--rs-border)'
    }
  }}
  ...
>
```

> **Alternative** : utiliser un state local `isHovered` via useState pour le hover, mais le pattern onMouseEnter/Leave direct sur `e.currentTarget.style` est plus simple pour un seul changement de couleur.

### Bouton REFUND ALL — style outline danger

```jsx
// AVANT (ligne 188) :
className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold tracking-wider rounded transition-colors select-none"

// APRÈS — supprimer className couleur, utiliser style inline + hover handler :
className="px-4 py-2 text-sm font-semibold tracking-wider rounded transition-colors select-none"
style={{
  border: '1px solid var(--rs-danger)',
  color: 'var(--rs-danger)',
  background: 'transparent',
}}
onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 51, 102, 0.1)' }}
onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
// Le onClick et onMouseEnter (SFX) existants sont CONSERVÉS — les fusionner si nécessaire
```

### Icônes emoji dans permanentUpgradesDefs.js — ne pas modifier

Les `icon` dans `permanentUpgradesDefs.js` sont des emojis Unicode conservés pour compatibilité. `UpgradesScreen.jsx` ignore `info.icon` et utilise `UPGRADE_ICON_MAP[upgradeId]` à la place. Ne pas supprimer le champ `icon` des defs.

Upgrades avec mapping SVG (10) : `ATTACK_POWER, ATTACK_SPEED, MAX_HP, REGEN, ZONE, EXP_BONUS, CURSE, REROLL, SKIP, BANISH`

Upgrades avec fallback initiales (4) : `MAGNET (MA)`, `LUCK (LU)`, `ARMOR (AR)`, `REVIVAL (RE)`

### Scope — ce qu'il NE faut PAS faire

- **Ne pas modifier** `permanentUpgradesDefs.js` — champ `icon` conservé
- **Ne pas modifier** d'autres composants UI (Armory, HUD, LevelUpModal, ShipSelect)
- **Zéro changement** de stores (`useUpgrades`, `usePlayer`), logique d'achat, gestion fragments
- **Ne pas supprimer** `getUpgradeDisplayInfo`, `BONUS_FORMATS`, `UPGRADE_IDS` — utilisés par les tests et les tests doivent passer
- **Ne pas créer** de nouveaux tests — story purement visuelle

### Tests existants

- Chercher `src/ui/__tests__/UpgradesScreen*` — si existe, ne pas casser
- `vitest run` global doit passer sans modification de logique
- `getUpgradeDisplayInfo` (exporté ligne 11) et `UPGRADE_IDS` (exporté ligne 36) ne sont pas modifiés

### Project Structure Notes

**Fichier unique modifié :** `src/ui/UpgradesScreen.jsx`
- Ajout import icônes (lignes 1–5)
- Ajout constante `UPGRADE_ICON_MAP` (après imports, avant `getUpgradeDisplayInfo`)
- `UpgradeCard` (lignes 47–134) : icône, fond, bordures, couleurs, badge MAX
- `UpgradesScreen` (lignes 136–206) : panel clip-path, header (titre, fragments, REFUND ALL)

**Fichiers prérequis (Story 33.1, non modifiés dans cette story) :**
- `src/ui/icons/index.jsx` — icônes SVG exportées
- `src/style.css` — variables `--rs-*`
- `index.html` — Google Fonts (Bebas Neue, Space Mono)

**Fichier lu mais non modifié :** `src/entities/permanentUpgradesDefs.js`

### References

- Epic 33 spec Story 33.3: `_bmad-output/planning-artifacts/epic-33-ui-design-identity.md#Story-33.3`
- Story 33.1 (prérequis SVG + CSS vars): `_bmad-output/implementation-artifacts/33-1-svg-icon-system.md`
- Story 33.2 (pattern AnimatedStat — référence pour rendu conditionnel SVG): `_bmad-output/implementation-artifacts/33-2-hud-icon-replacement.md`
- UpgradesScreen source à lire en entier avant modification: `src/ui/UpgradesScreen.jsx` (206 lignes)
- permanentUpgradesDefs (icônes emoji — ne pas modifier): `src/entities/permanentUpgradesDefs.js`
- CSS Variables `--rs-*`: `src/style.css` (créé par Story 33.1)
- Icons library: `src/ui/icons/index.jsx` (créé par Story 33.1)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
