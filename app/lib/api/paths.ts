/**
 * API路径配置
 * 集中管理所有API端点路径
 */

// API基础路径
const API_BASE = '/api';

// 存储管理相关API基础路径
const STORAGE_BASE = `${API_BASE}/storage`;

/**
 * API路径配置对象
 * 包含所有API端点路径
 */
export const API_PATHS = {
  // 存储相关API (统一文件和文件夹操作)
  STORAGE: {
    // 文件操作
    FILES: {
      LIST: `${STORAGE_BASE}/files`,
      GET: (fileId: string) => `${STORAGE_BASE}/files/${fileId}`,
      SEARCH: `${STORAGE_BASE}/files/search`,
      UPLOAD: `${STORAGE_BASE}/files/upload`,
      DELETE: `${STORAGE_BASE}/files/delete`,
      MOVE: `${STORAGE_BASE}/files/move`,
      UPDATE: (fileId: string) => `${STORAGE_BASE}/files/${fileId}`,
      DOWNLOAD: `${STORAGE_BASE}/files/download`,
      PREVIEW: (fileId: string) => `${STORAGE_BASE}/files/${fileId}/preview`,
      CONTENT: (fileId: string) => `${STORAGE_BASE}/files/${fileId}/content`,
      RENAME: (fileId: string) => `${STORAGE_BASE}/files/${fileId}/rename`,
      CHECK_NAME_CONFLICTS: `${STORAGE_BASE}/files/check-name-conflicts`,
    },
    
    // 文件夹操作
    FOLDERS: {
      LIST: `${STORAGE_BASE}/folders`,
      GET: (folderId: string) => `${STORAGE_BASE}/folders/${folderId}`,
      CREATE: `${STORAGE_BASE}/folders`,
      DELETE: `${STORAGE_BASE}/folders/delete`,
      UPDATE: (folderId: string) => `${STORAGE_BASE}/folders/${folderId}`,
      CHILDREN: (folderId: string) => `${STORAGE_BASE}/folders/${folderId}/children`,
      RENAME: (folderId: string) => `${STORAGE_BASE}/folders/${folderId}/rename`,
    },
    
    // 通用存储操作
    INFO: `${STORAGE_BASE}/info`,
    QUOTA: `${STORAGE_BASE}/quota`,
    RECENT: `${STORAGE_BASE}/recent`,
    STATS: `${STORAGE_BASE}/stats`,
    
    // 收藏相关
    FAVORITES: {
      LIST: `${STORAGE_BASE}/favorites`,
      ADD: `${STORAGE_BASE}/favorites/add`,
      REMOVE: `${STORAGE_BASE}/favorites/remove`,
    },
    
    // 标签相关
    TAGS: {
      LIST: `${STORAGE_BASE}/tags`,
      CREATE: `${STORAGE_BASE}/tags`,
      DELETE: `${STORAGE_BASE}/tags/delete`,
    },
    
    // 分享相关
    SHARE: {
      ROOT: `${STORAGE_BASE}/share`,
      VERIFY: `${STORAGE_BASE}/share/verify`,
      DOWNLOAD: `${STORAGE_BASE}/share/download`,
    },
  }
}; 