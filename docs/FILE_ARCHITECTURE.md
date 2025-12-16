# File Architecture - Estimate Review Pro

## System Overview

Estimate Review Pro is a Next.js 16 application with serverless backend functions, AI-powered analysis, and Stripe payment integration. This document provides a complete map of the codebase.

---

## Directory Structure

```
estimatereviewpro/
├── app/                          # Next.js App Router (frontend pages)
├── components/                   # Reusable React components
├── lib/                          # Shared utilities and libraries
│   ├── ai/                       # AI prompts and logic
│   ├── pdf/                      # PDF generation
│   └── (supabase clients)        # Database clients
├── netlify/                      # Serverless backend
│   └── functions/                # API endpoints
├── docs/                         # Documentation
├── public/                       # Static assets
└── (config files)                # Project configuration
```

---

## `/app` - Frontend Pages (Next.js App Router)

### Core Pages

#### `/app/page.tsx`
**Purpose:** Landing page / homepage  
**Type:** Server Component  
**Public:** Yes  
**Features:**
- Hero section with value proposition
- How it works (3 steps)
- Feature showcase
- Pricing overview
- Social proof
- CTA buttons

**Key Elements:**
- Headline: "Understand your estimate. Win your claim."
- Upload estimate CTA
- Pricing link
- Feature cards (turnaround, formats, reports)

---

#### `/app/layout.tsx`
**Purpose:** Root layout wrapper  
**Type:** Server Component  
**Features:**
- HTML structure
- Global metadata
- Font loading
- Global CSS import
- Children wrapper

**Imports:**
- `./globals.css` - Tailwind styles
- Next.js metadata API

---

#### `/app/globals.css`
**Purpose:** Global styles and Tailwind directives  
**Contains:**
- Tailwind base, components, utilities
- Custom CSS variables
- Dark mode styles
- Typography overrides

---

### Authentication Pages

#### `/app/login/page.tsx`
**Purpose:** User login page  
**Type:** Server Component  
**Public:** Yes  
**Features:**
- Login form (client component)
- Redirect to dashboard after login
- Link to registration

**Components Used:**
- `<LoginForm />` from `/components/auth/`

---

#### `/app/register/page.tsx`
**Purpose:** User registration page  
**Type:** Server Component  
**Public:** Yes  
**Features:**
- Registration form (client component)
- Email + password signup
- Redirect to dashboard after signup
- Link to login

**Components Used:**
- `<RegisterForm />` from `/components/auth/`

---

### Dashboard Pages

#### `/app/dashboard/page.tsx`
**Purpose:** Main dashboard - review list  
**Type:** Server Component  
**Protected:** Yes (requires auth)  
**Features:**
- List all user's reviews
- Current plan display
- Upload new review button
- Download PDF links
- View details links

**Data Fetching:**
```typescript
const { data: reviews } = await supabase
  .from("reviews")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });
```

**Business Logic:**
- Shows tier (free/oneoff/pro)
- Upgrade prompts for non-Pro users
- Empty state for new users

---

#### `/app/dashboard/loading.tsx`
**Purpose:** Loading skeleton for dashboard  
**Type:** Server Component  
**Features:**
- Animated skeleton loaders
- Matches dashboard layout
- Smooth loading experience

---

#### `/app/dashboard/upload/page.tsx`
**Purpose:** Upload estimates and trigger analysis  
**Type:** Client Component  
**Protected:** Yes  
**Features:**
- Multi-file upload (contractor, carrier, report)
- Subscription tier checking
- Progress tracking
- API calls to Netlify functions
- Redirect to review details

**Business Logic:**
```typescript
// Check tier before upload
if (tier === 'free') {
  setError("Please upgrade to a paid plan");
  return;
}

if (tier === 'oneoff' && existingReviews.length > 0) {
  setError("You've already used your one-time review");
  return;
}
```

**Upload Flow:**
1. Validate files
2. Check subscription tier
3. Upload to Supabase Storage
4. Create review record
5. Trigger AI analysis pipeline
6. Show progress
7. Redirect to review page

---

