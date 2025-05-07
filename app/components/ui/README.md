# UI组件使用指南

## 重要提示

⚠️ **注意:** 项目中已移除所有UI组件的向后兼容导入。现在必须直接从Ant Design封装模块导入所有UI组件。

## 正确的导入方式

所有UI组件必须从以下路径导入:

```typescript
import { Button, Table, Form, Input, Modal, ... } from '@/app/components/ui/ant';
```

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