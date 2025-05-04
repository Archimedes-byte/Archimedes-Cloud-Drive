# 项目目录结构说明

本项目使用 Next.js 14+ 的 App Router 架构，目录结构经过优化，符合现代 Next.js 应用的最佳实践。

## 主要目录说明

- `app/`: 应用主目录，包含所有页面、组件、API接口等
  - `components/`: 组件库
    - `features/`: 特定功能的组件
    - `shared/`: 共享组件
    - `common/`: 通用组件
    - `ui/`: UI组件
  - `api/`: API路由（App Router形式）
  - `auth/`: 认证相关页面
  - `dashboard/`: 仪表盘页面
  - `file/`: 文件管理页面
  - `share/`: 文件分享页面
  - `contexts/`: React上下文
  - `hooks/`: 自定义Hooks
  - `utils/`: 工具函数
  - `lib/`: 第三方库集成
  - `theme/`: 主题定义和配置
  - `styles/`: 样式模块
  - `types/`: TypeScript类型定义
  - `constants/`: 常量定义

- `public/`: 静态资源
  - `images/`: 图片资源
  - `uploads/`: 用户上传文件

- `prisma/`: 数据库配置和模型定义

## 目录结构更改说明

1. 规范化路由结构：
   - 已将 `app/pages/*` 下的页面迁移到 App Router 下对应的目录
   - 遵循 Next.js 14+ 的 App Router 约定

2. 样式文件整合：
   - 已将根目录 `styles.css` 整合到 `app/globals.css`
   - 保留了必要的样式，确保功能一致性

3. 清理临时目录：
   - 已移除 `temp/` 和 `dist/` 等临时目录
   - 主题相关代码已正确定义在 `app/theme/`

## 开发规范

1. 页面开发：
   - 新页面应直接放在 `app/` 目录下相应的路径
   - 使用 `page.tsx` 作为页面组件文件名
   - 使用 `layout.tsx` 定义布局

2. 组件开发：
   - 功能特定组件放在 `app/components/features/`
   - 共享和可复用组件放在 `app/components/shared/` 或 `app/components/common/`
   - UI基础组件放在 `app/components/ui/`

3. 样式管理：
   - 全局样式放在 `app/globals.css`
   - 组件特定样式使用 CSS Modules 或 Tailwind CSS
   - 主题相关样式定义在 `app/theme/` 目录

4. 路由导航：
   - 使用绝对路径如 `/file` 而非 `/pages/file`
   - 分享链接使用 `/share/[code]` 而非 `/pages/share/[code]` 