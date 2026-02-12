# Stripe Setup Instructions

## 1. Create Stripe Products

### Product 1: Single Estimate Review
- **Name**: Single Estimate Review
- **Type**: One-time payment
- **Price**: $49.00 USD
- **Description**: One-time estimate review with 30-day access

**Steps:**
1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Name: "Single Estimate Review"
4. Add price: $49.00 one-time
5. Copy the Price ID (starts with `price_...`)
6. Add to `.env` as `STRIPE_PRICE_SINGLE_REVIEW`

### Product 2: Professional Subscription
- **Name**: Professional Plan
- **Type**: Recurring subscription
- **Price**: $299.00 USD/month
- **Description**: 50 reviews per month, up to 5 users, comparison mode

**Steps:**
1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Name: "Professional Plan"
4. Add price: $299.00 recurring monthly
5. Copy the Price ID
6. Add to `.env` as `STRIPE_PRICE_PROFESSIONAL`

**Overage Pricing:**
1. Add another price to the same product
2. Name: "Professional Overage"
3. Type: Usage-based (metered)
4. Price: $29.00 per unit
5. Copy the Price ID
6. Add to `.env` as `STRIPE_PRICE_PROFESSIONAL_OVERAGE`

### Product 3: Enterprise Subscription
- **Name**: Enterprise Plan
- **Type**: Recurring subscription
- **Price**: $599.00 USD/month
- **Description**: 150 reviews per month, unlimited users, API access

**Steps:**
1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Name: "Enterprise Plan"
4. Add price: $599.00 recurring monthly
5. Copy the Price ID
6. Add to `.env` as `STRIPE_PRICE_ENTERPRISE`

**Overage Pricing:**
1. Add another price to the same product
2. Name: "Enterprise Overage"
3. Type: Usage-based (metered)
4. Price: $19.00 per unit
5. Copy the Price ID
6. Add to `.env` as `STRIPE_PRICE_ENTERPRISE_OVERAGE`

## 2. Configure Webhook

### Create Webhook Endpoint
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/webhook`
4. Description: "Estimate Review Pro Webhook"
5. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

6. Copy the Signing Secret (starts with `whsec_...`)
7. Add to `.env` as `STRIPE_WEBHOOK_SECRET`

## 3. Get API Keys

### Test Mode
1. Go to Stripe Dashboard → Developers → API keys
2. Copy "Publishable key" (starts with `pk_test_...`)
3. Add to `.env` as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Copy "Secret key" (starts with `sk_test_...`)
5. Add to `.env` as `STRIPE_SECRET_KEY`

### Production Mode
- Switch to Live mode in Stripe Dashboard
- Repeat steps above with live keys
- Update `.env.production` with live keys

## 4. Test Mode Setup

### Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

### Test Webhook Locally
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhook

# This will give you a webhook signing secret for local testing
# Add it to .env.local as STRIPE_WEBHOOK_SECRET
```

## 5. Environment Variables Summary

```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs
STRIPE_PRICE_SINGLE_REVIEW=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_ENTERPRISE=price_...
STRIPE_PRICE_PROFESSIONAL_OVERAGE=price_...
STRIPE_PRICE_ENTERPRISE_OVERAGE=price_...
```

## 6. Verification Checklist

- [ ] All 3 products created in Stripe
- [ ] All 5 price IDs copied to `.env`
- [ ] Webhook endpoint configured
- [ ] Webhook secret copied to `.env`
- [ ] API keys copied to `.env`
- [ ] Test mode verified with test cards
- [ ] Webhook tested locally with Stripe CLI

## 7. Go Live Checklist

- [ ] Switch to Live mode in Stripe
- [ ] Create live versions of all products
- [ ] Update `.env.production` with live keys
- [ ] Configure live webhook endpoint
- [ ] Test live checkout flow
- [ ] Monitor Stripe Dashboard for events
