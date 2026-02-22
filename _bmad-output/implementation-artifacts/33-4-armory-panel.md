# Story 33.4: Armory — Panel Conteneur & Icônes Armes/Boons

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the Armory screen to feel anchored and use symbolic badges instead of emojis,
so that the visual identity is consistent with the rest of the game.

## Acceptance Criteria

1. **[Panel conteneur — layout principal]** `Armory.jsx` : le contenu est enveloppé dans un panel avec `background: var(--rs-bg-surface)` et `border: 1px solid var(--rs-border)`. Le panel a `clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)` (coin supérieur droit coupé). La largeur est `clamp(640px, 70vw, 960px)`, `maxHeight: '85vh'`, `overflowY: 'auto'` interne.

2. **[Tabs intégrées dans le header]** Les boutons onglets `Weapons` / `Boons` sont déplacés dans la zone header du panel (pas dans un bloc séparé flottant). Chaque tab est un `<button>` sans `border` ni `background`, avec uniquement `borderBottom: '2px solid ...'` comme indicateur. L'onglet actif a `borderBottom: '2px solid var(--rs-orange)'`. L'onglet inactif a `borderBottom: '2px solid transparent'`. Les classes Tailwind `border rounded bg-game-accent/10` des tabs existantes sont supprimées.

3. **[Suppression du fond flou]** `backdrop-blur-sm` est supprimé du conteneur principal et des `WeaponCard` et `BoonCard`. Plus de `bg-black/40 backdrop-blur-sm` dans ce composant.

4. **[WeaponCard — badge initiales]** L'emoji découvert (`icon = WEAPON_ICONS[weaponId]`) est remplacé dans le rendu visuel par un badge `28×28px` : `background: var(--rs-bg-raised)`, `border: 1px solid var(--rs-border)`, texte `Space Mono 600`, **2 caractères calculés via `getBadgeText(weaponId)`** (voir Dev Notes), `color: var(--rs-orange)`.

5. **[WeaponCard — badge non-découvert]** Le `❓` est remplacé dans le rendu visuel par le badge `??` en `Space Mono`, `color: var(--rs-text-dim, var(--rs-text-muted))`, `background: var(--rs-bg-raised)` avec `opacity: 0.5` sur le badge entier.

6. **[BoonCard — badge initiales]** Même logique que WeaponCard avec `getBadgeText(boonId)`, mais `color: var(--rs-violet)`.

7. **[BoonCard — badge non-découvert]** Même logique que WeaponCard — badge `??` atténué.

8. **[Cards — fond et bordure]** Chaque `WeaponCard` et `BoonCard` utilise `background: var(--rs-bg-raised)` et `border: 1px solid var(--rs-border)`. Les classes `bg-black/40 backdrop-blur-sm` sont supprimées.

9. **[Texte ✓ Discovered]** Le `✓ Discovered` reste présent dans les cards découvertes — symbole Unicode acceptable. Les couleurs sont adaptées au design system : `color: var(--rs-teal)` pour les weapons (remplace `text-[#00ffcc]`), `color: var(--rs-violet)` pour les boons (remplace `text-[#cc66ff]`).

10. **[Tests non cassés]** `getWeaponCardDisplayData` et `getBoonCardDisplayData` (fonctions pures exportées) restent **inchangées** — elles retournent toujours des emojis strings. `WEAPON_ICONS` et `BOON_ICONS` restent déclarés. `vitest run` passe.

11. **[Prérequis Story 33.1 respectés]** Les variables `--rs-*` sont définies dans `src/style.css`. Les fonts `Bebas Neue` et `Space Mono` sont chargées dans `index.html`. Si 33.1 n'est pas encore `done`, l'implémenter d'abord.

12. **[Pas de régression]** Navigation clavier ESC (close) et TAB (switch tabs), compteurs `totalWeapons` et `totalBoons`, `useArmory` subscription — tout fonctionne identiquement.

## Tasks / Subtasks

- [ ] Task 1: Vérifier que Story 33.1 est implémentée (prérequis)
  - [ ] Confirmer que `src/style.css` contient `--rs-bg-surface`, `--rs-bg-raised`, `--rs-border`, `--rs-violet`, `--rs-orange`, `--rs-teal`
  - [ ] Vérifier si `--rs-text-dim` est défini (fallback CSS natif `var(--rs-text-dim, var(--rs-text-muted))`)
  - [ ] Confirmer que `index.html` charge Bebas Neue et Space Mono via Google Fonts
  - [ ] Si 33.1 n'est pas `done`, l'implémenter d'abord

