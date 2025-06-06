import React from 'react';
import { 
  CloseOutlined, DownloadOutlined, EditOutlined, 
  SwapOutlined, DeleteOutlined, ShareAltOutlined,
  FolderOutlined, UploadOutlined
} from '@ant-design/icons';
import { Button, Tag } from '@/app/components/ui/ant';
import { 
  Image as ImageIcon, FileText, Video, Music, 
  File
} from 'lucide-react';
import { FileInfo, FileSortInterface, FileTypeEnum, SortDirectionEnum } from '@/app/types';
import { UploadDropdown } from '@/app/components/features/file-management/action-bar/upload-dropdown';
import { FolderDownloadButton } from '@/app/components/features/file-management/download/FolderDownloadButton';
import layoutStyles from '@/app/components/features/file-management/styles/layout/layout.module.css';
import styles from './MenuBar.module.css';

export interface MenuBarProps {
  // 选中文件相关
  selectedFiles: FileInfo[];
  onClearSelection?: () => void;
  
  // 文件操作相关
  onDownload?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  
  // 文件浏览相关
  selectedFileType?: FileTypeEnum | null;
  showSearchView?: boolean;
  isInRootFolder?: boolean;
  onClearFilter?: () => void;
  sortOrder?: FileSortInterface;
  onSortChange?: (order: FileSortInterface) => void;
  
  // 上传相关
  setIsUploadModalOpen?: (open: boolean) => void;
  setIsFolderUploadModalOpen?: (open: boolean) => void;
  onUploadClick?: () => void;
  onFolderUploadClick?: () => void;
  onCreateFolder?: () => void;
  
  // 文件夹下载相关
  onRequestDownload?: (fileInfo: FileInfo) => void;
}

/**
 * 统一菜单栏组件
 * 整合了文件选中状态和未选中状态下的所有菜单栏按钮
 */
