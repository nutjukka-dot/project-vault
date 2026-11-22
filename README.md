# Project Vault

Private project library built with Next.js 16, TypeScript and a file-backed local store.

## Features
- Password-protected private workspace
- Project dashboard, search, category and status filters
- Project details with GitHub, demo, hosting and documentation links
- Soft delete and restore
- CSV export for backups
- Responsive layout and PWA manifest

## Run locally
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set a private `APP_PASSWORD`.
3. Start: `npm run dev`
4. Open http://localhost:3000 (or the port shown in the terminal).

Project records are stored in `.data/projects.json` on this computer. Back up this file and use the CSV export regularly.

## Optional Supabase
The API can use Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured. Apply `supabase/schema.sql` first. The service-role key is server-only and must never use a `NEXT_PUBLIC_` prefix.

Local file storage is intended for a single-machine deployment. For a public multi-device deployment, connect a dedicated persistent database before deploying; do not rely on serverless local disk.
