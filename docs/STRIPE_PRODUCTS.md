# Stripe Products Configuration

## Products to Create in Stripe Dashboard

### Product 1: Policyholder (One-Time)

**Product Name**: Professional Estimate Review  
**Price**: $149  
**Billing**: One-time  
**Price ID**: Save as `STRIPE_PRICE_INDIVIDUAL_149`

**Metadata**:
```
plan: individual
included_reviews: 1
```

---

### Product 2: Firm Plan

**Product Name**: Estimate Review Pro – Firm Plan  
**Price**: $499 / month  
**Billing**: Recurring (monthly)  
**Price ID**: Save as `STRIPE_PRICE_FIRM_499`

**Metadata**:
```
plan: firm
included_reviews: 10
overage_price: 75
```

---

### Product 3: Pro Firm Plan

**Product Name**: Estimate Review Pro – Pro Firm Plan  
**Price**: $1,499 / month  
**Billing**: Recurring (monthly)  
**Price ID**: Save as `STRIPE_PRICE_PRO_1499`

**Metadata**:
```
plan: pro
included_reviews: 40
overage_price: 0
```

---

## Environment Variables Required

Add these to `.env.local` and Netlify:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_INDIVIDUAL_149=price_...
STRIPE_PRICE_FIRM_499=price_...
STRIPE_PRICE_PRO_1499=price_...
SITE_URL=https://estimatereviewpro.com
```

---

## Usage Rules

### Policyholder ($149)
- One-time payment
- Single submission per payment
- No subscription

### Firm Plan ($499/month)
- 10 reviews included per billing cycle
- Additional reviews billed at $75 each
- Usage resets at billing cycle

### Pro Firm Plan ($1,499/month)
- 40 reviews included per billing cycle
- Hard cap at 40 reviews
- No overage billing
- Usage resets at billing cycle

