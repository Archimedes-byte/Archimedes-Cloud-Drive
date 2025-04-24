# 存储工具函数（已迁移）

**注意：此目录中的功能已迁移到 `app/utils/storage` 目录下。**

为保持向后兼容性，此目录中的部分文件将继续保留一段时间，但不建议在新代码中引用此路径下的功能。

## 迁移说明

- `download.ts` 已移动到 `app/utils/storage/download.ts`
- 文件类型工具已与 `app/utils/file` 目录下的功能合并
- 未来此目录将被完全移除，请更新您的导入路径

## 使用建议

```typescript
// 不建议这样导入
import { downloadFile } from '@/app/lib/storage/utils';

// 建议这样导入
import { downloadFile } from '@/app/utils/storage';
// 或者
import { downloadFile } from '@/app/lib/storage';
```

此目录计划在下一个主要版本中完全移除。 