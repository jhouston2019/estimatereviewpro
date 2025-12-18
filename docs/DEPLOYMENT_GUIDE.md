# ESTIMATE REVIEW PRO - DEPLOYMENT GUIDE

## NETLIFY DEPLOYMENT

### Prerequisites

1. Netlify account
2. GitHub repository (optional but recommended)
3. OpenAI API key
4. Domain name (optional)

---

## STEP 1: PREPARE FOR DEPLOYMENT

### 1.1 Environment Variables

Create a `.env` file (for local development):

```bash
OPENAI_API_KEY=sk-your-openai-key-here
URL=https://your-site.netlify.app
NODE_ENV=production
```

**DO NOT commit `.env` to Git!**

Add to `.gitignore`:

```
.env
.env.local
.env.production
```

### 1.2 Verify netlify.toml

Ensure `netlify.toml` is configured:

```toml
[build]
  command = "npm run build"
  publish = ".next"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### 1.3 Test Locally

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Start dev server
netlify dev

# Test functions
curl http://localhost:8888/.netlify/functions/estimate-classifier \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"text": "roof shingles", "lineItems": []}'

# Test frontend
open http://localhost:8888/upload-estimate.html
```

---

## STEP 2: DEPLOY TO NETLIFY

### Option A: Deploy via Netlify CLI

```bash
# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

### Option B: Deploy via GitHub

1. **Push to GitHub:**

```bash
git add .
git commit -m "Initial commit - Estimate Review Pro"
git push origin main
```

2. **Connect to Netlify:**

- Go to https://app.netlify.com
- Click "Add new site" → "Import an existing project"
- Choose GitHub
- Select your repository
- Configure build settings:
  - Build command: `npm run build`
  - Publish directory: `.next`
  - Functions directory: `netlify/functions`

3. **Deploy:**

- Click "Deploy site"
- Wait for build to complete

### Option C: Manual Deploy

```bash
# Build locally
npm run build

# Deploy manually
netlify deploy --prod --dir=.next
```

---

## STEP 3: CONFIGURE ENVIRONMENT VARIABLES

### In Netlify Dashboard:

1. Go to Site settings → Environment variables
2. Add the following:

```
OPENAI_API_KEY = sk-your-openai-key-here
URL = https://your-site.netlify.app
NODE_ENV = production
```

3. Click "Save"
4. Trigger a new deploy (Settings → Deploys → Trigger deploy)

---

## STEP 4: CONFIGURE CUSTOM DOMAIN (Optional)

### Add Custom Domain:

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `estimatereviewpro.com`)
4. Follow DNS configuration instructions

### Configure DNS:

Add these records to your DNS provider:

```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: your-site.netlify.app
```

### Enable HTTPS:

1. Go to Site settings → Domain management → HTTPS
2. Click "Verify DNS configuration"
3. Wait for SSL certificate provisioning (automatic)

---

## STEP 5: VERIFY DEPLOYMENT

### Test Functions:

```bash
# Test classifier
curl https://your-site.netlify.app/.netlify/functions/estimate-classifier \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"text": "roof shingles underlayment", "lineItems": []}'

# Test guardrails (should fail)
curl https://your-site.netlify.app/.netlify/functions/estimate-risk-guardrails \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"text": "help me negotiate"}'

# Test full analysis
curl https://your-site.netlify.app/.netlify/functions/analyze-estimate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"estimateText": "Remove shingles 200 SF\nInstall shingles 200 SF"}'
```

### Test Frontend:

1. Visit `https://your-site.netlify.app/upload-estimate.html`
2. Fill in the form
3. Submit an estimate
4. Verify results display correctly

---

## STEP 6: MONITORING & LOGS

### View Function Logs:

1. Go to Netlify Dashboard → Functions
2. Click on a function name
3. View logs and invocations

### View Deploy Logs:

1. Go to Deploys
2. Click on a deploy
3. View build logs

### Set Up Alerts:

1. Go to Site settings → Notifications
2. Add notifications for:
   - Deploy failures
   - Function errors
   - Form submissions (if applicable)

---

## STEP 7: SECURITY HARDENING

### 7.1 Add Security Headers

