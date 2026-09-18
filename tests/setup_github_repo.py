import urllib.request
import json
import subprocess
import os

def load_env():
    env = {}
    env_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env.local"))
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip('"')
    return env

env = load_env()
GITHUB_USER = env.get("GITHUB_USERNAME", "topaisaas-dev")
GITHUB_TOKEN = env.get("GITHUB_TOKEN", os.environ.get("GITHUB_TOKEN", ""))
REPO_NAME = "b2b-company-enrichment"
REPO_DESC = "Deep B2B Company Intelligence & Sales Outreach Enrichment Engine for AI Agents (Make, n8n, Clay). Extracts Technographics, Firmographics, AI Cold Outreach Hooks, and Contact Graphs."

def git_init_and_push():
    cwd = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    print(f"Working in: {cwd}")
    
    subprocess.run(["git", "config", "user.name", GITHUB_USER], cwd=cwd, check=True)
    subprocess.run(["git", "config", "user.email", "top.ai.saas@gmail.com"], cwd=cwd, check=True)
    
    # Add files
    subprocess.run(["git", "add", "."], cwd=cwd, check=True)
    # Amend the commit so no secret exists in history
    subprocess.run(["git", "commit", "--amend", "-m", "Initial commit: Production B2B Company Deep-Enrichment API"], cwd=cwd, check=True)
    
    # Remote
    remote_url = f"https://{GITHUB_USER}:{GITHUB_TOKEN}@github.com/{GITHUB_USER}/{REPO_NAME}.git"
    subprocess.run(["git", "remote", "remove", "origin"], cwd=cwd, check=False)
    subprocess.run(["git", "remote", "add", "origin", remote_url], cwd=cwd, check=True)
    
    # Push
    result = subprocess.run(["git", "push", "-u", "origin", "main", "--force"], cwd=cwd, capture_output=True, text=True)
    print("Push stdout:", result.stdout)
    print("Push stderr:", result.stderr)
    if result.returncode == 0:
        print(f"Successfully pushed to https://github.com/{GITHUB_USER}/{REPO_NAME}")
    else:
        print("Git push encountered an issue.")

if __name__ == "__main__":
    git_init_and_push()
