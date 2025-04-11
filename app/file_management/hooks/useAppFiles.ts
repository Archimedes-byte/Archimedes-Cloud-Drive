import { useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';
import { FileInfo, FileType, FolderPath, SortOrder } from '@/app/types';
import { message } from 'antd';
import { filterFiles } from '../utils/fileHelpers';

/**
 * 文件管理Hook - 基于全局状态管理
 * 负责文件列表的获取、状态管理和基本操作
 */
export const useAppFiles = () => {
  const { state, dispatch } = useAppState();
  const { 
    items: files,
    isLoading,
    error,
    currentFolderId,
    folderPath,
    selectedFileType,
    selectedFiles,
    sortOrder
  } = state.files;

  /**
   * 加载文件列表
   */
  const loadFiles = useCallback(async (
    folderId: string | null = currentFolderId, 
    type: FileType | null = selectedFileType, 
    forceRefresh: boolean = false
  ) => {
    console.log('loadFiles被调用', {folderId, type, isLoading, forceRefresh});
    
    // 如果已经在加载中，不要重复请求
    if (isLoading && !forceRefresh) {
      console.log('文件列表正在加载中，忽略重复请求');
      return;
    }

    try {
      dispatch({ type: 'SET_FILES_LOADING', payload: true });
      dispatch({ type: 'SET_FILES_ERROR', payload: null });
      
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
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || '加载文件列表失败');
      }
      
      if (data.success) {
        // 获取API返回的文件列表
        const files = data.data || [];
        
        // 在前端执行额外过滤（确保筛选结果的准确性）
        let filteredFiles = files;
        if (effectiveFileType) {
          // 使用辅助函数过滤文件
          filteredFiles = filterFiles(files, effectiveFileType);
          console.log(`前端过滤 - 类型 "${effectiveFileType}": 过滤前 ${files.length} 项, 过滤后 ${filteredFiles.length} 项`);
        }
        
        // 应用排序逻辑到过滤后的文件
        const sortedFiles = sortFiles(filteredFiles, sortOrder);
        dispatch({ type: 'SET_FILES', payload: sortedFiles });
        
        console.log('文件列表加载成功，共获取到', sortedFiles.length, '个文件');
        return sortedFiles;
      } else {
        throw new Error(data.error || data.message || '加载文件列表失败');
      }
    } catch (error) {
      console.error('加载文件列表失败:', error);
      const errorMessage = error instanceof Error ? error.message : '加载文件列表失败';
      dispatch({ type: 'SET_FILES_ERROR', payload: errorMessage });
      message.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_FILES_LOADING', payload: false });
    }
  }, [currentFolderId, dispatch, isLoading, selectedFileType, sortOrder]);

  /**
   * 排序文件列表
   */
  const sortFiles = useCallback((fileList: FileInfo[], sortOrder: SortOrder) => {
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

      return sortOrder.direction === 'asc' ? comparison : -comparison;
    });
  }, []);

  /**
   * 设置文件类型过滤器
   */
  const setFileType = useCallback((type: FileType | null) => {
    // 如果类型没变，不要重新加载
    if (type === selectedFileType) {
      console.log('文件类型未变更，跳过重新加载');
      return;
    }
    
    console.log(`切换文件类型过滤: ${selectedFileType} -> ${type}`);
    dispatch({ type: 'SET_SELECTED_FILE_TYPE', payload: type });
    
    // 触发加载文件
    loadFiles(currentFolderId, type, true);
  }, [currentFolderId, dispatch, loadFiles, selectedFileType]);

  /**
   * 设置排序顺序
   */
  const setSortOrder = useCallback((newSortOrder: SortOrder) => {
    dispatch({ type: 'SET_SORT_ORDER', payload: newSortOrder });
    
    // 对当前文件应用新的排序
    const sortedFiles = sortFiles(files, newSortOrder);
    dispatch({ type: 'SET_FILES', payload: sortedFiles });
  }, [dispatch, files, sortFiles]);

  /**
   * 设置当前文件夹
   */
  const setCurrentFolderId = useCallback((folderId: string | null) => {
    dispatch({ type: 'SET_CURRENT_FOLDER', payload: folderId });
  }, [dispatch]);

  /**
   * 设置文件夹路径
   */
  const setFolderPath = useCallback((path: FolderPath[]) => {
    dispatch({ type: 'SET_FOLDER_PATH', payload: path });
  }, [dispatch]);

  /**
   * 设置选中的文件
   */
  const setSelectedFiles = useCallback((fileIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_FILES', payload: fileIds });
  }, [dispatch]);

  /**
   * 处理文件点击，导航到文件夹或预览文件
   */
  const handleFileClick = useCallback((file: FileInfo) => {
    if (file.isFolder) {
      // 添加到导航路径
      setFolderPath([...folderPath, { id: file.id, name: file.name }]);
      setCurrentFolderId(file.id);
      
      // 加载此文件夹的内容
      loadFiles(file.id, selectedFileType, true);
    } else {
      // 触发文件预览
      dispatch({ type: 'SET_PREVIEW_FILE', payload: file });
    }
  }, [dispatch, folderPath, loadFiles, selectedFileType, setCurrentFolderId, setFolderPath]);

  /**
   * 返回上一级文件夹
   */
  const handleBackClick = useCallback(() => {
    if (folderPath.length <= 1) {
      // 返回根目录
      setFolderPath([]);
      setCurrentFolderId(null);
      loadFiles(null, selectedFileType, true);
    } else {
      // 移除当前路径，返回上一级
      const newPath = [...folderPath];
      newPath.pop();
      const parentFolder = newPath[newPath.length - 1];
      setFolderPath(newPath);
      setCurrentFolderId(parentFolder?.id || null);
      loadFiles(parentFolder?.id || null, selectedFileType, true);
    }
  }, [folderPath, loadFiles, selectedFileType, setCurrentFolderId, setFolderPath]);

  return {
    files,
    isLoading,
    error,
    currentFolderId,
    folderPath,
    selectedFileType,
    selectedFiles,
    sortOrder,
    loadFiles,
    setFileType,
    setSortOrder,
    setCurrentFolderId,
    setFolderPath,
    setSelectedFiles,
    handleFileClick,
    handleBackClick,
  };
}; 