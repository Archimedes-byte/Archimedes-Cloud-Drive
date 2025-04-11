import { useCallback, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { FileInfo, FileType } from '@/app/types';
import { api } from '@/app/lib/api/client';

/**
 * 搜索状态管理Hook - 基于全局状态管理
 * 负责管理文件搜索相关状态和操作
 */
export const useAppSearch = () => {
  const { state, dispatch } = useAppState();
  const {
    query,
    results,
    isLoading,
    error,
    type,
    enableRealTimeSearch,
    debounceDelay
  } = state.search;
  const { showSearchView } = state.ui;
  
  /**
   * 设置搜索视图显示状态
   */
  const setShowSearchView = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_SEARCH_VIEW', payload: show });
    
    // 如果关闭搜索，清空搜索结果
    if (!show) {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
    }
  }, [dispatch]);
  
  /**
   * 设置搜索查询
   */
  const setSearchQuery = useCallback((newQuery: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: newQuery });
  }, [dispatch]);
  
  /**
   * 设置搜索类型
   */
  const setSearchType = useCallback((newType: FileType | null) => {
    dispatch({ type: 'SET_SEARCH_TYPE', payload: newType });
  }, [dispatch]);
  
  /**
   * 设置是否启用实时搜索
   */
  const setEnableRealTimeSearch = useCallback((enable: boolean) => {
    dispatch({ type: 'SET_ENABLE_REAL_TIME_SEARCH', payload: enable });
  }, [dispatch]);
  
  /**
   * 设置防抖延迟时间
   */
  const setDebounceDelay = useCallback((delay: number) => {
    dispatch({ type: 'SET_DEBOUNCE_DELAY', payload: delay });
  }, [dispatch]);
  
  /**
   * 执行搜索操作
   */
  const handleSearch = useCallback(async (searchText?: string, searchFileType?: FileType | null) => {
    // 使用传入的参数或当前状态
    const searchQuery = searchText !== undefined ? searchText : query;
    const fileType = searchFileType !== undefined ? searchFileType : type;
    
    if (!searchQuery.trim()) {
      // 如果搜索词为空，清空结果并返回
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      return;
    }
    
    try {
      dispatch({ type: 'SET_SEARCH_LOADING', payload: true });
      dispatch({ type: 'SET_SEARCH_ERROR', payload: null });
      
      // 构建查询参数
      const params: Record<string, any> = {
        query: searchQuery
      };
      
      if (fileType) {
        params.type = fileType;
      }
      
      // 调用搜索API
      const searchResults = await api.get<FileInfo[]>('/api/files/search', {
        params
      });
      
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: searchResults });
      
      // 确保搜索视图可见
      if (!showSearchView) {
        dispatch({ type: 'SET_SHOW_SEARCH_VIEW', payload: true });
      }
    } catch (error) {
      console.error('搜索失败:', error);
      dispatch({ type: 'SET_SEARCH_ERROR', payload: error instanceof Error ? error.message : '搜索失败' });
    } finally {
      dispatch({ type: 'SET_SEARCH_LOADING', payload: false });
    }
  }, [dispatch, query, showSearchView, type]);
  
  // 实时搜索效果
  useEffect(() => {
    if (!enableRealTimeSearch || !query.trim()) return;
    
    const handler = setTimeout(() => {
      handleSearch();
    }, debounceDelay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [query, enableRealTimeSearch, debounceDelay, handleSearch]);
  
  return {
    query,
    results,
    isLoading,
    error,
    type,
    showSearchView,
    enableRealTimeSearch,
    debounceDelay,
    setSearchQuery,
    setSearchType,
    setShowSearchView,
    setEnableRealTimeSearch,
    setDebounceDelay,
    handleSearch
  };
}; 