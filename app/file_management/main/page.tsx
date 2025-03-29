'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import UploadModal from '@/app/components/UploadModal';
import './styles.css';
import { message } from 'antd';
import { Modal, Input, Select } from 'antd';

interface File {
  id: string;
  name: string;
  type: string;
  extension?: string;
  size: number;
  path: string;
  isFolder: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  uploaderId: string;
  fullPath?: string;
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// 文件类型定义
type FileType = 'image' | 'document' | 'video' | 'audio' | 'other';

// 文件类型映射
const TYPE_MAP: Record<FileType, string> = {
  'image': 'image/',
  'video': 'video/',
  'audio': 'audio/',
  'document': 'application/',
  'other': 'other'
} as const;

// 文件类型判断
const FILE_TYPE_MAP: Record<FileType, { mimeTypes: string[]; extensions: string[] }> = {
  image: {
    mimeTypes: ['image/'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  },
  document: {
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/'],
    extensions: ['doc', 'docx', 'txt', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx']
  },
  video: {
    mimeTypes: ['video/'],
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv']
  },
  audio: {
    mimeTypes: ['audio/'],
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a']
  },
  other: {
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-compressed', 'application/x-tar', 'application/gzip'],
    extensions: ['zip', 'rar', '7z', 'tar', 'gz']
  }
};

// 获取文件图标
function getFileIcon(type: string | undefined, extension: string | undefined, isFolder: boolean): string {
  if (isFolder) {
    return '📁';
  }

  if (!type) {
    return '📄';
  }

  for (const [fileType, { mimeTypes, extensions }] of Object.entries(FILE_TYPE_MAP)) {
    if (mimeTypes.some(mimeType => type.startsWith(mimeType)) || 
        extensions.includes(extension || '')) {
      switch (fileType) {
        case 'image': return '🖼️';
        case 'pdf': return '📄';
        case 'word': return '📝';
        case 'excel': return '📊';
        case 'video': return '🎥';
        case 'audio': return '🎵';
        case 'archive': return '📦';
        case 'code': return '💻';
        case 'text': return '📝';
        default: return '📄';
      }
    }
  }
  return '📄';
}

// 过滤文件
function filterFiles(files: File[], type: FileType | null): File[] {
  if (!type || type === 'other') return files;
  
  const fileType = FILE_TYPE_MAP[type];
  if (!fileType) return files;
  
  return files.filter(file => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return fileType.mimeTypes.some(mimeType => file.type.startsWith(mimeType)) ||
           fileType.extensions.includes(extension || '');
  });
}

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  currentName: string;
}

function RenameModal({ isOpen, onClose, onConfirm, currentName }: RenameModalProps) {
  const [newName, setNewName] = useState(currentName);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content rename-modal">
        <div className="modal-header">
          <h2 className="modal-title">重命名</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="rename-form">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rename-input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onConfirm(newName);
              }
            }}
          />
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="modal-button cancel">
            取消
          </button>
          <button
            onClick={() => onConfirm(newName)}
            className="modal-button confirm"
            disabled={!newName.trim()}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

// 添加获取文件名和后缀的辅助函数
const getFileNameAndExtension = (filename: string) => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { name: filename, extension: '' };
  }
  return {
    name: filename.substring(0, lastDotIndex),
    extension: filename.substring(lastDotIndex)
  };
};

