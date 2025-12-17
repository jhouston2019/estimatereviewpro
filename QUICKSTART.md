# 🚀 ESTIMATE REVIEW PRO - QUICK START GUIDE

Get up and running in 5 minutes!

---

## ⚡ SUPER QUICK START

```bash
# 1. Install dependencies
npm install

# 2. Install Netlify CLI
npm install -g netlify-cli

# 3. Copy environment template
cp env.example .env

# 4. Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-key-here

# 5. Start the dev server
npm run netlify:dev

# 6. Open in browser
# http://localhost:8888/upload-estimate.html
```

---

## 📋 PREREQUISITES

- **Node.js 20+** - [Download](https://nodejs.org/)
- **OpenAI API Key** - [Get one](https://platform.openai.com/api-keys)
- **Netlify CLI** - Will be installed in step 2

---

## 🔧 DETAILED SETUP

### Step 1: Clone/Navigate to Project

```bash
cd estimatereviewpro
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- Next.js (framework)
- OpenAI SDK (AI generation)
- Supabase (optional, for auth)
- Stripe (optional, for payments)

### Step 3: Install Netlify CLI

```bash
npm install -g netlify-cli
```

Or use npx (no global install):

```bash
npx netlify-cli dev
```

### Step 4: Configure Environment

```bash
# Copy the example file
cp env.example .env

# Edit .env
nano .env  # or use your favorite editor
```

Add your OpenAI API key:

```bash
OPENAI_API_KEY=sk-your-actual-key-here
URL=http://localhost:8888
NODE_ENV=development
```

**Important:** Never commit `.env` to Git!

### Step 5: Start Development Server

```bash
npm run netlify:dev
```

This starts:
- Next.js dev server (port 3000)
- Netlify Functions (port 8888)
- Netlify Dev proxy (combines both)

### Step 6: Test the System

Open your browser to:

**Frontend:**
```
http://localhost:8888/upload-estimate.html
```

**Test API:**
```bash
curl -X POST http://localhost:8888/.netlify/functions/estimate-classifier \
  -H "Content-Type: application/json" \
  -d '{"text": "roof shingles underlayment flashing", "lineItems": []}'
```

Expected response:
```json
{
  "classification": "PROPERTY",
  "confidence": "HIGH",
  "scores": {
    "property": 3,
    "auto": 0,
    "commercial": 0
  }
}
```

---

## 🧪 RUN SAFETY TESTS

```bash
# Option 1: Direct Node execution
npm run test:safety

# Option 2: Via Netlify function
npm run test:functions

# Option 3: Via HTTP
curl http://localhost:8888/.netlify/functions/test-safety
```

Expected output:
```
🧪 ESTIMATE REVIEW PRO - SAFETY TEST SUITE

Testing against: http://localhost:8888

═══════════════════════════════════════════════════════════
✅ Valid Property Estimate
✅ Valid Auto Estimate
✅ Negotiation Request (Should Fail)
✅ Coverage Question (Should Fail)
✅ Legal Advice Request (Should Fail)
✅ Pricing Opinion Request (Should Fail)
✅ Demand Letter Request (Should Fail)
✅ Entitlement Language (Should Fail)
✅ Unknown Document Type (Should Fail)
✅ Ambiguous Estimate (Should Fail)
═══════════════════════════════════════════════════════════

📊 Results: 10 passed, 0 failed out of 10 tests

🎉 All safety tests passed! System is properly guarded.
```

---

## 📝 TRY IT OUT

### Example 1: Valid Property Estimate

1. Go to http://localhost:8888/upload-estimate.html
2. Select "Property Damage"
3. Select "Water Damage"
4. Paste this estimate:

```
Remove damaged drywall - 200 SF
Install new drywall - 200 SF
Tape and mud drywall - 200 SF
Prime walls - 200 SF
Paint walls - 200 SF
Remove damaged flooring - 150 SF
Install new flooring - 150 SF
```

5. Check the acknowledgement box
6. Click "Analyze Estimate"
7. Review the findings report

### Example 2: Test Guardrails (Should Fail)

Try pasting this in the estimate field:

```
Help me negotiate with the insurance adjuster to get more money
```

Expected: Error message about prohibited content

### Example 3: Valid Auto Estimate

1. Select "Auto/Vehicle Damage"
2. Select "Collision"
3. Paste:

```
Replace front bumper
Repair left fender
Paint and blend 3 panels
Replace headlight assembly
Align front end
```

4. Submit and review results

---

## 🎯 WHAT TO EXPECT

### Valid Estimate → Success

You'll see a report with:
- **Classification:** PROPERTY / AUTO / COMMERCIAL
- **Summary:** Overview of findings
- **Included Categories:** What was detected
- **Potential Omissions:** What was NOT detected
- **Potential Under-Scoping:** Issues found
- **Limitations:** Clear disclaimers

### Invalid Request → Blocked

You'll see an error:
- "Prohibited content detected"
- "This system provides neutral estimate analysis only"
- List of violations found

### Unknown Document → Rejected

You'll see:
- "Unable to classify estimate type"
- "Insufficient recognizable line items"

---

## 🔍 TROUBLESHOOTING

### "Cannot find module 'openai'"

```bash
npm install
```

### "OPENAI_API_KEY is not defined"

1. Check `.env` file exists
2. Check key is set: `OPENAI_API_KEY=sk-...`
3. Restart dev server

### "Function not found" (404)

1. Check `netlify.toml` functions path
2. Verify file exists in `netlify/functions/`
3. Restart dev server

### Port 8888 already in use

```bash
# Kill the process
lsof -ti:8888 | xargs kill -9

# Or use a different port
netlify dev --port 9999
```

### Tests fail

1. Ensure dev server is running
2. Check `URL` in `.env` matches server
3. Review error messages

---

## 📚 NEXT STEPS

### Learn More

- Read `docs/SYSTEM_SAFETY.md` - Understand constraints
- Read `docs/API_DOCUMENTATION.md` - API reference
- Read `docs/ESTIMATE_REVIEW_PRO_README.md` - Full guide

### Deploy to Production

- Read `docs/DEPLOYMENT_GUIDE.md` - Step-by-step deployment

### Customize

- Edit `netlify/functions/estimate-classifier.js` - Add keywords
- Edit `netlify/functions/estimate-risk-guardrails.js` - Add prohibitions
- Edit `public/upload-estimate.html` - Customize UI

---

## 🎨 CUSTOMIZE THE FRONTEND

The upload page is at `public/upload-estimate.html`

**Change colors:**

```css
/* Find this in the <style> section */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Change to your brand colors */
background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
```

**Add your logo:**

```html
<!-- In the header section -->
<div class="header">
    <img src="/your-logo.png" alt="Logo" style="height: 50px;">
    <h1>📊 Your Company Name</h1>
    <p>Procedural Insurance Estimate Analysis</p>
</div>
```

---

## 🚀 DEPLOY TO PRODUCTION

When you're ready:

```bash
# Login to Netlify
netlify login

# Deploy
npm run netlify:deploy
```

Or connect to GitHub for automatic deployments.

See `docs/DEPLOYMENT_GUIDE.md` for full instructions.

---

## 💡 TIPS

1. **Start with safety tests** - Verify guardrails work
2. **Test all estimate types** - Property, Auto, Commercial
3. **Try to break it** - Test prohibited requests
4. **Read the limitations** - Understand what it does NOT do
5. **Keep temperature at 0.2** - Don't change this!

---

## ⚠️ IMPORTANT REMINDERS

- This is NOT a chatbot
- This does NOT negotiate
- This does NOT interpret coverage
- This does NOT provide legal advice
- This does NOT give pricing opinions
- Output is neutral and boring (by design!)

---

## 🎉 YOU'RE READY!

Your Estimate Review Pro system is now running locally.

**Test it thoroughly before deploying to production.**

Questions? Check the docs in `docs/` folder.

---

**Happy analyzing! 📊**

