# 重命名文件夹为kebab-case格式
$baseDir = "D:\cloud-drive\app\components\features\file-management"

# 需要重命名的文件夹列表
$foldersToRename = @(
    "SearchView,search-view",
    "RenameModal,rename-modal",
    "NoSearchResults,no-search-results",
    "RecentSearches,recent-searches",
    "FileListItem,file-list-item",
    "Favorites,favorites"
)

foreach ($folder in $foldersToRename) {
    $parts = $folder.Split(',')
    $oldName = $parts[0]
    $newName = $parts[1]
    
    $oldPath = Join-Path -Path $baseDir -ChildPath $oldName
    $newPath = Join-Path -Path $baseDir -ChildPath $newName
    
    if (Test-Path $oldPath) {
        Write-Host "正在重命名 $oldPath 为 $newPath"
        Rename-Item -Path $oldPath -NewName $newName -Force
    } else {
        Write-Host "找不到目录: $oldPath"
    }
}

Write-Host "目录重命名完成!" 