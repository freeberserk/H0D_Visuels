# Journal des versions

## 0.2.0 — Préparation (non publiée)

- Interface galerie illustrée, recherche, catégories et association aux profils.
- 54 références d'images préparées, 28 correspondances de profils, 26 images à classer.
- Le workflow empêche toute publication si les images attendues sont absentes.

## 0.1.0 — Premier module installable (Foundry VTT v14)

- Bibliothèque commune pour Faction, Creature, Machine et Equipment Builders.
- Contrat API `game.h0dVisuels` : `getChoices`, `pickForBuilder`, `visualUrl`, `manageVariants`, `openPicker`.
- Ajout, qualification et approbation explicites des variantes par le MJ ; registre stocké dans les réglages du monde.
- Tirage aléatoire, sélection manuelle, modes masculin/féminin annotés et équilibrage des apparences lorsque les deux catégories existent.
- Interface MJ pour l'ajout de chemins de portraits et tokens, ainsi qu'un sélecteur pour les fiches de personnages déjà créées.
- Aucun portrait, token ou fichier privé intégré à cette première version.
- Aucune migration automatique des fiches ou tokens présents dans les scènes.
