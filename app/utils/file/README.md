# 文件工具函数目录 (File Utilities)

此目录包含与文件处理相关的所有工具函数，按照功能领域组织。通过集中管理和分类组织，避免了代码重复和跨文件的功能冗余。

## 目录结构

- `index.ts` - 集中导出所有文件工具函数
- `type.ts` - 文件类型处理（类型识别、分类、过滤等）
- `path.ts` - 文件路径处理（路径解析、合并、规范化等）
- `sort.ts` - 文件排序功能（按名称、日期、大小等排序）
- `format.ts` - 文件格式化（大小、日期等格式化）
- `converter.ts` - 文件转换功能（格式转换等）

## 使用指南

### 导入规范

为保持一致性，所有文件工具函数应通过统一入口导入：

```typescript
// 推荐：从统一入口导入
import { getFileType, sortFiles, formatFileSize } from '@/app/utils/file';

// 不推荐：直接从子模块导入
import { getFileType } from '@/app/utils/file/type';
import { sortFiles } from '@/app/utils/file/sort';
```

### 功能分类

#### 文件类型处理 (type.ts)

- `getFileCategory` - 根据MIME类型和扩展名确定文件分类
- `getFileIcon` - 获取文件对应的图标名称
- `getFileType` - 处理文件类型显示
- `filterFilesByType` - 根据文件类型过滤文件列表
- `buildFileTypeFilter` - 构建数据库查询条件获取特定类型的文件

#### 文件路径处理 (path.ts)

- `getFileNameAndExtension` - 获取文件名和后缀
- `getFilePath` - 获取文件所在目录路径
- `getExtension` - 获取文件扩展名
- `getBaseName` - 获取不带扩展名的文件名
- `joinPath` - 合并路径片段
- `normalizePath` - 规范化路径
- `isValidPath` - 检查是否是有效的文件路径

#### 文件排序功能 (sort.ts)

- `sortFiles` - 排序文件列表

#### 文件格式化 (format.ts)

- `formatFileSize` - 格式化文件大小
- `formatDate` - 格式化文件日期

#### 文件转换功能 (converter.ts)

- `convertBytesToBase64` - 转换二进制数据为Base64
- `convertBase64ToBlob` - 转换Base64为Blob对象

## 注意事项

1. 所有新功能应放在合适的模块中，避免功能重复
2. 修改现有功能时，确保不破坏现有API
3. 添加适当的JSDoc文档注释
4. 保持函数的纯函数特性，避免副作用
5. 避免在工具函数中直接依赖业务逻辑 