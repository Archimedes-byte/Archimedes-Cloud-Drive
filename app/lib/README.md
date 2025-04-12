# 核心库模块 (Core Library)

此目录包含应用程序的核心库功能，经过重构优化以提高可维护性和代码质量。

## 目录结构

```
app/lib/
├── api/         - API客户端和相关工具
├── auth/        - 身份验证和授权功能
├── database/    - 数据库连接和操作封装
├── storage/     - 文件存储功能
├── utils/       - 通用工具函数
└── config/      - 应用配置管理
```

## 导入规范

所有模块统一通过命名导出方式导出，禁止使用默认导出。导入路径应遵循以下规范：

```typescript
// 推荐导入方式
import { someFunction } from '@/app/lib/module';

// 避免使用以下导入方式
import * as module from '@/app/lib/module'; // 不推荐
import module from '@/app/lib/module';      // 不推荐
```

## 模块职责

- **api**: 提供与后端API交互的客户端和工具
- **auth**: 处理用户认证、授权和会话管理
- **database**: 管理数据库连接和提供数据访问接口
- **storage**: 负责文件存储、获取和管理
- **utils**: 提供通用工具函数和帮助方法
- **config**: 管理应用配置和环境变量

每个模块都应通过index.ts文件导出其公共API，模块内部实现细节不应被直接导入。 