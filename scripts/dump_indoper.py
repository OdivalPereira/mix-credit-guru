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

print("Fetching indOper...")
response = supabase.table("raw_gov_tax_data").select("payload_json").eq("source_api", "indOper").limit(1).execute()

if len(response.data) > 0:
    # Just dump the first item of the list if it's a list
    data = response.data[0]['payload_json']
    with open("indoper_dump.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Dumped indOper to indoper_dump.json")
else:
    print("No indOper found")
