# 主题管理系统架构

## 架构概述

主题管理系统采用分层架构，每层有明确的职责和边界，遵循单一职责原则和依赖倒置原则。

### 系统层次结构

```
┌─────────────────────────┐
│     业务组件（消费者）    │  使用useTheme()获取主题状态和操作
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│      主题上下文提供器     │  AppThemeProvider - 提供全局主题上下文
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│     主题状态管理层        │  useThemeManager - 管理主题状态和同步
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│      主题服务层          │  theme-service - 提供底层主题操作API
└─────────────────────────┘
```

## 核心组件说明

### 1. 主题服务层 (theme-service.ts)

提供所有底层主题操作功能，包括：
- 应用主题到DOM
- 保存/加载主题配置
- 管理自定义主题
- 主题变更通知

### 2. 主题状态管理层 (useThemeManager.ts)

管理主题状态并处理与服务器同步：
- 维护当前主题状态
- 管理主题加载、应用过程
- 同步主题到用户设置
- 响应主题变更事件

### 3. 主题上下文提供器 (AppThemeProvider.tsx)

为应用提供全局主题上下文：
- 创建ThemeContext
- 初始化主题管理器
- 将主题状态提供给整个应用

### 4. 主题消费Hook (useTheme.ts)

为业务组件提供统一的主题访问接口：
- 从ThemeContext获取主题状态
- 提供回退机制，确保在任何情况下都能获取主题

## 使用指南

### 统一的主题访问方式

业务组件应该使用`useTheme()`钩子获取主题，而不是直接调用底层服务：

```tsx
// ✅ 推荐方式
import { useTheme } from '@/app/hooks';

function MyComponent() {
  const { currentTheme, updateTheme } = useTheme();
  
  // 使用主题状态和方法
}

// ❌ 不推荐的方式
import { applyTheme, loadThemeFromStorage } from '@/app/theme';

function MyComponent() {
  // 直接调用底层API - 避免这种方式
}
```

### 主题切换

```tsx
function ThemeSwitcher() {
  const { currentTheme, updateTheme, getAllThemes } = useTheme();
  const themes = getAllThemes();
  
  return (
    <select 
      value={currentTheme || 'default'} 
      onChange={e => updateTheme(e.target.value)}
    >
      {themes.map(theme => (
        <option key={theme.id} value={theme.id}>
          {theme.name}
        </option>
      ))}
    </select>
  );
}
```

## 最佳实践

1. **使用统一接口**：始终通过`useTheme`钩子访问主题功能，避免直接调用底层API

2. **避免重复逻辑**：不要在组件中实现与`useThemeManager`重复的主题管理逻辑

3. **主题同步**：让主题管理系统负责与服务器同步，不要手动实现同步逻辑

4. **性能考虑**：避免在多个组件中重复初始化主题，使用上下文共享主题状态

5. **扩展性**：如需扩展主题功能，应该从现有层次结构扩展，而不是创建平行实现

## 重构前的问题

在重构主题管理系统之前，存在以下问题：

1. **重复的主题应用逻辑**：在dashboard/page.tsx中直接使用底层API，而不是使用封装好的钩子

2. **多处主题初始化**：在AppThemeProvider和其他组件中都实现了主题初始化逻辑

3. **职责不明确**：各层职责边界模糊，导致重复代码和潜在冲突

4. **缺乏统一接口**：没有一致的接口供组件使用主题功能

## 重构内容

1. **统一主题接入点**：创建`useTheme`钩子作为统一接口

2. **明确职责边界**：
   - AppThemeProvider：仅提供上下文
   - useThemeManager：管理主题状态和同步
   - theme-service：提供底层功能

3. **移除重复逻辑**：清理dashboard/page.tsx中的直接主题操作

4. **添加向后兼容性**：保留旧API但标记为过时，确保平滑迁移

## 后续工作

1. **迁移现有组件**：将所有直接使用主题API的组件迁移到使用useTheme()

2. **类型增强**：完善主题相关类型，提供更好的类型安全

3. **性能优化**：减少不必要的重渲染和主题应用操作

4. **文档完善**：编写详细的主题系统使用文档 