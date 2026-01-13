import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
FUNCTION_URL = f"{SUPABASE_URL}/functions/v1/tax-classifier"

print(f"Testing URL: {FUNCTION_URL}")

payload = {
    "produtos": [
        {
            "id": "1",
            "descricao": "ARROZ BRANCO TIPO 1 5KG",
            "ncm": "1006.30.21" # NCM de Arroz (esperado ser Cesta Basica / Gov Match se tiver na base)
        },
        {
            "id": "2",
            "descricao": "REFRIGERANTE COLA 2L",
            "ncm": "2202.10.00" # NCM de Bebida (esperado ser Padrão)
        }
    ]
}

headers = {
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json"
}

try:
    response = requests.post(FUNCTION_URL, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
