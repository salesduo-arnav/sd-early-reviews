# Claim Lifecycle

An OrderClaim tracks a buyer's journey from claiming a campaign to getting paid.

## Phases

### 1. Order Phase (`order_status`)

```
Buyer claims campaign
  → PENDING_VERIFICATION (order proof uploaded)
  → APPROVED (SP-API auto-verify or admin approves)
  → REJECTED (admin rejects — claim ends)
```

### 2. Review Phase (`review_status`)

```
Order approved, review_deadline set
  → AWAITING_UPLOAD (waiting for buyer)
  → PENDING_VERIFICATION (buyer submits review proof)
  → APPROVED (profile scrape auto-verify or admin approves)
  → REJECTED (admin rejects — claim ends)
  → TIMEOUT (deadline passed — claim ends)
```

### 3. Payout Phase (`payout_status`)

```
Review approved
  → PENDING (eligible for payout)
  → PROCESSING (cron picks up, atomic lock)
  → PROCESSED (Wise transfer succeeds — done)
  → FAILED (Wise error or webhook refund — admin can retry)
```

## Constraints

- One claim per buyer per campaign (`unique: campaign_id + buyer_id`)
- `amazon_order_id` must be unique (no duplicate orders)
- `amazon_review_id` must be unique (no duplicate reviews)
- Buyer cannot claim if blacklisted
- Campaign must be ACTIVE to be claimed
