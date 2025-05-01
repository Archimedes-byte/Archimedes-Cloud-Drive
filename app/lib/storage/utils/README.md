# 存储工具模块

## 概述

此模块提供与存储系统特定相关的工具函数。通用的文件处理功能已移至 `@/app/utils/file` 模块，本模块仅包含存储系统特有的功能。

## 文件结构

- `index.ts` - 主入口，导出所有存储工具函数
- `download.ts` - 文件下载相关功能
- `storage-utils.ts` - 存储特定的辅助功能

## 主要功能

### 下载功能 (`download.ts`)

提供文件下载相关的功能，支持大文件分片下载、断点续传等。

### 存储特定功能 (`storage-utils.ts`)

- `validateUploadFile()` - 验证文件是否可上传
- `addStoragePrefix()` - 为存储路径添加前缀
- `removeStoragePrefix()` - 从存储路径中移除前缀

## 使用示例

```typescript
import { validateUploadFile, addStoragePrefix } from '@/app/lib/storage/utils';

// 验证文件上传
const file = new File(["content"], "example.txt");
const { valid, message } = validateUploadFile(file);

// 路径处理
const storagePath = addStoragePrefix('user/documents/report.pdf');
```

## 重要说明

1. **不要重复实现文件通用功能**：所有通用的文件处理功能（如文件类型判断、格式化等）已移至 `@/app/utils/file` 模块，不应在此处重复实现。

2. **导入通用文件工具**：需要使用通用文件功能时，应从 `@/app/utils/file` 模块导入：

   ```typescript
   import { getFileExtension } from '@/app/utils/file';
   ```

3. **仅添加存储特定功能**：此模块只应包含与存储系统紧密相关的功能，如上传验证、存储路径处理等。 