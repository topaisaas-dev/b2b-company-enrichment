import urllib.request
import json

BASE_URL = "https://b2b-company-enrichment.topaisaas.workers.dev"

def make_request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"User-Agent": "TopAI-TestClient/1.0"}
    encoded_data = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        encoded_data = json.dumps(data).encode("utf-8")
    
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def main():
    print("Testing Live Cloudflare Worker...")
    
    # 1. Healthcheck
    status, res = make_request("/v1/health")
    print(f"Healthcheck: {status} -> {res.get('status')}")
    assert status == 200 and res.get("status") == "healthy"

    # 2. OpenAPI Spec
    status, res = make_request("/openapi.json")
    print(f"OpenAPI Spec: {status} -> {res.get('info', {}).get('title')}")
    assert status == 200 and "paths" in res

    # 3. POST /v1/enrich
    print("Testing POST /v1/enrich with 'stripe.com'...")
    status, res = make_request("/v1/enrich", method="POST", data={"domain": "stripe.com"})
    print(f"POST /v1/enrich: {status} -> success={res.get('success')}")
    assert status == 200
    assert res.get("success") is True
    data = res["data"]
    print(f"  Company: {data.get('company_name')}")
    print(f"  Industry: {data.get('firmographics', {}).get('industry_primary')}")
    print(f"  Detected Tech Count: {data.get('technographics', {}).get('total_detected')}")
    print(f"  Sales Hooks Count: {len(data.get('sales_intelligence', {}).get('cold_outreach_hooks', []))}")

    # 4. POST /v1/enrich/techstack
    print("Testing POST /v1/enrich/techstack with 'linear.app'...")
    status, res = make_request("/v1/enrich/techstack", method="POST", data={"domain": "linear.app"})
    print(f"POST /v1/enrich/techstack: {status} -> success={res.get('success')}")
    assert status == 200

    # 5. POST /v1/enrich/pitch
    print("Testing POST /v1/enrich/pitch with 'supabase.com'...")
    status, res = make_request("/v1/enrich/pitch", method="POST", data={"domain": "supabase.com"})
    print(f"POST /v1/enrich/pitch: {status} -> success={res.get('success')}")
    assert status == 200

    # 6. Anti-SSRF test
    print("Testing Anti-SSRF defense with localhost...")
    status, res = make_request("/v1/enrich", method="POST", data={"domain": "localhost"})
    print(f"SSRF defense: {status} -> {res.get('error')}")
    assert status == 400
    assert "SSRF Protection" in res.get("error", "")

    print("\nALL LIVE PRODUCTION API TESTS PASSED SUCCESSFULLY! [OK]")

if __name__ == "__main__":
    main()
