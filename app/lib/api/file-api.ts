/**
 * 文件API客户端
 * 提供与文件管理相关的API调用功能
 */
import { ExtendedFile, FileInfo } from '@/app/types';
import { API_PATHS } from '@/app/lib/api/paths';

/**
 * 定义收藏夹类型
 */
export interface FavoriteFolderInfo {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  fileCount?: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

/**
 * API响应接口
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * API错误类
 */
class ApiError extends Error {
  constructor(
    message: string, 
    public status: number,
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
    let errorMessage = `请求失败: ${response.status} ${response.statusText}`;
    let errorCode;
    
    try {
      // 检查内容类型
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorCode = errorData.code;
        
        // 记录详细的错误信息到控制台
        console.error('API请求失败，服务器返回:', {
          status: response.status,
          errorData,
          url: response.url
        });
      } else {
        // 非JSON响应
        const textResponse = await response.text();
        console.error('API请求失败，非JSON响应:', {
          status: response.status,
          text: textResponse.substring(0, 200), // 只记录前200个字符，避免日志过大
          url: response.url
        });
      }
    } catch (e) {
      // 解析错误响应失败，使用默认错误信息
      console.error('解析API错误响应失败:', e);
    }
    
    throw new ApiError(errorMessage, response.status, errorCode);
  }

  try {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('响应不是JSON格式:', {
        contentType,
        url: response.url,
        status: response.status
      });
      
      // 如果不是JSON但状态码是成功的，返回一个简单的成功对象
      return { success: true } as unknown as T;
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
    
    // 处理嵌套的数据结构
    let resultData: any;
    
    if (data.data !== undefined) {
      // 标准API响应格式 { success: true, data: ... }
      resultData = data.data;
    } else if (data.folder !== undefined) {
      // 文件夹API响应格式 { folder: ... }
      resultData = data.folder;
    } else if (data.file !== undefined) {
      // 文件API响应格式 { file: ... }
      resultData = data.file;
    } else if (data.items !== undefined) {
      // 列表API响应格式 { items: [...], total: ... }
      resultData = data;
    } else {
      // 其他格式，直接返回数据
      resultData = data;
    }
    
    return resultData as T;
  } catch (e) {
    if (e instanceof ApiError) {
      throw e; // 重新抛出已经创建的API错误
    }
    console.error('解析API响应JSON失败:', e);
    throw new ApiError('解析API响应失败: ' + (e instanceof Error ? e.message : '未知错误'), 500);
  }
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
  recursive?: boolean;
  signal?: AbortSignal;
  _t?: number;
}

/**
 * 文件搜索请求参数
 */
export interface FileSearchRequest {
  /** 搜索关键词 */
  query: string;
  /** 文件类型过滤 */
  type?: string;
  /** 标签过滤 */
  tags?: string[];
  /** 是否包含文件夹 */
  includeFolder?: boolean;
  /** 搜索模式: name=按名称搜索, tag=按标签搜索 */
  searchMode?: 'name' | 'tag';
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
    
    // 始终添加时间戳参数以防止缓存问题
    const timestamp = params._t || Date.now();
    queryParams.append('_t', timestamp.toString());

    console.log('获取文件列表，请求参数:', {
      ...params,
      _t: timestamp,
      url: `${API_PATHS.STORAGE.FILES.LIST}?${queryParams.toString()}`
    });
    
    // 提取signal参数，其他参数保留
    const { signal, ...otherParams } = params;