- [ ] Task 2: Ajouter `getBadgeText` et modifier `WeaponCard`
  - [ ] Lire `src/ui/Armory.jsx` en entier avant toute modification
  - [ ] Ajouter la fonction helper `getBadgeText(id)` au niveau module (après imports, avant `WeaponCard`) — voir Dev Notes
  - [ ] Dans `WeaponCard` : supprimer `const icon = WEAPON_ICONS[weaponId] || '🔫'` (ligne 55) — plus utilisé dans le rendu JSX
  - [ ] Remplacer le `<span className="text-2xl flex-shrink-0">` (lignes 60–62) par le badge conditionnel — voir Dev Notes
  - [ ] Modifier la div principale (ligne 58) : supprimer `bg-black/40 backdrop-blur-sm`, ajouter `background: 'var(--rs-bg-raised)'` et `border: '1px solid var(--rs-border)'` en style inline
  - [ ] Ligne 71 : remplacer `className="text-xs text-[#00ffcc] mt-1 block"` par `className="text-xs mt-1 block" style={{ color: 'var(--rs-teal)' }}`

- [ ] Task 3: Modifier `BoonCard`
  - [ ] Dans `BoonCard` : supprimer `const icon = BOON_ICONS[boonId] || '✨'` (ligne 82) — plus utilisé dans le rendu JSX
  - [ ] Remplacer le `<span className="text-2xl flex-shrink-0">` (lignes 88–90) par le badge conditionnel avec `color: 'var(--rs-violet)'`
  - [ ] Modifier la div principale (ligne 86) : supprimer `bg-black/40 backdrop-blur-sm`, ajouter `background: 'var(--rs-bg-raised)'` et `border: '1px solid var(--rs-border)'` en style inline
  - [ ] Ligne 99 : remplacer `className="text-xs text-[#cc66ff] mt-1 block"` par `className="text-xs mt-1 block" style={{ color: 'var(--rs-violet)' }}`

- [ ] Task 4: Modifier le composant principal `Armory` — panel + tabs intégrées
  - [ ] Lire lignes 169–250 de `Armory.jsx` pour confirmation avant modification
  - [ ] **Panel** : remplacer la `<div className="relative w-full max-w-4xl px-6 py-8 max-h-[90vh] overflow-y-auto">` (ligne 197) par le panel avec `background`, `border`, `clipPath`, dimensions clamp — voir Dev Notes
  - [ ] **Header** : garder la structure flex justify-between (lignes 199–217), supprimer le `mb-6` de la div header
  - [ ] **Titre h1** (lignes 207–212) : supprimer `textShadow`, ajouter `fontFamily: 'Bebas Neue, sans-serif'`, `letterSpacing: '0.15em'`
  - [ ] **Tabs** : déplacer le bloc de navigation tabs (lignes 220–237) à l'intérieur de la zone header, sous la ligne titre — voir structure cible Dev Notes
  - [ ] **Style tabs** : remplacer les classNames Tailwind des boutons tabs par des styles inline avec `borderBottom` indicateur seulement
  - [ ] **Séparation header/contenu** : ajouter `borderBottom: '1px solid var(--rs-border)'` sur la zone header complète

- [ ] Task 5: QA et vérification
  - [ ] `vitest run` passe — vérifier `src/ui/__tests__/Armory.test.jsx` particulièrement
  - [ ] Vérification visuelle : panel ancré avec fond sombre, coin coupé haut-droit visible
  - [ ] Vérifier les badges weapons : `LASER_FRONT` → `LF`, `SPREAD_SHOT` → `SS`, `RAILGUN` → `RA`, `BEAM` → `BE`
  - [ ] Vérifier les badges boons : `DAMAGE_AMP` → `DA`, `SPEED_BOOST` → `SB`, `CRIT_CHANCE` → `CC`
  - [ ] Vérifier les badges `??` pour les items non-découverts (atténués)
  - [ ] Vérifier que `✓ Discovered` apparaît sur les items découverts avec les bonnes couleurs
  - [ ] Vérifier absence de `backdrop-filter` dans DevTools
  - [ ] Vérifier navigation ESC (close) et TAB clavier (switch tabs) — comportement inchangé
  - [ ] Vérifier tabs intégrées : onglet actif avec barre orange en bas, onglet inactif sans barre

