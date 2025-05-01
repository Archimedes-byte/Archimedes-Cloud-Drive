# 文件工具模块

## 概述

此模块提供了一系列文件处理相关的实用函数，包括文件类型判断、格式化、路径处理、排序和转换等功能。

## 目录结构

- `index.ts` - 主入口文件，导出所有文件工具函数
- `type.ts` - 文件类型判断相关工具
- `formatter.ts` - 文件格式化相关工具（大小、日期等）
- `path.ts` - 文件路径处理工具
- `sort.ts` - 文件排序工具
- `converter.ts` - 文件转换工具
- `icon-map.tsx` - 文件图标映射

## 主要功能

### 文件类型判断 (`type.ts`)

- `getFileIcon()` - 根据文件类型获取图标
- `getFileType()` - 获取用户友好的文件类型描述
- `getFileCategory()` - 获取文件分类
- `getFileExtension()` - 获取文件扩展名
- `getFileNameAndExtension()` - 分离文件名和扩展名
- `isImageFile()`, `isDocumentFile()` 等 - 快速判断文件类型

### 文件格式化 (`formatter.ts`)

- `formatFileSize()` - 格式化文件大小（如 "10.5 MB"）
- `formatDate()` - 格式化日期
- `getRelativeTimeString()` - 获取相对时间描述（如 "3分钟前"）

### 文件路径处理 (`path.ts`)

- `joinPath()` - 连接路径片段
- `getDirectoryPath()` - 获取目录路径
- `getBasename()` - 获取文件基本名称
- `normalizePath()` - 规范化路径

### 文件排序 (`sort.ts`)

- `sortFiles()` - 通用文件排序函数
- `sortByName()` - 按名称排序
- `sortBySize()` - 按大小排序
- `sortByDate()` - 按日期排序

## 使用示例

```typescript
import { file } from '@/app/utils';

// 文件类型判断
const fileType = file.getFileCategory('image/png', 'png');
const icon = file.getFileIcon('image/png', 'png', false);

// 文件格式化
const size = file.formatFileSize(1024 * 1024); // "1 MB"
const date = file.formatDate(new Date()); // "2023-05-20 14:30"

// 文件路径处理
const path = file.joinPath('documents', 'reports', 'annual.pdf');
```

## 注意事项

1. 使用命名空间导入以避免命名冲突：
   ```typescript
   import { file } from '@/app/utils';
   ```

2. 不要直接从子模块导入函数，应始终从主入口导入：
   ```typescript
   // 正确
   import { file } from '@/app/utils';
   
   // 错误
   import { formatFileSize } from '@/app/utils/file/formatter';
   ```

3. 此模块已替代了旧的存储模块中的重复函数，所有文件处理相关功能现在都应从此模块导入。 