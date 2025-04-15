/**
 * @deprecated 此组件已迁移到新的组件架构中。
 * 请使用 @/app/components/features/fileManagement/fileList/FileList 组件。
 */

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
  SearchX,
  Filter,
  Check,
  X,
  Plus
} from 'lucide-react';
import styles from '../../styles/shared.module.css';
import { getFileType as getFileTypeDisplay } from '@/app/utils/file/type';
import { getFileNameAndExtension } from '@/app/utils/file/path';
import { FileInfo } from '@/app/types';

interface FileListProps {
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

export function FileList({
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
}: FileListProps) {
  const actualEditingFileId = editingFileId || editingFile;

  const [localEditName, setLocalEditName] = useState<string>('');
  const [localEditTags, setLocalEditTags] = useState<string[]>([]);
  const [localNewTag, setLocalNewTag] = useState<string>('');
  
  const editName = providedEditingName !== undefined ? providedEditingName : localEditName;
  const editTags = providedEditingTags !== undefined ? providedEditingTags : localEditTags;
  const newTagValue = providedNewTag !== undefined ? providedNewTag : localNewTag;
  
  const setEditName = (value: string) => {
    if (onEditNameChange) {
      onEditNameChange(value);
    } else {
      setLocalEditName(value);
    }
  };
  
  const setEditTags = (tags: string[]) => {
    setLocalEditTags(tags);
  };
  
  const setNewTag = (value: string) => {
    if (onNewTagChange) {
      onNewTagChange(value);
    } else {
      setLocalNewTag(value);
    }
  };

  const editNameInputRef = useRef<HTMLInputElement>(null);
  const newTagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actualEditingFileId && providedEditingName === undefined) {
      const file = files.find(f => f.id === actualEditingFileId);
      if (file) {
        setLocalEditName(file.name);
        setLocalEditTags(file.tags || []);
      }
    }
    
