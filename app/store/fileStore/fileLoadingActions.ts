import { fileApi } from '@/app/lib/api/file-api';
import { safeAsync } from '@/app/utils/error';
import { sortFiles, filterFilesByType } from '@/app/utils/file';
import { FileInfo, FileTypeEnum } from '@/app/types';
import { FileState } from './types';

/**
 * 加载文件列表
 */
export const loadFiles = (
  get: () => FileState,
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => async (
  folderId: string | null = null, 
  type: FileTypeEnum | null = null, 
  forceRefresh: boolean = false
): Promise<void> => {
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
    const filteredFiles = result.items;
    
    if (!filteredFiles) {
      set({
        files: [],
        isLoading: false,
        selectedFileType: type
      });
      return true;
    }
    
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
};

/**
 * 加载最近访问的文件
 */
export const loadRecentFiles = (
  get: () => FileState,
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => async (limit: number = 10): Promise<void> => {
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
};

/**
 * 搜索文件
 */
export const searchFiles = (
  get: () => FileState,
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => async (query: string, type?: FileTypeEnum): Promise<void> => {
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
};

/**
 * 加载文件夹路径
 */
export const loadFolderPath = (
  get: () => FileState,
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => async (folderId: string | null): Promise<void> => {
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
}; 