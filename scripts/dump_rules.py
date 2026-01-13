import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

if not url or not key:
    print("Error: Missing env vars")
    exit(1)

supabase: Client = create_client(url, key)

print("Fetching debug rules...")
response = supabase.table("debug_tax_rules").select("rule").limit(5).execute()

with open("rules_dump.json", "w", encoding="utf-8") as f:
    json.dump(response.data, f, indent=2, ensure_ascii=False)

print("Dumped 5 rules to rules_dump.json")
