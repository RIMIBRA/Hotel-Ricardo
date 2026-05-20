# Hôtel Ricardo Ouagadougou — Site Web Complet

## Structure du projet

```
hotel-ricardo/
├── backend/               ← API Node.js
│   ├── server.js          ← Point d'entrée serveur
│   ├── .env               ← Variables d'environnement (clés API)
│   ├── database/
│   │   ├── db.js          ← SQLite schema
│   │   └── seed.js        ← Données initiales
│   ├── middleware/auth.js  ← JWT middleware
│   └── routes/
│       ├── auth.js         ← Authentification admin
│       ├── rooms.js        ← Gestion chambres
│       ├── reservations.js ← Gestion réservations
│       ├── payments.js     ← Paiements multi-canaux
│       └── dashboard.js    ← Statistiques + messages
└── frontend/
    ├── index.html          ← Page d'accueil
    ├── chambres.html       ← Liste des chambres
    ├── reservation.html    ← Formulaire réservation
    ├── contact.html        ← Contact
    ├── css/style.css       ← Design principal
    ├── js/main.js          ← Scripts communs
    ├── js/reservation.js   ← Logique réservation & paiement
    └── admin/
        ├── login.html      ← Connexion admin
        ├── dashboard.html  ← Tableau de bord
        ├── reservations.html ← Gestion réservations
        ├── paiements.html  ← Suivi paiements
        ├── chambres.html   ← Gestion chambres
        └── messages.html   ← Messages clients
```

## Démarrage rapide

### Option 1 — Double-cliquer sur DEMARRER.bat

### Option 2 — Manuel
```bash
cd backend
npm install
npm run seed     # Initialise la BD avec les données
npm start        # Démarre le serveur sur port 3000
```

Puis ouvrir `frontend/index.html` dans votre navigateur.

## Identifiants Admin
- **URL**: `frontend/admin/login.html`
- **Email**: `admin@hotelricardo.com`
- **Mot de passe**: `Ricardo@2024!`

## Modes de paiement intégrés

| Méthode | Type | Code USSD |
|---------|------|-----------|
| Orange Money | Local | *144# |
| Moov Money | Local | *555# |
| Telecel Money | Local | *808# |
| Coris Money | Local | App mobile |
| Visa/Mastercard | International | Via Stripe |
| PayPal | International | Redirection |

## Configuration paiements réels

Éditez le fichier `backend/.env` :

```env
# YengaPay (agrégateur local — Orange, Moov, Telecel, Coris)
YENGAPAY_API_KEY=votre_cle_yengapay

# Stripe (Visa/Mastercard)
STRIPE_SECRET_KEY=sk_live_votre_cle_stripe

# PayPal
PAYPAL_CLIENT_ID=votre_id_paypal
PAYPAL_SECRET=votre_secret_paypal
PAYPAL_MODE=live  # ou sandbox pour les tests
```

## Technologies utilisées
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Backend**: Node.js + Express.js
- **Base de données**: SQLite (via better-sqlite3)
- **Auth**: JWT (jsonwebtoken)
- **Paiements**: YengaPay (local) + Stripe (international) + PayPal
- **Graphiques**: Chart.js
- **Icônes**: Font Awesome 6

## Prix des chambres
| Type | Prix / nuit |
|------|-------------|
| Chambre Simple | 32 000 FCFA |
| Chambre Double / Twin | 37 000 FCFA |
| Chambre Familiale | 52 000 FCFA |
| Suite Junior | 65 000 FCFA |
| Suite Présidentielle | 85 000 FCFA |
| Petit-déjeuner | +4 000 FCFA/pers |
