# PowerShell setup script for ERP project

# --------------------------------------------------
# Verify required versions
# --------------------------------------------------
$pythonVersion = (python --version) 2>&1 | ForEach-Object { $_ -replace 'Python ', '' }
if ([Version]$pythonVersion -lt [Version]'3.10') { Write-Error 'Python 3.10+ required'; exit 1 }

$nodeVersion = (node --version) -replace 'v',''
if ([Version]$nodeVersion -lt [Version]'18.0.0') { Write-Error 'Node 18+ required'; exit 1 }

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { Write-Error 'Postgres client (psql) required'; exit 1 }

# --------------------------------------------------
# Environment file
# --------------------------------------------------
if (-Not (Test-Path .env)) { Copy-Item .env.example .env }

# --------------------------------------------------
# Python virtual environment
# --------------------------------------------------
if (-Not (Test-Path .venv)) { python -m venv .venv }
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend\requirements.txt

# --------------------------------------------------
# Node dependencies
# --------------------------------------------------
Set-Location frontend
npm install
Set-Location ..

# --------------------------------------------------
# Database migrations (Alembic)
# --------------------------------------------------
alembic -c backend\alembic.ini upgrade head

# --------------------------------------------------
# Start services
# --------------------------------------------------
# Backend (FastAPI) on port 8007
Start-Process -FilePath "uvicorn" -ArgumentList "backend/app.main:app","--host","0.0.0.0","--port","8007" -NoNewWindow
# Frontend (React) on port 5179
Start-Process -FilePath "npm" -ArgumentList "run","dev","--","--port","5179" -WorkingDirectory "frontend"

Write-Host "✅ ERP project started. Backend: http://localhost:8007, Frontend: http://localhost:5179"
