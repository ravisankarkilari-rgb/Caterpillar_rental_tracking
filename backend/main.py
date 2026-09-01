import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from backend.database import engine, Base, SessionLocal, get_db, get_database_info
from backend.services.seed_data import seed_database
from backend.routers import equipment, rentals, alerts, analytics, entities, auth, users, settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("caterpillar_rental_system")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)

    # Database migration column check
    db = SessionLocal()
    try:
        try:
            db.execute(text("ALTER TABLE equipment ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;"))
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);"))
            db.commit()
        except Exception:
            db.rollback()

        seed_database(db)
        logger.info("Database initialized and verified with seed data.")
    finally:
        db.close()
        
    yield
    logger.info("Shutting down Smart Rental Tracking System backend.")

app = FastAPI(
    title="Smart Rental Tracking System API",
    description="Enterprise equipment rental tracking, telemetry, anomaly detection, and demand forecasting API.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(equipment.router)
app.include_router(rentals.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(entities.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(settings.router)

@app.get("/")
def root():
    return {
        "system": "Smart Rental Tracking System",
        "status": "online",
        "docs_url": "/docs",
        "api_v1_prefix": "/api/v1"
    }

@app.get("/api/health")
def health_check():
    db_info = get_database_info()
    return {
        "status": "healthy",
        "database": db_info["engine"],
        "cloud": db_info["is_cloud"],
    }

@app.get("/api/v1/db-info", tags=["System"])
def database_info(db: Session = Depends(get_db)):
    """
    Returns metadata about the active database — useful for panel demos.
    Shows database engine, table names, row counts, and server version.
    """
    db_info = get_database_info()

    # Get table names and row counts
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    table_stats = []
    for table_name in sorted(table_names):
        try:
            row = db.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).fetchone()
            count = row[0] if row else 0
        except Exception:
            count = -1
        table_stats.append({"table": table_name, "row_count": count})

    return {
        "engine": db_info["engine"],
        "url_scheme": db_info["url_scheme"],
        "is_cloud": db_info["is_cloud"],
        "server_version": db_info.get("server_version"),
        "tables": table_stats,
        "total_tables": len(table_stats),
    }

