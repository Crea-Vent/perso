# Mon budget

Site personnel de gestion financière : budget mensuel/annuel, abonnements, investissements, épargne, catégories et revenus à venir.

- **Frontend** : React + Vite + TypeScript + Tailwind CSS, hébergé sur GitHub Pages.
- **Données & auth** : Firebase (Firestore + Authentication), un seul compte utilisateur.

## Mise en route

### 1. Créer le projet Firebase

1. Va sur [console.firebase.google.com](https://console.firebase.google.com) et crée un nouveau projet (gratuit, plan Spark).
2. Dans **Authentication → Sign-in method**, active le fournisseur **Email/Password**.
3. Dans **Authentication → Users**, ajoute manuellement ton compte (email + mot de passe). Il n'y a pas de page d'inscription publique sur le site — c'est volontaire, pour que personne d'autre ne puisse créer de compte.
4. Dans **Firestore Database**, crée une base (mode production).
5. Déploie les règles de sécurité du fichier [`firestore.rules`](./firestore.rules) : elles limitent chaque utilisateur à ses propres données (`users/{uid}/...`). Tu peux les coller directement dans l'onglet **Règles** de la console Firestore.
6. Dans **Paramètres du projet → Général**, ajoute une application Web et récupère les valeurs de config (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

### 2. Configurer les secrets GitHub (pour le déploiement)

Dans le repo GitHub : **Settings → Secrets and variables → Actions → New repository secret**, ajoute les 6 secrets suivants avec les valeurs récupérées à l'étape précédente :

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### 3. Activer GitHub Pages

**Settings → Pages → Source** → sélectionner **GitHub Actions**.

Une fois les secrets configurés, chaque push sur `main` build et déploie automatiquement le site via `.github/workflows/deploy.yml`. Le site sera accessible à `https://crea-vent.github.io/perso/`.

### 4. Développement local

```bash
cp .env.example .env.local
# remplis .env.local avec les mêmes valeurs Firebase

npm install
npm run dev
```

## Fonctionnalités

- **Tableau de bord** : vue d'ensemble (solde du mois, épargne, investissements, abonnements, graphique revenus/dépenses).
- **Budget** : revenus et dépenses, vue mensuelle et annuelle.
- **Abonnements** : abonnements mensuels et annuels, coût équivalent mensuel/annuel.
- **Investissements** : suivi du montant investi, de la valeur actuelle et de la performance.
- **Épargne** : comptes/objectifs d'épargne avec barre de progression.
- **À venir** : salaires ou indemnités prévus mais pas encore reçus ; les marquer comme reçus les ajoute automatiquement au budget.
- **Catégories** : catégories de revenus et dépenses personnalisables.

## Scripts

```bash
npm run dev      # serveur de développement
npm run build    # build de production dans dist/
npm run lint     # lint (oxlint)
npm run preview  # prévisualiser le build de production
```
