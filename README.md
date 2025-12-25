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

The API runs at `http://localhost:4000`.

## Frontend Setup

Open `apps/web/index.html` in a browser, or serve the `apps/web` folder with any static server.

## Login Credentials

After running `npm run db:seed`, the script prints seeded login credentials in the terminal. Example accounts:

- `admin@localcrm.test` / `password123`
- `member1@localcrm.test` / `password123`
- `member2@localcrm.test` / `password123`
