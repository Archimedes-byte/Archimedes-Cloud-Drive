import React from 'react';
import { ExtendedFile } from '../../types/index';
import { getFileIcon } from '../../utils/fileHelpers';
import { Home, Folder, Image as ImageIcon, FileText, Video, Music, File, Search, AlertCircle, Calendar, Tag, Database } from 'lucide-react';
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
  handleFileClick
}) => {
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
        <h2>搜索文件</h2>
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
            <input
              type="text"
              placeholder={searchType === 'name' ? "输入文件名搜索..." : "输入标签搜索..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery, searchType)}
            />
            <button onClick={() => handleSearch(searchQuery, searchType)}>
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
          </div>
          <table className={styles['file-table']}>
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
                  className={styles['file-row']}
                  onClick={() => handleFileClick(file)}
                >
                  <td className={styles['file-name-cell']}>
                    <span className={styles['file-type-icon']}>
                      {renderFileIcon(file.type, file.extension, file.isFolder)}
                    </span>
                    <span className={styles['file-name']}>{file.name}</span>
                  </td>
                  <td>{formatFileSize(file.size)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Database size={14} />
                      {file.path || '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} />
                      {formatDate(file.createdAt)}
                    </div>
                  </td>
                  <td>
                    {Array.isArray(file.tags) && file.tags.length > 0 ? (
                      <div className={styles['tags-container']}>
                        {file.tags.map((tag: string, index: number) => (
                          <span key={index} className={styles['tag-badge']}>
                            <Tag size={12} style={{ marginRight: '4px' }} />
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
      ) : searchQuery && !isLoading ? (
        <div className={styles['empty-state']}>
          <span className={styles['empty-icon']}>🔍</span>
          <p>未找到相关文件</p>
          <p className={styles['empty-hint']}>尝试使用不同的关键词或标签，或者检查拼写是否正确</p>
        </div>
      ) : null}
    </div>
  );
}; 