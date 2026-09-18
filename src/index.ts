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
 * 6. GET / - Welcome & Documentation Landing
 */
app.get("/", (c) => {
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
});

export default app;
