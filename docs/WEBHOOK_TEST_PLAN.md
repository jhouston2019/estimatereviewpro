# Stripe Webhook Testing Protocol - Estimate Review Pro

## Overview

This document provides a comprehensive testing protocol for Stripe webhook integration. All webhook events must be tested in both development and production environments before going live.

---

## Prerequisites

### Development Environment
- Stripe CLI installed: `brew install stripe/stripe-cli/stripe` (Mac) or download from stripe.com
- Stripe account with test mode enabled
- Local development server running: `netlify dev`
- Supabase database accessible

### Production Environment
- Webhook endpoint configured in Stripe Dashboard
- Webhook signing secret stored in Netlify environment variables
- Production database accessible

---

## Test Scenarios

### 1. One-Off Purchase (`checkout.session.completed`)

**Scenario:** User purchases single $79 review

**Stripe CLI Command:**
```bash
stripe trigger checkout.session.completed \
  --add checkout_session:metadata.supabase_user_id=test-user-id-123 \
  --add checkout_session:metadata.tier=oneoff
```

**Expected Behavior:**
1. Webhook received and signature verified
2. `profiles` table updated:
   - `tier` = 'oneoff'
   - `subscription_status` = 'active'
   - `stripe_customer_id` = customer ID from event
3. User can now upload 1 estimate
4. Second upload attempt blocked with error message

**Database Verification:**
```sql
SELECT id, email, tier, subscription_status, stripe_customer_id
FROM profiles
WHERE id = 'test-user-id-123';
```

**Expected Result:**
```
id                  | email           | tier   | subscription_status | stripe_customer_id
--------------------|-----------------|--------|---------------------|-------------------
test-user-id-123    | test@test.com   | oneoff | active             | cus_xxxxx
```

---

### 2. Pro Subscription Purchase (`checkout.session.completed`)

**Scenario:** User subscribes to $249/month unlimited plan

**Stripe CLI Command:**
```bash
stripe trigger checkout.session.completed \
  --add checkout_session:metadata.supabase_user_id=test-user-id-456 \
  --add checkout_session:metadata.tier=pro \
  --add checkout_session:mode=subscription
```

**Expected Behavior:**
1. Webhook received and signature verified
2. `profiles` table updated:
   - `tier` = 'pro'
   - `subscription_status` = 'active'
   - `stripe_customer_id` = customer ID from event
3. User can upload unlimited estimates
4. No upload restrictions

**Database Verification:**
```sql
SELECT id, email, tier, subscription_status, stripe_customer_id
FROM profiles
WHERE id = 'test-user-id-456';
```

**Expected Result:**
```
id                  | email           | tier | subscription_status | stripe_customer_id
--------------------|-----------------|------|---------------------|-------------------
test-user-id-456    | test@test.com   | pro  | active             | cus_xxxxx
```

---

### 3. Subscription Created (`customer.subscription.created`)

**Scenario:** New subscription activated

**Stripe CLI Command:**
```bash
stripe trigger customer.subscription.created
```

**Expected Behavior:**
1. Webhook received and signature verified
2. Find user by `stripe_customer_id`
3. Update `profiles` table:
   - `subscription_status` = 'active'
   - `tier` = 'pro'
4. User gains unlimited access

**Database Verification:**
```sql
SELECT id, tier, subscription_status
FROM profiles
WHERE stripe_customer_id = 'cus_xxxxx';
```

---

### 4. Subscription Updated - Active (`customer.subscription.updated`)

**Scenario:** Subscription status changes to active (e.g., after payment retry)

**Stripe CLI Command:**
```bash
stripe trigger customer.subscription.updated \
  --add subscription:status=active
```

**Expected Behavior:**
1. Webhook received and signature verified
2. Find user by `stripe_customer_id`
3. Update `profiles` table:
   - `subscription_status` = 'active'
   - `tier` = 'pro'
4. User regains access

---

### 5. Subscription Updated - Past Due (`customer.subscription.updated`)

**Scenario:** Payment failed, subscription past due

**Stripe CLI Command:**
```bash
stripe trigger customer.subscription.updated \
  --add subscription:status=past_due
```

**Expected Behavior:**
1. Webhook received and signature verified
2. Find user by `stripe_customer_id`
3. Update `profiles` table:
   - `subscription_status` = 'past_due'
   - `tier` = 'pro' (keep Pro temporarily)
4. User still has access (grace period)
5. Display warning message in dashboard

**Note:** Consider adding grace period logic or immediate access revocation based on business requirements.

---

### 6. Subscription Updated - Cancelled (`customer.subscription.updated`)

**Scenario:** User cancels subscription

