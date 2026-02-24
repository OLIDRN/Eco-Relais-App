# Eco-Relais — Application Mobile

Application mobile React Native pour la mise en relation de **clients** souhaitant envoyer des colis et de **partenaires relais** qui effectuent les livraisons de proximité. Solution écologique, locale et collaborative.

---

## Sommaire

- [Stack technique](#stack-technique)
- [Architecture du projet](#architecture-du-projet)
- [Design System](#design-system)
- [Fonctionnalités implémentées](#fonctionnalités-implémentées)
- [Démarrage](#démarrage)
- [Routing (Expo Router)](#routing-expo-router)
- [Contextes globaux](#contextes-globaux)
- [Services API](#services-api)
- [Types TypeScript](#types-typescript)
- [Composants UI](#composants-ui)
- [État du MVP](#état-du-mvp)

---

## Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| React Native | 0.81.5 | Framework mobile |
| Expo | ~54.0.33 | Toolchain & modules natifs |
| Expo Router | ~6.0.23 | Routing file-based |
| TypeScript | 5.9.2 | Typage strict |
| React | 19.1.0 | UI |
| React Native Reanimated | — | Animations |
| React Native Gesture Handler | — | Gestes tactiles |
| React Native Maps | — | Cartographie |
| Expo Camera | — | Scanner QR |
| react-native-qrcode-svg | — | Génération QR |
| Expo Location | — | Géolocalisation |
| AsyncStorage | — | Persistance locale |

**New Architecture activée.** React Compiler activé.

---

## Architecture du projet

```
Eco-Relais/
├── app/                          # Expo Router — routing file-based
│   ├── _layout.tsx               # Root layout (ThemeProvider + AuthProvider + Stack)
│   ├── (auth)/                   # Groupe auth (non authentifié)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                   # Interface principale (4 onglets)
│   │   ├── _layout.tsx           # Tabs layout avec HapticTab
│   │   ├── index.tsx             # Accueil / Carte
│   │   ├── packages.tsx          # Mes colis / Mes missions
│   │   ├── relay.tsx             # Espace partenaire relais
│   │   └── profile.tsx           # Profil utilisateur
│   ├── mission-create.tsx        # Modal : création de mission
│   └── modal.tsx                 # Modal globale
│
├── components/
│   ├── ui/                       # Composants design system
│   │   ├── index.ts              # Réexports centralisés
│   │   ├── text.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── divider.tsx
│   │   ├── container.tsx
│   │   ├── collapsible.tsx
│   │   ├── icon-symbol.tsx       # Web / Android
│   │   └── icon-symbol.ios.tsx   # SF Symbols iOS
│   ├── DisputeModal.tsx
│   ├── MissionTimelineModal.tsx
│   ├── NotificationsModal.tsx
│   ├── QRDisplayModal.tsx
│   ├── QRScannerModal.tsx
│   └── haptic-tab.tsx
│
├── constants/
│   └── theme.ts                  # Design system complet
│
├── contexts/
│   ├── auth-context.tsx          # Authentification (user, token, login, logout)
│   └── theme-context.tsx         # Thème (light / dark / system)
│
├── hooks/
│   ├── use-theme-color.ts
│   └── use-color-scheme.ts
│
├── services/
│   └── api.ts                    # Client HTTP (apiGet, apiPost, apiPut)
│
└── types/
    └── api.ts                    # Types TypeScript (User, Mission, Dispute…)
```

### Alias de chemin

`@/` est un alias vers la racine du projet (`tsconfig.json`).

```ts
import { useThemeColors } from '@/hooks/use-theme-color';
```

---

## Design System

Toutes les valeurs de design sont centralisées dans `constants/theme.ts`. **Ne jamais hardcoder couleurs ou espacements.**

### Palette officielle

| Rôle | Nom | Light | Dark |
|---|---|---|---|
| Primary | Vert (écologie) | `#2D5A27` | `#A8D5BA` |
| Secondary | Bleu (confiance) | `#1E3A8A` | `#38BDF8` |
| Accent | Orange (dynamisme) | `#F97316` | `#F97316` |

### Tokens disponibles

```ts
import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout } from '@/constants/theme';
```

| Token | Description |
|---|---|
| `Colors.light / Colors.dark` | Couleurs sémantiques (background, surface, text, statuts) |
| `Typography.h1 … h5` | Styles titres |
| `Typography.body, bodyLarge, bodySmall` | Corps de texte |
| `Typography.button, caption, label` | Éléments UI |
| `Spacing.xs … 4xl` | Grille 4px (xs=4, sm=8, md=12, base=16, lg=20…) |
| `BorderRadius.sm … full` | Rayons (sm=4, base=8, lg=16, full=9999) |
| `Shadows.sm … xl` | Ombres iOS + Android |
| `Layout.*` | tabBarHeight=60, inputHeight=48, buttonHeight=48, avatarSizes… |

### Hooks thème

```ts
useThemeColors()                    // → toutes les couleurs du thème actif
useThemeColor(props, colorName)     // → une couleur avec override possible
useIsDarkMode()                     // → boolean
useTheme()                          // → { theme, themeMode, setThemeMode, toggleTheme, isDark }
```

---

## Fonctionnalités implémentées

### Authentification
- Login / Register par email + mot de passe
- Sélection du rôle à l'inscription : `client` ou `partner`
- Token Bearer persisté dans AsyncStorage
- Hydratation au démarrage + validation du token auprès de l'API
- Redirection automatique (`/login` si non authentifié, `/(tabs)` si connecté)

### Carte (Accueil)
- MapView avec marqueurs de missions disponibles (partenaires uniquement)
- Géolocalisation en temps réel + bouton recentrage
- Popup de détail de mission au clic sur un marqueur
- Bouton "Envoyer un colis" (clients)
- Badge notifications

### Colis / Missions
- Liste des missions de l'utilisateur avec badges de statut
- Pull-to-refresh
- États vides / erreur gérés
- FAB : création de mission (clients uniquement)
- Chaque carte affiche : titre, taille, adresses, créneau, prix, statut
- Accès rapide : QR code, timeline

### Espace Partenaire Relais
- Total des gains
- Liste des missions assignées avec actions contextuelles
- Scanner QR pour valider collecte / livraison
- Navigation GPS vers adresses de collecte / livraison
- Progression de statut : `accepted → collected → in_transit → delivered`
- Vue client : page d'onboarding "Devenir partenaire relais"

### Création de mission (clients)
- **Étape 1 :** Titre, taille (small / medium / large), adresse de collecte (auto-fill GPS + géocodage inverse), adresse de livraison, créneau horaire
- **Étape 2 :** Récapitulatif + prix + paiement Stripe

### Profil
- Avatar avec initiales, badge de rôle, coche de vérification
- Vérification email par token
- Modification des informations personnelles (prénom, nom, téléphone)
- Toggle dark mode
- Historique de paiements (clients, 5 dernières transactions)
- Gains totaux + bouton payout (partenaires)
- Déconnexion

### Modals

| Modal | Rôle |
|---|---|
| `QRDisplayModal` | Affiche le QR code d'une mission |
| `QRScannerModal` | Scanner QR avec la caméra |
| `MissionTimelineModal` | Historique des statuts d'une mission |
| `NotificationsModal` | Liste des notifications, marquage lu |
| `DisputeModal` | Signaler un litige sur une mission |

---

## Démarrage

### Prérequis

- Node.js 18+
- Expo Go (iOS / Android) ou émulateur

### Installation

```bash
npm install
```

### Lancer le projet

```bash
npx expo start            # Serveur dev (QR code pour Expo Go)
npx expo start --android  # Émulateur Android
npx expo start --ios      # Simulateur iOS
```

### Linter

```bash
npx expo lint
```

### Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

En production, la base URL est `https://api.eco-relais.fr`.

---

## Routing (Expo Router)

### Flux d'authentification

```
App start
  └─ Token AsyncStorage ?
        ├─ Non → /login
        └─ Oui → Validation API
                   ├─ Invalide → /login
                   └─ Valide → /(tabs)
```

### Groupes de routes

| Groupe | Chemins | Accès |
|---|---|---|
| `(auth)` | `/login`, `/register` | Non authentifié |
| `(tabs)` | `/`, `/packages`, `/relay`, `/profile` | Authentifié |
| Modals | `/mission-create`, `/modal` | Authentifié |

L'onglet "Colis" est masqué pour les partenaires (ils accèdent directement à l'espace relais).

---

## Contextes globaux

### `AuthContext` (`contexts/auth-context.tsx`)

```ts
const { user, token, isLoading, login, register, logout, updateUser } = useAuth();
```

### `ThemeContext` (`contexts/theme-context.tsx`)

```ts
const { theme, themeMode, setThemeMode, toggleTheme, isDark } = useTheme();
```

Persistance du mode thème en AsyncStorage (clé `@eco_relais_theme`).

---

## Services API

Fichier : `services/api.ts`

```ts
import { apiGet, apiPost, apiPut } from '@/services/api';

const missions = await apiGet<Mission[]>('/api/missions');
const result   = await apiPost<Mission>('/api/missions', payload);
await apiPut('/api/missions/123/status', { status: 'collected' });
```

Le token Bearer est injecté automatiquement depuis `AuthContext`. Les erreurs sont levées sous forme d'`ApiError` avec `message` et `statusCode`.

---

## Types TypeScript

Fichier : `types/api.ts`

```ts
type UserRole      = 'client' | 'partner' | 'admin';
type PackageSize   = 'small' | 'medium' | 'large';
type MissionStatus = 'pending' | 'accepted' | 'collected' | 'in_transit' | 'delivered' | 'cancelled';

interface User        { id, email, first_name, last_name, role, verified, phone, created_at }
interface Mission     { id, client_id, partner_id, package_title, package_size, pickup_address, pickup_lat, pickup_lng, delivery_address, delivery_lat, delivery_lng, pickup_time_slot, status, price, commission, qr_code, created_at, completed_at }
interface Notification { id, user_id, type, message, read, created_at }
interface Transaction  { id, mission_id, amount, status, created_at }
interface Dispute      { id, mission_id, raised_by, reason, status, resolution, created_at }
```

---

## Composants UI

Tous importables depuis `@/components/ui` :

```ts
import { Text, Button, Card, Input, Avatar, Badge, Divider, Container, ScreenContainer } from '@/components/ui';
```

| Composant | Props notables |
|---|---|
| `Text` | `variant` (h1–h5, body, label…), `color`, `center` |
| `Button` | `variant` (primary/secondary/accent/outline/ghost), `size`, `loading`, `fullWidth` |
| `Card` | `variant` (elevated/outlined/filled), `elevation`, `padded`, `onPress` |
| `Input` | `label`, `error`, `helper`, `leftIcon`, `rightIcon` |
| `Badge` | `variant`, `size`, `icon` — `PackageStatusBadge` pour les statuts mission |
| `Avatar` | `source`, `name`, `size`, `verified`, `online` |
| `ScreenContainer` | `padded`, `scrollable`, `safeArea` |
| `IconSymbol` | `name` (Ionicons / SF Symbols), `size`, `color` |

---

## État du MVP

**Deadline : 27/02/2026**

### Terminé

- [x] Navigation complète (Auth + Tabs + Modals)
- [x] Design system & composants UI
- [x] Dark mode (light / dark / system)
- [x] Authentification (login / register / logout / hydratation)
- [x] Intégration API (client HTTP + types)
- [x] Carte avec géolocalisation
- [x] Création de mission + flux paiement Stripe
- [x] QR code (affichage + scan)
- [x] Notifications (badge + liste)
- [x] Profil (édition + vérification email)
- [x] Espace partenaire relais (missions + gains)
- [x] Litige (DisputeModal)

---

## Backend

Le backend est dans un dépôt séparé : `eco-relais-api`

**Stack :** Node.js + Express + PostgreSQL + PostGIS

**URL de dev :** `http://localhost:3000`
**URL de prod :** `https://api.eco-relais.fr`
