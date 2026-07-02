# Starts the Primer backend + frontend in two PowerShell windows (Windows dev helper).
# Usage:  right-click > Run with PowerShell,  or  ./start-dev.ps1
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# Ensure backend/.env exists so the app has config.
$envPath = Join-Path $root "backend/.env"
if (-not (Test-Path $envPath)) {
    Copy-Item (Join-Path $root "backend/.env.example") $envPath
    Write-Host "Created backend/.env from the example." -ForegroundColor Yellow
    Write-Host "Remember to add your ANTHROPIC_API_KEY to backend/.env" -ForegroundColor Yellow
}

$venvPy = Join-Path $root "backend/.venv/Scripts/python.exe"
if (-not (Test-Path $venvPy)) {
    Write-Host "Backend venv not found. Run the one-time setup first:" -ForegroundColor Red
    Write-Host "  cd backend; python -m venv .venv; .venv\Scripts\Activate.ps1; pip install -r requirements.txt"
    exit 1
}

Write-Host "Starting backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root/backend'; & '$venvPy' -m uvicorn app.main:app --reload --port 8000"

Write-Host "Starting frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root/frontend'; npm run dev"

Write-Host ""
Write-Host "Both servers launching in separate windows." -ForegroundColor Cyan
Write-Host "Open http://localhost:5173  (passcode: prakruthi)" -ForegroundColor Cyan
