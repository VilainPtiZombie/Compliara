# Git Workflow — Compliara

## Modèle de branches

```
main ─────────────────────────────────────────── production stable
  └── develop ──────────────────────────────────── intégration
        ├── feat/services-crud ──────── merge → develop
        ├── feat/planning-kanban ────── merge → develop
        └── fix/file-type-validator ─── merge → develop
```

| Branche | Rôle | Protégée |
|---|---|---|
| `main` | Code en production, releases stables | Oui — merge uniquement |
| `develop` | Intégration des features avant release | Recommandé |
| `feat/*` | Nouvelles fonctionnalités | Non |
| `fix/*` | Corrections de bugs | Non |
| `hotfix/*` | Correctif urgent directement sur main | Non |

---

## Nommage des branches

```
feat/<sujet-court>         feat/planning-kanban
fix/<sujet-court>          fix/validation-pipe-dto
hotfix/<sujet-court>       hotfix/login-500-error
docs/<sujet-court>         docs/api-swagger
refactor/<sujet-court>     refactor/excel-parser
```

Règles :
- Tout en **minuscules**
- Séparateur **tiret** (`-`), pas d'underscore
- Court et descriptif (3-5 mots max)

---

## Convention de commits

Format : `<type>(<scope optionnel>): <description courte>`

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation uniquement |
| `refactor` | Refactoring sans changement fonctionnel |
| `chore` | Maintenance (deps, config, CI) |
| `test` | Ajout ou modification de tests |
| `style` | Formatage, CSS (sans impact fonctionnel) |

**Exemples :**
```
feat(declarations): ajout du formulaire guidé de création
feat(services): CRUD complet avec dialog d'édition
fix(import): correction FileTypeValidator pour fichiers xlsx
fix(auth): correction header Authorization manquant
docs: mise à jour README et workflow git
chore: mise à jour dépendances PrimeNG 20.4
refactor(parser): extraction logique agrégation statuts
```

---

## Workflow — Nouvelle fonctionnalité

```bash
# 1. Mettre à jour develop
git checkout develop
git pull origin develop

# 2. Créer la branche feature
git checkout -b feat/nom-de-la-feature

# 3. Développer + commiter régulièrement
git add .
git commit -m "feat(scope): description"

# 4. Pousser la branche
git push -u origin feat/nom-de-la-feature

# 5. Créer une Pull Request sur GitHub : feat/xxx → develop
#    (via l'interface GitHub)

# 6. Après merge, nettoyer
git checkout develop
git pull origin develop
git branch -d feat/nom-de-la-feature
```

---

## Workflow — Correction de bug

```bash
# 1. Partir de develop (bug non critique)
git checkout develop
git pull origin develop
git checkout -b fix/description-du-bug

# Développer le fix + commiter
git commit -m "fix(scope): description du correctif"
git push -u origin fix/description-du-bug

# Pull Request : fix/xxx → develop
```

---

## Workflow — Hotfix (bug critique en production)

```bash
# 1. Partir de main directement
git checkout main
git pull origin main
git checkout -b hotfix/description-urgente

# Corriger + commiter
git commit -m "fix: correction urgente XYZ"
git push -u origin hotfix/description-urgente

# 2. Pull Request : hotfix/xxx → main
# 3. Après merge sur main, reporter aussi sur develop
git checkout develop
git merge main
git push origin develop
```

---

## Release — Merger develop dans main

```bash
# 1. S'assurer que develop est stable et à jour
git checkout develop
git pull origin develop

# 2. Créer la Pull Request : develop → main
#    (via l'interface GitHub — permet une review)

# 3. Après merge, taguer la release
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0 — Services CRUD + Import Excel + Déclarations"
git push origin v1.0.0
```

### Convention de versioning (SemVer)

```
v<MAJOR>.<MINOR>.<PATCH>

MAJOR : changement incompatible (refonte, breaking change)
MINOR : nouvelle fonctionnalité rétrocompatible
PATCH : correction de bug
```

Exemples : `v1.0.0`, `v1.1.0`, `v1.1.1`

---

## État actuel des branches

| Branche | Contenu | Statut |
|---|---|---|
| `main` | Initial commit — Auth + Services + Import + Déclarations | ✅ Stable |
| `develop` | Identique à main au démarrage | ✅ Base |

### Prochaines branches à créer

```bash
feat/planning-kanban          # Actions correctives + tableau Kanban
feat/public-declaration-page  # Page publique (3 modes de publication)
feat/dashboard-charts         # Graphiques conformité
feat/export-pdf               # Export PDF déclaration
fix/criteria-title-display    # Affichage titre critère dans détail
```

---

## Commandes utiles

```bash
# Voir toutes les branches (locales + distantes)
git branch -a

# Supprimer une branche locale après merge
git branch -d feat/ma-feature

# Supprimer une branche distante après merge
git push origin --delete feat/ma-feature

# Voir le graphe des branches
git log --oneline --graph --all

# Annuler le dernier commit (garder les changements)
git reset --soft HEAD~1

# Voir les différences entre deux branches
git diff develop..feat/ma-feature
```

---

## Checklist avant chaque Pull Request

- [ ] Le code compile sans erreur
- [ ] Pas de `console.log` oublié
- [ ] Les variables d'environnement sensibles ne sont pas committées
- [ ] Le `.env` n'est pas dans le commit (vérifié par `.gitignore`)
- [ ] Le message de commit suit la convention
- [ ] La branche est à jour avec `develop` (pas de conflits)
