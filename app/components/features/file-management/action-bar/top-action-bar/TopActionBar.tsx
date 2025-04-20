import React, { useEffect, useRef } from 'react';
import { 
  X, Download, Edit, Move, Trash2, FolderUp, Image as ImageIcon, FileText, Video, Music, File, Share2, Upload 
} from 'lucide-react';
import styles from '@/app/file-management/styles/shared.module.css';
import { SortDropdown } from '@/app/components/features/file-management/action-bar/sort-dropdown';
import { UploadButton } from '@/app/components/features/file-management/upload/upload-button';
import { FileInfo, FileSortInterface, FileTypeEnum, SortDirectionEnum } from '@/app/types';
import { FolderDownloadButton } from '@/app/components/features/file-management/download/FolderDownloadButton';
import ReactDOM from 'react-dom';

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
  onSortChange: (order: FileSortInterface) => void;
  showUploadDropdown: boolean;
  setShowUploadDropdown: (show: boolean) => void;
  setIsUploadModalOpen: (open: boolean) => void;
  setIsFolderUploadModalOpen: (open: boolean) => void;
  uploadDropdownRef: React.RefObject<HTMLDivElement>;
  onUploadClick?: () => void;
  onFolderUploadClick?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
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
  onSortChange,
  showUploadDropdown = false,
  setShowUploadDropdown = () => {},
  setIsUploadModalOpen = () => {},
  setIsFolderUploadModalOpen = () => {},
  uploadDropdownRef,
  onUploadClick,
  onFolderUploadClick,
  onRefresh,
  isRefreshing = false
}) => {
  // 检查是否只选择了一个文件夹
  const selectedFolder = selectedFiles.length === 1 && selectedFiles[0].isFolder ? selectedFiles[0] : null;
  
  // 创建本地ref引用以在组件内部追踪下拉菜单
  const localDropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = uploadDropdownRef || localDropdownRef;
  
  // 添加点击外部关闭下拉菜单的效果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // 检查setShowUploadDropdown是否为函数
        if (typeof setShowUploadDropdown === 'function') {
          setShowUploadDropdown(false);
        }
      }
    };
    
    // 添加点击事件监听器
    document.addEventListener('mousedown', handleClickOutside);
    
    // 清理
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef, setShowUploadDropdown]);
  
  // 处理根目录按钮点击
  const handleRootDirClick = (e: React.MouseEvent) => {
    // 如果当前不在根目录，才执行回调
    if (!isInRootFolder) {
      // 确保onClearFilter是一个函数再调用
      if (typeof onClearFilter === 'function') {
        onClearFilter();
      } else {
        console.warn('根目录按钮点击回调函数未定义');
      }
    }
  };
  
  // 处理上传按钮点击
  const handleUploadButtonClick = (e: React.MouseEvent) => {
    // 直接调用上传回调，如果提供了回调函数
    if (onUploadClick) {
      onUploadClick();
    } else {
      // 否则显示模态窗口
      setIsUploadModalOpen(true);
    }
    // 阻止事件冒泡
    e.stopPropagation();
  };
  
  // 安全设置下拉菜单状态
  const toggleDropdown = (value: boolean) => {
    if (typeof setShowUploadDropdown === 'function') {
      setShowUploadDropdown(value);
    }
  };
  
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
              onClick={handleRootDirClick}
              disabled={isInRootFolder}
              style={isInRootFolder ? { pointerEvents: 'none' } : {}}
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
              sortOrder={sortOrder || { field: 'createdAt', direction: SortDirectionEnum.DESC }}
              onSortChange={(newSortOrder) => {
                console.log('TopActionBar 接收到排序变更:', newSortOrder);
                if (typeof onSortChange === 'function') {
                  onSortChange(newSortOrder);
                  console.log('调用了onSortChange函数');
                } else {
                  console.warn('TopActionBar: onSortChange不是一个函数');
                }
              }}
            />
            
            {/* 上传文件按钮 - 独立按钮设计 */}
            <button 
              className={styles.topButton}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onUploadClick) {
                  onUploadClick();
                } else {
                  setIsUploadModalOpen(true);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Upload size={16} />
              上传文件
            </button>
            
            {/* 上传文件夹按钮 - 独立按钮 */}
            <button 
              className={styles.topButton}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onFolderUploadClick) {
                  onFolderUploadClick();
                } else {
                  setIsFolderUploadModalOpen(true);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FolderUp size={16} />
              上传文件夹
            </button>
            
            {/* 新建文件夹按钮 */}
            <button className={styles.topButton} onClick={onCreateFolder}>
              <span>📁</span>
              新建文件夹
            </button>
            
            {/* 刷新按钮 */}
            {onRefresh && (
              <button 
                className={`${styles.topButton} ${isRefreshing ? styles.refreshing : ''}`} 
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <svg 
                  className={`${isRefreshing ? styles.rotating : ''}`} 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                </svg>
                刷新
              </button>
            )}
          </>
        }
      </div>
    </div>
  );
};

export default TopActionBar; 