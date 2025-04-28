import { useState, useCallback } from 'react';
import { message } from 'antd';
import { FileWithSize } from './useFiles';
import { FileInfo } from '@/app/types';
import { fileApi } from '@/app/lib/api/file-api';
import { useFileRename } from './useFileRename';

/**
 * 文件预览钩子配置项接口
 */
export interface FilePreviewOptions {
  /** 文件选中状态 */
  selectedFileType?: string | null;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 文件更新回调 */
  onFileUpdate?: (updatedFile: FileInfo) => void;
  /** 搜索结果更新回调 */
  onSearchResultsUpdate?: (updatedFile: FileInfo) => void;
}

/**
 * 文件预览钩子接口
 */
export interface FilePreviewHook {
  /** 当前预览的文件 */
  previewFile: FileWithSize | null;
  /** 设置预览文件 */
  setPreviewFile: (file: FileWithSize | null) => void;
  /** 处理文件预览 */
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
 * 文件预览钩子
 * 提供文件预览功能，同时集成了重命名功能
 * 
 * @param options 配置选项
 * @returns 文件预览相关状态和方法
 */
export const useFilePreview = ({ 
  selectedFileType,
  onRefresh,
  onFileUpdate,
  onSearchResultsUpdate
}: FilePreviewOptions = {}): FilePreviewHook => {
  // 预览状态
  const [previewFile, setPreviewFile] = useState<FileWithSize | null>(null);
  
  // 使用文件重命名钩子
  const {
    isRenameModalOpen,
    setIsRenameModalOpen,
    fileToRename,
    setFileToRename,
    openRename,
    renameFile
  } = useFileRename({
    onRefresh,
    onFileUpdate,
    onSearchResultsUpdate
  });

  /**
   * 处理文件预览
   * @param file 要预览的文件
   */
  const handlePreview = useCallback((file: FileWithSize) => {
    if (file.isFolder) {
      return;
    }
    
    setPreviewFile(file);
    
    // 记录文件访问历史（只记录非文件夹）
    if (file && !file.isFolder && file.id) {
      try {
        console.log(`🔍 记录文件访问: ${file.id} (${file.name})`);
        // 异步记录文件访问，不影响预览功能
        fileApi.recordFileAccess(file.id)
          .then(result => {
            console.log(`✅ 文件访问记录成功: ${file.id}, 结果:`, result);
          })
          .catch(error => {
            console.error(`❌ 记录文件访问失败: ${file.id}`, error);
            // 不向用户展示错误，避免影响体验
          });
      } catch (error) {
        // 捕获任何可能的错误，确保不会影响主要功能
        console.error('❌ 记录文件访问发生错误:', error);
      }
    }
  }, []);

  /**
   * 关闭预览
   */
  const closePreview = useCallback(() => {
    setPreviewFile(null);
  }, []);

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