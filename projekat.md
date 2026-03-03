# Tradelog — Kompletan Plan & Lista Fajlova

*Posljednje ažurirano: Mart 2026*

---

## 📚 Markdown Uputstva (Download fajlovi)

| Fajl | Opis |
|------|------|
| `tradelog-schema-playbook-goals.md` | Schema updates, Playbook, Goals moduli |
| `tradelog-import-export.md` | Import/Export sistem, cTrader CSV parser |
| `tradelog-landing.md` | Landing page, Pricing, Privacy, Terms |
| `tradelog-stripe.md` | Stripe, Subscriptions, Webhooks |
| `tradelog-settings.md` | Settings stranice (Profile, Security, Billing...) |
| `tradelog-dashboard-fixes.md` | Dashboard KPI fixes, Equity Curve, Stats |
| `tradelog-trades-filters-detail.md` | Trade filteri, paginacija, detalj stranica |
| `tradelog-admin.md` | Admin panel (Overview, Users, Billing) |
| `tradelog-email.md` | Email sistem (Resend, Welcome, Weekly Digest) |
| `tradelog-alerts.md` | Alerts modul (Daily Loss, Drawdown, Streak) |
| `tradelog-loading-errors.md` | Loading skeletoni, 404, 500 stranice |
| `tradelog-onboarding.md` | Onboarding wizard (4 koraka) |
| `tradelog-status.md` | Status plan (završeno / nije završeno) |

---

## ✅ Lista Svih Kreiranih Fajlova

### 📁 Config & Setup

```
.env.local
src/config/plans.ts
src/config/site.ts
```

### 📁 Database Schema

```
src/db/index.ts
src/db/schema/index.ts
src/db/schema/users.ts
src/db/schema/subscriptions.ts
src/db/schema/trades.ts
src/db/schema/journal.ts
src/db/schema/goals.ts
src/db/schema/playbook.ts
src/db/schema/audit.ts
```

### 📁 Types & Validators

```
src/types/trade.ts
src/lib/validators/trade.ts
```

### 📁 Auth

```
src/lib/auth/index.ts
src/lib/auth/client.ts
```

### 📁 Stripe

```
src/lib/stripe/index.ts
src/lib/stripe/plans.ts
```

### 📁 Email

```
src/lib/email/index.ts
src/lib/email/send.ts
src/emails/welcome.tsx
src/emails/weekly-digest.tsx
src/emails/payment-failed.tsx
```

### 📁 Utils

```
src/lib/utils.ts
src/lib/admin.ts
src/lib/import/sanitize.ts
src/lib/import/index.ts
src/lib/import/parsers/ctrader.ts
src/lib/import/parsers/generic.ts
```

### 📁 Server Actions

```
src/actions/trades.ts
src/actions/analytics.ts
src/actions/calendar.ts
src/actions/journal.ts
src/actions/goals.ts
src/actions/playbook.ts
src/actions/import.ts
src/actions/export.ts
src/actions/subscriptions.ts
src/actions/settings.ts
src/actions/admin.ts
src/actions/alerts.ts
src/actions/onboarding.ts
```

### 📁 API Routes

```
src/app/api/auth/[...all]/route.ts
src/app/api/auth/welcome/route.ts
src/app/api/webhooks/stripe/route.ts
src/app/api/cron/weekly-digest/route.ts
```

### 📁 App — Root

```
src/app/layout.tsx
src/app/page.tsx
src/app/not-found.tsx
src/app/error.tsx
src/app/loading.tsx
```

### 📁 App — Auth

```
src/app/(auth)/layout.tsx
src/app/(auth)/login/page.tsx
src/app/(auth)/register/page.tsx
```

### 📁 App — Marketing

```
src/app/(marketing)/layout.tsx
src/app/(marketing)/page.tsx
src/app/(marketing)/pricing/page.tsx
src/app/(marketing)/privacy/page.tsx
src/app/(marketing)/terms/page.tsx
```

