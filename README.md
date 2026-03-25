# VanuWay Monorepo

VanuWay is Vanuatu's all-in-one digital platform for rides, delivery, hotels, food, events, and more.

## 📦 Structure

```
vanuway/
├── apps/
│   ├── website/     # Next.js 15 marketing site (vanuway.com)
│   └── app/         # Vite + React super-app (app.vanuway.com)
├── packages/
│   └── shared/      # Shared types and utilities
├── turbo.json       # Turborepo configuration
└── vercel.json      # Multi-app Vercel deployment
```

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run all apps in development
pnpm dev

# Run specific app
pnpm dev:website   # Marketing site
pnpm dev:app       # Super-app

# Build all
pnpm build
```

## 🌐 Deployments

| App | URL | Framework |
|-----|-----|-----------|
| Website | [vanuway.com](https://vanuway.com) | Next.js 15 |
| App | [app.vanuway.com](https://app.vanuway.com) | Vite + React |

## 📱 Mobile Apps

The super-app uses Capacitor for iOS and Android:

```bash
cd apps/app

# Build web assets
pnpm build

# Sync to native projects
npx cap sync

# Open in IDE
npx cap open android  # Android Studio
npx cap open ios      # Xcode
```

## 🛠️ Tech Stack

- **Package Manager**: pnpm
- **Monorepo Tool**: Turborepo
- **Website**: Next.js 15, Tailwind CSS
- **Super-App**: Vite, React 18, Capacitor
- **Backend**: Supabase
- **Deployment**: Vercel

## 📂 Apps Overview

### Website (`apps/website`)
Marketing and informational site for VanuWay services.

### Super-App (`apps/app`)
Full-featured mobile-first application including:
- 🚗 Ride booking & tracking
- 🍔 Food delivery
- 🏨 Hotel reservations
- 📦 Package delivery
- 🎫 Event tickets
- 🏠 Real estate listings
- 💼 Job marketplace
- 🚢 Ferry bookings
- 🗣️ Bislama learning
- And more...

## 🔧 Development

### Prerequisites
- Node.js 18+
- pnpm 9+

### Environment Variables
Copy `.env.example` files in each app directory and configure as needed.

## 📝 License

Proprietary - VanuWay © 2024
