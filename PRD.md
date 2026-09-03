# PRD — Cash Flow + College Class Notifier PWA
Version: 0.1 draft | Owner: papah | Date: 2026-09-03

## 1. Overview
PWA dual-purpose: personal finance + college schedule notifier.
One install, offline-first, no backend for MVP.

Problem: income/outcome/savings scattered. Class schedule missed.
Goal: single app track money + never miss class.

## 2. Goals / Non-Goals
Goals:
- Log income/outcome <5s
- See balance, monthly burn, savings progress
- Get push 15min before class, even offline

Non-Goals MVP:
- No bank sync, no multi-user, no native app stores
- No AI categorization (manual first)

## 3. Users
Primary: college student (papah) — income irregular, outcome routine, wants savings discipline.

## 4. MVP Scope (v0)
### 4.1 Cash Flow Management
Entities: Transaction {id, type: income|outcome, amount, category, date, note, wallet}
Wallets: Cash, E-Wallet, Bank, Savings (ponytail: add when need separate savings vault)
Categories MVP: Income[Salary,Freelance,Parent,Other] Outcome[Food,Transport,Rent,Study,Entertainment,Other]
Features:
- Add/edit/delete transaction
- Monthly list + filter by type/category/date
- Summary cards: Total Income, Total Outcome, Net = Income-Outcome, Savings Balance
- Savings: mark transaction -> Savings (transfer, not duplicate). ponytail: ceiling = single savings pool; add multi-goal when need >1 target
- Chart: monthly bar Income vs Outcome, pie by category (use Canvas, no chart lib MVP)
- Budget: set monthly outcome limit, progress bar, warning >80% >100%

Rules:
- amount >0, date not future >1 day, required fields validated at trust boundary
- currency IDR, format Rp

### 4.2 College Class Notifier
Entities: Course {id, name, code, room, lecturer} Schedule {courseId, day:0-6, start, end, recurrence}
Features:
- CRUD courses + weekly timetable grid
- Today view: next class + countdown
- Notifier: local notification 15/5 min before (remind), + at start. Uses Notification API + Service Worker. No push server MVP (ponytail: add VAPID push when need notify while app closed >24h)
- Offline: schedule cached, notifications fire via SW periodic/alarm fallback

## 5. User Stories (MVP)
- As user, add income Rp500k so balance update instantly
- As user, see September outcome Rp2jt vs budget Rp3jt
- As user, move Rp200k to savings so savings +200k, wallet -200k
- As user, get "Kelas Algoritma 08:00 R.301 in 15min" notification
- As user, open app offline and still log transaction

## 6. Data Model (IndexedDB)
stores:
- transactions: id pk, type, amount, category, date idx, wallet
- wallets: id, name, balance (derived, not stored — compute)
- courses: id, name, code, room
- schedules: id, courseId idx, day idx, start, end
- settings: key (budget, notifyLeadMinutes)

Derivation > storage. No sync conflict MVP.

## 7. Screens (5 screens max)
1. Dashboard: 4 cards + month bar chart + budget bar + today classes
2. Transactions: list + filters + FAB Add
3. Add/Edit: type toggle, amount, category, date, wallet, note
4. Savings: balance big, history transfers, add target (single)
5. Schedule: week grid + course list + settings (notify toggle)

Nav: bottom tab (Dashboard, Transactions, Schedule) + FAB.

## 8. Tech Stack — shortest diff wins
- PWA vanilla or Vite + Preact (3kb) — no Next.js for MVP (overkill without SSR). ponytail: upgrade to Next.js PWA when need SSR/SEO/auth
- IndexedDB via `idb` 2kb wrapper (or native indexedDB if want zero dep)
- Service Worker: Workbox not needed, 30-line SW for cache-first static + runtime cache for data (ponytail: add Workbox when need precache >50 assets)
- Charts: <canvas> manual bar/pie 50 lines, no Chart.js (30kb saved)
- CSS: native CSS vars + grid, no framework
- Icons: manifest + 192/512 png, maskable

Why: stdlib/native first, zero backend, fewest files.

## 9. PWA Requirements
- manifest.json: name, short_name, display standalone, theme_color, icons
- SW: install, activate, fetch cache-first, offline fallback page
- Install prompt deferred, button "Install"
- Lighthouse PWA 100

## 10. Notifications Detail
MVP uses local scheduled notifications:
- On app open, schedule `setTimeout` + SW `showNotification` for today's remaining classes
- Persist next fire time in IndexedDB, reschedule on SW startup
- Permission request on first Schedule visit, explain value
V2: Push via VAPID + cron on server (only when need closed-app reliability >1 day)

Edge: handle timezone Asia/Jakarta, DST none. Validate no overlapping schedules warning.

## 11. Offline & Persistence
- All data local IndexedDB, no login MVP (ponytail: add Supabase Auth + sync when need multi-device)
- Export/Import JSON backup (prevents data loss, satisfies error handling)
- No auto-cloud sync MVP

## 12. Security / Validation
- Input validation at boundary (amount, date, time)
- XSS: escape note rendering
- No secrets in client MVP

## 13. Metrics
- Time to log <5s
- Notification delivered rate 100% when app opened that day
- PWA install rate

## 14. Roadmap
v0 MVP (1-2 weeks): screens 1-5, IndexedDB, SW, local notifier, budget, export
v0.1 Polish: pie chart, edit schedule, notification sound/vibrate
v1: Auth + cloud sync (Supabase/Firebase), multi-savings goals, push server
v2: Bank import CSV, recurring transactions, calendar ICS import, share budget

## 15. Open Questions
- Budget monthly or weekly? -> assume monthly
- Savings separate wallet or goal? -> assume wallet transfer MVP
- Class notifier need location map? -> skip MVP

## 16. Acceptance Criteria MVP
- [ ] Add 10 transactions, dashboard sums correct
- [ ] Outcome > budget shows red warning
- [ ] Transfer to savings updates both balances
- [ ] Add 3 courses Mon/Wed, today view shows correct next
- [ ] Notification fires 15min before (test via changing system time)
- [ ] Works offline: airplane mode, reload, data still there
- [ ] Installable on Android + Desktop Chrome, icon shows

---
Skipped: backend, auth, push server, chart lib, CSS framework, multi-savings. Add when need multi-device or goals >1. ponytail: local-only ceiling = data loss if device wipe; upgrade path = Supabase + IndexedDB sync queue.
