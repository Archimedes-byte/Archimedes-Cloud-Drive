/**
 * 系统配置常量
 * 集中管理系统中的配置参数，避免多处定义造成不一致
 */
import { join } from 'path';
import { API_PATHS } from '@/app/lib/api/paths';

// 文件存储相关配置
export const STORAGE_CONFIG = {
  // 上传文件存储根目录
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  
  // 完整的上传路径（基于项目根目录）
  get UPLOAD_PATH() {
    return join(process.cwd(), this.UPLOAD_DIR);
  },
  
  // 默认的文件权限
  FILE_PERMISSIONS: 0o644,
  
  // 默认的目录权限
  DIR_PERMISSIONS: 0o755,
  
  // 文件URLs基础路径
  FILE_BASE_URL: API_PATHS.STORAGE.FILES.LIST.replace('/list', ''),
  
  // 临时文件存储
  TEMP_DIR: 'tmp'
};

// API相关配置
export const API_CONFIG = {
  // 最大请求体大小（单位：字节）
  MAX_BODY_SIZE: 50 * 1024 * 1024, // 50MB
  
  // API路径前缀
  API_PREFIX: '/api',
  
  // 文件相关API路径
  FILES: {
    UPLOAD: API_PATHS.STORAGE.FILES.UPLOAD,
    LIST: API_PATHS.STORAGE.FILES.LIST,
    SEARCH: API_PATHS.STORAGE.FILES.SEARCH,
    CONTENT: (id: string) => API_PATHS.STORAGE.FILES.CONTENT(id),
    DOWNLOAD: (id: string) => API_PATHS.STORAGE.FILES.DOWNLOAD,
  }
};

// 分页相关配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

// 用户相关配置
export const USER_CONFIG = {
  DEFAULT_STORAGE_LIMIT: 10 * 1024 * 1024 * 1024 // 10GB
}; 