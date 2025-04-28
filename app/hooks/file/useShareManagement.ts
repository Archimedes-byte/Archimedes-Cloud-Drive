import { useState, useCallback } from 'react';
import { message } from 'antd';
import { useRouter } from 'next/navigation';
import { fileApi } from '@/app/lib/api/file-api';
import { ShareOptions, ShareItem } from '@/app/types/domains/share';
import { handleApiError, copyToClipboard } from '@/app/lib/file/fileUtils';

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
      handleApiError(error, '分享失败，请重试');
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
      handleApiError(error, '获取分享列表失败，请重试');
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
      handleApiError(error, '删除分享记录失败，请重试');
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
      
      copyToClipboard(textToCopy, '分享链接已复制到剪贴板');
    } catch (error) {
      handleApiError(error, '复制分享链接失败，请手动复制');
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
   * @returns 是否成功处理
   */
  const handleLinkSubmit = useCallback(async (): Promise<boolean> => {
    try {
      if (!shareLink) {
        message.warning('请输入分享链接');
        return false;
      }

      setIsProcessing(true);
      setError(null);
      
      // 显示加载中提示
      const loadingMessage = message.loading('正在验证分享链接...', 0);

      // 调用API验证分享链接
      const response = await fetch('/api/storage/share/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareLink,
          extractCode: shareLinkPassword,
        }),
      });

      // 关闭加载提示
      loadingMessage();

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '验证分享链接失败');
      }

      // 如果需要提取码但未提供或提取码错误
      if (data.needsExtractCode) {
        setError(data.error || '请提供正确的提取码');
        message.warning(data.error || '请提供正确的提取码');
        return false; // 保持弹窗打开，让用户输入提取码
      }
      
      if (data.success) {
        // 关闭链接输入弹窗
        closeLinkInputModal();
        
        // 根据分享信息显示文件
        const shareInfo = data.shareInfo;
        message.success('分享链接验证成功，正在打开分享内容...');
        
        // 导航到分享页面
        router.push(`/s/${shareInfo.shareCode}`);
        return true;
      } else {
        setError(data.error || '分享链接无效');
        message.error(data.error || '分享链接无效');
        return false;
      }
    } catch (error) {
      handleApiError(error, '处理分享链接失败，请重试');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [shareLink, shareLinkPassword, closeLinkInputModal, router]);

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