# Testing Checklist - Estimate Review Pro

## Pre-Deployment Testing

### 1. Authentication Flow ✓

#### Registration
- [ ] Visit `/register`
- [ ] Enter email and password (min 8 chars)
- [ ] Submit form
- [ ] Verify redirect to dashboard
- [ ] Check profile created in Supabase `profiles` table
- [ ] Verify tier is set to 'free'

#### Login
- [ ] Visit `/login`
- [ ] Enter credentials
- [ ] Submit form
- [ ] Verify redirect to dashboard
- [ ] Test "redirectedFrom" parameter works

#### Protected Routes
- [ ] Try accessing `/dashboard` without login → redirects to `/login`
- [ ] Try accessing `/account` without login → redirects to `/login`
- [ ] Try accessing `/login` while logged in → redirects to `/dashboard`

### 2. Subscription & Billing ✓

#### Free Tier Restrictions
- [ ] Login as free user
- [ ] Go to `/dashboard/upload`
- [ ] Try to upload estimate
- [ ] Verify error: "Please upgrade to a paid plan"

#### One-Off Purchase ($79)
- [ ] Go to `/account`
- [ ] Click "Purchase" on one-off plan
- [ ] Redirected to Stripe Checkout
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete checkout
- [ ] Verify redirect to dashboard with success message
- [ ] Check `profiles` table: tier = 'oneoff', subscription_status = 'active'
- [ ] Verify can now upload estimates

#### One-Off Limit
- [ ] After using one-off review
- [ ] Try to upload another estimate
- [ ] Verify error: "You've already used your one-time review"

#### Pro Subscription ($249/mo)
- [ ] Go to `/account`
- [ ] Click "Upgrade Now" on Pro plan
- [ ] Complete Stripe checkout
- [ ] Verify redirect to dashboard
- [ ] Check `profiles` table: tier = 'pro', subscription_status = 'active'
- [ ] Upload multiple estimates (verify no limit)

#### Billing Portal
- [ ] As Pro subscriber, go to `/account`
- [ ] Click "Manage Billing"
- [ ] Verify redirect to Stripe Customer Portal
- [ ] Test updating payment method
- [ ] Test canceling subscription
- [ ] Verify tier downgraded to 'free' after cancellation

### 3. File Upload & Storage ✓

#### Upload Flow
- [ ] Go to `/dashboard/upload`
- [ ] Select contractor estimate (PDF or image)
- [ ] Optionally select carrier estimate
- [ ] Optionally select carrier letter
- [ ] Choose "Generate full review"
- [ ] Click "Start Analysis"
- [ ] Verify progress indicator shows
- [ ] Check Supabase Storage `uploads` bucket for files
- [ ] Verify files in user-specific folder (user_id/filename)

#### File Validation
- [ ] Try uploading without contractor estimate → error
- [ ] Try uploading non-PDF/image file → browser blocks
- [ ] Upload very large file (>10MB) → check behavior

### 4. AI Analysis Pipeline ✓

#### Analyze Estimate
- [ ] Upload contractor estimate
- [ ] Monitor Netlify function logs for `analyze-estimate`
- [ ] Verify OpenAI API called
- [ ] Check `reviews` table: `ai_analysis_json` populated
- [ ] Verify line items extracted correctly
- [ ] Check totals calculated

#### Compare Estimates
- [ ] Upload both contractor and carrier estimates
- [ ] Monitor `compare-estimates` function
- [ ] Verify `ai_comparison_json` populated
- [ ] Check missing items identified
- [ ] Check underpriced items identified
- [ ] Verify key findings generated

#### Summarize Report
- [ ] Upload carrier letter
- [ ] Monitor `summarize-report` function
- [ ] Verify `ai_summary_json` populated
- [ ] Check plain English summary generated
- [ ] Verify key findings extracted
- [ ] Check recommended next steps provided

#### Generate PDF
- [ ] After analysis complete
- [ ] Monitor `generate-pdf` function
- [ ] Verify PDF created in `reports` bucket
- [ ] Check `reviews` table: `pdf_report_url` populated
- [ ] Download PDF and verify content:
  - [ ] Header with branding
  - [ ] Financial summary
  - [ ] Missing items section
  - [ ] Underpriced items section
  - [ ] Carrier letter summary
  - [ ] Recommended next steps

### 5. Review Details Page ✓

#### Display
- [ ] After upload, redirected to `/dashboard/review/[id]`
- [ ] Verify financial summary displays
- [ ] Check key findings section
- [ ] Verify missing items table
- [ ] Check underpriced items table
- [ ] Verify carrier letter summary (if provided)
- [ ] Check line items table displays all items

