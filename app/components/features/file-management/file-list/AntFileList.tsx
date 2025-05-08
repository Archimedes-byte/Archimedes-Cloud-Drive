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
import { getFileNameAndExtension } from '@/app/utils/file';
import { FileInfo } from '@/app/types';
import { formatFileSize } from '@/app/utils/file';
import { createCancelableDebounce } from '@/app/utils/function';
import './antFileList.css'; // 将创建一个包含少量覆盖样式的CSS文件
import { FileIcon } from '@/app/utils/file/icon-map';
import { fileApi } from '@/app/lib/api/file-api';

const { Text, Title } = Typography;

/**
 * 基于Ant Design的文件列表组件 - 替代原来的FileList组件
 */
export interface AntFileListProps {
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
  showPath?: boolean;
  customColumns?: (defaultColumns: any[]) => any[];
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
  fileUpdateTrigger = 0,
  showPath = false,
  customColumns
}: AntFileListProps) {
  // ----- 防御性编程: 确保所有props有默认值 -----
  const safeFiles = Array.isArray(files) ? files : [];
  const safeSelectedFiles = Array.isArray(selectedFiles) ? selectedFiles : [];
  const safeFavoritedFileIds = Array.isArray(favoritedFileIds) ? favoritedFileIds : [];
  
  // 尝试防止React Hooks错误：始终使用相同的钩子调用序列
  // React要求无论组件状态如何，钩子调用顺序必须一致
  const [mounted, setMounted] = useState(true);
  
  // 添加父文件夹名称缓存
  const [parentFolderNames, setParentFolderNames] = useState<Record<string, string>>({});
  const [loadingParentFolders, setLoadingParentFolders] = useState<Record<string, boolean>>({});
  
  // 组件卸载时标记，避免卸载后的状态更新
  useEffect(() => {
    return () => {
      setMounted(false);
    };
  }, []);
  
  // 加载父文件夹信息的函数
  const loadParentFolderName = async (parentId: string) => {
    if (!parentId || parentFolderNames[parentId] || loadingParentFolders[parentId]) {
      return;
    }
    
    try {
      setLoadingParentFolders(prev => ({ ...prev, [parentId]: true }));
      const parentFolder = await fileApi.getFile(parentId);
      
      if (parentFolder && mounted) {
        setParentFolderNames(prev => ({
          ...prev,
          [parentId]: parentFolder.name || parentId
        }));
      }
    } catch (error) {
      console.error('加载父文件夹信息失败:', error);
    } finally {
      if (mounted) {
        setLoadingParentFolders(prev => ({ ...prev, [parentId]: false }));
      }
    }
  };
  
  // 在文件列表更新时加载父文件夹信息
  useEffect(() => {
    const parentIds = safeFiles
      .filter(file => file.parentId && !parentFolderNames[file.parentId])
      .map(file => file.parentId as string);
    
    // 去重
    const uniqueParentIds = [...new Set(parentIds)];
    
    // 对每个父文件夹ID加载名称
    uniqueParentIds.forEach(parentId => {
      loadParentFolderName(parentId);
    });
  }, [safeFiles, fileUpdateTrigger]);
  
  const actualEditingFileId = editingFileId || editingFile;

  const [localEditName, setLocalEditName] = useState<string>('');
  const [localEditTags, setLocalEditTags] = useState<string[]>([]);
  const [localNewTag, setLocalNewTag] = useState<string>('');
  
  const editName = providedEditingName !== undefined ? providedEditingName : localEditName;
  const editTags = providedEditingTags !== undefined ? providedEditingTags : localEditTags;
  const newTagValue = providedNewTag !== undefined ? providedNewTag : localNewTag;
  
  // 文件数据记忆化
  const filesMemoized = useMemo(() => safeFiles, [
    safeFiles.map(f => f.id).join(','), 
    safeFiles.map(f => f.name).join(','),
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
      const file = safeFiles.find(f => f.id === actualEditingFileId);
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
  }, [actualEditingFileId, safeFiles, providedEditingName]);

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

  // 处理文件勾选框改变事件
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
          size={24}
          className="file-type-icon"
        />
      </span>
    );
  };

  // 渲染收藏按钮
  const renderFavoriteButton = (file: FileInfo) => {
    const isFavorited = safeFavoritedFileIds.includes(file.id);
    
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
  const columns = useMemo(() => {
    // 默认列定义
    let defaultColumns = [
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
              checked={safeSelectedFiles.includes(record.id)}
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
        className: 'name-column',
        ellipsis: true,
        sorter: (a: FileInfo, b: FileInfo) => {
          // 文件夹总是排在文件前面
          if (a.isFolder && !b.isFolder) return -1;
          if (!a.isFolder && b.isFolder) return 1;
          return a.name.localeCompare(b.name);
        },
        render: (_: any, record: FileInfo) => {
          const isEditing = record.id === actualEditingFileId;
          
          if (isEditing) {
            return (
              <Input
                ref={editNameInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => handleEditKeyDown(e, record.id)}
                autoFocus
              />
            );
          }
          
          /* 直接显示文件名，不再分解扩展名 */
          return (
            <div className="file-name-wrapper" onClick={() => onFileClick(record)}>
              {renderFileIcon(record)}
              <div className="file-name" title={record.name}>
                {record.name}
              </div>
            </div>
          );
        },
        width: '40%',
      },
      
      // 路径列 - 仅在搜索结果中显示
      ...(showPath ? [
        {
          title: '所在位置',
          dataIndex: 'parentId',
          key: 'parentId',
          width: 220,
          render: (_: any, record: FileInfo) => {
            // 如果文件在根目录中
            if (!record.parentId) return <Text type="secondary">根目录</Text>;
            
            // 检查是否已加载父文件夹名称
            const parentName = parentFolderNames[record.parentId] || '';
            
            // 如果正在加载，显示加载状态
            if (!parentName && loadingParentFolders[record.parentId]) {
              return <Text type="secondary"><Spin size="small" style={{ marginRight: 8 }} />正在加载...</Text>;
            }
            
            // 如果已加载父文件夹名称，显示名称
            if (parentName) {
              return (
                <Text 
                  ellipsis={true} 
                  title={parentName}
                  style={{ color: '#718096', fontSize: '13px' }}
                >
                  {parentName}
                </Text>
              );
            }
            
            // 如果尚未加载且不在加载中，尝试加载
            if (record.parentId && !loadingParentFolders[record.parentId]) {
              loadParentFolderName(record.parentId);
            }
            
            // 在加载前显示父文件夹ID
            return (
              <Text 
                ellipsis={true} 
                title={`父文件夹ID: ${record.parentId}`}
                style={{ color: '#718096', fontSize: '13px' }}
              >
                加载中...
              </Text>
            );
          },
        }
      ] : []),
      
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
    
    // 如果提供了自定义列处理函数，应用它
    if (customColumns) {
      defaultColumns = customColumns(defaultColumns);
    }
    
    return defaultColumns;
  }, [
    showCheckboxes, 
    areAllSelected, 
    onSelectAll, 
    onDeselectAll, 
    safeSelectedFiles, 
    safeFavoritedFileIds, 
    actualEditingFileId, 
    editName, 
    editTags, 
    newTagValue,
    showPath,
    customColumns, // 添加自定义列处理函数作为依赖
    parentFolderNames, // 添加父文件夹名称缓存作为依赖
    loadingParentFolders, // 添加加载状态缓存作为依赖
    loadParentFolderName // 添加加载函数作为依赖
  ]);

  // 表格行属性
  const onRow = (record: FileInfo) => {
    return {
      onClick: () => {
        // 如果正在编辑，不处理点击事件
        if (actualEditingFileId === record.id) return;
        
        // 移除自动选择文件的功能
        // 只保留双击和右键菜单功能
      },
      onDoubleClick: () => {
        // 如果正在编辑，不处理双击事件
        if (actualEditingFileId === record.id) return;
        
        onFileDoubleClick?.(record);
      },
      onContextMenu: (e: React.MouseEvent) => {
        onFileContextMenu?.(e, record);
      },
      // 添加防护措施，确保selectedFiles是数组
      className: `${Array.isArray(selectedFiles) && selectedFiles.includes(record.id) ? 'selected-row' : ''} ${actualEditingFileId === record.id ? 'editing-row' : ''}`,
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
          style={{ height: '100%', width: '100%' }}
          scroll={{ x: '100%' }}
        />
      </Spin>
    </div>
  );
} 