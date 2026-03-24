import os
import json
from pathlib import Path


def _load_dotenv(env_path: str) -> None:
    """Manually load a .env file into os.environ (no external dependency)."""
    path = Path(env_path)
    if not path.is_file():
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip()
            # Only set if not already present (real env vars take priority)
            if key not in os.environ:
                os.environ[key] = value


# Resolve the .env path relative to the backend root (two levels up from this file)
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_load_dotenv(str(_BACKEND_DIR / ".env"))


class Settings:
    """Centralized configuration – all values read from environment variables."""

    # ── App ──
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "AI Agriculture Portal Backend")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))

    # ── Security / JWT ──
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    # ── CORS ──
    @staticmethod
    def _parse_cors_origins() -> list[str]:
        raw = os.getenv("CORS_ORIGINS", '["http://localhost:3000"]')
        try:
            origins = json.loads(raw)
            if isinstance(origins, list):
                return origins
        except (json.JSONDecodeError, TypeError):
            pass
        # Fallback: comma-separated string
        return [o.strip() for o in raw.split(",") if o.strip()]

    CORS_ORIGINS: list[str] = _parse_cors_origins()

    # ── SQLite (auth DB) ──
    SQLITE_DB_DIR: str = os.getenv(
        "SQLITE_DB_DIR",
        str(_BACKEND_DIR / "database"),
    )

    # ── MongoDB ──
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "agri_portal")

    # ── Uploads / Avatar ──
    BACKEND_BASE_URL: str = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")

    # ── Gemini AI ──
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")


settings = Settings()
