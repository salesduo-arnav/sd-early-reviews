# Claim Lifecycle

## Overview

A claim represents a buyer's journey from claiming a campaign to receiving reimbursement. Each claim passes through a series of stages with clear rules governing transitions.

---

## Lifecycle Stages

```
Buyer Claims Campaign
        |
        v
  ORDER SUBMITTED
  (Waiting for order verification)
        |
   Approved?  ---No---> REJECTED (Order rejected with reason)
        |
       Yes
        |
        v
  REVIEW PENDING
  (Buyer needs to submit their Amazon review)
        |
   Deadline passed? ---Yes---> TIMED OUT
        |
       No
        |
        v
  REVIEW SUBMITTED
  (Waiting for review verification)
        |
   Approved?  ---No---> REJECTED (Review rejected with reason)
        |
       Yes
        |
        v
    APPROVED
  (Review verified, waiting for payout)
        |
   14-day waiting period
        |
        v
   REIMBURSED
  (Payment sent to buyer's bank account)
```

---

## Detailed Status Tracking

Behind the scenes, a claim tracks three independent statuses:

### Order Status
| Status | Meaning |
|--------|---------|
| Pending Verification | Order proof submitted, waiting for verification |
| Approved | Order confirmed as genuine |
| Rejected | Order could not be verified |

### Review Status
| Status | Meaning |
|--------|---------|
| Awaiting Upload | Order approved, buyer has not yet submitted review |
| Pending Verification | Review submitted, waiting for verification |
| Approved | Review confirmed as genuine |
| Rejected | Review could not be verified |
| Timed Out | Buyer missed the review submission deadline |

### Payout Status
| Status | Meaning |
|--------|---------|
| Not Eligible | Review not yet approved |
| Pending | Eligible for payout, waiting for processing |
| Processing | Payout currently in progress |
| Processed | Payment successfully sent |
| Failed | Payment failed (can be retried) |

---

## Key Rules

### One Claim Per Buyer Per Campaign
A buyer can only have one active claim for each campaign. This prevents a single buyer from taking multiple slots.

### Unique Order and Review IDs
- Each Amazon Order ID can only appear in one claim across the entire platform
- Each Amazon Review ID can only appear in one claim across the entire platform
- This prevents buyers from reusing the same order or review for multiple campaigns

### Cancellation
- A buyer can cancel their claim only while the order is still in **Pending Verification** status
- Once the order is approved, the claim cannot be cancelled

### Blacklisted Buyers
- Blacklisted buyers cannot create new claims
- Existing claims that are already in progress continue through to completion

### Review Deadline
- After order approval, a review deadline may be set (default: 14 days, configurable)
- If the buyer does not submit their review before the deadline, the claim status changes to **Timed Out**

### No Automatic Rejections
- The system never automatically rejects an order or review
- If automated verification fails or is inconclusive, the claim is flagged for manual admin review
- Only an admin can reject a claim, and a written reason is always required