#### Actions
- [ ] Click "Download PDF Report" → PDF downloads
- [ ] Click "Re-run Analysis" → confirm dialog
- [ ] Verify re-analysis completes
- [ ] Refresh page → see updated data

### 6. Dashboard ✓

#### Review List
- [ ] Go to `/dashboard`
- [ ] Verify all user's reviews listed
- [ ] Check most recent first (sorted by created_at DESC)
- [ ] Verify each review shows:
  - [ ] Created date/time
  - [ ] Status badge
  - [ ] "Download PDF" button (if PDF exists)
  - [ ] "View details" link

#### Empty State
- [ ] New user with no reviews
- [ ] Verify message: "No reviews yet"
- [ ] Check "New review" button visible

#### Plan Display
- [ ] Verify current plan shown correctly
- [ ] Free tier: "Free" with upgrade link
- [ ] One-off: "One-off" with count
- [ ] Pro: "Unlimited" with manage billing link

### 7. Error Handling ✓

#### Network Errors
- [ ] Disconnect internet
- [ ] Try uploading → verify error message
- [ ] Try checkout → verify error message

#### API Errors
- [ ] Invalid OpenAI key → check error handling
- [ ] Invalid Stripe key → check error handling
- [ ] Supabase down → check error handling

#### User Errors
- [ ] Upload without file → validation error
- [ ] Invalid email format → validation error
- [ ] Password too short → validation error

### 8. Loading States ✓

- [ ] Dashboard shows skeleton loaders while fetching
- [ ] Review details shows skeleton loaders
- [ ] Upload shows progress indicator
- [ ] Buttons show "Loading..." state when processing
- [ ] No flash of wrong content

### 9. Stripe Webhooks ✓

#### Test Webhook Events
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

- [ ] `checkout.session.completed` → tier updated
- [ ] `customer.subscription.created` → subscription_status = 'active'
- [ ] `customer.subscription.updated` → status updated
- [ ] `customer.subscription.deleted` → tier = 'free'

### 10. Security ✓

#### Row-Level Security
- [ ] User A cannot see User B's reviews
- [ ] User A cannot access User B's files
- [ ] Direct URL access to other user's review → 404

#### Authentication
- [ ] Cannot access API without auth
- [ ] Session expires after timeout
- [ ] Logout clears session

#### File Access
- [ ] Cannot access files outside user folder
- [ ] Public URLs work for own files
- [ ] Cannot guess/access other user files

## Performance Testing

### Load Testing
- [ ] Upload 10 estimates simultaneously
- [ ] Check function timeout limits
- [ ] Verify queue handling
- [ ] Monitor OpenAI rate limits

### File Size Testing
- [ ] 1MB PDF → works
- [ ] 5MB PDF → works
- [ ] 10MB PDF → check behavior
- [ ] 50MB PDF → should fail gracefully

### Response Times
- [ ] File upload: < 5 seconds
- [ ] AI analysis: < 60 seconds
- [ ] PDF generation: < 30 seconds
- [ ] Total pipeline: < 2 minutes

## Browser Testing

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive design works
- [ ] Touch interactions work

## Production Smoke Test

After deployment:

1. **Homepage**
   - [ ] Visit site → loads correctly
   - [ ] All links work
   - [ ] Images load
   - [ ] Styling correct

2. **Registration**
   - [ ] Register new account
   - [ ] Receive confirmation email (if enabled)
   - [ ] Can login

3. **Payment**
   - [ ] Purchase one-off review
   - [ ] Payment processes
   - [ ] Webhook received
   - [ ] Tier updated

4. **Upload**
   - [ ] Upload estimate
   - [ ] Analysis completes
   - [ ] PDF generated
   - [ ] Can download

5. **Monitoring**
   - [ ] Check Netlify function logs
   - [ ] Check Supabase logs
   - [ ] Check Stripe dashboard
   - [ ] Verify no errors

## Regression Testing

Run this checklist before each deployment to ensure no features broke.

## Test Data

### Test Credit Cards (Stripe)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

### Test Estimates
Create sample PDFs with:
- Simple line items (5-10 items)
- Complex estimates (50+ items)
- Different formats (Xactimate, Symbility, custom)
- Various file sizes

## Automated Testing (Future)

Consider adding:
- Unit tests (Jest)
- Integration tests (Playwright)
- E2E tests (Cypress)
- API tests (Postman/Newman)
- Load tests (k6)

## Bug Tracking

Document any issues found:
- Description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs
- Priority (P0-P3)
- Status (Open/In Progress/Fixed/Closed)

