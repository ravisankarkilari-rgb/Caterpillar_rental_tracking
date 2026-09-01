import os
import logging
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# ---------------------------------------------------------------------------
# Auto-load .env file (if python-dotenv is installed)
# ---------------------------------------------------------------------------
try:
    from dotenv import load_dotenv
    # Walk up from backend/ to project root to find .env
    _project_root = Path(__file__).resolve().parent.parent
    _env_path = _project_root / ".env"
    if _env_path.exists():
        load_dotenv(_env_path)
        logging.getLogger(__name__).info("Loaded environment from %s", _env_path)
except ImportError:
    pass  # dotenv not installed — rely on system environment variables

# ---------------------------------------------------------------------------
# Database URL resolution
# ---------------------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./rental_system.db")

# Supabase sometimes provides legacy postgres:// scheme — SQLAlchemy requires postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# ---------------------------------------------------------------------------
# Engine configuration (SQLite vs PostgreSQL / Supabase)
# ---------------------------------------------------------------------------
_is_sqlite = DATABASE_URL.startswith("sqlite")

if _is_sqlite:
    # SQLite: local dev — no pooling needed, disable same-thread check for FastAPI
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    # PostgreSQL / Supabase: production — enable connection pooling
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_size=20,         # Maintain 20 persistent connections
        max_overflow=30,      # Allow up to 30 additional burst connections
        pool_timeout=30,      # Wait up to 30s for pool connection
        pool_pre_ping=True,   # Verify connections are alive before checkout
        pool_recycle=300,     # Recycle connections every 5 minutes (Supabase timeout safety)
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# ---------------------------------------------------------------------------
# Dependency — FastAPI request-scoped DB session
# ---------------------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------------------------------------------------------
# Helper — report active database engine type (used by health / db-info)
# ---------------------------------------------------------------------------
def get_database_info() -> dict:
    """Return metadata about the active database connection."""
    db_type = "PostgreSQL (Supabase)" if not _is_sqlite else "SQLite"
    info = {
        "engine": db_type,
        "url_scheme": DATABASE_URL.split("://")[0] if "://" in DATABASE_URL else "unknown",
        "is_cloud": not _is_sqlite,
    }
    # Attempt to fetch PostgreSQL version string
    if not _is_sqlite:
        try:
            with engine.connect() as conn:
                row = conn.execute(text("SELECT version()")).fetchone()
                info["server_version"] = row[0] if row else "unknown"
        except Exception:
            info["server_version"] = "unavailable"
    return info
