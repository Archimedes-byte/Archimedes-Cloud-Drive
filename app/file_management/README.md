# 文件管理模块重构报告

## 重构概述
我们对文件管理模块进行了重构，主要解决了重复定义的样式组件和布局问题。重构后的代码结构更加清晰，组件更加模块化和可复用。

## 主要改进
1. 创建了统一的共享样式库 `styles/shared.module.css`
2. 建立了标准化的共享组件库 `components/shared/`
3. 删除了重复的组件和样式定义
4. 优化了组件的接口设计，提高了可复用性

## 新增文件
- `app/file_management/styles/shared.module.css` - 统一的样式库
- `app/file_management/components/shared/Sidebar.tsx` - 统一的侧边栏组件
- `app/file_management/components/shared/Breadcrumb.tsx` - 统一的面包屑组件
- `app/file_management/components/shared/FileList.tsx` - 统一的文件列表组件
- `app/file_management/components/shared/UploadModal.tsx` - 统一的上传模态窗口组件
- `app/file_management/components/shared/index.ts` - 共享组件导出文件

## 删除的重复文件
- `app/file_management/components/Sidebar.tsx` 和 `app/file_management/components/Sidebar.module.css`
- `app/file_management/main/components/Sidebar/`
- `app/file_management/components/Breadcrumb.tsx` 和 `app/file_management/components/Breadcrumb.module.css`
- `app/file_management/main/components/Breadcrumb/`
- `app/file_management/components/FileList.tsx` 和 `app/file_management/components/FileList.module.css`
- `app/file_management/main/components/FileList/`
- `app/file_management/components/UploadModal.tsx` 和 `app/file_management/components/UploadModal.module.css`
- `app/file_management/components/UploadModal/index.tsx`

## 使用方法
从共享组件库导入组件：
```javascript
import { Sidebar, Breadcrumb, FileList, UploadModal } from '../components/shared';
```

## 后续优化建议
1. 继续整合其他重复的组件
2. 建立完整的组件样式指南
3. 添加组件测试
4. 考虑使用更现代的状态管理解决方案 

# 文件管理系统状态管理

本项目使用全局状态管理系统来管理文件操作、UI状态和用户数据。本文档介绍状态管理的架构和使用方法。

## 状态管理架构

状态管理系统基于React Context API和useReducer实现，提供了集中式的状态管理解决方案。

### 核心组件

- **AppStateContext.tsx**: 全局状态管理器，定义状态结构、reducer和context
- **hooks/**: 功能性hooks，按领域划分关注点

### 状态领域

状态被分成多个领域，每个领域负责不同的功能区域：

1. **files**: 文件列表与操作状态
2. **ui**: 界面元素显示状态
3. **preview**: 文件预览与编辑状态
4. **search**: 搜索功能状态
5. **user**: 用户信息状态

## 功能Hooks

为了便于使用，我们提供了一系列功能性hooks，它们封装了对全局状态的操作：

1. **useAppFiles**: 文件列表管理
   ```typescript
   const { 
     files, isLoading, currentFolderId, folderPath, 
     loadFiles, setCurrentFolderId, setFolderPath 
   } = useAppFiles();
   ```

2. **useAppFileActions**: 文件操作功能
   ```typescript
   const { 
     handleSelectFile, handleDownload, handleDelete, 
     handleCreateFolder 
   } = useAppFileActions();
   ```

3. **useAppUIState**: UI状态管理
   ```typescript
   const { 
     sidebarVisible, setSidebarVisible, 
     isUploadModalOpen, setIsUploadModalOpen 
   } = useAppUIState();
   ```

4. **useAppSearch**: 搜索功能
   ```typescript
   const { 
     searchQuery, setSearchQuery, searchResults, 
     handleSearch 
   } = useAppSearch();
   ```

5. **useAppFilePreview**: 文件预览和重命名
   ```typescript
   const { 
     previewFile, handlePreviewFile, 
     handleRenameButtonClick, handleRenameFile 
   } = useAppFilePreview();
   ```

6. **useAppUserProfile**: 用户资料管理
   ```typescript
   const { 
     userProfile, fetchUserProfile, 
     updateUserProfile 
   } = useAppUserProfile();
   ```

## 使用指南

### 1. 在页面根组件包裹全局状态Provider

```tsx
// app/file_management/main/layout.tsx
import { AppStateProvider } from './AppStateProvider';

export default function FileManagementLayout({ children }) {
  return (
    <AppStateProvider>
      {children}
    </AppStateProvider>
  );
}
```

### 2. 在组件中使用功能hooks

```tsx
import { useAppFiles } from '../hooks/useAppFiles';
import { useAppFileActions } from '../hooks/useAppFileActions';

function MyComponent() {
  const { files, loadFiles } = useAppFiles();
  const { handleDownload } = useAppFileActions();
  
  // 使用状态和方法...
}
```

### 3. 根据功能需要选择合适的hooks

- 文件列表和导航 → useAppFiles
- 文件操作 → useAppFileActions
- UI状态控制 → useAppUIState
- 搜索功能 → useAppSearch
- 文件预览 → useAppFilePreview
- 用户资料 → useAppUserProfile

## 最佳实践

1. **避免过度使用全局状态**: 如果状态只在组件内部使用，考虑使用组件内部状态
2. **尽量使用封装的hooks**: 不要直接使用useAppState，而是使用专门的功能hooks
3. **保持状态更新的一致性**: 所有状态更新应该通过hooks提供的方法进行，不要直接修改状态
4. **遵循单向数据流**: 保持状态更新的单向流动，避免循环依赖

## API响应格式

所有API响应都遵循统一的响应格式：

```typescript
interface ApiResponse<T = any> {
  success: boolean;      // 操作是否成功
  data?: T;              // 响应数据
  error?: string;        // 错误信息
  code?: string;         // 错误代码
  message?: string;      // 提示消息
  errors?: Record<string, string[]>; // 字段验证错误
  timestamp: number;     // 响应时间戳
}
```

## 使用API客户端

统一的API客户端可用于与后端交互：

```typescript
import { api } from '@/app/lib/api/client';

// GET请求
const data = await api.get('/api/files', { params: { folderId } });

// POST请求
const result = await api.post('/api/folders', { name, parentId });
``` 