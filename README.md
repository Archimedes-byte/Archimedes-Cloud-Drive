# 云盘项目

基于Next.js、TypeScript和Ant Design的云存储应用程序。

## 快速开始

```bash
# 安装依赖
npm install

# 开发环境运行
npm run dev

# 生产环境构建
npm run build

# 生产环境启动
npm start
```

## 项目结构

查看 [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md) 获取项目完整结构说明。

## 代码规范

我们已重构项目代码，消除冗余和重复代码。所有向后兼容性代码已移除。请查看以下文档：

- [代码组织与最佳实践](./docs/CODE_ORGANIZATION.md) - 了解代码组织结构和导入规范
- [导入路径迁移指南](./docs/IMPORT_MIGRATION.md) - 更新代码使用新的导入路径
- [工具函数使用指南](./app/utils/README.md) - 工具函数的使用方法

## 关键规范

1. **UI组件导入**：从 `@/app/components/ui/ant` 导入所有Ant Design组件
2. **工具函数导入**：从对应的父模块导入，例如 `@/app/utils/file`，而不是直接从子模块导入
3. **避免代码重复**：使用现有的工具函数和组件，不要创建重复功能

## 技术栈

- **框架**: Next.js
- **语言**: TypeScript
- **UI库**: Ant Design
- **样式**: Tailwind CSS
- **状态管理**: React Context + Hooks
- **数据库**: Prisma + PostgreSQL
- **身份验证**: NextAuth.js

不支持docword在线预览
文件夹下载以压缩包形式下载

使用 zustand 实现组件之间的状态管理，使用 react-query 统一设置请求，使用 husky 在 pre-commit 对项目
进行检查