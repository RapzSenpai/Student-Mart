# StudentMart - Student-Focused Ordering System

A modern web application where students can browse products, add them to a cart, and place orders. Features role-based access for students, sellers, and admins.

> Demo project - not intended for production / company use.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Authentication**: Firebase Auth (Email/Password)
- **Database**: Cloud Firestore
- **Routing**: React Router v6
- **State**: Context API (AuthContext, CartContext)
- **Styling**: Tailwind CSS v4 + daisyUI, plus component-level CSS

## Features

- Store browsing, product details, cart, and checkout (student view)
- Order history and profile management
- Real-time notifications (bell + dropdown)
- Role-based admin dashboard: products, orders, users, notifications
- Responsive mobile header with a slide-in user drawer

## Prerequisites

- **Node.js** 20.19+ (or 22.12+)
- A **Firebase project** (this repo is already linked to `studentmart-13f3b`)
- **Firebase CLI**: `npm install -g firebase-tools`

## Environment Setup

The app reads Firebase config from environment variables at build time.

1. Copy the template and fill in values from the Firebase console
   (**Project settings -> Your apps -> SDK setup / config**):

   ```bash
   cp .env.example .env
   ```

2. Fill in `.env`:

   ```ini
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   VITE_CLOUDINARY_CLOUD_NAME=...      # only if image uploads are used
   VITE_CLOUDINARY_UPLOAD_PRESET=...
   ```

> Note: Vite inlines `VITE_*` variables into the bundle when you run
> `npm run build`. The `.env` file is **not** uploaded to Firebase Hosting,
> so it must be present on the machine where you build.

## Local Development

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # outputs to dist/
```

## Firebase Hosting Deployment

1. Log in to Firebase (one time):

   ```bash
   firebase login
   ```

2. (Optional) confirm the active project - it is already set in `.firebaserc`:

   ```bash
   firebase use studentmart-13f3b
   ```

3. Build the app:

   ```bash
   npm run build
   ```

4. Deploy:

   ```bash
   firebase deploy                  # deploys Hosting + Firestore rules
   firebase deploy --only hosting   # hosting only
   firebase deploy --only firestore # Firestore rules only
   ```

5. Open the Hosting URL printed in the terminal.

### One-time Firebase console setup

- **Authentication -> Sign-in method**: enable **Email/Password**.
- **Firestore Database**: create a database (the `firebase deploy` step pushes
  `firestore.rules`, but the database itself must exist first).

## Project Structure

```
src/
  components/   UI (Header, AdminLayout, ProductCard, NotificationBell, ...)
  pages/        Route pages (store, cart, checkout, profile, admin, ...)
  context/      AuthContext, CartContext
  services/     firebase init, notifications
  css/          component & page styles
public/         static assets
dist/           production build output (uploaded to Firebase Hosting)
```

## Notes

- The app is a **SPA** - all routes rewrite to `index.html` (configured in
  `firebase.json`).
- The **admin dashboard is desktop-oriented** and not optimized for mobile.
- `src/app/` (Next.js) and `next.config.mjs` are unused leftovers; the app
  builds with Vite and can be ignored.
