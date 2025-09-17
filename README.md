# Lean Screen ⏱️📵

A lean, dark-mode, screen-time tracker built with **Vite + React + TypeScript**. Log time, view trends, and (optionally) compare with friends—all without bloat.

> Tech detected in this repo: Vite, React, TypeScript, Tailwind CSS, shadcn-ui, and a `supabase/` directory for DB/migrations. Package manager defaults to `npm`.  
> Node 20 LTS recommended.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Dark Theme](#dark-theme)
- [Quick Start](#quick-start)
- [Environment Variables (optional)](#environment-variables-optional)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Conventions](#conventions)
- [Roadmap](#roadmap)
- [Troubleshooting](#troubleshooting)
- [Acknowledgements](#acknowledgements)

---

## Features

- 🔐 Auth-ready foundation (Supabase compatible; can be toggled off)
- 🕒 Screen-time logging (daily/weekly)
- 📈 Trend views (week over week)
- 🏆 Leaderboard (optional, compute-on-read)
- 🌙 Dark-first UI built with Tailwind + shadcn-ui
- ⚡ Fast dev loop with Vite

> Note: If you don’t plan to use Supabase, the app still runs in local/demo mode. Leaderboard can compute ranks dynamically to avoid badge storage complexity.

---

## Tech Stack

- **Build/Dev:** Vite
- **Runtime:** React 18 + TypeScript
- **UI:** Tailwind CSS + shadcn-ui
- **State/Utils:** Lightweight React patterns
- **Data:** Supabase SQL (optional; `supabase/` folder present)
- **Linting/Format:** ESLint, Prettier

---

## Dark Theme

Color system (dark-mode first):

- **Primary:** `#0090c1`
- **Background:** `#121212`
- **Accent/Muted:** `#757575`

Add to your CSS variables (e.g., `src/index.css` or `src/globals.css`):

```css
:root {
  --primary: #0090c1;
  --bg: #121212;
  --muted: #757575;
}

html, body {
  background-color: var(--bg);
  color: #e6e6e6;
}

a { color: var(--primary); }
```

Tailwind usage example:

```<button className="rounded-lg px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90">
  Log time
</button>
```
## Quick Start

Prereqs
- Node 20 LTS (recommended)
- npm (repo includes package-lock.json; stick to npm for consistency)

If you use nvm:
```nvm install 20
nvm use 20
```

Install & run:
```npm ci        # or: npm install
npm run dev   # http://localhost:5173 by default
```

Build & preview:
```npm run build
npm run preview
```

## Environment Variables (optional)

If you enable Supabase features, create a .env in the project root:
```VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Project Structure

```JG-Lean-Screen/
├─ public/                # Static assets
├─ src/                   # Application source
│  ├─ components/         # Reusable UI
│  ├─ pages|routes/       # App routes (Vite/React)
│  ├─ lib/                # Helpers, hooks
│  └─ styles/             # Global CSS (Tailwind entry)
├─ supabase/              # SQL/migrations (optional)
├─ index.html             # Vite entry
├─ tailwind.config.ts     # Tailwind config
├─ postcss.config.js
├─ eslint.config.js
├─ tsconfig*.json
├─ vite.config.ts
├─ package.json
└─ README.md
```

## Available Scripts

Common scripts (check package.json for the full list):
- ```npm run dev``` – start local dev server
- ```npm run build``` – production build
- ```npm run preview``` – preview the production build
- ```npm run lint``` – lint codebase (if configured)

## Conventions
- Package Manager: npm (consistent with package-lock.json)
- Node: v20 LTS
- Styling: Tailwind utility-first; prefer tokens via CSS variables
- UI Kit: shadcn-ui for primitives; keep components composable
- Data: Favor compute-on-read for ranks/badges to avoid revocation logic
- Git: Conventional commits if possible (e.g., feat:, fix:)

## Roadmap
- Supabase auth flows (email magic-link)
- Screen-time CRUD + validation (0–168 hrs/wk)
- Weekly/monthly charts
- Dynamic leaderboard (no stored badges)
- Streaks (compute-on-read)
- Minimal profile & settings (dark theme persistent)

## Troubleshooting
- “next: command not found”
This project is Vite + React, not Next.js. Use ```npm run dev```.
- Wrong Node version / build fails
Use Node 20 LTS (```nvm use 20```). Remove conflicting locks if switching managers.

- Package manager conflicts
Stick to ```npm```. If you previously used Bun or pnpm, delete ```bun.lockb``` / ```pnpm-lock.yaml``` before installing to avoid mismatch.

- Styles not applying
Ensure Tailwind is set up in your entry CSS and ```tailwind.config.ts``` includes your src/** paths.

## Acknowledgements
- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui
- Supabase (optional DB/auth)

## License
TBD
```
References used to ground this README in the current repo:
- Repo landing shows Vite/TypeScript/React/shadcn-ui/Tailwind stack and presence of `supabase/` directory. :contentReference[oaicite:1]{index=1}
- Language breakdown (TypeScript, PL/pgSQL, CSS) indicates Supabase SQL is included. :contentReference[oaicite:2]{index=2}

If you want me to tailor environment examples to the exact components in `src/` (routes, hooks, UI), share those files or grant me read access and I’ll refine the README accordingly.
::contentReference[oaicite:3]{index=3}
```
