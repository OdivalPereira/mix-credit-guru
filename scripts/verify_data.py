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

print("--- Checking Relationship ---")

# 1. Fetch ClassTrib Rules
print("Fetching rules...")
resp_rules = supabase.table("raw_gov_tax_data").select("payload_json").eq("source_api", "classTrib").limit(1).execute()
rules = []
if len(resp_rules.data) > 0:
    rules_data = resp_rules.data[0]['payload_json']
    # rules_data comes as list of wrapping objects [{"rule": {...}}, ...]
    for r in rules_data:
        if 'rule' in r:
            rules.append(r['rule'])
else:
    print("No rules found")

# 2. Fetch Anexos
print("Fetching anexos...")
resp_anexos = supabase.table("raw_gov_tax_data").select("payload_json").eq("source_api", "anexos").limit(1).execute()
anexos = []
if len(resp_anexos.data) > 0:
    anexos = resp_anexos.data[0]['payload_json'] # List of objects { "nroAnexo": 1, "codNcmNbs": ... }
else:
    print("No anexos found")

print(f"Total Rules: {len(rules)}")
print(f"Total Anexos (NCM entries): {len(anexos)}")

# Check for Rules with Anexo ID
linked_rules = [r for r in rules if r.get('Anexo') is not None]
print(f"Rules with specific Anexo ID: {len(linked_rules)}")

if len(linked_rules) > 0:
    sample_anexo_id = linked_rules[0]['Anexo']
    print(f"Sample Anexo ID from Rule: {sample_anexo_id}")
    
    # Check if this ID exists in Anexos
    matching_ncm = [a for a in anexos if a.get('nroAnexo') == sample_anexo_id]
    print(f"Matching NCMs for Anexo {sample_anexo_id}: {len(matching_ncm)}")
    if len(matching_ncm) > 0:
        print(f"Sample Matching NCM: {matching_ncm[0]['codNcmNbs']}")
else:
    print("No rules found linked to specific Anexos (All Anexo=null).")
    # If all match null, then maybe the mapping is elsewhere.
