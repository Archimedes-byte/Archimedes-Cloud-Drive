import { useState, useCallback } from 'react';
import { message } from 'antd';
import { LocalFileType } from '../utils/fileTypeConverter';

interface UseFilePreviewAndRenameProps {
  loadFiles: (folderId: string | null, fileType?: string | null) => Promise<any>;
  currentFolderId: string | null;
  selectedFileType: string | null;
}

export const useFilePreviewAndRename = ({ 
  loadFiles, 
  currentFolderId, 
  selectedFileType 
}: UseFilePreviewAndRenameProps) => {
  // 预览相关状态
  const [previewFile, setPreviewFile] = useState<LocalFileType | null>(null);
  
  // 重命名相关状态
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<LocalFileType | null>(null);
  
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
    setSelectedFile: (file: LocalFileType | null) => void,
    setSelectedFiles: (fileIds: string[]) => void
  ) => {
    event.preventDefault();
    setSelectedFile(file);
    setSelectedFiles([file.id]);
  }, []);

  return {
    // 状态
    previewFile,
    isRenameModalOpen,
    fileToRename,
    
    // 预览相关
    setPreviewFile,
    handleClosePreview,
    handlePreviewFile,
    
    // 重命名相关
    setIsRenameModalOpen,
    setFileToRename,
    handleOpenRenameModal,
    handleRenameFile,
    handleRenameButtonClick,
    
    // 上下文菜单
    handleFileContextMenu
  };
}; 