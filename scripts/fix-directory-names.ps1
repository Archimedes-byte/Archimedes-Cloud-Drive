# Fix directory naming convention script
# Convert PascalCase and camelCase directory names to kebab-case

# Define directories to fix
$directories = @(
    # Block 1: auth and common components
    "app\auth\login\components\LoginForm",
    "app\auth\login\components\SocialLogin",
    "app\auth\register\components\RegisterForm",
    "app\components\common\media\AudioVisualizer",
    
    # Block 2: dashboard components
    "app\components\features\dashboard\analytics\StorageUsage",
    "app\components\features\dashboard\AvatarCropper",
    "app\components\features\dashboard\EditProfileForm",
    "app\components\features\dashboard\FormField",
    "app\components\features\dashboard\Modal",
    "app\components\features\dashboard\navigation\Navbar",
    "app\components\features\dashboard\PasswordForm",
    "app\components\features\dashboard\ProfileCompleteness",
    "app\components\features\dashboard\ProfileContent",
    "app\components\features\dashboard\ProfileHeader",
    "app\components\features\dashboard\Toaster",
    
    # Block 3: file-management components
    "app\components\features\file-management\action-bar\SortDropdown",
    "app\components\features\file-management\action-bar\TopActionBar",
    "app\components\features\file-management\file-list\FileGrid",
    "app\components\features\file-management\file-list\FileList",
    "app\components\features\file-management\file-operations\RenameModal",
    "app\components\features\file-management\file-preview\FilePreview",
    "app\components\features\file-management\folder-management\NewFolderForm",
    "app\components\features\file-management\navigation\Breadcrumb",
    "app\components\features\file-management\navigation\MiniSidebar",
    "app\components\features\file-management\navigation\Sidebar",
    "app\components\features\file-management\shared\ErrorDisplay",
    "app\components\features\file-management\shared\Skeleton",
    "app\components\features\file-management\sharing\ShareModal",
    "app\components\features\file-management\toolbar\Toolbar",
    "app\components\features\file-management\upload\FileUpload",
    "app\components\features\file-management\upload\UploadButton",
    "app\components\features\file-management\upload\UploadModal",
    
    # Block 4: user-profile components (both kebab-case and camelCase versions)
    "app\components\features\user-profile\editForm",
    "app\components\features\user-profile\passwordForm",
    "app\components\features\user-profile\profileContent",
    "app\components\features\user-profile\profileHeader",
    "app\components\features\userProfile",
    "app\components\features\userProfile\editForm",
    "app\components\features\userProfile\passwordForm",
    "app\components\features\userProfile\profileContent",
    "app\components\features\userProfile\profileHeader"
)

$renamedDirs = @()

# Process each directory
foreach ($dir in $directories) {
    # Skip if directory doesn't exist
    if (!(Test-Path $dir)) {
        Write-Host "Directory not found: $dir" -ForegroundColor Yellow
        continue
    }
    
    # Get directory name and parent path
    $dirName = Split-Path -Leaf $dir
    $parentPath = Split-Path -Parent $dir
    
    # Convert to kebab-case
    $kebabCase = $dirName -replace '([a-z])([A-Z])', '$1-$2' -replace '([A-Z])([A-Z][a-z])', '$1-$2'
    $kebabCase = $kebabCase.ToLower()
    
    # Skip if already in kebab-case
    if ($kebabCase -eq $dirName) {
        Write-Host "Already in kebab-case: $dir" -ForegroundColor Green
        continue
    }
    
    $newPath = Join-Path $parentPath $kebabCase
    Write-Host "Renaming: $dir -> $newPath" -ForegroundColor Cyan
    
    # Check if target already exists
    if (Test-Path $newPath) {
        Write-Host "  Target already exists, copying files instead" -ForegroundColor Yellow
        
        # Copy files
        Get-ChildItem -Path $dir -Recurse | ForEach-Object {
            $relPath = $_.FullName.Substring($dir.Length)
            $targetPath = $newPath + $relPath
            
            if ($_.PSIsContainer) {
                # Create directory if it doesn't exist
                if (!(Test-Path $targetPath)) {
                    New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
                }
            } else {
                # Copy file if it doesn't exist
                if (!(Test-Path $targetPath)) {
                    Copy-Item -Path $_.FullName -Destination $targetPath -Force
                }
            }
        }
    } else {
        # Rename directory if target doesn't exist
        Rename-Item -Path $dir -NewName $kebabCase
    }
    
    # Add to renamed directories list
    $renamedDirs += @{
        OldPath = $dir
        NewPath = $newPath
    }
}

# Generate fix-imports.ps1 script
if ($renamedDirs.Count -gt 0) {
    $script = @"
# Auto-generated script to fix imports after directory renames
`$files = Get-ChildItem -Path . -Recurse -Include *.ts,*.tsx,*.js,*.jsx
foreach (`$file in `$files) {
    `$content = Get-Content `$file.FullName -Raw
    `$changed = `$false

"@

    foreach ($dir in $renamedDirs) {
        $oldPath = $dir.OldPath.Replace('\', '\\')
        $newPath = $dir.NewPath.Replace('\', '\\')
        
        $script += @"
    # Replace $oldPath with $newPath
    `$newContent = `$content -replace '$oldPath', '$newPath'
    if (`$newContent -ne `$content) {
        `$content = `$newContent
        `$changed = `$true
    }

"@
    }

    $script += @"
    # Write changes if needed
    if (`$changed) {
        Set-Content -Path `$file.FullName -Value `$content -Encoding UTF8
        Write-Host "Fixed imports in: `$(`$file.FullName)" -ForegroundColor Green
    }
}
"@

    $script | Out-File -FilePath "scripts/fix-imports.ps1" -Encoding utf8
    Write-Host "`nGenerated import fix script: scripts/fix-imports.ps1" -ForegroundColor Green
}

Write-Host "`nDirectory renaming completed." -ForegroundColor Green 