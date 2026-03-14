# Compliara

> Plateforme SaaS de gestion et publication des déclarations d'accessibilité RGAA.

Compliara permet aux entreprises de créer, importer, gérer et publier leurs déclarations d'accessibilité conformément au **RGAA 4.1.x** (Référentiel Général d'Amélioration de l'Accessibilité), pour plusieurs services (sites web, applications) au sein d'une même organisation.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Angular 20 (standalone) + PrimeNG 20 |
| Backend | NestJS 11 + TypeScript |
| ORM | Prisma 5 |
| Base de données | PostgreSQL 16 |
| Auth | JWT (passport-jwt) + bcrypt |
| Conteneurisation | Docker + Docker Compose |

---

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Node.js 22+ (développement local uniquement)

---

## Démarrage rapide (Docker)

### 1. Cloner et configurer l'environnement

```bash
git clone <repo>
cd compliara
cp .env.example .env
# Éditer .env si nécessaire
```

### 2. Lancer la stack complète

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend Angular | http://localhost:4200 |
| API NestJS | http://localhost:3000/api/v1 |
| PostgreSQL | localhost:5432 |

### 3. Initialiser les données de démo (optionnel)

```bash
docker-compose --profile seed run seed
```

Crée un tenant de démo avec un compte admin :

| Champ | Valeur |
|---|---|
| Email | `admin@compliara.fr` |
| Mot de passe | `Admin1234!` |

---

## Variables d'environnement

Fichier `.env` à la racine du projet :

```env
# PostgreSQL
POSTGRES_USER=compliara
POSTGRES_PASSWORD=compliara_secret
POSTGRES_DB=compliara_db

# Backend
DATABASE_URL=postgresql://compliara:compliara_secret@postgres:5432/compliara_db
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=7d
PORT=3000
FRONTEND_URL=http://localhost:4200
```

> **Important** : Remplacer `JWT_SECRET` et `POSTGRES_PASSWORD` en production.

---

## Structure du projet

```
compliara/
├── backend/                  # API NestJS
│   ├── src/
│   │   ├── auth/             # Authentification JWT
│   │   ├── declarations/     # Gestion des déclarations RGAA
│   │   │   └── import/       # Parser Excel RGAA
│   │   ├── services/         # Gestion des services (sites)
│   │   ├── tenants/          # Gestion des tenants
│   │   ├── users/            # Gestion des utilisateurs
│   │   ├── public/           # Page publique (sans auth)
│   │   └── prisma/           # Service Prisma global
│   ├── prisma/
│   │   └── schema.prisma     # Modèle de données
│   └── Dockerfile
├── frontend/                 # Application Angular
│   ├── src/app/
│   │   ├── core/             # Services, guards, intercepteurs, layout
│   │   ├── features/         # Pages fonctionnelles
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── services/
│   │   │   ├── declarations/
│   │   │   └── planning/
│   │   └── public/           # Vue publique des déclarations
│   └── Dockerfile
├── docker-compose.yml
├── .env
└── .env.example
```

---

## API — Endpoints

Base URL : `http://localhost:3000/api/v1`

### Authentification

```
POST /auth/register     Inscription (crée tenant + admin)
POST /auth/login        Connexion → JWT
GET  /auth/me           Profil utilisateur connecté
```

### Services

```
GET    /services          Lister les services du tenant
POST   /services          Créer un service
GET    /services/:id      Détail d'un service
PUT    /services/:id      Modifier un service
DELETE /services/:id      Supprimer un service
```

### Déclarations

```
GET  /declarations              Lister les déclarations (filtrable par ?serviceId=)
GET  /declarations/stats        Statistiques du tenant
GET  /declarations/:id          Détail complet (critères + pages)
POST /declarations              Créer manuellement
PUT  /declarations/:id          Modifier (statut, contact, dates)
POST /declarations/import       Importer depuis Excel (multipart, max 10 Mo)
```

### Public

```
GET /public/:token      Déclaration publique (sans authentification)
```

Tous les endpoints (sauf `/auth/*` et `/public/*`) nécessitent l'en-tête :
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Format d'import Excel

Le parser supporte la **grille Capgemini RGAA 4.1.x** (.xlsx, .xls, .ods) :

| Onglet | Contenu |
|---|---|
| `Echantillon` | Métadonnées + liste des pages auditées |
| `P01`, `P02`… | Résultats par critère pour chaque page |

Colonnes des onglets `Pxx` : `Thématique | Réf | Niveau | Intitulé | Statut (C/NC/NA) | Dérogation | Problèmes | Commentaires`

---

## Multi-tenancy

Chaque organisation possède son propre **tenant** (créé à l'inscription). Toutes les données (services, déclarations, actions correctives) sont isolées par `tenantId`.

---

## Développement local (sans Docker)

### Backend

```bash
cd backend
npm install
# Configurer DATABASE_URL dans .env
npx prisma generate
npx prisma db push
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## Modèle de données simplifié

```
Tenant (1) ──── (N) User
Tenant (1) ──── (N) Service
Tenant (1) ──── (N) Declaration
Declaration (1) ──── (N) AuditedPage
Declaration (1) ──── (N) CriterionResult
CriterionResult (N) ──── (N) AuditedPage
CriterionResult (1) ──── (0..1) CorrectiveAction
```

---

## Contribution & workflow Git

Le projet suit un workflow basé sur des branches `feat/*` et `fix/*` mergées dans `develop` puis `main`.

Voir [docs/git-workflow.md](docs/git-workflow.md) pour le détail complet : nommage des branches, convention de commits, process de release, commandes utiles.

---

## Licence

Copyright (c) 2026 Compliara. Tous droits réservés.

Ce logiciel est propriétaire. Toute reproduction, distribution ou utilisation sans autorisation écrite préalable est strictement interdite. Voir le fichier [LICENSE](LICENSE).
