import React, { useEffect } from 'react';
import { ExtendedFile } from '@/app/types';
import { getFileIcon } from '@/app/utils/file/type';
import { Home, Folder, Image as ImageIcon, FileText, Video, Music, File, Search, AlertCircle, Calendar, Tag, Database, Settings } from 'lucide-react';
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
  onClearHistory
}) => {
  const [showSettings, setShowSettings] = React.useState(false);
  const [showInputTip, setShowInputTip] = React.useState(false);

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

    // 如果输入的长度为1且刚开始输入，显示提示
    if (value.length === 1 && !showInputTip) {
      setShowInputTip(true);
      // 使用防抖函数3秒后隐藏提示
      hideInputTipDebounced();
    } else if (value.length === 0) {
      setShowInputTip(false);
    }
  };

  // 格式化文件路径函数：优化目录路径显示
  const formatFilePath = (file: ExtendedFile) => {
    // 如果没有路径信息或为空字符串，显示为根目录
    if (!file.path || file.path.trim() === '') {
      return '根目录';
    }

    // 如果是根目录文件
    if (file.path === '/' || file.path === '.') {
      return '根目录';
    }

    // 检查路径是否看起来像UUID或系统ID路径（以/hZGX开头的路径）
    if (file.path.match(/^\/[a-zA-Z0-9]{8,}/)) {
      // 如果有parentId，尝试提取父文件夹名称
      if (file.parentId) {
        // 尝试从路径或其他数据中获取父文件夹名称
        // 这里我们没有直接的parentFolderName，所以使用替代方案
        return '文件夹';
      }
      return '根目录';
    }
    
    // 尝试从路径中提取用户友好的部分
    let displayPath = file.path;
    
    // 清理路径
    displayPath = displayPath.replace(/\/+/g, '/'); // 移除多余的斜杠
    
    // 如果路径的最后部分与文件名相同，则显示前面部分（父目录）
    const pathParts = displayPath.split('/').filter(Boolean);
    if (pathParts.length > 0 && pathParts[pathParts.length - 1] === file.name) {
      // 移除最后的文件名部分，只显示目录
      pathParts.pop();
    }
    
    // 如果还有路径部分，则显示为目录格式
    if (pathParts.length > 0) {
      return pathParts.join('/');
    }
    
    // 默认返回根目录
    return '根目录';
  };

  // 尝试获取文件的父文件夹名称
  const getParentFolderName = (file: ExtendedFile): string => {
    // 如果文件中已经有parentName属性，优先使用
    if ('parentName' in file && file.parentName) {
      return file.parentName as string;
    }
    
    // 如果没有父ID，返回根目录
    if (!file.parentId) {
      return '根目录';
    }
    
    // 如果文件路径是UUID格式，尝试从父ID或其他信息推断
    if (file.path && file.path.match(/^\/[a-zA-Z0-9]{8,}/)) {
      // 这里我们无法直接获取父文件夹的实际名称，因为缺少API调用
      // 在实际应用中，可能需要通过API获取父文件夹信息
      return '文件夹';
    }
    
    // 尝试从路径中提取父文件夹名称
    if (file.path) {
      const pathParts = file.path.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        // 假设最后一部分是当前文件名，倒数第二部分是父文件夹名
        if (pathParts.length > 1) {
          return pathParts[pathParts.length - 2];
        }
        return pathParts[0];
      }
    }
    
    // 默认返回一个通用名称
    return '文件夹';
  };

  // 生成可点击的文件路径导航元素
  const getNavigablePath = (file: ExtendedFile) => {
    // 确保有正确的路径和父ID
    if (!file.path || file.path === '/' || file.path === '.') {
      return { name: '根目录', id: null };
    }
    
    // 获取父文件夹ID
    const parentId = file.parentId;
    
    // 如果没有父ID，则返回根目录
    if (!parentId) {
      return { name: '根目录', id: null };
    }
    
    // 获取父文件夹名称
    const parentName = getParentFolderName(file);
    
    // 使用文件的parentId进行导航，显示父文件夹名称
    return { 
      name: parentName, 
      id: parentId
    };
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

  // 目录点击处理函数
  const handleDirectoryClick = (file: ExtendedFile, event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡，避免触发行点击事件
    
    // 创建父文件夹对象
    let parentFolder: ExtendedFile;
    
    if (!file.parentId) {
      // 如果没有父ID，则导航到根目录
      parentFolder = {
        id: null as any, // 使用any类型避免类型错误
        name: '根目录',
        isFolder: true,
        path: '/',
        // 添加必要的其他属性以满足ExtendedFile类型要求
        size: 0,
        createdAt: new Date().toISOString(), // 设置为ISO字符串而不是Date对象
        updatedAt: new Date().toISOString(), // 设置为ISO字符串而不是Date对象
        type: 'folder',
        tags: []
      } as ExtendedFile;
    } else {
      // 获取父文件夹名称
      const parentName = 'parentName' in file && file.parentName 
        ? file.parentName as string
        : getParentFolderName(file);
      
      // 创建一个导航用的文件夹对象
      parentFolder = {
        id: file.parentId,
        name: parentName,
        isFolder: true,
        path: file.path ? file.path.substring(0, file.path.lastIndexOf('/')) || '/' : '/',
        // 添加必要的其他属性以满足ExtendedFile类型要求
        size: 0,
        createdAt: new Date().toISOString(), // 设置为ISO字符串而不是Date对象
        updatedAt: new Date().toISOString(), // 设置为ISO字符串而不是Date对象
        type: 'folder',
        tags: []
      } as ExtendedFile;
    }
    
    // 导航到父文件夹
    handleFileClick(parentFolder);
    
    // 退出搜索视图，显示文件列表
    if (onExitSearchView) {
      console.log('退出搜索视图，显示文件列表');
      onExitSearchView();
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
                    className={`${styles['file-row']} ${handlePreviewFile ? styles['clickable-row'] : ''}`}
                    onClick={(e) => handleRowClick(file, e)}
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
                      <div 
                        className={styles['location-info']} 
                        onClick={(e) => handleDirectoryClick(file, e)}
                      >
                        <Folder size={14} className={`${styles['location-icon']} ${styles['clickable-icon']}`} />
                        <span 
                          className={`${styles['location-text']} ${styles['clickable-text']}`}
                          title={file.path || '/'}
                          data-filepath={file.path}
                        >
                          {getParentFolderName(file)}
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