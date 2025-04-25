import React from 'react';
import { 
  Image as ImageIcon, FileText, Video, Music, File
} from 'lucide-react';
import { Button, Tag } from '@/app/components/ui/ant';
import { FileSortInterface, FileTypeEnum, SortDirectionEnum } from '@/app/types';
import { SortDropdown } from '@/app/components/features/file-management/action-bar/sort-dropdown';

interface FileBrowseActionsProps {
  selectedFileType: FileTypeEnum | null;
  showSearchView: boolean;
  isInRootFolder: boolean;
  onClearFilter: () => void;
  sortOrder: FileSortInterface;
  onSortChange: (order: FileSortInterface) => void;
}

/**
 * 文件浏览操作组件 - 负责显示文件浏览相关的操作按钮和状态
 */
export const FileBrowseActions: React.FC<FileBrowseActionsProps> = ({
  selectedFileType,
  showSearchView,
  isInRootFolder,
  onClearFilter,
  sortOrder,
  onSortChange
}) => {
  // 处理根目录按钮点击
  const handleRootDirClick = () => {
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

  return (
    <>
      <Button 
        variant="ghost"
        onClick={handleRootDirClick}
        disabled={isInRootFolder}
        icon={<span>📁</span>}
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
        sortOrder={sortOrder || { field: 'createdAt', direction: SortDirectionEnum.DESC }}
        onSortChange={(newSortOrder) => {
          if (typeof onSortChange === 'function') {
            onSortChange(newSortOrder);
          } else {
            console.warn('FileBrowseActions: onSortChange不是一个函数');
          }
        }}
      />
    </>
  );
}; 