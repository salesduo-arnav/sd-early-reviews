# Auto Order Verification

Verifies a buyer's Amazon order via the seller's SP-API connection.

**Trigger:** Buyer submits an order claim

## Flow

1. Check `auto_order_verification_enabled` in SystemConfig — skip if off
2. Load campaign + seller profile
3. Confirm seller has SP-API authorized (`amzn_authorization_status = AUTHORIZED`)
4. Resolve region config (marketplace ID + endpoint)
5. Decrypt seller's refresh token → get SP-API access token
6. Call SP-API to verify order belongs to seller's ASIN
7. Validate purchase date >= campaign creation date (reject pre-existing orders)
8. **Pass** → `order_status = APPROVED`, notify buyer
9. **Fail / Error** → stays `PENDING_VERIFICATION` for admin manual review

## Decision Tree

```
Auto-verification enabled?
 ├─ No  → MANUAL
 └─ Yes
     Seller SP-API authorized?
     ├─ No  → MANUAL
     └─ Yes
         Order belongs to seller's ASIN?
         ├─ No  → MANUAL
         └─ Yes
             Purchased after campaign created?
             ├─ No  → MANUAL
             └─ Yes → AUTO-APPROVED
```

> The function never throws. Any error falls back to manual review.
