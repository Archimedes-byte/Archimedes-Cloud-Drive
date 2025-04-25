'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Tag, 
  Checkbox, 
  Space, 
  Tooltip, 
  Typography,
  Empty,
  Spin,
  Modal,
  Popover
} from 'antd';
import type { TableProps } from 'antd';
import { 
  FileOutlined, 
  FolderOutlined, 
  FileImageOutlined, 
  FileTextOutlined,
  FileZipOutlined,
  PlayCircleOutlined,
  CustomerServiceOutlined,
  MoreOutlined,
  TagOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  StarOutlined,
  StarFilled,
  FilePdfOutlined,
  SoundOutlined
} from '@ant-design/icons';
import { getFileNameAndExtension } from '@/app/utils/file/path';
import { FileInfo } from '@/app/types';
import { formatFileSize } from '@/app/utils/file/format';
import { createCancelableDebounce } from '@/app/utils/function/debounce';
import { themeTokens } from '@/app/theme';
import './antFileList.css'; // 将创建一个包含少量覆盖样式的CSS文件
import { FileIcon } from '@/app/utils/file/icon-map';

const { Text, Title } = Typography;

/**
 * 基于Ant Design的文件列表组件 - 替代原来的FileList组件
 */
interface AntFileListProps {
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

export function AntFileList({
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
}: AntFileListProps) {
  const actualEditingFileId = editingFileId || editingFile;

  const [localEditName, setLocalEditName] = useState<string>('');
  const [localEditTags, setLocalEditTags] = useState<string[]>([]);
  const [localNewTag, setLocalNewTag] = useState<string>('');
  
  const editName = providedEditingName !== undefined ? providedEditingName : localEditName;
  const editTags = providedEditingTags !== undefined ? providedEditingTags : localEditTags;
  const newTagValue = providedNewTag !== undefined ? providedNewTag : localNewTag;
  
  // 文件数据记忆化
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

  const editNameInputRef = useRef<any>(null);
  const newTagInputRef = useRef<any>(null);

  // 自动聚焦编辑输入框
  useEffect(() => {
    if (actualEditingFileId && providedEditingName === undefined) {
      const file = files.find(f => f.id === actualEditingFileId);
      if (file) {
        setLocalEditName(file.name);
        setLocalEditTags(file.tags || []);
      }
    }
    
    if (actualEditingFileId && editNameInputRef.current) {
      const inputElement = editNameInputRef.current?.input;
      if (inputElement) {
        setTimeout(() => {
          inputElement.focus();
          inputElement.select();
        }, 100);
      }
    }
  }, [actualEditingFileId, files, providedEditingName]);

  // 处理编辑时的键盘事件
  const handleEditKeyDown = (e: React.KeyboardEvent, fileId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirmEdit && onConfirmEdit(fileId, editName, editTags);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit && onCancelEdit();
    }
  };

  // 添加标签
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
      