export const MenuBar: React.FC<MenuBarProps> = ({
  // 选中文件相关
  selectedFiles = [],
  onClearSelection = () => {},
  
  // 文件操作相关
  onDownload = () => {},
  onRename = () => {},
  onMove = () => {},
  onDelete = () => {},
  onShare = () => {},
  
  // 文件浏览相关
  selectedFileType = null,
  showSearchView = false,
  isInRootFolder = false,
  onClearFilter = () => {},
  sortOrder = { field: 'createdAt', direction: SortDirectionEnum.DESC },
  onSortChange = () => {},
  
  // 上传相关
  setIsUploadModalOpen = () => {},
  setIsFolderUploadModalOpen = () => {},
  onUploadClick,
  onFolderUploadClick,
  onCreateFolder = () => {},
  
  // 文件夹下载相关
  onRequestDownload = () => {},
}) => {
  // 检查是否选中了文件
  const hasSelectedFiles = selectedFiles.length > 0;
  
  // 检查是否只选择了一个文件夹
  const selectedFolder = selectedFiles.length === 1 && selectedFiles[0].isFolder ? selectedFiles[0] : null;
  
  // 自定义按钮样式类
  const buttonClassName = styles.triggerButton;
  
  return (
    <div className={layoutStyles.topBar}>
      <div className={layoutStyles.actionContainer}>
        {/* 左侧按钮组 */}
        <div className={layoutStyles.browseActionsContainer}>
          {hasSelectedFiles ? (
            // 文件选中状态的左侧按钮
            <button 
              className={buttonClassName}
              onClick={onClearSelection}
            >
              <CloseOutlined style={{ color: 'white' }} />
              <span style={{ color: 'white' }}>取消选择</span>
            </button>
          ) : (
            // 未选中状态的左侧按钮
            <>
              <button 
                className={buttonClassName}
                onClick={() => {
                  // 如果在搜索视图或有过滤器，则执行清除过滤
                  if (showSearchView || selectedFileType) {
                    onClearFilter();
                  } else if (!isInRootFolder) {
                    // 否则，如果不在根目录，则导航到根目录
                    onClearFilter(); // 这个函数在不显示搜索视图且没有文件类型选中时会返回根目录
                  }
                }}
                style={isInRootFolder ? { opacity: 0.7 } : {}}
                disabled={isInRootFolder && !selectedFileType && !showSearchView}
              >
                <FolderOutlined style={{ color: 'white' }} />
                <span style={{ color: 'white' }}>{showSearchView ? '返回文件列表' : (selectedFileType ? '清除过滤' : '根目录')}</span>
              </button>

              {/* 当前过滤状态指示器，美化成与按钮一致的样式 */}
              {selectedFileType && (
                <div className={buttonClassName} style={{ padding: '8px 12px' }}>
                  {(() => {
                    switch(selectedFileType) {
                      case FileTypeEnum.IMAGE: return <ImageIcon className="w-4 h-4 mr-2" style={{ color: 'white' }} />;
                      case FileTypeEnum.DOCUMENT: return <FileText className="w-4 h-4 mr-2" style={{ color: 'white' }} />;
                      case FileTypeEnum.VIDEO: return <Video className="w-4 h-4 mr-2" style={{ color: 'white' }} />;
                      case FileTypeEnum.AUDIO: return <Music className="w-4 h-4 mr-2" style={{ color: 'white' }} />;
                      default: return <File className="w-4 h-4 mr-2" style={{ color: 'white' }} />;
                    }
                  })()}
                  <span style={{ color: 'white' }}>
                    当前浏览：
                    {selectedFileType === FileTypeEnum.IMAGE && '仅图片'}
                    {selectedFileType === FileTypeEnum.DOCUMENT && '仅文档'}
                    {selectedFileType === FileTypeEnum.VIDEO && '仅视频'}
                    {selectedFileType === FileTypeEnum.AUDIO && '仅音频'}
                    {selectedFileType === FileTypeEnum.UNKNOWN && '其他文件'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
          
        {/* 右侧按钮组 */}
        <div className={layoutStyles.actionsGroup}>
          {hasSelectedFiles ? (
            // 选中文件状态下的右侧操作按钮
            <>
              {selectedFolder ? (
                // 如果选择的是单个文件夹，使用增强下载组件，修改为自定义样式
                <FolderDownloadButton
                  folderId={selectedFolder.id}
                  folderName={selectedFolder.name}
                  buttonText="下载"
                  showIcon={true}
                  className={buttonClassName}
                  onRequestDownload={onRequestDownload}
                />
              ) : (
                // 否则使用常规下载按钮
                <button 
                  className={buttonClassName}
                  onClick={onDownload}
                >
                  <DownloadOutlined style={{ color: 'white' }} />
                  <span style={{ color: 'white' }}>下载</span>
                </button>
              )}
              
              <button 
                className={buttonClassName}
                onClick={onShare}
              >
                <ShareAltOutlined style={{ color: 'white' }} />
                <span style={{ color: 'white' }}>分享</span>
              </button>
              
              <button 
                className={buttonClassName}
                onClick={onRename}
              >
                <EditOutlined style={{ color: 'white' }} />
                <span style={{ color: 'white' }}>重命名</span>
              </button>
              
              <button 
                className={buttonClassName}
                onClick={onMove}
              >
                <SwapOutlined style={{ color: 'white' }} />
                <span style={{ color: 'white' }}>移动</span>
              </button>
              
              <button 
                className={buttonClassName}
                onClick={onDelete}
              >
                <DeleteOutlined style={{ color: 'white' }} />
                <span style={{ color: 'white' }}>删除</span>
              </button>
            </>
          ) : (
            // 未选中文件状态下的右侧操作按钮
            <>
              {/* 恢复上传下拉菜单按钮 */}
              <UploadDropdown
                setIsUploadModalOpen={setIsUploadModalOpen}
                setIsFolderUploadModalOpen={setIsFolderUploadModalOpen}
                onUploadClick={onUploadClick}
                onFolderUploadClick={onFolderUploadClick}
              />
              
              {/* 新建文件夹按钮 */}
              <button 
                className={buttonClassName}
                onClick={onCreateFolder}
              >
                <FolderOutlined style={{ color: 'white' }} />
                <span style={{ color: 'white' }}>新建文件夹</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuBar; 