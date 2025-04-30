import React from 'react';
import { 
  CloseOutlined, DownloadOutlined, EditOutlined, 
  SwapOutlined, DeleteOutlined, ShareAltOutlined 
} from '@ant-design/icons';
import { Button, Tag } from '@/app/components/ui/ant';
import { 
  Image as ImageIcon, FileText, Video, Music, 
  File, Upload, FolderUp 
} from 'lucide-react';
import { FileInfo, FileSortInterface, FileTypeEnum, SortDirectionEnum } from '@/app/types';
import SortDropdown from '@/app/components/features/file-management/action-bar/sort-dropdown';
import UploadDropdown from '@/app/components/features/file-management/action-bar/upload-dropdown';
import { FolderDownloadButton } from '@/app/components/features/file-management/download/FolderDownloadButton';
import layoutStyles from '@/app/components/features/file-management/styles/layout/layout.module.css';

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
}) => {
  // 检查是否选中了文件
  const hasSelectedFiles = selectedFiles.length > 0;
  
  // 检查是否只选择了一个文件夹
  const selectedFolder = selectedFiles.length === 1 && selectedFiles[0].isFolder ? selectedFiles[0] : null;
  
  return (
    <div className={layoutStyles.topBar}>
      <div className={`${layoutStyles.buttonGroup} ${layoutStyles.fixedWidthContainer}`}>
        {hasSelectedFiles ? (
          // 文件选中状态的菜单栏
          <div className={layoutStyles.unifiedActionContainer}>
            {/* 取消选择按钮 */}
            <Button 
              variant="text"
              onClick={onClearSelection}
              icon={<CloseOutlined className="text-white" />}
              style={{ minWidth: '100px', color: 'white' }}
              className="text-white hover:bg-white/10"
            >
              取消选择
            </Button>
            
            {/* 分隔 */}
            <div className={layoutStyles.spacer}></div>
            
            {/* 文件操作按钮 */}
            {selectedFolder ? (
              // 如果选择的是单个文件夹，使用增强下载组件
              <FolderDownloadButton
                folderId={selectedFolder.id}
                folderName={selectedFolder.name}
                buttonText="下载"
                showIcon={true}
                className="text-white hover:bg-white/10"
              />
            ) : (
              // 否则使用常规下载按钮
              <Button 
                variant="text"
                onClick={onDownload}
                icon={<DownloadOutlined className="text-white" />}
                style={{ minWidth: '80px', color: 'white' }}
                className="text-white hover:bg-white/10"
              >
                下载
              </Button>
            )}
            
            <Button 
              variant="text"
              onClick={onShare}
              icon={<ShareAltOutlined className="text-white" />}
              style={{ minWidth: '80px', color: 'white' }}
              className="text-white hover:bg-white/10"
            >
              分享
            </Button>
            
            <Button 
              variant="text"
              onClick={onRename}
              icon={<EditOutlined className="text-white" />}
              style={{ minWidth: '80px', color: 'white' }}
              className="text-white hover:bg-white/10"
            >
              重命名
            </Button>
            
            <Button 
              variant="text"
              onClick={onMove}
              icon={<SwapOutlined className="text-white" />}
              style={{ minWidth: '80px', color: 'white' }}
              className="text-white hover:bg-white/10"
            >
              移动
            </Button>
            
            <Button 
              variant="text"
              onClick={onDelete}
              icon={<DeleteOutlined className="text-white" />}
              style={{ minWidth: '80px', color: 'white' }}
              className="text-white hover:bg-white/10"
            >
              删除
            </Button>
          </div>
        ) : (
          // 未选中文件时的菜单栏
          <div className={layoutStyles.unifiedActionContainer}>
            {/* 文件浏览相关按钮 */}
            <Button 
              variant="text"
              onClick={() => {
                if (!isInRootFolder) {
                  onClearFilter();
                }
              }}
              disabled={isInRootFolder}
              icon={<span>📁</span>}
              style={{ minWidth: '80px', color: 'white' }}
              className="text-white hover:bg-white/10"
            >
              {showSearchView ? '返回文件列表' : (selectedFileType ? '清除过滤' : '根目录')}
            </Button>

            {/* 添加当前过滤状态指示器 */}
            {selectedFileType && (
              <Tag color="blue" style={{ padding: '4px 8px', height: 'auto', display: 'flex', alignItems: 'center' }}>
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
              </Tag>
            )}

            {/* 排序下拉菜单 */}
            <SortDropdown 
              sortOrder={sortOrder}
              onSortChange={onSortChange}
            />
            
            {/* 弹性间隔 */}
            <div className={layoutStyles.spacer}></div>
            
            {/* 上传下拉菜单按钮 */}
            <UploadDropdown
              setIsUploadModalOpen={setIsUploadModalOpen}
              setIsFolderUploadModalOpen={setIsFolderUploadModalOpen}
              onUploadClick={onUploadClick}
              onFolderUploadClick={onFolderUploadClick}
            />
            
            {/* 新建文件夹按钮 */}
            <Button 
              variant="text"
              onClick={onCreateFolder} 
              icon={<span>📁</span>}
              style={{ minWidth: '80px', color: 'white' }}
              className="text-white hover:bg-white/10"
            >
              新建文件夹
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBar; 