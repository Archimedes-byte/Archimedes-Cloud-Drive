# 项目目录结构规范

## 目录

- [总体原则](#总体原则)
- [顶层目录结构](#顶层目录结构)
- [app目录结构](#app目录结构)
- [各层职责](#各层职责)
- [代码放置指南](#代码放置指南)
- [命名规范](#命名规范)
- [依赖关系](#依赖关系)
- [结构变更流程](#结构变更流程)

## 总体原则

1. **关注点分离**：每个目录和文件应有明确且单一的职责
2. **避免冗余**：不同目录间不应有功能重叠
3. **层次清晰**：保持清晰的层次结构和依赖方向
4. **一致性**：遵循统一的代码组织和命名模式
5. **模块化**：相关功能应组织在同一模块中

## 顶层目录结构

```
/
├── app/            # 应用程序代码
├── prisma/         # 数据库模型和迁移
├── public/         # 静态资源
├── uploads/        # 上传文件存储
├── docs/           # 项目文档
├── .next/          # Next.js构建输出（不要手动修改）
└── ...             # 配置文件等
```

## app目录结构

```
app/
├── api/            # API路由
├── components/     # UI组件
├── hooks/          # React Hooks
├── lib/            # 核心功能库
├── services/       # 业务服务
├── store/          # 状态管理
├── types/          # 类型定义
├── utils/          # 工具函数
├── context/        # React上下文
├── middleware/     # 中间件
├── theme/          # 主题相关
├── styles/         # 全局样式
├── layout.tsx      # 布局组件
└── page.tsx        # 主页面
```

## 各层职责

### api/

**职责**：定义API路由和请求处理器
- 仅负责请求验证、参数解析和调用services层
- 不应包含复杂业务逻辑
- 返回标准化的响应格式

```
api/
├── auth/           # 认证相关API
├── storage/        # 存储相关API
│   ├── files/      # 文件操作API
│   ├── folders/    # 文件夹操作API
│   └── ...
├── user/           # 用户相关API
└── ...
```

### components/

**职责**：UI组件定义
- 采用原子设计思想组织组件
- 尽量保持组件纯度，不包含复杂业务逻辑

```
components/
├── common/         # 通用组件（跨功能使用）
├── features/       # 功能组件（特定业务功能）
├── ui/             # 基础UI元素
│   ├── buttons/
│   ├── inputs/
│   └── ...
└── index.ts        # 统一导出
```

### lib/

**职责**：核心功能实现，与业务相对无关的基础库
- 提供底层功能实现
- 可以包含有状态逻辑和副作用
- 不应包含UI渲染逻辑

```
lib/
├── auth/           # 认证核心功能
├── database/       # 数据库交互
├── file/           # 文件操作核心功能
│   ├── upload.ts   # 文件上传功能
│   ├── download.ts # 文件下载功能
│   └── ...
├── storage/        # 存储核心功能
│   ├── core/       # 存储核心实现
│   └── ...
├── api/            # API请求核心
└── ...
```

### services/

**职责**：业务逻辑实现层
- 整合各种lib和utils实现业务功能
- 不包含UI渲染或状态管理逻辑
- 作为api层和lib层之间的桥梁

```
services/
├── auth/           # 认证服务
├── storage/        # 存储服务
│   ├── file-management-service.ts
│   ├── file-upload-service.ts
│   └── ...
├── user/           # 用户服务
└── ...
```

### utils/

**职责**：提供纯函数工具方法
- 不应有副作用
- 不依赖于应用状态
- 提供可复用的功能函数

```
utils/
├── date/           # 日期处理
├── format/         # 格式化工具
├── validation/     # 验证工具
├── string.ts       # 字符串处理
└── ...
```

### hooks/

**职责**：自定义React Hooks
- 封装复用的状态逻辑
- 可以调用services和utils
- 不应包含视图渲染

```
hooks/
├── auth/           # 认证相关hooks
├── storage/        # 存储相关hooks
└── ...
```

### types/

**职责**：类型定义
- 所有共享类型定义应放在这里
- 按功能域组织
- 可被所有其他层引用

```
types/
├── auth.ts
├── storage.ts
├── user.ts
└── ...
```

### middleware/

**职责**：中间件
- 请求处理中间件
- 不应包含业务逻辑

```
middleware/
├── auth.ts         # 认证中间件
├── logging.ts      # 日志中间件
└── ...
```

### context/

**职责**：React上下文
- 应用级状态管理
- 主题、用户会话等

```
context/
├── auth-context.tsx
├── theme-context.tsx
└── ...
```

## 代码放置指南

1. **新功能开发流程**
   - 先定义types/中的类型
   - 实现utils/中所需的工具函数
   - 开发lib/中的核心功能
   - 在services/中实现业务逻辑
   - 在api/中添加API端点
   - 在components/中开发UI组件
   - 使用hooks/整合状态和行为

2. **代码迁移原则**
   - 纯工具函数应放在utils/
   - 包含I/O操作的功能应放在lib/
   - 业务逻辑应放在services/
   - API路由处理应放在api/

3. **功能分类指南**
   - 文件处理相关：
     - 纯工具函数如格式化、类型检测等放在utils/file/
     - 文件I/O操作如读写、上传下载等放在lib/file/
     - 业务逻辑如权限检查、业务规则实现等放在services/storage/
     - API接口定义放在api/storage/

## 命名规范

1. **文件命名**
   - 使用kebab-case命名文件：`file-upload.ts`
   - 组件使用PascalCase：`FileUpload.tsx`
   - 类型定义文件使用kebab-case：`file-types.ts`
   - 工具函数文件使用功能描述：`formatter.ts`

2. **目录命名**
   - 使用kebab-case：`file-utils/`
   - 或使用单词：`components/`

3. **导出规范**
   - 每个目录应有index.ts导出其公共API
   - 尽量使用命名导出而非默认导出

## 依赖关系

允许的依赖方向（从上到下）：

```
components/
    ↓
hooks/ ← context/ ← store/
    ↓
services/
    ↓
lib/ → utils/
    ↓
types/
```

**禁止的依赖**：
- services不应直接依赖components
- lib不应依赖services
- utils不应依赖除types以外的任何层

## 结构变更流程

1. 提出结构变更建议
2. 评估影响范围
3. 更新本文档
4. 实施变更
5. 验证结构一致性

## 附录：结构检查清单

- [ ] 所有文件都在正确的目录中
- [ ] 没有功能重复的代码
- [ ] 依赖关系符合规范
- [ ] 命名符合规范
- [ ] index.ts正确导出模块API 