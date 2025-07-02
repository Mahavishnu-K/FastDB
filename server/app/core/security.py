import os
from fastapi import Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader

api_key_header_auth = APIKeyHeader(name="Authorization", auto_error=False)

MASTER_API_KEY = os.getenv("MASTER_API_KEY", "my-super-secret-key")

def get_api_key(api_key_header: str = Security(api_key_header_auth)):
    """
    Dependency to validate the API key from the Authorization header.
    
    Checks if the header is present and if the key is valid.
    """
    if api_key_header is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing",
        )
    
    # The header value is expected to be "Bearer <key>"
    # We split the string and take the second part.
    try:
        scheme, _, key = api_key_header.partition(' ')
        if scheme.lower() != 'bearer':
            raise ValueError("Invalid authentication scheme")
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Use 'Bearer <key>'."
        )

    if key == MASTER_API_KEY:
        return key
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )