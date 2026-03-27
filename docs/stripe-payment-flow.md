# Stripe Payment Flow

Handles seller payments when creating campaigns.

## Flow

1. Seller creates campaign → `POST /campaigns`
2. Backend creates campaign in `PENDING_PAYMENT` status
3. Backend creates a Stripe Checkout Session with:
   - Line items: buyer reimbursement + platform fee
   - `campaign_id` in session metadata
4. Backend creates a `Transaction` record (SELLER_CHARGE, PENDING)
5. Seller is redirected to Stripe hosted checkout
6. **Two possible outcomes via webhook:**

### checkout.session.completed

1. Campaign status → `ACTIVE`
2. Store `stripe_payment_intent_id` on campaign
3. Transaction status → `SUCCESS`, store `receipt_url` + `invoice_url`
4. Notify matching buyers about new campaign (by category interest)

### checkout.session.expired

1. Campaign is soft-deleted
2. Transaction status → `FAILED`
3. Seller can retry by creating a new campaign

## Buyer interest notifications

When a campaign activates, buyers are notified if:

- `new_campaign_notifications_enabled = true` on their profile
- `is_blacklisted = false`
- `interested_categories` is null (all categories) OR contains the campaign's category
- Global admin toggle `new_campaign_notifications_enabled` is on
