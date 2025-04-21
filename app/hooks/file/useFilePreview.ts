import { useState, useCallback } from 'react';
import { message } from 'antd';
import { FileWithSize } from './useFiles';
import { API_PATHS } from '@/app/lib/api/paths';
import { fileApi } from '@/app/lib/api/file-api';
import { FileInfo, FileTypeEnum } from '@/app/types';

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
  /** 更新文件函数 */
  onFileUpdate?: (updatedFile: FileInfo) => void;
  /** 更新搜索结果中的文件函数 */
  onSearchResultsUpdate?: (updatedFile: FileInfo) => void;
  /** 当前选择的文件类型 */
  selectedFileType?: FileTypeEnum | null;
}

/**
 * 文件预览和重命名钩子
 * 提供文件预览和重命名功能
 * 
 * @param options 配置选项
 * @returns 文件预览相关状态和方法
 */
export const useFilePreview = ({ 
  onRefresh, 
  onFileUpdate, 
  onSearchResultsUpdate,
  selectedFileType
}: FilePreviewOptions = {}): FilePreviewHook => {
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
    
    // 记录文件访问历史（只记录非文件夹）
    if (file && !file.isFolder && file.id) {
      try {
        // 异步记录文件访问，不影响预览功能
        fileApi.recordFileAccess(file.id).catch(error => {
          console.error('记录文件访问失败:', error);
          // 不向用户展示错误，避免影响体验
        });
      } catch (error) {
        // 捕获任何可能的错误，确保不会影响主要功能
        console.error('记录文件访问发生错误:', error);
      }
    }
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
        newName: newName,
        currentType: fileToRename.type
      });
      
      // 获取原始文件扩展名，用于后续比较
      const oldExt = fileToRename.name.includes('.') 
        ? fileToRename.name.split('.').pop()?.toLowerCase() 
        : '';
      
      // 获取新文件扩展名
      const newExt = newName.includes('.') 
        ? newName.split('.').pop()?.toLowerCase() 
        : '';
      
      // 创建更新参数，确保保留原始文件类型
      const updateParams = {
        name: newName.trim(), 
        tags,
        preserveOriginalType: true
      };
      
      // 使用fileApi直接更新文件信息，传递完整的更新参数对象
      const updatedFile = await fileApi.updateFile(fileToRename.id, newName.trim(), tags, true);
      
      message.success('重命名成功');
      
      // 关闭模态框
      setIsRenameModalOpen(false);
      setFileToRename(null);
      
      // 检查扩展名是否变化且当前有文件类型过滤
      const extensionChanged = oldExt !== newExt;
      
      // 扩展名变化时可能需要重新加载文件列表
      if (extensionChanged && selectedFileType) {
        console.log('文件扩展名已变更，需要刷新文件列表', { oldExt, newExt, selectedFileType });
        
        // 如果提供了刷新函数，强制刷新整个文件列表
        if (onRefresh) {
          setTimeout(() => {
            console.log('重新加载文件列表以反映类型变化');
            onRefresh();
          }, 300); // 短暂延迟，确保UI正常更新
          
          // 扩展名变化情况下，仍然更新当前视图中的对应文件
          // 这有助于在刷新之前保持UI的连续性
          if (onFileUpdate) {
            // 特别添加一个标记，确保前端过滤时考虑这个文件
            const fileWithType = {
              ...updatedFile,
              _forceInclude: true // 添加特殊标记
            } as any; // 使用类型断言避免类型错误
            onFileUpdate(fileWithType);
          }
        } else {
          // 如果没有刷新函数，至少更新当前文件
          if (onFileUpdate) {
            onFileUpdate(updatedFile);
          }
        }
      } else {
        // 非扩展名变化情况，只更新相关视图
        
        // 1. 更新文件列表 - 如果提供了更新文件函数
        if (onFileUpdate) {
          onFileUpdate(updatedFile);
        }
        
        // 2. 更新搜索结果 - 如果提供了更新搜索结果函数
        if (onSearchResultsUpdate) {
          onSearchResultsUpdate(updatedFile);
        }
      }
      
      return true;
    } catch (error) {
      console.error('重命名错误:', error);
      message.error(error instanceof Error ? error.message : '重命名失败，请重试');
      return false;
    }
  }, [fileToRename, onRefresh, onFileUpdate, onSearchResultsUpdate, selectedFileType]);

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