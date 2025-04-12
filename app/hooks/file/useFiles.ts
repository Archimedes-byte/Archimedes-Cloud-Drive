import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { message } from 'antd';
import { 
  FolderPathItem,
  FileInfo,
  FileTypeEnum,
  FileSortInterface,
  SortDirectionEnum,
  SortField
} from '@/app/types';
import { filterFilesByType, sortFiles } from '@/app/utils/file';
import { API_PATHS } from '@/app/lib/api/paths';
import { fileApi } from '@/app/lib/api/file-api';

/**
 * 扩展FileInfo类型，但保持与原有接口兼容
 */
export interface FileWithSize extends Omit<FileInfo, 'size'> {
  size: number | undefined;
}

// 只导出需要的枚举
export { SortDirectionEnum };

/**
 * 文件管理钩子
 * 负责文件列表的获取、状态管理和基本操作
 * 
 * @returns 文件相关状态和方法
 */
export const useFiles = () => {
  // 基础状态
  const [files, setFiles] = useState<FileWithSize[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FolderPathItem[]>([]);
  const [selectedFileType, setSelectedFileType] = useState<FileTypeEnum | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<FileSortInterface>({
    field: 'createdAt',
    direction: SortDirectionEnum.DESC
  });
  const [lastSortApplied, setLastSortApplied] = useState<string>('');

  // 使用ref记录最后一次请求的参数，防止重复请求
  const lastRequestRef = useRef<{folderId: string | null, type: FileTypeEnum | null} | null>(null);
  const isInitialMount = useRef(true);
  // 添加最后加载时间ref，防止短时间内重复加载
  const lastLoadTimeRef = useRef<number>(0);
  
  // 记录首次渲染
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  /**
   * 处理文件排序
   * 使用工具函数和记忆化处理，提高性能
   */
  const handleSort = useCallback((fileList: FileWithSize[]) => {
    if (!Array.isArray(fileList)) {
      console.warn('文件列表不是数组:', fileList);
      return [];
    }

    console.log('应用排序:', sortOrder);
    
    // 使用工具函数进行排序
    return sortFiles(fileList, sortOrder);
  }, [sortOrder]);

  /**
   * 加载文件夹路径
   */
  const loadFolderPath = useCallback(async (folderId: string | null) => {
    // 如果是根文件夹，直接设置路径为空数组
    if (!folderId) {
      setFolderPath([]);
      return;
    }

    try {
      const response = await fetch(`${API_PATHS.STORAGE.FOLDERS.GET(folderId)}/path`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '加载文件夹路径失败');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setFolderPath(data.path || []);
      } else {
        console.error('加载文件夹路径失败:', data.error);
      }
    } catch (error) {
      console.error('获取文件夹路径错误:', error);
      // 不显示错误，保持当前路径
    }
  }, []);

  /**
   * 加载文件列表
   */
  const loadFiles = useCallback(async (folderId: string | null = null, type: FileTypeEnum | null = selectedFileType, forceRefresh: boolean = false) => {
    console.log('loadFiles被调用', {folderId, type, isLoading, forceRefresh});
    
    // 如果已经在加载中，不要重复请求
    if (isLoading) {
      console.log('文件列表正在加载中，忽略重复请求');
      return;
    }

    // 检查是否与上次请求参数相同，除非强制刷新
    const currentRequest = {folderId, type};
    if (!forceRefresh && lastRequestRef.current && 
        lastRequestRef.current.folderId === currentRequest.folderId && 
        lastRequestRef.current.type === currentRequest.type) {
      console.log('请求参数与上次相同，忽略重复请求', currentRequest);
      return;
    }

    // 更新最后一次请求参数
    lastRequestRef.current = currentRequest;

    try {
      setIsLoading(true);
      setError(null);
      
      // 优先使用传入的type，如果没有传入则使用状态中的selectedFileType
      const effectiveFileType = type !== undefined ? type : selectedFileType;
      
      // 更新当前文件夹ID，仅在非文件类型筛选模式下
      if (effectiveFileType === null) {
        setCurrentFolderId(folderId);
        // 加载文件夹路径
        loadFolderPath(folderId);
      }

      console.log('加载文件列表，参数:', { 
        folderId, 
        之前文件夹ID: currentFolderId,
        文件类型: effectiveFileType
      });

      // 判断是否为按类型过滤模式
      const isTypeFilterMode = !!effectiveFileType;
      
      // 使用fileApi获取文件列表
      try {
        const result = await fileApi.getFiles({
          folderId,
          type: effectiveFileType || undefined,
          // 在文件类型过滤模式下启用递归查询
          ...(effectiveFileType ? { recursive: true } : {})
        });
        
        // 在前端执行额外过滤（确保筛选结果的准确性）
        let filteredFiles = result.items;
        if (effectiveFileType) {
          // 使用统一的工具函数过滤文件
          filteredFiles = filterFilesByType(filteredFiles as any, effectiveFileType);
          console.log(`前端过滤 - 类型 "${effectiveFileType}": 过滤前 ${result.items.length} 项, 过滤后 ${filteredFiles.length} 项`);
        }
        
        // 将结果映射为FileWithSize类型
        const filesWithSize: FileWithSize[] = filteredFiles.map(file => ({
          ...file,
          size: file.size || 0
        }));
        
        // 应用排序逻辑到过滤后的文件
        const sortedFiles = handleSort(filesWithSize);
        setFiles(sortedFiles);
        setLastSortApplied(`${sortOrder.field}-${sortOrder.direction}`);
        
        console.log('文件列表加载成功，共获取到', sortedFiles.length, '个文件');
      } catch (apiError) {
        throw new Error(apiError instanceof Error ? apiError.message : '加载文件列表失败');
      }
    } catch (error) {
      console.error('加载文件列表失败:', error);
      setError(error instanceof Error ? error.message : '加载文件列表失败');
      message.error(error instanceof Error ? error.message : '加载文件列表失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, selectedFileType, sortOrder, handleSort, currentFolderId, loadFolderPath]);

  /**
   * 选择或取消选择单个文件
   */
  const toggleSelectFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  }, []);

  /**
   * 全选/取消全选
   */
  const toggleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const fileIds = files.map(file => file.id);
      setSelectedFiles(fileIds);
    } else {
      setSelectedFiles([]);
    }
  }, [files]);

  /**
   * 更改排序
   */
  const changeSort = useCallback((field: SortField, direction: SortDirectionEnum) => {
    setSortOrder({ field, direction });
    
    // 重新应用排序
    const sortedFiles = handleSort(files);
    setFiles(sortedFiles);
    setLastSortApplied(`${field}-${direction}`);
  }, [files, handleSort]);

  /**
   * 选择文件类型进行过滤
   */
  const filterByFileType = useCallback((type: FileTypeEnum | null) => {
    setSelectedFileType(type);
    
    // 类型改变时重新加载文件
    loadFiles(currentFolderId, type);
  }, [currentFolderId, loadFiles]);

  /**
   * 打开文件夹
   */
  const openFolder = useCallback((folderId: string | null) => {
    loadFiles(folderId, null);
  }, [loadFiles]);

  /**
   * 刷新当前文件夹
   */
  const refreshCurrentFolder = useCallback(() => {
    loadFiles(currentFolderId, selectedFileType, true);
  }, [currentFolderId, selectedFileType, loadFiles]);

  /**
   * 处理点击文件/文件夹
   */
  const handleFileClick = useCallback((file: FileWithSize) => {
    if (file.isFolder) {
      // 设置当前文件夹ID
      setCurrentFolderId(file.id);
      // 加载文件夹内容
      loadFiles(file.id, null);
    }
    // 如果是文件，不做特殊处理，由调用者处理
  }, [setCurrentFolderId, loadFiles]);

  /**
   * 处理返回上一级
   */
  const handleBackClick = useCallback(() => {
    if (folderPath.length > 0) {
      // 获取上一级文件夹ID
      const parentFolder = folderPath[folderPath.length - 2] || null;
      const parentId = parentFolder ? parentFolder.id : null;
      
      // 设置当前文件夹ID为上一级
      setCurrentFolderId(parentId);
      // 裁剪路径
      setFolderPath(prev => prev.slice(0, prev.length - 1));
      // 加载上一级文件夹内容
      loadFiles(parentId, null);
    }
  }, [folderPath, setCurrentFolderId, setFolderPath, loadFiles]);

  // 在排序顺序变更时重新排序文件列表
  useEffect(() => {
    // 避免初次渲染时重复排序
    if (files.length > 0 && lastSortApplied !== `${sortOrder.field}-${sortOrder.direction}`) {
      const sortedFiles = handleSort(files);
      setFiles(sortedFiles);
      setLastSortApplied(`${sortOrder.field}-${sortOrder.direction}`);
    }
  }, [sortOrder, files, handleSort, lastSortApplied]);

  return {
    // 状态
    files,
    isLoading,
    error,
    currentFolderId,
    folderPath,
    selectedFileType,
    selectedFiles,
    sortOrder,
    
    // 操作方法
    loadFiles,
    toggleSelectFile,
    toggleSelectAll,
    changeSort,
    filterByFileType,
    openFolder,
    refreshCurrentFolder,
    handleFileClick,
    handleBackClick,
    
    // 设置函数
    setCurrentFolderId,
    setFolderPath,
    setSelectedFileType,
    setSelectedFiles,
    setSortOrder
  };
};