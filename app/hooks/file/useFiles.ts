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
  // 添加一个新的状态来跟踪文件更新
  const [fileUpdateTrigger, setFileUpdateTrigger] = useState(0);

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
      // 修复路径构建问题 - 使用正确的API路径
      const folderPath = `/api/storage/folders/${folderId}`;
      console.log('加载文件夹路径:', folderPath);
      const response = await fetch(`${folderPath}/path`);
      
      // 检查内容类型
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.error || `加载文件夹路径失败: ${response.status}`);
        } else {
          throw new Error(`加载文件夹路径失败: ${response.status} ${response.statusText}`);
        }
      }
      
      // 确保响应是JSON格式
      if (!isJson) {
        console.error('服务器返回了非JSON格式的响应:', contentType);
        throw new Error('服务器返回了非JSON格式的响应');
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('加载文件夹路径成功:', data.path);
        setFolderPath(data.path || []);
      } else {
        console.error('加载文件夹路径失败:', data.error);
        throw new Error(data.error || '加载文件夹路径失败');
      }
    } catch (error) {
      console.error('获取文件夹路径错误:', error);
      // 不显示错误，保持当前路径
    }
  }, []);

  /**
   * 加载文件列表
   * @param skipPathLoad 是否跳过路径加载（用于手动控制面包屑）
   */
  const loadFiles = useCallback(async (
    folderId: string | null = null, 
    type: FileTypeEnum | null = selectedFileType, 
    forceRefresh: boolean = false,
    skipPathLoad: boolean = false
  ) => {
    console.log('loadFiles被调用', {folderId, type, skipPathLoad, forceRefresh});
    
    // 如果已经在加载中，不要重复请求
    if (isLoading) {
      console.log('文件列表正在加载中，忽略重复请求');
      return;
    }

    // 检查是否与上次请求参数相同，但始终在重命名后强制刷新
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
      
      // 移除延迟，提高响应速度
      
      // 优先使用传入的type，如果没有传入则使用状态中的selectedFileType
      const effectiveFileType = type !== undefined ? type : selectedFileType;
      
      // 更新当前文件夹ID，仅在非文件类型筛选模式下
      if (effectiveFileType === null) {
        // 如果文件夹ID相同且不是初始加载，则不要重置当前文件夹ID
        const isSameFolderId = folderId === currentFolderId;
        if (!isSameFolderId || currentFolderId === null) {
          setCurrentFolderId(folderId);
        }
        
        // 不再依赖API获取路径，使用skipPathLoad控制是否重置路径
        // 当skipPathLoad为true时，保持当前路径不变（由handleFileClick维护）
      }

      // 使用fileApi获取文件列表
      try {
        // 为每次请求添加时间戳，确保不使用缓存数据
        const timestamp = Date.now();
        const result = await fileApi.getFiles({
          folderId,
          type: effectiveFileType || undefined,
          // 在文件类型过滤模式下启用递归查询
          ...(effectiveFileType ? { recursive: true } : {}),
          // 总是添加时间戳参数以防止缓存，而不仅在强制刷新时
          _t: timestamp
        });
        
        // 在前端执行额外过滤（确保筛选结果的准确性）
        let filteredFiles = result.items;
        if (effectiveFileType) {
          // 使用统一的工具函数过滤文件
          filteredFiles = filterFilesByType(filteredFiles as any, effectiveFileType) as FileInfo[];
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
        
        // 重置文件更新触发器，强制UI刷新
        setFileUpdateTrigger(prev => prev + 1);
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
  }, [isLoading, selectedFileType, sortOrder, handleSort, currentFolderId]);

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
    console.log('useFiles hook: changeSort被调用', { field, direction });
    
    // 更新排序状态
    setSortOrder({ field, direction });
    console.log('排序状态已更新');
    
    // 重新应用排序
    console.log('应用排序到文件列表, 文件数量:', files.length);
    const sortedFiles = handleSort([...files]); // 创建副本以确保状态更新
    console.log('排序后的文件列表, 文件数量:', sortedFiles.length);
    
    // 强制更新文件列表
    setFiles(sortedFiles);
    setLastSortApplied(`${field}-${direction}`);
    console.log('文件列表已更新，排序标记:', `${field}-${direction}`);
  }, [files, handleSort]);

  /**
   * 选择文件类型进行过滤
   */
  const filterByFileType = useCallback((type: FileTypeEnum | null, onClearSpecialViews?: () => void) => {
    // 如果提供了视图清理函数，先调用它清除特殊视图状态
    if (onClearSpecialViews) {
      onClearSpecialViews();
    }
    
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
    // 刷新当前文件夹时始终跳过路径加载，保留现有面包屑
    console.log('刷新当前文件夹，保留面包屑路径:', folderPath);
    loadFiles(currentFolderId, selectedFileType, true, true);
  }, [currentFolderId, selectedFileType, loadFiles, folderPath]);

  /**
   * 处理点击文件/文件夹
   */
  const handleFileClick = useCallback((file: FileWithSize) => {
    if (file.isFolder) {
      console.log('点击文件夹，更新面包屑:', file.name);

      // 设置当前文件夹ID
      setCurrentFolderId(file.id);
      
      // 更新面包屑路径（纯前端实现，不依赖API）
      setFolderPath(prevPath => {
        // 创建新的文件夹路径项
        const newPathItem: FolderPathItem = {
          id: file.id,
          name: file.name
        };
        
        // 将新路径项添加到当前路径末尾
        const newPath = [...prevPath, newPathItem];
        console.log('更新后的面包屑路径:', newPath);
        return newPath;
      });
      
      // 加载文件夹内容，但不触发路径加载
      // 移除强制刷新，提高性能
      loadFiles(file.id, null, false, true);
    }
    // 如果是文件，不做特殊处理，由调用者处理
  }, [setCurrentFolderId, setFolderPath, loadFiles]);

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
      
      // 裁剪路径 - 纯前端实现，不依赖API
      setFolderPath(prev => prev.slice(0, prev.length - 1));
      
      // 加载上一级文件夹内容，不重新获取路径
      loadFiles(parentId, null, false, true);
    }
  }, [folderPath, setCurrentFolderId, setFolderPath, loadFiles]);

  /**
   * 处理文件更新
   * 用于在文件被修改（重命名等）后更新列表
   */
  const handleFileUpdate = useCallback((updatedFile: FileInfo) => {
    console.log('处理文件更新:', updatedFile);
    
    // 检查是否存在强制包含标记
    const hasForceInclude = (updatedFile as any)._forceInclude === true;
    
    // 更新文件列表中的对应文件
    setFiles(prevFiles => {
      // 首先检查文件是否存在于当前列表中
      const fileExists = prevFiles.some(file => file.id === updatedFile.id);
      
      // 查找并更新文件
      let updatedFiles = prevFiles.map(file => {
        if (file.id === updatedFile.id) {
          // 合并更新，保留原有的size属性
          return {
            ...updatedFile,
            size: file.size
          };
        }
        return file;
      });
      
      // 如果文件不在当前列表中且有强制包含标记，将其添加到列表
      if (!fileExists && hasForceInclude) {
        console.log('文件不在列表中但有强制包含标记，添加到列表:', updatedFile.name);
        updatedFiles = [
          ...updatedFiles, 
          { ...updatedFile, size: updatedFile.size || 0 } as FileWithSize
        ];
      }
      
      // 如果当前有文件类型过滤，检查文件是否应该在列表中
      if (selectedFileType && !hasForceInclude) {
        console.log('应用文件类型过滤:', selectedFileType);
        // 检查文件是否符合过滤条件
        const shouldInclude = shouldFileBeIncluded(updatedFile, selectedFileType);
        
        if (!shouldInclude) {
          console.log('文件不符合当前过滤条件，从列表中移除:', updatedFile.name);
          // 从列表中移除不符合过滤条件的文件
          updatedFiles = updatedFiles.filter(file => file.id !== updatedFile.id);
        }
      }
      
      // 重新应用排序
      console.log('文件更新后重新应用排序');
      const sortedFiles = handleSort(updatedFiles);
      
      // 增加文件更新触发器，确保即使引用相同也会触发渲染
      setFileUpdateTrigger(prev => prev + 1);
      
      return sortedFiles;
    });
  }, [selectedFileType, handleSort]);

  // 判断文件是否应该包含在特定类型的过滤中
  const shouldFileBeIncluded = (file: FileInfo, fileType: FileTypeEnum): boolean => {
    if (fileType === 'folder' && file.isFolder) {
      return true;
    }
    
    if (file.isFolder) {
      return false;  // 非文件夹类型过滤不包含文件夹
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext) return false;
    
    switch (fileType) {
      case 'document':
        return ['doc', 'docx', 'pdf', 'txt', 'md', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext);
      case 'image':
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext);
      case 'audio':
        return ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext);
      case 'video':
        return ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm'].includes(ext);
      case 'code':
        return ['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'php', 'rb'].includes(ext);
      case 'archive':
        return ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext);
      default:
        return false;
    }
  };

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
    fileUpdateTrigger,
    
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
    handleFileUpdate,
    
    // 设置函数
    setCurrentFolderId,
    setFolderPath,
    setSelectedFileType,
    setSelectedFiles,
    setSortOrder
  };
};