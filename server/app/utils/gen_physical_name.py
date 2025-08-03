import secrets

def generate_physical_name(user_id: str, virtual_name: str) -> str:
    """Generates a unique and safe physical database name."""
    # e.g., user_a1b2c3_movies_d4e5f6
    random_suffix = secrets.token_hex(3)
    # We truncate user_id and virtual_name to keep the total length manageable
    return f"user_{user_id[:8]}_{virtual_name[:20]}_{random_suffix}"