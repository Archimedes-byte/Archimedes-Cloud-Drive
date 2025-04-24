import React, { useState, useRef, useEffect } from 'react';
import { 
  File as FileIcon, 
  Folder, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music, 
  MoreVertical,
  Tag as TagIcon,
  Check,
  X,
  Plus
} from 'lucide-react';
import styles from './FileGrid.module.css';
import { getFileType as getFileTypeDisplay } from '@/app/utils/file/type';
import { getFileNameAndExtension } from '@/app/utils/file/path';
import { FileInfo } from '@/app/types';

/**
 * 文件网格视图组件 - 重构版本
 * 该组件用于以网格视图展示文件列表
 */
interface FileGridProps {
  files: FileInfo[];
  selectedFiles: string[];
  onFileClick: (file: FileInfo) => void;
  onFileDoubleClick?: (file: FileInfo) => void;
  onFileContextMenu?: (event: React.MouseEvent, file: FileInfo) => void;
  onSelectFiles?: (fileIds: string[]) => void;
  onFileSelect?: (file: FileInfo, checked: boolean) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onSelectAllFiles?: () => void;
  onDeselectAllFiles?: () => void;
  fileTypeFilter?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onBackClick?: () => void;
  editingFileId?: string | null;
  editingFile?: string | null;
  editingName?: string;
  editingTags?: string[];
  newTag?: string;
  onNewTagChange?: (value: string) => void;
  onEditNameChange?: (value: string) => void;
  onStartEdit?: (file: FileInfo) => void;
  onConfirmEdit?: (fileId: string, newName: string, newTags: string[]) => void;
  onCancelEdit?: () => void;
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  showCheckboxes?: boolean;
  areAllSelected?: boolean;
}

export function FileGrid({
  files,
  selectedFiles,
  onFileClick,
  onFileDoubleClick,
  onFileContextMenu,
  onSelectFiles,
  onFileSelect,
  onSelectAll,
  onDeselectAll,
  onSelectAllFiles,
  onDeselectAllFiles,
  fileTypeFilter,
  isLoading,
  error,
  onBackClick,
  editingFileId,
  editingFile,
  editingName,
  editingTags = [],
  newTag = '',
  onNewTagChange,
  onEditNameChange,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  onAddTag,
  onRemoveTag,
  showCheckboxes = true,
  areAllSelected
}: FileGridProps) {
  const [localEditingName, setLocalEditingName] = useState<string>('');
  const actualEditingFileId = editingFileId || editingFile;
  
  // 初始化编辑状态
  useEffect(() => {
    if (actualEditingFileId && !editingName) {
      const editFile = files.find(f => f.id === actualEditingFileId);
      if (editFile) {
        setLocalEditingName(editFile.name);
      }
    }
  }, [actualEditingFileId, editingName, files]);
  
  const handleEditNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (onEditNameChange) {
      onEditNameChange(value);
    } else {
      setLocalEditingName(value);
    }
  };
  
  const handleAddTag = () => {
    if (onAddTag && newTag.trim()) {
      onAddTag(newTag.trim());
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    if (onRemoveTag) {
      onRemoveTag(tag);
    }
  };
  
  const renderFileIcon = (file: FileInfo) => {
    const extension = getFileNameAndExtension(file.name).extension;
    
    if (file.isFolder) return <Folder className={styles.folderIcon} />;
    
    if (file.type?.includes('image')) return <ImageIcon className={styles.imageIcon} />;
    if (file.type?.includes('video')) return <Video className={styles.videoIcon} />;
    if (file.type?.includes('audio')) return <Music className={styles.audioIcon} />;
    if (file.type?.includes('text') || file.type?.includes('document')) return <FileText className={styles.documentIcon} />;
    
    return <FileIcon className={styles.fileIcon} />;
  };
  
  if (isLoading) {
    return <div className={styles.fileGridLoading}>加载中...</div>;
  }
  
  if (error) {
    return <div className={styles.fileGridError}>错误: {error}</div>;
  }
  
  if (!files || files.length === 0) {
    return <div className={styles.emptyFileGrid}>暂无文件</div>;
  }
  
  return (
    <div className={styles.fileGrid}>
      {files.map(file => {
        const isSelected = selectedFiles.includes(file.id);
        const isEditing = actualEditingFileId === file.id;
        
        return (
          <div
            key={file.id}
            className={`${styles.fileGridItem} ${isSelected ? styles.selected : ''}`}
            onClick={() => onFileClick(file)}
            onDoubleClick={() => onFileDoubleClick && onFileDoubleClick(file)}
            onContextMenu={(e) => onFileContextMenu && onFileContextMenu(e, file)}
          >
            {showCheckboxes && (
              <div className={styles.fileGridCheckbox}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (onFileSelect) {
                      onFileSelect(file, e.target.checked);
                    } else if (onSelectFiles) {
                      if (e.target.checked) {
                        onSelectFiles([...selectedFiles, file.id]);
                      } else {
                        onSelectFiles(selectedFiles.filter(id => id !== file.id));
                      }
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            {renderFileIcon(file)}
            
            {isEditing ? (
              <>
                <input
                  type="text"
                  className={styles.editModeInput}
                  value={editingName || localEditingName}
                  onChange={handleEditNameChange}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onConfirmEdit && onConfirmEdit(file.id, editingName || localEditingName, editingTags);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      onCancelEdit && onCancelEdit();
                    }
                  }}
                  autoFocus
                />
                
                <div className={styles.tagContainer}>
                  {editingTags.map(tag => (
                    <div key={tag} className={styles.tag}>
                      {tag}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(tag);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  <input
                    type="text"
                    className={styles.addTagInput}
                    placeholder="添加标签"
                    value={newTag}
                    onChange={(e) => onNewTagChange && onNewTagChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  
                  <button
                    className={styles.addTagBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddTag();
                    }}
                  >
                    <Plus size={12} /> 添加
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.fileName}>{file.name}</div>
            )}
          </div>
        );
      })}
    </div>
  );
} 