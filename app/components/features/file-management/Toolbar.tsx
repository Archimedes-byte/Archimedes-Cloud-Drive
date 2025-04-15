/**
 * @deprecated 此组件已迁移到新的组件架构中。
 * 请使用 @/app/components/features/file-management/toolbar/Toolbar 组件。
 */

import React, { useRef, useState } from 'react';
import { useFileContext } from '@/app/context/FileContext';
import { X, Download, Edit, Move } from 'lucide-react';
import { message } from 'antd';
import styles from './Toolbar.module.css';
import commonStyles from '@/app/styles/common.module.css';

interface ToolbarProps {
  onUploadClick: () => void;
  onFolderUploadClick: () => void;
  onCreateFolderClick: () => void;
}

export function Toolbar({ onUploadClick, onFolderUploadClick, onCreateFolderClick }: ToolbarProps) {
  const {
    selectedFiles,
    clearSelection,
    files
  } = useFileContext();

  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    // TODO: 实现文件下载功能
    message.info('下载功能开发中');
  };

  const handleRename = () => {
    if (selectedFiles.length !== 1) {
      message.warning('请选择一个文件进行重命名');
      return;
    }
    const selectedFile = files.find((file: any) => file.id === selectedFiles[0]);
    if (selectedFile) {
      // TODO: 实现重命名功能
      message.info('重命名功能开发中');
    }
  };

  return (
    <div className={styles.topBar}>
      <div className={styles.buttonGroup}>
        {selectedFiles.length > 0 ? (
          <>
            <button className={styles.topButton} onClick={() => clearSelection()}>
              <X className={commonStyles.icon} />
              取消选择
            </button>
            <button className={styles.topButton} onClick={handleDownload}>
              <Download className={commonStyles.icon} />
              下载
            </button>
            <button className={styles.topButton} onClick={handleRename}>
              <Edit className={commonStyles.icon} />
              重命名
            </button>
            <button className={styles.topButton}>
              <Move className={commonStyles.icon} />
              移动
            </button>
          </>
        ) : (
          <>
            <div className={styles.uploadDropdown} ref={dropdownRef}>
              <button
                className={styles.topButton}
                onClick={() => setShowUploadDropdown(!showUploadDropdown)}
              >
                <span className={styles.buttonIcon}>⬆️</span>
                上传
                <span className={styles.dropdownArrow}>▼</span>
              </button>
              {showUploadDropdown && (
                <div className={styles.dropdownMenu}>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      onUploadClick();
                      setShowUploadDropdown(false);
                    }}
                  >
                    <span className={styles.buttonIcon}>📄</span>
                    上传文件
                  </button>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      onFolderUploadClick();
                      setShowUploadDropdown(false);
                    }}
                  >
                    <span className={styles.buttonIcon}>📁</span>
                    上传文件夹
                  </button>
                </div>
              )}
            </div>
            <button
              className={styles.topButton}
              onClick={onCreateFolderClick}
            >
              <span className={styles.buttonIcon}>📁</span>
              新建文件夹
            </button>
          </>
        )}
      </div>
    </div>
  );
} 