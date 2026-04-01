# Payouts and Reimbursements

## Overview

After a buyer's review is verified and approved, they become eligible for reimbursement. Payouts are sent to the buyer's bank account via Wise (international bank transfer service).

---

## Payout Eligibility

A claim becomes eligible for payout when **all** of the following conditions are met:

1. **Order is approved** (order verification passed)
2. **Review is approved** (review verification passed)
3. **Waiting period has elapsed**: At least **14 days** have passed since the review was approved (configurable by admins)
4. **Payout amount is within limits**: The amount does not exceed the auto-payout limit for the claim's currency

The waiting period provides a buffer for dispute resolution and ensures the review remains published on Amazon.

---

## Automatic Payouts

The platform automatically processes eligible payouts on a scheduled basis (default: every hour).

### How It Works

1. The system finds all claims that meet the eligibility criteria
2. Claims exceeding the per-currency auto-payout limit are held back for manual admin processing
3. For each eligible claim:
   - The system checks if the buyer has connected a bank account
   - If yes: the payout is processed
   - If no: the claim is skipped and retried in the next cycle

### Auto-Payout Limits by Currency

Claims above these amounts are held for manual admin approval:

| Currency | Maximum Auto-Payout |
|----------|-------------------|
| USD | $100 |
| GBP | £80 |
| EUR | €90 |
| INR | ₹8,000 |
| JPY | ¥15,000 |
| AUD | A$150 |
| CAD | CA$135 |
| BRL | R$500 |
| MXN | MX$2,000 |
| SGD | S$135 |
| AED | AED 365 |
| SAR | SAR 375 |
| PLN | zł 400 |
| SEK | kr 1,050 |

> These limits are configurable by admins.

---

## Payout Processing

### Steps

1. The claim is locked to prevent duplicate payments
2. The system creates an international transfer via Wise:
   - Exchange rate is locked at the time of transfer
   - Transfer is funded from the platform's account
3. The buyer's bank account receives the funds

### Payout Currency

- Buyers receive payouts in their configured payout currency (set during bank account setup)
- All earnings are also tracked in US Dollars for consistent reporting

---

## Payout Statuses

| Status | Meaning |
|--------|---------|
| **Not Eligible** | Review has not yet been approved, or other conditions not met |
| **Pending** | Review approved, waiting for the required delay period or next payout cycle |
| **Processing** | Payout is currently being processed (locked to prevent duplicates) |
| **Processed** | Payment has been successfully sent to the buyer |
| **Failed** | Payment failed (buyer is notified and admin can retry) |

---

## Manual Payouts (Admin)

Admins can manually trigger payouts for:
- Claims that exceed the auto-payout limit
- Claims that previously failed
- Any claim in Pending status

Admin-triggered payouts follow the same processing steps and are recorded in the audit log.

---

## Failed and Reversed Payouts

### Failed Payouts
- If a payout fails during processing, the claim status is set to **Failed**
- The buyer is notified of the failure
- Admins can investigate and retry the payout

### Reversed Payouts
If a bank transfer is refunded or cancelled after being sent:
- The claim status reverts from Processed to Failed
- The payout amount is deducted from the buyer's total earnings
- The buyer is notified

---

## Double-Payment Prevention

The system uses an atomic locking mechanism to ensure a claim can never be paid out twice:
- When processing begins, the claim is locked in a **Processing** state
- If the system detects the claim is already being processed, it skips it
- If any unexpected error occurs during processing, the claim is safely moved to **Failed** status rather than remaining stuck

---

## Key Business Rules

- **Buyers must connect a bank account** before receiving any payouts. Claims without a connected account are skipped and retried later.
- **Waiting period is mandatory**: No payout is made immediately after review approval. The default 14-day delay is configurable.
- **High-value claims require admin approval**: Claims above the per-currency limit are never auto-paid.
- **All payouts are recorded**: Every payout creates a transaction record tracking the amount, currency, fees, and transfer reference for accounting and reconciliation.
