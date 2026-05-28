import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Environment Toggle
USE_NGROK = os.getenv("USE_NGROK", "true").lower() == "true"

# JWT configuration for authentication
def _get_env(key: str, default: str = "") -> str:
    return os.getenv(key, default)

# Development bypass flag for authentication
def _str_to_bool(val: str) -> bool:
    return val.lower() in ("true", "1", "yes")

BYPASS_AUTH = _str_to_bool(os.getenv("BYPASS_AUTH", "false"))

JWT_SECRET_KEY = _get_env("JWT_SECRET_KEY", "supersecretkey")
JWT_ALGORITHM = _get_env("JWT_ALGORITHM", "HS256")

# SIS Module Configuration
SIS_LOCAL_URL = os.getenv("SIS_LOCAL_URL", "http://localhost:8001")
SIS_NGROK_URL = os.getenv("SIS_NGROK_URL", "https://gone-magnolia-empty.ngrok-free.dev")

SIS_BASE_URL = SIS_NGROK_URL if USE_NGROK else SIS_LOCAL_URL

# Auth Module Configuration
AUTH_BACKEND_LOCAL_URL = os.getenv("AUTH_BACKEND_LOCAL_URL", "http://localhost:8002")
AUTH_BACKEND_NGROK_URL = os.getenv("AUTH_BACKEND_NGROK_URL", "https://a97b-103-251-210-3.ngrok-free.app")

AUTH_BACKEND_URL = AUTH_BACKEND_NGROK_URL if USE_NGROK else AUTH_BACKEND_LOCAL_URL

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5433/placement_db")

# Notification Module Configuration
NOTIFICATION_BASE_URL = os.getenv("NOTIFICATION_BASE_URL", "https://tapering-gradation-quickness.ngrok-free.dev")
NOTIFICATION_API_KEY = os.getenv("NOTIFICATION_API_KEY", "PLACE_KEY_2026")

print(f"Backend Configuration: USE_NGROK={USE_NGROK}")
print(f"SIS_BASE_URL: {SIS_BASE_URL}")
print(f"AUTH_BACKEND_URL: {AUTH_BACKEND_URL}")
print(f"NOTIFICATION_BASE_URL: {NOTIFICATION_BASE_URL}")
