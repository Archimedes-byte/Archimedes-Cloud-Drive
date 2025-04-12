Type System
app/types/
├── core/            # 核心/通用类型
│   ├── api.ts       # API相关核心类型
│   ├── auth.ts      # 认证相关核心类型
│   └── common.ts    # 通用基础类型
├── domains/         # 业务领域类型
│   ├── fileTypes.ts # 文件类型系统（优化后的新类型系统）
│   ├── fileManagement.ts # 文件管理功能类型
│   └── ...
├── api/             # API类型
│   ├── requests.ts  # API请求类型
│   ├── responses.ts # API响应类型
│   └── index.ts     # API类型导出
├── ui/              # UI组件类型
│   ├── components.ts # UI组件Props类型
│   └── index.ts     # UI类型导出
├── hooks/           # Hooks类型
│   ├── hooks.ts     # Hook接口类型
│   └── index.ts     # Hooks类型导出
├── utils/           # 工具类型
│   └── index.ts     # 实用工具类型
├── global/          # 全局类型扩展
└── index.ts         # 统一导出

