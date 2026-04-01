# Admin Operations

## Overview

Admins have full oversight of platform operations. They verify orders and reviews, manage users, process payouts, configure system settings, and maintain an audit trail of all actions.

---

## Verification Management

### Pending Orders
Admins review orders that could not be automatically verified.

**Available information:**
- Order proof screenshot
- Amazon Order ID and purchase date
- Product details (ASIN, title, price)
- Campaign details
- Buyer's name and email

**Actions:**
- **Approve**: Marks the order as verified. The buyer is notified and can proceed to submit their review.
- **Reject**: Requires a written reason. The buyer is notified with the rejection reason.

### Pending Reviews
Admins review submissions that scored below the auto-approval threshold.

**Available information:**
- Review details (rating, title, text, proof screenshot)
- Confidence score and breakdown (if auto-verification was attempted)
- Matched review data from the buyer's Amazon profile
- Product and campaign details

**Actions:**
- **Approve**: Marks the review as verified. The buyer's payout becomes eligible after the waiting period.
- **Reject**: Requires a written reason. The buyer is notified with the rejection reason.

Admins can search pending verifications by order ID, product title, ASIN, buyer name, or email.

---

## Buyer Management

### Viewing Buyers
Admins can see all registered buyers with:
- Total earnings
- On-time submission rate
- Number of claims
- Amazon profile URL
- Bank account status

### Blacklisting
Admins can restrict a buyer's account:
- **Blacklist**: Requires a written reason. Prevents the buyer from claiming any new campaigns.
  - Existing claims already in progress continue to completion.
- **Unblacklist**: Restores the buyer's ability to claim campaigns.

Both actions are recorded in the audit log.

---

## Campaign Management

Admins can view all campaigns across all sellers, including:
- Seller information
- Campaign status and progress (claimed vs. target reviews)
- Reimbursement percentage and region
- Ability to pause or resume any campaign

---

## Payout Management

### Dashboard View
- Summary of payouts by status: Pending, Processing, Processed, Failed
- Transaction history with amounts, currencies, and transfer references

### Manual Payout Actions
- **Trigger individual payouts** for claims in Pending or Failed status
- **Batch payout processing** for multiple claims at once
- **Retry failed payouts** after investigating the cause

---

## System Configuration

Admins can adjust the following platform settings:

### Verification Settings
| Setting | Default | Description |
|---------|---------|-------------|
| Auto Order Verification | Enabled | Automatically verify orders via Amazon SP-API |
| Auto Review Verification | Enabled | Automatically verify reviews via profile scraping |
| Review Confidence Threshold | 85 out of 100 | Minimum score for auto-approving a review |

### Payout Settings
| Setting | Default | Description |
|---------|---------|-------------|
| Auto Payout | Enabled | Automatically process eligible payouts |
| Payout Schedule | Every hour | How often the auto-payout runs |
| Reimbursement Delay | 14 days | Waiting period after review approval before payout |
| Per-Currency Limits | Varies | Maximum amount for automatic payouts (by currency) |

### Platform Settings
| Setting | Default | Description |
|---------|---------|-------------|
| Platform Fee | 10% | Fee charged on top of campaign reimbursement costs |
| New Campaign Notifications | Disabled | Whether buyers are notified of matching new campaigns |

All configuration changes are recorded in the audit log.

---

## Audit Trail

Every admin action is permanently recorded with:
- **Who**: The admin who performed the action
- **What**: The type of action (e.g., verification approval, payout trigger, config change)
- **When**: Timestamp of the action
- **Details**: Specific information (e.g., claim ID, rejection reason, old and new config values)
- **IP Address**: The admin's network address

The audit log cannot be modified or deleted. It serves as an immutable record for accountability and compliance.

Admins can search the audit log by action type, admin name, date range, or resource ID.

---

## Broadcast Communications

Admins can send system-wide notifications to:
- All users
- Buyers only
- Sellers only

These messages appear in each user's notification center and are sent via email.
