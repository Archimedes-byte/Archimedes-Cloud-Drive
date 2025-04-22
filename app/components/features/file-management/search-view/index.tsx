import React, { useEffect, useState } from 'react';
import { ExtendedFile } from '@/app/types';
import { getFileIcon } from '@/app/utils/file/type';
import { 
  Home, Folder, Image as ImageIcon, FileText, Video, Music, 
  File, Search, AlertCircle, Calendar, Tag, Database, Settings, 
  X, Sparkles, Filter, Zap, ArrowDownUp, Upload, Download
} from 'lucide-react';
import styles from './SearchView.module.css';
import { createCancelableDebounce } from '@/app/utils/function/debounce';

export interface SearchViewProps {
  searchType: 'name' | 'tag';
  setSearchType: (type: 'name' | 'tag') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: ExtendedFile[];
  isLoading: boolean;
  error: string | null;
  handleSearch: (query: string, type: 'name' | 'tag') => void;
  handleFileClick: (file: ExtendedFile) => void;
  enableRealTimeSearch?: boolean;
  setEnableRealTimeSearch?: (enable: boolean) => void;
  debounceDelay?: number;
  setDebounceDelay?: (delay: number) => void;
  handlePreviewFile?: (file: ExtendedFile) => void;
  onExitSearchView?: () => void;
  onClose?: () => void;
  onFilesSelect?: (selectedFileIds: string[]) => void;
  onFileSelect?: (file: ExtendedFile, checked: boolean) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onFileContextMenu?: (event: React.MouseEvent, file: ExtendedFile) => void;
  selectedFiles?: string[];
  onClearHistory?: () => void;
  onSearch?: (query: string, type: 'name' | 'tag') => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  searchType,
  setSearchType,
  searchQuery,
  setSearchQuery,
  searchResults,
  isLoading,
  error,
  handleSearch,
  handleFileClick,
  enableRealTimeSearch = true,
  setEnableRealTimeSearch,
  debounceDelay = 300,
  setDebounceDelay,
  handlePreviewFile,
  onExitSearchView,
  onClose,
  onFilesSelect,
  onFileSelect,
  onSelectAll,
  onDeselectAll,
  onFileContextMenu,
  selectedFiles,
  onClearHistory,
  onSearch
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showInputTip, setShowInputTip] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [showFilters, setShowFilters] = useState(false);

  // 使用可取消的防抖工具创建隐藏提示的函数
  const { debouncedFn: hideInputTipDebounced, cancel: cancelHideInputTip } = React.useMemo(
    () => createCancelableDebounce(() => setShowInputTip(false), 3000),
    []
  );

  // 在组件卸载时清理
  useEffect(() => {
    return () => {
      // 清理防抖函数
      cancelHideInputTip();
    };
  }, [cancelHideInputTip]);

  // 处理搜索输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // 如果启用了实时搜索并且有输入值，则触发搜索
    if (enableRealTimeSearch && value && value.length > 0) {
      if (onSearch) {
        onSearch(value, searchType);
      } else {
        handleSearch(value, searchType);
      }
    }

    // 如果输入的长度为1且刚开始输入，显示提示
    if (value.length === 1 && !showInputTip) {
      setShowInputTip(true);
      // 使用防抖函数3秒后隐藏提示
      hideInputTipDebounced();
    } else if (value.length === 0) {
      setShowInputTip(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = searchQuery.trim();
      if (value) {
        if (onSearch) {
          onSearch(value, searchType);
        } else {
          handleSearch(value, searchType);
        }
      }
    }
  };

  const renderFileIcon = (type: string | undefined, extension: string | undefined, isFolder: boolean | undefined) => {
    const _isFolder = isFolder === true;

    const iconName = getFileIcon(type, extension, _isFolder);
    const IconComponent = {
      folder: Folder,
      'file-text': FileText,
      image: ImageIcon,
      video: Video,
      music: Music,
      file: File
    }[iconName as string] || File;

    return <IconComponent className={styles['file-type-icon']} />;
  };

  const formatFileSize = (size: number | undefined) => {
    if (!size) return '-';

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateValue: string | Date | undefined) => {
    if (!dateValue) return '-';

    try {
      // 如果已经是Date对象，直接使用
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

      // 检查日期是否有效
      if (isNaN(date.getTime())) return '-';

      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('日期格式化错误:', error);
      return '-';
    }
  };

  // 文件行点击处理函数
  const handleRowClick = (file: ExtendedFile, event: React.MouseEvent) => {
    // 防止冒泡，避免触发父元素的点击事件
    event.stopPropagation();
    
    // 根据文件类型选择处理方式
    if (file.isFolder) {
      // 如果是文件夹，调用导航处理函数
      handleFileClick(file);
    } else if (handlePreviewFile) {
      // 如果是文件并且提供了预览函数，调用预览处理函数
      handlePreviewFile(file);
    } else {
      // 如果没有提供预览函数，默认使用文件点击处理
      handleFileClick(file);
    }
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchQuery('');
    if (onClose) {
      onClose();
    }
  };

  // 切换排序顺序
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // 设置排序字段
  const handleSortByChange = (field: 'name' | 'date' | 'size') => {
    if (sortBy === field) {
      toggleSortOrder();
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // 排序结果
  const sortedResults = [...searchResults].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'name':
        return multiplier * (a.name || '').localeCompare(b.name || '');
      case 'date':
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return multiplier * (dateA - dateB);
      case 'size':
        const sizeA = a.size || 0;
        const sizeB = b.size || 0;
        return multiplier * (sizeA - sizeB);
      default:
        return 0;
    }
  });

  return (
    <div className={styles['search-view']}>
      <div className={styles['search-header']}>
        <div className={styles['search-header-title']}>
          <h2>
            {searchType === 'name' ? (
              <>
                <Sparkles size={20} style={{ marginRight: '8px', display: 'inline' }} />
                搜索文件
              </>
            ) : (
              <>
                <Tag size={20} style={{ marginRight: '8px', display: 'inline' }} />
                标签搜索
              </>
            )}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={styles['settings-button']}
              onClick={() => setShowFilters(!showFilters)}
              title="排序与筛选"
            >
              <Filter size={18} />
            </button>
            {setEnableRealTimeSearch && (
              <button
                className={styles['settings-button']}
                onClick={() => setShowSettings(!showSettings)}
                title="搜索设置"
              >
                <Settings size={18} />
              </button>
            )}
            {onClose && (
              <button
                className={styles['settings-button']}
                onClick={onClose}
                title="关闭搜索"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {showSettings && setEnableRealTimeSearch && setDebounceDelay && (
          <div className={styles['search-settings']}>
            <div className={styles['setting-item']}>
              <label>
                <input
                  type="checkbox"
                  checked={enableRealTimeSearch}
                  onChange={(e) => setEnableRealTimeSearch(e.target.checked)}
                />
                <Zap size={16} style={{ marginRight: '4px' }} />
                启用实时搜索
              </label>
            </div>
            <div className={styles['setting-item']}>
              <label>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <Database size={16} style={{ marginRight: '4px' }} />
                  搜索延迟(ms)：
                </span>
                <select
                  value={debounceDelay}
                  onChange={(e) => setDebounceDelay(Number(e.target.value))}
                  disabled={!enableRealTimeSearch}
                >
                  <option value={100}>100 (快速)</option>
                  <option value={300}>300 (默认)</option>
                  <option value={500}>500 (适中)</option>
                  <option value={800}>800 (慢速)</option>
                </select>
              </label>
            </div>
            {onClearHistory && (
              <div className={styles['setting-item']} style={{ marginTop: '8px' }}>
                <button
                  onClick={onClearHistory}
                  style={{
                    backgroundColor: 'rgba(255, 86, 48, 0.1)',
                    color: '#ff5630',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <X size={14} /> 清除搜索历史
                </button>
              </div>
            )}
          </div>
        )}

        {showFilters && (
          <div className={styles['search-settings']}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '10px',
              paddingBottom: '10px',
              borderBottom: '1px solid rgba(226, 232, 240, 0.5)'
            }}>
              <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <ArrowDownUp size={16} style={{ marginRight: '8px' }} />
                排序方式
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleSortByChange('name')}
                  style={{
                    backgroundColor: sortBy === 'name' ? 'rgba(52, 144, 220, 0.1)' : 'transparent',
                    color: sortBy === 'name' ? '#3490dc' : '#5e6c84',
                    border: '1px solid',
                    borderColor: sortBy === 'name' ? '#3490dc' : 'rgba(226, 232, 240, 0.8)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  文件名 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSortByChange('date')}
                  style={{
                    backgroundColor: sortBy === 'date' ? 'rgba(52, 144, 220, 0.1)' : 'transparent',
                    color: sortBy === 'date' ? '#3490dc' : '#5e6c84',
                    border: '1px solid',
                    borderColor: sortBy === 'date' ? '#3490dc' : 'rgba(226, 232, 240, 0.8)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  日期 {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSortByChange('size')}
                  style={{
                    backgroundColor: sortBy === 'size' ? 'rgba(52, 144, 220, 0.1)' : 'transparent',
                    color: sortBy === 'size' ? '#3490dc' : '#5e6c84',
                    border: '1px solid',
                    borderColor: sortBy === 'size' ? '#3490dc' : 'rgba(226, 232, 240, 0.8)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  大小 {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <Filter size={16} style={{ marginRight: '8px' }} />
                搜索类型
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSearchType('name')}
                  style={{
                    backgroundColor: searchType === 'name' ? 'rgba(52, 144, 220, 0.1)' : 'transparent',
                    color: searchType === 'name' ? '#3490dc' : '#5e6c84',
                    border: '1px solid',
                    borderColor: searchType === 'name' ? '#3490dc' : 'rgba(226, 232, 240, 0.8)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <File size={14} /> 文件名搜索
                </button>
                <button
                  onClick={() => setSearchType('tag')}
                  style={{
                    backgroundColor: searchType === 'tag' ? 'rgba(52, 144, 220, 0.1)' : 'transparent',
                    color: searchType === 'tag' ? '#3490dc' : '#5e6c84',
                    border: '1px solid',
                    borderColor: searchType === 'tag' ? '#3490dc' : 'rgba(226, 232, 240, 0.8)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Tag size={14} /> 标签搜索
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={styles['search-controls']}>
          <div className={styles['search-input-group']}>
            <div className={styles['input-wrapper']}>
              <input
                type="text"
                placeholder={searchType === 'name' ? "输入文件名搜索..." : "输入标签搜索..."}
                value={searchQuery}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                autoFocus
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#8c9db5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '50%'
                  }}
                >
                  <X size={16} />
                </button>
              )}
              {showInputTip && enableRealTimeSearch && (
                <div className={styles['input-tip']}>
                  <Zap size={14} style={{ marginRight: '4px' }} />
                  正在使用实时搜索，输入时自动显示结果
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                if (onSearch) {
                  onSearch(searchQuery, searchType);
                } else {
                  handleSearch(searchQuery, searchType);
                }
              }} 
              className={styles['search-button']}
              disabled={!searchQuery.trim()}
            >
              <Search className={styles['button-icon']} />
              搜索
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles['error-message']}>
          <AlertCircle size={18} />
          <span style={{ marginLeft: '8px' }}>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className={styles['loading']}>
          <div className={styles['loading-spinner']}></div>
          <p>正在搜索，请稍候...</p>
        </div>
      ) : sortedResults.length > 0 ? (
        <div className={styles['search-results']}>
          <div className={styles['results-header']}>
            <span className={styles['results-count']}>找到 {sortedResults.length} 个结果</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {enableRealTimeSearch && searchQuery && (
                <span className={styles['realtime-badge']}>
                  <Zap size={12} style={{ marginRight: '4px' }} />
                  实时搜索结果
                </span>
              )}
              {onSelectAll && onDeselectAll && selectedFiles && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={onSelectAll}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      color: '#5e6c84',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Download size={12} />
                    全选
                  </button>
                  <button
                    onClick={onDeselectAll}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      color: '#5e6c84',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <X size={12} />
                    取消选择
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className={styles['table-responsive']}>
            <table className={styles['file-table']}>
              <thead>
                <tr>
                  <th className={styles['th-filename']}>文件名</th>
                  <th className={styles['th-size']}>大小</th>
                  <th className={styles['th-date']}>上传时间</th>
                  <th className={styles['th-tags']}>标签</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((file) => (
                  <tr
                    key={file.id}
                    className={`${styles['file-row']} ${handlePreviewFile ? styles['clickable-row'] : ''}`}
                    onClick={(e) => handleRowClick(file, e)}
                    onContextMenu={(e) => {
                      if (onFileContextMenu) {
                        e.preventDefault();
                        onFileContextMenu(e, file);
                      }
                    }}
                  >
                    <td className={styles['file-name-cell']}>
                      <div className={styles['file-info']}>
                        <span className={styles['file-type-icon']}>
                          {renderFileIcon(file.type, file.extension, file.isFolder)}
                        </span>
                        <span className={styles['file-name']}>
                          {file.name}
                          {file.isFolder && (
                            <span style={{
                              marginLeft: '5px',
                              fontSize: '11px',
                              backgroundColor: 'rgba(52, 144, 220, 0.1)',
                              color: '#3490dc',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              verticalAlign: 'middle',
                              border: '1px solid rgba(52, 144, 220, 0.2)'
                            }}>
                              文件夹
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className={styles['size-cell']}>{formatFileSize(file.size)}</td>
                    <td className={styles['date-cell']}>
                      <div className={styles['date-info']}>
                        <Calendar size={14} className={styles['date-icon']} />
                        <span>{formatDate(file.createdAt)}</span>
                      </div>
                    </td>
                    <td className={styles['tags-cell']}>
                      {Array.isArray(file.tags) && file.tags.length > 0 ? (
                        <div className={styles['tags-container']}>
                          {file.tags.map((tag: string, index: number) => (
                            <span 
                              key={index} 
                              className={styles['tag-badge']}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchType('tag');
                                setSearchQuery(tag);
                                if (onSearch) {
                                  onSearch(tag, 'tag');
                                } else {
                                  handleSearch(tag, 'tag');
                                }
                              }}
                            >
                              <Tag size={12} className={styles['tag-icon']} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className={styles['no-tags']}>无标签</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : searchQuery && !isLoading ? (
        <div className={styles['empty-state']}>
          <span className={styles['empty-icon']}>🔍</span>
          <p>未找到相关文件</p>
          <p className={styles['empty-hint']}>
            尝试使用不同的关键词{searchType === 'tag' ? '或检查标签拼写' : '或检查文件名拼写'}
          </p>
        </div>
      ) : null}
    </div>
  );
};