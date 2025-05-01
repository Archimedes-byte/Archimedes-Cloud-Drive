# 工具函数库

## 概述

本工具库提供了项目中使用的各种实用函数。为避免代码重复，提高可维护性，所有通用功能都应从这个统一的工具模块导入。

## 模块结构

工具函数按照功能领域组织成子模块：

- `api` - API请求和响应处理
- `date` - 日期和时间处理
- `error` - 错误处理和异常管理
- `file` - 文件处理（类型判断、格式化、路径处理等）
- `format` - 格式化工具（类名、样式合并等）
- `function` - 函数增强（防抖、节流、延迟等）
- `logger` - 日志记录
- `security` - 安全相关（加密、令牌验证等）
- `string` - 字符串处理
- `user` - 用户相关工具
- `validation` - 数据验证

## 使用方式

### 导入规范

为避免命名冲突，推荐使用命名空间方式导入子模块：

```typescript
// 推荐：使用命名空间导入
import { file, format, errors } from '@/app/utils';

// 使用
const fileSize = file.formatFileSize(1024);
const className = format.cn('btn', 'btn-primary');
```

对于常用的单独函数，可以直接导入：

```typescript
// 直接导入常用函数
import { debounce, throttle } from '@/app/utils';

// 使用
const debouncedFn = debounce(() => {
  // 处理函数
}, 300);
```

### 避免重复导入

不要从子模块直接导入函数，始终从主入口导入：

```typescript
// 正确
import { file } from '@/app/utils';

// 错误
import { formatFileSize } from '@/app/utils/file/formatter';
```

## 重要子模块

### 文件工具 (`file`)

提供文件处理相关功能，包括类型判断、格式化、路径处理等。所有与文件相关的处理都应使用此模块，而不是使用分散在不同地方的类似功能。

```typescript
import { file } from '@/app/utils';

const fileType = file.getFileCategory('image/png', 'png');
const formattedSize = file.formatFileSize(1024 * 1024);
```

### 函数工具 (`function`)

提供常用的函数增强功能，如防抖、节流、延迟等。

```typescript
import { debounce, throttle, delay } from '@/app/utils';

const debouncedSearch = debounce((query) => {
  // 搜索逻辑
}, 300);
```

### 格式化工具 (`format`)

提供各种格式化功能，包括CSS类名合并等。

```typescript
import { format } from '@/app/utils';

const className = format.cn(
  'base-class',
  isActive && 'active',
  { 'disabled': isDisabled }
);
```

## 注意事项

1. 添加新工具时，确保放入正确的子模块，并避免功能重复
2. 遵循纯函数原则，避免副作用
3. 提供完整的类型定义和文档注释
4. 保持API一致性和向后兼容性 