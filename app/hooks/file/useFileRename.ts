import { useState, useCallback } from 'react';
import { message } from 'antd';
import { FileWithSize } from './useFiles';
import { fileApi } from '@/app/lib/api/file-api';
import { FileInfo } from '@/app/types';

/**
 * 文件重命名钩子接口
 */
export interface FileRenameHook {
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
 * 文件重命名钩子参数
 */
export interface FileRenameOptions {
  /** 刷新文件列表的函数 */
  onRefresh?: () => void;
  /** 更新文件函数 */
  onFileUpdate?: (updatedFile: FileInfo) => void;
  /** 更新搜索结果中的文件函数 */
  onSearchResultsUpdate?: (updatedFile: FileInfo) => void;
}

/**
 * 文件重命名钩子
 * 提供文件重命名功能，管理重命名相关状态
 * 
 * @param options 配置选项
 * @returns 文件重命名相关状态和方法
 */
export const useFileRename = ({
  onRefresh,
  onFileUpdate,
  onSearchResultsUpdate
}: FileRenameOptions = {}): FileRenameHook => {
  // 重命名相关状态
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<FileWithSize | null>(null);

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
      
      // 获取新文件名中的扩展名
      const newExt = newName.includes('.') 
        ? newName.split('.').pop()?.toLowerCase() 
        : '';
      
      // 确保新文件名保留原始扩展名
      let finalName = newName.trim();
      if (!fileToRename.isFolder && oldExt && !newName.endsWith(`.${oldExt}`)) {
        // 如果用户输入的新名称不包含原始扩展名，自动添加
        finalName = `${finalName}.${oldExt}`;
      }
      
      // 使用fileApi直接更新文件信息
      const updatedFile = await fileApi.updateFile(fileToRename.id, finalName, tags, true);
      
      message.success('重命名成功');
      
      // 关闭模态框
      setIsRenameModalOpen(false);
      setFileToRename(null);
      
      // 检查扩展名是否变化
      const extensionChanged = oldExt !== newExt;
      
      // 无论扩展名是否变化，始终强制刷新整个文件列表
      if (onRefresh) {
        console.log('重命名成功后刷新文件列表');
        // 确保刷新操作是异步的，在UI更新后执行一次
        setTimeout(() => {
          onRefresh();
        }, 200);
      }
      
      // 同时也更新文件列表中的条目（在刷新之前保持UI连续性）
      if (onFileUpdate) {
        // 添加特殊标记，确保在过滤视图中也显示
        const fileWithMark = {
          ...updatedFile,
          _forceInclude: true // 添加标记
        } as any;
        // 只进行一次更新，避免多次触发状态变化
        onFileUpdate(fileWithMark);
      }
      
      // 如果在搜索结果中也需要更新
      if (onSearchResultsUpdate) {
        onSearchResultsUpdate(updatedFile);
      }
      
      return true;
    } catch (error) {
      console.error('重命名错误:', error);
      message.error(error instanceof Error ? error.message : '重命名失败，请重试');
      return false;
    }
  }, [fileToRename, onRefresh, onFileUpdate, onSearchResultsUpdate]);

  return {
    // 重命名相关
    isRenameModalOpen,
    setIsRenameModalOpen,
    fileToRename,
    setFileToRename,
    openRename,
    renameFile
  };
}; 