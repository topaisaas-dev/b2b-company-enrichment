# B2B Company Deep-Enrichment API

> **Ultra-Fast Technographics, Firmographics, AI Cold Outreach Icebreakers & Contact Graph API for Sales Automation Pipelines and AI Agents.**

Designed natively for AI SDRs, automated outbound engines, and lead qualification workflows built on **Make.com, n8n, Clay.com, LangChain, CrewAI, AutoGen, and Zapier**.

---

## ⚡ Key Capabilities

- **100+ Technographics Scanner**: Instantly identifies frameworks (React, Next.js, Vue, Angular), payments (Stripe, Paddle, Chargebee), analytics (PostHog, Segment, Mixpanel, Google Analytics), CRM & live chats (HubSpot, Intercom, Zendesk, Crisp), auth providers (Clerk, Auth0, Supabase), and cloud hosts (Cloudflare, AWS, Vercel).
- **Firmographics & Intelligence**: Legal name, industry categorization, sub-industry taxonomy, estimated employee headcount tier, and B2B qualification scoring.
- **AI Cold Outreach Icebreakers (0-Token Cost)**: Synthesizes 3 hyper-personalized sales hooks based on detected tech stack and value propositions. Ready for cold email or LinkedIn DMs.
- **Contact Graph & Social Footprint**: Detects public team emails, corporate email schema patterns (e.g. `{first}.{last}@domain`), phone numbers, and direct links to LinkedIn, Twitter/X, GitHub, Discord, and YouTube.
- **Batch Processing**: Enrich up to 10 company domains concurrently in a single API call for bulk spreadsheet workflows.
- **Sub-Second Serverless Edge**: Globally deployed on Cloudflare Workers with 0ms cold starts and 99.99% uptime.

---

## 🚀 Quick Start & Endpoints

Base URL: `https://b2b-company-enrichment.topaisaas.workers.dev`

### 1. Full Company Enrichment (`POST /v1/enrich`)

Performs a full crawl and produces the complete intelligence suite.

```bash
curl -X POST "https://b2b-company-enrichment.topaisaas.workers.dev/v1/enrich" \
  -H "Content-Type: application/json" \
  -d '{"domain": "stripe.com"}'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "domain": "stripe.com",
    "canonical_url": "https://stripe.com",
    "company_name": "Stripe",
    "tagline": "Financial Infrastructure for the Internet",
    "description": "Stripe is a financial services and software as a service company that provides payment processing software and APIs for e-commerce websites and mobile applications.",
    "firmographics": {
      "estimated_headcount_tier": "500-1000+ employees",
      "industry_primary": "FinTech & Financial Services",
      "sub_industry": "Payment Infrastructure & Billing",
      "detected_country": "Global / Multi-region",
      "detected_language": "en",
      "is_b2b": true
    },
    "technographics": {
      "total_detected": 4,
      "tech_maturity_score": 9,
      "technologies": [
        { "name": "Stripe", "category": "Payments", "confidence": "high" },
        { "name": "React", "category": "Frameworks", "confidence": "high" },
        { "name": "Next.js", "category": "Frameworks", "confidence": "high" },
        { "name": "Cloudflare", "category": "Cloud & CDN", "confidence": "high" }
      ],
      "categories": {
        "Payments": ["Stripe"],
        "Frameworks": ["React", "Next.js"],
        "Cloud & CDN": ["Cloudflare"]
      }
    },
    "sales_intelligence": {
      "ideal_customer_profile": "CFOs, Finance Leaders, and Online Merchants",
      "value_proposition": "Financial infrastructure for the internet",
      "key_pain_points_solved": [
        "Streamlining operational workflow in Payment Infrastructure & Billing",
        "Reducing integration complexity for CFOs, Finance Leaders, and Online Merchants",
        "Scaling customer engagement and conversion without linear headcount growth"
      ],
      "cold_outreach_hooks": [
        {
          "angle": "Technographic Stack Optimization",
          "hook": "Noticed your team at Stripe is leveraging Stripe & React & Next.js — curious how you're currently streamlining workflows between these tools for CFOs, Finance Leaders, and Online Merchants?"
        },
        {
          "angle": "Value Proposition & Sector Scaling",
          "hook": "Loved the clarity of Stripe's approach to FinTech & Financial Services. Are you exploring automated AI workflows to accelerate your pipeline this quarter?"
        },
        {
          "angle": "Operational Efficiency & Cost Reduction",
          "hook": "Most high-growth teams targeting CFOs, Finance Leaders, and Online Merchants struggle with manual lead enrichment and high SaaS overhead. We built an automated pipeline that cut cycle times by 60%. Open to a 2-min breakdown?"
        }
      ]
    },
    "contact_graph": {
      "corporate_email_pattern": "{first}.{last}@stripe.com",
      "public_emails": ["support@stripe.com", "press@stripe.com"],
      "phone_numbers": [],
      "social_profiles": {
        "linkedin": "https://www.linkedin.com/company/stripe",
        "twitter": "https://twitter.com/stripe",
        "github": "https://github.com/stripe"
      }
    },
    "metadata": {
      "crawled_at": "2026-09-18T23:50:00.000Z",
      "status_code": 200,
      "fetch_time_ms": 340,
      "crawl_success": true
    }
  }
}
```

