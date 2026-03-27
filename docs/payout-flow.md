# Payout Flow

Pays buyers via Wise after their review is approved.

## How it triggers

- **Auto:** Cron job runs on a configurable schedule (default: hourly)
- **Manual:** Admin processes payout from the admin panel

## Eligibility (auto-payout cron)

A claim is eligible when ALL of these are true:

1. `review_status = APPROVED`
2. `payout_status = PENDING`
3. `review_approved_at <= NOW() - reimbursement_delay_days` (default 14 days)
4. `expected_payout_amount` does not exceed per-currency limit (from `auto_payout_max_amount` config)

Claims that exceed the per-currency limit are held back for manual admin payout.

## Processing steps

1. **Atomic lock** — `UPDATE payout_status = PROCESSING WHERE status = PENDING` (0 rows = skip, prevents double-pay)
2. **Load claim** with campaign (region) and buyer profile (wise_recipient_id, earnings)
3. **Check bank account** — if buyer has no `wise_recipient_id`, revert to `PENDING` (cron retries later)
4. **Send payout via Wise** — `createQuote → createTransfer → fundTransfer`
5. **On success:**
   - `payout_status → PROCESSED`, store `wise_transfer_id`
   - Create `Transaction` record (BUYER_PAYOUT, SUCCESS)
   - Convert amount to USD, add to buyer's `total_earnings`
   - Notify buyer: `PAYOUT_PROCESSED`
6. **On failure:**
   - `payout_status → FAILED`
   - Create `Transaction` record (BUYER_PAYOUT, FAILED)
   - Notify buyer: `PAYOUT_FAILED`
7. **Unexpected error** — reset to `FAILED` so it doesn't get stuck in `PROCESSING`

## Wise webhook (post-transfer)

Wise sends `transfers#state-change` events after the initial transfer:

| State | Action |
|-------|--------|
| `outgoing_payment_sent` | No action (already PROCESSED) |
| `funds_refunded` | Reverse: `PROCESSED → FAILED`, deduct earnings, notify buyer |
| `cancelled` | Same as refunded |

## Admin actions

- **Retry failed payout** — re-runs `processPayoutForClaim` for a FAILED claim
- **Batch update** — bulk-process multiple payouts
- **Manual status override** — set to PROCESSED or FAILED directly