**Stripe CLI Command:**
```bash
stripe trigger customer.subscription.updated \
  --add subscription:status=canceled
```

**Expected Behavior:**
1. Webhook received and signature verified
2. Find user by `stripe_customer_id`
3. Update `profiles` table:
   - `subscription_status` = 'cancelled'
   - `tier` = 'free'
4. User loses Pro access
5. Cannot upload new estimates

---

### 7. Subscription Deleted (`customer.subscription.deleted`)

**Scenario:** Subscription permanently deleted

**Stripe CLI Command:**
```bash
stripe trigger customer.subscription.deleted
```

**Expected Behavior:**
1. Webhook received and signature verified
2. Find user by `stripe_customer_id`
3. Update `profiles` table:
   - `subscription_status` = 'cancelled'
   - `tier` = 'free'
4. User downgraded to free tier
5. Upload access revoked

---

### 8. Payment Failed (`invoice.payment_failed`)

**Scenario:** Subscription payment fails

**Stripe CLI Command:**
```bash
stripe trigger invoice.payment_failed
```

**Expected Behavior:**
1. Webhook received and logged
2. No immediate action (wait for subscription.updated)
3. Consider sending email notification (future enhancement)

**Note:** This event is informational. The `customer.subscription.updated` event will handle tier changes.

---

## Access Enforcement Tests

### Test 1: Free Tier Upload Block

**Setup:**
1. Create user with `tier = 'free'`
2. Login as user
3. Navigate to `/dashboard/upload`

**Expected:**
- Upload form shows error: "Please upgrade to a paid plan"
- Upload button disabled or shows upgrade prompt
- Clicking upload redirects to pricing page

**Verification:**
```typescript
// In upload page
if (tier === 'free') {
  return <UpgradePrompt />;
}
```

---

### Test 2: One-Off Limit Enforcement

**Setup:**
1. Create user with `tier = 'oneoff'`
2. Create 1 review record for user
3. Login as user
4. Navigate to `/dashboard/upload`

**Expected:**
- Upload form shows error: "You've already used your one-time review"
- Upgrade prompt displayed
- Cannot upload second estimate

**Verification:**
```sql
SELECT COUNT(*) as review_count
FROM reviews
WHERE user_id = 'test-user-id';
```

If `review_count >= 1` and `tier = 'oneoff'`, block upload.

---

### Test 3: Pro Unlimited Access

**Setup:**
1. Create user with `tier = 'pro'`
2. Create 10 review records for user
3. Login as user
4. Navigate to `/dashboard/upload`

**Expected:**
- Upload form fully functional
- No restrictions or warnings
- Can upload unlimited estimates

---

## Webhook Signature Verification

### Test 1: Valid Signature

**Setup:**
```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

**Trigger Event:**
```bash
stripe trigger checkout.session.completed
```

**Expected:**
- Webhook received
- Signature verified successfully
- Event processed
- Database updated

**Logs:**
```
✓ Webhook signature verified
✓ Event processed: checkout.session.completed
✓ Profile updated successfully
```

---

### Test 2: Invalid Signature

**Setup:**
Manually send POST request with invalid signature:

```bash
curl -X POST http://localhost:8888/.netlify/functions/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: invalid_signature" \
  -d '{"type": "checkout.session.completed"}'
```

**Expected:**
- Webhook rejected
- 400 error returned
- No database changes
- Error logged

**Logs:**
```
✗ Webhook signature verification failed
✗ Request rejected
```

---

### Test 3: Replay Attack Prevention

**Setup:**
1. Capture valid webhook payload and signature
2. Send same payload twice

**Expected:**
- First request: Processed successfully
- Second request: Rejected (Stripe prevents replay attacks)
- Idempotency maintained

---

## Double-Processing Prevention

### Test: Duplicate Webhook Events

**Scenario:** Stripe sends same event twice (rare but possible)

**Setup:**
1. Trigger `checkout.session.completed`
2. Immediately trigger same event again with same session ID

**Expected:**
- First event: Processes successfully
- Second event: Idempotent - no duplicate changes
- Database state unchanged after second event

**Implementation:**
```typescript
// Check if session already processed
const existingProfile = await supabase
  .from('profiles')
  .select('stripe_customer_id')
  .eq('stripe_customer_id', customerId)
  .single();

if (existingProfile && existingProfile.tier === targetTier) {
  console.log('Event already processed, skipping');
  return { statusCode: 200, body: 'Already processed' };
}
```

---

## Production Testing

### Pre-Production Checklist

- [ ] All test scenarios pass in development
- [ ] Webhook endpoint deployed to production
- [ ] Webhook signing secret configured in Netlify
- [ ] Stripe webhook endpoint configured in dashboard
- [ ] Test mode webhook tested end-to-end
- [ ] Live mode webhook ready to activate

### Production Webhook Setup

1. **Configure Endpoint in Stripe Dashboard:**
   - URL: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
   - Events: 
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed` (optional)

