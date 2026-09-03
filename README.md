# Begies — Shared Cash Flow & College Class Notifier PWA

A progressive web application (PWA) designed for **Bewwy & Egie** to manage shared expenses and get real-time college class push notifications.

## 🚀 Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Aiven)
- **ORM**: Prisma
- **Notifications**: `web-push` (VAPID) + Service Worker PWA
- **Hosting & Cron**: Vercel (Cron check every 10 minutes)

## ⚙️ Environment Variables (.env)
When deploying to **Vercel**, set the following environment variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Aiven PostgreSQL connection URI (`postgres://user:pass@host:port/defaultdb?sslmode=require`) |
| `APP_PIN` | Global 4-digit PIN access (e.g. `1234`) |
| `NEXT_PUBLIC_APP_PIN` | Global 4-digit PIN for client check (e.g. `1234`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public VAPID Key for browser push manager subscription |
| `VAPID_PRIVATE_KEY` | Private VAPID Key for signing push messages |
| `VAPID_SUBJECT` | Contact email or app URL (`mailto:your-email@example.com`) |
| `CRON_SECRET` | Secret token for Vercel Cron endpoint |

## 🗄️ Database Setup (Aiven PostgreSQL)
After deploying, push schema and seed the initial users and schedules to your Aiven database:
```bash
npx prisma db push
node prisma/seed.js
```
