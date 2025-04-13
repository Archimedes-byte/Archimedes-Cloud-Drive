import { ExtendedFile } from '@/app/types';
import { FileTypeEnum } from '@/app/types/domains/fileTypes';
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
} from './interfaces';

export const fileApi = {
  // 获取文件列表
  async getFiles(params: FileListRequest = {}): Promise<PaginatedResponse<ExtendedFile>> {
    const queryParams = new URLSearchParams();
    if (params.folderId) queryParams.append('folderId', params.folderId);
    if (params.type) queryParams.append('type', params.type);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await fetch(`${API_PATHS.STORAGE.FILES.LIST}?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error('获取文件列表失败');
    }
    return response.json();
  },

  // 搜索文件
  async searchFiles(params: FileSearchRequest): Promise<ExtendedFile[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query);
    if (params.type) queryParams.append('type', params.type);
    if (params.tags?.length) queryParams.append('tags', JSON.stringify(params.tags));

    const response = await fetch(`${API_PATHS.STORAGE.FILES.SEARCH}?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error('搜索失败');
    }
    return response.json();
  },

  // 删除文件
  async deleteFiles(params: FileDeleteRequest): Promise<{ deletedCount: number }> {
    const response = await fetch(API_PATHS.STORAGE.FILES.DELETE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('删除失败');
    }
    return response.json();
  },

  // 更新文件
  async updateFile(fileId: string, params: FileUpdateRequest): Promise<ExtendedFile> {
    const response = await fetch(API_PATHS.STORAGE.FILES.UPDATE(fileId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('更新失败');
    }
    return response.json();
  },

  // 移动文件
  async moveFiles(params: FileMoveRequest): Promise<{ movedCount: number }> {
    const response = await fetch(API_PATHS.STORAGE.FILES.MOVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('移动失败');
    }
    return response.json();
  },

  // 创建文件夹
  async createFolder(name: string, parentId: string | null = null, tags: string[] = []): Promise<ExtendedFile> {
    const response = await fetch(API_PATHS.STORAGE.FOLDERS.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, parentId, tags }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '创建文件夹失败');
    }

    return response.json();
  }
}; 