    if (actualEditingFileId) {
      setTimeout(() => {
        if (editNameInputRef.current) {
          editNameInputRef.current.focus();
          editNameInputRef.current.select();
        }
      }, 0);
    }
  }, [actualEditingFileId, files, providedEditingName]);

  const handleEditKeyDown = (e: React.KeyboardEvent, fileId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirmEdit && onConfirmEdit(fileId, editName, editTags);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit && onCancelEdit();
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTagValue.trim();
    if (!trimmedTag) return;
    
    if (!editTags.includes(trimmedTag)) {
      if (onAddTag) {
        onAddTag(trimmedTag);
      } else {
        setEditTags([...editTags, trimmedTag]);
      }
      setNewTag('');
      
      setTimeout(() => {
        if (newTagInputRef.current) {
          newTagInputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (onRemoveTag) {
      onRemoveTag(tagToRemove);
    } else {
      setEditTags(editTags.filter(tag => tag !== tagToRemove));
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFileCheckboxChange = (file: FileInfo, checked: boolean) => {
    if (onFileSelect) {
      onFileSelect(file, checked);
      return;
    }
    
    if (onSelectFiles) {
      if (checked) {
        onSelectFiles([...selectedFiles, file.id]);
      } else {
        onSelectFiles(selectedFiles.filter(id => id !== file.id));
      }
    } else {
      console.error('FileList: 缺少必要的onSelectFiles或onFileSelect回调函数');
    }
  };

  const handleSelectAll = onSelectAll || onSelectAllFiles;
  const handleDeselectAll = onDeselectAll || onDeselectAllFiles;

  const renderFileIcon = (type?: string, extension?: string, isFolder?: boolean) => {
    if (isFolder) return <Folder className={styles.fileIcon} />;
    
    const getFileIconType = () => {
      if (!type) return 'file';
      
      if (type.includes('image')) return 'image';
      if (type.includes('text') || type.includes('document') || extension?.match(/docx?|pdf|txt|md/i)) return 'file-text';
      if (type.includes('video')) return 'video';
      if (type.includes('audio')) return 'music';
      if (extension?.match(/zip|rar|7z|tar|gz/i)) return 'archive';
      if (extension?.match(/js|ts|jsx|tsx|py|java|c|cpp|go|rb|php|html|css/i)) return 'code';
      
      return 'file';
    };
    
    const iconType = getFileIconType();
    const IconComponent = {
      'folder': Folder,
      'file': FileIcon,
      'image': ImageIcon,
      'file-text': FileText,
      'video': Video,
      'music': Music,
      'archive': FileIcon,
      'code': FileIcon
    }[iconType] || FileIcon;

    return <IconComponent className={styles.fileIcon} />;
  };

  const renderTags = (file: FileInfo) => {
    const tags = file.tags || [];
    
    if (actualEditingFileId === file.id) {
      return (
        <div className={styles.tagEditContainer}>
          <div className={styles.editTagsList}>
            {editTags.map((tag, index) => (
              <div key={index} className={styles.editTag}>
                <span>{tag}</span>
                <button 
                  className={styles.removeTagButton}
                  onClick={() => handleRemoveTag(tag)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className={styles.addTagInput}>
            <input
              ref={newTagInputRef}
              type="text"
              placeholder="添加标签..."
              value={localNewTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className={styles.tagInput}
            />
            <button 
              className={styles.addTagButton}
              onClick={handleAddTag}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      );
    }
    
    if (!tags || tags.length === 0) return <span className={styles.emptyText}>-</span>;
    
    const maxTagsToShow = 3;
    const visibleTags = tags.slice(0, maxTagsToShow);
    const extraTagsCount = tags.length - maxTagsToShow;
    
    return (
      <div className={styles.tagContainer}>
        {visibleTags.map((tag, index) => (
          <span key={index} className={styles.tag}>
            {tag}
          </span>
        ))}
        {extraTagsCount > 0 && (
          <span className={styles.extraTagsCount}>+{extraTagsCount}</span>
        )}
      </div>
    );
  };

  const isAllSelected = areAllSelected !== undefined 
    ? areAllSelected 
    : (files.length > 0 && selectedFiles.length === files.length);

  if (!Array.isArray(files) || files.length === 0) {
    const getEmptyStateMessage = () => {
      if (fileTypeFilter) {
        switch(fileTypeFilter) {
          case 'image':
            return `您的存储空间中没有找到图片文件`;
          case 'document':
            return `您的存储空间中没有找到文档文件`;
          case 'video':
            return `您的存储空间中没有找到视频文件`;
          case 'audio':
            return `您的存储空间中没有找到音频文件`;
          case 'other':
            return `您的存储空间中没有找到其他类型的文件`;
          default:
            return `没有找到${fileTypeFilter}类型的文件`;
        }
      }
      return '没有文件';
    };

    const getEmptyStateIcon = () => {
      if (fileTypeFilter) {
        return <Filter size={50} stroke="#CBD5E0" />;
      }
      return <FileIcon size={50} stroke="#CBD5E0" />;
    };

    const getEmptyStateHint = () => {
      if (fileTypeFilter) {
        return `系统已搜索所有文件夹，未找到${
          fileTypeFilter === 'image' ? '图片' : 
          fileTypeFilter === 'document' ? '文档' : 
          fileTypeFilter === 'video' ? '视频' :
          fileTypeFilter === 'audio' ? '音频' : '该类型'
        }文件，您可以上传一些，或选择其他文件类型查看。`;
      }
      return '上传文件或创建文件夹以开始管理您的文件';
    };

    return (
      <div className={styles.emptyState}>
        {getEmptyStateIcon()}
        <p className={styles.emptyStateText}>{getEmptyStateMessage()}</p>
        <p className={styles.emptyStateHint}>
          {getEmptyStateHint()}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.fileListWrapper}>
      <div className={styles.fileListContainer}>
        <table className={styles.fileTable}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={isAllSelected ? 
                    () => handleDeselectAll && handleDeselectAll() : 
                    () => handleSelectAll && handleSelectAll()}
                  disabled={!showCheckboxes}
                />
              </th>
              <th>名称</th>
              <th>类型</th>
              <th>大小</th>
              <th>标签</th>
              <th>修改日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              const isSelected = selectedFiles.includes(file.id);
              const isEditing = actualEditingFileId === file.id;
              
              return (
                <tr
                  key={file.id}
                  className={`${styles.fileRow} ${isSelected ? styles.selectedRow : ''} ${isEditing ? styles.editingRow : ''}`}
                  onClick={() => !isEditing && onFileClick(file)}
                  onDoubleClick={() => {
                    if (!isEditing && onStartEdit && !file.isFolder) {
                      onStartEdit(file);
                    } else if (!isEditing && onFileDoubleClick) {
                      onFileDoubleClick(file);
                    }
                  }}
                  onContextMenu={(e) => !isEditing && onFileContextMenu && onFileContextMenu(e, file)}
                >
                  <td>
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleFileCheckboxChange(file, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isEditing}
                      />
                    )}
                  </td>
                  <td className={styles.fileNameCell}>
                    <span className={styles.fileIcon}>
                      {renderFileIcon(file.type, file.extension, file.isFolder)}
                    </span>
                    {isEditing ? (
                      <input
                        ref={editNameInputRef}
                        type="text"
                        className={styles.fileNameInput}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, file.id)}
                        onClick={(e) => e.stopPropagation()}
                        autoComplete="off"
                      />
                    ) : (
                      <span className={styles.fileName}>{file.name}</span>
                    )}
                    {isEditing && (
                      <div className={styles.editActions}>
                        <button 
                          className={styles.editActionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfirmEdit && onConfirmEdit(file.id, editName, editTags);
                          }}
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          className={styles.editActionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelEdit && onCancelEdit();
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td>{file.isFolder ? '文件夹' : 
                     file.type === 'document' ? '文档' : 
                     getFileTypeDisplay(file.type || null, file.extension)}</td>
                  <td>{file.size ? `${Math.round(file.size / 1024)} KB` : '-'}</td>
                  <td className={styles.tagsCell}>{renderTags(file)}</td>
                  <td>
                    {file.createdAt 
                      ? new Date(file.createdAt).toLocaleString() 
                      : '-'
                    }
                  </td>
                  <td>
                    {!isEditing ? (
                      <button 
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStartEdit) {
                            onStartEdit(file);
                          } else if (onFileContextMenu) {
                            onFileContextMenu(e, file);
                          }
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                    ) : (
                      <span className={styles.editingMessage}>编辑中</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}