# Project Structure - Estimate Review Pro

Complete file tree with descriptions.

```
estimatereviewpro/
│
├── app/                                    # Next.js 16 App Router
│   ├── account/                           # Account & Billing Management
│   │   ├── page.tsx                       # Account page (server component)
│   │   ├── CheckoutButton.tsx             # Client component for Stripe checkout
│   │   └── PortalButton.tsx               # Client component for billing portal
│   │
│   ├── api/                               # API Routes
│   │   └── auth/
│   │       └── signout/
│   │           └── route.ts               # Sign out endpoint
│   │
│   ├── dashboard/                         # Protected Dashboard Area
│   │   ├── page.tsx                       # Main dashboard (review list)
│   │   ├── loading.tsx                    # Dashboard loading skeleton
│   │   ├── upload/
│   │   │   └── page.tsx                   # Upload estimates page (with full logic)
│   │   └── review/
│   │       └── [id]/
│   │           ├── page.tsx               # Review details page
│   │           ├── loading.tsx            # Review loading skeleton
│   │           └── ReRunButton.tsx        # Client component to re-run analysis
│   │
│   ├── estimate-review/                   # Public info page
│   │   └── page.tsx                       # "What is this?" page
│   │
│   ├── login/                             # Authentication
│   │   └── page.tsx                       # Login page
│   │
│   ├── pricing/                           # Pricing page
│   │   └── page.tsx                       # Pricing tiers display
│   │
│   ├── register/                          # Registration
│   │   └── page.tsx                       # Sign up page
│   │
│   ├── globals.css                        # Global styles (Tailwind)
│   ├── layout.tsx                         # Root layout
│   └── page.tsx                           # Homepage (marketing)
│
├── components/                            # Reusable React Components
│   └── auth/
│       ├── LoginForm.tsx                  # Login form with Supabase auth
│       └── RegisterForm.tsx               # Registration form with Supabase auth
│
├── lib/                                   # Utilities & Helpers
│   ├── supabase-types.ts                  # TypeScript types for database
│   ├── supabaseAdmin.ts                   # Supabase admin client (service role)
│   ├── supabaseClient.ts                  # Supabase browser client
│   └── supabaseServer.ts                  # Supabase server clients
│
├── netlify/                               # Netlify Serverless Functions
│   └── functions/
│       ├── analyze-estimate.ts            # Extract line items with OpenAI Vision
│       ├── compare-estimates.ts           # Compare contractor vs carrier
│       ├── summarize-report.ts            # Summarize carrier letters
│       ├── generate-pdf.ts                # Generate PDF reports with PDFKit
│       ├── create-checkout.ts             # Create Stripe checkout session
│       ├── create-portal-session.ts       # Create Stripe customer portal session
│       └── stripe-webhook.ts              # Handle Stripe webhook events
│
├── public/                                # Static Assets
│   └── (images, fonts, etc.)
│
├── .env.example                           # Environment variables template
├── .gitignore                             # Git ignore rules
├── DEPLOYMENT.md                          # Comprehensive deployment guide
├── IMPLEMENTATION_SUMMARY.md              # This implementation summary
├── next.config.js                         # Next.js configuration
├── netlify.toml                           # Netlify build & deploy config
├── package.json                           # Dependencies & scripts
├── postcss.config.js                      # PostCSS configuration
├── PROJECT_STRUCTURE.md                   # This file
├── QUICKSTART.md                          # 15-minute quick start guide
├── README.md                              # Project overview & features
├── supabase-setup.sql                     # Database setup SQL script
├── tailwind.config.js                     # Tailwind CSS configuration
├── TESTING.md                             # Complete testing checklist
└── tsconfig.json                          # TypeScript configuration
```

---

## Key Files Explained

### Frontend (Next.js App)

#### `/app/page.tsx`
- **Purpose**: Homepage / landing page
- **Features**: Hero section, feature showcase, pricing links
- **Type**: Server component
- **Public**: Yes

#### `/app/dashboard/page.tsx`
- **Purpose**: User dashboard showing all reviews
- **Features**: Review list, plan status, upload button
- **Type**: Server component (fetches data)
- **Protected**: Yes (requires auth)

#### `/app/dashboard/upload/page.tsx`
- **Purpose**: Upload estimates and trigger analysis
- **Features**: 
  - File upload for contractor/carrier/report
  - Subscription tier checking
  - Progress tracking
  - API calls to Netlify functions
- **Type**: Client component (form handling)
- **Protected**: Yes

#### `/app/dashboard/review/[id]/page.tsx`
- **Purpose**: Display detailed analysis results
- **Features**:
  - Financial summary
  - Missing items
  - Underpriced items
  - Carrier letter summary
  - Line items table
  - PDF download
- **Type**: Server component (fetches review data)
- **Protected**: Yes

#### `/app/account/page.tsx`
- **Purpose**: Manage subscription and billing
- **Features**:
  - Current plan display
  - Upgrade options
  - Stripe checkout integration
  - Billing portal access
- **Type**: Server component
- **Protected**: Yes

---

### Backend (Netlify Functions)

#### `/netlify/functions/analyze-estimate.ts`
- **Trigger**: Called after file upload
- **Input**: `{ reviewId, fileUrl, fileType }`
- **Process**:
  1. Download file from Supabase Storage
  2. Convert to base64
  3. Send to OpenAI Vision API
  4. Parse line items
  5. Save to `reviews.ai_analysis_json`
- **Output**: Analysis result with line items

