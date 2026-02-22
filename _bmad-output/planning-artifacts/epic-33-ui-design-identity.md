# Epic 33: UI Design Identity — Redshift Design System

L'interface abandonne les emojis et les patterns génériques pour adopter une identité visuelle cohérente : icônes SVG géométriques, palette `--rs-*` systématisée, conteneurs ancrés, et layouts repensés pour le Level Up et l'écran Pause.

## Epic Goals

- Remplacer **tous les emojis** (💀 ⭐ ♥ ↻ ⏭ ⚡ 🚀 etc.) par des composants SVG inline cohérents
- Ancrer les écrans Upgrades et Armory dans des **panels conteneurs** au lieu de blocs flottants sur le canvas
- Pivot du **Level Up** en layout 2 colonnes (stats build à gauche, choix verticaux à droite)
- Refonte complète du **Pause Menu** en 2 volets avec stats détaillées
- Éliminer les anti-patterns du design system (`textShadow` glow magenta, hex hardcodés, `backdrop-blur` générique)

## Epic Context

Après 32 épics de contenu et de gameplay, l'interface accumule une dette visuelle identifiable : les emojis cassent l'immersion sci-fi, les écrans Upgrades/Armory flottent sans ancrage sur le canvas 3D, le Level Up affiche les choix horizontalement alors qu'un layout vertical est plus lisible et extensible, et l'écran Pause manque de profondeur de stats. Le design system Redshift (`--rs-*`, Bebas Neue, SVG icons) est défini — cette épic l'applique concrètement.

Cette épic est **purement UI** : zéro changement de logique de jeu, zéro changement de stores, zéro changement de systèmes. Chaque story est safe à isoler et à reverter.

## Stories

### Story 33.1: SVG Icon System — Infrastructure & Remplacement StatLine

As a developer,
I want a shared library of inline SVG icons to replace all emojis in the UI,
So that every screen can use cohesive geometric icons without emojis.

**Acceptance Criteria:**

**Given** `src/ui/icons/index.jsx`
**When** importé dans n'importe quel composant UI
**Then** les composants suivants sont disponibles et exportés : `SkullIcon`, `StarIcon`, `ShieldCrossIcon`, `RerollIcon`, `SkipIcon`, `BanishIcon`, `FragmentIcon`, `LightningIcon`, `SwordIcon`, `ClockIcon`, `SpeedIcon`, `ZoneIcon`
**And** chaque composant accepte les props `size` (number, défaut 14) et `color` (string, défaut `'currentColor'`)
**And** chaque SVG a un `viewBox="0 0 16 16"`, un `stroke-width` de 1.5, aucun `fill` opaque (style linéaire)
**And** les SVGs sont géométriques et épurés (pas de détails complexes, lisibles à 12px)

**Given** le composant `src/ui/primitives/StatLine.jsx`
**When** la prop `icon` reçoit un composant React (function/class)
**Then** il est rendu comme `<icon size={14} color={currentColor} />` — le composant détecte si `icon` est une string ou un composant
**And** si `icon` est une string (symboles Unicode comme `◆`), le comportement existant est préservé
**And** aucune prop existante n'est cassée

**Given** les icônes définies
**When** deux icônes du même contexte (HUD, modal) sont affichées côte à côte
**Then** leur style visuel est cohérent : même stroke-width, même style linéaire, même poids optique

### Story 33.2: HUD — Remplacement des Emojis par SVG Icons

As a player,
I want the in-game HUD stats to use geometric icons instead of emojis,
So that the interface feels consistent with the game's sci-fi identity.

**Acceptance Criteria:**

**Given** `HUD.jsx` — stats cluster (lignes 387–406)
**When** le HUD est affiché pendant le gameplay
**Then** les remplacements suivants sont effectifs :
  - `icon="💀"` kills → `<SkullIcon>` couleur `var(--rs-danger)`
  - `icon="⭐"` score → `<StarIcon>` couleur `var(--rs-gold)`
  - `icon="♥"` revival → `<ShieldCrossIcon>` couleur `var(--rs-teal)`
  - `icon="↻"` reroll → `<RerollIcon>` couleur `var(--rs-teal)`
  - `icon="⏭"` skip → `<SkipIcon>` couleur `var(--rs-gold)`
