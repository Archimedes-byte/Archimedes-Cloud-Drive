import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { 
  FolderPathItem,
  FileInfo,
  FileTypeEnum,
  FileSortInterface,
  SortDirectionEnum
} from '@/app/types';
import { filterFiles } from '../utils/fileHelpers';

// 扩展FileInfo类型，但保持与原有接口兼容
export interface FileWithSize extends Omit<FileInfo, 'size'> {
  size: number | undefined;
}

// 只导出需要的枚举
export { SortDirectionEnum };

/**
 * 文件管理钩子
 * 负责文件列表的获取、状态管理和基本操作
 * 合并了两个useFiles实现的功能
 */
export const useFiles = () => {
  const router = useRouter();
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
   */
  const handleSort = useCallback((fileList: FileWithSize[]) => {
    if (!Array.isArray(fileList)) {
      console.warn('文件列表不是数组:', fileList);
      return [];
    }

    console.log('应用排序:', sortOrder);
    
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

      return sortOrder.direction === SortDirectionEnum.ASC ? comparison : -comparison;
    });
  }, [sortOrder]);

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

      console.log('加载文件列表，参数:', { 
        folderId, 
        之前文件夹ID: currentFolderId,
        文件类型: effectiveFileType
      });

      // 判断是否为按类型过滤模式
      const isTypeFilterMode = !!effectiveFileType;
      
      const queryParams = new URLSearchParams();
      if (folderId) {
        queryParams.append('folderId', folderId);
      }
      if (effectiveFileType) {
        queryParams.append('type', effectiveFileType);
        // 在文件类型过滤模式下启用递归查询
        queryParams.append('recursive', 'true');
      }

      const apiUrl = `/api/files?${queryParams.toString()}`;
      console.log(`请求API: ${apiUrl}, 是否为类型过滤模式: ${isTypeFilterMode}`);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '加载文件列表失败');
      }

      const data = await response.json();
      
      if (data.success) {
        // 获取API返回的文件列表
        const files = data.data || [];
        
        // 调试文件类型信息
        if (effectiveFileType === 'document') {
          console.log('文档类型文件信息:', files.map((f: any) => ({
            id: f.id,
            name: f.name,
            type: f.type,
            extension: f.name.split('.').pop()
          })));
        }
        
        // 在前端执行额外过滤（确保筛选结果的准确性）
        let filteredFiles = files;
        if (effectiveFileType) {
          // 使用辅助函数过滤文件
          filteredFiles = filterFiles(files, effectiveFileType);
          console.log(`前端过滤 - 类型 "${effectiveFileType}": 过滤前 ${files.length} 项, 过滤后 ${filteredFiles.length} 项`);
        }
        
        // 统计分类结果
        const folders = filteredFiles.filter((f: any) => f.isFolder);
        const nonFolders = filteredFiles.filter((f: any) => !f.isFolder);
        console.log(`过滤结果: ${folders.length}个文件夹, ${nonFolders.length}个文件`);
        
        // 调试文件夹信息
        if (folders.length > 0) {
          console.log('文件夹:', folders.map((f: any) => ({ id: f.id, name: f.name })));
        }
        
        // 应用排序逻辑到过滤后的文件
        const sortedFiles = handleSort(filteredFiles);
        setFiles(sortedFiles);
        setLastSortApplied(`${sortOrder.field}-${sortOrder.direction}`);
        
        console.log('文件列表加载成功，共获取到', sortedFiles.length, '个文件');
      } else {
        throw new Error(data.error || '加载文件列表失败');
      }
    } catch (error) {
      console.error('加载文件列表失败:', error);
      setError(error instanceof Error ? error.message : '加载文件列表失败');
      message.error(error instanceof Error ? error.message : '加载文件列表失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, selectedFileType, sortOrder, handleSort, currentFolderId]);

  /**
   * 处理文件类型过滤
   */
  const setFileType = useCallback((type: FileTypeEnum | null) => {
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
    
    // 防止短时间内多次触发的逻辑
    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTimeRef.current;
    
    // 如果距离上次加载时间太短（小于2秒），跳过此次加载
    if (timeSinceLastLoad < 2000 && lastLoadTimeRef.current > 0) {
      console.log(`距上次加载仅 ${timeSinceLastLoad}ms，跳过此次自动加载`);
      return;
    }
    
    // 当文件夹ID或类型变化时加载文件
    console.log('文件夹或类型变化检测到', {currentFolderId, selectedFileType});
    
    // 更新最后加载时间
    lastLoadTimeRef.current = now;
    
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
  const updateFileSort = useCallback((newSortOrder: FileSortInterface) => {
    setSortOrder(newSortOrder);
  }, []);

  /**
   * 处理文件点击事件
   */
  const handleFileClick = useCallback((file: FileInfo) => {
    // 确保isFolder属性存在，未定义时默认为false
    if (file.isFolder === true) {
      navigateToFolder(file.id, file.name);
    } else {
      // 返回文件对象供下载或预览
      console.log(`文件点击: ${file.name}，返回文件对象供下载或预览`);
      return file;
    }
  }, [navigateToFolder]);

  /**
   * 处理返回点击事件
   */
  const handleBackClick = useCallback(() => {
    navigateUp();
  }, [navigateUp]);

  // 当排序条件变化时重新排序文件列表
  useEffect(() => {
    // 创建排序标识
    const sortSignature = `${sortOrder.field}-${sortOrder.direction}`;
    
    // 仅在排序条件变化且与上次应用的排序不同，且有文件数据时才重新排序
    if (!isLoading && sortSignature !== lastSortApplied) {
      console.log('排序条件变化，重新应用排序:', sortOrder);
      
      // 仅当有文件数据时执行排序
      if (files.length > 0) {
        const sortedFiles = handleSort(files);
        // 更新最后应用的排序标识，确保在设置文件前更新，避免不必要的重渲染
        setLastSortApplied(sortSignature);
        setFiles(sortedFiles);
      } else {
        // 即使没有文件，也更新排序标识，避免后续不必要的处理
        setLastSortApplied(sortSignature);
      }
    }
  }, [sortOrder, isLoading, handleSort, lastSortApplied, files]);

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