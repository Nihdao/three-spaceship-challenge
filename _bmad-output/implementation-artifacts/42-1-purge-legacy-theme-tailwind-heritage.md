# Story 42.1: Purge legacy `@theme` & classes Tailwind héritage

Status: done

## Story

As a developer,
I want all legacy color/font variables removed from style.css and replaced throughout the codebase,
So that a single coherent palette (Redshift) drives every visual element.

## Acceptance Criteria

1. **Given** `src/style.css` **When** le fichier est ouvert **Then** le bloc `@theme { }` ne contient plus les variables `--color-game-*` ni `--font-game` **And** les `@keyframes` qui étaient dans `@theme` sont déplacés hors du bloc (au niveau racine de la feuille) **And** les animations Tailwind (`--animate-fade-in`, `--animate-slide-up`, `--animate-pulse-glow`) restent fonctionnelles (via `@theme` ou redéfinies).

2. **Given** l'ensemble du dossier `src/ui/` **When** on cherche `text-game-`, `bg-game-`, `border-game-`, `text-yellow-`, `font-game`, `accent-game-` **Then** aucune occurrence n'existe — toutes remplacées par inline styles `var(--rs-*)` ou classes custom.

3. **Given** `src/style.css` classe `.damage-number` **When** les damage numbers s'affichent **Then** `font-family` utilise `'Rajdhani', sans-serif` au lieu de `'Inter', system-ui, sans-serif`.

4. **Given** `src/style.css` classes `.system-name-banner-text` et `.system-name-banner-subtitle` **When** la bannière système s'affiche **Then** `font-family` utilise `'Bebas Neue', sans-serif` pour le titre et `'Rajdhani', sans-serif` pour le sous-titre **And** `text-shadow` ne contient plus `rgba(255, 100, 255, ...)` (magenta) — remplacé par `rgba(255, 79, 31, 0.4)` (orange Redshift) ou supprimé.

5. **Given** `html, body, #root` dans style.css **When** la page se charge **Then** `background` utilise `var(--rs-bg)` (`#0d0b14`) au lieu de `#0a0a0f`.

6. **Given** `vitest run` **When** la story est implémentée **Then** tous les tests existants passent — les tests ne vérifient pas les styles inline mais certains utilisent `text-game-*` en sélecteurs ; ajuster les sélecteurs de test si nécessaire.

## Tasks / Subtasks