**And** `icon="◆"` (fragments) reste inchangé — symbole Unicode géométrique acceptable
**And** `icon="✕"` (banish) reste inchangé — caractère ASCII acceptable

**Given** `AnimatedStat` — le prop `icon`
**When** un composant SVG est passé en prop
**Then** il est rendu correctement sans briser l'animation `stat-updated`
**And** la taille de l'icône s'adapte au clamp `fontSize` de son conteneur (`size={14}` par défaut)

**Given** la lisibilité HUD pendant le gameplay
**When** les icônes SVG remplacent les emojis
**Then** les stats restent lisibles sur le canvas 3D en mouvement
**And** aucune régression de layout (tailles et espacements identiques)

### Story 33.3: Permanent Upgrades — Panel Conteneur & Design System

As a player,
I want the Permanent Upgrades screen to feel anchored and contained,
So that it doesn't look like floating cards over the 3D scene.

**Acceptance Criteria:**

**Given** `UpgradesScreen.jsx` — layout principal
**When** l'écran est ouvert
**Then** le contenu est enveloppé dans un panel avec `background: var(--rs-bg-surface)`, `border: 1px solid var(--rs-border)`
**And** le panel a un `clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)` (coin supérieur droit coupé)
**And** la largeur du panel est `clamp(640px, 70vw, 960px)` et la hauteur max `85vh` avec scroll interne
**And** le fond flou `backdrop-blur-sm` est supprimé des cards et du conteneur principal

**Given** le header de l'écran
**When** affiché
**Then** le titre `PERMANENT UPGRADES` est en `font-family: 'Bebas Neue'`, `letter-spacing: 0.15em`, sans `textShadow`
**And** le solde de fragments utilise `var(--rs-violet)` au lieu de `#cc66ff` hardcodé
**And** le bouton REFUND ALL utilise le style outline danger : `border: 1px solid var(--rs-danger)`, `color: var(--rs-danger)`, fond transparent

**Given** les `UpgradeCard`
**When** affichées dans la grille
**Then** chaque card utilise `background: var(--rs-bg-raised)`, `border: 1px solid var(--rs-border)` au repos
**And** le `backdrop-blur-sm` est supprimé des cards
**And** le hover affordable remplace `border-[#cc66ff]/60` par `border-color: var(--rs-violet)` avec `opacity: 0.6`
**And** la couleur bonus (`text-[#cc66ff]`) est remplacée par `color: var(--rs-violet)`
**And** le bouton de coût inline utilise `border-color: var(--rs-violet)` et `color: var(--rs-violet)`
**And** l'icône emoji (`info.icon`) est remplacée : si l'upgrade a un mapping SVG dans `UPGRADE_ICON_MAP`, l'icône SVG est rendue ; sinon, un carré `16×16` avec l'initiale en `Space Mono` et couleur `var(--rs-orange)` est affiché
**And** le `textShadow` sur le h1 est supprimé

**Given** les états de card
**When** une upgrade est maxée
**Then** le badge MAX utilise `color: var(--rs-success)` (= `#2dc653`) au lieu de `text-game-success`

### Story 33.4: Armory — Panel Conteneur & Icônes Armes/Boons

As a player,
I want the Armory screen to feel anchored and use symbolic icons instead of emojis,
So that the visual identity is consistent with the rest of the game.

**Acceptance Criteria:**

**Given** `Armory.jsx` — layout principal
**When** l'écran est ouvert
**Then** le contenu est enveloppé dans un panel `var(--rs-bg-surface)` avec le même `clip-path` que l'écran Upgrades (coin haut-droit coupé)
**And** les onglets Weapons/Boons sont des tabs intégrées dans le header du panel (pas flottantes)
**And** l'onglet actif a une ligne de `2px` `var(--rs-orange)` en bas en guise d'indicateur
**And** `backdrop-blur-sm` est supprimé

