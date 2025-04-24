# 文件管理模块 (File Management)

本模块包含了云盘系统文件管理相关的UI组件和功能。

## 组件结构

### 导航组件
- `Sidebar`: 主导航侧边栏
- `MiniSidebar`: 迷你导航栏
- `Breadcrumb`: 面包屑导航

### 内容显示组件
- `FileList`: 文件列表组件
- `FilePreview`: 文件预览组件 
- `FavoritesContent`: 收藏内容组件
- `MySharesContent`: 我的分享内容组件
- `RecentFilesContent`: 最近文件组件
- `RecentDownloadsContent`: 最近下载组件

### 操作组件
- `TopActionBar`: 顶部操作栏
- `CreateFolderModal`: 创建文件夹模态窗口
- `RenameModal`: 重命名模态窗口
- `FolderSelectModal`: 文件夹选择模态窗口
- `ShareModal`: 分享模态窗口
- `LinkInputModal`: 链接输入模态窗口
- `CreateFavoriteModal`: 创建收藏夹模态窗口

### 搜索组件
- `SearchView`: 完整搜索视图
- `SearchContainer`: 搜索容器组件
- `SearchInput`: 搜索输入组件
- `SearchResults`: 搜索结果组件

### 布局组件
- `PageLayout`: 页面主布局组件
- `SkeletonPageLayout`: 加载骨架屏

## 重构说明

最近的重构主要集中在以下几个方面：

1. **组件拆分**：将原本庞大的page.tsx文件拆分为多个可复用组件，包括：
   - 提取最近文件和最近下载的组件
   - 将搜索功能拆分为多个组件
   - 创建链接模态窗口组件
   - 页面整体布局组织

2. **状态管理优化**：
   - 更清晰的状态传递
   - 移除冗余状态
   - 增强组件间通信

3. **代码质量提升**：
   - 减少冗余代码
   - 提高代码可维护性和可读性
   - 统一组件风格和状态处理方式

## 使用说明

所有组件可通过统一的入口文件进行导入：

```tsx
import { 
  FileList, 
  Sidebar, 
  SearchContainer,
  // ... 其他组件
} from '@/app/components/features/file-management';
```

主要页面组件已完成重构，现在使用这些可复用组件构建，便于后续维护和扩展。

## 组件目录结构说明

### 收藏相关组件
- `favorites/` - 包含所有收藏相关组件，包括：
  - `FavoritesContent`: 收藏内容展示组件
  - `FavoriteModal`: 收藏文件操作模态窗口
  - `CreateFavoriteModal`: 创建收藏夹模态窗口

### 分享相关组件
- `sharing/` - 包含分享相关模态窗口组件（ShareModal）
- `my-shares/` - 包含我的分享内容展示组件（MySharesContent）

**注意**：
1. 之前存在的`share`目录已被移除，其功能被整合到了上述目录中
2. 之前存在的`favorite`（单数形式）目录已被移除，所有收藏相关组件现在都位于`favorites`（复数形式）目录中 