import { useState, useCallback } from 'react';
import { fileApi } from '@/app/lib/api/file-api';
import { message } from 'antd';
import { ShareOptions } from '@/app/components/features/file-management/sharing';

/**
 * 文件分享Hook
 * 管理文件分享相关功能
 */
export function useFileShare() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFilesForShare, setSelectedFilesForShare] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [sharedFiles, setSharedFiles] = useState<any[]>([]);
  const [isLoadingSharedFiles, setIsLoadingSharedFiles] = useState(false);

  /**
   * 打开分享模态窗口
   * @param fileIds 要分享的文件ID列表
   */
  const openShareModal = useCallback((fileIds: string[]) => {
    setSelectedFilesForShare(fileIds);
    setIsShareModalOpen(true);
  }, []);

  /**
   * 关闭分享模态窗口
   */
  const closeShareModal = useCallback(() => {
    setIsShareModalOpen(false);
    setSelectedFilesForShare([]);
  }, []);

  /**
   * 执行分享操作
   * @param options 分享选项
   */
  const shareFiles = useCallback(async (options: ShareOptions) => {
    setIsSharing(true);
    
    try {
      const result = await fileApi.shareFiles({
        fileIds: options.fileIds,
        expiryDays: options.expiryDays,
        extractCode: options.extractCode,
        accessLimit: options.accessLimit,
        autoRefreshCode: options.autoRefreshCode
      });
      
      message.success('文件分享成功');
      return result;
    } catch (error) {
      console.error('分享文件失败:', error);
      message.error('分享文件失败，请重试');
      throw error;
    } finally {
      setIsSharing(false);
    }
  }, []);

  /**
   * 加载用户的分享列表
   */
  const loadSharedFiles = useCallback(async () => {
    setIsLoadingSharedFiles(true);
    
    try {
      const shares = await fileApi.getSharedFiles();
      setSharedFiles(shares);
      return shares;
    } catch (error) {
      console.error('获取分享列表失败:', error);
      message.error('获取分享列表失败，请重试');
      return [];
    } finally {
      setIsLoadingSharedFiles(false);
    }
  }, []);

  /**
   * 删除分享记录
   * @param shareIds 要删除的分享ID列表
   */
  const deleteShares = useCallback(async (shareIds: string[]) => {
    try {
      await fileApi.deleteShares(shareIds);
      message.success('分享记录删除成功');
      
      // 重新加载分享列表
      loadSharedFiles();
      return true;
    } catch (error) {
      console.error('删除分享记录失败:', error);
      message.error('删除分享记录失败，请重试');
      return false;
    }
  }, [loadSharedFiles]);

  return {
    isShareModalOpen,
    setIsShareModalOpen,
    selectedFilesForShare,
    isSharing,
    sharedFiles,
    isLoadingSharedFiles,
    openShareModal,
    closeShareModal,
    shareFiles,
    loadSharedFiles,
    deleteShares
  };
} 