**Given** `WEAPON_ICONS` (lignes 22–34 de `Armory.jsx`)
**When** un weapon card découvert est affiché
**Then** les emojis sont remplacés par un **badge initial** : carré `28×28px`, fond `var(--rs-bg-raised)`, bordure `1px solid var(--rs-border)`, texte en `Space Mono 600` avec les 2 premières lettres du weapon ID (ex. `LF` pour `LASER_FRONT`, `SS` pour `SPREAD_SHOT`, `EX` pour `EXPLOSIVE_ROUND`)
**And** la couleur du texte dans le badge est `var(--rs-orange)` pour les weapons
**And** pour les boons (BOON_ICONS), la même logique s'applique avec couleur `var(--rs-violet)`

**Given** les cards non-découvertes
**When** un item n'est pas encore découvert
**Then** l'emoji `❓` est remplacé par un badge `??` en `Space Mono`, couleur `var(--rs-text-dim)`, fond `var(--rs-bg-raised)` atténué
**And** le texte `Undiscovered weapon/boon` reste présent

**Given** les cards découvertes
**When** un item est découvert
**Then** le `✓ Discovered` reste (symbole Unicode acceptable)
**And** la card utilise `border: 1px solid var(--rs-border)`, fond `var(--rs-bg-raised)`, sans `backdrop-blur`

### Story 33.5: Ship Select — Suppression des Emojis dans les Stats

As a player,
I want the Ship Select screen to display stat icons consistently with the rest of the UI,
So that no emojis appear anywhere in the game menus.

**Acceptance Criteria:**

**Given** `ShipSelect.jsx` — affichage des stats du vaisseau sélectionné
**When** les stats sont affichées via `StatLine`
**Then** tous les appels `StatLine` avec emojis en prop `icon` sont remplacés par les composants SVG correspondants de `src/ui/icons/index.jsx` :
  - ❤️ HP → `ShieldCrossIcon` couleur `var(--rs-hp)`
  - ⚡ Speed → `SpeedIcon` couleur `var(--rs-teal)`
  - 🗡️ Damage → `SwordIcon` couleur `var(--rs-orange)`
  - Et tout autre emoji trouvé dans le fichier
**And** les stats sans icône SVG équivalent utilisent un symbole Unicode géométrique neutre (`·`, `—`) ou le composant le plus proche

**Given** les badges de lock/unlock sur les vaisseaux et skins
**When** affichés
**Then** aucun emoji n'est présent dans les badges (vérifier les labels `LOCKED`, `UNLOCKED`, `LVL X REQUIRED`)

**Given** le comportement de `StatLine`
**When** des composants SVG sont passés en prop `icon`
**Then** le rendu est correct (Story 33.1 prérequis satisfait)
**And** aucune régression de layout ou de lisibilité sur le panneau de stats

### Story 33.6: Level Up Modal — Layout Vertical 2 Colonnes

As a player,
I want level-up choices to be displayed vertically with my current build stats on the side,
So that I can make informed decisions without losing sight of my build state.

**Acceptance Criteria:**

**Given** `LevelUpModal.jsx` — layout principal
**When** le modal s'affiche
**Then** le layout est en 2 colonnes : colonne gauche (`width: 220px`, fixe) + colonne droite (flex-grow, choix verticaux)
**And** les deux colonnes ont `gap: 24px` et sont alignées par le haut

**Given** la colonne gauche — Build Overview
**When** affichée
**Then** elle contient : titre `CURRENT BUILD` en `Rajdhani 700`, `color: var(--rs-text-muted)`, `letter-spacing: 0.12em`
**And** les stats actuelles du joueur : HP `current/max`, Level, Speed (2 décimales), Damage Mult (×1.XX)
**And** le nombre de weapons et de boons équipés (`Weapons: N · Boons: M`)
**And** une séparation visuelle `border-top: 1px solid var(--rs-border)` avant les boutons stratégiques
**And** les boutons REROLL et SKIP sont dans la colonne gauche (pas en dessous des cards)
**And** les labels REROLL et SKIP n'ont plus d'emojis `↻` et `⏭` — le texte seul suffit : `REROLL (N)` et `SKIP (N)`