- [x] Task 1 — Nettoyer `@theme` dans `style.css` (AC: #1)
  - [x] Déplacer les 3 `@keyframes` (fadeIn, slideUp, pulseGlow) hors du bloc `@theme` → au niveau racine, juste après le bloc `@theme`
  - [x] Supprimer toutes les variables `--color-game-*` (bg, bg-medium, border, text, text-muted, accent, hp, hp-low, xp, timer, cooldown, danger, success, primary, secondary) du bloc `@theme`
  - [x] Supprimer `--font-game` du bloc `@theme`
  - [x] Conserver les `--animate-*` dans `@theme` (elles référencent les keyframes qui sont maintenant au niveau racine — Tailwind v4 résout ça)
  - [x] Vérifier que le bloc `@theme` ne contient plus que les 3 animations

- [x] Task 2 — Mettre à jour `html, body, #root` background (AC: #5)
  - [x] Remplacer `background: #0a0a0f` par `background: var(--rs-bg)`

- [x] Task 3 — Migrer `.damage-number` font-family (AC: #3)
  - [x] Remplacer `font-family: 'Inter', system-ui, sans-serif` par `font-family: 'Rajdhani', sans-serif` dans la classe `.damage-number`

- [x] Task 4 — Migrer `.system-name-banner-text` et `.system-name-banner-subtitle` (AC: #4)
  - [x] `.system-name-banner-text` : `font-family` → `'Bebas Neue', sans-serif`, `text-shadow` → remplacer `rgba(255, 100, 255, 0.6)` par `rgba(255, 79, 31, 0.4)`
  - [x] `.system-name-banner-subtitle` : `font-family` → `'Rajdhani', sans-serif`, `text-shadow` → remplacer `rgba(255, 100, 255, 0.4)` par `rgba(255, 79, 31, 0.3)`

- [x] Task 5 — Purger `font-game` des classNames JSX (AC: #2)
  - [x] `HUD.jsx` : retirer `font-game` du className root div — ajouter `fontFamily: "'Rajdhani', sans-serif"` en inline style
  - [x] `MainMenu.jsx` : retirer `font-game` du className — déjà stylé inline via `S` object
  - [x] `GameOverScreen.jsx` : retirer `font-game` du className
  - [x] `VictoryScreen.jsx` : retirer `font-game` du className
  - [x] `UpgradesScreen.jsx` : retirer `font-game` du className
  - [x] `StatsScreen.jsx` : retirer `font-game` du className
  - [x] `Armory.jsx` : retirer `font-game` du className
  - [x] `GalaxyChoice.jsx` : retirer `font-game` du className
  - [x] `TunnelHub.jsx` : retirer `font-game` du className
  - [x] `PauseMenu.jsx` : retirer `font-game` du className
  - [x] `LevelUpModal.jsx` : retirer `font-game` du className
  - [x] `BossHPBar.jsx` : retirer `font-game` du className
  - [x] `ShipSelect.jsx` : retirer `font-game` du className
  - [x] `OptionsModal.jsx` : retirer `font-game` du className
  - [x] Pour chaque composant, ajouter si nécessaire un `style={{ fontFamily: "'Rajdhani', sans-serif" }}` sur le div root si aucun fontFamily inline n'est déjà défini

- [x] Task 6 — Purger `text-game-*`, `bg-game-*`, `border-game-*`, `accent-game-*`, `text-yellow-*` des classNames JSX (AC: #2)
  - [x] `HUD.jsx` : remplacer `text-game-danger` → inline `color: 'var(--rs-danger)'`, `text-yellow-400` → inline `color: 'var(--rs-gold)'`, `text-game-timer` → inline `color: 'var(--rs-text)'`, `text-game-text` → inline `color: 'var(--rs-text)'`, `text-game-text-muted` → inline `color: 'var(--rs-text-muted)'`, `bg-game-danger` → inline `background: 'var(--rs-danger)'`
  - [x] `LevelUpModal.jsx` : remplacer `text-game-text` → inline, `text-game-text-muted` → inline
  - [x] `UpgradesScreen.jsx` : remplacer `text-game-text` → inline, `text-game-text-muted` → inline
  - [x] `Armory.jsx` : remplacer `text-game-text` → inline, `text-game-text-muted` → inline
  - [x] `BossHPBar.jsx` : remplacer `text-game-text` → inline
  - [x] `StatLine.jsx` : remplacer `text-game-text-muted` → inline, `text-game-text` → inline
  - [x] `ShipSelect.jsx` : remplacer `border-game-border`, `border-game-accent`, `ring-game-accent` → inline styles
  - [x] `OptionsModal.jsx` : remplacer `accent-game-primary` → inline accent color

- [x] Task 7 — Migrer `ProgressBar.jsx` (AC: #2)
  - [x] Remplacer le mapping className (`bg-game-hp`, `bg-game-xp`, `bg-game-cooldown`) par des inline styles utilisant les variables `--rs-*` : hp → `var(--rs-hp)`, xp → `var(--rs-violet)` *(intentional: violet pour cohérence design avec XPBarFullWidth — spec originale indiquait `var(--rs-success)` mais variante `xp` est dead code remplacé par XPBarFullWidth)*, cooldown → `var(--rs-dash-cd)`, boss → `var(--rs-hp)`
  - [x] Mettre à jour `ProgressBar.test.jsx` pour vérifier les inline styles au lieu des classNames `bg-game-*`

- [x] Task 8 — Vérification tests (AC: #6)
  - [x] `vitest run` → tous les tests passent
  - [x] Grep confirmation : zéro occurrence de `text-game-`, `bg-game-`, `border-game-`, `font-game`, `accent-game-`, `text-yellow-` dans `src/ui/`
  - [x] Grep confirmation : zéro occurrence de `--color-game-*` et `--font-game` dans `src/style.css`

## Dev Notes

### Fichiers à modifier

| Fichier | Changements |
|---------|------------|
| `src/style.css` | Purger `@theme` legacy, déplacer keyframes, migrer damage-number + banner + body bg |
| `src/ui/HUD.jsx` | Purger `font-game`, `text-game-*`, `bg-game-*`, `text-yellow-*` |
| `src/ui/MainMenu.jsx` | Purger `font-game` |
| `src/ui/GameOverScreen.jsx` | Purger `font-game` |
| `src/ui/VictoryScreen.jsx` | Purger `font-game` |
| `src/ui/UpgradesScreen.jsx` | Purger `font-game`, `text-game-*` |
| `src/ui/StatsScreen.jsx` | Purger `font-game` |
| `src/ui/Armory.jsx` | Purger `font-game`, `text-game-*` |
| `src/ui/GalaxyChoice.jsx` | Purger `font-game` |
| `src/ui/TunnelHub.jsx` | Purger `font-game` |
| `src/ui/PauseMenu.jsx` | Purger `font-game` |
| `src/ui/LevelUpModal.jsx` | Purger `font-game`, `text-game-*` |
| `src/ui/BossHPBar.jsx` | Purger `font-game`, `text-game-*` |
| `src/ui/ShipSelect.jsx` | Purger `font-game`, `border-game-*` |
| `src/ui/modals/OptionsModal.jsx` | Purger `font-game`, `accent-game-*` |
| `src/ui/primitives/StatLine.jsx` | Purger `text-game-*` |
| `src/ui/primitives/ProgressBar.jsx` | Migrer `bg-game-*` → inline |
| `src/ui/__tests__/ProgressBar.test.jsx` | Adapter sélecteurs |

### Mapping couleurs legacy → Redshift

| Legacy | Redshift |
|--------|----------|
| `--color-game-bg` (#0a0a0f) | `var(--rs-bg)` (#0d0b14) |
| `--color-game-bg-medium` (#12121a) | `var(--rs-bg-surface)` (#1a1528) |
| `--color-game-border` (#2a2a3a) | `var(--rs-border)` (#2e2545) |
| `--color-game-text` (#e8e8f0) | `var(--rs-text)` (#f5f0e8) |
| `--color-game-text-muted` (#6a6a7a) | `var(--rs-text-muted)` (#7a6d8a) |
| `--color-game-accent` (#ff00ff) | `var(--rs-orange)` (#ff4f1f) |
| `--color-game-hp` (#ff3355) | `var(--rs-hp)` (#ef233c) |
| `--color-game-danger` (#ff3333) | `var(--rs-danger)` (#ef233c) |
| `--color-game-success` (#33ff88) | `var(--rs-success)` (#2dc653) |
| `--color-game-primary` (#00f0ff) | `var(--rs-teal)` (#00b4d8) |
| `--color-game-cooldown` (#ffaa00) | `var(--rs-dash-cd)` (#ff4f1f) |
| `--color-game-xp` (#00ff88) | `var(--rs-success)` (#2dc653) |
| `--color-game-timer` (#ffffff) | `var(--rs-text)` (#f5f0e8) |
| `--font-game` (Inter) | `'Rajdhani', sans-serif` |
| `text-yellow-400` | `var(--rs-gold)` (#ffd60a) |

### Approche

La suppression de `font-game` des classNames est safe car tous les composants Redshift définissent déjà leur fontFamily en inline. Pour les composants qui n'ont pas encore de fontFamily inline, ajouter `fontFamily: "'Rajdhani', sans-serif"` sur le div root.

L'animation `animate-fade-in` (classe Tailwind) dépend de `--animate-fade-in` qui est dans `@theme`. Les keyframes doivent rester accessibles après déplacement hors du `@theme` block — avec Tailwind v4, les keyframes au niveau racine sont résolus normalement.