## Dev Notes

### CRITIQUE : Dépendance Story 33.1 obligatoire

Story 33.4 dépend de Story 33.1 pour les variables CSS :
```css
--rs-bg-surface: #13111e;
--rs-bg-raised: #1a1828;
--rs-border: rgba(255, 255, 255, 0.08);
--rs-violet: #cc66ff;
--rs-orange: #ff6b35;
--rs-teal: #00ffcc;
--rs-text-dim: rgba(255, 255, 255, 0.3);  /* vérifier si défini */
--rs-text-muted: rgba(255, 255, 255, 0.5); /* fallback si text-dim absent */
```

Note : `var(--rs-teal)` est utilisé pour `✓ Discovered` des weapons (était `#00ffcc` hardcodé ligne 71).
Note : `color: 'var(--rs-text-dim, var(--rs-text-muted))'` utilise le fallback CSS natif si `--rs-text-dim` n'est pas défini par 33.1.

### CRITIQUE : Tests — ne pas toucher aux fonctions pures exportées

Les tests dans `src/ui/__tests__/Armory.test.jsx` vérifient les fonctions pures :
- `getWeaponCardDisplayData(id, isDiscovered)` → retourne `{ name, description, icon, isDiscovered }` où `icon` est un **emoji string**
- `getBoonCardDisplayData(id, isDiscovered)` → idem

Tests critiques qui DOIVENT continuer à passer :
```js
it('undiscovered weapon icon is ❓', () => {
  expect(getWeaponCardDisplayData('SHOTGUN', false).icon).toBe('❓')
})
it('discovered weapon icon is a non-empty string', () => {
  const data = getWeaponCardDisplayData('SHOTGUN', true)
  expect(typeof data.icon).toBe('string')
  expect(data.icon).not.toBe('❓')
})
it('all 12 boons have valid display data when discovered', () => {
  // vérifie data.icon !== '❓' pour chaque boon
})
```

**Conséquence** : `WEAPON_ICONS` et `BOON_ICONS` restent déclarés car ils sont utilisés par ces fonctions (lignes 135 et 150). Seul le **rendu JSX** dans `WeaponCard` et `BoonCard` ne les utilise plus — les variables `const icon = ...` (lignes 55 et 82) sont supprimées uniquement dans les composants render.

### Fonction getBadgeText — helper à ajouter

```js
// Ajouter après les imports, avant la déclaration de WeaponCard :
function getBadgeText(id) {
  const parts = id.split('_')
  if (parts.length === 1) return id.slice(0, 2)
  return parts.map(word => word[0]).join('').slice(0, 2)
}
```

Résultats pour les weapons actuels :
- `LASER_FRONT` → `LF`
- `SPREAD_SHOT` → `SS`
- `MISSILE_HOMING` → `MH`
- `PLASMA_BOLT` → `PB`
- `RAILGUN` → `RA` (un seul mot → slice(0,2))
- `TRI_SHOT` → `TS`
- `SHOTGUN` → `SH`
- `SATELLITE` → `SA`
- `DRONE` → `DR`
- `BEAM` → `BE`
- `EXPLOSIVE_ROUND` → `ER`

Résultats pour les boons actuels :
- `DAMAGE_AMP` → `DA`
- `SPEED_BOOST` → `SB`
- `COOLDOWN_REDUCTION` → `CR`
- `CRIT_CHANCE` → `CC`
- `CRIT_MULTIPLIER` → `CM`
- `PROJECTILE_SPEED` → `PS`
- `MAX_HP_UP` → `MH`
- `HP_REGEN` → `HR`
- `DAMAGE_REDUCTION` → `DR`
- `XP_GAIN` → `XG`
- `FRAGMENT_GAIN` → `FG`
- `PICKUP_RADIUS` → `PR`

### Badge conditionnel — pattern JSX à utiliser dans WeaponCard

