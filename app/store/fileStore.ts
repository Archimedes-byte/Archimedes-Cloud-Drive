import { create } from 'zustand';
import { FolderPathItem, FileInfo, FileTypeEnum, FileSortInterface, SortDirectionEnum } from '@/app/types';
import { fileApi } from '@/app/lib/api/file-api';
import { handleApiError } from '@/app/lib/file/fileUtils';
import { sortFiles } from '@/app/utils/file/sort';
import { filterFilesByType } from '@/app/utils/file/type';

/**
 * 文件状态接口
 */
interface FileState {
  // 文件列表状态
  files: FileInfo[];
  isLoading: boolean;
  error: string | null;
  currentFolderId: string | null;
  folderPath: FolderPathItem[];
  selectedFileType: FileTypeEnum | null;
  selectedFileIds: string[];
  sortOrder: FileSortInterface;
  
  // 获取文件信息
  loadFiles: (folderId?: string | null, type?: FileTypeEnum | null, forceRefresh?: boolean) => Promise<void>;
  loadRecentFiles: (limit?: number) => Promise<void>;
  searchFiles: (query: string, type?: FileTypeEnum) => Promise<void>;
  loadFolderPath: (folderId: string | null) => Promise<void>;
  
  // 文件选择操作
  selectFile: (fileId: string, selected: boolean) => void;
  selectFiles: (fileIds: string[]) => void;
  clearSelection: () => void;
  
  // 文件排序
  setSortOrder: (sortOrder: FileSortInterface) => void;
  
  // 文件操作
  deleteFiles: (fileIds: string[], onSuccess?: () => void) => Promise<boolean>;
  moveFiles: (fileIds: string[], targetFolderId: string) => Promise<boolean>;
  renameFile: (fileId: string, newName: string) => Promise<FileInfo | null>;
  createFolder: (name: string, parentId: string | null, tags?: string[]) => Promise<string | null>;
  
  // 工具方法
  resetState: () => void;
}

/**
 * 文件状态存储
 * 使用Zustand管理全局文件状态
 */
