# app/utils/gen_apikey.py
import secrets
import base64
import re

def generate_api_key() -> str:
    random_bytes = secrets.token_bytes(24)
    safe_string = base64.urlsafe_b64encode(random_bytes).decode('utf-8')
    encoded = re.sub(r'[-_]', '', safe_string)
    return f"fdb{encoded}"