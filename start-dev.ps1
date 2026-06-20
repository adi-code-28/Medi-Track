param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $Root "backend"
$FrontendDir = Join-Path $Root "frontend"
$BackendLogs = Join-Path $BackendDir "logs"
$FrontendLogs = Join-Path $FrontendDir "logs"

New-Item -ItemType Directory -Force -Path $BackendLogs, $FrontendLogs | Out-Null

$processPath = [System.Environment]::GetEnvironmentVariable("Path", "Process")
if ([string]::IsNullOrWhiteSpace($processPath)) {
    $processPath = [System.Environment]::GetEnvironmentVariable("PATH", "Process")
}
[System.Environment]::SetEnvironmentVariable("Path", $processPath, "Process")
[System.Environment]::SetEnvironmentVariable("PATH", $null, "Process")

function Test-PortInUse {
    param([int]$Port)

    $listener = netstat -ano | Select-String ":$Port\s+.*LISTENING"
    return [bool]$listener
}

function Get-BackendPython {
    $candidates = @(
        (Join-Path $BackendDir ".venv-run\Scripts\python.exe"),
        (Join-Path $BackendDir ".venv\Scripts\python.exe"),
        "python"
    )

    foreach ($candidate in $candidates) {
        $result = & $candidate -c "import fastapi" 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $candidate
        }
    }

    throw "Backend dependencies are not installed. Run: cd backend; python -m venv .venv-run; .\.venv-run\Scripts\python.exe -m pip install -r requirements.txt"
}

if (Test-PortInUse -Port $BackendPort) {
    Write-Host "Backend already listening on http://127.0.0.1:$BackendPort"
} else {
    $python = Get-BackendPython
    $backendOut = Join-Path $BackendLogs "backend.out.log"
    $backendErr = Join-Path $BackendLogs "backend.err.log"
    Start-Process -FilePath $python `
        -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "$BackendPort", "--reload") `
        -WorkingDirectory $BackendDir `
        -RedirectStandardOutput $backendOut `
        -RedirectStandardError $backendErr `
        -WindowStyle Hidden | Out-Null
    Write-Host "Started backend on http://127.0.0.1:$BackendPort"
}

if (Test-PortInUse -Port $FrontendPort) {
    Write-Host "Frontend already listening on http://127.0.0.1:$FrontendPort"
} else {
    if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
        throw "Frontend dependencies are not installed. Run: cd frontend; npm install"
    }

    $npm = (Get-Command npm.cmd).Source
    $env:VITE_API_URL = "http://127.0.0.1:$BackendPort"
    $frontendOut = Join-Path $FrontendLogs "frontend.out.log"
    $frontendErr = Join-Path $FrontendLogs "frontend.err.log"
    Start-Process -FilePath $npm `
        -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "$FrontendPort") `
        -WorkingDirectory $FrontendDir `
        -RedirectStandardOutput $frontendOut `
        -RedirectStandardError $frontendErr `
        -WindowStyle Hidden | Out-Null
    Write-Host "Started frontend on http://127.0.0.1:$FrontendPort"
}

Write-Host ""
Write-Host "App:     http://127.0.0.1:$FrontendPort"
Write-Host "API:     http://127.0.0.1:$BackendPort/api/health"
Write-Host "API docs http://127.0.0.1:$BackendPort/docs"
