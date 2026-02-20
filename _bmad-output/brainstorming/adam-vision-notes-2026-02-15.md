# Vision Notes — Adam — 2026-02-15

## 1/ L'interface Menu Principal

J'aimerai qu'on ameliore les flow du menu. Deja dans l'interface j'aimerai qu'on mette a cote ou en dessous de BEST RUN, le nombre de fragments accumule par le joueur, ressource rogue lite qui permet de s'ameliorer entre ses runs.

J'aimerai en dessous de PLAY ajouter un UPGRADES qui permettrait d'ouvrir un menu (en gardant le fond, comme le selection de vaisseau) permettant de choisir des upgrades (un peu iso aux upgrades fragments dans le tunnel wormhole).

Il permettra aussi d'ameliorer d'autres choses plus meta :
- Puissance d'attaque - 5 niv
- Armure (reduction de degat) - 5 niv
- Vie max - 3 niv
- Regen - 3 niv
- Cooldown (que j'aimerai renomer vitesse d'attaque) - 3 niv
- Zone (augmente la taille des projectiles) - 3 niv
- Magnet (qui permet de recuperer de plus loin les elements) - 2 niv
- Luck (qui augmente les chances d'avoir des gems fragments/hp/exp gold/coffres a objets) - 3 niv
- Exp bonus (qui augmente le nombre d'exp) - 5 niv
- Malediction (qui permet d'augmenter le spawn rate) - 5 niv
- Revival (qui permet d'avoir une resurection, chaque niv egal un rez) - 2 niv
- Reroll (qui permet d'ajouter un choix de reroll dans les armes/boons dans les selections, chaque niv egal un reroll) - 3 niv
- Skip (qui permet de skipper un choix lors d'un levelup, chaque niveau egal un skip) - 3 niv
- Banish (qui permet de banir un choix, il sera plus propose de la partie, chaque niveau = un banish) - 3 niv

Donc ces stats bonus viendront s'ajouter aux stats du vaisseau selectionne (on detailleras les stats apres). Il peut egalement appuyer sur un bouton de remboursement qui lui rends tous les fragments depenses pour ensuite les reallouer ou il le veut, les upgrades ne sont donc pas definitifs.

## 1B/ Jouer

Quand l'utilisateur clique sur play, il aura le choix du vaisseau et les stats affiches, j'aimerai donc qu'on ajoute + de stats affiches a l'ecran car le vaisseau aura bcp + de bases stats additionnes aux permanents upgrade charactéristiques comme :
- Level : Le niveau du vaisseau que le joueur peut aussi upgrader jusqu'a 9 qui permet d'augmenter sensiblement les stats (ameliorable grace aux fragments), monter de niveau est definitif, on pourra meme integrer une logique de skin par niveau (genre ajouter des teintes aux niveau 3 6 et 9 par exemple, que le joueur debloquera par pallier de niveau et qu'il peut choisir ou non de mettre)
- Vie Max (en valeur brut: exemple 100)
- Regen Vie (exemple : 0.5s)
- Armure (exemple: +1)
- Move Speed (exemple : +10%)
- Puissance d'attaque (valeur en +X%)
- Vitesse (idem)
- Zone (idem)
- Attaque Speed (valeur en -X%)
- Magnet (+x%)
- Revival (+x)
- Luck
- Exp Bonus
- Malediction
- Reroll (par unite)
- Skip (par unite)
- Banish (par unite)

## 1C/ Galaxie

Avant de lancer la partie comme maintenant, j'aimerai ajouter une step "choose galaxy", qui permettra de mettre plusieurs niveaux, pour l'instant on en garde qu'un, et on l'appelera avec un nom de galaxie sympa, y aura une petite description, et l'utilisateur pourra (plus tard) ajouter des contre parties pour un bonus de fragment recoltes (genre si la case Less Time cochee, il aura 7mn au lieu de 10mn par system par exemple mais +30% fragments, etc.) il peut aussi y avoir des bonus de multiplicateur de degats pour ennemis, ou plus de spawn ou meme demain on ajoutera peut etre une vision reduite, pas de minimap etc. on sera inventif, mais garde le en tete on va pas tout de suite integrer les "challenges".

## 2/ En jeu

L'arrivee vortex est trop cool, j'aimerai juste qu'il soit en teinte de violet comme le wormhole pour aligner les styles.

### 2.1/ Vaisseau

Je pense que le controle uniquement au clavier peut poser probleme finalement, le joueur se retrouve souvent a faire des mouvements pas agreables, d'aller a contre sens de l'ennemi puis se retourner, et des fois galerer a viser, ce qui est chiant. Je pense, et meme si demain le jeu serait sur Steam avec jouabilite manette, que ce serait sympa de mettre en avant 2 controles, je m'explique :

WASD/Fleches/ZQSD/Joystick Gauche en deplacement
Curseur Souris / joystick droite en visee

Cela permettrait + de controle et on pourrait rendre le jeu differenciant d'un Megabonk ou Vampire Survivor ou il n'y a pas de visee, la le jeu serait plus dure car le joueur saurait precisement prioriser ses attaques donc on peut l'harceler + facilement.

On pourrait meme ajouter un crosshair subtil a l'ecran pour montrer au joueur ou il vise, sur la souris, la ou est le curseur, sur manette (qu'on implementera plus tard) dans un rayon fixe de la direction.

Ainsi le deplacement serait dans un delire d'acceleration/ralentissement comme si c'etait un vrai vaisseau dans l'espace quoi, avec une inertie, mais la rotation serait fluide et rapide, avec un tilt vaisseau plus ou moins fort en fonction de l'amplitude de la rotation.

### 2.2/ Vaisseau skin

J'aimerai que le vaisseau laisse une trainee de particule (ca peut etre un petit neon avec des petits points qui se fade out) pour ajouter de la beaute au deplacement.

### 2.3/ Univers un peu trop noir

Je sais pas comment, en augmentant les etoiles ou en rendant l'univers moins noir, genre bleu fonce (ou au choix dans chaque galaxie pour creer des univers) mais j'ai le sentiment que ca rend pas le jeu sexy de le rendre sur fond noir, faudrait rendre le jeu + visible, alors ca peut passer par un fond uni plus clair mais tout aussi sombre.

### 2.4/ Ajouter une physique aux ennemis

J'aimerai eviter que les ennemis s'accumulent et que le joueur passe facilement a travers (sauf quand utilisation de l'esquive), donc j'aimerai que si ya masse d'ennemi, qu'ils se "fusionnent" pas visuellement mais qu'ils se collent, ce qui rendrait les confrontations plus strategique (faut pas laisser s'accumuler les vagues).

### 2.5/ Boss plus dur

J'aimerai que le boss ait un skin SpaceshipBoss.glb comme present dans les assets et qu'il soit un sac a PV quand meme (genre 100000 en phase 1, puis multipliees en fonction de l'implementation de l'amelioration des stats ennemis par iteration de systemes). J'aimerai plus qu'il wipe les ennemis de la map, la c'est un boss qui s'ajoute aux vagues existantes.

### 2.6/ Gestion des waves ennemis

J'aimerai que dans la gestion des waves ennemis il y ait une logique de temps dur, temps leger. En gros, le jeu doit etre de + en plus violent au fil du temps pour faire pression au joueur sur sa capacite a gerer une progression rapide face a la difficulte croissante, mais j'aimerai pas que l'augmentation de la difficulte soit lineaire, ca doit etre qqch comme :
- debut facile
- 20% du temps ecoule, vague dure avec bcp de spawn
Et ainsi de suite, et du coup les spawn ennemis seraient plus violent car ennemis de tier superieurs qui arrivent.

### 2.7/ Choix des bonus/boons

J'ai l'impression que les ameliorations sont lineaires, j'aimerai qu'il y ait une certaine hierarchie des ameliorations, je m'explique :
Si j'ai un boon attaque speed: ok tu peux avoir une amelioration commune +10%, mais tu peux avoir ce boon qui apparait mais avec une amelioration rare (+15) ou epique (+20%) ou legendaire (+25%). Avec un code couleur blanc/bleu/violet/dore jaune.

Donc je veux que dans l'HUD les armes et boons soient toujours mono couleur, mais que la couleur soit un systeme de rarete uniquement present dans la selection. Evidemment une arme ou un boon ne doit pas apparaitre 2 fois (genre rare et legendaire) lors d'une selection c'est par exemple si l'arme est montree, c'est aleatoirement (et impacte par la luck) l'une de ses rarete qui est montree.

J'aimerai que tu implemente aussi le systeme de reroll/banish/skip, skip ca enleve la selection comme si l'utilisateur n'avait pas fait de choix, banish, ca bannit une arme/boon de la partie en cours (au global, si c'est bannis au system 1 je dois pas revoir l'arme systeme 2 de la meme party), reroll (relance les choix, une arme/boon peut retomber X fois, ce qui peut arriver souvent en fin de partie quand tous les slots sont pris et que le joueur a monte des armes/boon au niveau max).

### 2.8/ Principe de respawn

Si le joueur meurt et a 1 ou 2 respawn selon ses upgrade/vaisseau etc., alors il peut revive a 50% de vie et 2/3 secondes d'invincibilite en respawnant. Le choix apparait donc avant le game over ou le choix "revive" apparait et sera propose s'il reste au moins un revive en jeu, les revive seraient affiches dans l'interface egalement.

### 2.9/ Minimap

Sympa la minimap mais fait deplacer la minimap avec le vaisseau et zoom un peu pour pas montrer toute la map mais ce qu'il y a aux alentours.

## 3/ HUD

Je trouve l'interface de vie un peu triste, rend la plus en personnalite et rend la jauge de la vie rectangulaire plutot, met le nombre de la vie a GAUCHE de la jauge et dedans "80/100", et pas la peine de rajouter HP on comprend.

### 3.1/ Stats persistantes

J'aimerai que dans la save le jeu garde l'accumulation des stats des parties :
- Nombre d'ennemis tue au global
- Temps survecu au global
- Weapons les + utilises (nombre de partie)
- Pareil pour les boons
- Temps survecu

Et les stats de meilleure partie etc.

Tout cela pour permettre au joueur d'avoir un sentiment de progression, ce serait un item "stats" dans l'ecran d'accueil par exemple.

### 3.2/ Armory

Dans l'ecran d'accueil il pourrait y avoir un ecran Armory qui permet de lister Weapons, Boons, Items (debloques) pour montrer au joueur l'etendu des armes, boons, objets, il aura une description de chacune simple pour expliquer comment ca marche.

### 3.3/ Items (futur)

On integrera les items aussi plus tard dans une autre iteration, mais ce seront des items qui rajouteront des dynamique de gameplay (DOT des ennemis, esquive plus longue, etc.)

### 3.4/ Chrono cumulatif

J'aimerai que le chrono soit cumulatif dans une partie, si le joueur termine le systeme 1 avec 2mn, et qu'il est en partie de 10mn alors il aura 12mn au systeme 2.
