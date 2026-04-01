# Buyer Claiming and Submissions

## Browsing the Marketplace

Buyers can browse all active campaigns on the marketplace and filter by:
- Amazon marketplace region
- Product category
- Price range

Each listing shows the product details, reimbursement amount, and the number of available slots remaining.

---

## Claiming a Campaign

When a buyer finds a campaign they want to participate in, they claim it. This reserves a slot for them.

### Claiming Rules

- **One claim per buyer per campaign**: A buyer can only claim each campaign once
- **Campaign must be active**: Only campaigns with an Active status can be claimed
- **Blacklisted buyers cannot claim**: If a buyer's account has been restricted by an admin, they cannot claim any campaigns

### What Happens When a Claim Is Made

1. A new claim record is created linking the buyer to the campaign
2. The buyer is expected to purchase the product on Amazon
3. The claim tracks the buyer's progress through each step

---

## Submitting Order Proof

After purchasing the product on Amazon, the buyer submits proof of their order.

### Required Information
- Amazon Order ID
- Purchase date
- Screenshot of the order confirmation

### What Happens Next
- The order moves to **Pending Verification** status
- The platform attempts to automatically verify the order (see [Order Verification](05-order-verification.md))
- If auto-verification is unavailable, an admin will manually review the order

---

## Submitting a Review

Once the order is verified and approved, the buyer can submit their Amazon review.

### Required Information

| Field | Requirements |
|-------|-------------|
| **Review Rating** | 1 to 5 stars |
| **Review Title** | At least 1 character |
| **Review Text** | At least 10 characters |
| **Review Proof** | Screenshot or URL of the published review |
| **Amazon Review ID** | The unique identifier for the review |

### Submission Rules

- The order must be **Approved** before a review can be submitted
- The review must be submitted before the **review deadline** (if one is set)
- Each Amazon Review ID can only be used once across the entire platform (prevents reuse)
- Blacklisted buyers cannot submit reviews

### What Happens Next
- The review moves to **Pending Verification** status
- The platform attempts to automatically verify the review (see [Review Verification](06-review-verification.md))
- If auto-verification cannot confirm the review, an admin will manually review it

---

## Cancelling a Claim

A buyer can cancel their claim **only if** the order has not yet been verified (still in Pending Verification status). Once an order is approved, the claim cannot be cancelled.

---

## Claim Progress Tracking

Buyers can track the status of each claim through these stages:

| Stage | What It Means |
|-------|---------------|
| **Order Submitted** | Order proof uploaded, waiting for verification |
| **Review Pending** | Order approved, buyer needs to submit their review |
| **Review Submitted** | Review uploaded, waiting for verification |
| **Approved** | Review verified, payout is being processed |
| **Reimbursed** | Payment has been sent to the buyer's bank account |
| **Rejected** | Order or review was rejected by verification |
| **Timed Out** | Buyer did not submit the review before the deadline |

Buyers can search and filter their claims by status, date range, order ID, product title, or ASIN, and sort by newest, oldest, highest payout, or lowest payout.
