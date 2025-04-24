import { useState, useCallback } from 'react';
import { fileApi } from '@/app/lib/api/file-api';
import { message } from 'antd';
import { ShareOptions, ShareItem, ShareResult } from '@/app/types/domains/share';

/**
 * 文件分享Hook
 * 管理文件分享相关功能，包括创建分享、获取分享列表和删除分享
 */
export function useFileShare() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFilesForShare, setSelectedFilesForShare] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [sharedFiles, setSharedFiles] = useState<ShareItem[]>([]);
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
   * @returns 分享结果，包含分享链接和提取码
   */
  const shareFiles = useCallback(async (options: ShareOptions): Promise<{ shareLink: string; extractCode: string }> => {
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
   * @returns 分享列表
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
   * @returns 操作是否成功
   */
  const deleteShares = useCallback(async (shareIds: string[]): Promise<boolean> => {
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

  /**
   * 复制分享链接到剪贴板
   * @param shareUrl 分享链接
   * @param extractCode 提取码
   */
  const copyShareLink = useCallback((shareUrl: string, extractCode?: string) => {
    try {
      const textToCopy = extractCode 
        ? `分享链接：${shareUrl}\n提取码：${extractCode}` 
        : `分享链接：${shareUrl}`;
      
      navigator.clipboard.writeText(textToCopy);
      message.success('分享链接已复制到剪贴板');
    } catch (error) {
      console.error('复制分享链接失败:', error);
      message.error('复制分享链接失败，请手动复制');
    }
  }, []);

  return {
    // 状态
    isShareModalOpen,
    selectedFilesForShare,
    isSharing,
    sharedFiles,
    isLoadingSharedFiles,
    
    // 方法
    setIsShareModalOpen,
    openShareModal,
    closeShareModal,
    shareFiles,
    loadSharedFiles,
    deleteShares,
    copyShareLink
  };
} 