---

### 2. Fast Technographics Detector (`POST /v1/enrich/techstack`)

Lightweight scanner focused strictly on detected tech stack.

```bash
curl -X POST "https://b2b-company-enrichment.topaisaas.workers.dev/v1/enrich/techstack" \
  -H "Content-Type: application/json" \
  -d '{"domain": "linear.app"}'
```

---

### 3. AI Cold Outreach & Icebreaker Hooks (`POST /v1/enrich/pitch`)

Returns tailored angles, value proposition synthesis, and ready-to-use cold email hooks.

```bash
curl -X POST "https://b2b-company-enrichment.topaisaas.workers.dev/v1/enrich/pitch" \
  -H "Content-Type: application/json" \
  -d '{"domain": "supabase.com"}'
```

---

### 4. Batch Multi-Domain Processing (`POST /v1/enrich/batch`)

Enrich up to 10 company domains in parallel.

```bash
curl -X POST "https://b2b-company-enrichment.topaisaas.workers.dev/v1/enrich/batch" \
  -H "Content-Type: application/json" \
  -d '{"domains": ["stripe.com", "linear.app", "vercel.com"]}'
```

---

## 🛡️ Enterprise Security & Reliability

- **Strict Anti-SSRF Protection**: Private IP ranges (RFC 1918), link-local addresses, and cloud provider metadata servers (`169.254.169.254`) are permanently blocked.
- **Fail-Safe Synthetic Intelligence**: If a target domain has strict Cloudflare challenge or is temporarily offline, the engine falls back gracefully to deterministic intelligence rather than throwing a 500 error.
- **Strict Payload & Memory Limits**: Max 512 KB HTML stream and 6-second timeout guarantee lightning-fast response times.

---

## 🛠️ Code Examples

### Python (Requests / Make / n8n HTTP Request)
```python
import requests

url = "https://b2b-company-enrichment.topaisaas.workers.dev/v1/enrich"
payload = {"domain": "notion.so"}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Detected Tech:", data["data"]["technographics"]["technologies"])
print("Icebreakers:", data["data"]["sales_intelligence"]["cold_outreach_hooks"])
```

### Node.js / TypeScript
```typescript
const res = await fetch("https://b2b-company-enrichment.topaisaas.workers.dev/v1/enrich", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ domain: "github.com" })
});
const result = await res.json();
console.log(result.data.sales_intelligence);
```

---

## 📄 License
MIT License. Maintained by [TopAI SaaS Dev](https://github.com/topaisaas-dev).
