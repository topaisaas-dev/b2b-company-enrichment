import { Hono } from "hono";
import { cors } from "hono/cors";
import { validateAndNormalizeDomain, validateBatchDomains, sanitizeInput } from "./security";
import { enrichCompany } from "./enrichment_engine";

const app = new Hono();

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-RapidAPI-Key", "X-RapidAPI-Host"]
}));

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  c.header("X-Response-Time", `${ms}ms`);
  c.header("X-Powered-By", "TopAI-B2B-Enrichment");
});

app.get("/v1/health", (c) => {
  return c.json({
    status: "healthy",
    service: "b2b-company-enrichment",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

/**
 * 1. POST /v1/enrich - Deep B2B Company Profiling
 */
app.post("/v1/enrich", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const rawTarget = body.domain || body.url;

    if (!rawTarget) {
      return c.json({
        success: false,
        error: "Missing required parameter: 'domain' (e.g. 'stripe.com') or 'url' (e.g. 'https://stripe.com')"
      }, 400);
    }

    const { domain, url } = validateAndNormalizeDomain(rawTarget);
    const enrichment = await enrichCompany(domain, url);

    return c.json({
      success: true,
      data: enrichment
    });
  } catch (err: any) {
    return c.json({
      success: false,
      error: err.message || "Failed to enrich company"
    }, 400);
  }
});

/**
 * GET /v1/enrich - Convenient GET endpoint
 */
app.get("/v1/enrich", async (c) => {
  try {
    const rawTarget = c.req.query("domain") || c.req.query("url");

    if (!rawTarget) {
      return c.json({
        success: false,
        error: "Missing query parameter: '?domain=example.com' or '?url=https://example.com'"
      }, 400);
    }

    const { domain, url } = validateAndNormalizeDomain(rawTarget);
    const enrichment = await enrichCompany(domain, url);

    return c.json({
      success: true,
      data: enrichment
    });
  } catch (err: any) {
    return c.json({
      success: false,
      error: err.message || "Failed to enrich company"
    }, 400);
  }
});

/**
 * 2. POST /v1/enrich/techstack - Technographics Only
 */
app.post("/v1/enrich/techstack", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const rawTarget = body.domain || body.url;

    if (!rawTarget) {
      return c.json({
        success: false,
        error: "Missing required parameter: 'domain' or 'url'"
      }, 400);
    }

    const { domain, url } = validateAndNormalizeDomain(rawTarget);
    const enrichment = await enrichCompany(domain, url);

    return c.json({
      success: true,
      domain: enrichment.domain,
      canonical_url: enrichment.canonical_url,
      technographics: enrichment.technographics
    });
  } catch (err: any) {
    return c.json({
      success: false,
      error: err.message || "Failed to detect tech stack"
    }, 400);
  }
});

/**
 * 3. POST /v1/enrich/pitch - AI Sales Outreach & Icebreaker Hooks
 */
app.post("/v1/enrich/pitch", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const rawTarget = body.domain || body.url;

    if (!rawTarget) {
      return c.json({
        success: false,
        error: "Missing required parameter: 'domain' or 'url'"
      }, 400);
    }

    const { domain, url } = validateAndNormalizeDomain(rawTarget);
    const enrichment = await enrichCompany(domain, url);

    return c.json({
      success: true,
      domain: enrichment.domain,
      company_name: enrichment.company_name,
      sales_intelligence: enrichment.sales_intelligence
    });
  } catch (err: any) {
    return c.json({
      success: false,
      error: err.message || "Failed to generate sales pitch"
    }, 400);
  }
});

/**
 * 4. POST /v1/enrich/batch - Batch Multi-Domain Processing (up to 10 domains)
 */
app.post("/v1/enrich/batch", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const domains = validateBatchDomains(body.domains, 10);

    const start = Date.now();
    const tasks = domains.map(async (raw) => {
      try {
        const { domain, url } = validateAndNormalizeDomain(raw);
        return await enrichCompany(domain, url);
      } catch (e: any) {
        return {
          domain: raw,
          error: e.message || "Invalid domain",
          crawl_success: false
        };
      }
    });

    const results = await Promise.all(tasks);

    return c.json({
      success: true,
      total_requested: domains.length,
      successful_enrichments: results.filter((r: any) => !r.error).length,
      execution_time_ms: Date.now() - start,
      data: results
    });
  } catch (err: any) {
    return c.json({
      success: false,
      error: err.message || "Batch enrichment failed"
    }, 400);
  }
});

