/**
 * UI组件索引文件
 * 
 * 注意：为了统一使用 Ant Design 组件库，
 * 请从 './ant' 目录导入所有UI组件，而不是从这里导入
 * 
 * 例如:
 * import { Button, Input, Table } from '@/app/components/ui/ant';
 * 
 * 不推荐:
 * import { Button } from '@/app/components/ui';
 * 
 * @deprecated 请直接从 './ant' 导入组件
 */

// 为了向后兼容，我们重新导出一些常用组件
// 但在新代码中，应直接从 './ant' 导入
export { Button, Progress, Input } from './ant'; 