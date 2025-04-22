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
    ROOT: `${API_BASE}/storage`,
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
      RENAME: (fileId: string) => `${STORAGE_BASE}/files/rename/${fileId}`,
      CHECK_NAME_CONFLICTS: `${STORAGE_BASE}/files/check-name-conflicts`,
    },
    
    // 文件夹操作
    FOLDERS: {
      LIST: `${STORAGE_BASE}/folders`,
      GET: (folderId: string) => `${STORAGE_BASE}/folders/${folderId}`,
      CREATE: `${STORAGE_BASE}/folders`,
      DELETE: `${STORAGE_BASE}/folders`,
      UPDATE: (folderId: string) => `${STORAGE_BASE}/folders/${folderId}`,
      CHILDREN: (folderId: string) => `${STORAGE_BASE}/folders/${folderId}/children`,
      RENAME: (folderId: string) => `${STORAGE_BASE}/folders/${folderId}/rename`,
    },
    
    // 通用存储操作
    INFO: `${STORAGE_BASE}/info`,
    QUOTA: `${STORAGE_BASE}/quota`,
    RECENT: `${STORAGE_BASE}/recent`,
    STATS: {
      USAGE: `${STORAGE_BASE}/stats/usage`,
    },
    // 记录访问历史
    RECORD_ACCESS: `${STORAGE_BASE}/recent/record`,
    
    // 收藏相关
    FAVORITES: {
      ROOT: `${STORAGE_BASE}/favorites`,
      LIST: `${STORAGE_BASE}/favorites/list`,
      ADD: `${STORAGE_BASE}/favorites/add`,
      REMOVE: `${STORAGE_BASE}/favorites/remove`,
      FOLDERS: {
        LIST: `${STORAGE_BASE}/favorites/folders`,
        CREATE: `${STORAGE_BASE}/favorites/folders`,
        UPDATE: (id: string) => `${STORAGE_BASE}/favorites/folders/${id}`,
        DELETE: (id: string) => `${STORAGE_BASE}/favorites/folders/${id}`,
        FILES: `${STORAGE_BASE}/favorites/folders/files`,
      },
      ADD_TO_FOLDER: `${STORAGE_BASE}/favorites/add-to-folder`,
      REMOVE_FROM_FOLDER: `${STORAGE_BASE}/favorites/remove-from-folder`,
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
    
    // 下载相关
    DOWNLOADS: {
      // 记录下载历史
      RECORD: `${STORAGE_BASE}/downloads/record`,
      // 获取最近下载记录
      RECENT: `${STORAGE_BASE}/downloads/recent`,
    },
  }
}; 