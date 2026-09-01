from passlib.hash import pbkdf2_sha256

def hash_password(password: str) -> str:
    """Hash a raw password string using PBKDF2 SHA256."""
    return pbkdf2_sha256.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a raw password against its stored hash."""
    if not hashed_password:
        return False
    try:
        return pbkdf2_sha256.verify(plain_password, hashed_password)
    except Exception:
        return False
