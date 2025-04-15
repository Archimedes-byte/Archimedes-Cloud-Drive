import React, { useState, useRef, useEffect } from 'react';
import { Upload, Folder, ChevronDown } from 'lucide-react';
import styles from '@/app/file-management/styles/shared.module.css';

interface UploadButtonProps {
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  setIsModalOpen: (open: boolean) => void;
  setIsFolderModalOpen: (open: boolean) => void;
  uploadDropdownRef: React.RefObject<HTMLDivElement>;
}

export function UploadButton({ 
  showDropdown, 
  setShowDropdown, 
  setIsModalOpen, 
  setIsFolderModalOpen,
  uploadDropdownRef 
}: UploadButtonProps) {
  
  // 处理上传按钮点击
  const handleUploadClick = (type: 'file' | 'folder') => {
    if (type === 'file') {
      setIsModalOpen(true);
    } else {
      setIsFolderModalOpen(true);
    }
    setShowDropdown(false);
  };

  return (
    <div className={styles.uploadOptionsContainer} ref={uploadDropdownRef}>
      <button
        className={`${styles.uploadButton} ${showDropdown ? styles.activeButton : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Upload size={18} className={styles.buttonIcon} />
        上传文件
        <ChevronDown size={16} className={styles.dropdownIcon} />
      </button>
      
      {showDropdown && (
        <div className={styles.dropdownMenu}>
          <div 
            className={styles.dropdownItem}
            onClick={() => handleUploadClick('file')}
          >
            <Upload size={16} className="mr-2" />
            <span>上传文件</span>
          </div>
          <div 
            className={styles.dropdownItem}
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