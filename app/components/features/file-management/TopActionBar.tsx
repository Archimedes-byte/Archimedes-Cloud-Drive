/**
 * @deprecated 此组件已迁移到新的组件架构中。
 * 请使用 @/app/components/features/file-management/actionBar/TopActionBar 组件。
 */

import React from 'react';
import { 
  X, Download, Edit, Move, Trash2, FolderUp, Image as ImageIcon, FileText, Video, Music, File 
} from 'lucide-react';
import styles from '@/app/file-management/styles/shared.module.css';
import SortDropdown from './SortDropdown';
import { UploadButton } from '@/app/components/features/file-management/upload/UploadButton';
import { FileSortInterface } from '@/app/types';

interface TopActionBarProps {
  selectedFiles: string[];
  onClearSelection: () => void;
  onDownload: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onClearFilter: () => void;
  onCreateFolder: () => void;
  selectedFileType: string | null;
  showSearchView: boolean;
  isInRootFolder: boolean;
  sortOrder: FileSortInterface;
  setSortOrder: (order: FileSortInterface) => void;
  showUploadDropdown: boolean;
  setShowUploadDropdown: (show: boolean) => void;
  setIsUploadModalOpen: (open: boolean) => void;
  setIsFolderUploadModalOpen: (open: boolean) => void;
  uploadDropdownRef: React.RefObject<HTMLDivElement>;
}

export const TopActionBar: React.FC<TopActionBarProps> = ({
  selectedFiles,
  onClearSelection,
  onDownload,
  onRename,
  onMove,
  onDelete,
  onClearFilter,
  onCreateFolder,
  selectedFileType,
  showSearchView,
  isInRootFolder,
  sortOrder,
  setSortOrder,
  showUploadDropdown,
  setShowUploadDropdown,
  setIsUploadModalOpen,
  setIsFolderUploadModalOpen,
  uploadDropdownRef
}) => {
  return (
    <div className={styles.topBar}>
      <div className={styles.buttonGroup}>
        {selectedFiles.length > 0 ? (
          <>
            <button className={styles.topButton} onClick={onClearSelection}>
              <X className="w-4 h-4" />
              取消选择
            </button>
            <button className={styles.topButton} onClick={onDownload}>
              <Download className="w-4 h-4" />
              下载
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
        ) : (
          <>
            <button 
              className={styles.topButton}
              onClick={onClearFilter}
              disabled={isInRootFolder}
            >
              <span>📁</span>
              {showSearchView ? '返回文件列表' : (selectedFileType ? '清除过滤' : '根目录')}
            </button>

            {/* 添加当前过滤状态指示器 */}
            {selectedFileType && (
              <div className={styles.topButton} style={{ cursor: 'default', background: '#f0f7ff', borderColor: '#60a5fa' }}>
                {(() => {
                  switch(selectedFileType) {
                    case 'image': return <ImageIcon className="w-4 h-4 mr-2" />;
                    case 'document': return <FileText className="w-4 h-4 mr-2" />;
                    case 'video': return <Video className="w-4 h-4 mr-2" />;
                    case 'audio': return <Music className="w-4 h-4 mr-2" />;
                    case 'other': return <File className="w-4 h-4 mr-2" />;
                    default: return null;
                  }
                })()}
                当前浏览：
                {selectedFileType === 'image' && '仅图片'}
                {selectedFileType === 'document' && '仅文档'}
                {selectedFileType === 'video' && '仅视频'}
                {selectedFileType === 'audio' && '仅音频'}
                {selectedFileType === 'other' && '其他文件'}
              </div>
            )}

            {/* 排序下拉菜单 */}
            <SortDropdown 
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />
            
            {/* 上传按钮 */}
            <UploadButton 
              showDropdown={showUploadDropdown}
              setShowDropdown={setShowUploadDropdown}
              setIsModalOpen={setIsUploadModalOpen}
              setIsFolderModalOpen={setIsFolderUploadModalOpen}
              uploadDropdownRef={uploadDropdownRef}
            />
            
            <button 
              className={styles.folderButton} 
              onClick={onCreateFolder}
            >
              <FolderUp className="w-4 h-4 mr-2" />
              新建文件夹
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TopActionBar; 