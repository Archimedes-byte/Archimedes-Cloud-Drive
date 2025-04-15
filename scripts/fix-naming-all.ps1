# Naming convention fix script
# Run all fix scripts in sequence

Write-Host "===== Starting naming convention fixes =====" -ForegroundColor Cyan

# Record start time
$startTime = Get-Date

try {
    # 1. Fix directory names
    Write-Host "`n## Step 1: Fix directory names ##" -ForegroundColor Cyan
    Write-Host "Running fix-directory-names.ps1..."
    & "$PSScriptRoot\fix-directory-names.ps1"
    
    # 2. Fix style file names
    Write-Host "`n## Step 2: Fix style file names ##" -ForegroundColor Cyan
    Write-Host "Running fix-style-names.ps1..."
    & "$PSScriptRoot\fix-style-names.ps1"
    
    # 3. Fix import paths
    if (Test-Path "$PSScriptRoot\fix-imports.ps1") {
        Write-Host "`n## Step 3: Fix import paths ##" -ForegroundColor Cyan
        Write-Host "Running fix-imports.ps1..."
        & "$PSScriptRoot\fix-imports.ps1"
    } else {
        Write-Host "`n## Skipping Step 3: Import path fix script not generated ##" -ForegroundColor Yellow
    }
    
    # 4. Fix style import paths
    if (Test-Path "$PSScriptRoot\fix-style-imports.ps1") {
        Write-Host "`n## Step 4: Fix style import paths ##" -ForegroundColor Cyan
        Write-Host "Running fix-style-imports.ps1..."
        & "$PSScriptRoot\fix-style-imports.ps1"
    } else {
        Write-Host "`n## Skipping Step 4: Style import path fix script not generated ##" -ForegroundColor Yellow
    }
    
    # 5. Run naming check again
    Write-Host "`n## Step 5: Run naming check again ##" -ForegroundColor Cyan
    Write-Host "Running naming-check.js..."
    node "$PSScriptRoot\naming-check.js"
    
    # Calculate duration
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    # Done info
    Write-Host "`n===== Naming convention fixes completed =====" -ForegroundColor Green
    Write-Host "Total time: $($duration.Minutes) minutes $($duration.Seconds) seconds" -ForegroundColor Cyan
} 
catch {
    Write-Host "`n===== Error during naming convention fixes =====" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
} 