# User Roles and Onboarding

## User Roles

The platform has three distinct user roles, each with different capabilities and access levels.

### Buyers

Buyers are Amazon shoppers who earn reimbursement by purchasing products and leaving reviews.

**What they can do:**
- Browse available campaigns on the marketplace
- Claim campaigns and submit order proof
- Submit reviews and review proof
- Track claim status and payout history
- Manage their bank account and notification preferences

**Onboarding requirements:**
- Provide their Amazon profile URL (used later to verify reviews)
- Select their Amazon marketplace region
- Connect a bank account (required before receiving payouts, but not for signing up)

### Sellers

Sellers are Amazon merchants who want product reviews for their listings.

**What they can do:**
- Create campaigns for their Amazon products
- Pay for campaigns via credit card
- Monitor campaign progress (claims, reviews, completion)
- Pause, resume, or cancel campaigns
- View billing history and analytics

**Onboarding requirements:**
- Provide company name
- Connect their Amazon Seller account (SP-API authorization) for automatic order verification

### Admins

Admins oversee all platform activity and manage the system.

**What they can do:**
- Approve or reject pending order and review verifications
- Manage buyer accounts (blacklist/unblacklist)
- Trigger manual payouts
- Configure platform settings (fees, thresholds, schedules)
- Send broadcast notifications to all users
- View audit logs of all admin actions

**How admin accounts are created:**
- Designated admin email addresses are automatically assigned the admin role during signup. These emails are configured at the system level.

---

## Signup and Authentication

### Email and Password Signup

1. User provides: email, password, full name, and chosen role (Buyer or Seller)
2. A 6-digit verification code is sent to their email
3. User enters the code to verify their account
4. Role-specific profile is created based on onboarding information

### Google Sign-In

- Users can sign up or log in using their Google account
- Google accounts are automatically marked as verified (no email code needed)
- Role and onboarding information is still required on first sign-in

### Security Rules

- Each email address can only be associated with one account
- Passwords are securely encrypted before storage
- Verification codes expire after 10 minutes
- The system never reveals whether an email is already registered (for privacy)