#### `/app/dashboard/review/[id]/page.tsx`
**Purpose:** Display detailed analysis results  
**Type:** Server Component  
**Protected:** Yes  
**Features:**
- Financial summary (contractor vs carrier)
- Key findings
- Missing items table
- Underpriced items table
- Carrier letter summary
- Line items table
- PDF download button
- Re-run analysis button

**Data Fetching:**
```typescript
const { data: review } = await supabase
  .from("reviews")
  .select("*")
  .eq("id", params.id)
  .eq("user_id", user.id)
  .single();
```

**Sections:**
- Financial Summary (3 boxes)
- Key Findings (bullet list)
- Missing Items (table)
- Underpriced Items (comparison table)
- Carrier Letter Summary (if provided)
- Contractor Line Items (full table)

---

#### `/app/dashboard/review/[id]/loading.tsx`
**Purpose:** Loading skeleton for review details  
**Type:** Server Component  
**Features:**
- Skeleton loaders for all sections
- Matches review layout

---

#### `/app/dashboard/review/[id]/ReRunButton.tsx`
**Purpose:** Client component to re-run analysis  
**Type:** Client Component  
**Features:**
- Confirmation dialog
- API calls to re-run functions
- Loading state
- Page refresh after completion

---

### Account & Billing

#### `/app/account/page.tsx`
**Purpose:** Manage subscription and billing  
**Type:** Server Component  
**Protected:** Yes  
**Features:**
- Current plan display
- Upgrade options
- Stripe checkout integration
- Billing portal access
- Account details
- Sign out button

**Components Used:**
- `<CheckoutButton />` - Stripe checkout
- `<PortalButton />` - Billing portal

---

#### `/app/account/CheckoutButton.tsx`
**Purpose:** Initiate Stripe checkout  
**Type:** Client Component  
**Features:**
- Calls `create-checkout` function
- Redirects to Stripe Checkout
- Loading state

**Usage:**
```typescript
<CheckoutButton userId={user.id} priceType="oneoff" />
<CheckoutButton userId={user.id} priceType="pro" />
```

---

#### `/app/account/PortalButton.tsx`
**Purpose:** Open Stripe Customer Portal  
**Type:** Client Component  
**Features:**
- Calls `create-portal-session` function
- Redirects to Stripe Portal
- Loading state

---

### Marketing Pages

#### `/app/pricing/page.tsx`
**Purpose:** Pricing tiers and features  
**Type:** Server Component  
**Public:** Yes  
**Features:**
- Two pricing tiers ($79 one-off, $249/mo Pro)
- Feature comparison
- CTA buttons
- Trust indicators

---

#### `/app/estimate-review/page.tsx`
**Purpose:** Educational page about estimate reviews  
**Type:** Server Component  
**Public:** Yes  
**Features:**
- What is an estimate review
- Why it matters
- How it works
- CTA to upload

---

### API Routes

#### `/app/api/auth/signout/route.ts`
**Purpose:** Sign out endpoint  
**Type:** Route Handler  
**Method:** POST  
**Features:**
- Calls Supabase auth.signOut()
- Redirects to homepage

---

## `/components` - Reusable Components

### Authentication Components

#### `/components/auth/LoginForm.tsx`
**Purpose:** Login form with Supabase auth  
**Type:** Client Component  
**Features:**
- Email + password inputs
- Form validation
- Error handling
- Loading state
- Redirect after login

