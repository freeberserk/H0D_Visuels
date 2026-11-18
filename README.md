# H0D Visuels

**Bibliothèque visuelle commune pour les modules Foundry VTT de la campagne JDR Horizon Zero Dawn.**

> **Statut : en développement.** Ce dépôt est destiné à accueillir le module `h0d-visuels`. Le README décrit la cible fonctionnelle et les interfaces attendues ; il ne signifie pas que le module est déjà opérationnel ou publié.

## Objectif

Centraliser l'association entre les références des différents builders H0D et leurs **portraits, illustrations et images de tokens**, sans dupliquer la logique d'attribution dans chaque builder.

H0D Visuels est conçu comme un **module indépendant et facultatif**, compatible avec **Foundry VTT v14**. L'absence du module ne doit pas empêcher le fonctionnement des builders.

## Intégrations

| Builder | Usage attendu | État du raccordement |
| --- | --- | --- |
| [H0D Faction Builder](https://github.com/freeberserk/h0d-faction-builder) | Portraits et tokens des PNJ de faction, variantes par archétype | Appels à `game.h0dVisuels` présents dans le code |
| [H0D Creature Builder](https://github.com/freeberserk/h0d-creature-builder) | Portraits et tokens de la faune | [PR #6 en brouillon](https://github.com/freeberserk/h0d-creature-builder/pull/6) |
| [H0D Machine Builder](https://github.com/freeberserk/h0d-machine-builder) | Portraits et tokens des machines ; tailles conservées par le builder | [PR #9 en brouillon](https://github.com/freeberserk/h0d-machine-builder/pull/9) |
| [H0D Equipment Builder](https://github.com/freeberserk/h0d-equipment-builder) | Illustrations des objets et ressources créés | [PR #5 en brouillon](https://github.com/freeberserk/h0d-equipment-builder/pull/5) |

Les Pull Requests ci-dessus ne doivent pas être considérées comme publiées tant qu'elles n'ont pas été fusionnées et testées.

## Fonctionnalités visées

- Registre de variantes visuelles par **catégorie** (`faction`, `creature`, `machine`, `equipment`) et par **clé technique stable** du profil ou de l'objet.
- Portrait et token stockés comme deux références distinctes lorsque les deux images existent.
- Attribution à la création : mode aléatoire, variante manuelle ou répartition équilibrée lorsque des annotations appropriées sont disponibles.
- Annotations explicites du MJ : présentation `masculin`, `feminin` ou `non_renseigne`, et validation de l'utilisation en tirage automatique.
- Sélecteur manuel permettant au MJ de choisir ou remplacer l'illustration d'une fiche ciblée.
- Conservation des chemins et références d'images ; pas de déduction automatique d'une présentation depuis le nom de fichier ou l'apparence.
- Fonctionnement inchangé des builders lorsque le module ou une variante est absent.

## Contrat d'API attendu

Faction Builder utilise déjà l'API facultative `game.h0dVisuels` avec les méthodes suivantes. Le futur module doit respecter leurs signatures et les formats de retour attendus par les consommateurs :

| Méthode | Rôle |
| --- | --- |
| `getChoices(kind, key)` | Obtenir les variantes associées à une catégorie et une référence |
| `pickForBuilder({ kind, key, mode, variantId })` | Sélectionner une variante pour une nouvelle création ; renvoyer `null` lorsqu'aucune n'est applicable |
| `visualUrl(path)` | Fournir une URL exploitable par Foundry à partir d'une référence d'image |
| `manageVariants(kind, key)` | Ouvrir l'interface MJ de qualification et validation des variantes |
| `openPicker(actor)` | Ouvrir le sélecteur manuel pour un Actor existant |

Une variante sélectionnée doit au minimum permettre de retrouver son **identifiant stable**, son **portrait** et son **token** lorsqu'ils sont définis.

Le choix automatique ne doit jamais remplacer les images de fiches existantes lors du chargement du monde ou d'une mise à jour de module.

## Gestion des images

Ce dépôt démarre **sans bibliothèque d'images reconstituée**. Les fichiers devront être ajoutés explicitement, ou référencés depuis un emplacement réellement accessible au monde Foundry (module installé, bibliothèque d'assets de The Forge, etc.).

Le dépôt H0D Faction Builder contient déjà neuf portraits et neuf tokens du Conseil de la Dent d'Ambre dans `assets/conseil/`. Ces fichiers restent à leur emplacement actuel tant qu'une stratégie de centralisation n'a pas été décidée.

La mise à disposition publique d'illustrations doit respecter les droits d'utilisation et de redistribution de chaque fichier.

## Principes de sécurité

1. **Aucune migration automatique** des images, portraits, tokens ou inventaires déjà présents.
2. **Aucune modification des caractéristiques** de jeu par un choix de variante graphique.
3. Les **dimensions des tokens** restent définies par les builders concernés.
4. Les variantes sont associées à des **clés techniques**, pas uniquement à des noms affichés susceptibles d'évoluer.
5. Une image absente ou invalide ne doit pas empêcher la génération du profil : le builder doit conserver son comportement de secours.
6. Toute opération manuelle sur une fiche existante doit être déclenchée explicitement par le MJ.

## Étapes de développement

- [ ] Créer le manifeste `module.json` et l'entrée JavaScript du module Foundry v14.
- [ ] Implémenter le registre de variantes et les cinq méthodes de l'API attendue.
- [ ] Ajouter les réglages Foundry nécessaires aux annotations et aux choix MJ.
- [ ] Créer l'interface de sélection et de validation des variantes.
- [ ] Ajouter des tests JavaScript : absence de module, sélection aléatoire, sélection manuelle, mode équilibré et préservation des images existantes.
- [ ] Préparer une archive de distribution et une release GitHub installable dans The Forge.
- [ ] Tester H0D Visuels avec Faction Builder dans un monde **BAC-à-SABLES**.
- [ ] Vérifier puis fusionner les raccordements des autres builders, un par un.

## Installation

**Pas encore disponible.** Une procédure d'installation avec lien direct vers le manifeste Foundry sera documentée après la première release testée.

---

*Projet de module pour la campagne JDR Horizon Zero Dawn — système et outils Foundry VTT personnalisés.*
