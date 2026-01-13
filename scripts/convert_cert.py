import os
import base64
import sys
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import pkcs12

def convert_pfx_to_pem_b64(pfx_path, password):
    try:
        with open(pfx_path, "rb") as f:
            pfx_data = f.read()

        private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(
            pfx_data,
            password.encode()
        )

        # Serialize Private Key
        key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )

        # Serialize Certificate
        cert_pem = certificate.public_bytes(serialization.Encoding.PEM)

        # Combine
        full_pem = key_pem + cert_pem
        if additional_certificates:
            for cert in additional_certificates:
                full_pem += cert.public_bytes(serialization.Encoding.PEM)

        # Encode to Base64
        return base64.b64encode(full_pem).decode('utf-8')

    except Exception as e:
        print(f"Error converting PFX: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python convert_cert.py <pfx_path> <password>")
        sys.exit(1)
        
    pfx_path = sys.argv[1]
    password = sys.argv[2]
    
    b64_pem = convert_pfx_to_pem_b64(pfx_path, password)
    if b64_pem:
        print(b64_pem)
    else:
        sys.exit(1)
