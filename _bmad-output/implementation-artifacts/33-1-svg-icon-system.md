# Story 33.1: SVG Icon System — Infrastructure & Remplacement StatLine

Status: ready-for-dev

## Story

As a developer,
I want a shared library of inline SVG icons and a Redshift CSS variable foundation,
So that every screen in Epic 33 can use cohesive geometric icons and the `--rs-*` design tokens.

## Acceptance Criteria

1. **[src/ui/icons/index.jsx créé]** Le fichier exporte les composants suivants : `SkullIcon`, `StarIcon`, `ShieldCrossIcon`, `RerollIcon`, `SkipIcon`, `BanishIcon`, `FragmentIcon`, `LightningIcon`, `SwordIcon`, `ClockIcon`, `SpeedIcon`, `ZoneIcon`. Chaque composant accepte `size` (number, défaut 14) et `color` (string, défaut `'currentColor'`).

2. **[Style SVG cohérent]** Tous les SVGs ont `viewBox="0 0 16 16"`, `stroke={color}`, `strokeWidth={1.5}`, `fill="none"`. Géométriques et épurés, lisibles à 12px minimum. Aucun fill opaque.

3. **[StatLine mis à jour]** `src/ui/primitives/StatLine.jsx` : détecte si la prop `icon` est une fonction React (`typeof icon === 'function'`) et la rend comme `<Icon size={14} color="currentColor" />`. Si `icon` est une string, comportement existant préservé. Aucune prop existante cassée.

4. **[CSS Variables --rs-* définies]** `src/style.css` contient la section `:root { --rs-* }` avec au minimum les tokens utilisés dans Epic 33 (cf. Dev Notes). Ces variables coexistent avec les `--color-game-*` existantes sans les remplacer.

5. **[Fonts chargées]** `index.html` importe via Google Fonts : Bebas Neue (400), Rajdhani (400, 600, 700), Space Mono (400, 700). Ces fonts sont utilisées dès Story 33.3+.

6. **[Pas de régression]** Les tests existants de `StatLine` passent. Les usages avec strings (`"◆"`, `"✕"`) continuent de fonctionner.

## Tasks / Subtasks

- [x] Task 1: Définir les CSS variables Redshift dans `src/style.css` ✅ DONE (commit c4842aa)
  - [x] Bloc `:root { --rs-* }` ajouté avec tous les tokens — cf. valeurs réelles en Dev Notes
  - [x] Tokens `--color-game-*` existants préservés

- [x] Task 2: Ajouter les Google Fonts dans `index.html` ✅ DONE (commit c4842aa)
  - [x] Bebas Neue 400
  - [x] Rajdhani 400, 500, 600, 700
  - [x] Space Mono 400, 700
  - [x] preconnect + single grouped stylesheet request

- [ ] Task 3: Créer `src/ui/icons/index.jsx`
  - [ ] `SkullIcon` : losange + 2 points (yeux) — style géométrique
  - [ ] `StarIcon` : étoile à 4 branches (croix diagonale allongée)
  - [ ] `ShieldCrossIcon` : bouclier simple avec croix médicale intérieure
  - [ ] `RerollIcon` : arc de cercle avec flèche (sens horaire)
  - [ ] `SkipIcon` : deux chevrons `>>` ou triangle + barre verticale
  - [ ] `LightningIcon` : éclair angulaire (zigzag)
  - [ ] `SwordIcon` : épée simple (lame + garde en T)
  - [ ] `ClockIcon` : cercle + 2 aiguilles minimalistes
  - [ ] `SpeedIcon` : chevron angulaire vers la droite
  - [ ] `ZoneIcon` : deux cercles concentriques
  - [ ] `FragmentIcon` : losange (cohérent avec le `◆` Unicode existant)
  - [ ] `BanishIcon` : X géométrique (2 lignes croisées)

- [ ] Task 4: Mettre à jour `src/ui/primitives/StatLine.jsx`
  - [ ] Ajouter la détection `typeof icon === 'function'`
  - [ ] Si fonction : rendre `<Icon size={14} color="currentColor" />`
  - [ ] Si string/autre : conserver le `<span>{icon}</span>` existant
  - [ ] Conserver toutes les props existantes (label, value, bonusValue, compact)

- [ ] Task 5: Vérification
  - [ ] `vitest run` passe (StatLine.bonusDisplay.test.js)
  - [ ] Vérifier visuellement que `◆` (fragments) s'affiche correctement
  - [ ] Vérifier visuellement que `✕` (banish) s'affiche correctement
  - [ ] Tester les icônes SVG à 12px, 14px, 16px sur fond sombre

## Dev Notes

### CSS Variables `--rs-*` — ✅ DÉJÀ DÉFINIES (commit c4842aa)

**Les variables sont déjà dans `src/style.css` dans un bloc `:root {}`**, en dehors du bloc `@theme {}` Tailwind. Ne pas les redéfinir.

Valeurs réelles en production (à utiliser comme référence pour les stories 33.2–33.7) :

