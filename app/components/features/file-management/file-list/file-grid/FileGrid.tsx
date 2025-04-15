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
  editingName: providedEditingName,
  editingTags: providedEditingTags,
  newTag: providedNewTag,
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
  const actualEditingFileId = editingFileId || editingFile;
  const [editName, setEditName] = useState(providedEditingName || '');
  const [editTags, setEditTags] = useState(providedEditingTags || []);
  const [newTag, setNewTag] = useState(providedNewTag || '');
  const editNameInputRef = useRef<HTMLInputElement>(null);

  // 当编辑状态改变时更新内部状态
  useEffect(() => {
    if (providedEditingName !== undefined) {
      setEditName(providedEditingName);
    }
    if (providedEditingTags !== undefined) {
      setEditTags(providedEditingTags);
    }
    if (providedNewTag !== undefined) {
      setNewTag(providedNewTag);
    }
  }, [providedEditingName, providedEditingTags, providedNewTag]);

  // 当开始编辑时聚焦输入框
  useEffect(() => {
    if (actualEditingFileId && editNameInputRef.current) {
      editNameInputRef.current.focus();
      editNameInputRef.current.select();
    }
  }, [actualEditingFileId]);

  // 处理文件选择
  const handleFileCheckboxChange = (file: FileInfo, checked: boolean) => {
    if (onFileSelect) {
      onFileSelect(file, checked);
    } else if (onSelectFiles) {
      const newSelectedFiles = checked
        ? [...selectedFiles, file.id]
        : selectedFiles.filter(id => id !== file.id);
      onSelectFiles(newSelectedFiles);
    }
  };

  // 处理编辑模式下的键盘事件
  const handleEditKeyDown = (e: React.KeyboardEvent, fileId: string) => {
    if (e.key === 'Enter' && onConfirmEdit) {
      e.preventDefault();
      onConfirmEdit(fileId, editName, editTags);
    } else if (e.key === 'Escape' && onCancelEdit) {
      e.preventDefault();
      onCancelEdit();
    }
  };

  // 处理标签输入框的键盘事件
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim() && onAddTag) {
      e.preventDefault();
      onAddTag(newTag.trim());
    }
  };

  // 处理新标签变更
  const handleNewTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewTag(value);
    if (onNewTagChange) {
      onNewTagChange(value);
    }
  };

  // 处理名称变更
  const handleEditNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditName(value);
    if (onEditNameChange) {
      onEditNameChange(value);
    }
  };

  // 渲染文件图标
  const renderFileIcon = (type: string, extension: string, isFolder: boolean) => {
    if (isFolder) {
      return <Folder className={styles.folderIcon} />;
    }
    
    switch (type) {
      case 'image':
        return <ImageIcon className={styles.imageIcon} />;
      case 'document':
        return <FileText className={styles.documentIcon} />;
      case 'video':
        return <Video className={styles.videoIcon} />;
      case 'audio':
        return <Music className={styles.audioIcon} />;
      default:
        return <FileIcon className={styles.fileIcon} />;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.fileGridLoading}>
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.fileGridError}>
        <p>{error}</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className={styles.emptyFileGrid}>
        <p>没有文件</p>
      </div>
    );
  }

  return (
    <div className={styles.fileGridContainer}>
      {showCheckboxes && (
        <div className={styles.fileGridHeader}>
          <div className={styles.selectAllContainer}>
            <input
              type="checkbox"
              checked={areAllSelected || false}
              onChange={(e) => {
                e.target.checked ? onSelectAll && onSelectAll() : onDeselectAll && onDeselectAll();
              }}
            />
            <span>全选</span>
          </div>
        </div>
      )}
      
      <div className={styles.fileGrid}>
        {files.map((file) => {
          const isSelected = selectedFiles.includes(file.id);
          const isEditing = actualEditingFileId === file.id;
          
          return (
            <div
              key={file.id}
              className={`${styles.fileGridItem} ${isSelected ? styles.selectedItem : ''} ${isEditing ? styles.editingItem : ''}`}
              onClick={() => !isEditing && onFileClick(file)}
              onDoubleClick={() => {
                if (!isEditing && onStartEdit && !file.isFolder) {
                  onStartEdit(file);
                } else if (!isEditing && onFileDoubleClick) {
                  onFileDoubleClick(file);
                }
              }}
              onContextMenu={(e) => {
                if (onFileContextMenu && !isEditing) {
                  e.preventDefault();
                  onFileContextMenu(e, file);
                }
              }}
            >
              {showCheckboxes && (
                <div className={styles.fileCheckbox} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleFileCheckboxChange(file, e.target.checked)}
                  />
                </div>
              )}
              
              <div className={styles.fileGridIconContainer}>
                {renderFileIcon(file.type, file.extension || '', file.isFolder || false)}
              </div>
              
              <div className={styles.fileGridDetails}>
                {isEditing ? (
                  <input
                    ref={editNameInputRef}
                    type="text"
                    className={styles.fileNameInput}
                    value={editName}
                    onChange={handleEditNameChange}
                    onKeyDown={(e) => handleEditKeyDown(e, file.id)}
                    onClick={(e) => e.stopPropagation()}
                    autoComplete="off"
                  />
                ) : (
                  <div className={styles.fileName}>{file.name}</div>
                )}
                
                <div className={styles.fileSize}>
                  {!file.isFolder ? getFileTypeDisplay(file.type, file.extension || '') : '文件夹'}
                </div>
              </div>
              
              {isEditing && (
                <div className={styles.editActions}>
                  <button 
                    className={`${styles.editActionButton} ${styles.saveButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmEdit && onConfirmEdit(file.id, editName, editTags);
                    }}
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    className={`${styles.editActionButton} ${styles.cancelButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelEdit && onCancelEdit();
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              {!isEditing && (
                <div className={styles.fileActions}>
                  <button 
                    className={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onFileContextMenu) {
                        onFileContextMenu(e as unknown as React.MouseEvent, file);
                      }
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 