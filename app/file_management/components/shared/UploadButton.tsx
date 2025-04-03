import React, { useState, useRef, useEffect } from 'react';
import { Upload, Folder, ChevronDown } from 'lucide-react';
import styles from '../../styles/shared.module.css';
import { UploadModal } from './UploadModal';

interface UploadButtonProps {
  currentFolderId: string | null;
  onUploadSuccess: () => void;
}

export function UploadButton({ currentFolderId, onUploadSuccess }: UploadButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFolderUpload, setIsFolderUpload] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    // 添加全局点击事件监听
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // 移除事件监听
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理上传按钮点击
  const handleUploadClick = (type: 'file' | 'folder') => {
    setIsFolderUpload(type === 'folder');
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.uploadOptionsContainer} ref={dropdownRef}>
      <button
        className={`${styles.uploadButton} ${isDropdownOpen ? styles.activeButton : ''}`}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <Upload size={18} className={styles.buttonIcon} />
        上传
        <ChevronDown size={16} className={styles.dropdownIcon} />
      </button>
      
      {isDropdownOpen && (
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

      {/* 上传模态框 */}
      {isModalOpen && (
        <UploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUploadSuccess={onUploadSuccess}
          isFolderUpload={isFolderUpload}
          currentFolderId={currentFolderId}
        />
      )}
    </div>
  );
} 