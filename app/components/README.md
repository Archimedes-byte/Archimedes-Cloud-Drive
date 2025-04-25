# 组件库使用指南

## 统一使用 Ant Design 组件库

为了保持项目的一致性和可维护性，我们统一使用 Ant Design 作为基础组件库。

### 组件导入规范

从统一入口导入所有 UI 组件：

```tsx
// ✅ 推荐：从统一入口导入
import { Button, Table, Input, Card } from '@/app/components/ui/ant';

// ❌ 不推荐：直接从 antd 导入
import { Button } from 'antd';

// ❌ 不推荐：从其他路径导入
import { Button } from '@/app/components/ui';
```

### 主题使用

在应用根组件中使用主题提供者：

```tsx
// app/layout.tsx 或根组件
import { AntThemeProvider } from '@/app/components/ui/themes/AntThemeProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AntThemeProvider>
          {children}
        </AntThemeProvider>
      </body>
    </html>
  );
}
```

### 按钮组件使用示例

统一后的按钮组件用法：

```tsx
import { Button } from '@/app/components/ui/ant';

// 基础用法
<Button>默认按钮</Button>
<Button variant="primary">主要按钮</Button>
<Button variant="secondary">次要按钮</Button>
<Button variant="success">成功按钮</Button>
<Button variant="danger">危险按钮</Button>
<Button variant="link">链接按钮</Button>
<Button variant="ghost">幽灵按钮</Button>
<Button variant="text">文本按钮</Button>
<Button variant="outline">轮廓按钮</Button>

// 尺寸
<Button size="small">小按钮</Button>
<Button>中等按钮</Button>
<Button size="large">大按钮</Button>

// 宽度
<Button fullWidth>全宽按钮</Button>

// 状态
<Button loading>加载中</Button>
<Button disabled>禁用</Button>

// 带图标
<Button icon={<SearchOutlined />}>搜索</Button>
```

### 表单组件使用示例

```tsx
import { Form, Input, Select, Button, DatePicker } from '@/app/components/ui/ant';

const { Option } = Select;

<Form layout="vertical">
  <Form.Item label="用户名" name="username" rules={[{ required: true }]}>
    <Input placeholder="请输入用户名" />
  </Form.Item>
  
  <Form.Item label="角色" name="role">
    <Select placeholder="请选择角色">
      <Option value="admin">管理员</Option>
      <Option value="user">普通用户</Option>
    </Select>
  </Form.Item>
  
  <Form.Item label="生日" name="birthday">
    <DatePicker />
  </Form.Item>
  
  <Form.Item>
    <Button variant="primary" htmlType="submit">提交</Button>
  </Form.Item>
</Form>
```

### 移除内联样式

请避免使用内联样式，而是使用 Ant Design 组件的 props：

```tsx
// ❌ 不推荐：使用内联样式
<div style={{ margin: '10px', padding: '20px', border: '1px solid #eee' }}>
  内容
</div>

// ✅ 推荐：使用组件 props
<Card style={{ margin: '10px' }}>
  内容
</Card>

// ✅ 更好：使用组件 props 和预设样式
<Card className="card-with-shadow">
  内容
</Card>
```

## 目录结构

组件库按照以下结构组织：

```
app/components/
├── ui/                  # 基础UI组件
│   ├── ant/             # Ant Design 组件
│   ├── atoms/           # 原子级组件
│   ├── molecules/       # 分子级组件
│   └── themes/          # 主题配置
├── common/              # 通用功能组件
│   ├── feedback/        # 反馈类组件
│   ├── form/            # 表单相关组件
│   └── media/           # 媒体组件
└── features/            # 业务功能组件
    ├── dashboard/       # 仪表盘相关组件
    ├── file-management/ # 文件管理组件
    ├── home/            # 首页相关组件
    ├── user-profile/    # 用户资料组件
    └── auth/            # 认证相关组件
```

## 开发新组件指南

1. 优先考虑使用现有 Ant Design 组件
2. 需要自定义时，基于 Ant Design 组件封装
3. 将新组件添加到正确的目录
4. 从组件索引文件导出
5. 编写清晰的类型定义和注释 