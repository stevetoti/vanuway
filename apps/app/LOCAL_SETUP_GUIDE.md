# Local Development Setup Guide

This guide will help you set up VanuWay to run locally on your computer.

---

## Prerequisites

Before starting, make sure you have installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- **Code Editor** - VS Code recommended

Check your installations:
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
git --version     # Should show git version
```

---

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/stevetoti/vanu-way.git

# Navigate into the project
cd vanu-way

# Checkout your feature branch (if needed)
git checkout claude/open-new-chat-system-01YS2txYZbY6DS2m85mVFugm
```

---

## Step 2: Install Dependencies

```bash
# Using npm
npm install

# OR using yarn
yarn install
```

This will install all required packages (React, TypeScript, Vite, Supabase, etc.)

**Expected time:** 2-5 minutes depending on your internet speed

---

## Step 3: Set Up Environment Variables

### 3.1 Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon in sidebar)
3. Go to **API** section
4. You'll need:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (long string starting with `eyJ...`)

### 3.2 Create .env File

Create a file named `.env.local` in the root of your project:

```bash
# Create the file
touch .env.local

# OR on Windows
type nul > .env.local
```

### 3.3 Add Your Credentials

Open `.env.local` and add:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: For development
VITE_APP_ENV=development
```

**⚠️ IMPORTANT:**
- Replace `your-project-id` with your actual Supabase project ID
- Replace `your-anon-key-here` with your actual anon key
- DO NOT commit this file to Git (it's in `.gitignore`)

---

## Step 4: Set Up Database

### 4.1 Run SQL Scripts

Go to Supabase Dashboard → SQL Editor and run these scripts in order:

**1. Driver Onboarding System:**
```sql
-- Run the file: DRIVER_ONBOARDING_SETUP.sql
-- Or PRODUCTION_DRIVER_MIGRATION.sql if you have existing data
```

**2. Hotels Booking System:**
```sql
-- Run the file: HOTELS_BOOKING_SYSTEM_SETUP.sql
```

**3. Create Admin User:**
```sql
-- First, register through the app UI, then run:
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Use the ID from above to assign admin role:
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin')
ON CONFLICT DO NOTHING;
```

### 4.2 Verify Tables Created

In Supabase → Table Editor, you should see:
- `drivers`
- `driver_vehicles`
- `driver_documents`
- `driver_applications`
- `hotels`
- `hotel_owners`
- `hotel_rooms`
- `hotel_bookings`
- `conversations`
- `messages`
- `user_roles`

---

## Step 5: Start Development Server

```bash
# Using npm
npm run dev

# OR using yarn
yarn dev
```

**You should see:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

---

## Step 6: Access the Application

Open your browser and go to:
```
http://localhost:5173
```

You should see the VanuWay login/register page!

---

## Testing Your Local Setup

### Test 1: Register and Login
1. Go to `http://localhost:5173/register`
2. Create an account
3. Login with your credentials
4. Should see the home page ✅

### Test 2: Admin Access
1. Assign admin role in database (see Step 4.3)
2. Go to `http://localhost:5173/admin/dashboard`
3. Should see admin dashboard ✅

### Test 3: Hotel Owner
1. Go to `http://localhost:5173/hotels/owner/register`
2. Fill out registration form
3. Add a hotel
4. Should work without errors ✅

---

## Common Issues & Solutions

### Issue: "Cannot find module '@/...'"
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "VITE_SUPABASE_URL is not defined"
**Solution:**
- Check `.env.local` file exists in root directory
- Verify variable names start with `VITE_`
- Restart development server after changing .env

### Issue: Database connection fails
**Solution:**
- Verify Supabase credentials are correct
- Check Supabase project is not paused
- Verify RLS policies are set up correctly

### Issue: Port 5173 already in use
**Solution:**
```bash
# Kill the process using port 5173
# On Mac/Linux:
lsof -ti:5173 | xargs kill -9

# On Windows:
netstat -ano | findstr :5173
taskkill /PID <process_id> /F

# OR use a different port:
npm run dev -- --port 3000
```

### Issue: "npm ERR! ERESOLVE unable to resolve dependency tree"
**Solution:**
```bash
npm install --legacy-peer-deps
```

---

## Development Workflow

### Hot Module Replacement (HMR)
The development server supports HMR, meaning:
- Save a file → Changes appear instantly in browser
- No need to refresh manually
- React state is preserved

### Checking Console
Always keep browser console open (F12) to:
- See any JavaScript errors
- Monitor network requests
- Check Supabase queries
- View debug logs

