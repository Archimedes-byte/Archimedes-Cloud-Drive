import { useState, useCallback, useEffect } from 'react';
import { ExtendedFile } from '../types/index';

/**
 * 文件搜索钩子
 * 负责文件搜索功能和搜索结果状态管理
 */
export const useFileSearch = () => {
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExtendedFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchView, setShowSearchView] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  /**
   * 执行搜索
   */
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      // 空查询时清空结果并退出搜索视图
      setSearchResults([]);
      setShowSearchView(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchQuery(query);
    setShowSearchView(true);
    
    try {
      const response = await fetch(`/api/files/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.files);
        // 添加到搜索历史（不重复添加）
        setSearchHistory(prev => {
          // 如果已存在则移除旧记录
          const filtered = prev.filter(item => item !== query);
          // 添加到最前面
          return [query, ...filtered].slice(0, 10); // 保留最近10条
        });
      } else {
        setSearchError(data.message || '搜索失败');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('搜索错误:', error);
      setSearchError('搜索过程中出现错误，请重试');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * 清除搜索
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchView(false);
    setSearchError(null);
  }, []);

  /**
   * 从历史中选择搜索
   */
  const searchFromHistory = useCallback((query: string) => {
    handleSearch(query);
  }, [handleSearch]);

  /**
   * 清除搜索历史
   */
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    // 状态
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
    showSearchView,
    setShowSearchView,
    searchHistory,
    
    // 方法
    handleSearch,
    clearSearch,
    searchFromHistory,
    clearSearchHistory
  };
}; 