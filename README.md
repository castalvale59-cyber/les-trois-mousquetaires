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
