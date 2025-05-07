/**
 * API模块入口
 * 
 * 导出所有API相关功能
 */

/**
 * API模块 (API Module)
 * 
 * 此模块提供与后端API交互的客户端和工具，封装了网络请求和响应处理逻辑。
 * 主要功能：
 * - 文件管理API客户端
 * - API路径配置
 * - 响应处理与错误管理
 * 
 * @example
 * // 获取文件列表
 * import { fileApi } from '@/app/lib/api';
 * const files = await fileApi.getFiles({ folderId: 'some-id' });
 * 
 * // 上传文件
 * import { fileApi } from '@/app/lib/api';
 * const uploadedFiles = await fileApi.uploadFiles(fileList);
 */

// 导出文件API客户端实例
export { fileApi } from './file-api';

// 从统一类型定义导入
export type { 
  ApiResponse, 
  FileListRequest, 
  FileSearchRequest, 
  PaginatedResponse 
} from '@/app/types';

// 导出API路径配置
export { API_PATHS } from './paths'; 