### Database Viewer
Use Supabase Table Editor to:
- View data in real-time
- Run SQL queries
- Check RLS policies
- Monitor real-time subscriptions

---

## Build for Production

When you're ready to deploy:

```bash
# Build the app
npm run build

# Preview the production build locally
npm run preview
```

The build output will be in the `dist/` folder.

---

## Recommended VS Code Extensions

Install these for better development experience:

1. **ESLint** - JavaScript linting
2. **Prettier** - Code formatting
3. **Tailwind CSS IntelliSense** - Autocomplete for Tailwind classes
4. **TypeScript Vue Plugin (Volar)** - Better TypeScript support
5. **Error Lens** - Inline error display
6. **Auto Rename Tag** - Rename HTML tags automatically
7. **Path Intellisense** - Autocomplete for file paths

---

## Project Structure

```
vanu-way/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── hotels/       # Hotel-specific components
│   │   └── driver/       # Driver-specific components
│   ├── pages/            # Page components (routes)
│   │   ├── admin/        # Admin dashboard pages
│   │   ├── hotels/       # Hotel pages
│   │   └── driver/       # Driver pages
│   ├── lib/              # Utilities and services
│   │   └── hotels/       # Hotel services (chat, etc.)
│   ├── types/            # TypeScript type definitions
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React contexts
│   └── integrations/     # Third-party integrations (Supabase)
├── public/               # Static assets
├── .env.local            # Environment variables (YOU CREATE THIS)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite config
└── tailwind.config.ts    # Tailwind CSS config
```

---

## Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run TypeScript type checking
npm run type-check

# Format code with Prettier
npm run format

# Lint code
npm run lint

# Clear cache and reinstall
rm -rf node_modules package-lock.json && npm install
```

---

## Environment Variables Reference

```env
# Required
VITE_SUPABASE_URL=         # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=    # Your Supabase anon/public key

# Optional
VITE_APP_ENV=development   # Environment (development/production)
VITE_APP_NAME=VanuWay      # App name
```

---

## Git Workflow

```bash
# Check current branch
git branch

# Pull latest changes
git pull origin your-branch-name

# Create new branch
git checkout -b feature/new-feature

# Stage changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to remote
git push origin your-branch-name
```

---

## Debugging Tips

### Enable React DevTools
1. Install [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/) extension
2. Open browser DevTools (F12)
3. Go to "Components" or "Profiler" tab
4. Inspect component state and props

### Supabase Debugging
```typescript
// Add this to see all Supabase queries in console
const { data, error } = await supabase
  .from('hotels')
  .select('*')

console.log('Data:', data)
console.log('Error:', error)
```

### Network Debugging
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Click on request to see:
   - Request payload
   - Response data
   - Headers
   - Timing

---

## Performance Tips

### For Faster Development
```bash
# Use npm instead of yarn (generally faster)
npm install

# Enable Vite's optimizeDeps
# (already configured in vite.config.ts)
```

### For Faster Builds
```bash
# Use production build
npm run build

# Analyze bundle size
npm run build -- --mode analyze
```

---

## Troubleshooting Checklist

Before asking for help, check:

- [ ] Node.js version is 18+ (`node --version`)
- [ ] All dependencies installed (`npm install`)
- [ ] `.env.local` file exists with correct values
- [ ] Database tables created in Supabase
- [ ] Supabase project is not paused
- [ ] Browser console shows no errors (F12)
- [ ] Correct branch checked out (`git branch`)
- [ ] Development server is running (`npm run dev`)

---

## Getting Help

### Check Documentation
1. `ADMIN_ACCESS_GUIDE.md` - Admin features
2. `BUGS_FIXED_AND_TESTING_GUIDE.md` - Testing guide
3. Supabase Docs - https://supabase.com/docs

### Common Resources
- React Docs: https://react.dev
- TypeScript Docs: https://www.typescriptlang.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Vite Docs: https://vitejs.dev

---

## Next Steps

Once your local environment is running:

1. **Test Admin Features** - Follow `ADMIN_ACCESS_GUIDE.md`
2. **Run Test Cases** - Follow `BUGS_FIXED_AND_TESTING_GUIDE.md`
3. **Create Test Data** - Add sample hotels, drivers, bookings
4. **Explore the Code** - Understand the project structure
5. **Make Changes** - Start customizing for your needs

---

**Happy Coding!** 🚀

If you encounter any issues not covered here, check the browser console and Supabase logs for error messages.
