import { useState, useCallback } from 'react';
import { message } from 'antd';
import { fileApi } from '../api/fileApi';
import { FileOperationsHook, File } from '../types/index';
import { getFileNameAndExtension } from '../utils/fileHelpers';

type RefreshCallback = () => void;

// 修改接口定义，创建适配现有实现的接口
export interface CustomFileOperationsHook {
  loading: boolean;
  handleDelete: (fileIds: string[]) => Promise<void>;
  handleMove: (fileIds: string[], targetFolderId: string) => Promise<void>;
  handleDownload: (fileIds: string[]) => Promise<void>;
  handleCreateFolder: (currentFolderId: string | null) => Promise<void>;
}

/**
 * 统一的文件操作钩子
 * 合并了useFileOperations和useFileActions的功能
 */
export const useFileOperations = (onRefresh: RefreshCallback): CustomFileOperationsHook & {
  selectedFiles: string[];
  setSelectedFiles: (files: string[]) => void;
  editingFile: string | null;
  setEditingFile: (fileId: string | null) => void;
  editingName: string;
  setEditingName: (name: string) => void;
  editingTags: string[];
  setEditingTags: (tags: string[]) => void;
  isCreatingFolder: boolean;
  setIsCreatingFolder: (creating: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  newFolderTags: string;
  setNewFolderTags: (tags: string) => void;
  handleStartEdit: (file: File) => void;
  handleConfirmEdit: (files: File[]) => Promise<void>;
  handleSelectFile: (fileId: string, checked: boolean) => void;
  handleAddTag: (tag: string) => void;
  handleRemoveTag: (tag: string) => void;
} => {
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderTags, setNewFolderTags] = useState('');

  /**
   * 删除文件
   */
  const handleDelete = useCallback(async (fileIds: string[]) => {
    if (!fileIds.length) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds }),
      });

      const data = await response.json();
      
      if (data.success) {
        message.success('文件删除成功');
        // 从选中列表中移除已删除的文件
        setSelectedFiles(prev => prev.filter(id => !fileIds.includes(id)));
        // 刷新文件列表
        onRefresh();
      } else {
        message.error(data.message || '删除文件失败');
      }
    } catch (error) {
      console.error('删除文件错误:', error);
      message.error('删除文件失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [onRefresh]);

  /**
   * 移动文件
   */
  const handleMove = useCallback(async (fileIds: string[], targetFolderId: string) => {
    if (!fileIds.length) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/files/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds, targetFolderId }),
      });

      const data = await response.json();
      
      if (data.success) {
        message.success('文件移动成功');
        // 清除选中状态
        setSelectedFiles([]);
        // 刷新文件列表
        onRefresh();
      } else {
        message.error(data.message || '移动文件失败');
      }
    } catch (error) {
      console.error('移动文件错误:', error);
      message.error('移动文件失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [onRefresh]);

  /**
   * 下载文件
   */
  const handleDownload = useCallback(async (fileIds: string[]) => {
    if (!fileIds.length) return;
    
    setLoading(true);
    try {
      if (fileIds.length === 1) {
        // 单文件下载
        const fileId = fileIds[0];
        
        // 获取文件下载URL
        const response = await fetch(`/api/files/download?fileId=${fileId}`);
        const data = await response.json();
        
        if (data.success && data.downloadUrl) {
          // 创建隐藏的a标签并触发下载
          const a = document.createElement('a');
          a.href = data.downloadUrl;
          a.download = data.fileName || 'download';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          message.success('文件下载已开始');
        } else {
          message.error(data.message || '下载文件失败');
        }
      } else {
        // 多文件下载（打包）
        const response = await fetch('/api/files/download-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileIds }),
        });
        
        const data = await response.json();
        
        if (data.success && data.downloadUrl) {
          // 创建隐藏的a标签并触发下载
          const a = document.createElement('a');
          a.href = data.downloadUrl;
          a.download = data.fileName || 'files.zip';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          message.success('文件下载已开始');
        } else {
          message.error(data.message || '批量下载文件失败');
        }
      }
    } catch (error) {
      console.error('下载文件错误:', error);
      message.error('下载文件失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 开始编辑
  const handleStartEdit = (file: File) => {
    const { name } = getFileNameAndExtension(file.name);
    setEditingFile(file.id as string);
    setEditingName(name);
    setEditingTags(file.tags || []);
  };

  // 确认编辑
  const handleConfirmEdit = async (files: File[]) => {
    if (!editingFile) return;

    try {
      const file = files.find(f => f.id === editingFile);
      if (!file) return;

      const { extension } = getFileNameAndExtension(file.name);
      const newFileName = editingName.trim() + extension;

      const response = await fetch(`/api/files/${editingFile}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFileName,
          tags: editingTags,
        }),
      });

      if (!response.ok) {
        throw new Error('修改失败');
      }

      await response.json();
      message.success('修改成功');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('修改错误:', error);
      message.error('修改失败');
    } finally {
      setEditingFile(null);
      setEditingName('');
      setEditingTags([]);
    }
  };

  // 创建文件夹
  const handleCreateFolder = async (currentFolderId: string | null) => {
    try {
      if (!newFolderName.trim()) {
        // 如果用户没有输入名称，则使用默认名称
        const now = new Date();
        const dateStr = now.getFullYear() +
          String(now.getMonth() + 1).padStart(2, '0') +
          String(now.getDate()).padStart(2, '0');
        setNewFolderName(`新建文件夹_${dateStr}`);
        return;
      }

      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolderId,
          tags: newFolderTags
        }),
      });

      if (!response.ok) {
        throw new Error('创建文件夹失败');
      }

      message.success('创建文件夹成功');
      
      // 重置状态
      setIsCreatingFolder(false);
      setNewFolderName('');
      setNewFolderTags('');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('创建文件夹错误:', error);
      message.error('创建文件夹失败');
    }
  };

  // 文件选择
  const handleSelectFile = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles(prev => [...prev, fileId]);
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    }
  };

  // 标签操作
  const handleAddTag = (tag: string) => {
    if (!tag.trim()) return;
    if (!editingTags.includes(tag.trim())) {
      setEditingTags([...editingTags, tag.trim()]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditingTags(editingTags.filter(tag => tag !== tagToRemove));
  };

  return {
    loading,
    handleDelete,
    handleMove,
    handleDownload,
    selectedFiles,
    setSelectedFiles,
    editingFile,
    setEditingFile,
    editingName,
    setEditingName,
    editingTags,
    setEditingTags,
    isCreatingFolder,
    setIsCreatingFolder,
    newFolderName,
    setNewFolderName,
    newFolderTags,
    setNewFolderTags,
    handleStartEdit,
    handleConfirmEdit,
    handleCreateFolder,
    handleSelectFile,
    handleAddTag,
    handleRemoveTag
  };
}; 