```jsx
// Remplacer les lignes 60–62 :
// <span className={`text-2xl flex-shrink-0 ${!isDiscovered ? 'opacity-30' : ''}`}>
//   {isDiscovered ? icon : '❓'}
// </span>

// Par :
{isDiscovered ? (
  <div style={{
    width: 28,
    height: 28,
    background: 'var(--rs-bg-raised)',
    border: '1px solid var(--rs-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Space Mono', monospace",
    fontWeight: 600,
    fontSize: 10,
    color: 'var(--rs-orange)',
    flexShrink: 0,
    userSelect: 'none',
    letterSpacing: '-0.02em',
  }}>
    {getBadgeText(weaponId)}
  </div>
) : (
  <div style={{
    width: 28,
    height: 28,
    background: 'var(--rs-bg-raised)',
    border: '1px solid var(--rs-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Space Mono', monospace",
    fontWeight: 600,
    fontSize: 10,
    color: 'var(--rs-text-dim, var(--rs-text-muted))',
    flexShrink: 0,
    userSelect: 'none',
    opacity: 0.5,
  }}>
    ??
  </div>
)}
```

Pour `BoonCard` : identique mais remplacer `var(--rs-orange)` par `var(--rs-violet)` dans le badge découvert, et utiliser `boonId` dans `getBadgeText`.

### Structure HTML cible — panel avec tabs intégrées dans le header

```jsx
// Outer — positionnement overlay (classNames inchangés)
<div className="fixed inset-0 z-50 flex flex-col items-center justify-center font-game animate-fade-in">

  {/* Panel ancré — remplace l'ancien div max-w-4xl */}
  <div style={{
    background: 'var(--rs-bg-surface)',
    border: '1px solid var(--rs-border)',
    clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
    width: 'clamp(640px, 70vw, 960px)',
    maxHeight: '85vh',
    overflowY: 'auto',
    position: 'relative',
  }}>

    {/* Zone header — inclut titre ET tabs, séparée du contenu par une ligne */}
    <div style={{ borderBottom: '1px solid var(--rs-border)' }}>

      {/* Ligne 1 : bouton BACK + titre + compteur */}
      <div className="flex items-center justify-between" style={{ padding: '1.5rem 2rem 0.75rem' }}>
        <button
          onClick={() => { playSFX('button-click'); onClose() }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--rs-text-muted, #888)',
            fontSize: '0.875rem',
            letterSpacing: '0.1em',
            cursor: 'pointer',
            padding: '0.25rem 0.5rem',
            userSelect: 'none',
          }}
        >
          &larr; BACK
        </button>

        <h1
          className="select-none"
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.5rem',
            letterSpacing: '0.15em',
            color: 'var(--rs-text, #e8e6f0)',
          }}
        >
          ARMORY
        </h1>

        <div
          className="text-xs select-none"
          style={{ color: 'var(--rs-text-muted, #888)', minWidth: '6rem', textAlign: 'right' }}
        >
          {totalWeapons} WEAPONS · {totalBoons} BOONS
        </div>
      </div>

      {/* Ligne 2 : tabs intégrées (sans border/background, indicateur bottom seulement) */}
      <div style={{ display: 'flex', paddingLeft: '2rem' }}>
        {ARMORY_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); playSFX('button-hover') }}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab
                ? '2px solid var(--rs-orange)'
                : '2px solid transparent',
              color: activeTab === tab
                ? 'var(--rs-text, #e8e6f0)'
                : 'var(--rs-text-muted, #888)',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
              outline: 'none',
              userSelect: 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

    </div>

    {/* Contenu des onglets */}
    <div style={{ padding: '1.5rem 2rem' }}>
      {activeTab === 'Weapons' && <WeaponsGrid />}
      {activeTab === 'Boons' && <BoonsGrid />}
    </div>

    {/* Keyboard hint */}
    <p
      className="text-xs text-center select-none"
      style={{ color: 'var(--rs-text-muted, #888)', opacity: 0.3, padding: '0 2rem 1rem' }}
    >
      ESC to close · TAB to switch tabs
    </p>

  </div>
</div>
```

> **Note importante** : le `useEffect` keyboard handler (lignes 173–189) qui gère ESC et TAB ne change pas. La navigation Tab/Shift+Tab continue de lire `ARMORY_TABS.indexOf(activeTab)` — aucune modification nécessaire.

### Lignes clés dans Armory.jsx (état actuel avant modification)