    // 使用新的API路径
    const response = await fetch(`${API_PATHS.STORAGE.FILES.LIST}?${queryParams.toString()}`, {
      signal, // 使用AbortSignal进行超时控制
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest'
      },
      // 添加额外的选项以绕过缓存
      cache: 'no-store'
    });
    
    const result = await handleResponse<PaginatedResponse<FileInfo>>(response);
    console.log('获取文件列表响应:', {
      items: result.items.length,
      total: result.total,
      timestamp
    });
    
    return result;
  },

  // 搜索文件
  async searchFiles(params: FileSearchRequest): Promise<FileInfo[]> {
    // 验证必需参数
    if (!params.query || !params.query.trim()) {
      throw new Error('搜索关键词不能为空');
    }

    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query.trim());
    
    // 添加可选参数
    if (params.type) {
      queryParams.append('type', params.type);
    }
    
    if (params.tags?.length) {
      // 过滤空标签并移除前后空格
      const validTags = params.tags
        .filter(tag => tag && typeof tag === 'string')
        .map(tag => tag.trim())
        .filter(tag => tag);
        
      if (validTags.length > 0) {
        queryParams.append('tags', JSON.stringify(validTags));
      }
    }
    
    // 设置是否包含文件夹，默认为true
    const includeFolder = params.includeFolder !== false;
    queryParams.append('includeFolder', includeFolder.toString());
    
    // 设置搜索模式，默认为按名称搜索
    const searchMode = params.searchMode === 'tag' ? 'tag' : 'name';
    queryParams.append('searchMode', searchMode);

    // 记录搜索请求参数
    console.log('[API] 搜索请求:', {
      query: params.query.trim(),
      searchMode,
      type: params.type || '(全部)',
      includeFolder,
      tagsCount: params.tags?.length || 0
    });

    // 构建API请求URL
    const url = `${API_PATHS.STORAGE.FILES.SEARCH}?${queryParams.toString()}`;
    
    try {
      // 发送请求
      const response = await fetch(url);
      const result = await handleResponse<FileInfo[]>(response);
      
      // 记录结果统计
      const folderCount = result.filter(f => f.isFolder).length;
      console.log('[API] 搜索结果:', {
        total: result.length,
        folders: folderCount,
        files: result.length - folderCount,
        mode: searchMode
      });
      
      return result;
    } catch (error) {
      console.error('[API] 搜索请求失败:', error);
      throw error;
    }
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
  async updateFile(fileId: string, name?: string, tags?: string[], preserveOriginalType?: boolean): Promise<FileInfo> {
    console.log('调用文件API.updateFile:', { fileId, name, tagsCount: tags?.length, preserveOriginalType });
    
    // 确保preserveOriginalType始终为true，除非明确指定为false
    const effectivePreserveType = preserveOriginalType !== false;
    
    // 使用新的API路径
    const response = await fetch(API_PATHS.STORAGE.FILES.UPDATE(fileId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        tags, 
        preserveOriginalType: effectivePreserveType 
      }),
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
    try {
      console.log('API调用 - 创建文件夹:', { 
        name, 
        parentId, 
        tagsCount: tags.length,
        apiPath: API_PATHS.STORAGE.FOLDERS.CREATE
      });
      
      // 确保请求参数正确
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('文件夹名称不能为空');
      }
      
      // 使用正确的API路径和方法
      const response = await fetch(API_PATHS.STORAGE.FOLDERS.CREATE, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ 
          name: name.trim(), 
          parentId, 
          tags: Array.isArray(tags) ? tags : [] 
        }),
      });

      console.log('创建文件夹API响应状态:', response.status, response.statusText);
      
      // 如果响应不成功，尝试提取更详细的错误信息
      if (!response.ok) {
        let errorMessage = '创建文件夹失败：' + response.statusText;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('服务器返回错误:', errorData);
        } catch (e) {
          // 如果不是JSON响应，尝试获取文本内容
          const text = await response.text();
          console.error('无法解析错误响应 (非JSON):', {
            status: response.status,
            text: text.substring(0, 200) // 只记录前200个字符
          });
          
          // 如果响应包含HTML，可能是404页面
          if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            errorMessage = `服务器返回HTML页面，可能是路由错误: ${response.status} ${response.statusText}`;
          }
        }
        throw new ApiError(errorMessage, response.status);
      }
      
      // 解析响应
      const responseData = await response.json();
      console.log('创建文件夹成功，返回数据:', responseData);
      
      // 服务器可能返回不同格式的响应，需要适配
      let folderData: FileInfo;
      
      // 检查响应结构
      if (responseData.data && responseData.data.folder) {
        // API返回{ success: true, data: { folder: {...} } }格式
        folderData = responseData.data.folder;
      } else if (responseData.folder) {
        // API返回{ folder: {...} }格式
        folderData = responseData.folder;
      } else if (responseData.data) {
        // API返回{ success: true, data: {...} }格式
        folderData = responseData.data;
      } else {
        // 直接返回响应
        folderData = responseData;
      }
      
      console.log('处理后的文件夹数据:', folderData);
      return folderData;
    } catch (error) {
      console.error('创建文件夹API调用失败:', error);
      
      // 重新包装错误，确保提供有用的错误信息
      if (error instanceof ApiError) {
        throw error;
      } else {
        throw new ApiError(
          error instanceof Error ? error.message : '创建文件夹失败',
          500
        );
      }
    }
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
    const response = await fetch(API_PATHS.STORAGE.STATS.USAGE);
    
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
    queryParams.set('limit', limit.toString());
    
    const response = await fetch(`${API_PATHS.STORAGE.RECENT}?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });
    
    const result = await handleResponse<any>(response);
    console.log('获取最近访问文件，原始响应:', result);
    
    // 特殊处理响应格式，确保返回正确的数据结构
    if (result && typeof result === 'object') {
      if (Array.isArray(result)) {
        // 如果直接是数组，直接返回
        return result;
      } else if (result.files && Array.isArray(result.files)) {
        // 如果是包含files字段的对象，返回files数组
        return result.files;
      }
    }
    
    // 返回空数组作为默认值
    console.warn('获取最近访问文件返回格式异常:', result);
    return [];
  },
  
  // 获取最近下载的文件
  async getRecentDownloads(limit = 10): Promise<FileInfo[]> {
    const queryParams = new URLSearchParams();
    queryParams.set('limit', limit.toString());
    
    const response = await fetch(`${API_PATHS.STORAGE.DOWNLOADS.RECENT}?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });
    
    const result = await handleResponse<any>(response);
    console.log('获取最近下载文件，原始响应:', result);
    
    // 特殊处理响应格式，确保返回正确的数据结构
    if (result && typeof result === 'object') {
      if (Array.isArray(result)) {
        // 如果直接是数组，直接返回
        return result;
      } else if (result.files && Array.isArray(result.files)) {
        // 如果是包含files字段的对象，返回files数组
        return result.files;
      }
    }
    
    // 返回空数组作为默认值
    console.warn('获取最近下载文件返回格式异常:', result);
    return [];
  },
  
  // 切换收藏状态
  async toggleFavorite(fileId: string, isFavorite: boolean): Promise<{ success: boolean, count: number }> {
    if (isFavorite) {
      // 添加到收藏
      const result = await this.addBatchToFavoriteFolder([fileId]);
      return { success: true, count: result.count };
    } else {
      // 从收藏中移除
      const result = await this.removeBatchFromFavoriteFolder([fileId]);
      return { success: true, count: result.count };
    }
  },
  
  // 获取所有收藏文件列表
  async getAllFavoriteFiles(page = 1, pageSize = 50): Promise<PaginatedResponse<FileInfo>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('pageSize', pageSize.toString());
    
    // 添加时间戳防止缓存问题
    queryParams.append('_t', Date.now().toString());
    
    // 使用LIST路径的GET请求
    const response = await fetch(`${API_PATHS.STORAGE.FAVORITES.LIST}?${queryParams.toString()}`);
    
    return handleResponse<PaginatedResponse<FileInfo>>(response);
  },

  // 获取收藏夹列表
  async getFavoriteFolders(): Promise<{ folders: FavoriteFolderInfo[] }> {
    const response = await fetch(API_PATHS.STORAGE.FAVORITES.FOLDERS.LIST);
    return handleResponse<{ folders: FavoriteFolderInfo[] }>(response);
  },

  // 创建收藏夹
  async createFavoriteFolder(
    name: string, 
    description?: string, 
    isDefault?: boolean
  ): Promise<{ folder: FavoriteFolderInfo }> {
    const response = await fetch(API_PATHS.STORAGE.FAVORITES.FOLDERS.CREATE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, isDefault }),
    });
    
    return handleResponse<{ folder: FavoriteFolderInfo }>(response);
  },
  
  // 更新收藏夹
  async updateFavoriteFolder(
    folderId: string,
    data: {
      name?: string;
      description?: string;
      isDefault?: boolean;
    }
  ): Promise<{ folder: FavoriteFolderInfo }> {
    const response = await fetch(API_PATHS.STORAGE.FAVORITES.FOLDERS.UPDATE(folderId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    return handleResponse<{ folder: FavoriteFolderInfo }>(response);
  },
  
  // 删除收藏夹
  async deleteFavoriteFolder(folderId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(API_PATHS.STORAGE.FAVORITES.FOLDERS.DELETE(folderId), {
      method: 'DELETE',
    });
    
    return handleResponse<{ success: boolean; message: string }>(response);
  },
  
  // 添加文件到收藏夹
  async addToFavoriteFolder(
    fileId: string, 
    folderId?: string
  ): Promise<{ success: boolean }> {
    const response = await fetch(API_PATHS.STORAGE.FAVORITES.ADD_TO_FOLDER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, folderId }),
    });
    
    return handleResponse<{ success: boolean }>(response);
  },
  
  // 批量添加文件到收藏夹
  async addBatchToFavoriteFolder(
    fileIds: string[], 
    folderId?: string
  ): Promise<{ count: number }> {
    const response = await fetch(API_PATHS.STORAGE.FAVORITES.ADD_TO_FOLDER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds, folderId }),
    });
    
    return handleResponse<{ count: number }>(response);
  },
  
  // 从收藏夹中移除文件
  async removeFromFavoriteFolder(
    fileId: string, 
    folderId?: string
  ): Promise<{ success: boolean }> {
    const response = await fetch(API_PATHS.STORAGE.FAVORITES.REMOVE_FROM_FOLDER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, folderId }),
    });
    
    return handleResponse<{ success: boolean }>(response);
  },
  
  // 批量从收藏夹中移除文件
  async removeBatchFromFavoriteFolder(
    fileIds: string[], 
    folderId?: string
  ): Promise<{ count: number }> {
    const response = await fetch(API_PATHS.STORAGE.FAVORITES.REMOVE_FROM_FOLDER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds, folderId }),
    });
    
    return handleResponse<{ count: number }>(response);
  },
  
  // 获取收藏夹中的文件列表
  async getFolderFiles(
    folderId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: FileInfo[]; total: number; page: number; pageSize: number }> {
    const response = await fetch(API_PATHS.STORAGE.FAVORITES.FOLDERS.FILES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId, page, pageSize }),
    });
    
    return handleResponse<{
      items: FileInfo[];
      total: number;
      page: number;
      pageSize: number;
    }>(response);
  },

  // 分享文件
  async shareFiles(options: {
    fileIds: string[];
    expiryDays: number;
    extractCode?: string;
    accessLimit?: number | null;
    autoRefreshCode?: boolean;
  }): Promise<{ shareLink: string; extractCode: string }> {
    const response = await fetch(API_PATHS.STORAGE.SHARE.ROOT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    return handleResponse<{ shareLink: string; extractCode: string }>(response);
  },

  // 获取分享列表
  async getSharedFiles(): Promise<any[]> {
    const response = await fetch(API_PATHS.STORAGE.SHARE.ROOT);
    return handleResponse<any[]>(response);
  },

  // 删除分享
  async deleteShares(shareIds: string[]): Promise<{ deletedCount: number }> {
    const response = await fetch(API_PATHS.STORAGE.SHARE.ROOT, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareIds }),
    });

    return handleResponse<{ deletedCount: number }>(response);
  },

  // 记录文件访问历史
  async recordFileAccess(fileId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(API_PATHS.STORAGE.RECORD_ACCESS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });
      
      return handleResponse<{ success: boolean }>(response);
    } catch (error) {
      console.error('记录文件访问历史失败:', error);
      // 即使失败也不影响用户体验，返回成功
      return { success: false };
    }
  },
  
  // 记录文件下载历史
  async recordFileDownload(fileId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(API_PATHS.STORAGE.DOWNLOADS.RECORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });
      
      return handleResponse<{ success: boolean }>(response);
    } catch (error) {
      console.error('记录文件下载历史失败:', error);
      // 即使失败也不影响用户体验，返回成功
      return { success: false };
    }
  },
}; 