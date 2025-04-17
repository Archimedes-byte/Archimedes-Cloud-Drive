import React from 'react';
import { Tooltip } from 'antd';
import { Download, MoreHorizontal, Edit, File } from 'lucide-react';
import { FolderDownloadButton } from './FolderDownloadButton';
import styles from './FolderActionButtons.module.css';

interface FolderActionButtonsProps {
  folderId: string;
  folderName: string;
  onRename?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
}

/**
 * 文件夹操作按钮组件
 * 显示在文件列表中的文件夹项上，提供快速操作按钮
 */
export const FolderActionButtons: React.FC<FolderActionButtonsProps> = ({
  folderId,
  folderName,
  onRename,
  onContextMenu,
  className = '',
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <Tooltip title="下载文件夹" placement="top">
        <div className={styles.actionButton}>
          <FolderDownloadButton
            folderId={folderId}
            folderName={folderName}
            buttonText=""
            showIcon={true}
            className={styles.iconButton}
          />
        </div>
      </Tooltip>
      
      {onRename && (
        <Tooltip title="重命名" placement="top">
          <div className={styles.actionButton} onClick={onRename}>
            <Edit size={16} />
          </div>
        </Tooltip>
      )}
      
      <Tooltip title="更多操作" placement="top">
        <div 
          className={styles.actionButton} 
          onClick={onContextMenu}
        >
          <MoreHorizontal size={16} />
        </div>
      </Tooltip>
    </div>
  );
}; 