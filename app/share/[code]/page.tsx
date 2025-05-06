/**
 * 文件分享页面
 * 
 * 这个页面处理文件分享功能，通过动态路由[code]捕获分享链接中的唯一码。
 * 目录结构 /share/[code] 对应于分享链接格式：${baseUrl}/share/${shareCode}
 * 使用完整的'share'作为目录名，提高可读性和可维护性。
 */

'use client';

import React, { useState } from 'react';
import { Input, Button, Spin, Result, List, Avatar, Breadcrumb, message } from 'antd';
import { FileIcon, folderIcon } from '@/app/utils/file/icon-map';
import { formatFileSize } from '@/app/utils/file/formatter';
import { Lock, Download, File, Folder, ChevronLeft, Home, Eye, Save } from 'lucide-react';
import { useShareView } from '@/app/hooks/file/useShareView';
import { FilePreview } from '@/app/components/features/file-management/file-preview/FilePreview';
import { FolderSelect } from '@/app/components/features/file-management/folder-select/FolderSelect';
import { useSession } from 'next-auth/react';
import styles from './file-share-page.module.css';

export default function SharePage({ params }: { params: { code: string } }) {
  const { data: session } = useSession();
  const {
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
    savingToMyDrive,
    verifyShareCode,
    downloadFile,
    openFolder,
    goBackFolder,
    goToRoot,
    downloadFolder,
    saveToMyDrive
  } = useShareView(params.code);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [folderSelectVisible, setFolderSelectVisible] = useState(false);
  const [fileToSave, setFileToSave] = useState<any>(null);

  // 打开文件夹选择对话框
  const handleSaveToMyDrive = (file: any) => {
    if (!session) {
      message.error('请先登录再保存文件');
      return;
    }
    
    setFileToSave(file);
    setFolderSelectVisible(true);
  };

  // 处理文件夹选择完成
  const handleFolderSelected = async (folderId: string | null) => {
    if (!fileToSave) return;
    
    try {
      await saveToMyDrive(
        fileToSave.id,
        folderId,
        fileToSave.isFolder
      );
      setFolderSelectVisible(false);
      setFileToSave(null);
    } catch (error) {
      console.error('保存失败:', error);
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
            autoFocus
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
    if (!shareInfo) return null;

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
                        // 回到特定层级，直接打开目标文件夹
                        openFolder(folder.id, folder.name);
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
              {session && folderStack.length > 0 && (
                <Button
                  type="link"
                  icon={<Save size={14} />}
                  onClick={() => {
                    const currentFolder = folderStack[folderStack.length - 1];
                    handleSaveToMyDrive({
                      id: currentFolder.id,
                      name: currentFolder.name,
                      isFolder: true
                    });
                  }}
                  loading={savingToMyDrive}
                  className={styles.saveButton}
                >
                  保存至我的网盘
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
                  !file.isFolder && (
                    <Button
                      key="preview"
                      type="link"
                      onClick={() => setPreviewFile(file)}
                      disabled={false}
                    >
                      <Eye size={16} />
                      预览
                    </Button>
                  ),
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
                  </Button>,
                  session && (
                    <Button
                      key="save"
                      type="link"
                      onClick={() => handleSaveToMyDrive(file)}
                      loading={savingToMyDrive && fileToSave?.id === file.id}
                    >
                      <Save size={16} />
                      保存至我的网盘
                    </Button>
                  )
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
        
        {previewFile && (
          <FilePreview
            file={previewFile}
            onClose={() => setPreviewFile(null)}
            onDownload={(file) => {
              if (file && file.id) {
                downloadFile(file.id);
              }
            }}
          />
        )}
        
        {/* 文件夹选择对话框 */}
        <FolderSelect
          visible={folderSelectVisible}
          onCancel={() => {
            setFolderSelectVisible(false);
            setFileToSave(null);
          }}
          onSelect={handleFolderSelected}
          title="选择保存位置"
        />
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