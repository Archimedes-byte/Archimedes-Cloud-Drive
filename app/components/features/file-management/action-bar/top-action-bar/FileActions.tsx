import React from 'react';
import { 
  CloseOutlined, DownloadOutlined, EditOutlined, 
  SwapOutlined, DeleteOutlined, ShareAltOutlined 
} from '@ant-design/icons';
import { Button } from '@/app/components/ui/ant';
import { FileInfo } from '@/app/types';
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
      <Button 
        variant="text"
        onClick={onClearSelection}
        icon={<CloseOutlined />}
      >
        取消选择
      </Button>
      
      {selectedFolder ? (
        // 如果选择的是单个文件夹，使用增强下载组件
        <FolderDownloadButton
          folderId={selectedFolder.id}
          folderName={selectedFolder.name}
          buttonText="下载"
          showIcon={true}
          className=""
        />
      ) : (
        // 否则使用常规下载按钮
        <Button 
          variant="text"
          onClick={onDownload}
          icon={<DownloadOutlined />}
        >
          下载
        </Button>
      )}
      
      <Button 
        variant="text"
        onClick={onShare}
        icon={<ShareAltOutlined />}
      >
        分享
      </Button>
      
      <Button 
        variant="text"
        onClick={onRename}
        icon={<EditOutlined />}
      >
        重命名
      </Button>
      
      <Button 
        variant="text"
        onClick={onMove}
        icon={<SwapOutlined />}
      >
        移动
      </Button>
      
      <Button 
        variant="text"
        onClick={onDelete}
        icon={<DeleteOutlined />}
      >
        删除
      </Button>
    </>
  );
}; 