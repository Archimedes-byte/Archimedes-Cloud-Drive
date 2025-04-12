/**
 * 配置模块 (Configuration Module)
 * 
 * 此模块负责管理应用配置和环境变量，提供系统各部分使用的配置常量。
 * 主要功能：
 * - 存储配置常量
 * - API配置管理
 * - 分页与用户相关配置
 * 
 * @example
 * // 访问存储配置
 * import { STORAGE_CONFIG } from '@/app/lib/config';
 * const uploadDir = STORAGE_CONFIG.UPLOAD_DIR;
 * 
 * // 使用API配置
 * import { API_CONFIG } from '@/app/lib/config';
 * const maxBodySize = API_CONFIG.MAX_BODY_SIZE;
 */

// 导出具体配置常量，使用命名导出提高清晰度
export { 
  STORAGE_CONFIG,
  API_CONFIG,
  PAGINATION_CONFIG,
  USER_CONFIG
} from './config'; 