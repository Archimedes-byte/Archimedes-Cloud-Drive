import { useState, useCallback } from 'react';
import { FileInfo as File } from '@/app/shared/types/file';

export const useSearch = () => {
  const [showSearchView, setShowSearchView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<File[]>([]);
  const [searchType, setSearchType] = useState<'name' | 'tag'>('name');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setSearchResults(data.files || []);
    } catch (error) {
      console.error('搜索错误:', error);
      setError(error instanceof Error ? error.message : '搜索失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    showSearchView,
    setShowSearchView,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    searchType,
    setSearchType,
    isLoading: isLoading,
    error: error, 
    searchLoading: isLoading,
    searchError: error,
    handleSearch
  };
}; 