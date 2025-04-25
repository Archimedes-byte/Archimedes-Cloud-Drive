import React from 'react';
import { Button } from '@/app/components/ui';
import { Upload, FolderUp } from 'lucide-react';
import animationStyles from '@/app/styles/animations.module.css';

export interface UploadActionsProps {
  setIsUploadModalOpen?: (open: boolean) => void;
  setIsFolderUploadModalOpen?: (open: boolean) => void;
  onUploadClick?: () => void;
  onFolderUploadClick?: () => void;
  onCreateFolder?: () => void;
}

/**
 * 上传操作组件 - 负责处理文件上传相关的操作按钮
 */
export const UploadActions: React.FC<UploadActionsProps> = ({
  setIsUploadModalOpen = () => {},
  setIsFolderUploadModalOpen = () => {},
  onUploadClick,
  onFolderUploadClick,
  onCreateFolder
}) => {
  return (
    <>
      {/* 上传文件按钮 */}
      <Button 
        variant="ghost"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onUploadClick) {
            onUploadClick();
          } else {
            setIsUploadModalOpen(true);
          }
        }}
        icon={<Upload size={16} />}
      >
        上传文件
      </Button>
      
      {/* 上传文件夹按钮 */}
      <Button 
        variant="ghost"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onFolderUploadClick) {
            onFolderUploadClick();
          } else {
            setIsFolderUploadModalOpen(true);
          }
        }}
        icon={<FolderUp size={16} />}
      >
        上传文件夹
      </Button>
      
      {/* 新建文件夹按钮 */}
      <Button variant="ghost" onClick={onCreateFolder} icon={<span>📁</span>}>
        新建文件夹
      </Button>
    </>
  );
}; 