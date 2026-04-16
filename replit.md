# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the Aura Pendant Pro mobile app (Expo/React Native) and backend API server.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Mobile App (Aura Pendant Pro) — `artifacts/aura-pendant`

Full-featured Expo React Native app for the Aura Pendant Pro wearable safety device.

### Features
- Home Dashboard with real-time heart rate chart (animated SVG), device connection, battery, storage
- Live Camera screen with photo/video capture (expo-camera)
- Gallery with grid view, starred media, storage indicator
- Loved Ones / SOS Contacts — add/remove contacts, SOS toggle, call/message
- Alerts system — filter by SOS/Health/Device/Camera, dismiss
- Settings (More tab) — device info, camera settings, privacy/security toggles

### State Management
- Zustand with AsyncStorage persistence (`store/appStore.ts`)
- Heart rate simulator hook (`hooks/useHeartRateSimulator.ts`) for real-time data

### Key Packages
- `zustand` — state management
- `@react-native-async-storage/async-storage` — persistent state
- `react-native-svg` — heart rate chart
- `expo-camera@~17.0.10` — live camera

### Design
- Deep dark theme: `#0A0A14` background, `#7C6FFF` primary, `#FF4D6D` heart rate accent
- Glassmorphism cards with border highlights
- All colors in `constants/colors.ts`, accessed via `useColors()` hook

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