### 📁 App — Onboarding

```
src/app/onboarding/page.tsx
```

### 📁 App — Upgrade

```
src/app/upgrade/page.tsx
src/app/upgrade/success/page.tsx
```

### 📁 App — Admin

```
src/app/admin/layout.tsx
src/app/admin/page.tsx
src/app/admin/users/page.tsx
src/app/admin/billing/page.tsx
```

### 📁 App — Dashboard

```
src/app/(dashboard)/layout.tsx
src/app/(dashboard)/error.tsx
src/app/(dashboard)/dashboard/page.tsx
src/app/(dashboard)/dashboard/loading.tsx
src/app/(dashboard)/trades/page.tsx
src/app/(dashboard)/trades/loading.tsx
src/app/(dashboard)/trades/new/page.tsx
src/app/(dashboard)/trades/[id]/page.tsx
src/app/(dashboard)/trades/[id]/edit/page.tsx
src/app/(dashboard)/analytics/page.tsx
src/app/(dashboard)/analytics/loading.tsx
src/app/(dashboard)/analytics/performance/page.tsx
src/app/(dashboard)/analytics/risk/page.tsx
src/app/(dashboard)/analytics/psychology/page.tsx
src/app/(dashboard)/calendar/page.tsx
src/app/(dashboard)/journal/page.tsx
src/app/(dashboard)/journal/loading.tsx
src/app/(dashboard)/journal/[date]/page.tsx
src/app/(dashboard)/goals/page.tsx
src/app/(dashboard)/goals/loading.tsx
src/app/(dashboard)/playbook/page.tsx
src/app/(dashboard)/playbook/loading.tsx
src/app/(dashboard)/playbook/new/page.tsx
src/app/(dashboard)/playbook/[id]/page.tsx
src/app/(dashboard)/import/page.tsx
src/app/(dashboard)/reports/page.tsx
src/app/(dashboard)/alerts/page.tsx
src/app/(dashboard)/settings/layout.tsx
src/app/(dashboard)/settings/page.tsx
src/app/(dashboard)/settings/profile/page.tsx
src/app/(dashboard)/settings/security/page.tsx
src/app/(dashboard)/settings/subscription/page.tsx
src/app/(dashboard)/settings/notifications/page.tsx
src/app/(dashboard)/settings/appearance/page.tsx
src/app/(dashboard)/settings/data/page.tsx
```

### 📁 Components — Auth

```
src/components/auth/auth-card.tsx
src/components/auth/login-form.tsx
src/components/auth/register-form.tsx
```

### 📁 Components — Layout

```
src/components/layout/app-sidebar.tsx
src/components/layout/app-header.tsx
src/components/layout/nav-user.tsx
```

### 📁 Components — Shared

```
src/components/shared/page-header.tsx
src/components/shared/empty-state.tsx
src/components/shared/upgrade-gate.tsx
src/components/shared/stat-card.tsx
```

### 📁 Components — Dashboard

```
src/components/dashboard/kpi-card.tsx
src/components/dashboard/equity-curve.tsx
src/components/dashboard/pnl-chart.tsx
src/components/dashboard/recent-trades.tsx
src/components/dashboard/alert-checker.tsx
```

### 📁 Components — Trades

```
src/components/trades/trade-form.tsx
src/components/trades/trade-table.tsx
src/components/trades/trade-filters.tsx
src/components/trades/trade-pagination.tsx
src/components/trades/trade-delete-button.tsx
```

### 📁 Components — Analytics

```
src/components/analytics/performance-charts.tsx
src/components/analytics/risk-charts.tsx
src/components/analytics/psychology-charts.tsx
```

### 📁 Components — Calendar

```
src/components/calendar/calendar-view.tsx
```

### 📁 Components — Journal

```
src/components/journal/journal-form.tsx
```

### 📁 Components — Goals

```
src/components/goals/goals-view.tsx
```

### 📁 Components — Playbook

