# Notifications

## Overview

The platform sends notifications to keep users informed about important events. Notifications appear in the in-app notification center and, for high-priority events, are also sent via email.

---

## Buyer Notifications

| Event | When It's Sent | Priority | Email Sent? |
|-------|---------------|----------|------------|
| **New Campaign Match** | A new campaign matching the buyer's interests goes live | High | Yes |
| **Order Approved** | Buyer's order has been verified and approved | Medium | No |
| **Order Rejected** | Buyer's order has been rejected (includes reason) | High | Yes |
| **Review Approved** | Buyer's review has been verified and approved | Medium | No |
| **Review Rejected** | Buyer's review has been rejected (includes reason) | High | Yes |
| **Payout Processed** | Reimbursement has been sent to the buyer's bank | High | Yes |
| **Payout Failed** | Reimbursement payment failed | Critical | Yes |
| **Review Deadline** | Reminder that the review deadline is approaching | High | Yes |

## Seller Notifications

| Event | When It's Sent | Priority | Email Sent? |
|-------|---------------|----------|------------|
| **Campaign Created** | Confirmation after campaign creation | Low | No |
| **Campaign Paused** | Campaign has been paused | Medium | No |
| **Campaign Completed** | All target reviews have been received | Medium | No |
| **New Order Claim** | A buyer has claimed the seller's campaign | Medium | No |
| **Review Submitted** | A buyer has submitted a review for the seller's product | High | No |
| **Payment Due** | Payment reminder for the seller | High | Yes |

## Admin Notifications

| Event | When It's Sent | Priority | Email Sent? |
|-------|---------------|----------|------------|
| **Verification Needed** | An order or review requires manual admin review | High | Yes |
| **User Flagged** | A user has been flagged for admin attention | High | Yes |

## System-Wide Notifications

| Event | When It's Sent | Priority | Email Sent? |
|-------|---------------|----------|------------|
| **System Announcement** | Admin sends a broadcast message | High | Yes |
| **Welcome** | New user signs up | High | Yes |

---

## Email Rules

- Emails are only sent for **High** or **Critical** priority notifications
- Buyers can opt out of email notifications in their account settings
- Buyers can separately enable or disable new campaign match notifications
- Seller and admin email notifications are always sent regardless of preferences

---

## Notification Limits

- Each user sees a maximum of **15 notifications** in their notification center
- When a new notification is created, the oldest notification is automatically removed if the limit is reached
- This keeps the notification center clean and relevant

---

## Broadcast Notifications (Admin)

Admins can send broadcast messages to:
- **All users** on the platform
- **Buyers only**
- **Sellers only**

These appear as system announcements in each user's notification center and are also sent via email.