      // 添加标签后聚焦输入框
      setTimeout(() => {
        if (newTagInputRef.current) {
          newTagInputRef.current.focus();
        }
      }, 0);
    }
  };

  // 移除标签
  const handleRemoveTag = (tagToRemove: string) => {
    if (onRemoveTag) {
      onRemoveTag(tagToRemove);
    } else {
      setEditTags(editTags.filter(tag => tag !== tagToRemove));
    }
  };

  // 标签输入框键盘事件
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // 文件勾选框改变事件
  const handleFileCheckboxChange = (checked: boolean, file: FileInfo) => {
    if (onFileSelect) {
      onFileSelect(file, checked);
    }
  };

  // 渲染文件图标
  const renderFileIcon = (file: FileInfo) => {
    const { isFolder } = file;
    const extension = file.name?.split('.').pop()?.toLowerCase() || file.extension || '';
    const fileType = file.type || '';

    return (
      <span className="file-icon-wrapper">
        <FileIcon 
          isFolder={isFolder} 
          extension={extension} 
          mimeType={fileType} 
          size={20} 
          className="file-type-icon"
        />
      </span>
    );
  };

  // 渲染收藏按钮
  const renderFavoriteButton = (file: FileInfo) => {
    const isFavorited = favoritedFileIds.includes(file.id);
    
    return (
      <Tooltip title={isFavorited ? '取消收藏' : '收藏'}>
        <Button
          type="text"
          size="small"
          icon={isFavorited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
          className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (isFavorited) {
              // 如果已收藏，直接取消收藏
              if (onToggleFavorite) {
                onToggleFavorite(file, false);
              }
            } else {
              // 如果未收藏，打开收藏夹选择框
              const favoriteEvent = new CustomEvent('open_favorite_modal', {
                detail: {
                  fileId: file.id,
                  fileName: file.name
                }
              });
              window.dispatchEvent(favoriteEvent);
            }
          }}
        />
      </Tooltip>
    );
  };

  // 标签列渲染
  const allTagsContent = (tags: string[]) => (
    <div className="all-tags-container">
      {tags.map(tag => (
        <Tag key={tag} color="blue">{tag}</Tag>
      ))}
    </div>
  );

  // Ant Design表格列定义
  const columns = [
    // 文件勾选列
    ...(showCheckboxes ? [
      {
        title: (
          <Checkbox
            checked={areAllSelected}
            onChange={(e) => {
              if (e.target.checked) {
                onSelectAll?.();
              } else {
                onDeselectAll?.();
              }
            }}
          />
        ),
        dataIndex: 'checkbox',
        key: 'checkbox',
        width: 50,
        render: (_: any, record: FileInfo) => (
          <Checkbox
            checked={selectedFiles.includes(record.id)}
            onChange={(e) => handleFileCheckboxChange(e.target.checked, record)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      }
    ] : []),
    
    // 收藏列
    {
      title: '',
      dataIndex: 'favorite',
      key: 'favorite',
      width: 50,
      render: (_: any, record: FileInfo) => renderFavoriteButton(record),
    },
    
    // 文件名列
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (_: any, record: FileInfo) => {
        const isEditing = record.id === actualEditingFileId;
        
        if (isEditing) {
          return (
            <Input
              ref={editNameInputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => handleEditKeyDown(e, record.id)}
              onBlur={() => {/* 保持聚焦 */}}
              addonAfter={
                <Space>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CheckOutlined />} 
                    onClick={() => onConfirmEdit?.(record.id, editName, editTags)}
                  />
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CloseOutlined />} 
                    onClick={() => onCancelEdit?.()}
                  />
                </Space>
              }
            />
          );
        }
        
        return (
          <Space>
            {renderFileIcon(record)}
            <Text
              className={`file-name ${record.isFolder ? '' : 'file-name-non-folder'}`}
              ellipsis={{ tooltip: record.name }}
              onClick={(e) => {
                e.stopPropagation();
                onFileClick(record);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onFileDoubleClick?.(record);
              }}
              onContextMenu={(e) => {
                onFileContextMenu?.(e, record);
              }}
            >
              {record.name}
            </Text>
          </Space>
        );
      },
    },
    
    // 标签列
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 220,
      render: (_: any, record: FileInfo) => {
        const isEditing = record.id === actualEditingFileId;
        
        if (isEditing) {
          return (
            <div className="tag-edit-container">
              <div className="edit-tags-list">
                {editTags.length > 0 ? (
                  editTags.map((tag) => (
                    <Tag 
                      key={tag} 
                      closable 
                      onClose={() => handleRemoveTag(tag)}
                      style={{ marginBottom: '8px' }}
                    >
                      {tag}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary" italic>无标签</Text>
                )}
              </div>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  ref={newTagInputRef}
                  placeholder="添加标签..."
                  value={newTagValue}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  prefix={<TagOutlined />}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddTag}
                  disabled={!newTagValue.trim()}
                />
              </Space.Compact>
            </div>
          );
        }
        
        if (!record.tags || record.tags.length === 0) {
          return <Text type="secondary">-</Text>;
        }
        
        // 显示前2个标签，其余使用可点击标签展示
        const visibleTags = record.tags.slice(0, 2);
        const remainingCount = record.tags.length - visibleTags.length;
        
        return (
          <div className="tag-container">
            {visibleTags.map(tag => (
              <Tag key={tag} color="blue">{tag}</Tag>
            ))}
            {remainingCount > 0 && (
              <Popover 
                content={allTagsContent(record.tags)} 
                title="全部标签" 
                trigger="click"
                placement="right"
              >
                <Tag color="default" className="more-tags-button">+{remainingCount}</Tag>
              </Popover>
            )}
          </div>
        );
      },
    },
    
    // 文件大小列
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (_: any, record: FileInfo) => {
        if (record.isFolder) return <span>-</span>;
        const size = typeof record.size === 'number' ? record.size : 0;
        return <span>{formatFileSize(size)}</span>;
      },
    },
    
    // 修改日期列
    {
      title: '修改日期',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (_: any, record: FileInfo) => {
        const updatedAt = record.updatedAt || '';
        if (!updatedAt) return '-';
        try {
          const date = new Date(updatedAt);
          return date.toLocaleString();
        } catch (e) {
          return '-';
        }
      },
    },
  ];

  // 表格行属性
  const onRow = (record: FileInfo) => {
    return {
      onClick: () => {
        // 如果正在编辑，不处理点击事件
        if (actualEditingFileId === record.id) return;
        
        // 点击行选择文件
        if (onFileSelect) {
          onFileSelect(record, !selectedFiles.includes(record.id));
        }
      },
      onDoubleClick: () => {
        // 如果正在编辑，不处理双击事件
        if (actualEditingFileId === record.id) return;
        
        onFileDoubleClick?.(record);
      },
      onContextMenu: (e: React.MouseEvent) => {
        onFileContextMenu?.(e, record);
      },
      className: `${selectedFiles.includes(record.id) ? 'selected-row' : ''} ${actualEditingFileId === record.id ? 'editing-row' : ''}`,
    };
  };

  // 表格的行键值
  const rowKey = (record: FileInfo) => record.id;

  // 空状态渲染
  const renderEmpty = () => {
    let icon = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    let message = '无文件或文件夹';
    let hint = '上传文件或创建文件夹以开始';
    
    if (fileTypeFilter) {
      message = `无${fileTypeFilter}文件`;
      hint = '尝试更改筛选条件';
    } else if (error) {
      message = '加载文件时出现错误';
      hint = error;
    }
    
    return (
      <div className="empty-state">
        {icon}
        <Title level={5} className="empty-state-text">{message}</Title>
        <Text type="secondary" className="empty-state-hint">{hint}</Text>
      </div>
    );
  };

  return (
    <div className="ant-file-list-wrapper">
      <Spin spinning={isLoading}>
        <Table
          dataSource={filesMemoized}
          columns={columns as TableProps<FileInfo>['columns']}
          pagination={false}
          rowKey={rowKey}
          onRow={onRow}
          locale={{ emptyText: renderEmpty() }}
          className="ant-file-table"
          size="middle"
          bordered={false}
          tableLayout="fixed"
          style={{ height: '100%' }}
        />
      </Spin>
    </div>
  );
} 