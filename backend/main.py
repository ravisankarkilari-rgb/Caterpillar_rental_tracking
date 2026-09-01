import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base, SessionLocal
from backend.services.seed_data import seed_database
from backend.routers import equipment, rentals, alerts, analytics, entities, auth

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("caterpillar_rental_system")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    # Seed initial demo fleet & logs
    db = SessionLocal()
    try:
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
    return {"status": "healthy"}
