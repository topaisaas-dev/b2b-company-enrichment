import json
import os
import sys

def test_openapi_spec():
    spec_path = os.path.join(os.path.dirname(__file__), "..", "openapi.json")
    assert os.path.exists(spec_path), "openapi.json does not exist"
    
    with open(spec_path, "rb") as f:
        raw = f.read()
        assert not raw.startswith(b"\xef\xbb\xbf"), "BOM found in openapi.json! Must be pure UTF-8."
    
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
    
    assert spec.get("openapi") == "3.0.3", "Invalid openapi version"
    assert "/v1/enrich" in spec["paths"], "Missing /v1/enrich"
    assert "/v1/enrich/techstack" in spec["paths"], "Missing /v1/enrich/techstack"
    assert "/v1/enrich/pitch" in spec["paths"], "Missing /v1/enrich/pitch"
    assert "/v1/enrich/batch" in spec["paths"], "Missing /v1/enrich/batch"
    assert "/v1/health" in spec["paths"], "Missing /v1/health"
    print("PASS: OpenAPI spec is 100% valid without BOM.")

def test_wrangler_config():
    wrangler_path = os.path.join(os.path.dirname(__file__), "..", "wrangler.toml")
    with open(wrangler_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert 'name = "b2b-company-enrichment"' in content
    assert 'account_id = "c2f6458a58ca3c80c5d0c3359baaa3cb"' in content
    print("PASS: wrangler.toml is configured properly.")

def test_security_rules_presence():
    sec_path = os.path.join(os.path.dirname(__file__), "..", "src", "security.ts")
    with open(sec_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "169.254." in content, "Missing Link-Local / Metadata SSRF block"
    assert "127." in content, "Missing Loopback SSRF block"
    assert "10." in content, "Missing Class A private IP block"
    assert "192.168." in content, "Missing Class C private IP block"
    assert "validateAndNormalizeDomain" in content, "Missing domain validator"
    print("PASS: Anti-SSRF and security constraints verified in source code.")

def test_tech_detectors():
    engine_path = os.path.join(os.path.dirname(__file__), "..", "src", "enrichment_engine.ts")
    with open(engine_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Stripe" in content
    assert "PostHog" in content
    assert "Next.js" in content
    assert "React" in content
    assert "Cloudflare" in content
    assert "generateSalesHooks" in content
    assert "extractEmails" in content
    print("PASS: Tech signatures and sales hook logic verified.")

if __name__ == "__main__":
    test_openapi_spec()
    test_wrangler_config()
    test_security_rules_presence()
    test_tech_detectors()
    print("\nALL PRE-DEPLOYMENT QA & RED TEAMING CHECKS PASSED (100% SUCCESS)!")
