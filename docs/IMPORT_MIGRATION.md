# 导入路径迁移指南

为提高代码质量和维护性，我们已经完全移除了项目中的所有向后兼容性代码。本文档将帮助您更新现有代码中的导入路径。

## 必须更新的导入

以下导入路径已被移除，必须迁移到新的标准路径：

### 1. 字符串工具函数

❌ **已移除**:
```typescript
import { capitalizeFirstLetter, truncateString } from '@/app/utils/string';
```

✅ **迁移到**:
```typescript
import { capitalizeFirstLetter, truncateText } from '@/app/utils/format';
```

### 2. 文件工具函数

❌ **已移除**:
```typescript
// 从子模块直接导入
import { getFileNameAndExtension } from '@/app/utils/file/path';
import { formatFileSize } from '@/app/utils/file/formatter';
import { getFileIcon, getFileType } from '@/app/utils/file/type';
```

✅ **迁移到**:
```typescript
// 从主模块导入所有功能
import { 
  getFileNameAndExtension,
  formatFileSize,
  getFileIcon,
  getFileType
} from '@/app/utils/file';
```

### 3. UI组件

❌ **已移除**:
```typescript
import { Button, Input, Table } from '@/app/components/ui';
```

✅ **迁移到**:
```typescript
import { Button, Input, Table } from '@/app/components/ui/ant';
```

## 使用VSCode全局替换

使用以下搜索模式和替换模式在整个项目中快速更新导入路径：

### 1. 更新文件子模块导入

**搜索**: 
```
import \{([^}]+)\} from ['"]@/app/utils/file/(path|type|formatter)['"];
```

**替换**: 
```
import {$1} from '@/app/utils/file';
```

### 2. 更新UI组件导入

**搜索**: 
```
import \{([^}]+)\} from ['"]@/app/components/ui['"];
```

**替换**: 
```
import {$1} from '@/app/components/ui/ant';
```

### 3. 更新字符串工具函数导入

**搜索**: 
```
import \{([^}]*)(capitalizeFirstLetter|truncateString)([^}]*)\} from ['"]@/app/utils/string['"];
```

**替换**: 
```
import {$1capitalizeFirstLetter$3} from '@/app/utils/format';
```

## 测试您的迁移

完成导入路径替换后，务必运行以下命令以确保所有内容正常工作：

```bash
# 构建项目
npm run build

# 运行测试
npm test
```

## 迁移支持

如果您在迁移过程中遇到任何问题，请联系项目架构师或参考最新的 [代码组织与最佳实践](./CODE_ORGANIZATION.md) 文档。 