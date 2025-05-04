import { useState, useCallback, useEffect, useRef } from 'react';
import { FileInfo } from '@/app/types';
import { API_PATHS } from '@/app/lib/api/paths';
import { fileApi } from '@/app/lib/api/file-api';
import { createTrackableDebounce, TrackableDebounce } from '@/app/utils/function/debounce';

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
  /** 更新搜索结果中的文件 */
  updateFileInResults: (updatedFile: FileInfo) => void;
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
    if (typeof window !== 'undefined') {
      try {
        const savedHistory = localStorage.getItem('fileSearchHistory');
        return savedHistory ? JSON.parse(savedHistory) : [];
      } catch (e) {
        console.error('加载搜索历史失败:', e);
        return [];
      }
    }
    return [];
  });
  
  // 搜索配置
  const [searchType, setSearchType] = useState<SearchType>(initialSearchType);
  const [enableRealTimeSearch, setEnableRealTimeSearch] = useState(initialRealTimeSearch);
  const [debounceDelay, setDebounceDelay] = useState(initialDebounceDelay);

  // 创建一个防抖搜索函数的引用，使用可跟踪的防抖
  const debouncedSearchRef = useRef<TrackableDebounce<(query: string, type: SearchType) => void> | undefined>(undefined);

  /**
   * 实际执行搜索的函数
   */
  const executeSearch = useCallback(async (query: string, type: SearchType = 'name') => {
    // 获取当前搜索的调用ID，用于处理竞态条件
    const callId = debouncedSearchRef.current?.getCallId() || 0;
    
    // 如果查询为空，清空结果但不显示错误
    if (!query.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      console.log(`[搜索] 执行搜索: 类型=${type}, 关键词="${query.trim()}", 调用ID=${callId}`);
      
      // 使用fileApi客户端执行搜索
      const results = await fileApi.searchFiles({
        query: query.trim(),
        type,
        includeFolder: true,  // 明确设置为true，确保包含文件夹
        searchMode: type === 'tag' ? 'tag' : 'name'  // 将SearchType转换为新的searchMode参数
      });
      
      // 如果这不是最新的搜索调用，丢弃结果
      if (callId !== (debouncedSearchRef.current?.getCallId() || 0)) {
        console.log(`[搜索] 结果已过时(ID:${callId})，丢弃结果`);
        return;
      }
      
      // 对结果进行分析
      const folderCount = results.filter(r => r.isFolder).length;
      const fileCount = results.length - folderCount;
      console.log(`[搜索] 结果(ID:${callId}): 共${results.length}项，包含${folderCount}个文件夹，${fileCount}个文件`);
      
      // 文件夹优先显示处理（服务端已处理，这里是双重保障）
      const sortedResults = [...results].sort((a, b) => {
        // 首先按文件夹/文件排序
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        
        // 然后按更新时间排序
        return new Date(b.updatedAt || b.createdAt || 0).getTime() - 
               new Date(a.updatedAt || a.createdAt || 0).getTime();
      });
      
      setSearchResults(sortedResults);
      
      // 添加到搜索历史（不重复添加）
      if (query.trim()) {
        setSearchHistory(prev => {
          // 如果已存在则移除旧记录
          const filtered = prev.filter(item => item !== query);
          // 添加到最前面
          const newHistory = [query, ...filtered].slice(0, maxHistoryItems);
          
          // 保存到localStorage
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('fileSearchHistory', JSON.stringify(newHistory));
            }
          } catch (e) {
            console.error('保存搜索历史失败:', e);
          }
          
          return newHistory;
        });
      }
    } catch (error) {
      // 如果这不是最新的搜索调用，忽略错误
      if (callId !== (debouncedSearchRef.current?.getCallId() || 0)) {
        return;
      }
      
      console.error('搜索错误:', error);
      setError(error instanceof Error ? error.message : '搜索失败，请稍后重试');
      setSearchResults([]);
    } finally {
      // 如果这是最新的搜索调用，才更新加载状态
      if (callId === (debouncedSearchRef.current?.getCallId() || 0)) {
        setIsLoading(false);
      }
    }
  }, [maxHistoryItems]);

  // 更新防抖搜索函数
  useEffect(() => {
    // 初始化可跟踪的防抖函数
    debouncedSearchRef.current = createTrackableDebounce(
      (query: string, type: SearchType) => {
        executeSearch(query, type);
      },
      debounceDelay
    );
  }, [debounceDelay, executeSearch]);

  // 当搜索查询或类型变化时触发实时搜索
  useEffect(() => {
    if (enableRealTimeSearch && searchQuery.trim().length > 0 && debouncedSearchRef.current) {
      debouncedSearchRef.current.debouncedFn(searchQuery, searchType);
    }
  }, [searchQuery, searchType, enableRealTimeSearch]);

  // 组件卸载时取消所有待处理的搜索
  useEffect(() => {
    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, []);

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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fileSearchHistory');
      }
    } catch (e) {
      console.error('清除搜索历史失败:', e);
    }
  }, []);

  /**
   * 更新搜索结果中的文件
   * 当文件被重命名或更新时调用此方法
   */
  const updateFileInResults = useCallback((updatedFile: FileInfo) => {
    setSearchResults(prevResults => {
      // 查找并更新文件
      const updatedResults = prevResults.map(file => {
        if (file.id === updatedFile.id) {
          return updatedFile;
        }
        return file;
      });
      
      return updatedResults;
    });
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
    clearSearchHistory,
    updateFileInResults
  };
}; 