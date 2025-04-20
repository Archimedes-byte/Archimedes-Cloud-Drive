import React, { useState } from 'react';
import { Download, Folder } from 'lucide-react';
import { Button, message, Modal, Spin } from 'antd';
import { downloadFolder } from '@/app/lib/download-utils';
import { useFileOperations } from '@/app/hooks/file/useFileOperations';

interface FolderDownloadButtonProps {
  folderId: string;
  folderName: string;
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
}

/**
 * 文件夹下载按钮组件
 * 提供增强的文件夹下载体验，解决浏览器下载问题
 */
export const FolderDownloadButton: React.FC<FolderDownloadButtonProps> = ({
  folderId,
  folderName,
  className = '',
  buttonText = '下载文件夹',
  showIcon = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [downloadAttempt, setDownloadAttempt] = useState(0);
  const { downloadFiles } = useFileOperations();

  /**
   * 处理下载按钮点击
   * 显示确认模态框
   */
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };

  /**
   * 执行下载
   * 使用多种方法尝试下载文件夹
   */
  const startDownload = async () => {
    try {
      setLoading(true);
      console.log(`开始下载文件夹: ${folderId} (${folderName})`);
      
      // 尝试使用标准下载方法
      const success = await downloadFiles([folderId]);
      
      if (success) {
        message.success(`"${folderName}" 文件夹下载已开始`);
        setShowModal(false);
        return;
      }
      
      // 如果标准方法失败，使用备用方法
      console.log('标准下载方法失败，尝试备用方法...');
      const fallbackSuccess = await downloadFolder(folderId, `${folderName}.zip`);
      
      if (fallbackSuccess) {
        message.success(`"${folderName}" 文件夹下载已开始`);
        setShowModal(false);
        return;
      }
      
      // 如果备用方法也失败，增加尝试次数
      setDownloadAttempt(prev => prev + 1);
      
      // 如果已尝试多次，建议用户手动操作
      if (downloadAttempt >= 2) {
        message.warning('多次下载尝试未成功，可能是浏览器限制导致');
      } else {
        message.error('下载失败，请重试');
      }
    } catch (error) {
      console.error('文件夹下载出错:', error);
      message.error('下载过程出错，请重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理模态框关闭
   */
  const handleCancel = () => {
    setShowModal(false);
    setDownloadAttempt(0);
  };

  /**
   * 处理打开新窗口下载
   * 在新窗口中尝试下载，避免当前窗口的限制
   */
  const handleNewWindowDownload = () => {
    try {
      // 构建下载URL
      const downloadUrl = `/api/debug/folder-download-page?id=${folderId}&name=${encodeURIComponent(folderName)}`;
      
      // 在新窗口中打开
      const newWindow = window.open(downloadUrl, '_blank');
      
      if (!newWindow) {
        message.warning('无法打开新窗口，请检查浏览器设置');
      } else {
        setShowModal(false);
        message.info('已在新窗口中启动下载');
      }
    } catch (error) {
      console.error('打开新窗口下载失败:', error);
      message.error('打开新窗口失败');
    }
  };

  return (
    <>
      <Button
        className={className}
        onClick={handleClick}
        icon={showIcon ? <Download size={16} /> : undefined}
        disabled={loading}
      >
        {buttonText}
      </Button>

      <Modal
        title={<div style={{ display: 'flex', alignItems: 'center' }}><Folder style={{ marginRight: 8 }} /> 下载文件夹</div>}
        open={showModal}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button 
            key="newwindow" 
            type="default" 
            onClick={handleNewWindowDownload}
            disabled={loading}
          >
            在新窗口下载
          </Button>,
          <Button 
            key="download" 
            type="primary" 
            onClick={startDownload} 
            loading={loading}
          >
            开始下载
          </Button>,
        ]}
      >
        <div style={{ padding: '20px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin />
              <p style={{ marginTop: 16 }}>正在准备下载，请稍候...</p>
            </div>
          ) : (
            <>
              <p>您即将下载文件夹 <strong>"{folderName}"</strong></p>
              <p>文件夹将被压缩为ZIP格式下载</p>
              
              {downloadAttempt > 0 && (
                <div style={{ marginTop: 16, padding: 16, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4 }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>提示：</p>
                  <p style={{ marginBottom: 0 }}>文件夹下载可能被浏览器安全策略阻止。您可以尝试：</p>
                  <ul style={{ marginBottom: 0 }}>
                    <li>再次点击"开始下载"按钮</li>
                    <li>点击"在新窗口下载"按钮</li>
                    <li>稍后再试或使用其他浏览器</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  );
}; 