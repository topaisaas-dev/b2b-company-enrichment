/**
 * Security & Defense Module for B2B Company Deep-Enrichment API
 * Provides strict Anti-SSRF protection, domain validation, and parameter sanitization.
 */

const FORBIDDEN_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "instance-data",
  "metadata.google.internal",
  "metadata.internal"
]);

const FORBIDDEN_IP_PREFIXES = [
  "127.",        // Loopback
  "10.",         // Class A private
  "192.168.",    // Class C private
  "169.254.",    // Link-local / Cloud metadata (AWS, GCP, Azure, DO)
  "0.",          // Current network
  "fc00:",       // IPv6 Unique Local
  "fe80:",       // IPv6 Link-Local
  "::ffff:127.", // IPv4-mapped IPv6 loopback
];

function isClassBPrivate(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length === 4 && parts[0] === "172") {
    const second = parseInt(parts[1], 10);
    return !isNaN(second) && second >= 16 && second <= 31;
  }
  return false;
}

/**
 * Normalizes and validates a domain or URL to ensure safe fetching.
 * Returns the normalized HTTPS URL.
 */
export function validateAndNormalizeDomain(input: string): { domain: string; url: string } {
  if (!input || typeof input !== "string") {
    throw new Error("Missing or invalid 'domain' or 'url' parameter");
  }

  let clean = input.trim().toLowerCase();
  
  // Strip trailing slashes
  clean = clean.replace(/\/+$/, "");

  // Prepend https:// if protocol is omitted
  let parsed: URL;
  try {
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      parsed = new URL(`https://${clean}`);
    } else {
      parsed = new URL(clean);
    }
  } catch {
    throw new Error(`Invalid domain or URL format: '${input}'`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Forbidden protocol: '${parsed.protocol}'. Only HTTP/HTTPS are allowed.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Enforce Anti-SSRF rules
  if (FORBIDDEN_HOSTS.has(hostname)) {
    throw new Error(`SSRF Protection: Access to host '${hostname}' is strictly forbidden.`);
  }

  for (const prefix of FORBIDDEN_IP_PREFIXES) {
    if (hostname.startsWith(prefix)) {
      throw new Error(`SSRF Protection: Access to private network '${hostname}' is forbidden.`);
    }
  }

  if (isClassBPrivate(hostname)) {
    throw new Error(`SSRF Protection: Access to private IP '${hostname}' is forbidden.`);
  }

  if (hostname.endsWith(".internal") || hostname.endsWith(".local") || hostname.endsWith(".onion")) {
    throw new Error(`SSRF Protection: Access to internal TLD '${hostname}' is forbidden.`);
  }

  // Domain name validation regex (must have valid TLD or valid hostname)
  const domainPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
  if (!domainPattern.test(hostname)) {
    throw new Error(`Invalid domain structure: '${hostname}'`);
  }

  return {
    domain: hostname,
    url: `https://${hostname}`
  };
}

/**
 * Sanitizes arbitrary string input for queries or search terms.
 */
export function sanitizeInput(val: unknown, maxLength = 200): string {
  if (typeof val !== "string") return "";
  return val
    .trim()
    .replace(/[<>'"\\]/g, "")
    .slice(0, maxLength);
}

/**
 * Validates batch domain inputs, returning at most maxItems sanitized domains.
 */
export function validateBatchDomains(domains: unknown, maxItems = 10): string[] {
  if (!Array.isArray(domains)) {
    throw new Error("Field 'domains' must be an array of strings.");
  }
  if (domains.length === 0) {
    throw new Error("Array 'domains' cannot be empty.");
  }
  if (domains.length > maxItems) {
    throw new Error(`Batch limit exceeded: maximum ${maxItems} domains per request.`);
  }

  const results: string[] = [];
  for (const d of domains) {
    if (typeof d === "string" && d.trim().length > 0) {
      results.push(d.trim());
    }
  }

  if (results.length === 0) {
    throw new Error("No valid domain strings provided in 'domains' array.");
  }

  return results;
}
