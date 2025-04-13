import { ExtendedFile, FileType } from '@/app/types';
import { 
  FileListRequest, 
  FileSearchRequest, 
  FileUploadRequest,
  API_PATHS
} from '../api/interfaces';

/**
 * 文件管理API服务
 * 集中管理所有与后端API的交互
 */
export const fileService = {
  /**
   * 获取文件列表
   */
  async getFiles(params: FileListRequest = {}): Promise<ExtendedFile[]> {
    const queryParams = new URLSearchParams();
    if (params.folderId) queryParams.append('folderId', params.folderId);
    if (params.type) queryParams.append('type', params.type);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await fetch(`${API_PATHS.STORAGE.FILES.LIST}?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '获取文件列表失败');
    }
    
    const data = await response.json();
    return data.data || [];
  },
  
  /**
   * 搜索文件
   */
  async searchFiles(params: FileSearchRequest): Promise<ExtendedFile[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query);
    if (params.type) queryParams.append('type', params.type);
    if (params.tags?.length) queryParams.append('tags', JSON.stringify(params.tags));

    const response = await fetch(`${API_PATHS.STORAGE.FILES.SEARCH}?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '搜索失败');
    }
    
    const data = await response.json();
    return data.data || [];
  },
  
  /**
   * 删除文件
   */
  async deleteFiles(fileIds: string[]): Promise<{ deletedCount: number }> {
    const response = await fetch(API_PATHS.STORAGE.FILES.DELETE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '删除失败');
    }
    
    return await response.json();
  },
  
  /**
   * 更新文件
   */
  async updateFile(fileId: string, name: string, tags?: string[]): Promise<ExtendedFile> {
    const response = await fetch(API_PATHS.STORAGE.FILES.UPDATE(fileId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, tags }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '更新失败');
    }
    
    return await response.json();
  },
  
  /**
   * 移动文件
   */
  async moveFiles(fileIds: string[], targetFolderId: string): Promise<{ movedCount: number }> {
    const response = await fetch(API_PATHS.STORAGE.FILES.MOVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds, targetFolderId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '移动失败');
    }
    
    return await response.json();
  },
  
  /**
   * 下载文件
   */
  async downloadFiles(fileIds: string[]): Promise<Blob> {
    const response = await fetch(API_PATHS.STORAGE.FILES.DOWNLOAD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '下载失败');
    }
    
    return await response.blob();
  },
  
  /**
   * 创建文件夹
   */
  async createFolder(name: string, parentId: string | null = null, tags: string[] = []): Promise<ExtendedFile> {
    const response = await fetch(API_PATHS.STORAGE.FOLDERS.CREATE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId, tags }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '创建文件夹失败');
    }
    
    return await response.json();
  },
  
  /**
   * 上传文件
   */
  async uploadFiles(files: FileList | File[], folderId: string | null = null, tags: string[] = []): Promise<ExtendedFile[]> {
    const formData = new FormData();
    
    // 添加文件
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
    }
    
    // 添加其他参数
    if (folderId) {
      formData.append('folderId', folderId);
    }
    
    if (tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }
    
    const response = await fetch(API_PATHS.STORAGE.FILES.UPLOAD, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '上传失败');
    }
    
    const data = await response.json();
    return data.files || [];
  }
}; 