'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { message, Input, Button, Spin, Result, List, Avatar, Breadcrumb } from 'antd';
import { FileIcon, folderIcon } from '@/app/utils/file/icon-map';
import { formatFileSize } from '@/app/utils/file/formatter';
import { Lock, Download, File, Folder, ChevronLeft, Home } from 'lucide-react';
import styles from './share.module.css';

interface SharedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  isFolder: boolean;
}

interface ShareInfo {
  expiresAt: string | null;
  accessLimit: number | null;
  accessCount: number;
  files: SharedFile[];
}

interface FolderContent {
  id: string;
  name: string;
  type: string;
  size: number;
  isFolder: boolean;
  createdAt: string;
}

interface FolderInfo {
  contents: FolderContent[];
  folderId: string;
  folderName: string;
}

export default function SharePage({ params }: { params: { code: string } }) {
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
  }, [searchParams]);

  // 验证分享码和提取码
  const verifyShareCode = async (code: string) => {
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
          shareCode: params.code,
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
  };

  // 下载文件
  const downloadFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/storage/share/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareCode: params.code,
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
  };

  // 打开文件夹
  const openFolder = async (folderId: string, folderName: string) => {
    setFolderLoading(true);
    
    try {
      const response = await fetch(`/api/storage/share/folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareCode: params.code,
          extractCode,
          folderId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 更新文件夹导航栈
        setFolderStack(prev => [...prev, { id: folderId, name: folderName }]);
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
  };

  // 返回上一级文件夹
  const goBackFolder = async () => {
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
          shareCode: params.code,
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
  };

  // 返回分享根目录
  const goToRoot = () => {
    setFolderStack([]);
    setCurrentFolder(null);
  };

  // 添加文件夹打包下载函数
  const downloadFolder = async (folderId: string, folderName: string) => {
    try {
      message.loading({ content: '正在打包文件夹...', key: 'folderDownload' });
      
      const response = await fetch(`/api/storage/share/download-folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareCode: params.code,
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
  };

  // 渲染提取码输入界面
  const renderExtractCodeInput = () => {
    return (
      <div className={styles.extractCodeContainer}>
        <div className={styles.lockIcon}>
          <Lock size={64} color="#2878ff" />
        </div>
        <h2 className={styles.title}>这是一个受保护的分享链接</h2>
        <p className={styles.subtitle}>请输入提取码访问</p>
        
        <div className={styles.inputWrapper}>
          <Input 
            className={styles.codeInput}
            placeholder="请输入提取码"
            value={extractCode}
            onChange={e => setExtractCode(e.target.value)}
            onPressEnter={() => verifyShareCode(extractCode)}
            maxLength={10}
          />
          <Button 
            type="primary"
            onClick={() => verifyShareCode(extractCode)}
            loading={verifying}
            className={styles.submitButton}
          >
            提交
          </Button>
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>
    );
  };

  // 渲染分享内容界面
  const renderShareContent = () => {
    if (!shareInfo && !currentFolder) return null;

    // 决定显示哪些文件
    const files = currentFolder 
      ? currentFolder.contents 
      : shareInfo?.files || [];

    return (
      <div className={styles.shareContent}>
        <div className={styles.shareHeader}>
          <h2 className={styles.shareTitle}>分享文件</h2>
          {shareInfo?.expiresAt && !currentFolder && (
            <div className={styles.expiryInfo}>
              有效期至：{new Date(shareInfo.expiresAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* 面包屑导航 */}
        {folderStack.length > 0 && (
          <div className={styles.breadcrumbContainer}>
            <Breadcrumb 
              items={[
                {
                  title: <a onClick={goToRoot}><Home size={14} /> 根目录</a>,
                },
                ...folderStack.map((folder, index) => ({
                  title: index === folderStack.length - 1 
                    ? folder.name 
                    : <a onClick={() => {
                        // 回到特定层级
                        const newStack = folderStack.slice(0, index + 1);
                        const targetFolder = newStack[newStack.length - 1];
                        
                        setFolderStack(newStack);
                        openFolder(targetFolder.id, targetFolder.name);
                      }}>{folder.name}</a>
                }))
              ]}
            />
            <div className={styles.breadcrumbActions}>
              {folderStack.length > 0 && (
                <Button 
                  type="link" 
                  icon={<ChevronLeft size={14} />}
                  onClick={goBackFolder}
                  className={styles.backButton}
                >
                  返回上级
                </Button>
              )}
              {folderStack.length > 0 && (
                <Button
                  type="link"
                  icon={<Download size={14} />}
                  onClick={() => {
                    const currentFolder = folderStack[folderStack.length - 1];
                    downloadFolder(currentFolder.id, currentFolder.name);
                  }}
                  className={styles.downloadButton}
                >
                  打包下载
                </Button>
              )}
            </div>
          </div>
        )}

        {folderLoading ? (
          <div className={styles.folderLoadingContainer}>
            <Spin />
            <div className={styles.loadingText}>加载文件夹内容...</div>
          </div>
        ) : (
          <List
            className={styles.fileList}
            itemLayout="horizontal"
            dataSource={files}
            locale={{ emptyText: '此文件夹为空' }}
            renderItem={file => (
              <List.Item
                className={styles.fileItem}
                actions={[
                  <Button 
                    key="action" 
                    type="link" 
                    onClick={() => file.isFolder 
                      ? openFolder(file.id, file.name) 
                      : downloadFile(file.id)
                    }
                    disabled={false}
                  >
                    {file.isFolder ? <Folder size={16} /> : <Download size={16} />}
                    {file.isFolder ? '打开' : '下载'}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      className={styles.fileIcon}
                      icon={file.isFolder 
                        ? <Folder size={24} color="#2878ff" /> 
                        : <File size={24} color="#2878ff" />
                      } 
                    />
                  }
                  title={file.name}
                  description={file.isFolder 
                    ? '文件夹' 
                    : `${file.type.toUpperCase()} | ${formatFileSize(file.size)}`
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    );
  };

  // 渲染错误界面
  const renderError = () => {
    return (
      <Result
        status="error"
        title="访问失败"
        subTitle={error || "无法访问此分享链接，可能已过期或被删除"}
      />
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <div className={styles.loadingText}>加载中...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.shareCard}>
        {!verified 
          ? renderExtractCodeInput() 
          : error 
            ? renderError()
            : renderShareContent()
        }
      </div>
    </div>
  );
} 