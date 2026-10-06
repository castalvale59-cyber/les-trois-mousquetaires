# Les Trois Mousquetaires

Un jeu de tir en 3D, vu à la première personne, dans le navigateur.
Défends la cour du château contre les vagues de gardes du Cardinal, armé de ton mousquet et de ta baïonnette.

## Lancer le jeu

Le jeu doit être servi par un petit serveur web (il charge Three.js en module).
En ligne, il suffit d'ouvrir le site déployé sur Vercel.

## Commandes

- **Souris** : viser
- **Clic gauche** : tirer au mousquet (rechargement d'environ une seconde)
- **Clic droit** ou **F** : coup de baïonnette
- **B** : lancer une grenade (3 au départ, 2 de plus à chaque vague repoussée)
- **ZQSD** / **WASD** ou **flèches** : se déplacer
- **Maj** : courir · **Espace** : sauter
- **Échap** : pause

## Le jeu

- Chaque vague amène plus de gardes. Dès la vague 2 arrivent des tireurs, qui restent à distance.
- Toutes les 5 vagues, un capitaine en noir et or, plus robuste.
- Un tir à la tête met n'importe quel garde à terre et rapporte un bonus.
- Les grenades creusent des cratères dans le sol (on tombe dedans) et percent les remparts : les pierres qui n'ont plus rien en dessous tombent. Par une brèche, on peut sortir du château.
- Les caisses, tonneaux, bottes de foin et portes volent en éclats. Les tours, piliers et la fontaine résistent.
- Le bouton ☀️ / 🌙 fait passer de la nuit au jour.

Le record est gardé dans le navigateur. Le jeu se joue sur ordinateur (clavier + souris).

## Morpion

Page `morpion.html` (lien « Morpion » dans le menu du site).

- Contre l'ordi ou à deux sur le même écran
- Clic sur une case, ou touches **1 à 9** (disposition du pavé numérique)
- Le perdant commence la partie suivante

## Bataille royale

Page `bataille.html` : 16 mousquetaires sur une grande carte, le dernier debout gagne.

- **ZQSD / WASD** ou **flèches** : se déplacer
- **Souris** : viser, **clic gauche** : tirer
- **Clic droit** ou **E** : construire un mur (10 bois)
- **P** : pause
- Ouvre les coffres 📦 pour trouver munitions, bois, vie et bouclier
- Reste dans le cercle : la tempête 🌀 se referme et fait des dégâts
- Sur mobile : garde le doigt sur le plateau pour avancer, le tir est automatique

## Mini-golf

Page `golf.html` (lien « Mini-golf » dans le menu du site), à la façon de Plato.

- Contre l'ordi ou à deux sur le même écran, chacun son tour
- Glisse en arrière depuis n'importe où sur le terrain puis relâche : plus tu tires loin, plus c'est fort (souris ou doigt)
- 20 trous dans 6 mondes (prairie, désert, neige, volcan, bonbon, nuit) : eau et lave, sable, glace, bumpers, moulins, tapis accélérateurs, téléporteurs
- Parcours de 10 trous (1 à 10 ou 11 à 20) ou les 20 d'affilée
- Les boîtes **?** donnent des atouts (3 au maximum) à utiliser avant de tirer :
  - 🔄 Inversion : les commandes de l'adversaire sont inversées à son prochain coup
  - 🟤 Boue : une flaque de boue sur le chemin de sa balle, qui la freine
  - 💨 Rafale : un coup de vent pendant son prochain tir
  - 🪶 Bras mou : son prochain coup est deux fois moins fort
  - 🔀 Échange : tu échanges ta balle avec la sienne
  - 🧲 Aimant : ton prochain coup est attiré par le trou
