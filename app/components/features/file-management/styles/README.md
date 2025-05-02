# 文件管理组件样式指南

## 样式文件组织规范

本文档旨在规范文件管理模块的样式文件组织，避免重复和混乱。

### 样式文件放置位置

1. **组件特定样式**
   - 紧密耦合到单个组件的样式应该放在组件同目录下
   - 命名规范：`ComponentName.module.css`
   - 例如：`file-preview/FilePreview.module.css`

2. **共享样式**
   - 被多个组件使用的共享样式放在 `shared` 目录下
   - 命名规范：`feature-name.module.css`
   - 例如：`shared/modal-styles.module.css`

3. **主题和全局样式**
   - 主题相关样式和全局样式放在 `styles` 目录下
   - 结构化为子目录：
     - `layout/`: 布局相关样式
     - `animations/`: 动画样式
     - `feedback/`: 状态反馈样式
     - `shared/`: 共享UI样式（不包含组件特定样式）

### 样式导入规则

1. 组件应该通过相对路径导入它们直接依赖的样式
   ```tsx
   import styles from './ComponentName.module.css';
   ```

2. 共享样式应该从集中的导出点导入
   ```tsx
   import { modalStyles } from '@/app/components/features/file-management/shared';
   ```

3. 主题样式应该从styles目录导入
   ```tsx
   import { layoutStyles } from '@/app/components/features/file-management/styles';
   ```

### 命名规范

1. 文件名：
   - 组件样式：使用PascalCase，与组件名称保持一致 (`ComponentName.module.css`)
   - 共享样式：使用kebab-case (`feature-name.module.css`)

2. 类名：
   - 使用kebab-case命名CSS类 (`.feature-name`)
   - 通过BEM方法论组织相关类 (`.block__element--modifier`)

### 重构指南

如果发现重复的样式或不一致的样式组织，请按照以下步骤重构：

1. 分析样式用途，确定应该放在哪个类别（组件特定/共享/主题）
2. 将样式移动到正确位置
3. 更新所有导入这些样式的组件
4. 在样式目录的索引文件中注册新的导出点

遵循这些规则将帮助我们保持样式结构的一致性和可维护性。 