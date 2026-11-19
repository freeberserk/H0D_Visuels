# H0D Visuels

**Bibliothèque visuelle commune pour les modules Foundry VTT de la campagne JDR Horizon Zero Dawn.**

> **Version installable : 0.2.0.** Bibliothèque illustrée, 54 images WebP intégrées au module. Les images ont été importées dans `assets/` et font partie du ZIP Foundry.

## Version 0.2.0 — Galerie et images intégrées

- Nouvelle interface : catégories Machines / Faune / Factions / Équipement, recherche des profils par nom, affichage des clés techniques secondaires, filtrage, vignettes et bouton d'association directe.
- Index de 54 images issues de `Machine.zip` et `faune locale(2).zip` : **29 machines, 13 faune, 12 composants**.
- **28 profils documentés** possèdent une association initiale ; les images non identifiées restent `unassigned` et ne sont jamais attribuées automatiquement.
- Les images de Chien sauvage incluent portrait et token séparés.
- Les chemins `assets/` du catalogue sont relatifs au module `h0d-visuels`, mais les liens `modules/…` et HTTPS de The Forge restent utilisables.
- Les variantes éventuellement enregistrées par le MJ dans un monde restent prioritaires sur celles du registre embarqué : aucune migration automatique.
- **Contrôle de sécurité de la CI** : les tests et la publication échouent si une des 54 images référencées est absente du dépôt.
- Les 54 images sont stockées dans les trois dossiers `assets/machines/`, `assets/faune/` et `assets/components/`, et incluses dans les releases Foundry.
- Aucun droit de redistribution des illustrations provenant de sources tierces n'a été vérifié. Le dépôt est public ; évaluer les droits avant d'y ajouter des fichiers.

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

## Version 0.1.0 — Première version du moteur

Cette version fournit un moteur **fonctionnel sans images embarquées**. Elle peut être installée et activée même si aucune variante n'a encore été renseignée. L'absence de variantes n'empêche pas les builders de créer des profils avec leurs images de secours.

### Installation depuis The Forge / Foundry

Après publication de la première release GitHub, ajouter le module par l'URL de manifeste :

```text
https://github.com/freeberserk/H0D_Visuels/releases/latest/download/module.json
```

Le zip `h0d-visuels.zip` et le manifeste `module.json` doivent tous deux être présents dans les **Assets** de la release. Le nom du dépôt GitHub est exactement **`H0D_Visuels`**, tandis que l'identifiant Foundry est **`h0d-visuels`**.

### Gestion de la bibliothèque dans Foundry

Après installation et activation du module dans un monde, créer une macro Foundry de type **Script** et utiliser :

```js
game.h0dVisuels.open();
```

La fenêtre permet de choisir la catégorie et la clé technique exacte du builder, puis d'ajouter des variantes. Les fichiers peuvent être référencés via des chemins Foundry existants ou des URL HTTPS d'assets The Forge. **Les images ne sont jamais téléversées par cette fenêtre** : elles doivent être déjà accessibles depuis le monde.

Pour ouvrir directement les variantes d'un profil :

```js
game.h0dVisuels.manageVariants("faction", "CLE_TECHNIQUE_REELLE");
```

Pour sélectionner manuellement une variante d'une fiche Actor existante :

```js
game.h0dVisuels.openPicker(game.actors.get("ID_REEL_DE_L_ACTOR"));
```

Le MJ peut marquer une variante **approuvée** pour l'inclure dans les tirages automatiques. La présentation (masculine, féminine ou non renseignée) est saisie explicitement et ne découle jamais du nom de fichier. Les modes masculin/féminin retournent une variante uniquement si la catégorie demandée existe et a été approuvée.

Le mode équilibré peut alterner les variantes annotées masculine/féminine quand les deux catégories existent ; à défaut, il tire dans le groupe de variantes approuvées. Aucun avatar, portrait ou token n'est fourni par défaut.

### API du module

L'API est disponible sous `game.h0dVisuels` et `game.modules.get("h0d-visuels").api`. Fonctions supplémentaires : `open()`, `addVariant(kind,key,record)`, `saveChoices(kind,key,records)`, `getStatus()`.

Les opérations d'administration sont réservées au MJ. Les appels de sélection sont accessibles aux builders. **Aucune fiche n'est modifiée au démarrage** ; le sélecteur manuel n'agit que sur l'Actor choisi, sans changer les tokens déjà placés en scène.

### Raccordements des builders

- **Faction Builder** : intégration déjà présente et facultative.
- **Creature Builder** : PR #6 en brouillon.
- **Machine Builder** : PR #9 en brouillon.
- **Equipment Builder** : PR #5 en brouillon.

Ces trois PR seront testées puis publiées séparément après validation du module Visuels sur le monde BAC-à-SABLES.

## Limites connues

- Aucune image fournie dans le dépôt initial ; l'utilisateur doit fournir des chemins ou URL accessibles.
- Les fichiers visuels présents dans `h0d-faction-builder/assets/conseil/` restent là où ils sont. Ils ne sont pas copiés automatiquement.
- Le choix équilibré exploite les fiches déjà créées et un compteur de session ; aucun historique global des sélections non enregistrées n'est reconstitué.
- Le nom d'une variante doit être identifié par une clé stable ; aucune correspondance automatique par simple nom de PNJ.
- Les références d'images sont saisies par URL ou chemin ; le module n'intègre pas encore un téléverseur de fichiers.

---

*Module indépendant de la campagne JDR Horizon Zero Dawn.*
