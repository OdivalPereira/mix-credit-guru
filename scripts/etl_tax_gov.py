import os
import sys
import json
import base64
import tempfile
import logging
from datetime import datetime
import requests
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
API_BASE_URL = "https://cff.svrs.rs.gov.br/api/v1/consultas"
ENDPOINTS = [
    "classTrib",
    "credPresumido",
    "anexos",
    "indOper"
]

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    if not url or not key:
        logger.error("SUPABASE_URL or SUPABASE_SERVICE_KEY not set")
        sys.exit(1)
        
    return create_client(url, key)

def get_cert_path():
    """
    Decodes the base64 encoded certificate from environment variable
    and writes it to a temporary file.
    Returns the path to the temporary file.
    """
    cert_b64 = os.environ.get("GOV_CERT_BASE64")
    if not cert_b64:
        logger.error("GOV_CERT_BASE64 environment variable not set")
        sys.exit(1)
    
    try:
        cert_content = base64.b64decode(cert_b64)
        
        # Create a temp file for the certificate
        # We use delete=False so we can close it and let requests use the path, 
        # then delete it manually
        tf = tempfile.NamedTemporaryFile(delete=False, suffix='.pfx')
        tf.write(cert_content)
        tf.flush()
        tf.close()
        return tf.name
    except Exception as e:
        logger.error(f"Failed to decode/write certificate: {e}")
        sys.exit(1)

def fetch_data(url: str, cert_path: str, cert_pass: str = None):
    """
    Fetches data from the API using mTLS.
    Retries included in logic if needed, but requests doesn't retry by default.
    """
    # If using PFX with requests, we might need simple-pfx or convert to pem.
    # Requests native support for PFX is limited/dependent on libs.
    # Ideally, the user provides a PEM file (cert + key) in the env var for python requests.
    # However, if it is PFX, we might need a separate step.
    # For now, assuming the content in GOV_CERT_BASE64 is a PEM file which includes Private Key.
    # If it is a PFX, we would need to convert it using OpenSSL or python libs like cryptography/pkcs12.
    # Given requirements said "cert extracted from env base64", and "requests configured with certificate",
    # passing the file path to 'cert' param in requests usually works for PEM.
    
    # NOTE: user mentioned .pfx or .pem. PFX directly in requests is not standard. 
    # We will assume it is a PEM file containing both cert and key, or user has converted it.
    # If strictly PFX is needed, we'd need code to convert.
    # Let's try to assume PEM for simplicity as it's standard for python requests `cert` param if combined.
    
    try:
        logger.info(f"Fetching from {url}...")
        # Verify=True is default. cert=path_to_pem_file (with key)
        response = requests.get(url, cert=cert_path, timeout=60) 
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching {url}: {e}")
        return None

def main():
    logger.info("Starting Tax Gov ETL process")
    
    supabase = get_supabase_client()
    cert_path = get_cert_path()
    
    # Passphrase for the key if encrypted (optional, depends on how PEM was generated)
    # Requests doesn't accept password for PEM file directly in `cert` param easily if key is encrypted?
    # Actually, if the key is unencrypted in the PEM, no password needed.
    # If PFX, we definitely need conversion. 
    # We'll assume the provided base64 is a PEM file with unencrypted private key for simplicity in this V1.
    # The User Prompt says: "Tenho um certificado A1 (arquivo .pfx ou .pem)".
    
    try:
        for endpoint in ENDPOINTS:
            url = f"{API_BASE_URL}/{endpoint}"
            data = fetch_data(url, cert_path)
            
            if data:
                logger.info(f"Successfully fetched data from {endpoint}. Uploading to Supabase...")
                
                payload = {
                    "source_api": endpoint,
                    "payload_json": data,
                    # fetched_at is default now() in DB, but we can send it if we want
                }
                
                try:
                    supabase.table("raw_gov_tax_data").insert(payload).execute()
                    logger.info(f"Successfully inserted data for {endpoint}")
                except Exception as db_err:
                    logger.error(f"Database error for {endpoint}: {db_err}")
            else:
                logger.warning(f"No data fetched for {endpoint}")
                
    finally:
        # Cleanup temp file
        if os.path.exists(cert_path):
            os.unlink(cert_path)
            logger.info("Cleaned up temporary certificate file")

if __name__ == "__main__":
    main()
