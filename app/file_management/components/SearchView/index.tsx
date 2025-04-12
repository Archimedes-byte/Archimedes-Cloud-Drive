import React from 'react';
import { ExtendedFile } from '@/app/types';
import { getFileIcon } from '@/app/utils/file/type';
import { Home, Folder, Image as ImageIcon, FileText, Video, Music, File, Search, AlertCircle, Calendar, Tag, Database, Settings } from 'lucide-react';
import styles from '@/app/shared/themes/components/searchView.module.css';

interface SearchViewProps {
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
  setDebounceDelay
}) => {
  const [showSettings, setShowSettings] = React.useState(false);
  const [showInputTip, setShowInputTip] = React.useState(false);

  // 处理搜索输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // 如果输入的长度为1且刚开始输入，显示提示
    if (value.length === 1 && !showInputTip) {
      setShowInputTip(true);
      // 3秒后自动隐藏提示
      setTimeout(() => setShowInputTip(false), 3000);
    } else if (value.length === 0) {
      setShowInputTip(false);
    }
  };

  // 格式化文件路径函数：优化目录路径显示
  const formatFilePath = (file: ExtendedFile) => {
    // 如果没有路径信息或为空字符串，显示为根目录
    if (!file.path || file.path.trim() === '') {
      return '/';
    }

    // 如果是根目录文件
    if (file.path === '/' || file.path === '.') {
      return '/';
    }

    // 确保路径以/开头
    let displayPath = file.path;
    if (!displayPath.startsWith('/')) {
      displayPath = `/${displayPath}`;
    }
    
    // 如果路径是文件名，则显示为根目录
    if (displayPath === `/${file.name}`) {
      return '/';
    }
    
    // 处理路径中的特殊字符和结尾斜杠
    displayPath = displayPath.replace(/\/+/g, '/'); // 移除多余的斜杠
    
    // 添加悬停显示完整路径的功能
    return displayPath;
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

  return (
    <div className={styles['search-view']}>
      <div className={styles['search-header']}>
        <div className={styles['search-header-title']}>
          <h2>搜索文件</h2>
          {setEnableRealTimeSearch && (
            <button
              className={styles['settings-button']}
              onClick={() => setShowSettings(!showSettings)}
              title="搜索设置"
            >
              <Settings size={18} />
            </button>
          )}
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
                启用实时搜索
              </label>
            </div>
            <div className={styles['setting-item']}>
              <label>
                搜索延迟(ms)：
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
          </div>
        )}

        <div className={styles['search-controls']}>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'name' | 'tag')}
            className={styles['search-type-select']}
          >
            <option value="name">按文件名搜索</option>
            <option value="tag">按标签搜索</option>
          </select>
          <div className={styles['search-input-group']}>
            <div className={styles['input-wrapper']}>
              <input
                type="text"
                placeholder={searchType === 'name' ? "输入文件名搜索..." : "输入标签搜索..."}
                value={searchQuery}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery, searchType)}
                autoFocus
              />
              {showInputTip && enableRealTimeSearch && (
                <div className={styles['input-tip']}>
                  正在使用实时搜索，输入时自动显示结果
                </div>
              )}
            </div>
            <button onClick={() => handleSearch(searchQuery, searchType)} className={styles['search-button']}>
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
          <span className={styles['loading-spinner']}>⌛</span>
          <p>正在搜索，请稍候...</p>
        </div>
      ) : searchResults.length > 0 ? (
        <div className={styles['search-results']}>
          <div className={styles['results-header']}>
            <span className={styles['results-count']}>找到 {searchResults.length} 个结果</span>
            {enableRealTimeSearch && searchQuery && (
              <span className={styles['realtime-badge']}>实时搜索结果</span>
            )}
          </div>
          <div className={styles['table-responsive']}>
            <table className={styles['file-table']}>
              <thead>
                <tr>
                  <th className={styles['th-filename']}>文件名</th>
                  <th className={styles['th-size']}>大小</th>
                  <th className={styles['th-location']}>所在目录</th>
                  <th className={styles['th-date']}>上传时间</th>
                  <th className={styles['th-tags']}>标签</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((file) => (
                  <tr
                    key={file.id}
                    className={styles['file-row']}
                    onClick={() => handleFileClick(file)}
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
                              backgroundColor: '#e1f0ff',
                              color: '#0072CE',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              display: 'inline-block',
                              verticalAlign: 'middle'
                            }}>
                              文件夹
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className={styles['size-cell']}>{formatFileSize(file.size)}</td>
                    <td className={styles['location-cell']}>
                      <div className={styles['location-info']}>
                        <Folder size={14} className={styles['location-icon']} />
                        <span 
                          className={styles['location-text']} 
                          title={file.path || '/'}
                          data-filepath={file.path}
                        >
                          {formatFilePath(file)}
                        </span>
                      </div>
                    </td>
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
                            <span key={index} className={styles['tag-badge']}>
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
          {searchType === 'tag' && (
            <p className={styles['empty-hint']}>您也可以切换到"按文件名搜索"尝试查找</p>
          )}
        </div>
      ) : null}
    </div>
  );
};