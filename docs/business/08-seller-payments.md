# Seller Payments

## Overview

Sellers pay for their campaigns upfront via credit card. The full campaign cost is collected before the campaign goes live, ensuring funds are available to reimburse buyers.

---

## What Sellers Pay

The total campaign cost consists of two parts:

### 1. Reimbursement Pool
The total amount that will be paid out to buyers:

```
Reimbursement per review = Product Price x Reimbursement Percentage
Total Reimbursement = Reimbursement per review x Number of Target Reviews
```

### 2. Platform Fee
A percentage-based fee charged on top of the reimbursement:

```
Platform Fee = Total Reimbursement x Platform Fee Percentage
```

The default platform fee is **10%** and is configurable by admins.

### Total Cost

```
Total Campaign Cost = Total Reimbursement + Platform Fee
```

---

## Payment Process

1. **Seller creates a campaign** and reviews the cost breakdown
2. **Seller is redirected** to a secure payment page (hosted by Stripe)
3. **Payment is completed** using the seller's credit or debit card
4. **Confirmation**: The campaign goes live and the seller receives confirmation

### Payment Currency
The payment is charged in the currency of the campaign's Amazon marketplace. For example:
- A campaign for Amazon US is charged in USD
- A campaign for Amazon UK is charged in GBP
- A campaign for Amazon Germany is charged in EUR

---

## Payment Outcomes

| Outcome | What Happens |
|---------|-------------|
| **Payment Succeeds** | Campaign status changes to Active. Matching buyers are notified. A transaction record is created. |
| **Payment Expires** | If the seller does not complete checkout, the campaign is automatically removed. No charge is made. |
| **Payment Fails** | The campaign remains unpaid and is not activated. The seller can try again. |

---

## Transaction Records

Every payment creates a transaction record that includes:
- The gross amount charged
- The platform fee portion
- The net amount (reimbursement pool)
- The currency
- Payment reference numbers (for reconciliation)
- Receipt and invoice URLs

---

## Key Business Rules

- **No campaign goes live without payment**: The campaign must be fully paid before it becomes visible to buyers.
- **Full amount collected upfront**: Sellers pay for all target reviews at once, not per-review.
- **Platform fee is non-refundable**: The fee is earned by the platform regardless of how many reviews are ultimately collected.
- **Payment records are permanent**: All transaction records are retained for accounting and dispute resolution.
