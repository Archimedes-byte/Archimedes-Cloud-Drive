import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { File, FileType, SortOrder } from '../../types/index';

// 扩展File类型，确保包含size属性
interface FileWithSize extends File {
  size?: number;
}

export const useFiles = () => {
  const [files, setFiles] = useState<FileWithSize[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{ id: string, name: string }>>([]);
  const [selectedFileType, setSelectedFileType] = useState<FileType | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    field: 'uploadTime',
    direction: 'desc'
  });
  const [lastSortApplied, setLastSortApplied] = useState<string>('');

  // 处理排序
  const handleSort = useCallback((filesList: FileWithSize[]) => {
    if (!Array.isArray(filesList)) {
      console.warn('文件列表不是数组:', filesList);
      return [];
    }

    console.log('应用排序:', sortOrder);
    return [...filesList].sort((a, b) => {
      // 文件夹始终排在前面
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }

      switch (sortOrder.field) {
        case 'name':
          return sortOrder.direction === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'size':
          return sortOrder.direction === 'asc'
            ? (a.size || 0) - (b.size || 0)
            : (b.size || 0) - (a.size || 0);
        case 'uploadTime':
          // 安全处理日期
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return sortOrder.direction === 'asc'
            ? dateA - dateB
            : dateB - dateA;
        default:
          return 0;
      }
    });
  }, [sortOrder]);

  const loadFiles = useCallback(async (folderId: string | null = null, fileType?: FileType | null) => {
    try {
      setIsLoading(true);
      setError(null);

      // 优先使用传入的fileType，如果没有传入则使用状态中的selectedFileType
      const effectiveFileType = fileType !== undefined ? fileType : selectedFileType;

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
      console.log('接收到的数据:', data);

      if (data.success) {
        // 打印文件夹结构信息以便调试
        const folders = data.data.filter((f: any) => f.isFolder);
        const files = data.data.filter((f: any) => !f.isFolder);
        console.log(`当前查询结果: ${folders.length}个文件夹, ${files.length}个文件`);
        
        if (folders.length > 0) {
          console.log('文件夹列表:', folders.map((f: any) => ({ id: f.id, name: f.name })));
        }
        
        // 应用排序逻辑
        const sortedFiles = handleSort(data.data || []);
        console.log('排序后的文件列表:', sortedFiles);
        setFiles(sortedFiles);
        setLastSortApplied(`${sortOrder.field}-${sortOrder.direction}`);
      } else {
        throw new Error(data.error || '加载文件列表失败');
      }
    } catch (error) {
      console.error('加载文件列表失败:', error);
      const errorMessage = error instanceof Error ? error.message : '加载文件列表失败，请稍后重试';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFileType, handleSort, sortOrder, currentFolderId]);

  // 处理文件点击
  const handleFileClick = useCallback((file: FileWithSize) => {
    if (file.isFolder) {
      // 如果是文件夹，进入该文件夹
      console.log(`进入文件夹: ID=${file.id}, 名称=${file.name}`);
      // 在导航到文件夹时，保持当前的文件类型过滤
      loadFiles(file.id, selectedFileType);
      setCurrentFolderId(file.id);
      // 更新面包屑
      setFolderPath(prev => [...prev, { id: file.id, name: file.name }]);
    } else {
      // 如果是普通文件，可以执行其他操作，如预览
      console.log(`文件点击: ${file.name}`);
    }
  }, [loadFiles, selectedFileType]);

  // 返回上级目录
  const handleBackClick = useCallback(() => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop(); // 移除当前文件夹
      const parentFolder = newPath[newPath.length - 1];
      setFolderPath(newPath);
      // 返回上级目录时，保持当前的文件类型过滤
      loadFiles(parentFolder?.id || null, selectedFileType);
      setCurrentFolderId(parentFolder?.id || null);
    }
  }, [folderPath, loadFiles, selectedFileType]);

  // 当排序条件变化时重新排序文件列表 - 修复无限循环问题
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
  // 关键修改：移除files依赖，只依赖sortOrder和lastSortApplied状态
  }, [sortOrder, isLoading, handleSort, lastSortApplied]);

  return {
    files,
    isLoading,
    error,
    currentFolderId,
    setCurrentFolderId,
    folderPath,
    setFolderPath,
    selectedFileType,
    setSelectedFileType,
    sortOrder,
    setSortOrder,
    loadFiles,
    handleFileClick,
    handleBackClick,
    handleSort
  };
}; 