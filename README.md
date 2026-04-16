# Aura Pendant Pro

A full-stack mobile application for the **Aura Pendant Pro** — a wearable personal safety device. Built with Expo (React Native) for iOS, Android, and web, backed by an Express API server and PostgreSQL database.

---

## Screenshots

> Add screenshots of your app here.

---

## Features

- **Home Dashboard** — real-time heart rate chart (animated SVG), device connection status, battery level, and storage usage
- **Live Camera** — photo and video capture via `expo-camera`
- **Gallery** — grid view of captured media, starred items, and storage indicator
- **Loved Ones / SOS Contacts** — add/remove emergency contacts, toggle SOS per contact, call or message directly
- **Alerts** — filterable by SOS / Health / Device / Camera, with dismiss support
- **Settings** — device info, camera resolution, privacy/security toggles, alert behavior configuration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | Expo 54 + React Native 0.81 + Expo Router |
| Language | TypeScript 5.9 |
| State Management | Zustand + AsyncStorage (persisted) |
| UI | React Native SVG, Expo Linear Gradient, Glassmorphism cards |
| Backend | Express 5 + Node.js 24 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod |
| Monorepo | pnpm workspaces |
| Build | esbuild (API server) |

---

## Project Structure

```
.
├── artifacts/
│   ├── aura-pendant/        # Expo React Native mobile app
│   └── api-server/          # Express API server
├── lib/
│   ├── api-client-react/    # Auto-generated React Query API hooks
│   ├── api-zod/             # Shared Zod validation schemas
│   └── db/                  # Drizzle ORM schema + database client
├── package.json             # Workspace root
├── pnpm-workspace.yaml      # pnpm workspace config
└── tsconfig.base.json       # Shared TypeScript config
```

---

## Prerequisites

Make sure you have the following installed before getting started:

- **Node.js** v24+ — [nodejs.org](https://nodejs.org)
- **pnpm** v10+ — install via:
  ```bash
  npm install -g pnpm
  ```
- **Git Bash** (Windows) or any Unix shell (macOS/Linux)
- **PostgreSQL** — [postgresql.org](https://www.postgresql.org/download/) — required for the API server
- **Expo Go** app on your phone — [expo.dev/go](https://expo.dev/go) — to run the mobile app on a real device

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/aura-pendant-pro.git
cd aura-pendant-pro
```

### 2. Install dependencies

```bash
pnpm install
```

This installs all packages across all workspace projects in one command.

---

## Environment Setup

### API Server

Create a `.env` file inside `artifacts/api-server/`:

```bash
cp artifacts/api-server/.env.example artifacts/api-server/.env
```

Or create it manually:

```bash
# artifacts/api-server/.env

PORT=3001
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/aura_pendant
```

Replace `your_password` with your PostgreSQL password and `aura_pendant` with your desired database name.

### Database

Create the database in PostgreSQL:

```sql
CREATE DATABASE aura_pendant;
```

Then push the schema:

```bash
pnpm --filter @workspace/db run push
```

---

## Running the Project

### API Server

```bash
pnpm --filter @workspace/api-server run dev
```

The server will be available at `http://localhost:3001`.

Health check endpoint: `GET http://localhost:3001/api/healthz`

### Mobile App

```bash
cd artifacts/aura-pendant
npx expo start --port 8081
```

Once Metro Bundler starts, you'll see a QR code in the terminal. Choose how to open the app:

| Option | How |
|---|---|
| **Physical device** | Scan the QR code with Expo Go (Android) or the Camera app (iOS). Your phone and PC must be on the same Wi-Fi network. |
| **Web browser** | Press `w` or open `http://localhost:8081` |
| **Android emulator** | Press `a` (requires Android Studio + emulator running) |
| **iOS simulator** | Press `i` (requires macOS + Xcode) |

---

## Available Commands

### Workspace-wide

```bash
pnpm run build          # Typecheck + build all packages
pnpm run typecheck      # Full typecheck across all packages
```

### API Server (`artifacts/api-server`)

```bash
pnpm --filter @workspace/api-server run dev        # Build + start with source maps
pnpm --filter @workspace/api-server run build      # Build only (esbuild)
pnpm --filter @workspace/api-server run typecheck  # TypeScript check
```

### Mobile App (`artifacts/aura-pendant`)

```bash
pnpm --filter @workspace/aura-pendant run typecheck  # TypeScript check
```

### Database (`lib/db`)

```bash
pnpm --filter @workspace/db run push        # Push schema to database (dev)
pnpm --filter @workspace/db run push-force  # Force push (destructive, dev only)
```

---

## Design System

The app uses a deep dark theme with glassmorphism cards. All colors are defined in `artifacts/aura-pendant/constants/colors.ts` and accessed via the `useColors()` hook.

| Token | Value | Usage |
|---|---|---|
| Background | `#0A0A14` | App background |
| Primary | `#7C6FFF` | Buttons, active states |
| Heart Rate | `#FF4D6D` | Heart rate chart accent |
| Success / Connected | `#00D68F` | Connected, battery OK |
| SOS / Destructive | `#FF3B4E` | SOS button, errors |
| Card | `#141424` | Glassmorphism card background |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | Health check — returns `{ status: "ok" }` |

---

## Troubleshooting

**`pnpm` not recognized on Windows**
> Run `npm install -g pnpm` in a terminal with admin rights, or use Git Bash.

**PowerShell script execution blocked**
> Use Git Bash instead of PowerShell, or run:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

**Port already in use**
> Change the `PORT` value in `artifacts/api-server/.env` to another port (e.g. `3002`).

**`DATABASE_URL` error on API server start**
> Make sure PostgreSQL is running and the `DATABASE_URL` in your `.env` is correct.

**Expo QR code not working on phone**
> Ensure your phone and computer are on the same Wi-Fi network. If it still fails, try running with `--tunnel`:
> ```bash
> npx expo start --tunnel
> ```

**Metro bundler cache issues**
> Clear the cache and restart:
> ```bash
> npx expo start --clear
> ```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT
