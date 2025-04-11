import { useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';
import { message } from 'antd';
import { FileInfo } from '@/app/types';

/**
 * 文件操作Hook - 基于全局状态管理
 * 负责处理文件的各种操作，如删除、重命名、下载等
 */
export const useAppFileActions = (onOperationComplete?: () => void) => {
  const { state, dispatch } = useAppState();
  const { selectedFiles } = state.files;
  const { editingFile, editingName, editingTags } = state.preview;
  
  /**
   * 设置选中的文件
   */
  const setSelectedFiles = useCallback((fileIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_FILES', payload: fileIds });
  }, [dispatch]);
  
  /**
   * 设置正在编辑的文件
   */
  const setEditingFile = useCallback((file: FileInfo | null) => {
    dispatch({ type: 'SET_EDITING_FILE', payload: file });
    if (file) {
      dispatch({ type: 'SET_EDITING_NAME', payload: file.name });
      dispatch({ type: 'SET_EDITING_TAGS', payload: file.tags || [] });
    } else {
      dispatch({ type: 'SET_EDITING_NAME', payload: '' });
      dispatch({ type: 'SET_EDITING_TAGS', payload: [] });
    }
  }, [dispatch]);
  
  /**
   * 设置正在编辑的文件名
   */
  const setEditingName = useCallback((name: string) => {
    dispatch({ type: 'SET_EDITING_NAME', payload: name });
  }, [dispatch]);
  
  /**
   * 设置正在编辑的文件标签
   */
  const setEditingTags = useCallback((tags: string[]) => {
    dispatch({ type: 'SET_EDITING_TAGS', payload: tags });
  }, [dispatch]);
  
  /**
   * 处理选择/取消选择单个文件
   */
  const handleSelectFile = useCallback((fileId: string, selected: boolean) => {
    if (selected) {
      setSelectedFiles([...selectedFiles, fileId]);
    } else {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    }
  }, [selectedFiles, setSelectedFiles]);
  
  /**
   * 添加标签
   */
  const handleAddTag = useCallback((tag: string) => {
    if (!tag.trim()) return;
    
    const normalizedTag = tag.trim().toLowerCase();
    if (!editingTags.includes(normalizedTag)) {
      setEditingTags([...editingTags, normalizedTag]);
    }
  }, [editingTags, setEditingTags]);
  
  /**
   * 移除标签
   */
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setEditingTags(editingTags.filter(tag => tag !== tagToRemove));
  }, [editingTags, setEditingTags]);
  
  /**
   * 下载文件
   */
  const handleDownload = useCallback(async (file: FileInfo) => {
    try {
      // 启动下载
      window.open(`/api/files/download/${file.id}`, '_blank');
    } catch (error) {
      console.error('下载文件失败:', error);
      message.error('下载文件失败，请稍后重试');
    }
  }, []);
  
  /**
   * 删除文件
   */
  const handleDelete = useCallback(async (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    
    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || '删除文件失败');
      }
      
      message.success(`成功删除${fileIds.length}个文件`);
      
      // 清除选中的文件
      setSelectedFiles([]);
      
      // 触发回调函数刷新文件列表
      if (onOperationComplete) {
        onOperationComplete();
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      message.error(error instanceof Error ? error.message : '删除文件失败，请稍后重试');
    }
  }, [onOperationComplete, setSelectedFiles]);
  
  /**
   * 确认编辑并保存
   */
  const handleConfirmEdit = useCallback(async () => {
    if (!editingFile) return;
    
    try {
      const response = await fetch(`/api/files/${editingFile.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingName,
          tags: editingTags,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || '更新文件失败');
      }
      
      message.success('文件信息已更新');
      
      // 清除编辑状态
      setEditingFile(null);
      
      // 触发回调函数刷新文件列表
      if (onOperationComplete) {
        onOperationComplete();
      }
    } catch (error) {
      console.error('更新文件失败:', error);
      message.error(error instanceof Error ? error.message : '更新文件失败，请稍后重试');
    }
  }, [editingFile, editingName, editingTags, onOperationComplete, setEditingFile]);
  
  /**
   * 创建新文件夹
   */
  const handleCreateFolder = useCallback(async (
    folderName: string, 
    parentId: string | null, 
    tags: string[] = []
  ) => {
    if (!folderName.trim()) {
      message.error('文件夹名称不能为空');
      return;
    }
    
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          parentId,
          tags,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || '创建文件夹失败');
      }
      
      message.success('文件夹创建成功');
      
      // 触发回调函数刷新文件列表
      if (onOperationComplete) {
        onOperationComplete();
      }
      
      // 设置创建文件夹模式为false
      dispatch({ type: 'SET_IS_CREATING_FOLDER', payload: false });
      
      return data.data;
    } catch (error) {
      console.error('创建文件夹失败:', error);
      message.error(error instanceof Error ? error.message : '创建文件夹失败，请稍后重试');
      return null;
    }
  }, [dispatch, onOperationComplete]);
  
  return {
    selectedFiles,
    editingFile,
    editingName,
    editingTags,
    setSelectedFiles,
    setEditingFile,
    setEditingName,
    setEditingTags,
    handleSelectFile,
    handleAddTag,
    handleRemoveTag,
    handleDownload,
    handleDelete,
    handleConfirmEdit,
    handleCreateFolder,
  };
}; 