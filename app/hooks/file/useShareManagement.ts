import { useState, useCallback } from 'react';
import { message } from 'antd';
import { useRouter } from 'next/navigation';
import { fileApi } from '@/app/lib/api/file-api';
import { ShareOptions, ShareItem } from '@/app/types/domains/share';
import { copyToClipboard } from '@/app/lib/file/fileUtils';
import { handleError, safeAsync } from '@/app/utils/error';

/**
 * API 返回的分享结果类型
 */
interface ShareApiResult {
  shareLink: string;
  extractCode: string;
}

/**
 * 分享管理Hook接口
 */
export interface ShareManagementHook {
  // 分享创建相关
  /** 分享模态窗口是否可见 */
  isShareModalOpen: boolean;
  /** 选择用于分享的文件ID列表 */
  selectedFilesForShare: string[];
  /** 是否正在创建分享 */
  isSharing: boolean;
  /** 分享文件列表 */
  sharedFiles: ShareItem[];
  /** 是否正在加载分享文件列表 */
  isLoadingSharedFiles: boolean;
  /** 设置分享模态窗口是否可见 */
  setIsShareModalOpen: (open: boolean) => void;
  /** 打开分享模态窗口 */
  openShareModal: (fileIds: string[]) => void;
  /** 关闭分享模态窗口 */
  closeShareModal: () => void;
  /** 创建分享 */
  shareFiles: (options: ShareOptions) => Promise<ShareApiResult>;
  /** 加载分享列表 */
  loadSharedFiles: () => Promise<ShareItem[]>;
  /** 删除分享 */
  deleteShares: (shareIds: string[]) => Promise<boolean>;
  /** 复制分享链接 */
  copyShareLink: (shareUrl: string, extractCode?: string) => void;
  
  // 分享链接验证相关
  /** 链接输入模态窗口是否可见 */
  isLinkInputVisible: boolean;
  /** 分享链接 */
  shareLink: string;
  /** 分享链接密码 */
  shareLinkPassword: string;
  /** 是否正在处理链接 */
  isProcessing: boolean;
  /** 错误信息 */
  error: string | null;
  /** 设置分享链接 */
  setShareLink: (link: string) => void;
  /** 设置分享链接密码 */
  setShareLinkPassword: (password: string) => void;
  /** 打开链接输入模态窗口 */
  openLinkInputModal: (link?: string, password?: string) => void;
  /** 关闭链接输入模态窗口 */
  closeLinkInputModal: () => void;
  /** 处理链接提交 */
  handleLinkSubmit: () => Promise<boolean>;
}

/**
 * 分享管理Hook
 * 整合了创建分享和验证分享链接的功能
 * 
 * @returns 分享管理Hook接口
 */
