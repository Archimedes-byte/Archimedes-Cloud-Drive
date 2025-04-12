/**
 * 文件API客户端
 * 提供与文件管理相关的API调用功能
 */
import { ExtendedFile, FileInfo } from '@/app/types';
import { API_PATHS } from '@/app/lib/api/paths';

/**
 * API响应接口
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  code?: string;
}

/**
 * 文件列表请求参数
 */
export interface FileListRequest {
  folderId?: string | null;
  type?: string | null;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

/**
 * 文件搜索请求参数
 */
export interface FileSearchRequest {
  query: string;
  type?: string;
  tags?: string[];
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 自定义API错误类
 */
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 统一处理API响应
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = '请求失败';
    let errorCode;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
      errorCode = errorData.code;
    } catch (e) {
      // 解析错误响应失败，使用默认错误信息
    }
    
    throw new ApiError(errorMessage, response.status, errorCode);
  }

  const data = await response.json();
  
  // 处理不同的响应格式
  if (data.success === false) {
    throw new ApiError(
      data.error || data.message || '请求失败',
      response.status,
      data.code?.toString()
    );
  }
  
  // 返回数据
  return data.data as T;
}

/**
 * 统一的文件管理API客户端
 */
export const fileApi = {
  // 获取文件列表
  async getFiles(params: FileListRequest = {}): Promise<PaginatedResponse<FileInfo>> {
    const queryParams = new URLSearchParams();
    if (params.folderId) queryParams.append('folderId', params.folderId);
    if (params.type) queryParams.append('type', params.type);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    // 使用新的API路径
    const response = await fetch(`${API_PATHS.STORAGE.FILES.LIST}?${queryParams.toString()}`);
    
    return handleResponse<PaginatedResponse<FileInfo>>(response);
  },

  // 搜索文件
  async searchFiles(params: FileSearchRequest): Promise<FileInfo[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query);
    if (params.type) queryParams.append('type', params.type);
    if (params.tags?.length) queryParams.append('tags', JSON.stringify(params.tags));

    // 使用新的API路径
    const response = await fetch(`${API_PATHS.STORAGE.FILES.SEARCH}?${queryParams.toString()}`);
    
    return handleResponse<FileInfo[]>(response);
  },

  // 上传文件
  async uploadFiles(files: File[], tags: string[] = [], folderId: string | null = null, folderName?: string): Promise<FileInfo[]> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('file', file);
    });
    
    if (tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }
    
    if (folderId) {
      formData.append('folderId', folderId);
    }
    
    if (folderName) {
      formData.append('folderName', folderName);
    }

    // 使用新的API路径
    const response = await fetch(API_PATHS.STORAGE.FILES.UPLOAD, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<FileInfo[]>(response);
  },

  // 删除文件
  async deleteFiles(fileIds: string[]): Promise<{ deletedCount: number }> {
    // 使用新的API路径
    const response = await fetch(API_PATHS.STORAGE.FILES.DELETE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    });

    return handleResponse<{ deletedCount: number }>(response);
  },

  // 移动文件
  async moveFiles(fileIds: string[], targetFolderId: string): Promise<{ movedCount: number }> {
    // 使用新的API路径
    const response = await fetch(API_PATHS.STORAGE.FILES.MOVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds, targetFolderId }),
    });

    return handleResponse<{ movedCount: number }>(response);
  },

  // 更新文件
  async updateFile(fileId: string, name?: string, tags?: string[]): Promise<FileInfo> {
    // 使用新的API路径
    const response = await fetch(API_PATHS.STORAGE.FILES.UPDATE(fileId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, tags }),
    });

    return handleResponse<FileInfo>(response);
  },

  // 下载文件
  async downloadFiles(fileIds: string[]): Promise<Blob> {
    // 使用新的API路径
    const response = await fetch(API_PATHS.STORAGE.FILES.DOWNLOAD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    });

    if (!response.ok) {
      let errorMessage = '下载失败';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // 解析错误响应失败，使用默认错误信息
      }
      
      throw new ApiError(errorMessage, response.status);
    }
    
    return await response.blob();
  },

  // 创建文件夹
  async createFolder(name: string, parentId: string | null = null, tags: string[] = []): Promise<FileInfo> {
    // 使用新的API路径
    const response = await fetch(API_PATHS.STORAGE.FOLDERS.CREATE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId, tags }),
    });

    return handleResponse<FileInfo>(response);
  },
  
  // 获取文件夹列表
  async getFolders(parentId: string | null = null, page = 1, pageSize = 50): Promise<PaginatedResponse<FileInfo>> {
    const queryParams = new URLSearchParams();
    if (parentId) queryParams.append('parentId', parentId);
    queryParams.append('page', page.toString());
    queryParams.append('pageSize', pageSize.toString());

    // 使用新的API路径
    const response = await fetch(`${API_PATHS.STORAGE.FOLDERS.LIST}?${queryParams.toString()}`);
    
    return handleResponse<PaginatedResponse<FileInfo>>(response);
  },
  
  // 获取单个文件信息
  async getFile(fileId: string): Promise<FileInfo> {
    // 使用新的API路径
    const response = await fetch(API_PATHS.STORAGE.FILES.GET(fileId));
    
    return handleResponse<FileInfo>(response);
  },
  
  // 获取存储统计信息
  async getStorageStats(): Promise<{
    totalSize: number;
    usedSize: number;
    fileCount: number;
    folderCount: number;
  }> {
    // 使用新的API路径
    const response = await fetch(API_PATHS.STORAGE.STATS);
    
    return handleResponse<{
      totalSize: number;
      usedSize: number;
      fileCount: number;
      folderCount: number;
    }>(response);
  },
  
  // 获取最近访问的文件
  async getRecentFiles(limit = 10): Promise<FileInfo[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    
    // 使用新的API路径
    const response = await fetch(`${API_PATHS.STORAGE.RECENT}?${queryParams.toString()}`);
    
    return handleResponse<FileInfo[]>(response);
  },
  
  // 添加到收藏
  async addToFavorites(fileIds: string[]): Promise<{ count: number }> {
    // 使用新的API路径
    const response = await fetch(API_PATHS.STORAGE.FAVORITES.ADD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    });
    
    return handleResponse<{ count: number }>(response);
  },
  
  // 从收藏中移除
  async removeFromFavorites(fileIds: string[]): Promise<{ count: number }> {
    // 使用新的API路径
    const response = await fetch(API_PATHS.STORAGE.FAVORITES.REMOVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    });
    
    return handleResponse<{ count: number }>(response);
  },
  
  // 获取收藏列表
  async getFavorites(page = 1, pageSize = 50): Promise<PaginatedResponse<FileInfo>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('pageSize', pageSize.toString());
    
    // 使用新的API路径
    const response = await fetch(`${API_PATHS.STORAGE.FAVORITES.LIST}?${queryParams.toString()}`);
    
    return handleResponse<PaginatedResponse<FileInfo>>(response);
  }
}; 