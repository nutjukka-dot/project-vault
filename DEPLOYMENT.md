# Production Deployment

## Current status
The application builds successfully on Next.js 16. The left navigation is persistent and fixed on desktop and mobile.

## Required before production
This app currently supports local JSON storage for single-machine development and Supabase for persistent hosted storage. Do not deploy with local JSON storage as the production database: Vercel serverless filesystems are ephemeral and are not shared across instances.

1. Create a dedicated Supabase project for Project Vault.
2. Run `supabase/schema.sql` in that project's SQL Editor.
3. In Vercel Project Settings > Environment Variables, configure:
   - `APP_PASSWORD`: a long, unique password (at least 24 random characters).
   - `SUPABASE_URL`: the dedicated Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: the Supabase service-role key. Keep it server-only; never expose it with a `NEXT_PUBLIC_` prefix.
4. Deploy the project to Vercel.
5. Verify login, create/edit/delete/restore, and CSV export on the production URL.

## Deploy from Git
Connect the project repository to Vercel. Framework detection should select Next.js. The repository root is the project root; build command is `npm run build`.

## Local development
Copy `.env.example` to `.env.local`, set a private `APP_PASSWORD`, and run `npm install && npm run dev`.

Local JSON records live in `.data/projects.json`; back up this file before moving machines. This directory is excluded from Git and Vercel deployments.