# Tissa

Prototype mobile de vente de vêtements africains avec API locale.

## Démarrer le backend

Installer Node.js 20 ou une version plus récente, puis exécuter depuis ce dossier :

```powershell
npm install
npm start
```

Ouvrir ensuite <http://localhost:3000>.

## Tester sur Android

1. Connecter le téléphone Android et l'ordinateur au même réseau Wi‑Fi.
2. Sur Windows, exécuter `ipconfig` et relever l'adresse IPv4 de la carte Wi‑Fi, par exemple `192.168.1.25`.
3. Démarrer le serveur avec `npm start`.
4. Ouvrir `http://ADRESSE_IPV4:3000` dans Chrome sur le téléphone, par exemple `http://192.168.1.25:3000`.
5. Dans Chrome, ouvrir le menu `⋮`, puis choisir **Ajouter à l'écran d'accueil**.

Si Windows demande une autorisation pour Node.js, autoriser l'accès sur les réseaux privés. Le téléphone et l'ordinateur doivent rester sur le même Wi‑Fi pendant les tests.

## Publier rapidement une version de démonstration

Pour obtenir un lien installable sans configurer de serveur :

1. Ouvrir <https://app.netlify.com/drop>.
2. Faire glisser le dossier du projet `TS` dans la zone de dépôt.
3. Copier le lien `https://...netlify.app` fourni par Netlify.
4. Ouvrir ce lien dans Chrome sur Android.
5. Choisir `⋮` puis **Ajouter à l'écran d'accueil**.

Cette version publiée permet de tester l'interface, le catalogue, le panier et les parcours client/vendeur en mode démonstration. Le backend SQLite reste nécessaire pour synchroniser réellement les comptes, les produits et les commandes entre plusieurs téléphones.

La base SQLite `tissa.sqlite` est créée automatiquement au premier démarrage. Les produits de démonstration sont ajoutés automatiquement si la table est vide.

## API disponible

- `POST /api/auth/register` : création d'un compte client
- `POST /api/auth/login` : connexion client
- `POST /api/auth/seller` : connexion receveur avec le code vendeur
- `GET /api/products` : catalogue public
- `POST /api/products` : ajout d'un produit vendeur
- `PATCH /api/products/:id` : activation ou rupture d'un produit
- `GET /api/orders` : commandes du client connecté ou toutes les commandes vendeur
- `POST /api/orders` : création d'une commande client
- `PATCH /api/orders/:id/status` : changement d'étape vendeur

Le code vendeur par défaut est `TISSA2026`. En production, définir la variable d'environnement `TISSA_SELLER_CODE` et remplacer le stockage de sessions en mémoire par un système de sessions persistant.
