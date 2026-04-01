# Order Verification

## Purpose

Order verification confirms that a buyer actually purchased the product from the correct Amazon listing. This protects sellers from fraudulent claims.

---

## Automatic Verification

The platform can automatically verify orders using Amazon's Selling Partner API (SP-API), which connects directly to the seller's Amazon account.

### How It Works

1. The buyer submits their order proof (Order ID, purchase date, screenshot)
2. The system checks if automatic order verification is enabled (admin setting)
3. The system confirms the seller has connected their Amazon Seller account
4. The platform queries Amazon's systems to verify:
   - The order exists and belongs to the correct product (ASIN)
   - The order was placed in the correct marketplace
   - **The order was placed after the campaign was created** (prevents buyers from submitting pre-existing orders)

### Verification Outcomes

| Result | What Happens |
|--------|-------------|
| **Verified** | Order is automatically approved. Buyer is notified and can proceed to submit their review. |
| **Not Verified** | Order remains in Pending Verification for manual admin review. |
| **Error** | If the system encounters any technical issue, the order is flagged for manual admin review. Nothing is automatically rejected. |

### When Auto-Verification Is Not Available

Automatic verification requires:
- The admin setting for auto-verification to be enabled
- The seller to have connected their Amazon Seller account

If either condition is not met, all orders for that campaign go directly to manual admin review.

---

## Manual Verification (Admin)

When automatic verification is unavailable or inconclusive, an admin reviews the order manually.

### What the Admin Sees
- Buyer's submitted order proof (screenshot)
- Amazon Order ID
- Purchase date
- Product details (ASIN, title, price)
- Campaign details

### Admin Actions

| Action | Requirements | What Happens |
|--------|-------------|-------------|
| **Approve** | No additional info needed | Order is approved. Buyer is notified: *"Your order has been verified and approved. You can now submit your review."* |
| **Reject** | A reason must be provided | Order is rejected. Buyer is notified: *"Your order has been rejected. Reason: [admin's reason]"* |

All admin verification decisions are recorded in an audit log for accountability.

---

## Key Business Rules

- **No automatic rejections**: The system never automatically rejects an order. If auto-verification fails or encounters an error, the order is always sent to manual review.
- **Pre-existing order protection**: Orders placed before the campaign was created are flagged, as they indicate the buyer already owned the product.
- **One verification per claim**: Each claim goes through order verification once. After approval, the buyer proceeds to the review submission step.