// 处理文件类型显示
const getFileType = (type: string | null) => {
  if (!type) return '未知';
  if (type.startsWith('image/')) return '图片';
  if (type.startsWith('video/')) return '视频';
  if (type.startsWith('audio/')) return '音频';
  if (type.startsWith('application/pdf')) return 'PDF';
  if (type.startsWith('application/msword') || type.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml')) return 'Word';
  if (type.startsWith('application/vnd.ms-excel') || type.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')) return 'Excel';
  if (type.startsWith('application/vnd.ms-powerpoint') || type.startsWith('application/vnd.openxmlformats-officedocument.presentationml')) return 'PowerPoint';
  return '其他';
};

export default function FileManagement() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<{field: string; direction: 'asc' | 'desc'}>({
    field: 'uploadTime',
    direction: 'desc'
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderUploadModalOpen, setIsFolderUploadModalOpen] = useState(false);
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{ id: string, name: string }>>([]);
  const [myFilesExpanded, setMyFilesExpanded] = useState(true);
  const [quickAccessExpanded, setQuickAccessExpanded] = useState(true);
  const [selectedFileType, setSelectedFileType] = useState<FileType | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showSearchView, setShowSearchView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<File[]>([]);
  const [searchType, setSearchType] = useState<'name' | 'tag'>('name');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderTags, setNewFolderTags] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUploadDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadFiles = async (folderId: string | null = null) => {
    try {
      setIsLoading(true);
      setError(null);

      // 构建 URL 和查询参数
      const params = new URLSearchParams();
      if (folderId) {
        params.append('folderId', folderId);
      }
      if (selectedFileType) {
        params.append('type', TYPE_MAP[selectedFileType]);
      }

      console.log('请求参数:', params.toString());

      const response = await fetch(`/api/files?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '加载文件列表失败');
      }

      console.log('接收到的数据:', data);

      // 确保 items 是数组
      const items = Array.isArray(data.items) ? data.items : [];
      setFiles(items);

      // 更新当前文件夹ID
      setCurrentFolderId(folderId);

      // 更新文件夹路径
      if (data.currentFolder) {
        setFolderPath(prev => {
          const index = prev.findIndex(folder => folder.id === data.currentFolder.id);
          if (index === -1) {
            return [...prev, { id: data.currentFolder.id, name: data.currentFolder.name }];
          }
          return prev.slice(0, index + 1);
        });
      } else if (!folderId) {
        setFolderPath([]);
      }

    } catch (error) {
      console.error('加载文件列表失败:', error);
      const errorMessage = error instanceof Error ? error.message : '加载文件列表失败，请稍后重试';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 在组件挂载时加载文件列表
  useEffect(() => {
    if (session?.user) {
      loadFiles(currentFolderId);
    }
  }, [session, selectedFileType]);

  const handleUploadSuccess = () => {
    loadFiles(currentFolderId); // 刷新当前文件夹的内容
    setIsUploadModalOpen(false);
    setIsFolderUploadModalOpen(false);
    setShowUploadDropdown(false);
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const handleDownload = async (fileIds?: string[]) => {
    try {
      const idsToDownload = fileIds || selectedFiles;
      if (idsToDownload.length === 0) return;

      const response = await fetch('/api/files/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds: idsToDownload }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '下载失败');
      }

      // 获取文件名
      const contentDisposition = response.headers.get('content-disposition');
      const fileName = contentDisposition
        ? decodeURIComponent(contentDisposition.split('filename=')[1].replace(/"/g, ''))
        : 'download';

      // 创建下载链接
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载错误:', error);
      alert(error instanceof Error ? error.message : '下载失败，请稍后重试');
    }
  };

  const handleDelete = async () => {
    if (selectedFiles.length === 0) {
      message.warning('请选择要删除的文件');
      return;
    }

    try {
      const response = await fetch('/api/files/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileIds: selectedFiles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除失败');
      }

      const data = await response.json();
      message.success(`成功删除 ${data.deletedCount || selectedFiles.length} 个文件`);
      setSelectedFiles([]);
      loadFiles(currentFolderId);
    } catch (error) {
      console.error('删除错误:', error);
      message.error(error instanceof Error ? error.message : '删除失败，请重试');
    }
  };

  const handleFileClick = (file: File) => {
    if (file.isFolder) {
      // 如果是文件夹，进入该文件夹
      loadFiles(file.id);
      setCurrentFolderId(file.id);
      // 更新面包屑
      setFolderPath(prev => [...prev, { id: file.id, name: file.name }]);
    } else {
      // 如果是文件，跳转到预览页面
      router.push(`/file_management/preview?id=${file.id}`);
    }
  };

  const handleStartEdit = (file: File) => {
    const { name } = getFileNameAndExtension(file.name);
    setEditingFile(file.id);
    setEditingName(name);
    setEditingTags(file.tags || []);
  };

  const handleConfirmEdit = async () => {
    if (!editingFile) return;

    try {
      const file = files.find(f => f.id === editingFile);
      if (!file) return;

      const { extension } = getFileNameAndExtension(file.name);
      const newFileName = editingName.trim() + extension;

      const response = await fetch(`/api/files/${editingFile}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFileName,
          tags: editingTags,
        }),
      });

      if (!response.ok) {
        throw new Error('修改失败');
      }

      const data = await response.json();
      
      // 更新本地文件列表
      setFiles(files.map(f => 
        f.id === editingFile
          ? { ...f, name: newFileName, tags: editingTags }
          : f
      ));

      message.success('修改成功');
    } catch (error) {
      console.error('修改错误:', error);
      message.error('修改失败');
    } finally {
      setEditingFile(null);
      setEditingName('');
      setEditingTags([]);
    }
  };

  const handleFolderClick = (folder: File) => {
    if (folder.isFolder) {
      loadFiles(folder.id);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  // 处理排序
  const handleSort = (files: File[]) => {
    if (!Array.isArray(files)) {
      console.warn('文件列表不是数组:', files);
      return [];
    }

    return [...files].sort((a, b) => {
      switch (sortOrder.field) {
        case 'name':
          return sortOrder.direction === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'size':
          return sortOrder.direction === 'asc'
            ? (a.size || 0) - (b.size || 0)
            : (b.size || 0) - (a.size || 0);
        case 'uploadTime':
          return sortOrder.direction === 'asc'
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  };

  // 处理搜索
  const handleSearch = async (query: string, type: 'name' | 'tag' = 'name') => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/files/search?query=${encodeURIComponent(query)}&type=${type}`);
      if (!response.ok) {
        throw new Error('搜索失败');
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setSearchResults(data.files);
    } catch (error) {
      console.error('搜索错误:', error);
      setError(error instanceof Error ? error.message : '搜索失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取文件所在目录路径
  const getFilePath = (path: string | undefined) => {
    if (!path) return '/';
    const parts = path.split('/');
    return parts.slice(0, -1).join('/') || '/';
  };

  // 渲染搜索视图
  const renderSearchView = () => {
    return (
      <div className="search-view">
        <div className="search-header">
          <h2>搜索文件</h2>
          <div className="search-controls">
            <select 
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'name' | 'tag')}
              className="search-type-select"
            >
              <option value="name">按文件名搜索</option>
              <option value="tag">按标签搜索</option>
            </select>
            <div className="search-input-group">
              <input
                type="text"
                placeholder={searchType === 'name' ? "输入文件名搜索..." : "输入标签搜索..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery, searchType)}
              />
              <button onClick={() => handleSearch(searchQuery, searchType)}>
                <span className="button-icon">🔍</span>
                搜索
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="loading">
            <span className="loading-spinner">⌛</span>
            正在搜索...
          </div>
        ) : searchResults.length > 0 ? (
          <div className="search-results">
            <div className="results-header">
              <span className="results-count">找到 {searchResults.length} 个结果</span>
            </div>
            <table className="file-table">
              <thead>
                <tr>
                  <th>文件名</th>
                  <th>大小</th>
                  <th>所在目录</th>
                  <th>上传时间</th>
                  <th>标签</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((file) => (
                  <tr 
                    key={file.id} 
                    className="file-row"
                    onClick={() => handleFileClick(file)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="file-name-cell">
                      <span className="file-type-icon">
                        {getFileIcon(file.type, file.extension, file.isFolder)}
                      </span>
                      <span className="file-name">{file.name}</span>
                    </td>
                    <td>{file.size ? `${Math.round(file.size / 1024)} KB` : '-'}</td>
                    <td>{getFilePath(file.path)}</td>
                    <td>{new Date(file.createdAt).toLocaleString()}</td>
                    <td>
                      {Array.isArray(file.tags) && file.tags.length > 0 ? (
                        <div className="tags-container">
                          {file.tags.map((tag, index) => (
                            <span key={index} className="tag-badge">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="no-tags">无标签</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : searchQuery && !isLoading ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p>未找到相关文件</p>
            <p className="empty-hint">尝试使用不同的关键词或标签</p>
          </div>
        ) : null}
      </div>
    );
  };

  const handleCreateFolder = () => {
    setIsCreatingFolder(true);
    setNewFolderName('');
    setNewFolderTags('');
  };

  const handleConfirmCreateFolder = async () => {
    try {
      if (!newFolderName.trim()) {
        // 如果用户没有输入名称，则使用默认名称
        const now = new Date();
        const dateStr = now.getFullYear() +
          String(now.getMonth() + 1).padStart(2, '0') +
          String(now.getDate()).padStart(2, '0');
        setNewFolderName(`新建文件夹_${dateStr}`);
        return;
      }

      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolderId,
          tags: newFolderTags
        }),
      });

      if (!response.ok) {
        throw new Error('创建文件夹失败');
      }

      // 刷新文件列表
      await loadFiles(currentFolderId);
      message.success('创建文件夹成功');
      
      // 重置状态
      setIsCreatingFolder(false);
      setNewFolderName('');
      setNewFolderTags('');
    } catch (error) {
      console.error('创建文件夹错误:', error);
      message.error('创建文件夹失败');
    }
  };

  // 处理返回上级文件夹
  const handleBackClick = () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop(); // 移除当前文件夹
      const parentFolder = newPath[newPath.length - 1];
      setFolderPath(newPath);
      loadFiles(parentFolder?.id || null);
    }
  };

  // 添加标签相关函数
  const handleAddTag = (tag: string) => {
    if (!tag.trim()) return;
    if (!editingTags.includes(tag.trim())) {
      setEditingTags([...editingTags, tag.trim()]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditingTags(editingTags.filter(tag => tag !== tagToRemove));
  };

  // 处理文件选择
  const handleSelectFile = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles(prev => [...prev, fileId]);
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    }
  };

  return (
    <div className="file-management-container">
      <div className="mini-sidebar">
        <button 
          className="mini-sidebar-button"
          onClick={() => {
            setSelectedFileType(null);
            setCurrentFolderId(null);
            setFolderPath([]);
            loadFiles();
          }}
        >
          <span className="mini-sidebar-icon">🏠</span>
          <span className="mini-sidebar-text">主页</span>
        </button>
        <button 
          className="mini-sidebar-button"
          onClick={handleSignOut}
        >
          <span className="mini-sidebar-icon">🚪</span>
          <span className="mini-sidebar-text">退出</span>
        </button>
      </div>

      <div className="sidebar">
        <div className="sidebar-section">
          <div 
            className="sidebar-header"
            onClick={() => setMyFilesExpanded(!myFilesExpanded)}
          >
            <span className="sidebar-icon">📁</span>
            我的文件
            <span className={`expand-icon ${myFilesExpanded ? 'expanded' : ''}`}>
              {myFilesExpanded ? '▼' : '▶'}
            </span>
          </div>
          {myFilesExpanded && (
            <div className="sidebar-submenu">
              <div 
                className={`sidebar-item ${!selectedFileType ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFileType(null);
                  setCurrentFolderId(null);
                  setFolderPath([]);
                  setIsLoading(true);
                  loadFiles();
                }}
              >
                <span className="sidebar-icon">📄</span>
                全部文件
              </div>
              <div 
                className={`sidebar-item ${selectedFileType === 'image' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFileType('image');
                  setCurrentFolderId(null);
                  setFolderPath([]);
                  setIsLoading(true);
                  loadFiles();
                }}
              >
                <span className="sidebar-icon">🖼️</span>
                图片
              </div>
              <div 
                className={`sidebar-item ${selectedFileType === 'document' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFileType('document');
                  setCurrentFolderId(null);
                  setFolderPath([]);
                  setIsLoading(true);
                  loadFiles();
                }}
              >
                <span className="sidebar-icon">📝</span>
                文档
              </div>
              <div 
                className={`sidebar-item ${selectedFileType === 'video' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFileType('video');
                  setCurrentFolderId(null);
                  setFolderPath([]);
                  setIsLoading(true);
                  loadFiles();
                }}
              >
                <span className="sidebar-icon">🎥</span>
                视频
              </div>
              <div 
                className={`sidebar-item ${selectedFileType === 'audio' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFileType('audio');
                  setCurrentFolderId(null);
                  setFolderPath([]);
                  setIsLoading(true);
                  loadFiles();
                }}
              >
                <span className="sidebar-icon">🎵</span>
                音频
              </div>
              <div 
                className={`sidebar-item ${selectedFileType === 'other' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFileType('other');
                  setCurrentFolderId(null);
                  setFolderPath([]);
                  setIsLoading(true);
                  loadFiles();
                }}
              >
                <span className="sidebar-icon">📦</span>
                其他
              </div>
            </div>
          )}
        </div>
        <div className="sidebar-section">
          <div 
            className="sidebar-header"
            onClick={() => setQuickAccessExpanded(!quickAccessExpanded)}
          >
            <span className="sidebar-icon">⭐</span>
            快捷访问
            <span className={`expand-icon ${quickAccessExpanded ? 'expanded' : ''}`}>
              {quickAccessExpanded ? '▼' : '▶'}
            </span>
          </div>
          {quickAccessExpanded && (
            <div className="sidebar-submenu">
              <div 
                className={`sidebar-item ${showSearchView ? 'active' : ''}`}
                onClick={() => setShowSearchView(true)}
              >
                <span className="sidebar-icon">🔍</span>
                搜索文件
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="main-content">
        {/* 添加面包屑导航 */}
        <div className="breadcrumb">
          <div className="breadcrumb-item">
            <button 
              className="breadcrumb-link"
              onClick={() => {
                setCurrentFolderId(null);
                setFolderPath([]);
                loadFiles(null);
              }}
            >
              <span className="breadcrumb-icon">🏠</span>
              根目录
            </button>
          </div>
          {folderPath.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <span className="breadcrumb-separator">/</span>
              <div className="breadcrumb-item">
                <button
                  className="breadcrumb-link"
                  onClick={() => {
                    const newPath = folderPath.slice(0, index + 1);
                    setFolderPath(newPath);
                    setCurrentFolderId(folder.id);
                    loadFiles(folder.id);
                  }}
                >
                  <span className="breadcrumb-icon">📁</span>
                  {folder.name}
                </button>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="top-bar">
          <div className="button-group">
            {selectedFiles.length > 0 ? (
              <>
                <button className="top-button" onClick={() => setSelectedFiles([])}>
                  <span className="button-icon">❌</span>
                  取消选择
                </button>
                <button className="top-button" onClick={() => handleDownload()}>
                  <span className="button-icon">⬇️</span>
                  下载
                </button>
                <button 
                  className="top-button"
                  onClick={() => {
                    if (selectedFiles.length !== 1) {
                      message.warning('请选择一个文件进行重命名');
                      return;
                    }
                    const selectedFile = files.find(file => file.id === selectedFiles[0]);
                    if (selectedFile) {
                      handleStartEdit(selectedFile);
                    }
                  }}
                >
                  <span className="button-icon">✏️</span>
                  重命名
                </button>
                <button className="top-button">
                  <span className="button-icon">📋</span>
                  移动
                </button>
                <button className="top-button" onClick={handleDelete}>
                  <span className="button-icon">🗑️</span>
                  删除
                </button>
              </>
            ) : (
              <>
                <button 
                  className="top-button"
                  onClick={() => {
                    setShowSearchView(false);
                    setCurrentFolderId(null);
                    setFolderPath([]);
                    loadFiles();
                  }}
                  disabled={!currentFolderId && !showSearchView}
                >
                  <span className="button-icon">📁</span>
                  {showSearchView ? '返回文件列表' : '根目录'}
                </button>
                <div className="sort-dropdown" ref={sortDropdownRef}>
                  <button 
                    className="top-button"
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                  >
                    <span className="button-icon">↕️</span>
                    排序
                  </button>
                  {showSortDropdown && (
                    <div className="dropdown-menu">
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          setSortOrder({
                            field: 'name',
                            direction: sortOrder.field === 'name' && sortOrder.direction === 'asc' ? 'desc' : 'asc'
                          });
                          setShowSortDropdown(false);
                        }}
                      >
                        <span className="button-icon">📝</span>
                        按文件名{sortOrder.field === 'name' ? (sortOrder.direction === 'asc' ? '↑' : '↓') : ''}
                      </button>
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          setSortOrder({
                            field: 'size',
                            direction: sortOrder.field === 'size' && sortOrder.direction === 'asc' ? 'desc' : 'asc'
                          });
                          setShowSortDropdown(false);
                        }}
                      >
                        <span className="button-icon">📊</span>
                        按大小{sortOrder.field === 'size' ? (sortOrder.direction === 'asc' ? '↑' : '↓') : ''}
                      </button>
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          setSortOrder({
                            field: 'uploadTime',
                            direction: sortOrder.field === 'uploadTime' && sortOrder.direction === 'asc' ? 'desc' : 'asc'
                          });
                          setShowSortDropdown(false);
                        }}
                      >
                        <span className="button-icon">🕒</span>
                        按时间{sortOrder.field === 'uploadTime' ? (sortOrder.direction === 'asc' ? '↑' : '↓') : ''}
                      </button>
                    </div>
                  )}
                </div>
                <div className="upload-dropdown" ref={dropdownRef}>
                  <button 
                    className="top-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUploadDropdown(!showUploadDropdown);
                    }}
                  >
                    <span className="button-icon">⬆️</span>
                    上传
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  {showUploadDropdown && (
                    <div className="dropdown-menu">
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          setIsUploadModalOpen(true);
                          setShowUploadDropdown(false);
                        }}
                      >
                        <span className="button-icon">📄</span>
                        上传文件
                      </button>
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          setIsFolderUploadModalOpen(true);
                          setShowUploadDropdown(false);
                        }}
                      >
                        <span className="button-icon">📁</span>
                        上传文件夹
                      </button>
                    </div>
                  )}
                </div>
                <button 
                  className="top-button"
                  onClick={handleCreateFolder}
                >
                  <span className="button-icon">📁</span>
                  新建文件夹
                </button>
              </>
            )}
          </div>
        </div>

        {showSearchView ? (
          renderSearchView()
        ) : (
          <div className="file-list-container">
            {folderPath.length > 0 && (
              <div className="folder-path">
                <button 
                  className="path-item"
                  onClick={() => loadFiles()}
                >
                  根目录
                </button>
                {folderPath.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    <span className="path-separator">/</span>
                    <button
                      className="path-item"
                      onClick={() => loadFiles(folder.id)}
                    >
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            {isLoading && <div className="loading">加载中...</div>}
            {error && <div className="error">{error}</div>}
            {!isLoading && !error && (
              <table className="file-table">
                <thead>
                  <tr>
                    <th className="checkbox-column">
                      <input
                        type="checkbox"
                        className="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles(files.map(file => file.id));
                          } else {
                            setSelectedFiles([]);
                          }
                        }}
                      />
                    </th>
                    <th style={{ width: '30%' }}>文件名</th>
                    <th style={{ width: '10%' }}>大小</th>
                    <th style={{ width: '20%' }}>上传时间</th>
                    <th style={{ width: '15%' }}>类型</th>
                    <th style={{ width: '15%' }}>标签</th>
                    <th style={{ width: '10%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {/* 新建文件夹的输入行 */}
                  {isCreatingFolder && (
                    <tr>
                      <td className="checkbox-column"></td>
                      <td className="file-name-cell">
                        <span className="file-type-icon">📁</span>
                        <input
                          ref={newFolderInputRef}
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (newFolderName.trim()) {
                                handleConfirmCreateFolder();
                              }
                            } else if (e.key === 'Escape') {
                              setIsCreatingFolder(false);
                              setNewFolderName('');
                              setNewFolderTags('');
                            }
                          }}
                          className="new-folder-input"
                          placeholder="新建文件夹"
                          autoFocus
                        />
                      </td>
                      <td>-</td>
                      <td>-</td>
                      <td>文件夹</td>
                      <td>
                        <input
                          type="text"
                          value={newFolderTags}
                          onChange={(e) => setNewFolderTags(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newFolderName.trim()) {
                              handleConfirmCreateFolder();
                            }
                          }}
                          className="new-folder-input"
                          placeholder="输入标签，用逗号分隔"
                        />
                      </td>
                      <td>
                        <button 
                          className="confirm-button"
                          onClick={() => {
                            if (newFolderName.trim()) {
                              handleConfirmCreateFolder();
                            }
                          }}
                        >
                          ✓
                        </button>
                        <button 
                          className="cancel-button"
                          onClick={() => {
                            setIsCreatingFolder(false);
                            setNewFolderName('');
                            setNewFolderTags('');
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  )}
                  {/* 现有文件列表 */}
                  {handleSort(files || []).map((file) => (
                    <tr key={file.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={(e) => handleSelectFile(file.id, e.target.checked)}
                          className="checkbox"
                        />
                      </td>
                      <td>
                        <div className="file-name-cell">
                          {file.isFolder ? (
                            <span
                              className="folder-link"
                              onClick={() => handleFileClick(file)}
                            >
                              📁 {file.name}
                            </span>
                          ) : (
                            <div className="file-info">
                              <span className="file-icon">
                                {getFileIcon(file.type, file.extension, file.isFolder)}
                              </span>
                              <span
                                className="file-link"
                                onClick={() => handleFileClick(file)}
                              >
                                {file.name}
                              </span>
                              {selectedFileType && file.fullPath && (
                                <span className="file-path text-gray-500 text-sm ml-2">
                                  ({file.fullPath.split('/').slice(0, -1).join('/')})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{file.isFolder ? '-' : formatFileSize(file.size)}</td>
                      <td>{formatDate(file.createdAt)}</td>
                      <td>{file.isFolder ? '文件夹' : getFileType(file.type)}</td>
                      <td>
                        {Array.isArray(file.tags) && file.tags.length > 0 ? (
                          <div className="tags-container">
                            {file.tags.map((tag, index) => (
                              <span key={index} className="tag-badge">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="no-tags">无标签</span>
                        )}
                      </td>
                      <td>
                        <div className="file-actions">
                          <button 
                            className="edit-button"
                            onClick={() => handleStartEdit(file)}
                          >
                            ✎
                          </button>
                          <button 
                            className="delete-button"
                            onClick={() => {
                              setSelectedFiles([file.id]);
                              handleDelete();
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!isLoading && !error && files.length === 0 && (
              <div className="empty-state">
                <p>暂无文件</p>
              </div>
            )}
          </div>
        )}
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        isFolderUpload={false}
        withTags={true}
        currentFolderId={currentFolderId}
      />

      <UploadModal
        isOpen={isFolderUploadModalOpen}
        onClose={() => setIsFolderUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        isFolderUpload={true}
        withTags={true}
        currentFolderId={currentFolderId}
      />

      <style jsx>{`
        .new-folder-input {
          border: none;
          border-bottom: 1px solid #ddd;
          outline: none;
          padding: 4px 8px;
          margin-left: 8px;
          width: 200px;
          font-size: 14px;
        }
        
        .new-folder-input:focus {
          border-bottom-color: #1890ff;
        }

        .confirm-button,
        .cancel-button {
          border: none;
          background: none;
          cursor: pointer;
          padding: 4px 8px;
          margin: 0 2px;
          font-size: 14px;
          color: #666;
        }

        .confirm-button:hover {
          color: #52c41a;
        }

        .cancel-button:hover {
          color: #ff4d4f;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          max-width: 200px;
        }

        .tag-badge {
          background-color: #f0f0f0;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 12px;
          color: #666;
          white-space: nowrap;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: inline-block;
        }

        .tag-badge:hover {
          background-color: #e0e0e0;
          color: #1890ff;
        }

        .no-tags {
          color: #999;
          font-style: italic;
          font-size: 12px;
        }

        .file-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .edit-button,
        .delete-button {
          border: none;
          background: none;
          cursor: pointer;
          padding: 4px;
          color: #666;
          border-radius: 4px;
          transition: all 0.3s;
        }

        .edit-button:hover {
          color: #1890ff;
          background-color: #e6f7ff;
        }

        .delete-button:hover {
          color: #ff4d4f;
          background-color: #fff1f0;
        }

        .tags-edit-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .tag-input-container {
          display: flex;
          align-items: center;
        }

        .tag-input {
          border: none;
          border-bottom: 1px solid #ddd;
          outline: none;
          padding: 4px;
          font-size: 12px;
          width: 100px;
        }

        .tag-input:focus {
          border-bottom-color: #1890ff;
        }

        .tag-badge {
          background-color: #f0f0f0;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 12px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .tag-remove {
          cursor: pointer;
          color: #999;
          font-weight: bold;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }

        .tag-remove:hover {
          background-color: #e0e0e0;
          color: #ff4d4f;
        }

        .sort-dropdown {
          position: relative;
          display: inline-block;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background-color: white;
          border: 1px solid #e8e8e8;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          min-width: 160px;
          margin-top: 4px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          width: 100%;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          color: #333;
          transition: all 0.3s;
        }

        .dropdown-item:hover {
          background-color: #f5f5f5;
          color: #1890ff;
        }

        .button-icon {
          font-size: 16px;
          margin-right: 4px;
        }

        .dropdown-arrow {
          margin-left: 4px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
} 