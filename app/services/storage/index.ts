/**
 * 存储服务模块索引
 * 导出所有存储相关的服务类和工具函数
 */

// 导出文件上传服务
export { FileUploadService, mapFileEntityToFileInfo } from './file-upload-service';

// 导出文件管理服务
export { FileManagementService } from './file-management-service';

// 导出文件统计服务
export { FileStatsService } from './file-stats-service';

// 导出收藏夹服务
export { FavoriteService } from './favorite-service';
export type { FavoriteFolderInfo } from './favorite-service'; 