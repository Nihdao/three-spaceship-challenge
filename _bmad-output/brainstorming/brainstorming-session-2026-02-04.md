---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Game design roguelite spatial style Vampire Survivors'
session_goals: 'Définir mécaniques de jeu, systèmes de progression, scope prototype concours 1 mois'
selected_approach: 'ai-recommended'
techniques_used: ['Cross-Pollination', 'Morphological Analysis', 'Resource Constraints']
ideas_generated: [42]
session_active: false
workflow_completed: true
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Adam
**Date:** 2026-02-04

## Session Overview

**Topic:** Game design d'un roguelite spatial style Vampire Survivors pour un concours Three.js/R3F

**Goals:**
- Définir et affiner les mécaniques de jeu
- Explorer les systèmes de progression (loot, XP, bonus permanents)
- Établir un scope réaliste pour un prototype en 1 mois

---

## Game Design Document — Synthèse complète

### Vision du projet

| Élément | Description |
|---------|-------------|
| **Genre** | Roguelite/Survivor arcade spatial |
| **Inspirations** | Vampire Survivors, Megabonk, Hades, Persona 5, Ace Attorney |
| **Thème narratif** | Style Interstellar — explorer les galaxies pour ramener des ressources à l'humanité en danger |
| **Ton** | Épique mais absurde/lunaire — humour + tension dramatique |
| **Vue gameplay** | Top-down / vue du dessus (éléments 3D) |
| **Scope proto** | 1 perso, 1 vaisseau, 2 systèmes (manches de ~10 min), 1 galaxie |

### Wording / Univers

| Terme | Représente |
|-------|------------|
| **Galaxie** | Monde / Destination principale |
| **Système (solaire)** | Niveau / Manche (~10 min) |
| **Trou de ver** | Passage inter-système (anomalies naturelles imprévisibles) |
| **Fragments** | Monnaie persistante (référence fragment shaders Three.js) |

---

### Système de déplacement

| Aspect | Design |
|--------|--------|
| **Position** | Réactive, directe, pas d'inertie (style VS) |
| **Rotation** | Smooth interpolée (~200ms pour 180°), le vaisseau tourne vers la direction du mouvement |
| **Banking/Tilt** | Inclinaison latérale dans les virages (détail 3D, gros impact visuel) |
| **Léger overshoot** | Le vaisseau se "redresse" avec un très léger rebond à l'arrêt |
| **Dash / Barrel roll** | 1 bouton — dash directionnel avec tonneau (ou tonneau sur place sans direction). Invulnérabilité pendant l'animation. Cooldown à tuner (3-5 sec). **TIER 2** |
| **Contrôle** | Déplacement uniquement (stick/clavier), pas de visée séparée |

---

### Armes (10 définies)

| # | Arme | Description |
|---|------|-------------|
| 1 | **Laser frontal (Base)** | Tir "pew pew" en face du vaisseau (direction fixe du vaisseau). Premier impact = fin du projectile. Slot 1 fixe. |
| 2 | **Champ AoE** | Zone de dégâts autour du vaisseau. Dégâts passifs à tout ce qui entre dans la zone. |
| 3 | **Laser boomerang** | Laser rapide qui rebondit d'ennemi en ennemi façon boomerang. |
| 4 | **Nova stellaire (auto)** | Charge auto, explose en cercle autour de toi quand la charge est pleine. |
| 5 | **Trainée corrosive** | Trace de dégâts derrière le vaisseau. Plus tu bouges, plus tu couvres. |
| 6 | **Arme "Three" (easter egg)** | Comme le laser frontal mais en forme de cône — plus large, moins de portée. Clin d'œil Three.js. |
| 7 | **Débris orbitaux** | Astéroïdes en rotation autour du vaisseau, dégâts de contact. |
| 8 | **Bombes** | Lance un projectile qui explose en AoE au premier impact. |
| 9 | **Lasers latéraux** | Par intervalle, des lasers se tirent perpendiculairement depuis les côtés du vaisseau. |
| 10 | **Tir perçant** | Projectile qui transperce tous les ennemis jusqu'à la fin de sa portée. Tire par salves de 3. |

**Système armes:**
- 4 slots max (slot 1 = arme de base fixe)
- Niveaux 1→9 par arme
- Pas de fusion
- Rareté variable
- Tir automatique en face du vaisseau

---

### Boons — Passifs globaux (10 définis)

