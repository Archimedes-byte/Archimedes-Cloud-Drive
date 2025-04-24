import React from 'react';
import { 
  X, Download, Edit, Move, Trash2, Share2 
} from 'lucide-react';
import { FileInfo } from '@/app/types';
import styles from '@/app/file-management/styles/shared.module.css';
import { FolderDownloadButton } from '@/app/components/features/file-management/download/FolderDownloadButton';

interface FileActionsProps {
  selectedFiles: FileInfo[];
  onClearSelection: () => void;
  onDownload: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onShare: () => void;
}

/**
 * 文件操作组件 - 负责显示选中文件时的操作按钮
 */
export const FileActions: React.FC<FileActionsProps> = ({
  selectedFiles,
  onClearSelection,
  onDownload,
  onRename,
  onMove,
  onDelete,
  onShare
}) => {
  // 检查是否只选择了一个文件夹
  const selectedFolder = selectedFiles.length === 1 && selectedFiles[0].isFolder ? selectedFiles[0] : null;
  
  return (
    <>
      <button className={styles.topButton} onClick={onClearSelection}>
        <X className="w-4 h-4" />
        取消选择
      </button>
      
      {selectedFolder ? (
        // 如果选择的是单个文件夹，使用增强下载组件
        <FolderDownloadButton
          folderId={selectedFolder.id}
          folderName={selectedFolder.name}
          buttonText="下载"
          showIcon={true}
          className={styles.topButton}
        />
      ) : (
        // 否则使用常规下载按钮
        <button className={styles.topButton} onClick={onDownload}>
          <Download className="w-4 h-4" />
          下载
        </button>
      )}
      
      <button className={styles.topButton} onClick={onShare}>
        <Share2 className="w-4 h-4" />
        分享
      </button>
      
      <button 
        className={styles.topButton}
        onClick={onRename}
      >
        <Edit className="w-4 h-4" />
        重命名
      </button>
      <button className={styles.topButton} onClick={onMove}>
        <Move className="w-4 h-4" />
        移动
      </button>
      <button className={styles.topButton} onClick={onDelete}>
        <Trash2 className="w-4 h-4" />
        删除
      </button>
    </>
  );
}; 