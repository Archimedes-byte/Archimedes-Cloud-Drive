# 文件管理系统 - 状态管理迁移计划

## 概述

本文档记录从旧的独立hooks系统迁移到新的全局状态管理系统的计划。

## 已废弃文件

以下文件已被新的全局状态管理系统替代，将在下一版本中移除：

### Hooks文件

| 旧文件 | 废弃状态 | 新的替代实现 |
|-------|---------|------------|
| `app/file_management/hooks/useFiles.ts` | ✅ 已移除 | `app/file_management/hooks/useAppFiles.ts` |
| `app/file_management/hooks/useFileOperations.ts` | ✅ 已移除 | `app/file_management/hooks/useAppFileActions.ts` |
| `app/file_management/hooks/useFileActions.ts` | ✅ 已移除 | `app/file_management/hooks/useAppFileActions.ts` |
| `app/file_management/hooks/useFileSearch.ts` | ✅ 已移除 | `app/file_management/hooks/useAppSearch.ts` |
| `app/file_management/hooks/useFilePreviewAndRename.ts` | ✅ 已移除 | `app/file_management/hooks/useAppFilePreview.ts` |
| `app/file_management/hooks/useUIState.ts` | ✅ 已移除 | `app/file_management/hooks/useAppUIState.ts` |
| `app/file_management/hooks/useSearch.ts` | ✅ 已移除 | `app/file_management/hooks/useAppSearch.ts` |
| `app/file_management/hooks/useFileUpload.ts` | ✅ 已移除 | `app/file_management/hooks/useAppUpload.ts` |
| `app/file_management/hooks/useUserProfile.ts` | ✅ 已移除 | `app/file_management/hooks/useAppUserProfile.ts` |

### Context文件

| 旧文件 | 废弃状态 | 新的替代实现 |
|-------|---------|------------|
| `app/file_management/context/FileContext.tsx` | ✅ 已移除 | `app/file_management/context/AppStateContext.tsx` |

## 类型定义更新

在 `app/types/fileManagement.ts` 中，以下接口已被标记为废弃：

| 废弃类型 | 新的替代类型 |
|---------|------------|
| `FileContextType` | `AppState` |
| `FileState` | `AppState['files']` |
| `FileOperationsHook` | N/A - 使用 useAppFileActions |
| `FileSearchHook` | N/A - 使用 useAppSearch |
| `FileUploadHook` | N/A - 使用 useAppUpload |

## 实施计划

1. ✅ 所有组件已完成迁移到新的全局状态管理系统
2. ✅ 已在类型文件中添加废弃标记
3. ✅ 已创建 useAppUpload 实现上传功能的全局状态管理
4. ✅ 已将 useUserProfile 的引用更新为 useAppUserProfile
5. ✅ 已删除已废弃的hook文件
6. ✅ 更新了AppStateContext，添加了上传相关的状态管理

## 独立保留的Hooks

以下hooks因功能独立性保留为单独实现：

1. **useThemeManager.ts** - 主题管理功能，与useAppUserProfile集成
2. **useLoadingState.ts** - 通用加载状态管理工具，可在多处复用

## 新的全局状态API使用指南

```typescript
// 1. 在组件中使用文件列表管理
const { files, loadFiles } = useAppFiles();

// 2. 在组件中使用文件操作
const { handleDownload, handleDelete } = useAppFileActions();

// 3. 在组件中使用UI状态管理
const { sidebarVisible, setSidebarVisible } = useAppUIState();

// 4. 在组件中使用搜索功能
const { searchQuery, setSearchQuery } = useAppSearch();

// 5. 在组件中使用文件预览
const { previewFile, handlePreviewFile } = useAppFilePreview();

// 6. 在组件中使用用户资料管理
const { userProfile, updateUserProfile } = useAppUserProfile();

// 7. 在组件中使用文件上传功能
const { isUploading, uploadProgress, handleUpload, handleFolderUpload } = useAppUpload();
``` 