/**
 * 5. GET /openapi.json - OpenAPI 3.0 specification
 */
app.get("/openapi.json", (c) => {
  return c.json({
    openapi: "3.0.3",
    info: {
      title: "B2B Company Deep-Enrichment API",
      description: "Deep B2B Company Intelligence & Sales Outreach Enrichment Engine for AI Agents and Automation Pipelines (Make, n8n, Clay, LangChain). Extracts Technographics, Firmographics, AI Cold Outreach Hooks, and Contact Graphs.",
      version: "1.0.0",
      contact: {
        name: "TopAI SaaS Dev",
        email: "top.ai.saas@gmail.com"
      }
    },
    servers: [
      {
        url: "https://b2b-company-enrichment.topaisaas.workers.dev",
        description: "Cloudflare Workers Serverless Production Edge"
      }
    ],
    paths: {
      "/v1/enrich": {
        post: {
          summary: "Deep Enrich Company Profile",
          description: "Performs full intelligence extraction including Technographics, Firmographics, Sales Hooks, and Contact Graph.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    domain: { type: "string", example: "stripe.com" },
                    url: { type: "string", example: "https://stripe.com" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Enrichment data successfully generated" },
            "400": { description: "Invalid domain or security error" }
          }
        },
        get: {
          summary: "Deep Enrich Company Profile (Query String)",
          parameters: [
            { name: "domain", in: "query", schema: { type: "string" }, description: "Target domain (e.g. stripe.com)" }
          ],
          responses: {
            "200": { description: "Enrichment data successfully generated" }
          }
        }
      },
      "/v1/enrich/techstack": {
        post: {
          summary: "Detect Technographics & Software Stack",
          description: "Scans for 100+ modern tools across Analytics, Frameworks, CMS, Payments, CRM, and Cloud.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["domain"],
                  properties: {
                    domain: { type: "string", example: "linear.app" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Tech stack detected" }
          }
        }
      },
      "/v1/enrich/pitch": {
        post: {
          summary: "Generate AI Sales Hooks & Value Props",
          description: "Generates 3 ready-to-use hyper-personalized cold outreach hooks based on the company's stack and positioning.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["domain"],
                  properties: {
                    domain: { type: "string", example: "supabase.com" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Sales intelligence generated" }
          }
        }
      },
      "/v1/enrich/batch": {
        post: {
          summary: "Batch Enrich Multiple Companies (Up to 10)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["domains"],
                  properties: {
                    domains: {
                      type: "array",
                      items: { type: "string" },
                      example: ["stripe.com", "linear.app", "vercel.com"]
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Batch results returned" }
          }
        }
      },
      "/v1/health": {
        get: {
          summary: "API Healthcheck",
          responses: {
            "200": { description: "Service is operational" }
          }
        }
      }
    }
  });
});

/**
 * 6. GET / - Interactive Playground & Landing Page
 */
app.get("/", (c) => {
  const accept = c.req.header("accept") || "";
  const format = c.req.query("format");

  if (format === "json" || (!accept.includes("text/html") && accept.includes("application/json"))) {
    return c.json({
      service: "B2B Company Deep-Enrichment API",
      tagline: "Autonomous B2B Intelligence & Sales Enrichment Engine for AI Outreach Agents",
      version: "1.0.0",
      docs_url: "/openapi.json",
      health_url: "/v1/health",
      endpoints: {
        "POST /v1/enrich": "Full company profiling (Firmographics + Technographics + Sales Hooks + Contacts)",
        "GET /v1/enrich": "Quick company profiling via ?domain=example.com",
        "POST /v1/enrich/techstack": "Dedicated technographic scanner (100+ tools detected)",
        "POST /v1/enrich/pitch": "AI-ready cold outreach angles & ICP analysis",
        "POST /v1/enrich/batch": "Batch multi-domain enrichment (up to 10 domains concurrently)"
      }
    });
  }

  c.header("Cache-Control", "no-cache, no-store, must-revalidate");

  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>B2B Company Deep-Enrichment API • Live Interactive Demo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #090d16; color: #e2e8f0; padding: 40px 20px; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 214, 0, 0.15); color: #ffd600; border: 1px solid rgba(255, 214, 0, 0.3); padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
    .badge::before { content: ''; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }
    h1 { font-size: 28px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }
    p.subtitle { font-size: 16px; color: #94a3b8; margin-bottom: 24px; }
    .playground { background: #1a2234; border: 1px solid #2d3748; border-radius: 12px; padding: 24px; margin-bottom: 28px; }
    .input-row { display: flex; gap: 12px; margin-bottom: 16px; }
    input[type="text"] { flex: 1; padding: 14px 16px; background: #0b1120; border: 1px solid #334155; border-radius: 8px; color: #fff; font-size: 15px; outline: none; transition: border-color 0.2s; }
    input[type="text"]:focus { border-color: #ffd600; }
    button { background: #ffd600; color: #000; border: none; padding: 14px 24px; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; transition: transform 0.1s, background 0.2s; }
    button:hover { background: #ffea00; }
    button:active { transform: scale(0.98); }
    #output { display: none; margin-top: 16px; }
    pre { background: #070b12; border: 1px solid #1e293b; color: #38bdf8; padding: 16px; border-radius: 8px; overflow-x: auto; max-height: 400px; font-size: 13px; font-family: monospace; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
    .chip { background: #1e293b; border: 1px solid #334155; color: #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 13px; text-decoration: none; }
    .links-bar { margin-top: 24px; padding-top: 20px; border-top: 1px solid #1f2937; display: flex; gap: 16px; font-size: 14px; }
    .links-bar a { color: #ffd600; text-decoration: none; font-weight: 600; }
    .links-bar a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">Live 24/7 on Cloudflare Global Edge</div>
    <h1>B2B Company Deep-Enrichment API</h1>
    <p class="subtitle">Autonomous B2B profiling, 100+ technographics scanner, contact graph & AI cold outreach hooks for agents.</p>

    <div class="playground">
      <div class="input-row">
        <input type="text" id="target" value="stripe.com" placeholder="Domain name (e.g. stripe.com, linear.app, airbnb.com)">
        <button onclick="runEnrichment()" id="btn">Enrich Company</button>
      </div>
      <div id="output">
        <div style="margin-bottom: 8px; font-size: 14px; color: #a3e635;" id="stats"></div>
        <pre id="json"></pre>
      </div>
    </div>

    <h3 style="color:#fff; font-size:16px; margin-bottom: 8px;">📚 Official Endpoints</h3>
    <div class="chips">
      <span class="chip"><code>POST /v1/enrich</code> (Full Profiling)</span>
      <span class="chip"><code>POST /v1/enrich/techstack</code> (100+ Stack Scanner)</span>
      <span class="chip"><code>POST /v1/enrich/pitch</code> (AI Sales Hooks)</span>
      <span class="chip"><code>POST /v1/enrich/batch</code> (Multi-Domain)</span>
      <span class="chip"><code>GET /v1/health</code> (Healthcheck)</span>
    </div>

    <div class="links-bar">
      <a href="https://rapidapi.com/user/topaisaas-dev" target="_blank">⚡ RapidAPI Marketplace</a>
      <a href="https://github.com/topaisaas-dev/b2b-company-enrichment" target="_blank">📦 GitHub Repository</a>
      <a href="/openapi.json" target="_blank">📄 OpenAPI Specification</a>
    </div>
  </div>

  <script>
    async function runEnrichment() {
      const btn = document.getElementById('btn');
      const domain = document.getElementById('target').value.trim();
      if (!domain) return;

      btn.innerText = 'Enriching...';
      btn.disabled = true;

      try {
        const start = Date.now();
        const res = await fetch('/v1/enrich', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ domain })
        });
        const data = await res.json();
        const elapsed = Date.now() - start;

        document.getElementById('output').style.display = 'block';
        document.getElementById('stats').innerText = '✓ Success (' + elapsed + ' ms)';
        document.getElementById('json').innerText = JSON.stringify(data, null, 2);
      } catch (err) {
        alert('Enrichment failed: ' + err.message);
      } finally {
        btn.innerText = 'Enrich Company';
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>`);
});

export default app;
