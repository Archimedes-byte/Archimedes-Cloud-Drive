import { useState, useCallback } from 'react';
import { message } from 'antd';
import { FileWithSize } from './useFiles';
import { API_PATHS } from '@/app/lib/api/paths';
import { fileApi } from '@/app/lib/api/file-api';
import { FileInfo } from '@/app/types';
import { downloadFile, downloadFolder } from '@/app/lib/storage/utils/download';

/**
 * 文件操作接口
 */
export interface FileOperations {
  /** 选择文件ID列表 */
  selectedFileIds: string[];
  /** 选择文件 */
  selectFile: (fileId: string, selected: boolean) => void;
  /** 选择多个文件 */
  selectFiles: (fileIds: string[]) => void;
  /** 清除选择 */
  clearSelection: () => void;
  /** 下载文件 */
  downloadFiles: (fileIds: string[]) => Promise<boolean>;
  /** 移动文件 */
  moveFiles: (fileIds: string[], targetFolderId: string) => Promise<boolean>;
  /** 删除文件 */
  deleteFiles: (fileIds: string[], onSuccess?: () => void) => Promise<boolean>;
  /** 重命名文件 */
  renameFile: (fileId: string, newName: string, onSuccess?: (updatedFile: FileInfo) => void) => Promise<boolean>;
  /** 创建文件夹 */
  createFolder: (name: string, parentId: string | null, tags?: string[]) => Promise<string | null>;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 文件操作钩子
 * 提供文件操作相关的方法
 * 
 * @param initialSelectedIds 初始选中的文件ID
 * @returns 文件操作接口
 */
export const useFileOperations = (initialSelectedIds: string[] = []): FileOperations => {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>(initialSelectedIds);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 选择文件
   * @param fileId 文件ID
   * @param selected 是否选中
   */
  const selectFile = useCallback((fileId: string, selected: boolean) => {
    setSelectedFileIds(prev => {
      if (selected) {
        if (prev.includes(fileId)) {
          return prev;
        }
        return [...prev, fileId];
      } else {
        return prev.filter(id => id !== fileId);
      }
    });
  }, []);

  /**
   * 选择多个文件
   * @param fileIds 文件ID列表
   */
  const selectFiles = useCallback((fileIds: string[]) => {
    setSelectedFileIds(fileIds);
  }, []);

  /**
   * 清除选择
   */
  const clearSelection = useCallback(() => {
    setSelectedFileIds([]);
  }, []);

  /**
   * 下载文件
   * @param fileIds 文件ID列表
   * @returns 是否成功
   */
  const downloadFiles = useCallback(async (fileIds: string[]): Promise<boolean> => {
    if (!fileIds.length) {
      message.warning('请选择要下载的文件');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 记录请求开始时间（用于调试性能问题）
      const startTime = Date.now();
      console.log(`开始下载文件: ${fileIds.join(', ')}`);

      let success = false;
      
      // 如果是单个文件夹，使用文件夹下载功能
      if (fileIds.length === 1) {
        try {
          const fileInfo = await fileApi.getFile(fileIds[0]);
          if (fileInfo && fileInfo.isFolder) {
            console.log(`检测到文件夹下载: ${fileInfo.name}`);
            // 使用改进的文件夹下载函数
            success = await downloadFolder(fileIds[0], fileInfo.name);
            
            if (success) {
              // 记录下载历史
              try {
                await fileApi.recordFileDownload(fileIds[0]);
              } catch (error) {
                console.warn('记录下载历史失败:', error);
                // 但不影响下载成功的状态
              }
              
              return true;
            }
          }
        } catch (error) {
          console.warn('获取文件信息失败，尝试通用下载方式', error);
        }
      }
      
      // 对于单个非文件夹文件，或者多文件
      try {
        // 使用POST方法处理下载
        const response = await fetch(API_PATHS.STORAGE.FILES.DOWNLOAD, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify({ fileIds }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || '下载失败');
        }

        // 获取文件Blob
        const blob = await response.blob();
        console.log(`文件下载响应接收完成，大小: ${(blob.size / 1024).toFixed(2)} KB, 耗时: ${Date.now() - startTime}ms`);
        
        // 检查blob是否为空
        if (blob.size === 0) {
          throw new Error('下载的文件为空，请重试');
        }
        
        // 从响应头获取文件名和内容类型
        const contentDisposition = response.headers.get('Content-Disposition') || '';
        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        let fileName = '下载文件';
        
        // 尝试从响应头中提取文件名
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/);
        if (filenameMatch && filenameMatch[1]) {
          fileName = decodeURIComponent(filenameMatch[1]);
        } else if (fileIds.length === 1) {
          // 如果是单个文件且无法从响应头获取文件名，尝试从文件信息中获取
          try {
            const fileInfo = await fileApi.getFile(fileIds[0]);
            if (fileInfo && fileInfo.name) {
              fileName = fileInfo.name;
            }
          } catch (e) {
            console.warn('获取文件名称失败，使用默认文件名', e);
          }
        } else {
          // 多文件下载默认使用zip扩展名
          fileName = '下载文件.zip';
        }

        // 确保文件名有扩展名
        if (!fileName.includes('.') && contentType && contentType !== 'application/octet-stream') {
          const extension = contentType.split('/')[1];
          if (extension && !['octet-stream', 'unknown'].includes(extension)) {
            fileName = `${fileName}.${extension}`;
          }
        }

        console.log(`准备下载文件: ${fileName}, 类型: ${contentType}`);

        // 创建下载链接
        const url = URL.createObjectURL(new Blob([blob], { type: contentType }));
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        
        // 清理
        setTimeout(() => {
          try {
            document.body.removeChild(link);
          } catch (e) {
            // 忽略清理错误
          }
          URL.revokeObjectURL(url);
          console.log(`文件下载过程完成: ${fileName}`);
        }, 500);
        
        success = true;
      } catch (downloadError) {
        console.error('标准下载方式失败，尝试备用下载方法:', downloadError);
        
        // 如果是单个文件，尝试使用单文件下载API
        if (fileIds.length === 1) {
          try {
            message.info('正在尝试备用下载方式...');
            const fileInfo = await fileApi.getFile(fileIds[0]);
            
            if (fileInfo) {
              if (fileInfo.isFolder) {
                // 使用文件夹下载方法
                success = await downloadFolder(fileIds[0], fileInfo.name);
              } else {
                // 使用文件下载方法
                success = await downloadFile(fileIds[0], fileInfo.name);
              }
            }
          } catch (backupError) {
            console.error('备用下载方式也失败:', backupError);
            success = false;
          }
        }
        
        if (!success) {
          throw downloadError; // 重新抛出原始错误
        }
      }
      
      // 记录下载历史
      if (success) {
        try {
          console.log('📥 准备记录文件下载历史');
          // 如果是单个文件下载
          if (fileIds.length === 1) {
            console.log(`📥 记录单个文件下载: ${fileIds[0]}`);
            const result = await fileApi.recordFileDownload(fileIds[0]);
            console.log(`📥 单个文件下载记录结果:`, result);
          } 
          // 对于多个文件(打包下载)，我们仍然记录每个文件的下载历史
          else if (fileIds.length > 1) {
            console.log(`📥 记录多个文件下载, 共 ${fileIds.length} 个文件`);
            // 异步记录，不等待完成
            Promise.all(fileIds.map(fileId => 
              fileApi.recordFileDownload(fileId)
                .then(result => {
                  console.log(`📥 文件 ${fileId} 下载记录成功:`, result);
                  return result;
                })
                .catch(error => {
                  console.warn(`📥 记录文件 ${fileId} 下载历史失败:`, error);
                  return null;
                })
            ));
          }
        } catch (error) {
          console.warn('📥 记录下载历史失败:', error);
          // 但不影响下载成功的状态
        }
      }
      
      return success;
    } catch (error) {
      console.error('下载文件失败:', error);
      setError(error instanceof Error ? error.message : '下载失败');
      message.error('下载文件失败，请重试: ' + (error instanceof Error ? error.message : '未知错误'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 移动文件
   * @param fileIds 文件ID列表
   * @param targetFolderId 目标文件夹ID
   * @returns 是否成功
   */
  const moveFiles = useCallback(async (fileIds: string[], targetFolderId: string): Promise<boolean> => {
    if (!fileIds.length) {
      message.warning('请选择要移动的文件');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 使用fileApi客户端
      await fileApi.moveFiles(fileIds, targetFolderId);
      message.success('文件移动成功');
      return true;
    } catch (error) {
      console.error('移动文件失败:', error);
      setError(error instanceof Error ? error.message : '移动失败');
      message.error(error instanceof Error ? error.message : '移动文件失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 删除文件
   * @param fileIds 文件ID列表
   * @param onSuccess 成功回调函数
   * @returns 是否成功
   */
  const deleteFiles = useCallback(async (fileIds: string[], onSuccess?: () => void): Promise<boolean> => {
    if (!fileIds.length) {
      message.warning('请选择要删除的文件');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 使用fileApi客户端
      await fileApi.deleteFiles(fileIds);
      message.success('文件删除成功');
      // 清除已删除文件的选择
      setSelectedFileIds(prev => prev.filter(id => !fileIds.includes(id)));
      
      // 调用成功回调函数，通常用于刷新文件列表
      if (onSuccess) {
        console.log('文件删除成功，调用刷新回调');
        onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error('删除文件失败:', error);
      setError(error instanceof Error ? error.message : '删除失败');
      message.error(error instanceof Error ? error.message : '删除文件失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 重命名文件
   * @param fileId 文件ID
   * @param newName 新文件名
   * @param onSuccess 成功回调，返回更新后的文件信息
   * @returns 是否成功
   */
  const renameFile = useCallback(async (fileId: string, newName: string, onSuccess?: (updatedFile: FileInfo) => void): Promise<boolean> => {
    // 检查fileId和newName的有效性
    if (!fileId) {
      message.warning('文件ID不能为空');
      return false;
    }
    
    // 检查newName的类型和值
    if (!newName || typeof newName !== 'string') {
      message.warning('新文件名不能为空且必须是字符串');
      return false;
    }
    
    // 检查trim后的newName是否为空
    if (!newName.trim()) {
      message.warning('新文件名不能为空');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 使用fileApi客户端
      const updatedFile = await fileApi.updateFile(fileId, newName.trim());
      message.success('文件重命名成功');
      
      // 如果提供了成功回调，调用它并传递更新后的文件信息
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(updatedFile);
      }
      
      return true;
    } catch (error) {
      console.error('重命名文件失败:', error);
      setError(error instanceof Error ? error.message : '重命名失败');
      message.error(error instanceof Error ? error.message : '重命名文件失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 创建文件夹
   * @param name 文件夹名称
   * @param parentId 父文件夹ID
   * @param tags 标签列表
   * @returns 文件夹ID (如果创建成功)
   */
  const createFolder = useCallback(async (
    name: string, 
    parentId: string | null = null,
    tags: string[] = []
  ): Promise<string | null> => {
    if (!name || !name.trim()) {
      message.warning('文件夹名称不能为空');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 使用fileApi客户端
      const folder = await fileApi.createFolder(name.trim(), parentId, tags);
      return folder.id;
    } catch (error) {
      console.error('创建文件夹过程中出错:', error);
      setError(error instanceof Error ? error.message : '创建失败');
      message.error(error instanceof Error ? error.message : '创建文件夹失败，请重试');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    selectedFileIds,
    selectFile,
    selectFiles,
    clearSelection,
    downloadFiles,
    moveFiles,
    deleteFiles,
    renameFile,
    createFolder,
    isLoading,
    error
  };
}; 