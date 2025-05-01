import React, { useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { Button, message, Tooltip } from '@/app/components/ui/ant';
import { useFileOperations } from '@/app/hooks/file/useFileOperations';
import { fileApi } from '@/app/lib/api/file-api';
import { Edit, MoreHorizontal } from 'lucide-react';
import styles from './FolderDownloadButton.module.css';
import { FileInfo } from '@/app/types';

interface FolderDownloadButtonProps {
  folderId: string;
  folderName: string;
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
  onRename?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  mode?: 'button' | 'actions';
  /**
   * 处理下载请求，由父组件提供，用于统一展示下载模态框
   */
  onRequestDownload: (folderInfo: FileInfo) => void;
}

/**
 * 文件夹下载按钮组件
 * 提供文件夹下载操作，点击后调用父组件的统一下载处理
 * 支持两种模式：普通按钮和操作按钮组
 */
export const FolderDownloadButton: React.FC<FolderDownloadButtonProps> = ({
  folderId,
  folderName,
  className = '',
  buttonText = '下载文件夹',
  showIcon = true,
  onRename,
  onContextMenu,
  mode = 'button',
  onRequestDownload
}) => {
  const [checkingFolder, setCheckingFolder] = useState(false);

  /**
   * 处理下载按钮点击
   * 检查文件夹是否为空，然后请求下载
   */
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 先检查文件夹是否为空
    try {
      setCheckingFolder(true);
      const response = await fileApi.getFiles({ folderId, pageSize: 1 });
      if (response && response.items && response.items.length === 0) {
        message.warning(`文件夹 "${folderName}" 为空，无法下载空文件夹`);
        setCheckingFolder(false);
        return;
      }
      
      // 获取文件夹详情
      const folderInfo = await fileApi.getFile(folderId);
      setCheckingFolder(false);
      
      if (folderInfo) {
        // 调用父组件的统一下载处理
        onRequestDownload(folderInfo);
      } else {
        message.error('获取文件夹信息失败');
      }
    } catch (error) {
      console.error('检查文件夹内容失败:', error);
      setCheckingFolder(false);
      message.error('检查文件夹内容失败');
    }
  };

  // 检查类名是否包含共享样式类，如果是自定义样式类就使用按钮，否则使用原按钮
  const isCustomStyle = className && (className.includes('triggerButton') || className.includes('button'));

  // 渲染按钮模式（原 FolderDownloadButton）
  if (mode === 'button') {
    if (isCustomStyle) {
      return (
        <button
          className={`${className} text-white`}
          onClick={handleClick}
          disabled={checkingFolder}
        >
          {showIcon && <DownloadOutlined className="text-white" />}
          {checkingFolder ? '检查文件夹...' : buttonText}
        </button>
      );
    } else {
      return (
        <Button
          className={className}
          onClick={handleClick}
          icon={showIcon ? <DownloadOutlined /> : undefined}
          disabled={checkingFolder}
          style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
        >
          {checkingFolder ? '检查文件夹...' : buttonText}
        </Button>
      );
    }
  }
  
  // 渲染操作按钮组模式（原 FolderActionButtons）
  return (
    <div className={`${styles.container} ${className}`}>
      <Tooltip title={checkingFolder ? '检查文件夹...' : '下载文件夹'} placement="top">
        <div className={styles.actionButton} onClick={handleClick}>
          <DownloadOutlined />
        </div>
      </Tooltip>
      
      {onRename && (
        <Tooltip title="重命名" placement="top">
          <div className={styles.actionButton} onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}>
            <Edit size={14} />
          </div>
        </Tooltip>
      )}
      
      {onContextMenu && (
        <Tooltip title="更多操作" placement="top">
          <div className={styles.actionButton} onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e);
          }}>
            <MoreHorizontal size={14} />
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default FolderDownloadButton; 