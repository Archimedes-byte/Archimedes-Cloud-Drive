import { ExtendedFile, FileType } from '../types/index';
import { 
  API_PATHS,
  ApiResponse,
  FileListRequest,
  FileSearchRequest,
  FileUploadRequest,
  FileDeleteRequest,
  FileMoveRequest,
  FileUpdateRequest,
  FolderCreateRequest,
  PaginatedResponse
} from '../api/interfaces';

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
  
  // 返回数据可能在data、files或其他字段中
  return (data.data || data.files || data.items || data) as T;
}

/**
 * 统一的文件管理API客户端
 */
export const fileApi = {
  // 获取文件列表
  async getFiles(params: FileListRequest = {}): Promise<ExtendedFile[]> {
    const queryParams = new URLSearchParams();
    if (params.folderId) queryParams.append('folderId', params.folderId);
    if (params.type) queryParams.append('type', params.type);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await fetch(`${API_PATHS.FILES.LIST}?${queryParams.toString()}`);
    const data = await handleResponse<ApiResponse<ExtendedFile[]>>(response);
    return data.data || [];
  },

  // 搜索文件
  async searchFiles(params: FileSearchRequest): Promise<ExtendedFile[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query);
    if (params.type) queryParams.append('type', params.type);
    if (params.tags?.length) queryParams.append('tags', JSON.stringify(params.tags));

    const response = await fetch(`${API_PATHS.FILES.SEARCH}?${queryParams.toString()}`);
    return handleResponse<ExtendedFile[]>(response);
  },

  // 上传文件
  async uploadFiles(files: File[], tags: string[] = [], folderId: string | null = null, folderName?: string): Promise<ExtendedFile[]> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
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

    const response = await fetch(API_PATHS.FILES.UPLOAD, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<ExtendedFile[]>(response);
  },

  // 删除文件
  async deleteFiles(fileIds: string[]): Promise<{ deletedCount: number }> {
    const response = await fetch(API_PATHS.FILES.DELETE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    });

    return handleResponse<{ deletedCount: number }>(response);
  },

  // 移动文件
  async moveFiles(fileIds: string[], targetFolderId: string): Promise<{ movedCount: number }> {
    const response = await fetch(API_PATHS.FILES.MOVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds, targetFolderId }),
    });

    return handleResponse<{ movedCount: number }>(response);
  },

  // 更新文件
  async updateFile(fileId: string, name?: string, tags?: string[]): Promise<ExtendedFile> {
    const response = await fetch(API_PATHS.FILES.UPDATE(fileId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, tags }),
    });

    return handleResponse<ExtendedFile>(response);
  },

  // 下载文件
  async downloadFiles(fileIds: string[]): Promise<Blob> {
    const response = await fetch(API_PATHS.FILES.DOWNLOAD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    });

    if (!response.ok) {
      let errorMessage = '下载失败';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // 解析错误响应失败，使用默认错误信息
      }
      throw new ApiError(errorMessage, response.status);
    }

    return response.blob();
  },

  // 创建文件夹
  async createFolder(name: string, parentId: string | null = null, tags: string[] = []): Promise<ExtendedFile> {
    const response = await fetch(API_PATHS.FOLDERS.CREATE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId, tags }),
    });

    return handleResponse<ExtendedFile>(response);
  }
}; 