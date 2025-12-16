# Pricing Setup Guide

## Overview

Estimate Review Pro has three pricing tiers:
1. **Individual** - $149 one-time payment (policyholders)
2. **Firm Plan** - $499/month with 10 reviews included ($75 per additional review)
3. **Pro Firm Plan** - $1,499/month with 40 reviews included (hard cap, no overages)

---

## Stripe Product Setup

### 1. Create Stripe Products

#### Product 1: Professional Estimate Review (Individual)
```
Name: Professional Estimate Review
Type: One-time payment
Price: $149 USD
Metadata:
  - plan: individual
  - included_reviews: 1
```

#### Product 2: Firm Plan
```
Name: Estimate Review Pro – Firm Plan
Type: Recurring subscription
Price: $499 USD / month
Metadata:
  - plan: firm
  - included_reviews: 10
  - overage_price: 75
```

#### Product 3: Pro Firm Plan
```
Name: Estimate Review Pro – Pro Firm Plan
Type: Recurring subscription
Price: $1,499 USD / month
Metadata:
  - plan: pro
  - included_reviews: 40
  - overage_price: 0
```

### 2. Get Price IDs

After creating each product in Stripe, copy the Price IDs:
- Individual: `price_1ABC...` → `STRIPE_PRICE_INDIVIDUAL_149`
- Firm: `price_1DEF...` → `STRIPE_PRICE_FIRM_499`
- Pro: `price_1GHI...` → `STRIPE_PRICE_PRO_1499`

---

## Environment Variables

Add these to your `.env` file and Netlify environment:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PRICE_INDIVIDUAL_149=price_...
STRIPE_PRICE_FIRM_499=price_...
STRIPE_PRICE_PRO_1499=price_...

