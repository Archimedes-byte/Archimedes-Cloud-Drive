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

export interface FileItemType {
  id: string;
  name: string;
  type?: string;
  extension?: string;
  size?: number;
  isFolder?: boolean;
  createdAt?: string;
  uploadTime?: string;
  tags?: string[];
}

interface FileListProps {
  files: FileItemType[];
  selectedFiles: string[];
  onFileClick: (file: FileItemType) => void;
  onFileDoubleClick?: (file: FileItemType) => void;
  onFileContextMenu?: (event: React.MouseEvent, file: FileItemType) => void;
  onSelectFiles: (fileIds: string[]) => void;
  onSelectAllFiles?: () => void;
  onDeselectAllFiles?: () => void;
  fileTypeFilter?: string | null;
  // 行内编辑相关props
  editingFileId?: string | null;
  onStartEdit?: (file: FileItemType) => void;
  onConfirmEdit?: (fileId: string, newName: string, newTags: string[]) => void;
  onCancelEdit?: () => void;
}

export function FileList({
  files,
  selectedFiles,
  onFileClick,
  onFileDoubleClick,
  onFileContextMenu,
  onSelectFiles,
  onSelectAllFiles,
  onDeselectAllFiles,
  fileTypeFilter,
  // 行内编辑相关props
  editingFileId,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit
}: FileListProps) {
  // 行内编辑状态
  const [editName, setEditName] = useState<string>('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const editNameInputRef = useRef<HTMLInputElement>(null);
  const newTagInputRef = useRef<HTMLInputElement>(null);

  // 当编辑的文件ID变化时，更新编辑状态
  useEffect(() => {
    if (editingFileId) {
      const file = files.find(f => f.id === editingFileId);
      if (file) {
        setEditName(file.name);
        setEditTags(file.tags || []);
      }
      // 聚焦到文件名输入框
      setTimeout(() => {
        if (editNameInputRef.current) {
          editNameInputRef.current.focus();
          editNameInputRef.current.select();
        }
      }, 0);
    }
  }, [editingFileId, files]);

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
    if (!newTag.trim()) return;
    if (!editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag('');
      // 添加完新标签后聚焦回输入框
      setTimeout(() => {
        if (newTagInputRef.current) {
          newTagInputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

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

  // 渲染标签列表
  const renderTags = (file: FileItemType) => {
    const tags = file.tags || [];
    
    // 如果当前是编辑状态且是编辑的文件，显示编辑标签界面
    if (editingFileId === file.id) {
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
              value={newTag}
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
    
    // 非编辑状态下显示标签
    if (!tags || tags.length === 0) return <span className={styles.emptyText}>-</span>;
    
    // 限制显示的标签数量，避免占用太多空间
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

  const isAllSelected = files.length > 0 && selectedFiles.length === files.length;

  const handleFileCheckboxChange = (file: FileItemType, checked: boolean) => {
    if (checked) {
      onSelectFiles([...selectedFiles, file.id]);
    } else {
      onSelectFiles(selectedFiles.filter(id => id !== file.id));
    }
  };

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
      <table className={styles.fileTable}>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={isAllSelected ? 
                  () => onDeselectAllFiles && onDeselectAllFiles() : 
                  () => onSelectAllFiles && onSelectAllFiles()}
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
            const isEditing = editingFileId === file.id;
            
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
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleFileCheckboxChange(file, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isEditing}
                  />
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
                <td>{file.isFolder ? '文件夹' : file.extension?.toUpperCase() || '文件'}</td>
                <td>{file.size ? `${Math.round(file.size / 1024)} KB` : '-'}</td>
                <td className={styles.tagsCell}>{renderTags(file)}</td>
                <td>
                  {file.createdAt 
                    ? new Date(file.createdAt).toLocaleString() 
                    : (file.uploadTime 
                        ? new Date(file.uploadTime).toLocaleString() 
                        : '-')
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
  );
}