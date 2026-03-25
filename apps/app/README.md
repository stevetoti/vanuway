# VanuWay — Vanuatu Super App

VanuWay is a comprehensive super-app for Vanuatu, providing essential services in one platform.

## Services

- 🚗 Rides — Request rides and track in real-time
- 🍔 Food Delivery — Order from local restaurants
- 🏨 Hotels — Browse and book accommodation
- 🏝️ Tours — Discover tours and experiences
- ⛴️ Ferry — Book inter-island ferry routes
- 🛒 Marketplace — Buy and sell locally
- 📦 Shop Delivery — Get items delivered from shops
- 💼 Jobs — Find and post jobs & freelance work
- 🏠 Real Estate — Browse properties for rent and sale
- 🏥 Health — Access health services and providers
- 🚨 Emergency — Emergency contacts and services
- 🎉 Events — Discover and create local events
- 📖 Bislama Learning — Learn Bislama language
- 🚘 Driver Portal — For ride and delivery drivers
- 👔 Admin Dashboard — Platform administration
- 🤝 Partner Portal — For service providers and business owners

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Maps**: Google Maps API
- **Deployment**: Vercel
- **PWA**: Service worker enabled

## Development

```sh
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Required environment variables for deployment:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key
- `VITE_GOOGLE_MAPS_KEY` — Google Maps API key

## Deployment

Deployed on Vercel. Push to `main` to trigger automatic deployment.

## License

Proprietary — Pacific Wave Digital
