import { useState, useCallback, useRef, useEffect } from 'react';
import { FileInfo, FolderPath, FileType, SortOrder } from '@/app/shared/types/file';

/**
 * 文件管理钩子
 * 负责文件列表的获取、状态管理和基本操作
 */
export const useFiles = () => {
  // 基础状态
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<FolderPath[]>([]);
  const [selectedFileType, setSelectedFileType] = useState<FileType | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    field: 'createdAt',
    direction: 'desc'
  });

  // 使用ref记录最后一次请求的参数，防止重复请求
  const lastRequestRef = useRef<{folderId: string | null, type: FileType | null} | null>(null);
  const isInitialMount = useRef(true);
  
  // 记录首次渲染
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  /**
   * 加载文件列表
   */
  const loadFiles = useCallback(async (folderId: string | null = null, type: FileType | null = selectedFileType) => {
    console.log('loadFiles被调用', {folderId, type, isLoading});
    
    // 如果已经在加载中，不要重复请求
    if (isLoading) {
      console.log('文件列表正在加载中，忽略重复请求');
      return;
    }

    // 检查是否与上次请求参数相同
    const currentRequest = {folderId, type};
    if (lastRequestRef.current && 
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
      
      const queryParams = new URLSearchParams();
      if (folderId) {
        queryParams.append('folderId', folderId);
      }
      if (type) {
        queryParams.append('type', type);
      }

      console.log('开始请求文件列表:', currentRequest);
      const response = await fetch(`/api/files?${queryParams.toString()}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '加载文件列表失败');
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('文件列表加载成功，共获取到', data.data?.length || 0, '个文件');
        setFiles(data.data || []);
      } else {
        throw new Error(data.error || '加载文件列表失败');
      }
    } catch (error) {
      console.error('加载文件列表失败:', error);
      setError(error instanceof Error ? error.message : '加载文件列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, selectedFileType]);

  /**
   * 处理文件类型过滤
   */
  const setFileType = useCallback((type: FileType | null) => {
    // 如果类型没变，不要重新加载
    if (type === selectedFileType) {
      console.log('文件类型未变更，跳过重新加载');
      return;
    }
    
    console.log(`切换文件类型过滤: ${selectedFileType} -> ${type}`);
    setSelectedFileType(type);
    // 不直接调用loadFiles，而是让useEffect处理
  }, [selectedFileType]);

  /**
   * 导航到指定文件夹
   */
  const navigateToFolder = useCallback((folderId: string | null, folderName?: string) => {
    if (folderId === currentFolderId) return;
    
    if (folderId === null) {
      // 返回根目录
      setFolderPath([]);
    } else if (folderName) {
      // 添加到导航路径
      setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
    }
    
    console.log(`导航到文件夹: ${currentFolderId} -> ${folderId}`);
    setCurrentFolderId(folderId);
    // 不直接调用loadFiles，而是让useEffect处理
  }, [currentFolderId]);

  /**
   * 返回上级目录
   */
  const navigateUp = useCallback(() => {
    if (folderPath.length <= 1) {
      // 返回根目录
      setFolderPath([]);
      setCurrentFolderId(null);
    } else {
      // 移除当前路径，返回上一级
      const newPath = [...folderPath];
      newPath.pop();
      const parentFolder = newPath[newPath.length - 1];
      setFolderPath(newPath);
      setCurrentFolderId(parentFolder.id);
    }
    // 不直接调用loadFiles，而是让useEffect处理
  }, [folderPath]);

  // 监听文件夹ID和类型变化，自动加载文件
  useEffect(() => {
    // 跳过首次渲染
    if (isInitialMount.current) return;
    
    // 当文件夹ID或类型变化时加载文件
    console.log('文件夹或类型变化检测到', {currentFolderId, selectedFileType});
    loadFiles(currentFolderId, selectedFileType);
  }, [currentFolderId, selectedFileType, loadFiles]);

  /**
   * 选择文件（单个或多个）
   */
  const selectFiles = useCallback((fileIds: string[]) => {
    setSelectedFiles(fileIds);
  }, []);

  /**
   * 清除所有选择
   */
  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  /**
   * 更新排序顺序
   */
  const updateFileSort = useCallback((newSortOrder: SortOrder) => {
    setSortOrder(newSortOrder);
  }, []);

  /**
   * 处理文件点击事件
   */
  const handleFileClick = useCallback((file: FileInfo) => {
    if (file.isFolder) {
      navigateToFolder(file.id, file.name);
    }
  }, [navigateToFolder]);

  /**
   * 处理返回点击事件
   */
  const handleBackClick = useCallback(() => {
    navigateUp();
  }, [navigateUp]);

  /**
   * 处理文件排序
   */
  const handleSort = useCallback((fileList: FileInfo[]) => {
    return [...fileList].sort((a, b) => {
      // 文件夹始终排在前面
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }

      // 根据排序规则排序
      let comparison = 0;
      switch (sortOrder.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'createdAt':
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = timeA - timeB;
          break;
        default:
          break;
      }

      return sortOrder.direction === 'asc' ? comparison : -comparison;
    });
  }, [sortOrder]);

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
    
    // 状态更新方法
    setFiles,
    setCurrentFolderId,
    setFolderPath,
    setSelectedFileType, // 直接使用状态setter，不调用loadFiles
    setSortOrder,
    
    // 操作方法
    loadFiles,
    selectFiles,
    clearSelection,
    setFileType,
    navigateToFolder,
    navigateUp,
    updateFileSort,
    handleFileClick,
    handleBackClick,
    handleSort
  };
}; 