- **Ligne 22–34** — `WEAPON_ICONS` dict (conservé, utilisé par `getWeaponCardDisplayData`)
- **Ligne 37–50** — `BOON_ICONS` dict (conservé, utilisé par `getBoonCardDisplayData`)
- **Ligne 55** — `const icon = WEAPON_ICONS[weaponId] || '🔫'` → à supprimer dans `WeaponCard`
- **Ligne 58** — div principale WeaponCard : `"border rounded-lg p-3 bg-black/40 backdrop-blur-sm border-game-border select-none"`
- **Lignes 60–62** — `<span className="text-2xl flex-shrink-0">` → remplacer par badge conditionnel
- **Ligne 71** — `className="text-xs text-[#00ffcc] mt-1 block"` → remplacer couleur
- **Ligne 82** — `const icon = BOON_ICONS[boonId] || '✨'` → à supprimer dans `BoonCard`
- **Ligne 86** — div principale BoonCard : identique à ligne 58
- **Lignes 88–90** — `<span className="text-2xl flex-shrink-0">` → remplacer par badge conditionnel
- **Ligne 99** — `className="text-xs text-[#cc66ff] mt-1 block"` → remplacer couleur
- **Ligne 197** — `<div className="relative w-full max-w-4xl px-6 py-8 max-h-[90vh] overflow-y-auto">` → remplacer par panel
- **Lignes 207–212** — titre h1 avec `textShadow: '0 0 30px rgba(204, 102, 255, 0.3)'` → supprimer shadow, ajouter Bebas Neue
- **Lignes 220–237** — bloc tabs `<div className="flex gap-2 mb-6">` → fusionner dans zone header

### Scope — ce qu'il NE faut PAS faire

- **Ne pas modifier** `getWeaponCardDisplayData`, `getBoonCardDisplayData` — tests vérifient le retour emoji
- **Ne pas supprimer** `WEAPON_ICONS`, `BOON_ICONS` — utilisés par les fonctions pures exportées
- **Ne pas modifier** `ARMORY_TABS`, `computeNextTab`, `getArmoryTabData` — exportés et testés
- **Ne pas modifier** `WeaponsGrid`, `BoonsGrid` — pas concernés
- **Zéro changement** de stores, logique de jeu, systèmes
- **Ne pas créer** de nouveaux tests — story purement visuelle

### Previous Story Learnings (from 33.3)

Story 33.3 a établi le pattern panel clip-path + design system pour `UpgradesScreen.jsx`. Les mêmes principes s'appliquent :
- `clipPath` en camelCase en style inline JSX
- `onMouseEnter`/`onMouseLeave` pour les hovers inline
- Variables capitalisées pour rendre les composants SVG : `const IconComp = MAP[id]` puis `<IconComp />`
- Pour 33.4, il n'y a PAS de composants SVG — uniquement des badges texte

### Project Structure Notes

**Fichier unique modifié :** `src/ui/Armory.jsx`
- Ajout de `getBadgeText(id)` helper (niveau module, après imports, avant `WeaponCard`)
- `WeaponCard` (lignes 52–77) : badge conditionnel remplace l'emoji, fond card mis à jour, ✓ Discovered teal
- `BoonCard` (lignes 79–105) : badge conditionnel remplace l'emoji, fond card mis à jour, ✓ Discovered violet
- `Armory` (lignes 169–250) : panel clip-path, header avec tabs intégrées, suppression textShadow

**Fichiers prérequis (Story 33.1, non modifiés dans cette story) :**
- `src/style.css` — variables `--rs-*`
- `index.html` — Google Fonts (Bebas Neue, Space Mono)

**Tests à ne pas casser :** `src/ui/__tests__/Armory.test.jsx`

### References

- Epic 33 spec Story 33.4: `_bmad-output/planning-artifacts/epic-33-ui-design-identity.md#Story-33.4`
- Story 33.3 (pattern panel clip-path — référence directe): `_bmad-output/implementation-artifacts/33-3-permanent-upgrades-panel.md`
- Story 33.1 (prérequis CSS vars): `_bmad-output/implementation-artifacts/33-1-svg-icon-system.md`
- Armory source à lire en entier avant modification: `src/ui/Armory.jsx` (250 lignes)
- Test file à ne pas casser: `src/ui/__tests__/Armory.test.jsx`
- CSS Variables `--rs-*`: `src/style.css` (créé par Story 33.1)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
