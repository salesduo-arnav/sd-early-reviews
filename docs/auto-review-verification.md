# Auto Review Verification

Verifies a buyer's review by scraping their Amazon profile and scoring confidence.

**Trigger:** Buyer submits review proof

## Flow

1. Check `auto_review_verification_enabled` in SystemConfig — skip if off
2. Load campaign + buyer profile (needs `amazon_profile_url`)
3. Extract review ID from `amazon_review_id`
4. Fetch all reviews from buyer's Amazon profile (RapidAPI scrape)
5. Match submitted review ID against profile reviews
6. Calculate confidence score (see below)
7. **Score >= 85** → `review_status = APPROVED`, `payout_status = PENDING`, notify buyer
8. **Score < 85 / Error** → stays `PENDING_VERIFICATION` for admin manual review

## Confidence Scoring (out of 100)

| Signal | Points | Condition |
|--------|--------|-----------|
| Review found on profile | +40 | ID match |
| Profile ownership | +15 | Always (it's their profile) |
| Product title match | +20 | Text similarity >= 50% |
| Review title match | +5 | Text similarity >= 70% |
| Review text match | +10 | Text similarity >= 70% |
| Rating match | +10 | Exact match |

## Decision Tree

```
Auto-verification enabled?
 ├─ No  → MANUAL
 └─ Yes
     Buyer has profile URL?
     ├─ No  → MANUAL
     └─ Yes
         Review ID valid & found on profile?
         ├─ No  → MANUAL
         └─ Yes
             Confidence >= 85?
             ├─ No  → MANUAL
             └─ Yes → AUTO-APPROVED (payout → PENDING)
```

> The function never throws. Any error falls back to manual review.
