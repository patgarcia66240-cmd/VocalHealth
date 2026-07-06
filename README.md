# VocalHealth

**VocalHealth** est une application de suivi santé pensée pour noter, suivre et analyser simplement ses mesures de tension, pouls et saturation.  
L'objectif est clair : rendre le suivi quotidien plus rapide, plus lisible et plus accessible, avec une saisie vocale guidée et un tableau de bord médical sobre.

<img width="1274" height="668" alt="image" src="https://github.com/user-attachments/assets/87b2557b-4210-4c4c-98ef-bdbe423b6c63" />

## Ce que fait l'app

- Saisie vocale guidée en français pour tension, pouls et commentaires.
- Mode libre pour dicter une mesure complète en une seule phrase.
- Analyse IA des transcriptions avec Gemini, OpenAI, Mistral ou Qwen.
- Saisie manuelle des mesures.
- Import de mesures depuis une image via analyse IA.
- Historique complet avec recherche, filtres, import/export CSV et édition inline.
- Tableau de bord avec graphiques, statistiques et tendances.
- Profil patient avec âge, coordonnées et sélection multi-patient locale.
- Alertes médicales configurables selon les seuils tension, pouls et SpO2.
- Thème clair/sombre.
- Stockage local actuel avec préparation pour une base Turso online.

## Stack

- **Frontend** : React 19, Vite, TypeScript
- **UI** : Tailwind CSS, lucide-react, motion
- **Charts** : Recharts
- **Backend local** : Express + tsx
- **IA** : Gemini, OpenAI, Mistral, Qwen
- **Stockage actuel** : IndexedDB + localStorage
- **Stockage prévu** : Turso/libSQL, SQLite online

## Lancer le projet

### Prérequis

- Node.js
- npm
- Une clé API IA au choix, au minimum `GEMINI_API_KEY` pour utiliser Gemini

### Installation

```powershell
npm install
```

### Configuration

Crée un fichier `.env.local` à partir de `.env.example` :

```powershell
Copy-Item .env.example .env.local
```

Renseigne au moins :

```env
GEMINI_API_KEY="..."
APP_URL="http://localhost:3000"
```

Les autres providers sont optionnels :

```env
OPENAI_API_KEY=""
MISTRAL_API_KEY=""
QWEN_API_KEY=""
```

Les variables Turso sont déjà prévues, mais peuvent rester vides tant que la migration cloud n'est pas active :

```env
TURSO_DATABASE_URL=""
TURSO_AUTH_TOKEN=""
```

`.env.local` ne doit pas être committé. Il est protégé par `.gitignore`.

### Développement

```powershell
npm run dev
```

Puis ouvre :

```text
http://localhost:3000
```

### Vérification TypeScript

```powershell
npm run lint
```

### Build

```powershell
npm run build
```

### Démarrage production

```powershell
npm start
```

## Architecture actuelle

```text
src/
  components/          UI et vues principales
  hooks/               état applicatif, voix, thème, records, flow guidé
  services/            parsing, API IA, patients, speech helpers
  db.ts                IndexedDB local
  storage.ts           localStorage centralisé
  types.ts             types partagés côté frontend

server/
  db/
    turso.ts           client Turso prêt pour plus tard
    schema.sql         schéma SQLite online

docs/
  turso-migration-plan.md
  turso-route-contract.md
```

## Stockage

Aujourd'hui :

- `IndexedDB` stocke les mesures.
- `localStorage` stocke profil patient, liste patients, réglages médicaux, thème et providers IA.

Prévu ensuite :

- Turso stockera `patients`, `measurement_records` et `medical_settings`.
- Le frontend passera par des routes Express.
- IndexedDB pourra rester comme cache/offline fallback.

## Schéma Turso prévu

```text
patients
  id
  prenom
  nom
  adresse
  cp
  ville
  tel
  date_naissance

measurement_records
  id
  patient_id
  timestamp
  systolic
  diastolic
  pulse
  spo2
  remarks

medical_settings
  id
  patient_id
  systolic_high
  diastolic_high
  systolic_low
  diastolic_low
  pulse_high
  pulse_low
  spo2_enabled
  spo2_low
```

Le détail opérationnel est dans [docs/turso-migration-plan.md](docs/turso-migration-plan.md).

## Endpoints disponibles

```text
GET  /api/health
GET  /api/db/status
POST /api/parse-measurements
POST /api/parse-measurements-image
```

`/api/db/status` permet de vérifier si Turso est configuré :

```json
{ "configured": false, "status": "not_configured" }
```

ou :

```json
{ "configured": true, "status": "ok" }
```

## Roadmap

- Ajouter les routes Turso patients, records et settings.
- Ajouter une action de synchronisation locale vers cloud.
- Migrer les lectures depuis IndexedDB vers Turso.
- Garder IndexedDB comme cache local.
- Ajouter une authentification si l'app sort du cadre personnel/local.
- Ajouter des tests ciblés sur parsing vocal, import CSV et migration.

## Note santé

VocalHealth est un outil de suivi personnel. Il ne remplace pas un avis médical, un diagnostic ou une prise en charge par un professionnel de santé. En cas de symptôme inquiétant ou de mesure anormale persistante, contacte un professionnel.
