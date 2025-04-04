import { useState, useEffect, useCallback, useRef } from 'react';

// 加载状态类型
export type LoadingState = 'initial' | 'refresh' | 'success' | 'error' | 'idle';

// 加载状态管理钩子参数
interface UseLoadingStateProps {
  initialLoad?: boolean;
  minLoadingTime?: number;
  errorTimeout?: number;
}

/**
 * 双状态管理模式 - 区分初始加载和刷新加载
 * 初始加载会展示完整的骨架屏，而刷新加载只展示局部加载指示器
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
  
  // 保存计时器和开始时间的引用
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 标记是否为第一次加载
  const isFirstLoadRef = useRef<boolean>(true);

  // 开始加载
  const startLoading = useCallback((isRefresh = false) => {
    // 清除之前的计时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    
    // 记录开始时间
    startTimeRef.current = Date.now();
    
    // 根据是否为首次加载来设置状态
    setLoadingState(isFirstLoadRef.current && !isRefresh ? 'initial' : 'refresh');
    
    // 设置错误超时
    errorTimerRef.current = setTimeout(() => {
      setLoadingState('error');
      setError('加载超时，请检查网络连接或重试');
    }, errorTimeout);
    
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, [errorTimeout]);

  // 完成加载
  const finishLoading = useCallback((hasError = false, errorMessage?: string) => {
    // 清除错误超时
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    
    // 计算已经过的时间
    const elapsedTime = Date.now() - startTimeRef.current;
    
    // 如果发生错误或已达到最小加载时间，直接设置状态
    if (hasError) {
      setLoadingState('error');
      setError(errorMessage || '加载失败，请重试');
      return;
    }
    
    // 如果经过的时间小于最小加载时间，延迟设置加载完成
    if (elapsedTime < minLoadingTime) {
      const remainingTime = minLoadingTime - elapsedTime;
      
      timerRef.current = setTimeout(() => {
        setLoadingState('success');
        setError(null);
        // 首次加载完成后，更新标记
        isFirstLoadRef.current = false;
      }, remainingTime);
      
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    } else {
      // 直接设置加载完成
      setLoadingState('success');
      setError(null);
      // 首次加载完成后，更新标记
      isFirstLoadRef.current = false;
    }
  }, [minLoadingTime]);

  // 重置加载状态
  const resetLoadingState = useCallback(() => {
    setLoadingState('idle');
    setError(null);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

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