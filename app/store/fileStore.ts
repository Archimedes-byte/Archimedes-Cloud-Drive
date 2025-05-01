import { create } from 'zustand';
import { FolderPathItem, FileInfo, FileTypeEnum, FileSortInterface, SortDirectionEnum } from '@/app/types';
import { fileApi } from '@/app/lib/api/file-api';
import { handleError, safeAsync } from '@/app/utils/error';
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

    const result = await safeAsync(async () => {
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
      
      return true;
    }, {
      showError: false,
      errorMessage: '加载文件列表失败',
      fallbackValue: false,
      logLevel: 'error'
    });
    
    if (!result) {
      set({
        isLoading: false,
        error: '加载文件列表失败'
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
    
    const result = await safeAsync(async () => {
      const recentFiles = await fileApi.getRecentFiles(limit);
      set({
        files: recentFiles,
        isLoading: false,
        currentFolderId: null,
        folderPath: [],
        selectedFileType: null
      });
      return true;
    }, {
      showError: false,
      errorMessage: '加载最近文件失败',
      fallbackValue: false
    });
    
    if (!result) {
      set({
        isLoading: false,
        error: '加载最近文件失败'
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
    
    const result = await safeAsync(async () => {
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
      return true;
    }, {
      showError: false,
      errorMessage: '搜索文件失败',
      fallbackValue: false
    });
    
    if (!result) {
      set({
        isLoading: false,
        error: '搜索文件失败'
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
    
    const result = await safeAsync(async () => {
      await fileApi.deleteFiles(fileIds);
      
      // 删除后，从当前文件列表中移除这些文件
      set(state => ({
        files: state.files.filter(file => !fileIds.includes(file.id)),
        selectedFileIds: state.selectedFileIds.filter(id => !fileIds.includes(id))
      }));
      
      // 执行成功回调
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    }, {
      errorMessage: '删除文件失败',
      fallbackValue: false as boolean
    });
    
    return result === null ? false : result;
  },
  
  /**
   * 移动文件
   */
  moveFiles: async (fileIds: string[], targetFolderId: string) => {
    if (!fileIds.length) {
      return false;
    }
    
    const result = await safeAsync(async () => {
      await fileApi.moveFiles(fileIds, targetFolderId);
      
      // 移动后，从当前文件列表中移除这些文件
      set(state => ({
        files: state.files.filter(file => !fileIds.includes(file.id)),
        selectedFileIds: state.selectedFileIds.filter(id => !fileIds.includes(id))
      }));
      
      return true;
    }, {
      errorMessage: '移动文件失败',
      fallbackValue: false as boolean
    });
    
    return result === null ? false : result;
  },
  
  /**
   * 重命名文件
   */
  renameFile: async (fileId: string, newName: string) => {
    return await safeAsync(async () => {
      const updatedFile = await fileApi.updateFile(fileId, newName);
      
      // 更新状态中的文件名
      set(state => ({
        files: state.files.map(file => 
          file.id === fileId ? { ...file, name: newName } : file
        )
      }));
      
      return updatedFile;
    }, {
      errorMessage: '重命名文件失败',
      fallbackValue: null
    });
  },
  
  /**
   * 创建文件夹
   */
  createFolder: async (name: string, parentId: string | null, tags?: string[]) => {
    return await safeAsync(async () => {
      const newFolder = await fileApi.createFolder(name, parentId, tags);
      
      // 重新加载当前文件夹内容
      if (get().currentFolderId === parentId) {
        get().loadFiles(parentId, null, true);
      }
      
      return newFolder.id;
    }, {
      errorMessage: '创建文件夹失败',
      fallbackValue: null
    });
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