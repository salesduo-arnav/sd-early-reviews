# Platform Overview

## What Is SD Early Reviews?

SD Early Reviews is a marketplace that connects **Amazon sellers** who want product reviews with **Amazon buyers** who are willing to purchase products and leave honest reviews in exchange for reimbursement.

## How It Works

The platform operates as a three-sided marketplace:

1. **Sellers** create campaigns for their Amazon products, specifying how many reviews they want and what percentage of the product price they will reimburse buyers.
2. **Buyers** browse available campaigns, purchase the product on Amazon, leave a review, and receive reimbursement to their bank account.
3. **Admins** oversee all activity, verify orders and reviews, manage payouts, and configure platform rules.

## The Core Workflow

```
Seller creates campaign → Seller pays upfront via Stripe
    → Campaign goes live on the marketplace
        → Buyer claims a campaign and purchases the product on Amazon
            → Platform verifies the order (automatically or manually)
                → Buyer submits their review
                    → Platform verifies the review (automatically or manually)
                        → After a waiting period, buyer receives reimbursement via bank transfer
```

## Key Principles

- **Upfront Payment**: Sellers pay the full campaign cost (reimbursements + platform fee) before the campaign goes live. This ensures buyers are always paid.
- **Automated Verification**: The platform automatically verifies orders and reviews using Amazon data, reducing manual work and speeding up the process.
- **Manual Fallback**: If automated verification cannot confirm an order or review, it is flagged for admin review. Nothing is rejected without human oversight.
- **Delayed Payouts**: Reimbursements are paid out after a waiting period (default 14 days) following review approval, providing a buffer for dispute resolution.
- **One Claim Per Buyer Per Campaign**: Each buyer can only claim a campaign once, preventing duplicate submissions.

## Supported Amazon Marketplaces

The platform supports **20 Amazon marketplaces** across three regions:

| Region | Countries |
|--------|-----------|
| **North America** | United States, Canada, Mexico, Brazil |
| **Europe & Middle East** | United Kingdom, Germany, France, Italy, Spain, Netherlands, Sweden, Poland, UAE, Saudi Arabia, Egypt, India |
| **Far East** | Japan, Australia, Singapore, China |

Each marketplace has its own currency. Buyers receive payouts in their local currency, while all earnings are tracked in US Dollars for consistency.