Create `netlify.toml` headers section:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
```

### 7.2 Rate Limiting

Consider using Netlify's rate limiting or add a service like:
- Cloudflare (free tier)
- AWS WAF
- Custom rate limiting in functions

### 7.3 API Key Protection

Ensure `OPENAI_API_KEY` is:
- Only in environment variables (never in code)
- Not exposed in client-side code
- Rotated regularly

---

## STEP 8: PERFORMANCE OPTIMIZATION

### 8.1 Function Optimization

In each function, add:

```javascript
// At top of file
exports.handler = async (event, context) => {
  // Prevent function from timing out
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Your code here
};
```

### 8.2 Caching

Add caching headers for static assets:

```toml
[[headers]]
  for = "/upload-estimate.html"
  [headers.values]
    Cache-Control = "public, max-age=3600"
```

### 8.3 Function Bundling

Netlify automatically bundles functions. To optimize:

```bash
# Install only production dependencies
npm install --production

# Or use esbuild for smaller bundles
npm install -D esbuild
```

---

## STEP 9: BACKUP & RECOVERY

### Backup Strategy:

1. **Code:** Stored in Git (GitHub/GitLab)
2. **Environment Variables:** Document in secure location
3. **Function Logs:** Export regularly from Netlify
4. **Database:** If added later, set up automated backups

### Recovery Plan:

1. Redeploy from Git repository
2. Restore environment variables
3. Verify all functions operational
4. Test frontend functionality

---

## STEP 10: CONTINUOUS DEPLOYMENT

### Enable Auto-Deploy:

1. Go to Site settings → Build & deploy
2. Enable "Auto publishing"
3. Set branch to deploy: `main` or `production`

### Deploy Contexts:

```toml
[context.production]
  environment = { NODE_ENV = "production" }

[context.deploy-preview]
  environment = { NODE_ENV = "staging" }

[context.branch-deploy]
  environment = { NODE_ENV = "development" }
```

### Deploy Previews:

- Automatic for pull requests
- Test before merging to main
- Unique URL for each preview

---

## TROUBLESHOOTING

### Function Not Found (404)

- Check `netlify.toml` functions path
- Verify file exists in `netlify/functions/`
- Check function name matches URL

### Function Timeout

- Increase timeout in `netlify.toml`:

```toml
[functions]
  node_bundler = "esbuild"
  [functions."analyze-estimate"]
    timeout = 30
```

### Environment Variables Not Working

- Verify in Netlify Dashboard → Environment variables
- Trigger new deploy after adding variables
- Check variable names match code

### CORS Errors

Add CORS headers:

```javascript
return {
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  },
  body: JSON.stringify(data)
};
```

### OpenAI API Errors

- Verify API key is correct
- Check OpenAI account has credits
- Review rate limits
- Check model availability

---

## COST ESTIMATION

### Netlify Costs:

- **Free Tier:**
  - 100GB bandwidth/month
  - 300 build minutes/month
  - 125k function invocations/month
  - 100 hours function runtime/month

- **Pro Tier ($19/month):**
  - 1TB bandwidth
  - Unlimited build minutes
  - Unlimited function invocations
  - Unlimited function runtime

### OpenAI Costs:

- **GPT-4:**
  - ~$0.03 per request (assuming 1500 tokens)
  - 100 requests = $3
  - 1000 requests = $30

### Total Monthly Cost (Estimated):

- Netlify Free: $0
- OpenAI (100 analyses): ~$3
- **Total: ~$3/month** (low usage)

For $149 one-time fee, break-even at ~50 analyses.

---

## MAINTENANCE CHECKLIST

### Weekly:
- [ ] Review function logs for errors
- [ ] Check OpenAI API usage
- [ ] Monitor site uptime

### Monthly:
- [ ] Review and rotate API keys
- [ ] Check for dependency updates
- [ ] Review user feedback
- [ ] Analyze usage patterns

### Quarterly:
- [ ] Security audit
- [ ] Performance review
- [ ] Update documentation
- [ ] Test all features end-to-end

---

## SUPPORT RESOURCES

- Netlify Docs: https://docs.netlify.com
- Netlify Community: https://answers.netlify.com
- OpenAI Docs: https://platform.openai.com/docs
- Next.js Docs: https://nextjs.org/docs

---

**Deployment complete! Your Estimate Review Pro system is live. 🚀**


