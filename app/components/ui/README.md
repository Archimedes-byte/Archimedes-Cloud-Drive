# UI组件库

## 组件结构

UI组件库采用分层架构，包括：

- `ant/`: 对Ant Design组件的封装和扩展
- `atoms/`: 原子级UI组件
  - `button/`: 自定义按钮组件
  - `progress/`: 自定义进度条组件

## 使用规范

### Ant Design组件

从统一入口导入Ant Design组件以确保主题和样式一致：

```tsx
import { Button, Table, Form, Input, Modal, ... } from '@/app/components/ui/ant';
```

> 注意：不要直接从`antd`导入组件，以确保样式和主题的一致性。

### 原子组件

原子组件是最基本的UI构建块：

```tsx
import { Progress } from '@/app/components/ui/atoms/progress';
```

## 自定义组件规范

1. **命名规范**：使用PascalCase命名组件
2. **目录结构**：每个组件应包含：
   - 组件代码（`.tsx`）
   - 样式文件（`.module.css`）
   - 单元测试（`.test.tsx`）
   - 类型定义（可内联或单独文件）
3. **导出方式**：
   - 使用默认导出组件本身
   - 使用命名导出类型
   - 在目录的index.ts中重新导出

## 组件设计原则

1. **单一职责**：每个组件只负责一个功能
2. **可组合性**：组件应易于组合以创建复杂UI
3. **可重用性**：避免业务逻辑耦合
4. **可测试性**：组件应易于单元测试
5. **可访问性**：遵循Web可访问性标准

## 最佳实践

- 使用TypeScript类型定义组件接口
- 使用CSS Modules进行样式隔离
- 遵循项目设计系统和样式指南
- 编写组件文档说明用法和属性

## 重要提示

⚠️ **注意:** 项目中已移除所有UI组件的向后兼容导入。现在必须直接从Ant Design封装模块导入所有UI组件。

## 错误的导入方式（将导致运行时错误）

以下导入方式已被禁用，会导致运行时错误:

```typescript
// ❌ 错误: 会抛出错误
import { Button } from '@/app/components/ui';

// ❌ 错误: 不使用我们的封装
import { Button } from 'antd';
```

## 自定义组件

我们的UI库提供了以下自定义组件，它们是对Ant Design组件的封装和扩展:

- `FileIcon`: 根据文件类型显示对应图标
- `Progress`: 增强的进度条组件
- `TagInput`: 标签输入组件
- `AuthButton`: 认证按钮组件

这些组件应该从它们各自的模块导入:

```typescript
import { FileIcon } from '@/app/utils/file';
import { Progress } from '@/app/components/ui/atoms/progress';
```

## 主题定制

所有UI组件已经通过ConfigProvider配置以支持明暗主题切换。请不要直接修改Ant Design的样式，而是使用以下方式:

1. 使用className属性和CSS模块
2. 使用style属性进行内联样式
3. 在样式文件中使用CSS变量

```typescript
// 使用className
<Button className={styles.customButton}>点击</Button>

// 使用Tailwind工具类
<Button className={cn("bg-primary text-white", isActive && "opacity-50")}>点击</Button>
```

## 更多帮助

如有更多问题，请参考 [代码组织与最佳实践](../../docs/CODE_ORGANIZATION.md) 文档。 