| # | Boon | Description |
|---|------|-------------|
| 1 | **Vitesse d'attaque** | Réduit le cooldown de toutes les armes |
| 2 | **Bonus XP** | +% XP gagnée |
| 3 | **Bonus Chance** | Meilleures récompenses planètes, meilleurs dilemmes, meilleures évolutions armes/boons |
| 4 | **Bouclier** | Absorbe un ou plusieurs dégâts (level-up = plus de charges ou cooldown réduit) |
| 5 | **Réduction de dégâts** | -% dégâts subis |
| 6 | **Vitesse de déplacement** | Mouvement plus rapide |
| 7 | **Scan** | Vitesse de scan augmentée |
| 8 | **Regen vie** | Régénération HP passive |
| 9 | **Vol de vie** | Récupère HP en tuant des ennemis |
| 10 | **Augmentation PV max** | +HP maximum |

**Système boons:**
- 3 slots max
- Globaux = affectent toutes les armes
- Rareté variable
- Se trouvent via level-up (choix aléatoire)

---

### Catégorisation par rôle (Builds possibles)

| Rôle | Armes | Boons |
|------|-------|-------|
| **Offensif** | Laser, Boomerang, Perçant, Bombes, Three | Vitesse attaque |
| **Défensif** | Champ AoE, Débris orbitaux | Bouclier, Réduction dégâts, PV max |
| **Zone/Contrôle** | Trainée, Nova, Latéraux | Scan, Vitesse déplacement |
| **Survie** | — | Regen, Vol de vie |
| **Économie** | — | Bonus XP, Bonus Chance |

---

### Mécaniques de scan/capture de planètes

| Aspect | Design |
|--------|--------|
| **Tiers** | Petite (silver) / Moyenne (gold) / Grosse (platine) |
| **Mouvement** | Libre DANS la zone de la planète |
| **Reset** | Sortir = retour à 0% (tout ou rien) |
| **Récompense** | Objets/armes/améliorations |
| **Stratégie** | Le monde ne réagit pas à ta capture — timer selon le chrono global |
| **Difficulté** | Plus précieux = temps de capture plus long |

---

### Ennemis — 8 Types (Galaxie 1 : Monstres cosmiques)

| Type | Comportement | Menace |
|------|--------------|--------|
| 1 | Lent, peu de vie | Fodder XP |
| 2 | Lent, plus tanky | Fodder résistant |
| 3 | Rapide, groupe, traverse (pas tracking permanent) | Vagues qui balayent |
| 4 | Très lent, ondes de choc | Zone denial |
| 5 | Orbite autour du joueur | Harcèlement constant |
| 6 | Distance, rayon fixe, harcèle | Sniper mobile |
| 7 | Distance, immobile, gros laser telegraphé, fragile | Sniper fixe — trouve-le ou souffre |
| 8 | Téléporte + attaque distance | Imprévisible |

**Spawns:** Types 1-2 début, 3-6 milieu, 7-8 fin + vagues dangereuses ponctuelles
**Futures galaxies:** Mix vaisseaux/drones + créatures

### Décors dangereux

- **Étoiles instables:** Clignotent si joueur proche → explosion
- **Astéroïdes:** Tailles/vitesses variées, obstacles mouvants

---

### Boss

| Aspect | Design |
|--------|--------|
| **Trigger** | Trouver et activer le trou de ver désactivé |
| **Transition** | Onde de choc (clear tous les mobs) + animation entrée boss |
| **Combat** | 1v1 bullet hell pur, caméra figée en arène |
| **Type** | Tanky, patterns répétitifs (rayons, boules orbitales) — hommage shmup |
| **Exception** | Certains boss "add specialist" peuvent spawn leurs propres mobs |
| **Stratégie joueur** | Choisir le bon moment pour trigger (assez fort mais pas trop de mobs) |

---

### Structure de partie

| Aspect | Design |
|--------|--------|
| **Durée manche** | ~10 min max (plus rapide que VS/Megabonk = différenciation) |
| **Manches proto** | 2 systèmes par galaxie |
| **Game over** | Mort OU temps écoulé |
| **Victoire** | Trouver trou de ver → activer → battre boss → tunnel → next système |

---

### Narration

| Élément | Design |
|---------|--------|
| **Guide radio** | Personnage sur la planète d'origine, brief chaque galaxie, commente les runs |
| **Dialogues boss** | Chrono freeze, dialogue qui évolue avec les combats (plus tu bats = plus de lore) |
| **Tension morale** | Les boss remarquent que tu pilles leurs ressources (humour) |
| **Personnalité galaxies** | Chaque biome a une ambiance et une "philosophie" |

---

### Méta-progression

**Monnaie:** Fragments (référence fragment shaders)

| Élément | Design |
|---------|--------|
| **Quêtes persistantes** | Visibles au menu, débloquent armes, boons, vaisseaux, cosmétiques |
| **Galaxies** | Débloquées par succès des précédentes |
| **Upgrades permanents** | Jauges crantées par stat, achetées avec Fragments |
| **Dilemmes** | Gain contre malus (ex: +30% fragments MAIS +20% dégâts subis) |
| **Dilemme rare** | Gains/malus extrêmes occasionnels |
| **Sacrifice tunnel** | 50% Fragments gagnés → récupérer HP |