**Given** la colonne droite — Choix verticaux
**When** les choix s'affichent
**Then** les cards sont en `flex-col gap-3` (verticales) au lieu de `flex gap-4` (horizontales)
**And** chaque card est en `flex-row` : `border-left: 3px solid <rarityColor>` à gauche, contenu textuel à droite
**And** le badge rareté est un label inline `[EPIC]` en `Rajdhani 700` avec la couleur de rareté
**And** `boxShadow` glow est supprimé — la `border-left` colorée suffit à signifier la rareté
**And** le shortcut clavier `[1]`–`[4]` est affiché en `Space Mono`, `color: var(--rs-text-dim)`, aligné à droite

**Given** le bouton banish sur chaque card
**When** des charges banish sont disponibles
**Then** le `✕` reste acceptable comme caractère (pas emoji) — le bouton garde son style actuel hors glow
**And** `boxShadow: '0 0 6px ...'` sur le bouton banish est supprimé

**Given** les hints clavier en bas
**When** affichés
**Then** le texte `R Reroll · S Skip · X+# Banish` reste, sans changement

**Given** la lisibilité sur petits écrans
**When** la largeur disponible est inférieure à 700px
**Then** le layout tombe en colonne unique (gauche au-dessus, droite en dessous) via `flex-wrap: wrap`

### Story 33.7: Pause Menu — Refonte 2 Volets Détaillés

As a player,
I want the pause menu to show a detailed overview of my run in two organized panels,
So that I can assess my full build state and decide whether to continue or quit.

**Acceptance Criteria:**

**Given** `PauseMenu.jsx` — layout principal
**When** le menu pause s'ouvre
**Then** le modal fait `width: clamp(640px, 65vw, 920px)` au lieu de `clamp(320px, 40vw, 720px)`
**And** le contenu est organisé en 2 volets côte à côte : volet gauche (inventaire) + volet droit (stats)
**And** les deux volets ont `gap: 0` avec une séparation `border-right: 1px solid var(--rs-border)` entre eux
**And** le fond de l'overlay est `rgba(13, 11, 20, 0.85)` (= `var(--rs-bg)` à 85%) au lieu de `rgba(0,0,0,0.6)`
**And** le panel a un `clip-path` coin coupé haut-droit cohérent avec les autres panels du jeu

**Given** le header du modal
**When** affiché
**Then** le titre `PAUSED` est en `Bebas Neue`, `color: var(--rs-orange)`, `letter-spacing: 0.15em`
**And** le bouton `[ESC/R] RESUME` est dans le header aligné à droite, style outline `var(--rs-teal)`

**Given** le volet gauche — Inventaire
**When** affiché
**Then** il contient la section WEAPONS (weapons équipés) et la section BOONS (boons équipés)
**And** chaque weapon card affiche : nom, niveau (`Lv3`), dégâts, cooldown — en format compact `flex-col`
**And** chaque boon card affiche : nom, niveau, `statPreview` si disponible
**And** aucun emoji dans les labels des sections
**And** les cards weapons utilisent la `projectileColor` du weapon comme accent (`border-left: 2px solid <color>`)
**And** les cards boons utilisent `border-left: 2px solid var(--rs-violet)`

**Given** le volet droit — Stats
**When** affiché
**Then** il contient deux sous-sections : `RUN STATS` et `PLAYER STATS`
**And** **RUN STATS** : Temps de run (`formatTimer(totalElapsedTime)`), Kills, Score, Fragments
**And** **PLAYER STATS** : HP (`currentHP / maxHP`), Niveau, Vitesse, Damage Multiplier, Rerolls, Skips, Banishes (si > 0)
**And** toutes les `StatLine` avec emojis ❤️🎖️⚡🗡️⏱️💀⭐ sont remplacées par les composants SVG de Story 33.1
**And** les valeurs numériques utilisent `font-family: 'Space Mono'`, `tabular-nums`
**And** les labels utilisent `Rajdhani 600`, `letter-spacing: 0.1em`, `color: var(--rs-text-muted)`

