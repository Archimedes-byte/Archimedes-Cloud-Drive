# 云盘系统

## 项目结构说明

本项目是基于Next.js的云盘系统，使用TypeScript开发。

## 修复报告

### 修复的问题

1. 导入路径统一
   - 创建了导入路径适配层，统一了 `@/lib/*` 和 `@/app/lib/*` 两种导入方式
   - 创建了 `importFix.ts` 工具解决函数名称冲突问题
   - 添加了多个重定向文件以支持旧的导入路径

2. 类型定义优化
   - 修复了 `File` 类型与原生 `File` 类型的冲突
   - 替换了 `File` 为 `ExtendedFile` 以提高类型一致性
   - 标准化了 `createdAt` 字段的使用，替代旧的 `uploadTime` 属性

3. 身份验证配置
   - 修复了 `PrismaAdapter` 的导入问题，从 `@auth/prisma-adapter` 导入
   - 解决了与Prisma模型中字段不匹配的问题，如 `image` 字段

4. 未使用的导入和变量
   - 移除了未使用的导入和变量

## 安装和运行

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建
npm run build

# 生产模式运行
npm run start
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
