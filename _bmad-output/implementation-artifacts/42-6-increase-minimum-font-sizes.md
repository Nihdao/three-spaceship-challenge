# Story 42.6: Rehausser les tailles de police minimales

Status: done

## Story

As a player,
I want all text in the UI to be comfortably readable,
so that small labels and stats don't strain my eyes during gameplay.

## Acceptance Criteria

1. **Given** `HUD.jsx`
   **When** le HUD est affiché
   **Then** `AnimatedStat` utilise `clamp(13px, 1.3vw, 18px)` au lieu de `clamp(11px, 1.1vw, 16px)`
   **And** le dash label "SPACE" utilise `clamp(10px, 1vw, 12px)` au lieu de `clamp(8px, 0.8vw, 10px)`
   **And** les weapon/boon slot names utilisent `clamp(9px, 0.9vw, 11px)` au lieu de `clamp(7px, 0.7vw, 10px)`
   **And** les weapon/boon slot levels utilisent `clamp(9px, 0.9vw, 11px)` au lieu de `clamp(7px, 0.7vw, 9px)`
   **And** le dash cooldown value utilise `clamp(11px, 1.1vw, 14px)` au lieu de `clamp(9px, 0.9vw, 12px)`

2. **Given** `PauseMenu.jsx`
   **When** le menu pause est affiché
   **Then** `sectionTitleStyle.fontSize` est `12` au lieu de `11`
   **And** les weapon/boon info names utilisent `fontSize: 13` au lieu de `12`
   **And** les weapon/boon stat lines utilisent `fontSize: 12` au lieu de `11`

3. **Given** `LevelUpModal.jsx`
   **When** le modal level-up est affiché
   **Then** les labels du "Current Build" utilisent `fontSize: 12` au lieu de `11`
   **And** les valeurs du "Current Build" utilisent `fontSize: 12` au lieu de `11`
   **And** le footer "Weapons: X · Boons: Y" utilise `fontSize: 11` au lieu de `10`

4. **Given** `StatLine.jsx`
   **When** le mode `compact` est actif
   **Then** le label utilise `text-[11px]` au lieu de `text-[10px]`
   **And** la valeur utilise `fontSize: '12px'` au lieu de `'11px'`

5. **Given** aucun texte dans `src/ui/`
   **When** on cherche des `fontSize` inférieurs à 10px (ou `clamp(Xpx,` avec X < 9)
   **Then** aucune occurrence — le minimum absolu est 9px (réservé aux badges et annotations très secondaires)

6. **Given** `vitest run`
   **When** la story est implémentée
   **Then** tous les tests existants passent

## Tasks / Subtasks

