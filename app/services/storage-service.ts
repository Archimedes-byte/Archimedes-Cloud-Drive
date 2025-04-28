/**
 * 存储服务兼容层 (已废弃)
 * 提供与原始StorageService兼容的API，内部使用新的拆分服务实现
 * 
 * 这个文件用于平滑过渡到新的服务架构，避免对现有代码的破坏性改动
 * 
 * @deprecated 此兼容层已被废弃，请直接使用专用服务:
 * - FileUploadService: 文件上传和创建文件夹
 * - FileManagementService: 文件管理（获取、搜索、移动、删除等）
 * - FileStatsService: 统计和最近文件功能
 * - FavoriteService: 收藏夹相关功能
 * 
 * 例如，替换:
 * const storageService = new StorageService();
 * storageService.getFiles(...);
 * 
 * 为:
 * const managementService = new FileManagementService();
 * managementService.getFiles(...);
 */
import { 
  FileUploadService, 
  FileManagementService, 
  FileStatsService,
  mapFileEntityToFileInfo
} from './storage';
import { FileInfo } from '@/app/types';
import { FavoriteService, FavoriteFolderInfo } from './storage/favorite-service';

/**
 * 存储服务类
 * 提供文件和文件夹操作的业务逻辑
 * 
 * @deprecated 此类已被拆分为多个专注的服务类，请直接使用新的服务类:
 * - FileUploadService
 * - FileManagementService
 * - FileStatsService
 * - FavoriteService
 */
export class StorageService {
  private uploadService: FileUploadService;
  private managementService: FileManagementService;
  private statsService: FileStatsService;
  private favoriteService: FavoriteService;

  constructor() {
    console.warn('StorageService已被废弃，请直接使用专用服务。详情请参见文档。');
    this.uploadService = new FileUploadService();
    this.managementService = new FileManagementService();
    this.statsService = new FileStatsService();
    this.favoriteService = new FavoriteService();
  }

  /**
   * 创建文件夹
   * @deprecated 请使用 FileUploadService.createFolder
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
   * @deprecated 请使用 FileUploadService.uploadFile
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
   * @deprecated 请使用 FileManagementService.getFiles
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
   * @deprecated 请使用 FileManagementService.searchFiles
   */
  async searchFiles(
    userId: string,
    query: string,
    type?: string | null,
    tags?: string[],
    includeFolder: boolean = true
  ): Promise<FileInfo[]> {
    return this.managementService.searchFiles(userId, query, type, tags, includeFolder);
  }

  /**
   * 获取单个文件信息
   * @deprecated 请使用 FileManagementService.getFile
   */
  async getFile(userId: string, fileId: string): Promise<FileInfo> {
    return this.managementService.getFile(userId, fileId);
  }

  /**
   * 删除文件
   * @deprecated 请使用 FileManagementService.deleteFiles
   */
  async deleteFiles(userId: string, fileIds: string[]): Promise<number> {
    return this.managementService.deleteFiles(userId, fileIds);
  }

  /**
   * 移动文件
   * @deprecated 请使用 FileManagementService.moveFiles
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
   * @deprecated 请使用 FileManagementService.renameFile
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
   * @deprecated 请使用 FileStatsService.getStorageStats
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
   * @deprecated 请使用 FileStatsService.getRecentFiles
   */
  async getRecentFiles(userId: string, limit = 10): Promise<FileInfo[]> {
    return this.statsService.getRecentFiles(userId, limit);
  }

  /**
   * 获取收藏夹列表
   * @deprecated 请使用 FavoriteService.getFavoriteFolders
   */
  async getFavoriteFolders(userId: string): Promise<FavoriteFolderInfo[]> {
    return this.favoriteService.getFavoriteFolders(userId);
  }

  /**
   * 创建收藏夹
   * @deprecated 请使用 FavoriteService.createFavoriteFolder
   */
  async createFavoriteFolder(
    userId: string, 
    name: string, 
    description?: string, 
    isDefault = false
  ): Promise<FavoriteFolderInfo> {
    return this.favoriteService.createFavoriteFolder(userId, name, description, isDefault);
  }

  /**
   * 更新收藏夹信息
   * @deprecated 请使用 FavoriteService.updateFavoriteFolder
   */
  async updateFavoriteFolder(
    userId: string,
    folderId: string,
    data: {
      name?: string;
      description?: string;
      isDefault?: boolean;
    }
  ): Promise<FavoriteFolderInfo> {
    return this.favoriteService.updateFavoriteFolder(userId, folderId, data);
  }

