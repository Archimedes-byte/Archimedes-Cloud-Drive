# API迁移文档

## 迁移状态

本文档记录了从旧API路径 (`/api/files/*`, `/api/folders/*`) 到新API路径 (`/api/storage/*`) 的迁移进度。

### 已完成的迁移

- [x] 文件预览API：从 `/api/files/[id]/preview` 迁移到 `/api/storage/files/[id]/preview`
- [x] 文件服务API：从 `/api/files/serve` 迁移到 `/api/storage/files/serve`
- [x] **删除所有旧API路由**：移除了 `/api/files/*` 和 `/api/folders/*` 下的所有旧API路由
- [x] **移除API路径配置中的旧定义**：从 `API_PATHS` 中删除了旧的路径定义

### 当前API结构

所有API现在都位于 `/api/storage/*` 路径下:

- 文件操作: `/api/storage/files/*`
- 文件夹操作: `/api/storage/folders/*`
- 存储信息: `/api/storage/info`、`/api/storage/quota` 等

## 迁移方案（已完成）

1. **并行运行阶段**：✓
   - 创建新的API端点
   - 保持旧API端点可用
   - 前端组件逐步迁移到新API

2. **切换阶段**：✓
   - 所有前端组件都使用新API
   - 旧API保持可用但不再使用

3. **清理阶段**：✓
   - 删除旧API端点
   - 更新API路径配置

## 最近的更改 (2023-05-15)

- 确认前端组件能够正确处理新API的嵌套数据结构
- 从`API_PATHS`中删除了所有旧的路径定义
- 删除了所有旧的API路由文件和目录（`/api/files/*` 和 `/api/folders/*`）
- 完成了整个API迁移工作

## 前端组件处理数据结构

所有前端组件现在都可以处理新API返回的嵌套数据结构。例如，FilePreview组件已经做了以下适配：

```typescript
// 处理嵌套data结构
// 检查是否有嵌套数据结构 data.data.data
if (data.data && data.data.success && data.data.data) {
  const fileData = data.data.data;
  if (fileData.success && fileData.url) {
    setPreviewUrl(fileData.url);
  }
} 
// 检查第一层嵌套 data.data
else if (data.data && data.data.success && data.data.url) {
  setPreviewUrl(data.data.url);
}
// 检查无嵌套的情况
else if (data.success && data.url) {
  setPreviewUrl(data.url);
}
```

## 数据格式示例

新的API返回的数据结构为：

```json
{
  "success": true,
  "data": {
    "success": true,
    "url": "/api/storage/files/serve?token=...",
    "fileType": "video/mp4",
    "fileName": "example.mp4"
  }
}
``` 