- [x] Task 1 — Mettre à jour les font sizes dans `HUD.jsx` (AC: #1, #5)
  - [x] 1.1 — `AnimatedStat` : lignes 121 et 127 → `clamp(11px, 1.1vw, 16px)` → `clamp(13px, 1.3vw, 18px)`
  - [x] 1.2 — Weapon slot names : lignes 214 et 316 → `clamp(7px, 0.7vw, 10px)` → `clamp(9px, 0.9vw, 11px)`
  - [x] 1.3 — Weapon/boon slot levels : lignes 220 et 322 → `clamp(7px, 0.7vw, 9px)` → `clamp(9px, 0.9vw, 11px)`
  - [x] 1.4 — Dash cooldown value : ligne 649 → `clamp(9px, 0.9vw, 12px)` → `clamp(11px, 1.1vw, 14px)`
  - [x] 1.5 — Dash label "SPACE" : ligne 656 → `clamp(8px, 0.8vw, 10px)` → `clamp(10px, 1vw, 12px)`
  - [x] 1.6 — Minimap compass labels (N/S/W/E) : ligne 576 → `'0.5rem'` (8px) → `'9px'` (minimum absolu requis par AC5)

- [x] Task 2 — Mettre à jour les font sizes dans `PauseMenu.jsx` (AC: #2)
  - [x] 2.1 — `sectionTitleStyle` : ligne 165 → `fontSize: 11` → `fontSize: 12`
  - [x] 2.2 — Weapon/boon info names : lignes 249 et 279 → `fontSize: 12` → `fontSize: 13`
  - [x] 2.3 — Weapon/boon stat lines : lignes 252, 259, 282, 289 → `fontSize: 11` → `fontSize: 12`

- [x] Task 3 — Mettre à jour les font sizes dans `LevelUpModal.jsx` (AC: #3)
  - [x] 3.1 — Current build labels : lignes 159, 175, 285 → `fontSize: 11` → `fontSize: 12`
  - [x] 3.2 — Current build values : ligne 178 → `fontSize: 11` → `fontSize: 12`
  - [x] 3.3 — Footer "Weapons: X · Boons: Y" : lignes 184 et 298 → `fontSize: 10` → `fontSize: 11`

- [x] Task 4 — Mettre à jour `StatLine.jsx` mode compact (AC: #4)
  - [x] 4.1 — Label compact : ligne 18 → `text-[10px]` → `text-[11px]`
  - [x] 4.2 — Valeur compact : ligne 27 → `fontSize: compact ? '11px'` → `fontSize: compact ? '12px'`

- [x] Task 5 — Vérification sweep AC5 (AC: #5)
  - [x] 5.1 — Grep `src/ui/` pour `fontSize.*[0-8]px` et `clamp([0-8]px` et vérifier qu'aucun résidu < 9px ne subsiste après les modifications

- [x] Task 6 — Vérification tests (AC: #6)
  - [x] 6.1 — `vitest run` — tous les tests passent

## Dev Notes

Cette story est purement cosmétique : aucun store, aucun système, aucune logique métier n'est touchée. Il s'agit uniquement de substitutions de valeurs `fontSize` dans 4 fichiers UI.

### Fichiers impactés

| Fichier | Nature des changements |
|---|---|
| `src/ui/HUD.jsx` | 6 occurrences de clamp / fontSize à bumper |
| `src/ui/PauseMenu.jsx` | 6 occurrences de fontSize à bumper |
| `src/ui/LevelUpModal.jsx` | 5 occurrences de fontSize à bumper |
| `src/ui/primitives/StatLine.jsx` | 2 occurrences (classe Tailwind + fontSize inline) |

**Aucun autre fichier ne doit être modifié.**

### Inventaire précis des changements ligne par ligne

#### `src/ui/HUD.jsx`

| Ligne | Actuel | Nouveau |
|---|---|---|
| 121 | `clamp(11px, 1.1vw, 16px)` | `clamp(13px, 1.3vw, 18px)` |
| 127 | `clamp(11px, 1.1vw, 16px)` | `clamp(13px, 1.3vw, 18px)` |
| 214 | `clamp(7px, 0.7vw, 10px)` | `clamp(9px, 0.9vw, 11px)` |
| 220 | `clamp(7px, 0.7vw, 9px)` | `clamp(9px, 0.9vw, 11px)` |
| 316 | `clamp(7px, 0.7vw, 10px)` | `clamp(9px, 0.9vw, 11px)` |
| 322 | `clamp(7px, 0.7vw, 9px)` | `clamp(9px, 0.9vw, 11px)` |
| 576 | `'0.5rem'` (8px) | `'9px'` |
| 649 | `clamp(9px, 0.9vw, 12px)` | `clamp(11px, 1.1vw, 14px)` |
| 656 | `clamp(8px, 0.8vw, 10px)` | `clamp(10px, 1vw, 12px)` |

> ⚠️ Ligne 576 — minimap compass labels (N/S/W/E) : `'0.5rem'` = 8px, en dessous du minimum absolu de 9px requis par AC5. Non mentionné explicitement dans l'epic mais couvert par le sweep AC5.

#### `src/ui/PauseMenu.jsx`

| Ligne | Actuel | Nouveau |
|---|---|---|
| 165 | `fontSize: 11` | `fontSize: 12` |
| 249 | `fontSize: 12` | `fontSize: 13` |
| 252 | `fontSize: 11` | `fontSize: 12` |
| 259 | `fontSize: 11` | `fontSize: 12` |
| 279 | `fontSize: 12` | `fontSize: 13` |
| 282 | `fontSize: 11` | `fontSize: 12` |
| 289 | `fontSize: 11` | `fontSize: 12` |

#### `src/ui/LevelUpModal.jsx`

| Ligne | Actuel | Nouveau |
|---|---|---|
| 159 | `fontSize: 11` | `fontSize: 12` |
| 175 | `fontSize: 11` | `fontSize: 12` |
| 178 | `fontSize: 11` | `fontSize: 12` |
| 184 | `fontSize: 10` | `fontSize: 11` |
| 285 | `fontSize: 11` | `fontSize: 12` |
| 298 | `fontSize: 10` | `fontSize: 11` |

#### `src/ui/primitives/StatLine.jsx`

| Ligne | Actuel | Nouveau |
|---|---|---|
| 18 | `text-[10px]` | `text-[11px]` |
| 27 | `compact ? '11px' : clamp(...)` | `compact ? '12px' : clamp(...)` |

### Architecture et contraintes

- Ces 4 fichiers sont purement dans la couche **UI** (couche 6) — aucun impact sur les stores, systems, GameLoop, ou renderers.
- Aucune modification de `src/style.css` n'est requise pour cette story.
- Le Redshift Design System impose `fontFamily: 'Rajdhani'` pour les labels (600–700) et `'Space Mono'` pour les valeurs tech. Ne pas toucher aux `fontFamily` existants.
- Utiliser `replace_all: false` sur les substitutions pour éviter les collisions entre lignes avec des valeurs identiques. Cibler les lignes précises.

### Contexte : pourquoi ces fichiers

**`AnimatedStat`** (HUD.jsx) : composant réutilisé pour HP, score, fragments, kills dans le stats cluster. Deux `<span>` utilisent la même taille — icône et valeur — à bumper ensemble.

**Weapon/boon slots** (HUD.jsx) : les slots affichent un nom (`clamp(7px,...)`) et un level (`clamp(7px,...)`). Les deux valeurs `7px` min sont clairement trop petites — quasi-illisibles sur petit écran.

**Minimap compass labels** (HUD.jsx ligne 576) : les mini-labels N/S/W/E à `0.5rem` (8px) violent le plancher de 9px de l'AC5. À bumper à `9px`.

**`sectionTitleStyle`** (PauseMenu.jsx ligne 165) : ce style objet est utilisé pour les titres de section "ARMES" / "BOONS" dans le panneau gauche du pause menu.

**"Current Build" section** (LevelUpModal.jsx) : la colonne droite du LevelUpModal liste l'inventaire actuel. Les deux `<span>` label/valeur sont à `11px` → `12px`. Le footer total weapons/boons à `10px` → `11px`.

**`StatLine` compact** (StatLine.jsx) : utilisé dans les panels compacts (UpgradesScreen, Armory). En mode compact, le label Tailwind `text-[10px]` et la valeur `11px` sont bumper d'un cran.

### Tests

Il n'y a pas de tests unitaires qui vérifient les valeurs `fontSize` inline (les tests Vitest testent la logique, pas les styles). Les tests existants pour `HUD.minimap.test.jsx`, `LevelUpModal.test.jsx`, etc. ne sélectionnent pas par classes de taille. Aucun ajustement de tests n'est attendu — la suite doit passer telle quelle.

Vérifier après implémentation avec `vitest run` depuis la racine du projet.

### Project Structure Notes

- `src/ui/` — tous les fichiers modifiés sont ici
- `src/ui/primitives/` — sous-dossier pour les composants atomiques réutilisables comme `StatLine.jsx`
- Les tests sont dans `src/ui/__tests__/` — lire avant si l'un concerne explicitement les fichiers modifiés

### References

- Epic 42 story 42.6 — `_bmad-output/planning-artifacts/epic-42-ui-harmonization-deep-cleanup.md#Story-42.6`
- Design System / typographie — `_bmad-output/planning-artifacts/project-context.md#Typographie`
- HUD.jsx structure — `src/ui/HUD.jsx:100-133` (AnimatedStat), `:200-325` (slots), `:560-660` (dash + minimap)
- PauseMenu.jsx sectionTitleStyle — `src/ui/PauseMenu.jsx:163-170`
- LevelUpModal.jsx current build — `src/ui/LevelUpModal.jsx:155-190`, `:280-305`
- StatLine.jsx compact mode — `src/ui/primitives/StatLine.jsx:18-31`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None — implémentation directe sans blocage._

### Completion Notes List

- Tous les `clamp()` et `fontSize` inline ciblés dans les 4 fichiers UI ont été correctement bumped.
- Numéros de ligne décalés vs story (jusqu'à –85 lignes pour le compass, +18 pour le dash) ; substitutions ciblées par contenu plutôt que par numéro de ligne.
- Minimap compass labels (N/S/W/E) : `fontSize: '0.5rem'` (8px) → `'9px'` à la ligne 491 réelle (story indiquait 576 — décalage dû aux extractions de sous-composants des stories 41.4).
- Dash cooldown + SPACE label trouvés aux lignes 667/674 (story indiquait 649/656 — décalage dû aux ajouts antérieurs).
- `LevelUpModal.jsx` : **3 lignes source** `fontSize: 11` → 12 dans la section "Current Build" (ligne 162 titre, ligne 178 label template, ligne 181 value template), **1 ligne** `fontSize: 10` → 11 (ligne 187 footer). Les références "ligne 285" et "ligne 298" du story task correspondaient à l'ancienne structure du composant (layout Tailwind horizontal, stories pré-33.6/39.2) ; au moment de l'implémentation, `LevelUpModal` avait été entièrement refactorisé par les stories 33.6 et 39.2, rendant ces numéros de lignes obsolètes. Les ACs #3 sont satisfaits : tous les éléments "Current Build" affichent `fontSize: 12` et le footer `fontSize: 11`.
- Sweep AC5 : aucun `fontSize: Xpx` avec X < 9 dans les 4 fichiers modifiés. Note : des valeurs `fontSize: '0.65rem'` (≈ 10.4px @ 16px root) pré-existantes subsistent dans des fichiers `src/ui/` hors scope de cette story (GalaxyChoice, QuestTracker, MainMenu, CreditsModal, RevivePrompt, PlanetRewardModal, OptionsModal) — ces valeurs sont au-dessus du seuil de 9px à la base standard et ne relevaient pas du périmètre de 42.6.
- `vitest run` : 157 fichiers, 2676 tests, 100% verts — aucune régression.

### File List

- `src/ui/HUD.jsx`
- `src/ui/PauseMenu.jsx`
- `src/ui/LevelUpModal.jsx`
- `src/ui/primitives/StatLine.jsx`

## Change Log

- 2026-02-24 — Story 42.6 implémentée : rehaussement des tailles de police minimales dans HUD.jsx (9 occurrences), PauseMenu.jsx (7 occurrences), LevelUpModal.jsx (4 lignes source dans la section "Current Build"), StatLine.jsx (2 occurrences). Plancher minimum absolu 9px respecté (AC5). Tous les tests passent.
- 2026-02-24 — Code review : completion notes corrigées (comptage LevelUpModal inexact + références de lignes obsolètes dues aux refactorisations 33.6/39.2 documentées). Statut passé à done.
