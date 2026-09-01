@echo off
echo ===================================================
echo   Smart Rental Tracking System - Caterpillar
echo ===================================================
echo.
echo Starting Backend (FastAPI on http://127.0.0.1:8000)...
start "Caterpillar Backend" cmd /k "uvicorn backend.main:app --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo Starting Frontend (Vite on http://localhost:5173)...
start "Caterpillar Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services launched!
echo Open your browser at: http://localhost:5173
echo API Swagger Docs:     http://127.0.0.1:8000/docs
echo ===================================================
