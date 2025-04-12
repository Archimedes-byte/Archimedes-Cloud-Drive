import { useState, useCallback } from 'react';
import { message } from 'antd';
import { FileWithSize } from './useFiles';

/**
 * 文件预览钩子接口
 */
export interface FilePreviewHook {
  /** 当前预览的文件 */
  previewFile: FileWithSize | null;
  /** 设置预览文件 */
  setPreviewFile: (file: FileWithSize | null) => void;
  /** 处理预览 */
  handlePreview: (file: FileWithSize) => void;
  /** 关闭预览 */
  closePreview: () => void;
  /** 重命名模态框是否打开 */
  isRenameModalOpen: boolean;
  /** 设置重命名模态框状态 */
  setIsRenameModalOpen: (isOpen: boolean) => void;
  /** 要重命名的文件 */
  fileToRename: FileWithSize | null;
  /** 设置要重命名的文件 */
  setFileToRename: (file: FileWithSize | null) => void;
  /** 打开重命名模态框 */
  openRename: (file: FileWithSize) => void;
  /** 执行重命名 */
  renameFile: (newName: string, tags?: string[]) => Promise<boolean>;
}

/**
 * 文件预览钩子参数
 */
export interface FilePreviewOptions {
  /** 刷新文件列表的函数 */
  onRefresh?: () => void;
}

/**
 * 文件预览和重命名钩子
 * 提供文件预览和重命名功能
 * 
 * @param options 配置选项
 * @returns 文件预览相关状态和方法
 */
export const useFilePreview = ({ onRefresh }: FilePreviewOptions = {}): FilePreviewHook => {
  // 预览相关状态
  const [previewFile, setPreviewFile] = useState<FileWithSize | null>(null);
  
  // 重命名相关状态
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<FileWithSize | null>(null);

  /**
   * 处理文件预览
   * @param file 要预览的文件
   */
  const handlePreview = useCallback((file: FileWithSize) => {
    setPreviewFile(file);
  }, []);

  /**
   * 关闭预览
   */
  const closePreview = useCallback(() => {
    setPreviewFile(null);
  }, []);

  /**
   * 打开重命名模态框
   * @param file 要重命名的文件
   */
  const openRename = useCallback((file: FileWithSize) => {
    setFileToRename(file);
    setIsRenameModalOpen(true);
  }, []);

  /**
   * 执行重命名操作
   * @param newName 新文件名
   * @param tags 标签数组(可选)
   * @returns 是否成功
   */
  const renameFile = useCallback(async (newName: string, tags?: string[]): Promise<boolean> => {
    if (!fileToRename) {
      message.warning('没有选择要重命名的文件');
      return false;
    }
    
    // 验证newName必须是字符串类型
    if (typeof newName !== 'string') {
      message.warning('新文件名必须是字符串类型');
      return false;
    }
    
    // 验证newName不能为空
    if (!newName || !newName.trim()) {
      message.warning('文件名不能为空');
      return false;
    }
    
    try {
      // 打印调试信息
      console.log('重命名文件 - 文件信息:', {
        id: fileToRename.id,
        name: fileToRename.name,
        isFolder: fileToRename.isFolder,
        newName: newName
      });
      
      const apiUrl = `/api/storage/files/${fileToRename.id}/rename`;
      console.log('请求URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          newName,
          tags: tags || fileToRename.tags
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '重命名失败');
      }
      
      if (data.success) {
        message.success('重命名成功');
        
        // 关闭模态框
        setIsRenameModalOpen(false);
        setFileToRename(null);
        
        // 刷新文件列表
        if (onRefresh) {
          onRefresh();
        }
        
        return true;
      } else {
        throw new Error(data.error || '重命名失败');
      }
    } catch (error) {
      console.error('重命名错误:', error);
      message.error(error instanceof Error ? error.message : '重命名失败，请重试');
      return false;
    }
  }, [fileToRename, onRefresh]);

  return {
    // 预览相关
    previewFile,
    setPreviewFile,
    handlePreview,
    closePreview,
    
    // 重命名相关
    isRenameModalOpen,
    setIsRenameModalOpen,
    fileToRename,
    setFileToRename,
    openRename,
    renameFile
  };
}; 