2. **Get Signing Secret:**
   - Copy webhook signing secret from Stripe Dashboard
   - Add to Netlify environment variables as `STRIPE_WEBHOOK_SECRET`

3. **Test with Real Payment:**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete checkout flow
   - Verify webhook received
   - Verify database updated
   - Verify access granted

---

## Monitoring & Debugging

### Stripe Dashboard

**Check Webhook Logs:**
1. Go to Developers > Webhooks
2. Click on your webhook endpoint
3. View "Recent events" tab
4. Check for failed events

**Look for:**
- ✓ 200 responses (success)
- ✗ 400/500 responses (errors)
- Response time < 5 seconds

### Netlify Function Logs

**Check Function Logs:**
1. Go to Netlify Dashboard
2. Click on your site
3. Go to Functions tab
4. Click on `stripe-webhook`
5. View logs

**Look for:**
- "Webhook signature verified"
- "Event processed: [event_type]"
- "Profile updated successfully"
- Any error messages

### Supabase Logs

**Check Database Logs:**
1. Go to Supabase Dashboard
2. Click on Logs
3. Filter by table: `profiles`
4. Look for UPDATE statements

---

## Troubleshooting

### Issue: Webhook Not Received

**Possible Causes:**
1. Incorrect endpoint URL
2. Firewall blocking requests
3. Function not deployed

**Solutions:**
1. Verify endpoint URL in Stripe Dashboard
2. Check Netlify deployment status
3. Test endpoint manually: `curl https://your-site.netlify.app/.netlify/functions/stripe-webhook`

---

### Issue: Signature Verification Fails

**Possible Causes:**
1. Wrong webhook secret
2. Secret not in environment variables
3. Request body modified

**Solutions:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Check Netlify environment variables
3. Ensure raw request body used for verification

---

### Issue: Database Not Updated

**Possible Causes:**
1. User ID not in metadata
2. Supabase connection failed
3. RLS policies blocking update

**Solutions:**
1. Verify metadata includes `supabase_user_id`
2. Check Supabase service role key
3. Verify RLS policies allow service role updates

---

### Issue: User Still Has Free Tier After Payment

**Possible Causes:**
1. Webhook not processed
2. Metadata missing
3. Database update failed

**Solutions:**
1. Check Stripe webhook logs
2. Check Netlify function logs
3. Manually update database:
```sql
UPDATE profiles
SET tier = 'oneoff', subscription_status = 'active'
WHERE id = 'user-id';
```

---

## Test Checklist

### Development Testing
- [ ] One-off purchase updates tier to 'oneoff'
- [ ] Pro subscription updates tier to 'pro'
- [ ] Subscription created activates Pro
- [ ] Subscription updated (active) maintains access
- [ ] Subscription updated (past_due) shows warning
- [ ] Subscription cancelled downgrades to free
- [ ] Subscription deleted downgrades to free
- [ ] Invalid signature rejected
- [ ] Duplicate events handled idempotently

### Access Control Testing
- [ ] Free tier blocked from upload
- [ ] One-off tier limited to 1 review
- [ ] Pro tier has unlimited access
- [ ] Tier enforcement works across all pages

### Production Testing
- [ ] Webhook endpoint accessible
- [ ] Test payment completes successfully
- [ ] Webhook received in production
- [ ] Database updated correctly
- [ ] User gains access immediately
- [ ] No errors in logs

---

## Automated Testing (Future Enhancement)

Consider implementing automated webhook tests:

```typescript
// Example test
describe('Stripe Webhooks', () => {
  it('should update tier on checkout.session.completed', async () => {
    const event = createMockStripeEvent('checkout.session.completed', {
      metadata: { supabase_user_id: 'test-id', tier: 'oneoff' }
    });
    
    const response = await handleWebhook(event);
    
    expect(response.statusCode).toBe(200);
    
    const profile = await getProfile('test-id');
    expect(profile.tier).toBe('oneoff');
  });
});
```

---

## Conclusion

This testing protocol ensures robust webhook handling and prevents revenue loss due to failed payment processing or access control issues.

**Before going live:**
1. Complete all test scenarios
2. Verify database updates
3. Test access enforcement
4. Monitor first few production webhooks closely

**After going live:**
1. Monitor webhook success rate
2. Set up alerts for failed webhooks
3. Review logs weekly
4. Test new scenarios as they arise

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Status:** Production Ready ✅

