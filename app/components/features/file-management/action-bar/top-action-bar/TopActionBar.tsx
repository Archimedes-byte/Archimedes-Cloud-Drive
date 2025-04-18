import React from 'react';
import { 
  X, Download, Edit, Move, Trash2, FolderUp, Image as ImageIcon, FileText, Video, Music, File, Share2 
} from 'lucide-react';
import styles from '@/app/file-management/styles/shared.module.css';
import { SortDropdown } from '@/app/components/features/file-management/action-bar/sort-dropdown';
import { UploadButton } from '@/app/components/features/file-management/upload/upload-button';
import { FileInfo, FileSortInterface, FileTypeEnum, SortDirectionEnum } from '@/app/types';
import { FolderDownloadButton } from '@/app/components/features/file-management/download/FolderDownloadButton';

export interface TopActionBarProps {
  selectedFiles: FileInfo[];
  onClearSelection: () => void;
  onDownload: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onShare: () => void;
  onClearFilter: () => void;
  onCreateFolder: () => void;
  selectedFileType: FileTypeEnum | null;
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
  onShare,
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
  // 检查是否只选择了一个文件夹
  const selectedFolder = selectedFiles.length === 1 && selectedFiles[0].isFolder ? selectedFiles[0] : null;
  
  return (
    <div className={styles.topBar}>
      <div className={styles.buttonGroup}>
        {selectedFiles.length > 0 ? (
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
        ) :
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
                    case FileTypeEnum.IMAGE: return <ImageIcon className="w-4 h-4 mr-2" />;
                    case FileTypeEnum.DOCUMENT: return <FileText className="w-4 h-4 mr-2" />;
                    case FileTypeEnum.VIDEO: return <Video className="w-4 h-4 mr-2" />;
                    case FileTypeEnum.AUDIO: return <Music className="w-4 h-4 mr-2" />;
                    default: return <File className="w-4 h-4 mr-2" />;
                  }
                })()}
                当前浏览：
                {selectedFileType === FileTypeEnum.IMAGE && '仅图片'}
                {selectedFileType === FileTypeEnum.DOCUMENT && '仅文档'}
                {selectedFileType === FileTypeEnum.VIDEO && '仅视频'}
                {selectedFileType === FileTypeEnum.AUDIO && '仅音频'}
                {selectedFileType === FileTypeEnum.UNKNOWN && '其他文件'}
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
            
            {/* 新建文件夹按钮 */}
            <button className={styles.topButton} onClick={onCreateFolder}>
              <span>📁</span>
              新建文件夹
            </button>
          </>
        }
      </div>
    </div>
  );
};

export default TopActionBar; 