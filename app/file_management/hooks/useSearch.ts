import { useState, useCallback, useEffect, useRef } from 'react';
import { FileInfo as File } from '@/app/shared/types/file';

// 防抖函数
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

export const useSearch = () => {
  const [showSearchView, setShowSearchView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<File[]>([]);
  const [searchType, setSearchType] = useState<'name' | 'tag'>('name');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enableRealTimeSearch, setEnableRealTimeSearch] = useState(true);
  const [debounceDelay, setDebounceDelay] = useState(300);

  // 实际执行搜索的函数
  const executeSearch = useCallback(async (query: string, type: 'name' | 'tag' = 'name') => {
    // 如果查询为空，且不是主动调用的搜索，清空结果但不显示错误
    if (!query.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      console.log(`正在执行搜索，查询: ${query}, 类型: ${type}`);
      
      // 构建完整的URL，确保包含搜索类型参数
      const url = `/api/files/search?query=${encodeURIComponent(query.trim())}&type=${type}`;
      console.log('搜索URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error(`搜索请求失败: 状态码 ${response.status}, 错误信息: ${errText}`);
        throw new Error(`搜索失败 (${response.status}): ${errText || '服务器错误'}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('解析搜索结果JSON失败:', e);
        throw new Error('解析搜索结果失败，服务器返回了无效的数据');
      }
      
      console.log('搜索结果:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // 从data.data获取文件列表
      const results = data.data || [];
      setSearchResults(results);
      
      // 记录搜索统计信息
      const folderCount = results.filter((f: any) => f.isFolder).length;
      const fileCount = results.length - folderCount;
      console.log(`搜索成功: 共${results.length}个结果，其中文件夹${folderCount}个，文件${fileCount}个`);
      
      // 验证结果中是否包含完整路径信息
      const missingPaths = results.filter((f: any) => !f.path).length;
      if (missingPaths > 0) {
        console.warn(`警告: ${missingPaths}个结果缺少路径信息`);
      }
    } catch (error) {
      console.error('搜索错误:', error);
      setError(error instanceof Error ? error.message : '搜索失败，请稍后重试');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 创建一个防抖搜索函数的引用
  const debouncedSearchRef = useRef<(...args: any[]) => void>(() => {});

  // 更新防抖搜索函数
  useEffect(() => {
    debouncedSearchRef.current = debounce(
      (query: string, type: 'name' | 'tag') => {
        executeSearch(query, type);
      }, 
      debounceDelay
    );
  }, [debounceDelay, executeSearch]);

  // 当搜索查询或类型变化时触发实时搜索
  useEffect(() => {
    if (enableRealTimeSearch && searchQuery.trim().length > 0) {
      console.log('触发实时搜索:', searchQuery, searchType);
      debouncedSearchRef.current(searchQuery, searchType);
    }
  }, [searchQuery, searchType, enableRealTimeSearch]);

  // 处理搜索（用于手动触发和Enter键触发）
  const handleSearch = useCallback(async (query: string, type: 'name' | 'tag' = 'name') => {
    // 直接执行搜索，不使用防抖
    console.log('手动触发搜索:', query, type);
    await executeSearch(query, type);
  }, [executeSearch]);

  // 更新搜索查询并设置loading状态
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    
    // 只在实时搜索启用且查询不为空时设置loading状态
    if (enableRealTimeSearch && query.trim().length > 0) {
      setIsLoading(true);
    } else if (!query.trim()) {
      // 如果查询为空，清空结果
      setSearchResults([]);
    }
  }, [enableRealTimeSearch]);

  return {
    showSearchView,
    setShowSearchView,
    searchQuery,
    setSearchQuery: updateSearchQuery,
    searchResults,
    setSearchResults,
    searchType,
    setSearchType,
    isLoading,
    error,
    searchLoading: isLoading,
    searchError: error,
    handleSearch,
    enableRealTimeSearch,
    setEnableRealTimeSearch,
    debounceDelay,
    setDebounceDelay
  };
}; 