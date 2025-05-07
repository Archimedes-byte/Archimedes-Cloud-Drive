/**
 * API类型统一导出
 * 
 * 此文件导出所有API相关类型，主要是re-export共享API类型
 * 并添加特定领域的扩展类型
 */

// 从统一入口导入通用API类型
import { 
  ApiResponse,
  PaginatedResponse
} from '@/app/types';

// 导出请求类型
export * from './requests';

// 导出响应类型
export * from './responses';

// 导出核心API类型
export * from '../core/api';

/**
 * 特定领域的API响应接口
 */

/**
 * 文件系统路径项接口
 * 表示文件路径导航中的单个项目
 */
export interface FolderPathItem {
  id: string;
  name: string;
}

/**
 * 文件夹路径API响应接口
 * 用于文件导航路径的API响应
 */
export interface FolderPathResponse extends ApiResponse {
  data: {
    path: FolderPathItem[];
  };
}
