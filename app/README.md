## 文件访问历史功能

系统现在支持详细的文件访问历史跟踪：

1. **数据模型**：新增FileAccess模型，跟踪谁在什么时候访问了哪个文件
2. **API端点**：
   - POST `/api/storage/recent/record` - 记录文件访问
   - GET `/api/storage/recent` - 获取最近访问的文件
   - GET `/api/storage/files/:id/access-history` - 查询特定文件的访问历史

3. **客户端API**：
   - `fileApi.recordFileAccess(fileId)` - 记录文件访问
   - `fileApi.getRecentFiles(limit)` - 获取最近访问的文件
   - `fileApi.getFileAccessHistory(fileId, page, limit)` - 获取文件访问历史

4. **服务层**：
   - `FileStatsService.recordFileAccess(userId, fileId)` - 记录文件访问统计

访问历史可用于数据分析、用户行为跟踪和安全审计等场景。 