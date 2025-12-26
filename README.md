# Local-Only CRM + Work Management

This project provides a local-only CRM inspired by monday.com, built with a TypeScript Express API and a static HTML/JS frontend.

## Project Structure

```
/apps
  /api              # TypeScript Express backend
  /web              # Static HTML / CSS / JavaScript frontend
```

## Requirements

- Node.js (no native addons required)
- Visual Studio Code (recommended)

## Backend Setup

```bash
cd apps/api
npm install
npm run db:init
npm run db:seed
npm run dev
```

The API runs at `http://localhost:4005`.
The web UI is served from the same dev server, so open `http://localhost:4005` after running `npm run dev`.

## Frontend Setup

You can still open `apps/web/index.html` in a browser, or serve the `apps/web` folder with any static server.

## Deploy to IIS (Windows) - Single Package (iisnode)

This setup runs the Express app with IIS using `iisnode`, serving both the API and the static frontend.

### Prerequisites

- Windows Server with IIS installed
- Node.js LTS
- IIS modules:
  - **iisnode**
  - **URL Rewrite**

### Build & Package

```bash
cd apps/api
npm install
npm run db:init
npm run db:seed
npm run build
```

> The build output is in `apps/api/dist`. IIS will route requests to `dist/index.js` via `apps/api/web.config`.

### IIS Site Setup

1. In IIS Manager, **create a new site** and set the physical path to:
   ```
   <repo>\apps\api
   ```
2. Ensure the site has access to write the database file:
   ```
   <repo>\apps\api\data\db.json
   ```
3. Start the site and open the site URL in your browser.

### Notes

- The frontend API base is configured to **same-origin** (`apps/web/js/api.js` uses `API_BASE = ''`), so it will call the same host/port IIS serves.
- If you want a custom port, set the IIS site binding accordingly; the app reads `PORT` from environment when needed.

## Login Credentials

After running `npm run db:seed`, the script prints seeded login credentials in the terminal. Example accounts:

- `admin@localcrm.test` / `password123`
- `member1@localcrm.test` / `password123`
- `member2@localcrm.test` / `password123`
