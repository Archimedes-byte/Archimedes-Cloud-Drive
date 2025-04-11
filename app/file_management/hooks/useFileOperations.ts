import { useState, useCallback } from 'react';
import { message } from 'antd';
import { ExtendedFile as File } from '@/app/types';
import { getFileNameAndExtension } from '../utils/fileHelpers';
import { LocalFileType } from '../utils/fileTypeConverter';

type RefreshCallback = () => void;

// 修改接口定义，创建适配现有实现的接口
export interface CustomFileOperationsHook {
  loading: boolean;
  handleMove: (fileIds: string[], targetFolderId: string) => Promise<void>;
  handleDownload: (fileIds: string[]) => Promise<void>;
  handleCreateFolder: (currentFolderId: string | null) => Promise<void>;
}

interface UseFileOperationsProps {
  loadFiles: (folderId: string | null, fileType?: string | null) => Promise<any>;
  currentFolderId: string | null;
  selectedFileType: string | null;
}

/**
 * 统一的文件操作钩子
 * 合并了useFileOperations和useFileActions的功能
 */
export const useFileOperations = ({ 
  loadFiles, 
  currentFolderId, 
  selectedFileType 
}: UseFileOperationsProps): CustomFileOperationsHook & {
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
  previewFile: LocalFileType | null;
  isRenameModalOpen: boolean;
  fileToRename: LocalFileType | null;
  setPreviewFile: (file: LocalFileType | null) => void;
  handleClosePreview: () => void;
  handlePreviewFile: (file: LocalFileType) => void;
  setIsRenameModalOpen: (open: boolean) => void;
  setFileToRename: (file: LocalFileType | null) => void;
  handleOpenRenameModal: (file: LocalFileType) => void;
  handleRenameFile: (newName: string, tags?: string[]) => Promise<void>;
  handleRenameButtonClick: (files: LocalFileType[], selectedFileIds: string[]) => void;
  handleFileContextMenu: (
    event: React.MouseEvent, 
    file: LocalFileType,
    setSelectedFile: (file: LocalFileType) => void,
    setSelectedFiles: (fileIds: string[]) => void
  ) => void;
} => {
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderTags, setNewFolderTags] = useState('');
  
  // 预览相关状态
  const [previewFile, setPreviewFile] = useState<LocalFileType | null>(null);
  
  // 重命名相关状态
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<LocalFileType | null>(null);

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
        loadFiles(currentFolderId, selectedFileType);
      } else {
        message.error(data.message || '移动文件失败');
      }
    } catch (error) {
      console.error('移动文件错误:', error);
      message.error('移动文件失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [loadFiles, currentFolderId, selectedFileType]);

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
  }, [loadFiles, currentFolderId, selectedFileType]);

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
      loadFiles(currentFolderId, selectedFileType);
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
      loadFiles(currentFolderId, selectedFileType);
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

  // 关闭预览
  const handleClosePreview = useCallback(() => {
    setPreviewFile(null);
  }, []);

  // 处理文件预览
  const handlePreviewFile = useCallback((file: LocalFileType) => {
    setPreviewFile(file);
  }, []);

  // 打开重命名模态窗口
  const handleOpenRenameModal = useCallback((file: LocalFileType) => {
    setFileToRename(file);
    setIsRenameModalOpen(true);
  }, []);
  
  // 处理重命名文件
  const handleRenameFile = useCallback(async (newName: string, tags?: string[]) => {
    if (!fileToRename) return;
    
    try {
      const response = await fetch('/api/files/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: fileToRename.id, 
          newName,
          tags: tags || fileToRename.tags
        }),
      });
      
      if (!response.ok) {
        throw new Error('重命名失败');
      }
      
      await response.json();
      message.success('重命名成功');
      
      // 刷新文件列表
      loadFiles(currentFolderId, selectedFileType);
    } catch (error) {
      console.error('重命名错误:', error);
      message.error('重命名失败，请重试');
    } finally {
      setFileToRename(null);
      setIsRenameModalOpen(false);
    }
  }, [fileToRename, currentFolderId, selectedFileType, loadFiles]);
  
  // 执行重命名
  const handleRenameButtonClick = useCallback((files: LocalFileType[], selectedFileIds: string[]) => {
    if (selectedFileIds.length !== 1) {
      message.warning('请选择一个文件进行重命名');
      return;
    }
    const selectedFile = files.find(file => file.id === selectedFileIds[0]);
    if (selectedFile) {
      handleOpenRenameModal(selectedFile);
    }
  }, [handleOpenRenameModal]);
  
  // 处理文件上下文菜单
  const handleFileContextMenu = useCallback((
    event: React.MouseEvent, 
    file: LocalFileType,
    setSelectedFile: (file: LocalFileType) => void,
    setSelectedFiles: (fileIds: string[]) => void
  ) => {
    event.preventDefault();
    setSelectedFile(file);
    setSelectedFiles([file.id]);
  }, []);

  return {
    loading,
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
    handleRemoveTag,
    previewFile,
    isRenameModalOpen,
    fileToRename,
    setPreviewFile,
    handleClosePreview,
    handlePreviewFile,
    setIsRenameModalOpen,
    setFileToRename,
    handleOpenRenameModal,
    handleRenameFile,
    handleRenameButtonClick,
    handleFileContextMenu
  };
}; 