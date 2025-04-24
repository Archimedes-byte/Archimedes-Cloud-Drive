import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShareInfo, 
  FolderInfo,
  SharedFile,
  FolderContent
} from '@/app/types/domains/share';

/**
 * 分享浏览Hook
 * 处理分享页面中的浏览、验证和下载逻辑
 */
export function useShareView(shareCode: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [extractCode, setExtractCode] = useState<string>(searchParams.get('code') || '');
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [folderStack, setFolderStack] = useState<{id: string, name: string}[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderInfo | null>(null);
  const [folderLoading, setFolderLoading] = useState(false);

  // 自动尝试使用URL中的提取码
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setExtractCode(urlCode);
      verifyShareCode(urlCode);
    } else {
      setLoading(false);
    }
  }, [searchParams, shareCode]);

  // 验证分享码和提取码
  const verifyShareCode = useCallback(async (code: string) => {
    if (!code) {
      message.warning('请输入提取码');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const response = await fetch(`/api/storage/share/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareCode,
          extractCode: code,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShareInfo(data.data);
        setVerified(true);
        if (!searchParams.get('code')) {
          // 如果URL中没有code参数，添加提取码到URL
          const newUrl = `${window.location.pathname}?code=${code}`;
          window.history.replaceState({}, '', newUrl);
        }
      } else {
        setError(data.error || '提取码验证失败');
      }
    } catch (error) {
      console.error('验证分享链接失败:', error);
      setError('验证分享链接失败，请稍后重试');
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  }, [shareCode, searchParams]);

  // 下载文件
  const downloadFile = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`/api/storage/share/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareCode,
          extractCode,
          fileId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '下载失败');
      }

      // 获取文件名
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]*)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // 创建下载链接
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success('下载成功');
    } catch (error) {
      console.error('下载失败:', error);
      message.error(error instanceof Error ? error.message : '下载失败，请稍后重试');
    }
  }, [shareCode, extractCode]);

  // 打开文件夹
  const openFolder = useCallback(async (folderId: string, folderName: string) => {
    setFolderLoading(true);
    
    try {
      const response = await fetch(`/api/storage/share/folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareCode,
          extractCode,
          folderId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 检查是否已经在路径中
        const existingIndex = folderStack.findIndex(f => f.id === folderId);
        if (existingIndex >= 0) {
          // 如果已经在路径中，则回到该层级
          setFolderStack(folderStack.slice(0, existingIndex + 1));
        } else {
          // 否则添加到当前路径
          setFolderStack(prev => [...prev, { id: folderId, name: folderName }]);
        }
        setCurrentFolder(data.data);
      } else {
        message.error(data.error || '无法打开文件夹');
      }
    } catch (error) {
      console.error('打开文件夹失败:', error);
      message.error('打开文件夹失败，请稍后重试');
    } finally {
      setFolderLoading(false);
    }
  }, [shareCode, extractCode, folderStack]);

  // 返回上一级文件夹
  const goBackFolder = useCallback(async () => {
    if (folderStack.length <= 1) {
      // 如果只有一个文件夹，返回到分享根目录
      setFolderStack([]);
      setCurrentFolder(null);
      return;
    }

    // 弹出最后一个文件夹
    const newStack = [...folderStack];
    newStack.pop();
    const parentFolder = newStack[newStack.length - 1];
    
    setFolderLoading(true);
    
    try {
      const response = await fetch(`/api/storage/share/folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareCode,
          extractCode,
          folderId: parentFolder.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFolderStack(newStack);
        setCurrentFolder(data.data);
      } else {
        message.error(data.error || '无法返回上一级');
      }
    } catch (error) {
      console.error('返回上一级失败:', error);
      message.error('返回上一级失败，请稍后重试');
    } finally {
      setFolderLoading(false);
    }
  }, [shareCode, extractCode, folderStack]);

  // 返回分享根目录
  const goToRoot = useCallback(() => {
    setFolderStack([]);
    setCurrentFolder(null);
  }, []);

  // 打包下载文件夹
  const downloadFolder = useCallback(async (folderId: string, folderName: string) => {
    try {
      message.loading({ content: '正在打包文件夹...', key: 'folderDownload' });
      
      const response = await fetch(`/api/storage/share/download-folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareCode,
          extractCode,
          folderId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '下载失败');
      }

      // 创建下载链接
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success({ content: '文件夹打包下载成功', key: 'folderDownload' });
    } catch (error) {
      console.error('文件夹打包下载失败:', error);
      message.error({ 
        content: error instanceof Error ? error.message : '文件夹打包下载失败，请稍后重试', 
        key: 'folderDownload' 
      });
    }
  }, [shareCode, extractCode]);

  return {
    extractCode,
    setExtractCode,
    shareInfo,
    loading,
    verifying,
    error,
    verified,
    folderStack,
    currentFolder,
    folderLoading,
    verifyShareCode,
    downloadFile,
    openFolder,
    goBackFolder,
    goToRoot,
    downloadFolder
  };
} 