import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 加载状态类型
 * initial: 初始加载状态，适用于首次加载，展示完整骨架屏
 * refresh: 刷新加载状态，适用于数据更新，展示局部加载指示器
 * success: 加载成功状态
 * error: 加载错误状态
 * idle: 闲置状态，未加载
 */
export type LoadingState = 'initial' | 'refresh' | 'success' | 'error' | 'idle';

/**
 * 加载状态管理钩子参数
 */
export interface UseLoadingStateProps {
  /** 是否初始加载 */
  initialLoad?: boolean;
  /** 最小加载时间（毫秒），防止闪烁 */
  minLoadingTime?: number;
  /** 错误超时时间（毫秒） */
  errorTimeout?: number;
}

/**
 * 加载状态管理钩子
 * 提供双状态管理模式 - 区分初始加载和刷新加载
 * 初始加载会展示完整的骨架屏，而刷新加载只展示局部加载指示器
 * 
 * @param options 配置选项
 * @returns 加载状态和控制方法
 */
export const useLoadingState = ({
  initialLoad = true,
  minLoadingTime = 800,
  errorTimeout = 15000
}: UseLoadingStateProps = {}) => {
  // 加载状态
  const [loadingState, setLoadingState] = useState<LoadingState>(initialLoad ? 'initial' : 'idle');
  
  // 错误信息
  const [error, setError] = useState<string | null>(null);
  
  // 引用值 - 不触发重渲染
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoadRef = useRef<boolean>(true);

  /**
   * 清除所有定时器
   */
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  }, []);

  /**
   * 开始加载
   * @param isRefresh 是否为刷新模式（而非初始加载）
   */
  const startLoading = useCallback((isRefresh = false) => {
    // 清除之前的计时器
    clearTimers();
    
    // 记录开始时间
    startTimeRef.current = Date.now();
    
    // 根据是否为首次加载来设置状态
    setLoadingState(isFirstLoadRef.current && !isRefresh ? 'initial' : 'refresh');
    
    // 设置错误超时
    errorTimerRef.current = setTimeout(() => {
      setLoadingState('error');
      setError('加载超时，请检查网络连接或重试');
    }, errorTimeout);
  }, [errorTimeout, clearTimers]);

  /**
   * 完成加载
   * @param hasError 是否发生错误
   * @param errorMessage 错误信息
   */
  const finishLoading = useCallback((hasError = false, errorMessage?: string) => {
    // 清除错误超时
    clearTimers();
    
    // 如果发生错误，直接设置错误状态
    if (hasError) {
      setLoadingState('error');
      setError(errorMessage || '加载失败，请重试');
      return;
    }
    
    // 计算已经过的时间
    const elapsedTime = Date.now() - startTimeRef.current;
    
    // 处理最小加载时间
    const completeLoading = () => {
      setLoadingState('success');
      setError(null);
      isFirstLoadRef.current = false;
    };
    
    // 如果经过的时间小于最小加载时间，延迟设置加载完成
    if (elapsedTime < minLoadingTime) {
      const remainingTime = minLoadingTime - elapsedTime;
      timerRef.current = setTimeout(completeLoading, remainingTime);
    } else {
      // 直接设置加载完成
      completeLoading();
    }
  }, [minLoadingTime, clearTimers]);

  /**
   * 重置加载状态
   */
  const resetLoadingState = useCallback(() => {
    setLoadingState('idle');
    setError(null);
    clearTimers();
  }, [clearTimers]);

  // 清理定时器
  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  // 初始加载
  useEffect(() => {
    if (initialLoad && isFirstLoadRef.current) {
      startLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loadingState,
    error,
    isLoading: loadingState === 'initial' || loadingState === 'refresh',
    isInitialLoading: loadingState === 'initial',
    isRefreshing: loadingState === 'refresh',
    isError: loadingState === 'error',
    isSuccess: loadingState === 'success',
    isIdle: loadingState === 'idle',
    startLoading,
    finishLoading,
    resetLoadingState,
    setError
  };
}; 