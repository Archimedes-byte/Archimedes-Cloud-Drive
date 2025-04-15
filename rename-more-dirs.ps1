# 重命名剩余的文件夹为kebab-case格式
$baseDir = "D:\cloud-drive\app\components\features\file-management"

# 需要重命名的文件夹列表
$foldersToRename = @(
    "folderManagement,folder-management",
    "fileView,file-view",
    "filePreview,file-preview",
    "fileOperations,file-operations",
    "fileList,file-list",
    "Favorites,favorites",
    "actionBar,action-bar"
)

foreach ($folder in $foldersToRename) {
    $parts = $folder.Split(',')
    $oldName = $parts[0]
    $newName = $parts[1]
    
    $oldPath = Join-Path -Path $baseDir -ChildPath $oldName
    $newPath = Join-Path -Path $baseDir -ChildPath $newName
    
    if (Test-Path $oldPath) {
        Write-Host "正在重命名 $oldName 为 $newName"
        Rename-Item -Path $oldPath -NewName $newName -Force
    } else {
        Write-Host "找不到目录: $oldPath"
    }
}

Write-Host "目录重命名完成!" 