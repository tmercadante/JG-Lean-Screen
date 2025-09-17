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
