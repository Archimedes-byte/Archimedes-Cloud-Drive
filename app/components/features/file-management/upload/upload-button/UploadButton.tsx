import React, { useState, useRef, useEffect } from 'react';
import { Upload, Folder, ChevronDown } from 'lucide-react';
import styles from '@/app/components/features/file-management/upload/upload-modal/uploadModal.module.css';
import buttonStyles from '@/app/components/features/file-management/buttons/styles/buttons.module.css';
import dropdownStyles from '@/app/components/features/file-management/dropdown/styles/dropdown.module.css';

interface UploadButtonProps {
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  setIsModalOpen: (open: boolean) => void;
  setIsFolderModalOpen: (open: boolean) => void;
  uploadDropdownRef: React.RefObject<HTMLDivElement>;
  onUploadClick?: () => void;
  onFolderUploadClick?: () => void;
}

export function UploadButton({ 
  showDropdown, 
  setShowDropdown, 
  setIsModalOpen, 
  setIsFolderModalOpen,
  uploadDropdownRef,
  onUploadClick,
  onFolderUploadClick
}: UploadButtonProps) {
  
  // 处理上传按钮点击
  const handleUploadClick = (type: 'file' | 'folder') => {
    if (type === 'file') {
      // 如果提供了自定义回调函数，则使用它
      if (onUploadClick) {
        onUploadClick();
      } else {
        // 否则使用默认行为
        setIsModalOpen(true);
      }
    } else {
      // 如果提供了自定义回调函数，则使用它
      if (onFolderUploadClick) {
        onFolderUploadClick();
      } else {
        // 否则使用默认行为
        setIsFolderModalOpen(true);
      }
    }
    // 无论哪种情况，都关闭下拉菜单
    setShowDropdown(false);
  };

  return (
    <div className={styles.uploadOptionsContainer} ref={uploadDropdownRef}>
      <button
        className={`${buttonStyles.uploadButton} ${showDropdown ? dropdownStyles.activeButton : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Upload size={18} className={buttonStyles.buttonIcon} />
        上传文件
        <ChevronDown size={16} className={dropdownStyles.dropdownIcon} />
      </button>
      
      {showDropdown && (
        <div className={dropdownStyles.dropdownMenu}>
          <div 
            className={dropdownStyles.dropdownItem}
            onClick={() => handleUploadClick('file')}
          >
            <Upload size={16} className="mr-2" />
            <span>上传文件</span>
          </div>
          <div 
            className={dropdownStyles.dropdownItem}
            onClick={() => handleUploadClick('folder')}
          >
            <Folder size={16} className="mr-2" />
            <span>上传文件夹</span>
          </div>
        </div>
      )}
    </div>
  );
} 