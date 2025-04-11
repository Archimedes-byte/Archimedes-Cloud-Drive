import React, { useRef } from 'react';
import { X, Download, Edit, Move } from 'lucide-react';
import { message } from 'antd';
import styles from './Toolbar.module.css';
import commonStyles from '../styles/common.module.css';

// 导入新的hooks替代旧的FileContext
import { useAppFiles } from '../hooks/useAppFiles';
import { useAppFileActions } from '../hooks/useAppFileActions';
import { useAppUIState } from '../hooks/useAppUIState';
import { useAppFilePreview } from '../hooks/useAppFilePreview';

interface ToolbarProps {
  onUploadClick: () => void;
  onFolderUploadClick: () => void;
  onCreateFolderClick: () => void;
}

/**
 * @deprecated 这个组件已被TopActionBar替代，仅作为参考保留
 */
export function Toolbar({ onUploadClick, onFolderUploadClick, onCreateFolderClick }: ToolbarProps) {
  // 使用新的hooks替代旧的FileContext
  const { files, selectedFiles, setSelectedFiles } = useAppFiles();
  const { handleDownload } = useAppFileActions();
  const { showUploadDropdown, setShowUploadDropdown } = useAppUIState();
  const { handleRenameButtonClick } = useAppFilePreview();
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 清除选择功能
  const clearSelection = () => {
    setSelectedFiles([]);
  };

  // 下载功能
  const handleDownloadClick = () => {
    if (selectedFiles.length === 1) {
      const fileToDownload = files.find(file => file.id === selectedFiles[0]);
      if (fileToDownload) {
        handleDownload(fileToDownload);
      }
    } else {
      message.info('下载功能仅支持单个文件下载');
    }
  };

  // 重命名功能
  const handleRenameClick = () => {
    if (selectedFiles.length !== 1) {
      message.warning('请选择一个文件进行重命名');
      return;
    }
    
    const fileToRename = files.find(file => file.id === selectedFiles[0]);
    if (fileToRename) {
      handleRenameButtonClick(fileToRename);
    }
  };

  return (
    <div className={styles.topBar}>
      <div className={styles.buttonGroup}>
        {selectedFiles.length > 0 ? (
          <>
            <button className={styles.topButton} onClick={clearSelection}>
              <X className={commonStyles.icon} />
              取消选择
            </button>
            <button className={styles.topButton} onClick={handleDownloadClick}>
              <Download className={commonStyles.icon} />
              下载
            </button>
            <button className={styles.topButton} onClick={handleRenameClick}>
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