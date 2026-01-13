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

print("Fetching anexos...")
response = supabase.table("raw_gov_tax_data").select("payload_json").eq("source_api", "anexos").limit(1).execute()

if len(response.data) > 0:
    with open("anexos_dump.json", "w", encoding="utf-8") as f:
        json.dump(response.data[0]['payload_json'], f, indent=2, ensure_ascii=False)
    print("Dumped anexos to anexos_dump.json")
else:
    print("No anexos found")
