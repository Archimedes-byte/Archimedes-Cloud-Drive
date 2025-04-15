# API重构指南

本文档概述了API重构的目标、改动内容和迁移步骤，帮助团队成员理解和适应新的API结构。

## 重构目标

1. **统一API结构**：建立清晰、一致的API路径结构
2. **分离业务逻辑**：将业务逻辑从API路由中分离，实现更好的代码组织
3. **统一错误处理**：标准化错误响应格式
4. **提高代码复用**：减少重复代码
5. **增强可维护性**：改善代码组织，使其更易于维护和扩展

## 核心改动

### 1. 路径结构调整

原API路径结构:
```
/api/files/...     - 文件相关API
/api/folders/...   - 文件夹相关API
/api/storage/...   - 存储相关API
/api/tags/...      - 标签相关API
...
```

新API路径结构:
```
/api/storage/           - 所有存储相关操作的基础路径
  ├── files/            - 文件操作
  │   ├── search        - 文件搜索
  │   ├── upload        - 文件上传
  │   ├── delete        - 文件删除
  │   ├── move          - 文件移动
  │   ├── download      - 文件下载
  │   └── [id]/         - 单个文件操作
  │       ├── preview   - 文件预览
  │       └── content   - 文件内容
  ├── folders/          - 文件夹操作
  │   ├── [id]/         - 单个文件夹操作
  │   └── children      - 获取子项
  ├── favorites/        - 收藏操作
  │   ├── add           - 添加收藏
  │   └── remove        - 移除收藏
  ├── tags/             - 标签操作
  ├── recent            - 最近访问
  ├── stats             - 存储统计
  └── info              - 存储信息
```

### 2. 代码结构调整

1. **中间件**：
   - 新增`app/middleware/auth.ts`处理身份验证和响应生成

2. **工具函数**：
   - 新增`app/utils/file-utils.ts`集中处理文件类型判断等功能

3. **服务层**：
   - 新增`app/services/storage-service.ts`处理业务逻辑

4. **API客户端**：
   - 更新`app/lib/api/file-api.ts`支持新的API路径
   - 更新`app/lib/api/paths.ts`定义新的API路径结构

### 3. 响应格式统一

所有API响应格式统一为：

```json
{
  "success": true/false,
  "data": {...},         // 成功时返回的数据
  "message": "...",      // 可选的成功消息
  "error": "...",        // 错误时的错误信息
  "code": "..."          // 可选的错误代码
}
```

## 迁移指南

### 后端开发者

1. **创建新的API路由**：
   - 使用新路径创建新的API路由
   - 使用`withAuth`中间件处理身份验证
   - 使用`createApiResponse`和`createApiErrorResponse`生成响应
   - 调用`StorageService`中的方法处理业务逻辑

   示例：
   ```typescript
   // app/api/storage/files/route.ts
   export const GET = withAuth(async (req: AuthenticatedRequest) => {
     try {
       // 获取查询参数
       const result = await storageService.getFiles(req.user.id, ...);
       return createApiResponse(result);
     } catch (error) {
       return createApiErrorResponse(error.message, 500);
     }
   });
   ```

2. **移植业务逻辑到服务层**：
   - 在`StorageService`类中实现相应方法
   - 关注点分离，保持API路由轻量

3. **废弃旧API**：
   - 在旧API中添加弃用警告
   - 将旧API转发到新API

### 前端开发者

1. **使用新的API客户端**：
   - 从`app/lib/api/file-api.ts`导入`fileApi`
   - 使用提供的方法调用API

   示例：
   ```typescript
   // 获取文件列表
   const { items, total } = await fileApi.getFiles({ 
     folderId, 
     type,
     page,
     pageSize
   });
   
   // 创建文件夹
   const folder = await fileApi.createFolder(name, parentId);
   ```

2. **处理响应格式变化**：
   - API响应现在统一为`{ success, data, message, error, code }`
   - `fileApi`方法已处理这种格式，直接返回`data`部分

3. **迁移期间注意事项**：
   - 短期内两套API并存
   - 优先使用新API
   - 检查组件中的API调用，逐步替换

## 注意事项

1. **兼容性**：
   - 在过渡期间保留旧版API路径
   - 新版本FileInfo接口与旧版ExtendedFile接口兼容

2. **权限控制**：
   - 身份验证逻辑现集中在`withAuth`中间件
   - 业务权限检查集中在服务层

3. **错误处理**：
   - 使用`createApiErrorResponse`生成一致的错误响应
   - 前端通过`ApiError`捕获和处理错误

## 下一步计划

1. **完成所有API的迁移**：
   - 迁移剩余的API路由到新结构
   - 更新相关前端组件

2. **增强服务层功能**：
   - 添加缓存支持
   - 改进错误处理
   - 增加更多业务逻辑

3. **编写测试**：
   - 为服务层添加单元测试
   - 为API添加集成测试

4. **移除旧API**：
   - 完成迁移后，移除旧版API
   - 清理相关代码

## 参考资料

- 新API路径定义: `app/lib/api/paths.ts`
- 服务层实现: `app/services/storage-service.ts`
- 中间件: `app/middleware/auth.ts`
- 工具函数: `app/utils/file-utils.ts`
- API客户端: `app/lib/api/file-api.ts` 