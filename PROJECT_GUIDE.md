# 云存储项目开发指南

## 项目概述

这是一个基于Next.js构建的个人云存储系统，允许用户上传、管理和分享文件。项目使用TypeScript开发，采用Prisma ORM管理数据库，NextAuth处理身份认证。

## 项目结构

```
- app/                       # Next.js应用程序目录
  - api/                     # API路由
    - files/                 # 文件管理API
      - utils/               # API工具函数
        - auth-service.ts    # 用户验证服务
        - file-service.ts    # 文件操作服务
  - components/              # 全局组件
    - FileUpload/            # 文件上传组件
    - StorageUsage/          # 存储使用组件
    - ui/                    # UI基础组件
  - dashboard/               # 控制面板页面
  - home/                    # 主页
  - types/                   # 类型定义
    - file.ts                # 文件相关类型
    - fileManagement.ts      # 文件管理相关类型
- prisma/                    # Prisma ORM配置
- public/                    # 静态资源
- uploads/                   # 上传文件存储目录
```

## 开发规范

### 组件结构

组件应使用目录结构组织，例如：

```
ComponentName/
  ├── index.tsx        # 主要组件文件
  ├── ComponentName.tsx # 可选的组件实现文件
  ├── ComponentName.module.css # 样式文件
  └── types.ts         # 组件特定类型（可选）
```

### 类型定义

- 基础类型定义在 `app/types/file.ts` 中
- UI组件相关类型定义在 `app/types/fileManagement.ts` 中
- 所有类型从 `app/types/index.ts` 统一导出

### API结构

API代码应遵循以下原则：
- 路由处理程序应该简洁，复杂逻辑移至专用服务
- 验证逻辑放在 `auth-service.ts`
- 文件操作逻辑放在 `file-service.ts`

## 最近重构说明

### 组件重构

1. 移除了重复的组件定义:
   - 删除了 `app/components/FileUpload.tsx`，保留了 `app/components/FileUpload/index.tsx`
   - 删除了 `app/components/StorageUsage.tsx`，保留了 `app/components/StorageUsage/index.tsx`

2. 优化了组件实现:
   - 使用 `forwardRef` 改进组件间的引用传递
   - 使用自定义Hook分离逻辑和视图

### API重构

1. 服务分离:
   - 创建了 `auth-service.ts` 处理用户验证逻辑
   - 创建了 `file-service.ts` 处理文件操作逻辑

2. 代码优化:
   - 移除了重复的函数定义
   - 简化了路由处理程序

### 代码质量改进

1. 移除了调试代码:
   - 清理了 `console.log` 语句
   - 使用 `toast` 替代 `alert` 和 `console` 消息

2. 代码一致性:
   - 统一了组件Props命名和结构
   - 统一了错误处理逻辑

## 最佳实践

### 状态管理
- 使用 React Hooks 管理组件状态
- 复杂状态逻辑应提取为自定义Hook

### 错误处理
- 使用 try/catch 捕获异常
- 提供用户友好的错误消息
- 在服务端记录详细错误信息

### 性能优化
- 使用分页和虚拟滚动处理大量数据
- 优化图片和资源加载
- 实现请求缓存和去抖动

### 安全性
- 验证所有API请求
- 检查文件权限和所有权
- 防止路径遍历和目录暴露

## 未来改进计划

1. 架构优化:
   - 考虑实现状态管理库 (如Redux或Zustand)
   - 添加更完善的测试覆盖

2. 功能扩展:
   - 完善文件共享和权限管理
   - 添加文件预览和编辑功能
   - 实现更强大的搜索功能 