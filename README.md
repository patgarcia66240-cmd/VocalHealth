# VocalHealth

**VocalHealth** est une application de suivi santé pour noter, suivre et analyser ses mesures de tension, pouls et saturation.  
Elle privilégie une expérience locale, rapide et rassurante, avec une saisie vocale guidée en français et un tableau de bord clair.

<img width="1274" height="668" alt="VocalHealth dashboard preview" src="https://github.com/user-attachments/assets/87b2557b-4210-4c4c-98ef-bdbe423b6c63" />

## Fonctionnalités
- Saisie vocale guidée en français pour tension, pouls et commentaires.
- Mode libre pour dicter une mesure complète en une seule phrase.
- Analyse IA des transcriptions avec Gemini, OpenAI, Mistral ou Qwen.
- Saisie manuelle des mesures.
- Import de mesures depuis une image via analyse IA.
- Historique avec recherche, filtres, import/export CSV et édition inline.
- Tableau de bord avec graphiques, statistiques et tendances.
- Profils patients multi-utilisateurs.
- Chargement des mesures par patient sélectionné.
- Alertes médicales configurables pour tension, pouls et SpO2.
- Thème clair/sombre.
- Stockage local IndexedDB par défaut.
- Code Turso déjà préparé pour une future version cloud.

## Stack

- **Frontend** : React 19, Vite, TypeScript
- **UI** : Tailwind CSS, lucide-react, motion
- **Charts** : Recharts
- **Backend** : Express + tsx
- **IA** : Gemini, OpenAI, Mistral, Qwen
- **Stockage local** : IndexedDB + localStorage pour quelques préférences UI
- **Stockage cloud préparé** : Turso/libSQL

## Installation

### Prérequis

- Node.js
- npm
- Une clé API IA, au minimum `GEMINI_API_KEY`

### Installer les dépendances

```powershell
npm install
```

### Configurer l'environnement

Crée `.env.local` depuis `.env.example` :

```powershell
Copy-Item .env.example .env.local
```

Configuration minimale :

```env
APP_URL="http://localhost:3000"
GEMINI_API_KEY="..."
APP_STORAGE_MODE="local"
VITE_STORAGE_MODE="local"
```

Providers IA optionnels :

```env
OPENAI_API_KEY=""
MISTRAL_API_KEY=""
QWEN_API_KEY=""
```

Préparation Turso optionnelle, inactive en mode local :

```env
TURSO_DATABASE_URL=""
TURSO_AUTH_TOKEN=""
```

`.env.local` ne doit pas être committé. Le repo ignore déjà `.env*` sauf `.env.example`.

## Lancer l'app

```powershell
npm run dev
```

Puis ouvre :

```text
http://localhost:3000
```

## Scripts

```powershell
npm run dev      # serveur Express + Vite
npm run lint     # vérification TypeScript
npm run build    # build frontend + serveur
npm start        # démarrage du build serveur
```

## Modes De Stockage

Le mode local est le comportement par défaut.

```env
APP_STORAGE_MODE="local"
VITE_STORAGE_MODE="local"
```

En local :

- `IndexedDB` stocke les mesures.
- `IndexedDB` stocke les patients.
- `IndexedDB` stocke le patient sélectionné dans `app_state`.
- `localStorage` reste réservé aux préférences légères comme thème et providers.

Le mode Turso est prêt côté serveur, mais il n'est pas activé par défaut :

```env
APP_STORAGE_MODE="turso"
VITE_STORAGE_MODE="turso"
TURSO_DATABASE_URL="libsql://..."
TURSO_AUTH_TOKEN="..."
```

En mode Turso :

- les routes `/api/cloud/*` deviennent disponibles ;
- les credentials restent côté serveur ;
- le frontend devra être branché sur ces routes lors d'une prochaine étape.

## Architecture

```text
src/
  components/          UI et vues principales
  hooks/               état applicatif, voix, thème, records, patients
  services/            parsing, API IA, patients, speech helpers
  config/              configuration frontend
  db.ts                IndexedDB local
  storage.ts           localStorage pour préférences UI
  types.ts             types partagés côté frontend

server/
  config/              mode de stockage serveur
  db/                  Turso client + schéma SQL
  repositories/        accès Turso
  routes/              routes cloud Turso

docs/
  turso-migration-plan.md
  turso-route-contract.md
```

## IndexedDB Local

Base :

```text
VocalTensionDB
```

Stores :

```text
records     # mesures tension/pouls/SpO2/commentaires
patients    # profils patients
app_state   # état applicatif, dont selected_patient_id
```

Les nouvelles mesures sont rattachées au patient sélectionné via `patientId`.

## Turso Préparé

Schéma SQL :

```text
server/db/schema.sql
```

Tables prévues :

```text
patients
measurement_records
medical_settings
```

Routes déjà préparées :

```text
GET    /api/cloud/patients
POST   /api/cloud/patients
PUT    /api/cloud/patients/:id
DELETE /api/cloud/patients/:id

GET    /api/cloud/records?patientId=...
POST   /api/cloud/records
PUT    /api/cloud/records/:id
DELETE /api/cloud/records/:id

GET    /api/cloud/medical-settings?patientId=...
PUT    /api/cloud/medical-settings/:patientId
```

En mode `local`, ces routes répondent volontairement `409 Cloud storage is disabled`.

## Endpoints Actuels

```text
GET  /api/health
GET  /api/db/status
POST /api/parse-measurements
POST /api/parse-measurements-image
```

Exemple `/api/db/status` en local :

```json
{ "mode": "local", "configured": false, "status": "local" }
```

Exemple en Turso configuré :

```json
{ "mode": "turso", "configured": true, "status": "ok" }
```

## Documentation Migration

- [Plan de migration Turso](docs/turso-migration-plan.md)
- [Contrat API Turso](docs/turso-route-contract.md)

## Roadmap

- Ajouter un bouton de synchronisation locale vers Turso.
- Brancher le frontend sur `/api/cloud/*` quand `VITE_STORAGE_MODE=turso`.
- Garder IndexedDB comme cache local/offline.
- Ajouter une authentification avant usage multi-utilisateur réel.
- Ajouter des tests sur parsing vocal, import CSV, patients et migration.

## Note Santé

VocalHealth est un outil de suivi personnel. Il ne remplace pas un avis médical, un diagnostic ou une prise en charge par un professionnel de santé. En cas de symptôme inquiétant ou de mesure anormale persistante, contacte un professionnel.