const useFileStore = create<FileState>((set, get) => ({
  // 初始状态
  files: [],
  isLoading: false,
  error: null,
  currentFolderId: null,
  folderPath: [],
  selectedFileType: null,
  selectedFileIds: [],
  sortOrder: {
    field: 'createdAt',
    direction: SortDirectionEnum.DESC
  },
  
  /**
   * 加载文件列表
   */
  loadFiles: async (
    folderId: string | null = null, 
    type: FileTypeEnum | null = null, 
    forceRefresh: boolean = false
  ) => {
    const state = get();
    
    // 如果正在加载且未强制刷新，则直接返回
    if (state.isLoading && !forceRefresh) {
      return;
    }
    
    // 更新状态
    set({
      isLoading: true,
      error: null,
      ...(type === null ? { currentFolderId: folderId } : {})
    });
    
    try {
      // 使用fileApi获取文件列表
      const timestamp = Date.now();
      const result = await fileApi.getFiles({
        folderId,
        type: type || undefined,
        // 在文件类型过滤模式下启用递归查询
        ...(type ? { recursive: true } : {}),
        _t: timestamp
      });
      
      // 在前端执行额外过滤
      let filteredFiles = result.items;
      
      // 确保每个文件都有isFolder属性，默认为false
      const filesWithIsFolder = filteredFiles.map(file => ({
        ...file,
        isFolder: file.isFolder === undefined ? false : file.isFolder
      }));
      
      // 使用工具函数过滤文件类型（如果指定了类型）
      let processedFiles = filesWithIsFolder;
      if (type) {
        processedFiles = filterFilesByType(filesWithIsFolder, type);
      }
      
      // 排序文件
      const sortedFiles = sortFiles(processedFiles, state.sortOrder);
      
      // 更新状态
      set({
        files: sortedFiles,
        isLoading: false,
        selectedFileType: type
      });
      
      // 如果是文件夹，还需要加载路径
      if (type === null && folderId) {
        get().loadFolderPath(folderId);
      }
    } catch (error) {
      const errorMessage = handleApiError(error, '加载文件列表失败', false);
      set({
        isLoading: false,
        error: errorMessage
      });
    }
  },
  
  /**
   * 加载最近访问的文件
   */
  loadRecentFiles: async (limit: number = 10) => {
    set({
      isLoading: true,
      error: null
    });
    
    try {
      const recentFiles = await fileApi.getRecentFiles(limit);
      set({
        files: recentFiles,
        isLoading: false,
        currentFolderId: null,
        folderPath: [],
        selectedFileType: null
      });
    } catch (error) {
      const errorMessage = handleApiError(error, '加载最近文件失败', false);
      set({
        isLoading: false,
        error: errorMessage
      });
    }
  },
  
  /**
   * 搜索文件
   */
  searchFiles: async (query: string, type?: FileTypeEnum) => {
    if (!query.trim()) {
      return;
    }
    
    set({
      isLoading: true,
      error: null
    });
    
    try {
      const searchResults = await fileApi.searchFiles({
        query,
        type: type || undefined,
        includeFolder: true
      });
      
      set({
        files: searchResults,
        isLoading: false,
        currentFolderId: null,
        folderPath: [],
        selectedFileType: type || null
      });
    } catch (error) {
      const errorMessage = handleApiError(error, '搜索文件失败', false);
      set({
        isLoading: false,
        error: errorMessage
      });
    }
  },
  
  /**
   * 加载文件夹路径
   */
  loadFolderPath: async (folderId: string | null) => {
    if (!folderId) {
      set({ folderPath: [] });
      return;
    }
    
    try {
      const response = await fetch(`/api/storage/folders/${folderId}/path`);
      
      if (!response.ok) {
        throw new Error(`加载文件夹路径失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        set({ folderPath: data.path || [] });
      } else {
        throw new Error(data.error || '加载文件夹路径失败');
      }
    } catch (error) {
      console.error('获取文件夹路径错误:', error);
      // 不更新状态，保留当前路径
    }
  },
  
  /**
   * 选择单个文件
   */
  selectFile: (fileId: string, selected: boolean) => {
    set(state => {
      if (selected) {
        if (state.selectedFileIds.includes(fileId)) {
          return state;
        }
        return {
          selectedFileIds: [...state.selectedFileIds, fileId]
        };
      } else {
        return {
          selectedFileIds: state.selectedFileIds.filter(id => id !== fileId)
        };
      }
    });
  },
  
  /**
   * 选择多个文件
   */
  selectFiles: (fileIds: string[]) => {
    set({ selectedFileIds: fileIds });
  },
  
  /**
   * 清除选择
   */
  clearSelection: () => {
    set({ selectedFileIds: [] });
  },
  
  /**
   * 设置排序顺序
   */
  setSortOrder: (sortOrder: FileSortInterface) => {
    set(state => {
      // 使用新的排序重新排序文件
      const sortedFiles = sortFiles(state.files, sortOrder);
      return {
        sortOrder,
        files: sortedFiles
      };
    });
  },
  
  /**
   * 删除文件
   */
  deleteFiles: async (fileIds: string[], onSuccess?: () => void) => {
    if (!fileIds.length) {
      return false;
    }
    
    try {
      await fileApi.deleteFiles(fileIds);
      
      // 从文件列表中移除已删除的文件
      set(state => ({
        files: state.files.filter(file => !fileIds.includes(file.id)),
        selectedFileIds: state.selectedFileIds.filter(id => !fileIds.includes(id))
      }));
      
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    } catch (error) {
      handleApiError(error, '删除文件失败');
      return false;
    }
  },
  
  /**
   * 移动文件
   */
  moveFiles: async (fileIds: string[], targetFolderId: string) => {
    if (!fileIds.length) {
      return false;
    }
    
    try {
      await fileApi.moveFiles(fileIds, targetFolderId);
      
      // 如果当前文件夹是目标文件夹，重新加载文件
      if (get().currentFolderId === targetFolderId) {
        await get().loadFiles(targetFolderId, null, true);
      } else {
        // 否则从文件列表中移除已移动的文件
        set(state => ({
          files: state.files.filter(file => !fileIds.includes(file.id)),
          selectedFileIds: state.selectedFileIds.filter(id => !fileIds.includes(id))
        }));
      }
      
      return true;
    } catch (error) {
      handleApiError(error, '移动文件失败');
      return false;
    }
  },
  
  /**
   * 重命名文件
   */
  renameFile: async (fileId: string, newName: string) => {
    try {
      // 调用API重命名
      const updatedFile = await fileApi.updateFile(fileId, newName);
      
      // 更新状态中的文件
      set(state => ({
        files: state.files.map(file => 
          file.id === fileId ? { ...file, name: updatedFile.name } : file
        )
      }));
      
      return updatedFile;
    } catch (error) {
      handleApiError(error, '重命名文件失败');
      return null;
    }
  },
  
  /**
   * 创建文件夹
   */
  createFolder: async (name: string, parentId: string | null, tags: string[] = []) => {
    try {
      const newFolder = await fileApi.createFolder(name, parentId, tags);
      
      // 如果创建的文件夹在当前打开的文件夹中，更新文件列表
      if (get().currentFolderId === parentId) {
        set(state => ({
          files: [...state.files, newFolder]
        }));
      }
      
      return newFolder.id;
    } catch (error) {
      handleApiError(error, '创建文件夹失败');
      return null;
    }
  },
  
  /**
   * 重置状态
   */
  resetState: () => {
    set({
      files: [],
      isLoading: false,
      error: null,
      currentFolderId: null,
      folderPath: [],
      selectedFileType: null,
      selectedFileIds: [],
      sortOrder: {
        field: 'createdAt',
        direction: SortDirectionEnum.DESC
      }
    });
  }
}));

export default useFileStore; 