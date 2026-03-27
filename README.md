# SD Early Reviews

A marketplace connecting Amazon sellers (who want product reviews) with Amazon buyers (who earn reimbursement for purchasing and reviewing products).

## Architecture

- **Frontend:** React + Vite + TypeScript, shadcn/ui, Zustand, react-i18next
- **Backend:** Node.js + Express + TypeScript, Sequelize ORM, PostgreSQL
- **Integrations:** Stripe (payments), Wise (payouts), Amazon SP-API (order verification), Google OAuth

## User Roles

| Role | What they do |
|------|-------------|
| **Seller** | Creates campaigns (ASIN + reimbursement %), pays via Stripe, monitors reviews |
| **Buyer** | Claims campaigns, purchases product, submits review proof, gets paid via Wise |
| **Admin** | Verifies orders/reviews, manages payouts, blacklists, system config |

## Project Structure

```
frontend/          React SPA (Buyer, Seller, Admin portals)
backend/
  src/
    controllers/   Route handlers
    services/      Business logic + external API integrations
    models/        Sequelize models (PostgreSQL)
    middleware/    Auth (JWT), rate limiting, error handling
    routes/        API route definitions
  migrations/      Database migrations
docs/              Flow documentation
```

## Docs

- [Claim Lifecycle](docs/claim-lifecycle.md) — Order → Review → Payout phases
- [Auto Order Verification](docs/auto-order-verification.md) — SP-API order verification flow
- [Auto Review Verification](docs/auto-review-verification.md) — Profile scrape + confidence scoring flow
- [Payout Flow](docs/payout-flow.md) — Wise payout processing + auto-payout cron
- [Stripe Payment Flow](docs/stripe-payment-flow.md) — Campaign payment + webhook handling
- [Deployment](docs/deployment.md) — Docker setup, env vars, resource estimates