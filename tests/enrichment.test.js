import test from "node:test";
import assert from "node:assert/strict";
import { validateAndNormalizeDomain, validateBatchDomains, sanitizeInput } from "../src/security.ts";
import { detectTechnographics, extractMetadata, generateSalesHooks, extractEmails, extractSocialProfiles } from "../src/enrichment_engine.ts";

test("Security: SSRF Protection blocks private IPs and localhost", () => {
  const badInputs = [
    "localhost",
    "http://localhost:3000",
    "http://127.0.0.1/admin",
    "169.254.169.254",
    "http://10.0.0.1",
    "http://192.168.1.1",
    "http://172.20.0.1",
    "metadata.google.internal",
    "http://evil.internal",
    "ftp://example.com"
  ];

  for (const bad of badInputs) {
    assert.throws(() => {
      validateAndNormalizeDomain(bad);
    }, /SSRF Protection|Forbidden protocol|Invalid domain/);
  }
});

test("Security: Domain Normalization formats clean https URLs", () => {
  const { domain, url } = validateAndNormalizeDomain("stripe.com");
  assert.equal(domain, "stripe.com");
  assert.equal(url, "https://stripe.com");

  const normalized = validateAndNormalizeDomain("https://Linear.App/");
  assert.equal(normalized.domain, "linear.app");
  assert.equal(normalized.url, "https://linear.app");
});

test("Security: Batch validation enforces array limits", () => {
  assert.throws(() => validateBatchDomains([]), /cannot be empty/);
  assert.throws(() => validateBatchDomains(["a", "b", "c"], 2), /limit exceeded/);
  const validated = validateBatchDomains(["stripe.com", "linear.app"]);
  assert.equal(validated.length, 2);
});

test("Engine: Technographics Detector identifies tech stack correctly", () => {
  const sampleHtml = `
    <html>
      <head>
        <title>SaaS Platform</title>
        <script src="https://js.stripe.com/v3/"></script>
        <script src="https://cdn.segment.com/analytics.js"></script>
      </head>
      <body>
        <div id="__next">
          <div class="text-sm bg-blue-500 flex-col">Hello World</div>
        </div>
      </body>
    </html>
  `;
  const headers = new Headers({ "server": "cloudflare", "x-powered-by": "Next.js" });
  const result = detectTechnographics(sampleHtml, headers);

  assert.ok(result.technologies.some(t => t.name === "Stripe"));
  assert.ok(result.technologies.some(t => t.name === "Next.js"));
  assert.ok(result.technologies.some(t => t.name === "Segment"));
  assert.ok(result.technologies.some(t => t.name === "Cloudflare"));
  assert.ok(result.technologies.some(t => t.name === "Tailwind CSS"));
  assert.ok(result.tech_maturity_score >= 6);
});

test("Engine: Social links and emails extracted cleanly", () => {
  const html = `
    <a href="https://linkedin.com/company/acme-corp">LinkedIn</a>
    <a href="https://x.com/acmecorp">X</a>
    <a href="https://github.com/acme">GitHub</a>
    <p>Contact us at hello@acme.com or sales@acme.com</p>
  `;
  const emails = extractEmails(html, "acme.com");
  const socials = extractSocialProfiles(html);

  assert.ok(emails.includes("hello@acme.com"));
  assert.ok(emails.includes("sales@acme.com"));
  assert.equal(socials.linkedin, "https://linkedin.com/company/acme-corp");
  assert.equal(socials.twitter, "https://x.com/acmecorp");
  assert.equal(socials.github, "https://github.com/acme");
});

test("Engine: Sales Hooks generate 3 personalized angles", () => {
  const hooks = generateSalesHooks(
    "Acme",
    "acme.com",
    "FinTech & Payments",
    [{ name: "Stripe", category: "Payments", confidence: "high" }, { name: "Next.js", category: "Frameworks", confidence: "high" }],
    "CFOs and Finance Teams"
  );

  assert.equal(hooks.length, 3);
  assert.ok(hooks[0].hook.includes("Stripe & Next.js"));
  assert.ok(hooks[1].hook.includes("FinTech & Payments"));
  assert.ok(hooks[2].hook.includes("CFOs and Finance Teams"));
});