**State:**
```typescript
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

---

#### `/components/auth/RegisterForm.tsx`
**Purpose:** Registration form with Supabase auth  
**Type:** Client Component  
**Features:**
- Email + password inputs
- Password validation (min 8 chars)
- Error handling
- Loading state
- Redirect after signup

---

## `/lib` - Shared Libraries

### AI Prompts

#### `/lib/ai/prompts.ts`
**Purpose:** Production-ready OpenAI prompts  
**Size:** 850+ lines  
**Exports:**
- `ESTIMATE_EXTRACTION_SYSTEM` - System prompt for extraction
- `ESTIMATE_EXTRACTION_USER()` - User prompt generator
- `ESTIMATE_COMPARISON_SYSTEM` - System prompt for comparison
- `ESTIMATE_COMPARISON_USER()` - User prompt generator
- `REPORT_SUMMARY_SYSTEM` - System prompt for summarization
- `REPORT_SUMMARY_USER` - User prompt for reports
- Type definitions (ParsedLineItem, etc.)
- Validation functions

**Features:**
- Zero ambiguity prompts
- Defensive parsing
- OCR error handling
- Trade normalization
- JSON-only output

---

#### `/lib/ai/PROMPTS_DOCUMENTATION.md`
**Purpose:** Comprehensive prompt documentation  
**Size:** 500+ lines  
**Contents:**
- Prompt design principles
- Usage examples
- Testing guidelines
- Troubleshooting
- Cost analysis

---

### PDF Generation

#### `/lib/pdf/generator.ts`
**Purpose:** ClaimWorks-style PDF generator  
**Size:** 600+ lines  
**Exports:**
- `generatePDFReport(input)` - Main generator function
- `PDFInput` interface

**Features:**
- Professional header with branding
- Estimate summary section
- Comparison results
- Missing items table
- Underpriced items table
- Carrier report summary
- Footer with timestamp and disclaimer

**Styling:**
- Clean layout
- Wide margins
- Soft divider lines
- Bold section headings
- Table-style layouts
- Color-coded summaries

**Input:**
```typescript
interface PDFInput {
  comparison: EstimateComparisonResult;
  reportSummary?: ReportSummary;
  contractorItems: ParsedLineItem[];
  carrierItems?: ParsedLineItem[];
  reviewId?: string;
}
```

**Output:** Buffer (for upload to Supabase Storage)

---

### Supabase Clients

#### `/lib/supabaseClient.ts`
**Purpose:** Browser client for client components  
**Exports:**
- `createSupabaseBrowserClient()` - Creates browser client

**Usage:**
```typescript
const supabase = createSupabaseBrowserClient();
await supabase.auth.signInWithPassword({ email, password });
```

---

#### `/lib/supabaseServer.ts`
**Purpose:** Server clients for server components and routes  
**Exports:**
- `createSupabaseServerComponentClient()` - For server components
- `createSupabaseRouteHandlerClient()` - For API routes

**Usage:**
```typescript
const supabase = createSupabaseServerComponentClient();
const { data: { user } } = await supabase.auth.getUser();
```

---

#### `/lib/supabaseAdmin.ts`
**Purpose:** Admin client with service role key  
**Exports:**
- `createSupabaseAdminClient()` - Admin client

**Usage:** Only in serverless functions (never in browser)

---

#### `/lib/supabase-types.ts`
**Purpose:** TypeScript types for database schema  
**Exports:**
- `Database` interface
- Table types (`profiles`, `reviews`)
- Row/Insert/Update types

**Generated from:** Supabase CLI or manually defined

---

## `/netlify/functions` - Serverless Backend

### AI Analysis Functions

#### `/netlify/functions/analyze-estimate.ts`
**Purpose:** Extract line items from estimates  
**Trigger:** Called after file upload  
**Input:** `{ reviewId, fileUrl, fileType }`  
**Process:**
1. Download file from Supabase Storage
2. Convert to base64
3. Send to OpenAI Vision API
4. Parse line items
5. Save to `reviews.ai_analysis_json`

**Output:** Analysis result with line items

**Prompts Used:**
- `ESTIMATE_EXTRACTION_SYSTEM`
- `ESTIMATE_EXTRACTION_USER()`

---

#### `/netlify/functions/compare-estimates.ts`
**Purpose:** Compare contractor vs carrier estimates  
**Trigger:** Called after extraction complete  
**Input:** `{ reviewId }`  
**Process:**
1. Fetch contractor and carrier data
2. Use AI to compare
3. Identify missing/underpriced items
4. Generate summary
5. Save to `reviews.ai_comparison_json`

**Output:** Comparison result

**Prompts Used:**
- `ESTIMATE_COMPARISON_SYSTEM`
- `ESTIMATE_COMPARISON_USER()`

---

#### `/netlify/functions/summarize-report.ts`
**Purpose:** Summarize carrier letters  
**Trigger:** Called if carrier letter uploaded  
**Input:** `{ reviewId, reportUrl, fileType }`  
**Process:**
1. Download carrier letter
2. Send to OpenAI Vision
3. Extract summary and findings
4. Save to `reviews.ai_summary_json`

**Output:** Summary result

**Prompts Used:**
- `REPORT_SUMMARY_SYSTEM`
- `REPORT_SUMMARY_USER`

---

#### `/netlify/functions/generate-pdf.ts`
**Purpose:** Generate PDF reports  
**Trigger:** Called after all analysis complete  
**Input:** `{ reviewId }`  
**Process:**
1. Fetch all analysis data
2. Generate PDF with ClaimWorks-style layout
3. Upload to Supabase Storage
4. Update `reviews.pdf_report_url`

**Output:** PDF URL

**Uses:** `/lib/pdf/generator.ts`

---

### Payment Functions

#### `/netlify/functions/create-checkout.ts`
**Purpose:** Create Stripe checkout session  
**Trigger:** User clicks upgrade/purchase button  
**Input:** `{ userId, priceType, successUrl, cancelUrl }`  
**Process:**
1. Get or create Stripe customer
2. Create checkout session
3. Return session URL

**Output:** Stripe checkout URL

**Price Types:**
- `oneoff`: $79 one-time
- `pro`: $249/month subscription

---

#### `/netlify/functions/create-portal-session.ts`
**Purpose:** Create Stripe Customer Portal session  
**Trigger:** User clicks "Manage Billing"  
**Input:** `{ userId, returnUrl }`  
**Process:**
1. Get Stripe customer ID
2. Create portal session
3. Return portal URL

**Output:** Stripe portal URL

---

#### `/netlify/functions/stripe-webhook.ts`
**Purpose:** Handle Stripe webhook events  
**Trigger:** Stripe sends webhook  
**Input:** Stripe event payload  
**Process:**
1. Verify webhook signature
2. Handle event type
3. Update `profiles` table

**Events Handled:**
- `checkout.session.completed` - Payment complete
- `customer.subscription.created` - Subscription started
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled

**Security:** Signature verification with `STRIPE_WEBHOOK_SECRET`

---

## `/middleware.ts` - Route Protection

**Purpose:** Protect authenticated routes  
**Type:** Next.js Middleware  
**Features:**
- Check authentication status
- Redirect unauthenticated users to login
- Redirect authenticated users away from auth pages
- Preserve original destination

**Protected Routes:**
- `/dashboard/*`
- `/account`

**Auth Routes:**
- `/login`
- `/register`

---

## `/docs` - Documentation

#### `/docs/WEBHOOK_TEST_PLAN.md`
**Purpose:** Stripe webhook testing protocol  
**Size:** 800+ lines  
**Contents:**
- Test scenarios for all webhook events
- Expected database outcomes
- CLI testing commands
- Access enforcement tests
- Troubleshooting guide

---

#### `/docs/FILE_ARCHITECTURE.md`
**Purpose:** This file - complete system map  
**Contents:**
- Directory structure
- File-by-file explanations
- Data flow diagrams
- Integration points

---

## Configuration Files

### `/package.json`
**Purpose:** NPM dependencies and scripts  
**Key Dependencies:**
- `next@16.0.8` - Framework
- `react@19.2.1` - UI library
- `@supabase/supabase-js` - Database client
- `openai` - AI integration
- `stripe` - Payment processing
- `pdfkit` - PDF generation
- `@netlify/functions` - Serverless functions

**Scripts:**
- `dev` - Start development server
- `build` - Build for production
- `start` - Start production server
- `lint` - Run ESLint

---

### `/netlify.toml`
**Purpose:** Netlify deployment configuration  
**Settings:**
- Build command: `npm run build`
- Publish directory: `.next`
- Functions directory: `netlify/functions`
- Node version: 20
- Redirects and rewrites

---

### `/next.config.js`
**Purpose:** Next.js configuration  
**Settings:**
- React strict mode
- SWC minification
- Image domains
- Experimental features

---

### `/tsconfig.json`
**Purpose:** TypeScript compiler configuration  
**Settings:**
- Target: ES2020
- Module: ESNext
- Path aliases: `@/*` → `./*`
- Strict mode enabled

---

### `/tailwind.config.js`
**Purpose:** Tailwind CSS configuration  
**Settings:**
- Content paths (app, components)
- Theme extensions
- Custom colors
- Plugins

---

### `/postcss.config.js`
**Purpose:** PostCSS configuration  
**Plugins:**
- `tailwindcss`
- `autoprefixer`

---

### `/.gitignore`
**Purpose:** Git ignore rules  
**Ignores:**
- `node_modules/`
- `.next/`
- `.env*.local`
- `.netlify/`
- Build artifacts

---

### `/supabase-setup.sql`
**Purpose:** Database setup script  
**Creates:**
- `profiles` table
- `reviews` table
- RLS policies
- Storage buckets
- Triggers

---

## Data Flow

### Upload → Analysis → PDF

```
1. User uploads files
   └─► Supabase Storage (uploads bucket)

2. Review record created
   └─► Supabase Database (reviews table)

3. analyze-estimate function
   └─► OpenAI Vision API
   └─► Updates reviews.ai_analysis_json

4. compare-estimates function
   └─► OpenAI GPT-4o
   └─► Updates reviews.ai_comparison_json

5. summarize-report function (if letter provided)
   └─► OpenAI Vision API
   └─► Updates reviews.ai_summary_json

6. generate-pdf function
   └─► PDFKit (lib/pdf/generator.ts)
   └─► Supabase Storage (reports bucket)
   └─► Updates reviews.pdf_report_url

7. User redirected to review details
   └─► Display all results
   └─► Download PDF option
```

### Payment → Access

```
1. User clicks upgrade
   └─► create-checkout function
   └─► Stripe Checkout Session

2. User completes payment
   └─► Stripe webhook fires
   └─► stripe-webhook function
   └─► Updates profiles.tier

3. User can now upload
   └─► Business rules check tier
   └─► Allow or deny upload
```

---

## Integration Points

### External Services

1. **Supabase**
   - Authentication
   - PostgreSQL database
   - File storage
   - Row-level security

2. **OpenAI**
   - GPT-4o with Vision
   - Line item extraction
   - Estimate comparison
   - Report summarization

3. **Stripe**
   - Payment processing
   - Subscription management
   - Customer portal
   - Webhooks

4. **Netlify**
   - Hosting
   - Serverless functions
   - CDN
   - Continuous deployment

---

## Security Architecture

### Authentication
- Supabase Auth (email/password)
- Session-based access control
- Middleware protects routes

### Database
- Row-level security (RLS)
- Users can only access own data
- Service role key in functions only

### File Storage
- User-specific folders
- RLS policies on buckets
- Signed URLs for access

### API Security
- Environment variables secured
- HTTPS enforced
- Webhook signature verification

---

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start dev server with Netlify functions
netlify dev

# Runs on http://localhost:8888
```

### Testing
- Manual testing (see TESTING.md)
- Stripe CLI for webhook testing
- Test with sample PDFs

### Deployment
```bash
# Push to GitHub
git push origin main

# Netlify auto-deploys
# - Builds Next.js app
# - Deploys functions
# - Updates site
```

---

## File Count Summary

- **Total Files:** 50+
- **Frontend Pages:** 15
- **Components:** 4
- **Serverless Functions:** 7
- **Library Files:** 6
- **Documentation:** 10+
- **Configuration:** 8

---

## Lines of Code Summary

- **Frontend:** ~3,000 lines
- **Backend Functions:** ~1,500 lines
- **Libraries:** ~2,000 lines
- **Documentation:** ~5,000 lines
- **Total:** ~11,500 lines

---

## Quick Reference

### Adding a New Page
1. Create file in `/app/[route]/page.tsx`
2. Export default React component
3. Add to navigation if needed

### Adding a New Function
1. Create file in `/netlify/functions/[name].ts`
2. Export `handler` function
3. Deploy (auto-deploys with git push)

### Updating Prompts
1. Edit `/lib/ai/prompts.ts`
2. Test with sample documents
3. Update documentation

### Adding a New Component
1. Create file in `/components/[name].tsx`
2. Export component
3. Import where needed

---

## Conclusion

This architecture provides a complete, production-ready SaaS application with clear separation of concerns, security best practices, and scalable infrastructure.

**For new engineers:**
1. Start with `/app/page.tsx` to understand the user journey
2. Review `/lib/ai/prompts.ts` to understand AI logic
3. Check `/netlify/functions/` for backend logic
4. Read `DEPLOYMENT.md` for setup instructions

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Status:** Production Ready ✅