#### `/netlify/functions/compare-estimates.ts`
- **Trigger**: Called after contractor estimate analyzed
- **Input**: `{ reviewId }`
- **Process**:
  1. Fetch contractor and carrier data
  2. Use AI to compare
  3. Identify missing/underpriced items
  4. Generate summary
  5. Save to `reviews.ai_comparison_json`
- **Output**: Comparison result

#### `/netlify/functions/summarize-report.ts`
- **Trigger**: Called if carrier letter uploaded
- **Input**: `{ reviewId, reportUrl, fileType }`
- **Process**:
  1. Download carrier letter
  2. Send to OpenAI Vision
  3. Extract summary and findings
  4. Save to `reviews.ai_summary_json`
- **Output**: Summary result

#### `/netlify/functions/generate-pdf.ts`
- **Trigger**: Called after all analysis complete
- **Input**: `{ reviewId }`
- **Process**:
  1. Fetch all analysis data
  2. Generate PDF with PDFKit
  3. Upload to Supabase Storage
  4. Update `reviews.pdf_report_url`
- **Output**: PDF URL

#### `/netlify/functions/create-checkout.ts`
- **Trigger**: User clicks upgrade/purchase button
- **Input**: `{ userId, priceType, successUrl, cancelUrl }`
- **Process**:
  1. Get or create Stripe customer
  2. Create checkout session
  3. Return session URL
- **Output**: Stripe checkout URL

#### `/netlify/functions/stripe-webhook.ts`
- **Trigger**: Stripe sends webhook events
- **Input**: Stripe event payload
- **Process**:
  1. Verify webhook signature
  2. Handle event (checkout complete, subscription change)
  3. Update `profiles` table
- **Output**: Success confirmation

---

### Database (Supabase)

#### `profiles` Table
```sql
id                    UUID (PK, FK to auth.users)
email                 TEXT
created_at            TIMESTAMPTZ
stripe_customer_id    TEXT
subscription_status   TEXT
tier                  TEXT ('free', 'oneoff', 'pro')
```

#### `reviews` Table
```sql
id                        UUID (PK)
user_id                   UUID (FK to profiles)
contractor_estimate_url   TEXT
carrier_estimate_url      TEXT
ai_analysis_json          JSONB
ai_comparison_json        JSONB
ai_summary_json           JSONB
pdf_report_url            TEXT
created_at                TIMESTAMPTZ
```

#### Storage Buckets
- `uploads`: User-uploaded files (estimates, letters)
- `reports`: Generated PDF reports

---

### Configuration Files

#### `package.json`
- Dependencies: Next.js, React, Supabase, OpenAI, Stripe, PDFKit
- Scripts: dev, build, start, lint

#### `next.config.js`
- Next.js configuration
- Image domains, experimental features

#### `tsconfig.json`
- TypeScript compiler options
- Path aliases (@/*)

#### `tailwind.config.js`
- Tailwind CSS configuration
- Custom colors, theme extensions

#### `netlify.toml`
- Build command and settings
- Functions configuration
- Redirects
- Environment

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
   └─► PDFKit
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

## Security Architecture

### Row-Level Security (RLS)
- Users can only see their own profiles
- Users can only see their own reviews
- Users can only access their own files

### Authentication
- Supabase Auth handles all auth
- Middleware protects routes
- Session-based access control

### API Security
- Service role key only in serverless functions
- Webhook signature verification
- Environment variables secured

---

## Deployment Architecture

```
GitHub Repository
    ↓
Netlify Build
    ├─► Next.js Build (.next/)
    ├─► Serverless Functions (netlify/functions/)
    └─► Static Assets (public/)
    ↓
Netlify CDN
    ├─► Frontend (Next.js pages)
    ├─► API Routes (/.netlify/functions/*)
    └─► Static files
    ↓
External Services
    ├─► Supabase (Database + Storage + Auth)
    ├─► OpenAI (AI Analysis)
    └─► Stripe (Payments)
```

---

## Development Workflow

1. **Local Development**
   ```bash
   netlify dev
   ```
   - Runs Next.js dev server
   - Runs Netlify functions locally
   - Hot reload enabled

2. **Testing**
   - Manual testing (see TESTING.md)
   - Test with Stripe test cards
   - Test with sample PDFs

3. **Deployment**
   ```bash
   git push origin main
   ```
   - Netlify auto-deploys
   - Runs build command
   - Deploys functions
   - Updates site

---

## File Naming Conventions

- **Pages**: `page.tsx` (Next.js App Router convention)
- **Layouts**: `layout.tsx`
- **Loading**: `loading.tsx`
- **Components**: PascalCase (e.g., `LoginForm.tsx`)
- **Functions**: kebab-case (e.g., `analyze-estimate.ts`)
- **Utilities**: camelCase (e.g., `supabaseClient.ts`)

---

## Import Patterns

```typescript
// Next.js imports
import Link from "next/link";
import { useRouter } from "next/navigation";

// React imports
import { useState, useEffect } from "react";

// Local imports (using @ alias)
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { LoginForm } from "@/components/auth/LoginForm";

// External packages
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Stripe from "stripe";
```

---

## Environment Variables

### Required for Development
```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_SITE_URL
URL
```

### Prefix Meanings
- `NEXT_PUBLIC_*`: Available in browser
- No prefix: Server-only (secure)

---

This structure provides a complete, production-ready SaaS application with clear separation of concerns, security best practices, and scalable architecture.

