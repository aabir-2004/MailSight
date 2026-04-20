import base64
import os
from cryptography.fernet import Fernet
from app.core.config import settings

# Ensure SECRET_KEY is valid for Fernet (32 url-safe base64-encoded bytes)
def _get_fernet() -> Fernet:
    secret = settings.SECRET_KEY.encode('utf-8')
    # Pad or truncate to 32 bytes
    if len(secret) < 32:
        secret = secret.ljust(32, b'0')
    elif len(secret) > 32:
        secret = secret[:32]
    fernet_key = base64.urlsafe_b64encode(secret)
    return Fernet(fernet_key)

_fernet = _get_fernet()

def encrypt_token(token: str) -> str:
    if not token:
        return ""
    return _fernet.encrypt(token.encode("utf-8")).decode("utf-8")

def decrypt_token(encrypted_token: str) -> str:
    if not encrypted_token:
        return ""
    return _fernet.decrypt(encrypted_token.encode("utf-8")).decode("utf-8")
