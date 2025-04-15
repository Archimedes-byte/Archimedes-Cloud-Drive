# Fix style file naming convention script
# Convert camelCase style file names to PascalCase

# Style files to fix
$stylesToFix = @(
    # camelCase style files
    "app\styles\pages\authPage.module.css",
    "app\styles\components\loginForm.module.css",
    "app\styles\components\registrationForm.module.css",
    "app\styles\components\profileCard.module.css",
    "app\styles\components\fileUpload.module.css",
    "app\styles\components\modalDialog.module.css",
    "app\styles\components\sidebar.module.css",
    "app\styles\components\darkMode.module.css",
    "app\styles\layouts\mainLayout.module.css",
    "app\styles\layouts\dashboardLayout.module.css",
    "app\styles\features\fileManager.module.css"
)

# Process each style file
foreach ($stylePath in $stylesToFix) {
    # Skip if file doesn't exist
    if (!(Test-Path $stylePath)) {
        Write-Host "Style file not found: $stylePath" -ForegroundColor Yellow
        continue
    }
    
    # Get file info
    $fileInfo = Get-Item $stylePath
    $fileName = $fileInfo.Name
    $directory = $fileInfo.DirectoryName
    
    # Convert to PascalCase - capitalize first letter and keep rest the same
    $newFileName = $fileName.Substring(0, 1).ToUpper() + $fileName.Substring(1)
    
    # Skip if already in PascalCase
    if ($newFileName -eq $fileName) {
        Write-Host "Already in PascalCase: $stylePath" -ForegroundColor Green
        continue
    }
    
    $newPath = Join-Path $directory $newFileName
    Write-Host "Renaming: $stylePath -> $newPath" -ForegroundColor Cyan
    
    # Check if target already exists
    if (Test-Path $newPath) {
        Write-Host "  Target already exists, skipping" -ForegroundColor Yellow
        continue
    }
    
    # Rename file if target doesn't exist
    Rename-Item -Path $stylePath -NewName $newFileName
}

# Generate fix-style-imports.ps1 script
$script = @"
# Auto-generated script to fix style imports after file renames
`$files = Get-ChildItem -Path . -Recurse -Include *.ts,*.tsx,*.js,*.jsx
foreach (`$file in `$files) {
    `$content = Get-Content `$file.FullName -Raw
    `$changed = `$false

"@

foreach ($stylePath in $stylesToFix) {
    $fileInfo = Get-Item $stylePath -ErrorAction SilentlyContinue
    if ($fileInfo) {
        $fileName = $fileInfo.Name
        $newFileName = $fileName.Substring(0, 1).ToUpper() + $fileName.Substring(1)
        $oldImport = $fileName.Replace('.', '\.')
        $newImport = $newFileName.Replace('.', '\.')
        
        $script += @"
    # Replace $fileName with $newFileName
    `$newContent = `$content -replace '$oldImport', '$newImport'
    if (`$newContent -ne `$content) {
        `$content = `$newContent
        `$changed = `$true
    }

"@
    }
}

$script += @"
    # Write changes if needed
    if (`$changed) {
        Set-Content -Path `$file.FullName -Value `$content -Encoding UTF8
        Write-Host "Fixed style imports in: `$(`$file.FullName)" -ForegroundColor Green
    }
}
"@

$script | Out-File -FilePath "scripts/fix-style-imports.ps1" -Encoding utf8
Write-Host "`nGenerated style import fix script: scripts/fix-style-imports.ps1" -ForegroundColor Green
Write-Host "`nStyle file renaming completed." -ForegroundColor Green 