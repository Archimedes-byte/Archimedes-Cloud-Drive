# 工具函数库 (Utils)

## 概述

`app/utils` 目录包含所有通用工具函数，这些函数不依赖于特定的业务逻辑，可以在应用的任何位置使用。

## 职责范围

这个目录的主要职责是：

1. **提供通用工具函数**：如字符串处理、日期格式化、数据验证等
2. **文件处理工具**：文件类型判断、格式化、路径处理等
3. **API请求工具**：通用API客户端、错误处理、响应构建等
4. **格式化工具**：数据格式化、展示格式化等
5. **安全工具**：加密、解密、安全存储等
6. **验证工具**：数据验证、表单验证等
7. **函数工具**：防抖、节流等高阶函数

## 使用指南

从utils导入工具函数时，应该使用特定的子模块路径，而不是直接从根目录导入：

```typescript
// 推荐方式
import { formatFileSize } from '@/app/utils/file';
import { debounce } from '@/app/utils/function';

// 不推荐方式
import { formatFileSize, debounce } from '@/app/utils';
```

## 与app/lib的区别

- **app/utils**：提供通用工具函数，不依赖于特定业务逻辑
- **app/lib**：提供核心库功能，包含业务逻辑和系统核心组件

具体区别：

1. **utils**：低级别、通用、无状态的工具函数
2. **lib**：高级别、特定领域、可能有状态的库功能

例如，文件类型判断是通用工具（utils），而文件存储系统是核心库功能（lib）。

## 依赖关系管理

为避免循环依赖，请遵循以下原则：

1. **app/utils 可以依赖的模块**：
   - 其他 app/utils 子模块
   - 第三方库
   - app/types（类型定义）
   - app/constants（常量定义）

2. **app/utils 不应依赖的模块**：
   - app/lib 模块（避免循环依赖）
   - app/components（UI组件）
   - app/hooks（业务钩子）
   - app/services（业务服务）

3. **特殊情况处理**：
   - 如果必须使用 app/lib 中的某些功能，考虑将该功能移至 app/utils
   - 或者创建共享的基础模块，供 app/utils 和 app/lib 共同依赖 