# Site URL
SITE_URL=https://estimatereviewpro.com
```

### Netlify Environment Variables

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add all variables from above
3. Deploy the site

---

## Database Setup

### 1. Run Migration

Apply the usage tracking migration:

```bash
supabase db push
```

Or manually run `/supabase/migrations/add_usage_tracking.sql` in Supabase SQL Editor.

### 2. Verify Tables

Confirm these tables exist:
- `profiles` (with new columns: `plan_type`, `billing_period_start`, `included_reviews`, `overage_price`)
- `usage_tracking` (new table)

---

## Webhook Setup

### 1. Create Webhook Endpoint in Stripe

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://estimatereviewpro.com/.netlify/functions/stripe-webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
4. Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

### 2. Test Webhook

Use Stripe CLI:

```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
stripe trigger checkout.session.completed
```

---

## Usage Tracking Logic

### Individual Plan
- **Included Reviews**: 1
- **Overage**: None (must purchase again)
- **Billing**: One-time

### Firm Plan
- **Included Reviews**: 10 per month
- **Overage**: $75 per additional review
- **Billing**: Monthly subscription
- **Reset**: Usage resets at billing cycle start

### Pro Firm Plan
- **Included Reviews**: 40 per month
- **Overage**: None (hard cap at 40)
- **Billing**: Monthly subscription
- **Reset**: Usage resets at billing cycle start

### Implementation

Usage is tracked in the `usage_tracking` table:
- `organization_id` → User's profile ID
- `billing_period_start` → Start of current billing cycle
- `reviews_used` → Number of reviews used this cycle
- `plan_type` → `individual`, `firm`, or `pro`

When a review is submitted:
1. Check current usage via `get_current_usage(org_id)`
2. For **Firm Plan**: If `reviews_used > 10`, create Stripe invoice item at $75
3. For **Pro Plan**: If `reviews_used >= 40`, reject submission
4. Increment `reviews_used` in `usage_tracking`

---

## Checkout Flow

### Individual Checkout
```
POST /.netlify/functions/create-individual-checkout
Body: { userId, email }
→ Returns: { url: "https://checkout.stripe.com/..." }
```

### Firm Checkout
```
POST /.netlify/functions/create-firm-checkout
Body: { userId, email, plan: "firm" | "pro" }
→ Returns: { url: "https://checkout.stripe.com/..." }
```

### Success/Cancel URLs
- **Success**: `/thank-you`
- **Cancel**: `/pricing` (firm) or `/` (individual)

---

## Testing Checklist

### Individual Plan
- [ ] User can purchase $149 one-time payment
- [ ] User redirected to `/thank-you` after payment
- [ ] User can upload 1 estimate
- [ ] User cannot upload more without purchasing again

### Firm Plan
- [ ] User can subscribe to $499/month plan
- [ ] User can upload up to 10 estimates per month
- [ ] Additional reviews are billed at $75 each
- [ ] Usage resets at billing cycle start
- [ ] Webhook updates `billing_period_start` correctly

### Pro Firm Plan
- [ ] User can subscribe to $1,499/month plan
- [ ] User can upload up to 40 estimates per month
- [ ] User cannot upload beyond 40 (hard cap enforced)
- [ ] Usage resets at billing cycle start
- [ ] No overage charges applied

### Webhooks
- [ ] `checkout.session.completed` updates profile correctly
- [ ] `customer.subscription.created` sets billing period
- [ ] `customer.subscription.updated` updates billing period
- [ ] `customer.subscription.deleted` resets to individual plan
- [ ] `invoice.payment_succeeded` resets usage on renewal

---

## Pricing Page

The pricing page is located at `/app/pricing/page.tsx`.

**Design Requirements:**
- ✅ Individual plan visually emphasized (blue border, larger)
- ✅ Firm plans secondary (gray border, smaller)
- ✅ No pricing tables
- ✅ No FAQ section
- ✅ No testimonials
- ✅ No feature comparisons
- ✅ Simple, clean layout

**Copy:**
- Exact copy as specified in prompt
- No deviations from approved messaging

---

## Support & Troubleshooting

### Common Issues

**Issue**: Webhook not receiving events
- **Solution**: Verify webhook URL in Stripe Dashboard
- **Solution**: Check `STRIPE_WEBHOOK_SECRET` is set correctly
- **Solution**: Test with Stripe CLI: `stripe listen --forward-to ...`

**Issue**: Usage not resetting at billing cycle
- **Solution**: Verify `invoice.payment_succeeded` webhook is enabled
- **Solution**: Check `billing_period_start` is updating in `profiles` table
- **Solution**: Verify trigger `trigger_reset_usage` exists in database

**Issue**: Overage charges not applying (Firm Plan)
- **Solution**: Check usage tracking logic in upload function
- **Solution**: Verify Stripe invoice item creation code
- **Solution**: Confirm `overage_price` is set to 75 in profile

**Issue**: Pro Plan allows more than 40 reviews
- **Solution**: Verify hard cap logic in upload function
- **Solution**: Check `included_reviews` is set to 40 in profile
- **Solution**: Ensure rejection occurs before file upload

---

## Maintenance

### Adding New Pricing Tiers
**Do not add new tiers.** The pricing model is fixed at three tiers.

### Changing Prices
1. Create new Price in Stripe (do not modify existing)
2. Update environment variable with new Price ID
3. Update copy in `/app/pricing/page.tsx`
4. Deploy changes

### Monitoring Usage
Query current usage:
```sql
SELECT 
  p.email,
  p.plan_type,
  p.included_reviews,
  ut.reviews_used,
  p.billing_period_start
FROM profiles p
LEFT JOIN usage_tracking ut ON ut.organization_id = p.id 
  AND ut.billing_period_start = p.billing_period_start
WHERE p.plan_type IN ('firm', 'pro')
ORDER BY p.created_at DESC;
```

---

## Production Deployment

1. ✅ Create Stripe products (live mode)
2. ✅ Set environment variables in Netlify
3. ✅ Run database migration
4. ✅ Configure Stripe webhook (live mode)
5. ✅ Test checkout flows
6. ✅ Verify webhook events
7. ✅ Monitor usage tracking
8. ✅ Deploy to production

---

**Last Updated**: December 16, 2025  
**Version**: 1.0  
**Status**: Production Ready