export function useShareManagement(): ShareManagementHook {
  const router = useRouter();
  
  // ===== 分享创建相关状态 =====
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFilesForShare, setSelectedFilesForShare] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [sharedFiles, setSharedFiles] = useState<ShareItem[]>([]);
  const [isLoadingSharedFiles, setIsLoadingSharedFiles] = useState(false);
  
  // ===== 分享链接验证相关状态 =====
  const [isLinkInputVisible, setIsLinkInputVisible] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareLinkPassword, setShareLinkPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const shareFiles = useCallback(async (options: ShareOptions): Promise<ShareApiResult> => {
    setIsSharing(true);
    
    try {
      console.log('开始分享文件', {
        fileIds: options.fileIds,
        expiryDays: options.expiryDays,
        hasExtractCode: !!options.extractCode,
        accessLimit: options.accessLimit,
        autoRefreshCode: options.autoRefreshCode
      });
      
      // 调用API创建分享
      const result = await fileApi.shareFiles(options);
      
      console.log('分享文件成功，获得结果:', {
        hasShareLink: !!result.shareLink,
        hasExtractCode: !!result.extractCode,
      });
      
      message.success('文件分享成功');
      return result;
    } catch (error) {
      handleError(error, true, 'error', '分享失败，请重试');
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
      handleError(error, true, 'error', '获取分享列表失败，请重试');
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
      handleError(error, true, 'error', '删除分享记录失败，请重试');
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
      // 获取当前网站的域名部分
      const baseUrl = window.location.origin;
      
      // 检查shareUrl是否已经是完整URL
      const fullShareUrl = shareUrl.startsWith('http') ? 
        shareUrl : 
        `${baseUrl}${shareUrl.startsWith('/') ? '' : '/'}${shareUrl}`;
      
      const textToCopy = extractCode 
        ? `分享链接：${fullShareUrl}\n提取码：${extractCode}` 
        : `分享链接：${fullShareUrl}`;
      
      copyToClipboard(textToCopy);
      message.success('已复制分享链接到剪贴板');
    } catch (error) {
      handleError(error, true, 'error', '复制分享链接失败，请手动复制');
    }
  }, []);

  /**
   * 打开链接输入模态窗口
   * @param link 初始分享链接
   * @param password 初始密码
   */
  const openLinkInputModal = useCallback((link: string = '', password: string = '') => {
    setShareLink(link);
    setShareLinkPassword(password);
    setIsLinkInputVisible(true);
    setError(null);
  }, []);

  /**
   * 关闭链接输入模态窗口
   */
  const closeLinkInputModal = useCallback(() => {
    setIsLinkInputVisible(false);
    setShareLink('');
    setShareLinkPassword('');
    setError(null);
  }, []);

  /**
   * 处理链接提交
   * @returns 操作是否成功
   */
  const handleLinkSubmit = useCallback(async (): Promise<boolean> => {
    // 验证输入
    if (!shareLink.trim()) {
      setError('请输入分享链接');
      return false;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // 从链接中提取分享码
      // 支持多种格式：完整URL或只有path部分
      const url = new URL(
        shareLink.includes('://') ? shareLink : `https://example.com${shareLink.startsWith('/') ? '' : '/'}${shareLink}`
      );
      
      // 提取路径部分
      const path = url.pathname;
      const segments = path.split('/').filter(Boolean);
      
      // 如果路径中包含"s"或"share"关键词，尝试获取分享码
      let shareCode = '';
      
      if (segments.includes('s')) {
        const sIndex = segments.indexOf('s');
        if (segments.length > sIndex + 1) {
          shareCode = segments[sIndex + 1];
        }
      } else if (segments.includes('share')) {
        const shareIndex = segments.indexOf('share');
        if (segments.length > shareIndex + 1) {
          shareCode = segments[shareIndex + 1];
        }
      } else if (segments.length > 0) {
        // 尝试使用最后一个路径部分作为分享码
        shareCode = segments[segments.length - 1];
      }
      
      if (!shareCode) {
        setError('无法从链接中提取分享码，请检查链接格式');
        return false;
      }
      
      if (!shareLinkPassword) {
        setError('请输入提取码');
        return false;
      }
      
      // 验证分享链接和提取码
      const response = await fetch('/api/storage/share/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareCode,
          extractCode: shareLinkPassword
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || '验证失败，请检查链接和提取码');
        return false;
      }
      
      // 验证成功，关闭对话框并导航到分享页面
      closeLinkInputModal();
      router.push(`/pages/share/${shareCode}?code=${encodeURIComponent(shareLinkPassword)}`);
      return true;
    } catch (error) {
      handleError(error, true, 'error', '处理分享链接失败，请重试');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [shareLink, shareLinkPassword, router, closeLinkInputModal]);

  return {
    // 分享创建相关
    isShareModalOpen,
    selectedFilesForShare,
    isSharing,
    sharedFiles,
    isLoadingSharedFiles,
    setIsShareModalOpen,
    openShareModal,
    closeShareModal,
    shareFiles,
    loadSharedFiles,
    deleteShares,
    copyShareLink,
    
    // 分享链接验证相关
    isLinkInputVisible,
    shareLink,
    shareLinkPassword,
    isProcessing,
    error,
    setShareLink,
    setShareLinkPassword,
    openLinkInputModal,
    closeLinkInputModal,
    handleLinkSubmit
  };
} 