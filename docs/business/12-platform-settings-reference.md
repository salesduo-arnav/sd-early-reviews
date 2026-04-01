# Platform Settings Reference

## Overview

This document lists all configurable platform settings, their default values, and how they affect platform behavior. All settings can be changed by admins through the admin dashboard.

---

## Verification Settings

| Setting | Default | What It Controls |
|---------|---------|-----------------|
| **Auto Order Verification** | Enabled | When enabled, orders are automatically verified by checking with Amazon's systems. When disabled, all orders go to manual admin review. |
| **Auto Review Verification** | Enabled | When enabled, reviews are automatically verified by checking the buyer's Amazon profile. When disabled, all reviews go to manual admin review. |
| **Review Confidence Threshold** | 85 / 100 | The minimum confidence score a review must receive during automatic verification to be auto-approved. Reviews below this score are sent to manual admin review. |

---

## Payout Settings

| Setting | Default | What It Controls |
|---------|---------|-----------------|
| **Auto Payout** | Enabled | When enabled, eligible payouts are automatically processed on a schedule. When disabled, all payouts require manual admin action. |
| **Payout Schedule** | Every hour | How frequently the system checks for and processes eligible payouts. |
| **Reimbursement Delay** | 14 days | The mandatory waiting period between review approval and payout processing. Provides time for dispute resolution. |
| **Per-Currency Payout Limits** | See below | The maximum payout amount that can be automatically processed. Claims above the limit require manual admin approval. |

### Per-Currency Auto-Payout Limits

| Currency | Limit |
|----------|-------|
| US Dollar (USD) | $100 |
| British Pound (GBP) | £80 |
| Euro (EUR) | €90 |
| Indian Rupee (INR) | ₹8,000 |
| Japanese Yen (JPY) | ¥15,000 |
| Australian Dollar (AUD) | A$150 |
| Canadian Dollar (CAD) | CA$135 |
| Brazilian Real (BRL) | R$500 |
| Mexican Peso (MXN) | MX$2,000 |
| Singapore Dollar (SGD) | S$135 |
| UAE Dirham (AED) | AED 365 |
| Saudi Riyal (SAR) | SAR 375 |
| Polish Zloty (PLN) | zł 400 |
| Swedish Krona (SEK) | kr 1,050 |

---

## Platform Fee

| Setting | Default | What It Controls |
|---------|---------|-----------------|
| **Platform Fee Percentage** | 10% | The fee charged to sellers on top of the total reimbursement cost. Applied as a percentage of the reimbursement pool. |

---

## Notification Settings

| Setting | Default | What It Controls |
|---------|---------|-----------------|
| **New Campaign Notifications** | Disabled | When enabled, buyers who have opted in receive notifications when new campaigns matching their interests go live. |

---

## How Changes Take Effect

- **Verification settings**: Apply to all new verifications. Claims already in review are not affected.
- **Payout settings**: Apply to the next payout cycle. Claims already being processed are not affected.
- **Platform fee**: Applies to newly created campaigns. Existing campaigns retain their original fee.
- **All changes are logged** in the admin audit trail with the admin who made the change, the old value, and the new value.
