# 👑 Idle Kings

Un idle game par navigateur dans un Moyen Âge réaliste (sans magie ni créatures fantastiques). Tu fais progresser des métiers, ton domaine produit des ressources même quand tu n'es pas là.

## Lancer le jeu

```bash
npm install
npm run dev     # serveur de dev sur http://localhost:5173
npm test        # tests du moteur et de la sauvegarde
npm run build   # build de production dans dist/
```

Chaque push sur `main` est testé, construit et publié sur GitHub Pages (`.github/workflows/deploy.yml`).

## Architecture

| Dossier | Rôle |
| --- | --- |
| `src/game/data.ts` | Contenu statique : métiers, actions, objets |
| `src/game/engine.ts` | Moteur pur : `advance(state, dtMs)` fait avancer la simulation, plafond hors ligne de 12 h |
| `src/game/save.ts` | Sauvegarde localStorage, export/import en texte, migration par numéro de version |
| `src/game/store.ts` | Boucle à 100 ms, sauvegarde auto toutes les 10 s et à la fermeture de l'onglet |
| `src/ui/` | Composants React |

Le moteur ne dépend ni du navigateur ni de React, ce qui permet de le tester et de calculer la progression hors ligne avec le même code.

### Ajouter une évolution du format de sauvegarde

Incrémenter `SAVE_VERSION` dans `src/game/state.ts`, puis ajouter l'étape de conversion dans `migrate()` (`src/game/save.ts`).

## Feuille de route

1. ✅ Fondations : boucle de jeu, sauvegarde, progression hors ligne
2. ✅ Métiers de récolte : bûcheronnage, minage, pêche
3. Métiers de fabrication : forge, menuiserie, cuisine, boutique
4. Combat réaliste : bandits, loups, soldats
