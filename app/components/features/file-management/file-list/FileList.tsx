import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Check,
  X,
  Plus,
  CheckSquare,
  Square,
  Star
} from 'lucide-react';
import styles from './FileList.module.css';
import { getFileNameAndExtension } from '@/app/utils/file/path';
import { FileInfo } from '@/app/types';
import { formatFileSize } from '@/app/utils/file/format';
import { createCancelableDebounce } from '@/app/utils/function/debounce';
import FavoriteModal from '../favorites/FavoriteModal';

/**
 * 文件列表组件 - 重构版本
 * 该组件整合了原来的file-list/FileList.tsx的功能
 */
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
  favoritedFileIds?: string[];
  onToggleFavorite?: (file: FileInfo, isFavorite: boolean) => void;
  fileUpdateTrigger?: number;
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
  areAllSelected,
  favoritedFileIds = [],
  onToggleFavorite,
  fileUpdateTrigger = 0
}: FileListProps) {
  const actualEditingFileId = editingFileId || editingFile;

  const [localEditName, setLocalEditName] = useState<string>('');
  const [localEditTags, setLocalEditTags] = useState<string[]>([]);
  const [localNewTag, setLocalNewTag] = useState<string>('');
  const [favoriteModalVisible, setFavoriteModalVisible] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileInfo | null>(null);
  
  const editName = providedEditingName !== undefined ? providedEditingName : localEditName;
  const editTags = providedEditingTags !== undefined ? providedEditingTags : localEditTags;
  const newTagValue = providedNewTag !== undefined ? providedNewTag : localNewTag;
  
  const filesMemoized = useMemo(() => files, [
    files.map(f => f.id).join(','), 
    files.map(f => f.name).join(','),
    fileUpdateTrigger
  ]);
  
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

  const focusNameInputRef = useRef<((args?: any) => void) | undefined>(undefined);
  const focusTagInputRef = useRef<((args?: any) => void) | undefined>(undefined);

  useEffect(() => {
    if (actualEditingFileId && providedEditingName === undefined) {
      const file = files.find(f => f.id === actualEditingFileId);
      if (file) {
        setLocalEditName(file.name);
        setLocalEditTags(file.tags || []);
      }
    }
    
    if (actualEditingFileId) {
      const { debouncedFn, cancel } = createCancelableDebounce(() => {
        if (editNameInputRef.current) {
          editNameInputRef.current.focus();
          editNameInputRef.current.select();
        }
      }, 0);
      
      focusNameInputRef.current = debouncedFn;
      debouncedFn();
      
      return () => cancel();
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
      
      if (!focusTagInputRef.current) {
        const { debouncedFn } = createCancelableDebounce(() => {
          if (newTagInputRef.current) {
            newTagInputRef.current.focus();
          }
        }, 0);
        
        focusTagInputRef.current = debouncedFn;
      }
      
      if (focusTagInputRef.current) {
        focusTagInputRef.current();
      }
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
    if (!file.tags || file.tags.length === 0) return null;
    
    const displayTags = file.tags.slice(0, 2);
    const extraTagsCount = file.tags.length - displayTags.length;
    
    return (
      <div className={styles.tagContainer}>
        {displayTags.map(tag => (
          <span key={tag} className={styles.tag}>{tag}</span>
        ))}
        {extraTagsCount > 0 && (
          <span className={styles.extraTagsCount}>+{extraTagsCount}</span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.fileListWrapper}>
        <table className={styles.fileTable}>
          <thead>
            <tr>
              {showCheckboxes && <th style={{ width: '40px' }}></th>}
              <th>名称</th>
              <th>标签</th>
              <th>修改日期</th>
              <th>大小</th>
              <th style={{ width: '40px' }}></th>
              {onToggleFavorite && <th style={{ width: '40px' }}></th>}
            </tr>
          </thead>
        </table>
        <div className={styles.loadingText}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return <div className={styles.emptyText}>加载出错: {error}</div>;
  }

  if (!files || files.length === 0) {
    const getEmptyStateMessage = () => {
      if (fileTypeFilter) {
        return `没有匹配的${
          fileTypeFilter === 'folder' ? '文件夹' : 
          fileTypeFilter === 'image' ? '图片' : 
          fileTypeFilter === 'video' ? '视频' : 
          fileTypeFilter === 'audio' ? '音频' : 
          fileTypeFilter === 'document' ? '文档' : '文件'
        }`;
      }
      return '暂无文件';
    };
    
    const getEmptyStateIcon = () => {
      if (fileTypeFilter) {
        return <SearchX size={48} className={styles.emptyIcon} />;
      }
      return <Folder size={48} className={styles.emptyIcon} />;
    };
    
    const getEmptyStateHint = () => {
      if (fileTypeFilter) {
        return '尝试其他过滤条件或上传一些文件';
      }
      return '点击左上角的"上传"按钮开始添加文件';
    };
    
    return (
      <div className={styles.emptyState}>
        {getEmptyStateIcon()}
        <div className={styles.emptyStateText}>{getEmptyStateMessage()}</div>
        <div className={styles.emptyStateHint}>{getEmptyStateHint()}</div>
      </div>
    );
  }

  const handleFavoriteClick = (e: React.MouseEvent, file: FileInfo) => {
    e.stopPropagation();
    
    if (onToggleFavorite) {
      const isFavorite = favoritedFileIds.includes(file.id);
      
      if (!isFavorite) {
        // 设置当前文件作为收藏项
        setCurrentFile(file);
        // 显示收藏modal，让用户选择收藏夹
        setFavoriteModalVisible(true);
      } else {
        // 直接移除收藏
        onToggleFavorite(file, false);
      }
    }
  };
  
  const handleFavoriteSuccess = () => {
    if (currentFile && onToggleFavorite) {
      onToggleFavorite(currentFile, true);
    }
    setFavoriteModalVisible(false);
  };

  return (
    <>
      <div className={styles.fileListWrapper}>
        <div className={styles.fileListContainer}>
          <table className={styles.fileTable}>
            <thead>
              <tr>
                {showCheckboxes && (
                  <th style={{ width: '40px' }}>
                    {(handleSelectAll && handleDeselectAll) && (
                      <div className={styles.checkAllContainer}>
                        {areAllSelected ? (
                          <CheckSquare
                            size={18}
                            onClick={handleDeselectAll}
                            className={styles.checkAllIcon}
                          />
                        ) : (
                          <Square
                            size={18}
                            onClick={handleSelectAll}
                            className={styles.checkAllIcon}
                          />
                        )}
                      </div>
                    )}
                  </th>
                )}
                <th>名称</th>
                <th>标签</th>
                <th>修改日期</th>
                <th>大小</th>
                <th style={{ width: '40px' }}></th>
                {onToggleFavorite && <th style={{ width: '40px' }}></th>}
              </tr>
            </thead>
            <tbody>
              {filesMemoized.map((file) => {
                const { name, extension } = getFileNameAndExtension(file.name);
                const isEditing = actualEditingFileId === file.id;
                const isSelected = selectedFiles.includes(file.id);
                const isFavorite = favoritedFileIds.includes(file.id);
                
                return (
                  <tr
                    key={file.id}
                    className={`${styles.fileRow} 
                      ${isSelected ? styles.selectedRow : ''} 
                      ${isEditing ? styles.editingRow : ''}`
                    }
                    onClick={() => onFileClick(file)}
                    onDoubleClick={() => onFileDoubleClick && onFileDoubleClick(file)}
                    onContextMenu={(e) => onFileContextMenu && onFileContextMenu(e, file)}
                  >
                    {showCheckboxes && (
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleFileCheckboxChange(file, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    <td className={styles.fileNameCell}>
                      <div className={styles.fileListItem}>
                        {renderFileIcon(file.type, extension, file.isFolder)}
                        {isEditing ? (
                          <input
                            ref={editNameInputRef}
                            type="text"
                            className={styles.fileNameInput}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, file.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className={styles.fileName}>
                            {file.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={styles.tagsCell}>
                      {isEditing ? (
                        <div className={styles.tagEditContainer}>
                          <div className={styles.editTagsList}>
                            {editTags.map(tag => (
                              <div className={styles.editTag} key={tag}>
                                {tag}
                                <button 
                                  className={styles.removeTagButton} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTag(tag);
                                  }}
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
                              className={styles.tagInput}
                              value={newTagValue}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="添加标签"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={handleTagKeyDown}
                            />
                            <button
                              className={styles.addTagButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddTag();
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        renderTags(file)
                      )}
                    </td>
                    <td>
                      {file.updatedAt
                        ? new Date(file.updatedAt).toLocaleString('zh-CN', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'}
                    </td>
                    <td>
                      {file.isFolder ? '-' : formatFileSize(file.size || 0)}
                    </td>
                    <td>
                      {isEditing ? (
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
                      ) : onStartEdit ? (
                        <button
                          className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartEdit(file);
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>
                      ) : null}
                    </td>
                    {onToggleFavorite && (
                      <td className={styles.favoriteCell}>
                        <button
                          className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`}
                          onClick={(e) => handleFavoriteClick(e, file)}
                          aria-label={isFavorite ? "取消收藏" : "添加到收藏"}
                        >
                          <Star 
                            size={16} 
                            className={isFavorite ? styles.favoriteIcon : styles.unfavoriteIcon}
                            fill={isFavorite ? "var(--theme-primary, #3b82f6)" : "transparent"}
                          />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Favorite Modal Component */}
      {favoriteModalVisible && currentFile && (
        <FavoriteModal 
          visible={favoriteModalVisible}
          onClose={() => setFavoriteModalVisible(false)}
          onSuccess={handleFavoriteSuccess}
          fileId={currentFile.id}
          fileName={currentFile.name}
        />
      )}
    </>
  );
} 