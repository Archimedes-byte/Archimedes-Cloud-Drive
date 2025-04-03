import React from 'react';
import { File as FileType } from '../../../types/index';
import { getFileIcon } from '../../../utils/fileHelpers';
import { Home, Folder, Image as ImageIcon, FileText, Video, Music, File } from 'lucide-react';
import styles from './styles.module.css';

interface SearchViewProps {
  searchType: 'name' | 'tag';
  setSearchType: (type: 'name' | 'tag') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: FileType[];
  isLoading: boolean;
  error: string | null;
  handleSearch: (query: string, type: 'name' | 'tag') => void;
  handleFileClick: (file: FileType) => void;
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
    }[iconName] || File;
    
    return <IconComponent className="w-5 h-5 text-gray-700" />;
  };

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
                      {renderFileIcon(file.type, file.extension, file.isFolder)}
                    </span>
                    <span className="file-name">{file.name}</span>
                  </td>
                  <td>{file.size ? `${Math.round(file.size / 1024)} KB` : '-'}</td>
                  <td>{file.path}</td>
                  <td>
                    {file.createdAt 
                      ? new Date(file.createdAt).toLocaleString() 
                      : (file.uploadTime 
                          ? new Date(file.uploadTime).toLocaleString() 
                          : '-')
                    }
                  </td>
                  <td>
                    {Array.isArray(file.tags) && file.tags.length > 0 ? (
                      <div className={styles['tags-container']}>
                        {file.tags.map((tag, index) => (
                          <span key={index} className={styles['tag-badge']}>
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
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <p>未找到相关文件</p>
          <p className="empty-hint">尝试使用不同的关键词或标签</p>
        </div>
      ) : null}
    </div>
  );
}; 