```
src/components/playbook/setup-form.tsx
src/components/playbook/setup-detail.tsx
```

### 📁 Components — Import/Export

```
src/components/import/import-form.tsx
src/components/reports/export-panel.tsx
```

### 📁 Components — Alerts

```
src/components/alerts/alerts-view.tsx
```

### 📁 Components — Onboarding

```
src/components/onboarding/onboarding-wizard.tsx
```

### 📁 Components — Upgrade

```
src/components/upgrade/upgrade-buttons.tsx
```

### 📁 Components — Settings

```
src/components/settings/settings-sidebar.tsx
src/components/settings/profile-form.tsx
src/components/settings/security-form.tsx
src/components/settings/subscription-panel.tsx
src/components/settings/notifications-form.tsx
src/components/settings/appearance-form.tsx
src/components/settings/data-panel.tsx
```

### 📁 Components — Admin

```
src/components/admin/admin-nav.tsx
src/components/admin/admin-users-table.tsx
```

---

## 📊 Status po Modulima

| Modul | Status | Napomena |
|-------|--------|----------|
| Infrastruktura | ✅ 100% | |
| Database Schema | ✅ 100% | |
| Auth (Login/Register) | ✅ 100% | |
| Dashboard | ✅ 100% | KPI, charts, alerts |
| Trades | ✅ 100% | Filteri, paginacija, detalj, edit |
| Analytics | ✅ 100% | Performance, Risk, Psychology |
| Calendar | ✅ 100% | Heatmap |
| Journal | ✅ 100% | Mood, rules, notes |
| Goals | ✅ 100% | Progress bars, auto-fill |
| Playbook | ✅ 100% | CRUD, inline edit |
| Import/Export | ✅ 100% | cTrader CSV, Excel |
| Stripe | ✅ 100% | Checkout, Portal, Webhooks |
| Settings | ✅ 100% | Sve stranice |
| Landing | ✅ 100% | Hero, Pricing, FAQ |
| Email | ✅ 95% | Welcome, Digest, Payment Failed |
| Alerts | ✅ 95% | 4 tipa, toast na dashboardu |
| Loading/Errors | ✅ 100% | Skeletoni, 404, 500 |
| Onboarding | ✅ 100% | 4-koračni wizard |
| Admin Panel | ✅ 100% | Overview, Users, Billing |

**Ukupno: ~98% završeno**

---

## 🚀 Preostalo za Production

### Obavezno prije deploya
- [ ] `pnpm db:push` — provjeri da su sve kolone kreirane (`onboardingCompleted`, `tradingDays`, `grossWinTotal`...)
- [ ] Stripe Dashboard — kreirati proizvode i cijene, kopirati Price IDs u `.env`
- [ ] Resend — verifikovati domenu za slanje emailova
- [ ] `ADMIN_EMAIL` u `.env` — postaviti admin email
- [ ] `CRON_SECRET` u `.env` — za weekly digest endpoint
- [ ] `NEXT_PUBLIC_APP_URL` — postaviti na produkcijski URL

### Vercel Deploy

```bash
# 1. Push na GitHub
git add .
git commit -m "feat: complete tradelog app"
git push origin main

# 2. Importuj projekat na vercel.com
# 3. Dodaj sve env varijable iz .env.local
# 4. Deploy
```

### Env varijable za Vercel

```bash
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_APP_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_YEARLY_PRICE_ID=
STRIPE_ELITE_MONTHLY_PRICE_ID=
STRIPE_ELITE_YEARLY_PRICE_ID=
RESEND_API_KEY=
EMAIL_FROM=
ADMIN_EMAIL=
CRON_SECRET=
```

### Nakon deploya
- [ ] Stripe Webhook — ažurirati URL na produkcijski endpoint
- [ ] Testirati Stripe checkout sa test karticama
- [ ] Testirati welcome email
- [ ] Testirati import CSV
- [ ] Provjeriti admin panel