/**
 * 文件夹管理功能组件
 * 包含文件夹创建、选择和管理相关组件
 */

// 导出folder-management目录下的所有组件
export * from './create-folder-modal';

// 导出从favorites合并过来的组件
export { default as FolderManagement } from './folder-management';

// 导出文件夹选择组件 (原来在单独的folder-select目录)
// 注意: 实际组件文件仍在folder-select目录中，但统一从这里导出
export { FolderSelectModal } from '../folder-select'; 