import { useState, useCallback, useEffect, useRef } from 'react';
import { FileInfo } from '@/app/types';
import { API_PATHS } from '@/app/lib/api/paths';
import { fileApi } from '@/app/lib/api/file-api';

/**
 * 防抖函数
 * @param fn 要防抖的函数
 * @param ms 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 */
const debounce = <T extends (...args: any[]) => any>(fn: T, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

/**
 * 搜索类型
 */
export type SearchType = 'name' | 'content' | 'tag';

/**
 * 文件搜索钩子配置
 */
export interface FileSearchOptions {
  /** 是否启用实时搜索 */
  enableRealTimeSearch?: boolean;
  /** 防抖延迟（毫秒） */
  debounceDelay?: number;
  /** 初始搜索类型 */
  initialSearchType?: SearchType;
  /** 最大搜索历史记录数 */
  maxHistoryItems?: number;
}

/**
 * 文件搜索钩子接口
 */
export interface FileSearchHook {
  /** 搜索查询 */
  searchQuery: string;
  /** 设置搜索查询 */
  setSearchQuery: (query: string) => void;
  /** 搜索结果 */
  searchResults: FileInfo[];
  /** 是否正在搜索 */
  isLoading: boolean;
  /** 搜索错误 */
  error: string | null;
  /** 是否显示搜索视图 */
  showSearchView: boolean;
  /** 设置是否显示搜索视图 */
  setShowSearchView: (show: boolean) => void;
  /** 搜索历史 */
  searchHistory: string[];
  /** 搜索类型 */
  searchType: SearchType;
  /** 设置搜索类型 */
  setSearchType: (type: SearchType) => void;
  /** 是否启用实时搜索 */
  enableRealTimeSearch: boolean;
  /** 设置是否启用实时搜索 */
  setEnableRealTimeSearch: (enable: boolean) => void;
  /** 防抖延迟（毫秒） */
  debounceDelay: number;
  /** 设置防抖延迟 */
  setDebounceDelay: (delay: number) => void;
  /** 执行搜索 */
  handleSearch: (query?: string, type?: SearchType) => Promise<void>;
  /** 清除搜索 */
  clearSearch: () => void;
  /** 从历史中选择搜索 */
  searchFromHistory: (query: string) => void;
  /** 清除搜索历史 */
  clearSearchHistory: () => void;
}

/**
 * 文件搜索钩子
 * 提供文件搜索功能，支持多种搜索类型和实时搜索
 * 
 * @param options 搜索配置选项
 * @returns 文件搜索相关状态和方法
 */
export const useFileSearch = ({
  enableRealTimeSearch: initialRealTimeSearch = true,
  debounceDelay: initialDebounceDelay = 300,
  initialSearchType = 'name',
  maxHistoryItems = 10
}: FileSearchOptions = {}): FileSearchHook => {
  // 搜索状态
  const [searchQuery, setSearchQueryState] = useState('');
  const [searchResults, setSearchResults] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearchView, setShowSearchView] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    // 从localStorage加载搜索历史
    try {
      const savedHistory = localStorage.getItem('fileSearchHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) {
      console.error('加载搜索历史失败:', e);
      return [];
    }
  });
  
  // 搜索配置
  const [searchType, setSearchType] = useState<SearchType>(initialSearchType);
  const [enableRealTimeSearch, setEnableRealTimeSearch] = useState(initialRealTimeSearch);
  const [debounceDelay, setDebounceDelay] = useState(initialDebounceDelay);

  // 创建一个防抖搜索函数的引用
  const debouncedSearchRef = useRef<(query: string, type: SearchType) => void>(() => {});

  /**
   * 实际执行搜索的函数
   */
  const executeSearch = useCallback(async (query: string, type: SearchType = 'name') => {
    // 如果查询为空，清空结果但不显示错误
    if (!query.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      console.log(`正在执行搜索，查询: ${query}, 类型: ${type}`);
      
      // 使用fileApi客户端执行搜索
      const results = await fileApi.searchFiles({
        query: query.trim(),
        type
      });
      
      setSearchResults(results);
      
      // 添加到搜索历史（不重复添加）
      if (query.trim()) {
        setSearchHistory(prev => {
          // 如果已存在则移除旧记录
          const filtered = prev.filter(item => item !== query);
          // 添加到最前面
          const newHistory = [query, ...filtered].slice(0, maxHistoryItems);
          
          // 保存到localStorage
          try {
            localStorage.setItem('fileSearchHistory', JSON.stringify(newHistory));
          } catch (e) {
            console.error('保存搜索历史失败:', e);
          }
          
          return newHistory;
        });
      }
    } catch (error) {
      console.error('搜索错误:', error);
      setError(error instanceof Error ? error.message : '搜索失败，请稍后重试');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [maxHistoryItems]);

  // 更新防抖搜索函数
  useEffect(() => {
    debouncedSearchRef.current = debounce(
      (query: string, type: SearchType) => {
        executeSearch(query, type);
      }, 
      debounceDelay
    );
  }, [debounceDelay, executeSearch]);

  // 当搜索查询或类型变化时触发实时搜索
  useEffect(() => {
    if (enableRealTimeSearch && searchQuery.trim().length > 0) {
      debouncedSearchRef.current(searchQuery, searchType);
    }
  }, [searchQuery, searchType, enableRealTimeSearch]);

  /**
   * 设置搜索查询并更新状态
   */
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    
    // 只在实时搜索启用且查询不为空时设置loading状态
    if (enableRealTimeSearch && query.trim().length > 0) {
      setIsLoading(true);
    } else if (!query.trim()) {
      // 如果查询为空，清空结果
      setSearchResults([]);
    }
  }, [enableRealTimeSearch]);

  /**
   * 处理搜索（用于手动触发和Enter键触发）
   */
  const handleSearch = useCallback(async (query?: string, type?: SearchType) => {
    const effectiveQuery = query !== undefined ? query : searchQuery;
    const effectiveType = type || searchType;
    
    if (effectiveQuery.trim()) {
      setShowSearchView(true);
    }
    
    // 直接执行搜索，不使用防抖
    await executeSearch(effectiveQuery, effectiveType);
  }, [executeSearch, searchQuery, searchType]);

  /**
   * 清除搜索
   */
  const clearSearch = useCallback(() => {
    setSearchQueryState('');
    setSearchResults([]);
    setShowSearchView(false);
    setError(null);
  }, []);

  /**
   * 从历史中选择搜索
   */
  const searchFromHistory = useCallback((query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  }, [handleSearch, setSearchQuery]);

  /**
   * 清除搜索历史
   */
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    // 清除localStorage中的搜索历史
    try {
      localStorage.removeItem('fileSearchHistory');
    } catch (e) {
      console.error('清除搜索历史失败:', e);
    }
  }, []);

  return {
    // 搜索状态
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading,
    error,
    showSearchView,
    setShowSearchView,
    searchHistory,
    
    // 搜索配置
    searchType,
    setSearchType,
    enableRealTimeSearch,
    setEnableRealTimeSearch,
    debounceDelay,
    setDebounceDelay,
    
    // 搜索方法
    handleSearch,
    clearSearch,
    searchFromHistory,
    clearSearchHistory
  };
}; 