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
      message.loading({ content: '准备下载文件...', key: 'fileDownload' });
      
      // 先获取文件信息以确保有正确的文件名
      const fileInfo = currentFolder?.contents.find(f => f.id === fileId) || 
                      (shareInfo?.files || []).find(f => f.id === fileId);
      
      if (!fileInfo) {
        throw new Error('无法获取文件信息');
      }
      
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
        // 添加超时处理
        signal: AbortSignal.timeout(30000), // 30秒超时
      });

      if (!response.ok) {
        let errorMsg = '下载失败';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // 如果响应不是JSON格式，使用默认错误信息
        }
        throw new Error(errorMsg);
      }

      // 获取文件名
      const contentDisposition = response.headers.get('content-disposition');
      // 默认使用UI中显示的文件名
      let filename = fileInfo.name;
      
      if (contentDisposition) {
        // 尝试从filename*的UTF-8编码中获取文件名
        const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]*)/i);
        if (filenameStarMatch && filenameStarMatch[1]) {
          filename = decodeURIComponent(filenameStarMatch[1]);
        } else {
          // 回退到普通filename
          const filenameMatch = contentDisposition.match(/filename="?([^";]*)"?/i);
          if (filenameMatch && filenameMatch[1]) {
            filename = decodeURIComponent(filenameMatch[1]);
          }
        }
      }

      // 获取Content-Type，用于确定正确的文件类型
      const contentType = response.headers.get('content-type') || '';
      
      // 创建下载链接
      const blob = await response.blob();
      // 使用正确的MIME类型创建Blob
      const typedBlob = new Blob([blob], { type: contentType });
      const url = window.URL.createObjectURL(typedBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // 延迟回收URL以确保下载开始
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);

      message.success({ content: '下载成功', key: 'fileDownload' });
    } catch (error) {
      console.error('下载失败:', error);
      message.error({ 
        content: error instanceof Error ? error.message : '下载失败，请稍后重试', 
        key: 'fileDownload' 
      });
    }
  }, [shareCode, extractCode, currentFolder, shareInfo]);

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
        // 添加超时处理
        signal: AbortSignal.timeout(60000), // 60秒超时
      });

      if (!response.ok) {
        let errorMsg = '下载失败';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // 如果响应不是JSON格式，使用默认错误信息
        }
        throw new Error(errorMsg);
      }

      // 获取文件名
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${folderName}.zip`;
      
      if (contentDisposition) {
        // 尝试从filename*的UTF-8编码中获取文件名
        const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]*)/i);
        if (filenameStarMatch && filenameStarMatch[1]) {
          filename = decodeURIComponent(filenameStarMatch[1]);
        } else {
          // 回退到普通filename
          const filenameMatch = contentDisposition.match(/filename="?([^";]*)"?/i);
          if (filenameMatch && filenameMatch[1]) {
            filename = decodeURIComponent(filenameMatch[1]);
          }
        }
      }
      
      // 确保文件名以.zip结尾
      if (!filename.toLowerCase().endsWith('.zip')) {
        filename = `${filename}.zip`;
      }

      // 获取Content-Type，确认是zip文件
      const contentType = response.headers.get('content-type') || 'application/zip';
      
      // 创建下载链接
      const blob = await response.blob();
      const typedBlob = new Blob([blob], { type: contentType });
      const url = window.URL.createObjectURL(typedBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // 延迟回收URL以确保下载开始
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);

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