# 🚀 Sahel Coders - Website Starter (Next.js 15)

Un starter moderne et performant pour applications web avec Next.js 15, React 19, et une authentification complète.

## ✨ Nouvelles fonctionnalités (Next.js 15)

### 🎯 **Améliorations principales**
- **Next.js 15** avec React 19
- **Server Actions optimisées** avec cache() et meilleures performances
- **Métadonnées avancées** avec SEO optimisé
- **Error Boundaries** pour une meilleure gestion des erreurs
- **Middleware amélioré** avec gestion d'erreurs robuste
- **Context API optimisé** avec React 19
- **Hooks personnalisés** pour les Server Actions
- **Configuration de sécurité** renforcée

### 🔧 **Améliorations techniques**
- **Performance optimisée** avec tree-shaking amélioré
- **Images optimisées** avec formats WebP et AVIF
- **Compression automatique** des assets
- **En-têtes de sécurité** configurés
- **Code splitting** intelligent
- **Hot reload** plus rapide

### 🆕 **Nouvelles fonctionnalités ajoutées**
- ✅ **Système de logging structuré** (`lib/logger.ts`)
- ✅ **Health check endpoint** (`/api/health`)
- ✅ **Gestion centralisée des erreurs** (`lib/errors.ts`)
- ✅ **Système d'upload de fichiers** (`lib/upload.ts`)
- ✅ **Configuration de tests** (Jest + React Testing Library)
- ✅ **Dockerfile** pour le déploiement
- ✅ **CI/CD avec GitHub Actions**
- ✅ **Documentation complète** (CONTRIBUTING.md, IMPROVEMENTS.md)

> 📖 Voir [IMPROVEMENTS.md](./IMPROVEMENTS.md) pour plus de détails sur les améliorations

## 🛠️ Technologies utilisées

- **Framework**: Next.js 15.3.4
- **Runtime**: React 19.1.0
- **Base de données**: Prisma + MongoDB
- **Authentification**: JWT avec refresh tokens
- **Styling**: Tailwind CSS + Radix UI
- **Validation**: Zod
- **Notifications**: Sonner
- **Formulaires**: React Hook Form
- **Icons**: Lucide React + Tabler Icons

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+ 
- npm 9+ ou yarn
- MongoDB (local ou cloud)

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd website-starter

# Installer les dépendances
npm install
# ou
yarn install

# Configurer les variables d'environnement
cp .env.example .env.local

# Générer le client Prisma
npm run postinstall

# Pousser le schéma vers la base de données
npm run db:push

# Lancer le serveur de développement
npm run dev
```

### Variables d'environnement

Créez un fichier `.env.local` avec les variables suivantes :

```env
# Base de données
DATABASE_URL="mongodb://localhost:27017/sahel-coders"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# Email (Nodemailer)
MAIL_AUTH_USER="your-email@gmail.com"
MAIL_AUTH_PASS="your-app-password"

# RSA Keys (pour les tokens de vérification)
RSA_PRIVATE_KEY="your-private-key"
RSA_PUBLIC_KEY="your-public-key"

# Admin override (optionnel)
ADMIN_OVERRIDE_PASSWORD="admin-override-password"
```

## 📁 Structure du projet

```
website-starter/
├── app/                    # App Router (Next.js 15)
│   ├── (dashboard)/       # Routes protégées
│   ├── api/              # API Routes
│   ├── auth/             # Pages d'authentification
│   └── layout.tsx        # Layout racine
├── actions/              # Server Actions
├── components/           # Composants React
│   ├── auth/            # Composants d'authentification
│   ├── ui/              # Composants UI (shadcn/ui)
│   └── common/          # Composants communs
├── context/             # Context API
├── hooks/               # Hooks personnalisés
├── lib/                 # Utilitaires et configurations
├── data/                # Couche d'accès aux données
├── schemas/             # Schémas de validation Zod
├── types/               # Types TypeScript
└── prisma/              # Schéma et migrations Prisma
```

## 🔐 Système d'authentification

### Fonctionnalités
- ✅ Inscription avec vérification email
- ✅ Connexion sécurisée
- ✅ Refresh tokens automatiques
- ✅ Gestion des rôles (USER, ADMIN)
- ✅ Protection des routes
- ✅ Rate limiting
- ✅ Réinitialisation de mot de passe
- ✅ Changement d'email
- ✅ Sessions multiples (configurable)

### Sécurité
- 🔒 JWT chiffrés avec JWE
- 🔒 Tokens de vérification signés RSA
- 🔒 Rate limiting sur les routes d'auth
- 🔒 Protection CSRF
- 🔒 En-têtes de sécurité
- 🔒 Validation des données avec Zod

## 🎨 Interface utilisateur

### Design System
- **shadcn/ui** pour les composants de base
- **Tailwind CSS** pour le styling
- **Radix UI** pour l'accessibilité
- **Framer Motion** pour les animations
- **Thème sombre/clair** avec next-themes

### Composants disponibles
- 🎯 Formulaires d'authentification
- 🎯 Navigation et sidebar
- 🎯 Tableaux de données
- 🎯 Modales et dialogues
- 🎯 Notifications toast
- 🎯 Loaders et spinners

## 📊 Scripts disponibles

```bash
# Développement
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run start            # Serveur de production

# Qualité du code
npm run lint             # Vérification ESLint
npm run lint:fix         # Correction automatique
npm run type-check       # Vérification TypeScript
npm run format           # Formatage avec Prettier
npm run format:check     # Vérification du formatage

# Tests
npm test                 # Lancer les tests
npm run test:watch       # Tests en mode watch
npm run test:coverage    # Tests avec couverture

# Base de données
npm run db:push          # Pousser le schéma
npm run db:migrate       # Créer une migration
npm run db:studio        # Interface Prisma Studio
npm run seed             # Peupler la base de données
```

## 🔧 Configuration avancée

### Optimisations Next.js 15
- **Tree-shaking** optimisé
- **Code splitting** intelligent
- **Images optimisées** automatiquement
- **Compression** des assets
- **Cache** des Server Actions

### Performance
- **Lazy loading** des composants
- **Suspense** pour le chargement
- **Error Boundaries** pour la robustesse
- **Optimisation des bundles**

## 🚀 Déploiement

### Vercel (Recommandé)
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

### Docker
```bash
# Build de l'image
docker build -t website-starter .

# Lancer le conteneur
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e JWT_SECRET="your-jwt-secret" \
  website-starter
```

### Autres plateformes
- **Netlify**: Compatible avec les builds statiques
- **Railway**: Support complet de Next.js
- **Docker**: Dockerfile inclus (voir ci-dessus)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

- 📧 Email: support@sahelcoders.com
- 💬 Discord: [Sahel Coders Community](https://discord.gg/sahelcoders)
- 📖 Documentation: [docs.sahelcoders.com](https://docs.sahelcoders.com)

---

**Développé avec ❤️ par l'équipe Sahel Coders**
