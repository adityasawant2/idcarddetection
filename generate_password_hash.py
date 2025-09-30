#!/usr/bin/env python3
import hashlib
import secrets

def get_password_hash(password: str) -> str:
    """Generate password hash in the same format as the backend"""
    salt = secrets.token_hex(16)
    hash_part = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{hash_part}"

if __name__ == "__main__":
    password = input("Enter password: ")
    hashed = get_password_hash(password)
    print(f"Password hash: {hashed}")
    print(f"SQL to update: UPDATE users SET password_hash = '{hashed}' WHERE email = 'adityasawant1254@gmail.com';")