  /**
   * 删除收藏夹
   * @deprecated 请使用 FavoriteService.deleteFavoriteFolder
   */
  async deleteFavoriteFolder(userId: string, folderId: string): Promise<boolean> {
    return this.favoriteService.deleteFavoriteFolder(userId, folderId);
  }

  /**
   * 将文件添加到指定收藏夹
   * @deprecated 请使用 FavoriteService.addToFolder
   */
  async addToFavoriteFolder(
    userId: string,
    fileId: string,
    folderId?: string
  ): Promise<boolean> {
    return this.favoriteService.addToFolder(userId, fileId, folderId);
  }

  /**
   * 批量添加文件到收藏夹
   * @deprecated 请使用 FavoriteService.addBatchToFolder
   */
  async addBatchToFavoriteFolder(
    userId: string,
    fileIds: string[],
    folderId?: string
  ): Promise<number> {
    return this.favoriteService.addBatchToFolder(userId, fileIds, folderId);
  }

  /**
   * 从收藏夹中移除文件
   * @deprecated 请使用 FavoriteService.removeFromFolder
   */
  async removeFromFavoriteFolder(
    userId: string,
    fileId: string,
    folderId?: string
  ): Promise<boolean> {
    return this.favoriteService.removeFromFolder(userId, fileId, folderId);
  }

  /**
   * 批量从收藏夹中移除文件
   * @deprecated 请使用 FavoriteService.removeBatchFromFolder
   */
  async removeBatchFromFavoriteFolder(
    userId: string,
    fileIds: string[],
    folderId?: string
  ): Promise<number> {
    return this.favoriteService.removeBatchFromFolder(userId, fileIds, folderId);
  }

  /**
   * 获取收藏夹中的文件列表
   * @deprecated 请使用 FavoriteService.getFolderFiles
   */
  async getFavoriteFilesInFolder(
    userId: string,
    folderId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: FileInfo[]; total: number; page: number; pageSize: number }> {
    return this.favoriteService.getFolderFiles(userId, folderId, page, pageSize);
  }

  /**
   * 添加到收藏夹（兼容原有实现）
   * @deprecated 请使用 FavoriteService.addBatchToFolder
   */
  async addToFavorites(userId: string, fileIds: string[]): Promise<number> {
    // 获取默认收藏夹并将文件添加到默认收藏夹
    const defaultFolder = await this.favoriteService.getOrCreateDefaultFolder(userId);
    return this.favoriteService.addBatchToFolder(userId, fileIds, defaultFolder.id);
  }

  /**
   * 从收藏夹中移除（兼容原有实现）
   * @deprecated 请使用 FavoriteService.removeBatchFromFolder
   */
  async removeFromFavorites(userId: string, fileIds: string[]): Promise<number> {
    // 从所有收藏夹中移除文件
    return this.favoriteService.removeBatchFromFolder(userId, fileIds);
  }

  /**
   * 获取收藏列表
   * @deprecated 请使用 FavoriteService.getAllFavoriteFiles
   */
  async getFavorites(
    userId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ items: FileInfo[]; total: number; page: number; pageSize: number }> {
    return this.favoriteService.getAllFavoriteFiles(userId, page, pageSize);
  }

  /**
   * 修复多个默认收藏夹问题
   * @deprecated 请使用 FavoriteService.fixMultipleDefaultFolders
   */
  async fixMultipleDefaultFolders(userId: string): Promise<boolean> {
    return this.favoriteService.fixMultipleDefaultFolders(userId);
  }

  /**
   * 更新文件信息
   * @deprecated 请使用 FileManagementService.updateFile
   */
  async updateFile(userId: string, fileId: string, updates: { 
    name?: string; 
    tags?: string[];
    preserveOriginalType?: boolean;
  }): Promise<FileInfo> {
    return this.managementService.updateFile(userId, fileId, updates);
  }

  /**
   * 批量修复所有用户的默认收藏夹问题
   * @deprecated 请使用 FavoriteService.batchFixAllUsersDefaultFolders
   */
  async batchFixAllUsersDefaultFolders(): Promise<{ total: number, fixed: number }> {
    return this.favoriteService.batchFixAllUsersDefaultFolders();
  }
}

// 导出FileEntityToFileInfo转换函数，用于向后兼容
export { mapFileEntityToFileInfo }; 