**Given** la zone d'actions en bas
**When** affichée
**Then** `[Q] QUIT TO MENU` est centré en bas, style `color: var(--rs-danger)`, outline `var(--rs-danger)`
**And** le `[ESC/R] RESUME` est dans le header (pas dans la zone actions)

**Given** la confirmation de quit
**When** le joueur confirme l'abandon
**Then** le dialog de confirmation garde son style actuel — pas de refonte nécessaire
**And** seuls les emojis éventuels sont supprimés

## Technical Notes

**Story 33.1 — SVG Icons:**
- Créer `src/ui/icons/index.jsx` — chaque icône est un composant fonctionnel `({ size = 14, color = 'currentColor' }) => <svg ...>`
- `SkullIcon` : losange + 2 points en bas (yeux) — style géométrique, pas anatomique
- `StarIcon` : étoile à 4 branches (croix diagonale) — pas l'étoile naïve à 5 branches
- `ShieldCrossIcon` : bouclier simple avec croix intérieure — revival/HP
- `RerollIcon` : flèche circulaire simple (arc + pointe)
- `SkipIcon` : deux chevrons `>>` ou triangle + barre
- `BanishIcon` : X géométrique (déjà `✕` en texte, garder cohérence)
- `FragmentIcon` : losange `◆` en SVG (cohérent avec l'Unicode existant)
- `LightningIcon` : éclair angulaire simple
- `SwordIcon` : épée simple (lame + garde)
- `ClockIcon` : cercle + aiguilles minimalistes
- `SpeedIcon` : chevron vers la droite ou flèche angulaire
- `ZoneIcon` : cercle concentrique simple

**Story 33.1 — StatLine update:**
- Lire `src/ui/primitives/StatLine.jsx` avant modification
- Détection : `typeof icon === 'function'` → render as `<Icon size={14} color={color} />` ; sinon render comme string

**Story 33.3/33.4 — UPGRADE_ICON_MAP:**
- Définir dans `UpgradesScreen.jsx` un objet `UPGRADE_ICON_MAP` qui mappe `upgradeId` → composant SVG
- Ex : `{ ATTACK_POWER: SwordIcon, ATTACK_SPEED: LightningIcon, ZONE: ZoneIcon, REGEN: ShieldCrossIcon }`
- Fallback : carré `16×16` avec 2 premières lettres en `Space Mono`

**Story 33.6 — Stats colonne gauche:**
- Lire les stats depuis `usePlayer.getState()` et `useBoons.getState()` directement (déjà fait dans le composant)
- Le composant a déjà accès à `currentHP`, `maxHP`, `currentLevel`, `shipBaseSpeed`, `damageMultiplier`

**Story 33.7 — Layout 2 volets:**
- Remplacer `<div className="border rounded-lg...">` par une structure `<div style={{ display: 'flex' }}>` avec 2 enfants
- Volet gauche : `width: '45%'`, padding right, border-right
- Volet droit : `width: '55%'`, padding left

## Dependencies

- Story 33.1 est le **prérequis** de toutes les autres stories de cet épic — doit être implémentée en premier
- Stories 33.2–33.5 peuvent être faites en parallèle après 33.1
- Stories 33.6 et 33.7 peuvent être faites en parallèle après 33.1
- Dépendances externes : `src/ui/primitives/StatLine.jsx` (à lire avant 33.1), `src/entities/permanentUpgradesDefs.js` (icônes mapping)

## Success Metrics

- Zéro emoji visible dans toute l'interface (QA : grep `'💀\|⭐\|♥\|↻\|⏭\|⚡\|🚀\|🔮\|🛡️'` dans `src/ui/`)
- Les écrans Upgrades et Armory ont un fond défini — plus de cards flottantes sur le canvas nu
- Le Level Up modal est lisible avec 4 choix sans scroll horizontal
- Le Pause Menu affiche au moins 8 stats distinctes réparties en 2 sections
- Aucune régression de gameplay (stores, logique) — toutes les stories sont UI-only
