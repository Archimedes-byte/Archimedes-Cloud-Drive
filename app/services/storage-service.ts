/**
 * 存储服务兼容层
 * 提供与原始StorageService兼容的API，内部使用新的拆分服务实现
 * 
 * 这个文件用于平滑过渡到新的服务架构，避免对现有代码的破坏性改动
 */
import { 
  FileUploadService, 
  FileManagementService, 
  FileStatsService,
  mapFileEntityToFileInfo
} from './storage';
import { FileInfo } from '@/app/types';

/**
 * 存储服务类
 * 提供文件和文件夹操作的业务逻辑
 * 
 * 注意: 此类已被拆分为多个专注的服务类，请尽可能使用新的服务类
 */
export class StorageService {
  private uploadService: FileUploadService;
  private managementService: FileManagementService;
  private statsService: FileStatsService;

  constructor() {
    this.uploadService = new FileUploadService();
    this.managementService = new FileManagementService();
    this.statsService = new FileStatsService();
  }

  /**
   * 创建文件夹
   */
  async createFolder(
    userId: string,
    name: string,
    parentId: string | null = null,
    tags: string[] = []
  ): Promise<FileInfo> {
    return this.uploadService.createFolder(userId, name, parentId, tags);
  }

  /**
   * 上传文件
   */
  async uploadFile(
    userId: string,
    file: {
      name: string;
      type: string;
      size: number;
      arrayBuffer: () => Promise<ArrayBuffer>;
    },
    folderId: string | null = null,
    tags: string[] = [],
    originalFileName?: string
  ): Promise<FileInfo> {
    return this.uploadService.uploadFile(userId, file, folderId, tags, originalFileName);
  }

  /**
   * 获取用户的文件列表
   */
  async getFiles(
    userId: string,
    folderId: string | null = null,
    type?: string | null,
    page = 1,
    pageSize = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  ): Promise<{ items: FileInfo[]; total: number; page: number; pageSize: number }> {
    return this.managementService.getFiles(userId, folderId, type, page, pageSize, sortBy, sortOrder);
  }

  /**
   * 搜索文件
   */
  async searchFiles(
    userId: string,
    query: string,
    type?: string | null,
    tags?: string[]
  ): Promise<FileInfo[]> {
    return this.managementService.searchFiles(userId, query, type, tags);
  }

  /**
   * 获取单个文件信息
   */
  async getFile(userId: string, fileId: string): Promise<FileInfo> {
    return this.managementService.getFile(userId, fileId);
  }

  /**
   * 删除文件
   */
  async deleteFiles(userId: string, fileIds: string[]): Promise<number> {
    return this.managementService.deleteFiles(userId, fileIds);
  }

  /**
   * 移动文件
   */
  async moveFiles(
    userId: string,
    fileIds: string[],
    targetFolderId: string | null
  ): Promise<number> {
    return this.managementService.moveFiles(userId, fileIds, targetFolderId);
  }

  /**
   * 重命名文件
   */
  async renameFile(
    fileId: string,
    newName: string,
    userId: string,
    tags?: string[]
  ): Promise<FileInfo> {
    return this.managementService.renameFile(userId, fileId, newName, tags);
  }

  /**
   * 获取用户的存储统计信息
   */
  async getStorageStats(userId: string): Promise<{
    totalSize: number;
    usedSize: number;
    fileCount: number;
    folderCount: number;
  }> {
    return this.statsService.getStorageStats(userId);
  }

  /**
   * 获取最近文件
   */
  async getRecentFiles(userId: string, limit = 10): Promise<FileInfo[]> {
    return this.statsService.getRecentFiles(userId, limit);
  }

  /**
   * 添加到收藏夹
   */
  async addToFavorites(userId: string, fileIds: string[]): Promise<number> {
    return this.statsService.addToFavorites(userId, fileIds);
  }

  /**
   * 从收藏夹移除
   */
  async removeFromFavorites(userId: string, fileIds: string[]): Promise<number> {
    return this.statsService.removeFromFavorites(userId, fileIds);
  }

  /**
   * 获取收藏文件
   */
  async getFavorites(
    userId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: FileInfo[]; total: number; page: number; pageSize: number }> {
    return this.statsService.getFavorites(userId, page, pageSize);
  }

  /**
   * 更新文件信息
   */
  async updateFile(userId: string, fileId: string, updates: { 
    name?: string; 
    tags?: string[];
    preserveOriginalType?: boolean;
  }): Promise<FileInfo> {
    return this.managementService.updateFile(userId, fileId, updates);
  }
}

// 导出FileEntityToFileInfo转换函数，用于向后兼容
export { mapFileEntityToFileInfo }; 