---

### Tunnel (hub de transition)

| Aspect | Design |
|--------|--------|
| **Vue** | 3e personne, vaisseau à gauche incliné vers sortie |
| **Ambiance** | Tunnel infini tant que le joueur n'a pas validé |
| **UI** | Interface 2D stylisée à droite (upgrades, dilemmes, sacrifice) |
| **Sortie** | Bout blanc s'agrandit → fondu → trou blanc s'ouvre → bandeau "XXXX System" |
| **Quand** | Menu → Système 1 ET entre chaque système |
| **Actions** | Upgrades permanents, dilemmes à malus, sacrifice HP |

---

### Vaisseaux

| Vaisseau | Stats | Arme liée | Statut |
|----------|-------|-----------|--------|
| "Le Classique" | ★★★ équilibré | Laser frontal | Proto |
| Le Tank | HP↑ Vitesse↓ | Canon lourd | Post-proto |
| Le Speedster | Vitesse↑ HP↓ | Mitrailleuse | Post-proto |
| Le Glass Cannon | Dégâts↑ HP↓↓ | Railgun | Post-proto |

---

### Flow UX complet

```
Menu Principal
├── Quêtes (voir objectifs persistants)
├── Sélection Personnage (1 dans proto)
├── Sélection Galaxie (1 dans proto)
└── Lancer
    ↓
Tunnel de ver (Menu → Système 1)
├── Upgrades permanents (Fragments)
├── Dilemmes à malus (optionnel)
├── Sacrifice HP (optionnel)
└── Valider sortie
    ↓
Système 1 — Gameplay top-down (~10 min)
├── Explorer la map
├── Tuer ennemis → XP → Level-up (choix arme/boon)
├── Scanner planètes (silver/gold/platine)
├── Trouver le trou de ver
├── Activer → Onde de choc → Boss 1v1
└── Victoire
    ↓
Tunnel de ver (Système 1 → Système 2)
├── Upgrades / Dilemmes / Sacrifice
└── Valider sortie
    ↓
Système 2 — Gameplay (~10 min)
├── Mêmes mécaniques, difficulté accrue
└── Boss → Victoire
    ↓
Fin de run (Victoire ou Game Over)
└── Retour Menu → Quêtes mises à jour
```

---

## Priorisation Prototype (Concours 1 mois)

### TIER 1 — Must have (le jeu fonctionne)

- Déplacement vaisseau top-down (rotation smooth + banking)
- Tir automatique en face du vaisseau
- Spawns ennemis type 1-2 (fodder)
- Système XP + level-up (choix arme/boon)
- 3-4 armes dans le pool (Base + 2-3)
- 3-4 boons dans le pool
- 1 système (1 map) jouable
- Chrono de 10 min
- Game over (mort ou temps écoulé)
- UI basique (HP, chrono, XP, mini-carte)

### TIER 2 — Wow factor (différenciation concours)

- Planètes à scanner (silver au minimum)
- Boss + trou de ver (1v1 simplifié + onde de choc)
- Tunnel de transition (visuel basique + upgrades)
- Types ennemis 3-5 en plus
- Dash / Barrel roll (invulnérabilité, tonneau sur place ou directionnel)
- 6-7 armes totales
- Dilemmes (tunnel)

### TIER 3 — Complet (si le temps le permet)

- 2ème système (2ème map)
- Types ennemis 6-8
- 10 armes + 10 boons complets
- Méta-progression (quêtes, fragments, upgrades permanents)
- Narration (guide radio, dialogues boss)
- Décors dangereux (étoiles instables, astéroïdes)
- Sacrifice HP tunnel
- Rareté armes/boons
- Bandeau "XXXX System" + animations polish

---

## Session Summary

**Techniques utilisées:** Cross-Pollination, Morphological Analysis, Resource Constraints
**Idées générées:** 42 concepts de design
**Domaines couverts:** Déplacement, armes (10), boons (10), ennemis (8 types), boss, scan planètes, méta-progression, tunnel, narration, structure de partie, priorisation

**Breakthrough concepts:**
- Tunnel de trou de ver comme hub de décision stratégique (upgrades + dilemmes + sacrifice)
- Boss 1v1 isolé post-onde de choc (rupture de rythme survivor → bullet hell)
- Scan de planètes tout-ou-rien avec timing stratégique sur le chrono global
- Dash barrel roll avec invulnérabilité
- Easter eggs Three.js (arme cone, monnaie Fragments)
- Ton narratif "épique mais absurde"

**Recommandation:** Viser Tier 1 + maximum de Tier 2 pour le concours. Le boss + tunnel + dash sont les éléments qui démarqueront le jeu.
