# Stripe Product Setup Guide

## Overview

Estimate Review Pro uses three Stripe products:
1. **Professional Estimate Review** - $149 one-time (Policyholders)
2. **Firm Plan** - $499/month with 10 reviews + $75 overage (Firms)
3. **Pro Firm Plan** - $1,499/month with 40 reviews, no overage (Pro Firms)

---

## Step 1: Create Stripe Products

### Product 1: Professional Estimate Review (One-Time)

**In Stripe Dashboard:**
1. Go to Products → Add Product
2. **Name**: `Professional Estimate Review`
3. **Description**: `Single professional estimate review for policyholders`
4. **Pricing**:
   - **Price**: `$149.00 USD`
   - **Billing**: `One time`
5. **Metadata** (click "Add metadata"):
   - `plan`: `individual`
   - `included_reviews`: `1`
6. Click **Save product**
7. **Copy the Price ID** (starts with `price_...`)
8. Add to `.env`: `STRIPE_PRICE_INDIVIDUAL_149=price_...`

---

### Product 2: Firm Plan (Subscription)

**In Stripe Dashboard:**
1. Go to Products → Add Product
2. **Name**: `Estimate Review Pro – Firm Plan`
3. **Description**: `Monthly subscription with 10 included reviews and $75 overage billing`
4. **Pricing**:
   - **Price**: `$499.00 USD`
   - **Billing**: `Recurring`
   - **Billing period**: `Monthly`
5. **Metadata** (click "Add metadata"):
   - `plan`: `firm`
   - `included_reviews`: `10`
   - `overage_price`: `75`
6. Click **Save product**
7. **Copy the Price ID** (starts with `price_...`)
8. Add to `.env`: `STRIPE_PRICE_FIRM_499=price_...`

---

### Product 3: Pro Firm Plan (Subscription)

**In Stripe Dashboard:**
1. Go to Products → Add Product
2. **Name**: `Estimate Review Pro – Pro Firm Plan`
3. **Description**: `Monthly subscription with 40 included reviews, no overage`
4. **Pricing**:
   - **Price**: `$1,499.00 USD`
   - **Billing**: `Recurring`
   - **Billing period**: `Monthly`
5. **Metadata** (click "Add metadata"):
   - `plan`: `pro`
   - `included_reviews`: `40`
   - `overage_price`: `0`
6. Click **Save product**
7. **Copy the Price ID** (starts with `price_...`)
8. Add to `.env`: `STRIPE_PRICE_PRO_1499=price_...`

---

## Step 2: Configure Webhook

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
4. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. **Copy the Signing secret** (starts with `whsec_...`)
7. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## Step 3: Environment Variables

Add all variables to:
- Local: `.env.local`
- Netlify: Site settings → Environment variables

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PRICE_INDIVIDUAL_149=price_...
STRIPE_PRICE_FIRM_499=price_...
STRIPE_PRICE_PRO_1499=price_...

# Site URL
SITE_URL=https://estimatereviewpro.com
```

---

## Step 4: Test Checkout Flows

### Test Individual Purchase
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/create-individual-checkout \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Test Firm Subscription
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/create-firm-checkout \
  -H "Content-Type: application/json" \
  -d '{"plan": "firm", "email": "test@example.com"}'
```

### Test Pro Firm Subscription
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/create-firm-checkout \
  -H "Content-Type: application/json" \
  -d '{"plan": "pro", "email": "test@example.com"}'
```

---

## Pricing Logic

### Policyholder (Individual)
- **Price**: $149 one-time
- **Includes**: 1 estimate review
- **No subscription**

### Firm Plan
- **Price**: $499/month
- **Includes**: 10 reviews per billing cycle
- **Overage**: $75 per additional review
- **Billing**: Automatic invoice items added at end of cycle

### Pro Firm Plan
- **Price**: $1,499/month
- **Includes**: 40 reviews per billing cycle
- **Overage**: None (hard cap at 40)
- **Enforcement**: Upload blocked after 40 reviews

---

## Usage Tracking

Usage is tracked in Supabase `organization_usage` table:
- `organization_id`: Stripe customer ID
- `billing_period_start`: Start of current billing cycle
- `reviews_used`: Count of reviews in current cycle
- `plan_type`: `individual`, `firm`, or `pro`

**Reset Logic:**
- Usage resets at the start of each billing cycle
- Triggered by `invoice.payment_succeeded` webhook
- Overage charges added before reset

---

## Support

For Stripe setup issues:
1. Check Stripe Dashboard logs
2. Verify webhook endpoint is receiving events
3. Check Netlify function logs
4. Verify all environment variables are set

---

**Last Updated**: December 16, 2025

