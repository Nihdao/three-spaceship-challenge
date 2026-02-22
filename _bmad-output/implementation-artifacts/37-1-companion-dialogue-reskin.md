# Story 37.1: CompanionDialogue Reskin — Redshift Design System

Status: backlog

## Story

As a player,
I want the companion dialogue to match the Redshift visual identity,
So that the UI feels cohesive and intentional rather than generic.

## Acceptance Criteria

1. **[Background opaque]** `background` passe de `'rgba(0,0,0,0.75)'` à `'var(--rs-bg-surface)'`. Le `backdropFilter: 'blur(4px)'` est **supprimé**.

2. **[Border]** `border: '1px solid rgba(255,255,255,0.1)'` est remplacé par `borderLeft: '3px solid var(--rs-violet)'`. Les autres côtés (top, right, bottom) n'ont pas de border.

3. **[Forme angulaire]** `borderRadius: '0.75rem'` est remplacé par `clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)'`.

4. **[Typographie nom companion]** `color: '#cc66ff'` → `color: 'var(--rs-violet)'`. `fontFamily: 'Inter, system-ui, sans-serif'` → `fontFamily: 'Rajdhani, sans-serif'`. `fontWeight: 700`. `letterSpacing: '0.08em'`. `fontSize: '0.7rem'`.

5. **[Typographie corps]** `fontFamily` du corps du dialogue → `'Rajdhani, sans-serif'`. `fontWeight: 400`. `color: 'var(--rs-text)'`. `fontSize: '0.875rem'`.

6. **[Avatar border]** L'avatar (image du companion) : `border: '2px solid var(--rs-violet)'`. `borderRadius: '0.25rem'` (moins arrondi, plus angulaire).

7. **[Animations préservées]** Les classes `animate-companion-slide-in` et `animate-companion-fade-out` ne sont PAS modifiées.

8. **[Zéro hex hardcodé]** Après la story, aucun hex color hardcodé ne subsiste dans `CompanionDialogue.jsx`. Tout passe par des variables `var(--rs-*)`.

9. **[Variables CSS vérifiées]** Avant implémentation : vérifier que `--rs-bg-surface`, `--rs-violet`, `--rs-text`, `--rs-border` existent dans `src/style.css`. Les ajouter si manquantes.

## Tasks / Subtasks

- [ ] Task 1: Vérifier les variables CSS dans `src/style.css`
  - [ ] Chercher `--rs-bg-surface`, `--rs-violet`, `--rs-text`, `--rs-border` dans le `@theme {}` block
  - [ ] Si manquantes, les ajouter :
    ```css
    --rs-bg-surface:  #1a1528;
    --rs-violet:      #9b5de5;
    --rs-text:        #f5f0e8;
    --rs-border:      #2e2545;
    ```

- [ ] Task 2: Lire `CompanionDialogue.jsx` intégralement
  - [ ] Identifier tous les inline styles du panel principal
  - [ ] Identifier les styles du nom du companion
  - [ ] Identifier les styles du corps de texte
  - [ ] Identifier les styles de l'avatar

- [ ] Task 3: Corriger les 7 anti-patterns identifiés
  - [ ] `fontFamily: 'Inter, system-ui, sans-serif'` (x2 potentiellement) → `'Rajdhani, sans-serif'`
  - [ ] `background: 'rgba(0,0,0,0.75)'` → `'var(--rs-bg-surface)'`
  - [ ] `backdropFilter: 'blur(4px)'` → supprimer la propriété
  - [ ] `border: '1px solid rgba(255,255,255,0.1)'` → `borderLeft: '3px solid var(--rs-violet)'`
  - [ ] `borderRadius: '0.75rem'` → `clipPath` angulaire (supprimer borderRadius)
  - [ ] `color: '#cc66ff'` → `'var(--rs-violet)'`
  - [ ] Ajouter `fontFamily: 'Rajdhani, sans-serif'` sur le corps si absent

- [ ] Task 4: Mettre à jour l'avatar
  - [ ] `border: '2px solid var(--rs-violet)'`
  - [ ] `borderRadius: '0.25rem'`

- [ ] Task 5: Vérification finale
  - [ ] Aucun hex hardcodé dans le fichier (sauf dans les valeurs calculées dynamiques s'il y en a)
  - [ ] Aucun `Inter` ou `system-ui` dans le fichier
  - [ ] Les animations slide-in et fade-out sont préservées
  - [ ] Test visuel : le composant est lisible avec le jeu en arrière-plan

## Technical Notes

**Anti-patterns exhaustifs à corriger (basé sur la lecture du fichier) :**
1. `fontFamily: 'Inter, system-ui, sans-serif'` → `'Rajdhani, sans-serif'`
2. `background: 'rgba(0,0,0,0.75)'` → `'var(--rs-bg-surface)'`
3. `backdropFilter: 'blur(4px)'` → supprimer
4. `border: '1px solid rgba(255,255,255,0.1)'` → `borderLeft: '3px solid var(--rs-violet)'`
5. `borderRadius: '0.75rem'` → `clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)'`
6. `color: '#cc66ff'` → `'var(--rs-violet)'`
7. Absence de Rajdhani sur le corps → ajouter `fontFamily: 'Rajdhani, sans-serif'`

**Style cible du panel :**
```js
{
  background: 'var(--rs-bg-surface)',
  borderLeft: '3px solid var(--rs-violet)',
  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
  // ... padding, position, etc. inchangés
}
```

**Style cible du nom companion :**
```js
{
  fontFamily: 'Rajdhani, sans-serif',
  fontWeight: 700,
  color: 'var(--rs-violet)',
  letterSpacing: '0.08em',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
}
```

**Style cible du corps :**
```js
{
  fontFamily: 'Rajdhani, sans-serif',
  fontWeight: 400,
  color: 'var(--rs-text)',
  fontSize: '0.875rem',
}
```

**Note sur clipPath vs borderRadius :**
`clip-path` et `border-radius` ne s'appliquent pas au même niveau. Après avoir ajouté `clipPath`, s'assurer que `borderRadius` est bien absent (sinon il peut interférer visuellement). Aussi, vérifier que le `backdropFilter` (blur) était bien sur le panel et pas sur un parent — le supprimer uniquement du bon élément.
