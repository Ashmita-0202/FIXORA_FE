# Fixora — Frontend

React frontend for Fixora, a home appliance repair booking platform.
Built to connect to an ASP.NET Core Web API backend.

## Folder structure

```
src/
  api/            axios instance + one file per backend resource (auth, services, bookings)
  components/
    common/       Button, Input, Loader — reused everywhere
    layout/       Navbar, Footer
    services/     ServiceCard, ServiceGrid
    booking/      BookingTicket (booking confirmation, styled as a job ticket)
  context/        AuthContext — global login state
  hooks/          useAuth
  pages/          one file per route (Home, Services, ServiceDetail, Booking, Login, Signup, Dashboard, NotFound)
  routes/         AppRoutes, ProtectedRoute (guards booking/dashboard behind login)
  styles/         variables.css (design tokens), global.css
```

## Connect to your backend

1. Copy `.env.example` to `.env`
2. Set `REACT_APP_API_BASE_URL` to your ASP.NET Core API's base URL, e.g.:
   ```
   REACT_APP_API_BASE_URL=https://localhost:7031/api
   ```
3. The API modules in `src/api/` assume these controller routes — rename
   the paths inside each file if your controllers differ:
   - `POST /auth/login`, `POST /auth/register`, `GET /auth/me`
   - `GET /services`, `GET /services/:id`
   - `POST /bookings`, `GET /bookings/my`, `GET /bookings/:id`, `PATCH /bookings/:id/cancel`
4. `AuthContext.login`/`signup` expect the response body shaped like
   `{ token, user }`. Adjust the two `localStorage.setItem` lines in
   `src/context/AuthContext.jsx` if your API's JSON shape differs.
5. CORS: make sure your ASP.NET Core backend allows your frontend's
   origin (you mentioned you'd already resolved this).

## Run locally

```
npm install
npm start
```

## Deploy

Any static host works since this is a CRA build:

- **Vercel / Netlify** (easiest): connect the repo, build command
  `npm run build`, output directory `build`. Add `REACT_APP_API_BASE_URL`
  as an environment variable in the host's dashboard.
- **Azure Static Web Apps**: pairs naturally if your backend is also on
  Azure (App Service). `npm run build` → deploy the `build` folder.
- **AWS S3 + CloudFront**: `npm run build`, sync `build/` to an S3
  bucket, serve through CloudFront.

Whichever you pick, your backend needs to be reachable over HTTPS from
the deployed frontend, and its CORS policy needs to allow the deployed
frontend's domain.