```css
:root {
  /* Backgrounds */
  --rs-bg:          #0d0b14;
  --rs-bg-surface:  #1a1528;
  --rs-bg-raised:   #241d35;

  /* Borders */
  --rs-border:      #2e2545;
  --rs-border-hot:  rgba(255, 79, 31, 0.4);

  /* Text */
  --rs-text:        #f5f0e8;
  --rs-text-muted:  #7a6d8a;
  --rs-text-dim:    #4a3f5c;

  /* Accents */
  --rs-orange:      #ff4f1f;
  --rs-violet:      #9b5de5;
  --rs-gold:        #ffd60a;
  --rs-teal:        #00b4d8;

  /* Functional */
  --rs-hp:          #ef233c;
  --rs-dash-ready:  #00b4d8;
  --rs-dash-cd:     #ff4f1f;
  --rs-success:     #2dc653;
  --rs-danger:      #ef233c;
}
```

> **Attention stories 33.2+ :** Les valeurs de `--rs-teal` (`#00b4d8`), `--rs-violet` (`#9b5de5`), `--rs-danger` (`#ef233c`) **diffèrent des couleurs hardcodées dans `HUD.jsx`** (lignes 396–405 qui utilisaient `#00ffcc`, `#cc66ff`, `#ff3366`). Lors du remplacement dans Story 33.2, utiliser `var(--rs-teal)` etc. — ne pas conserver les anciens hex.

### Fonts — ✅ DÉJÀ CHARGÉES (commit c4842aa)

Bebas Neue, Rajdhani et Space Mono **sont déjà dans `index.html`**. Ne pas modifier ce fichier.

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
  rel="stylesheet"
/>
```

### StatLine.jsx — Structure actuelle

**Fichier :** `src/ui/primitives/StatLine.jsx` (33 lignes)

L'icône est actuellement rendue ligne 17 :
```jsx
{icon && <span className="flex-shrink-0">{icon}</span>}
```

Le span parent a `className="text-game-text-muted"` — le SVG avec `color="currentColor"` héritera de cette couleur CSS via `stroke`. C'est le comportement attendu pour les usages génériques. Les usages avec couleur explicite (ex: HUD) passent la couleur directement via la prop.

**Mise à jour minimale** :
```jsx
{icon && (
  <span className="flex-shrink-0">
    {typeof icon === 'function' ? <icon size={14} color="currentColor" /> : icon}
  </span>
)}
```

> **Attention JSX** : Pour rendre un composant depuis une variable, la variable doit commencer par une majuscule ou être réassignée. Utiliser :
> ```jsx
> const Icon = icon
> // puis <Icon size={14} color="currentColor" />
> ```

### AnimatedStat dans HUD.jsx — NE PAS TOUCHER dans cette story

`HUD.jsx` utilise `AnimatedStat` (composant local, ligne 83) qui rend `{icon}` directement (ligne 100) comme string. **Ce composant est couvert par Story 33.2**, pas 33.1. Ne pas modifier `HUD.jsx` dans cette story.

### Structure des composants SVG

Pattern à suivre pour chaque icône :

```jsx
export function SkullIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* paths ici */}
    </svg>
  )
}
```

**Contraintes visuelles critiques :**
- Toujours `fill="none"` sur le SVG racine — pas de fills opaques
- `strokeLinecap="round"` et `strokeLinejoin="round"` pour un look cohérent
- Préférer des `<path>` simples aux shapes complexes
- Tester mentalement la lisibilité à 12px (3/4 taille de l'affichage réel)
- `SkullIcon` : losange aplati + 2 petits ronds — éviter le crâne anatomique
- `StarIcon` : 4 branches diagonales allongées (type cristal d'énergie) — pas l'étoile 5 branches naïve
- `FragmentIcon` : losange simple `◆` — déjà utilisé partout comme Unicode, cohérence visuelle importante

### Coexistence avec le design system existant

**Ne pas remplacer** les tokens `--color-game-*` — ils sont utilisés dans des dizaines de composants. Les `--rs-*` sont additifs. Les deux systèmes coexistent pendant toute la durée de l'Epic 33 et au-delà.

### Tests existants

- `src/ui/primitives/__tests__/StatLine.bonusDisplay.test.js` — tests de la prop `bonusValue`
- La modification de `StatLine` ne doit pas affecter les tests existants (ils ne testent pas `icon`)
- Pas de tests à écrire pour `src/ui/icons/index.jsx` dans cette story (composants visuels purs)

### Project Structure Notes

- **Nouveau fichier** : `src/ui/icons/index.jsx` — tout dans un seul fichier, pas de fichiers séparés par icône
- **Fichier modifié** : `src/ui/primitives/StatLine.jsx`
- **Fichier modifié** : `src/style.css` (ajout `:root { --rs-* }`)
- **Fichier modifié** : `index.html` (ajout Google Fonts)

### References

- Epic 33 technical notes: `_bmad-output/planning-artifacts/epic-33-ui-design-identity.md#Technical-Notes`
- StatLine actuel: `src/ui/primitives/StatLine.jsx`
- AnimatedStat (HUD, Story 33.2): `src/ui/HUD.jsx:83-111`
- CSS actuel: `src/style.css` (Tailwind v4 `@theme`, tokens `--color-game-*`)
- Tests StatLine: `src/ui/primitives/__tests__/StatLine.bonusDisplay.test.js`

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
