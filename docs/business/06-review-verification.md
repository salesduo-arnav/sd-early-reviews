# Review Verification

## Purpose

Review verification confirms that a buyer actually published their review on Amazon. This ensures sellers receive genuine reviews and buyers are reimbursed only for real contributions.

---

## Automatic Verification

The platform can automatically verify reviews by checking the buyer's public Amazon review profile.

### How It Works

1. The buyer submits their review details (rating, title, text, review ID, proof screenshot)
2. The system checks if automatic review verification is enabled (admin setting)
3. The platform fetches all reviews from the buyer's Amazon profile (using the profile URL they provided during signup)
4. The system attempts to match the submitted review against the reviews found on the profile
5. A **confidence score** is calculated based on multiple matching signals

### Confidence Scoring

The system calculates a score out of 100 points based on how well the submitted review matches what is found on the buyer's Amazon profile:

| Signal | Points | Condition |
|--------|--------|-----------|
| **Review found on profile** | 40 | The submitted review ID matches a review on the buyer's profile |
| **Product title match** | 20 | The product title is at least 50% similar |
| **Profile ownership confirmed** | 15 | The review appears on the buyer's own profile (confirming they wrote it) |
| **Rating match** | 10 | The submitted star rating matches the review on Amazon |
| **Review text match** | 10 | The review body text is at least 70% similar |
| **Review title match** | 5 | The review title is at least 70% similar |
| **Total possible** | **100** | |

> Text matching uses fuzzy comparison to handle minor differences in wording, formatting, or typos.

### Approval Threshold

- A review is **automatically approved** if the confidence score is **85 or higher** (out of 100)
- If the score is below 85, the review is sent to manual admin review
- The threshold of 85 is configurable by admins

### Verification Outcomes

| Result | What Happens |
|--------|-------------|
| **Score >= 85** | Review is automatically approved. Buyer is notified. Payout becomes eligible after the waiting period. |
| **Score < 85** | Review remains in Pending Verification for manual admin review. The confidence breakdown is saved for the admin to see. |
| **Error** | If profile fetching fails or any technical issue occurs, the review is flagged for manual admin review. Nothing is automatically rejected. |

---

## Manual Verification (Admin)

When automatic verification is unavailable or the confidence score is below the threshold, an admin reviews the submission manually.

### What the Admin Sees
- Buyer's submitted review details (rating, title, text, proof screenshot)
- Confidence score and breakdown (if auto-verification was attempted)
- The matched review data from the buyer's profile (if available)
- Product and campaign details

### Admin Actions

| Action | Requirements | What Happens |
|--------|-------------|-------------|
| **Approve** | No additional info needed | Review is approved. Buyer is notified: *"Your review has been approved. Your payout is now pending."* Payout becomes eligible after the waiting period. |
| **Reject** | A reason must be provided | Review is rejected. Buyer is notified: *"Your review has been rejected. Reason: [admin's reason]"* |

All admin verification decisions are recorded in an audit log.

---

## Key Business Rules

- **No automatic rejections**: The system never automatically rejects a review. Low-confidence reviews are always sent to manual admin review.
- **Confidence details are preserved**: The full scoring breakdown is stored with each claim, allowing admins to see exactly why auto-verification did or did not approve a review.
- **Review uniqueness**: Each Amazon Review ID can only be used once across the entire platform, preventing the same review from being submitted for multiple campaigns.
- **Review deadline**: If a deadline is set for the claim, the buyer must submit their review before it expires. Missing the deadline results in a Timeout status.
