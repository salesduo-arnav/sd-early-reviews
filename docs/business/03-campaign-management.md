# Campaign Management

## What Is a Campaign?

A campaign is created by a seller to get reviews for a specific Amazon product. It defines which product needs reviews, how many reviews are desired, and how much the seller will reimburse each buyer.

---

## Creating a Campaign

### Required Information

| Field | Description |
|-------|-------------|
| **ASIN** | The Amazon product identifier |
| **Region** | The Amazon marketplace (e.g., US, UK, Germany) |
| **Target Reviews** | How many reviews the seller wants |
| **Reimbursement Percentage** | What percentage of the product price each buyer will be reimbursed |

### Product Lookup

When a seller enters an ASIN, the platform automatically fetches the product details from Amazon:
- Product title
- Current price
- Rating
- Product image

This ensures accurate pricing and prevents sellers from entering incorrect product information.

### Cost Calculation

The total campaign cost is calculated as follows:

```
Reimbursement per review = Product Price x (Reimbursement Percentage / 100)
Total Reimbursement Cost = Reimbursement per review x Number of Target Reviews
Platform Fee            = Total Reimbursement Cost x 10%
Total Campaign Cost     = Total Reimbursement Cost + Platform Fee
```

**Example:**
- Product price: $50
- Reimbursement: 80%
- Target reviews: 10

```
Reimbursement per review = $50 x 80% = $40
Total Reimbursement Cost = $40 x 10 = $400
Platform Fee             = $400 x 10% = $40
Total Campaign Cost      = $400 + $40 = $440
```

> The platform fee percentage (default 10%) is configurable by admins.

---

## Campaign Payment

- The seller pays the full campaign cost upfront via credit card (Stripe)
- Payment is processed through a secure hosted checkout page
- The campaign only goes live after successful payment

**If payment succeeds:**
- Campaign status changes to **Active**
- Buyers who match the campaign's category and region are notified (if notifications are enabled)

**If payment expires or fails:**
- The campaign is automatically removed
- No charges are made

---

## Campaign Statuses

| Status | Meaning |
|--------|---------|
| **Pending Payment** | Campaign created but payment not yet completed |
| **Active** | Campaign is live and available for buyers to claim |
| **Paused** | Seller has temporarily paused the campaign; not visible to new buyers |
| **Completed** | Target number of reviews has been reached |

---

## Managing Campaigns

### Pause and Resume
- Sellers can pause an active campaign at any time
- Paused campaigns are hidden from the marketplace
- Existing claims (buyers already working on the campaign) continue to be processed
- Sellers can resume a paused campaign to make it active again

### Deleting a Campaign
- Sellers can delete a campaign
- Historical data (existing claims, transactions) is preserved for record-keeping
- Deleted campaigns cannot be restored

---

## Campaign Visibility Rules

- Only **Active** campaigns appear on the buyer marketplace
- Campaigns in **Pending Payment** status are not visible to anyone except the seller who created them
- Sellers can only see and manage their own campaigns
