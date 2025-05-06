import { useState, useCallback, useEffect, useRef } from 'react';
import { FileInfo, ApiResponse } from '@/app/types';
import { fileApi } from '@/app/lib/api/file-api';

// 使用扩展共享类型定义API响应类型
interface FileApiResponse extends ApiResponse {
  files?: FileInfo[];
  [key: string]: any;
}

/**
 * 最近文件和下载管理hook
 */
export function useRecentContent(pollingInterval = 5000) {
  // 最近文件相关状态
  const [recentFiles, setRecentFiles] = useState<FileInfo[]>([]);
  const [loadingRecentFiles, setLoadingRecentFiles] = useState(false);
  
  // 最近下载文件相关状态
  const [recentDownloads, setRecentDownloads] = useState<FileInfo[]>([]);
  const [loadingRecentDownloads, setLoadingRecentDownloads] = useState(false);
  
  // 增加刷新触发器和轮询控制状态
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  
  // 增加错误状态
  const [error, setError] = useState<Error | null>(null);
  
  // 使用useRef追踪加载状态和轮询定时器，避免依赖循环
  const isLoadingRecentFilesRef = useRef(false);
  const isLoadingRecentDownloadsRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRecentFilesUpdateRef = useRef<number>(0);
  const lastRecentDownloadsUpdateRef = useRef<number>(0);
  
  /**
   * 获取最近访问的文件
   */
  const fetchRecentFiles = useCallback(async () => {
    // 防止重复调用 - 使用ref而不是状态
    if (isLoadingRecentFilesRef.current) {
      return;
    }
    
    setError(null);
    setLoadingRecentFiles(true);
    isLoadingRecentFilesRef.current = true;
    
    try {
      const response = await fileApi.getRecentFiles();
      
      // 改进的响应处理逻辑
      if (response) {
        if (Array.isArray(response)) {
          setRecentFiles(response);
        } else if (typeof response === 'object' && response !== null) {
          const responseObj = response as FileApiResponse;
          if (responseObj.files && Array.isArray(responseObj.files)) {
            setRecentFiles(responseObj.files);
          } else {
            setRecentFiles([]);
          }
        } else {
          setRecentFiles([]);
        }
      } else {
        setRecentFiles([]);
      }
      
      // 更新最后成功获取时间
      lastRecentFilesUpdateRef.current = Date.now();
    } catch (error) {
      setRecentFiles([]);
      setError(error instanceof Error ? error : new Error('获取最近文件失败'));
    } finally {
      // 直接设置状态，不使用setTimeout
      setLoadingRecentFiles(false);
      isLoadingRecentFilesRef.current = false;
    }
  }, []);

  /**
   * 获取最近下载的文件
   */
  const fetchRecentDownloads = useCallback(async () => {
    // 防止重复调用 - 使用ref而不是状态
    if (isLoadingRecentDownloadsRef.current) {
      return;
    }
    
    setError(null);
    setLoadingRecentDownloads(true);
    isLoadingRecentDownloadsRef.current = true;
    
    try {
      const response = await fileApi.getRecentDownloads();
      
      // 改进的响应处理逻辑
      if (response) {
        if (Array.isArray(response)) {
          setRecentDownloads(response);
        } else if (typeof response === 'object' && response !== null) {
          const responseObj = response as FileApiResponse;
          if (responseObj.files && Array.isArray(responseObj.files)) {
            setRecentDownloads(responseObj.files);
          } else {
            setRecentDownloads([]);
          }
        } else {
          setRecentDownloads([]);
        }
      } else {
        setRecentDownloads([]);
      }
      
      // 更新最后成功获取时间
      lastRecentDownloadsUpdateRef.current = Date.now();
    } catch (error) {
      setRecentDownloads([]);
      setError(error instanceof Error ? error : new Error('获取最近下载文件失败'));
    } finally {
      // 直接设置状态，不使用setTimeout
      setLoadingRecentDownloads(false);
      isLoadingRecentDownloadsRef.current = false;
    }
  }, []);

  /**
   * 手动刷新所有内容
   */
  const refreshContent = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  /**
   * 切换轮询状态
   */
  const togglePolling = useCallback((enabled: boolean) => {
    setIsPollingEnabled(enabled);
  }, []);

  // 处理轮询数据获取
  useEffect(() => {
    // 清理函数，避免内存泄漏
    const cleanup = () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };

    const fetchData = async () => {
      // 只有在启用轮询且当前没有正在加载时才进行
      if (isPollingEnabled) {
        const now = Date.now();
        
        // 从上次更新超过2秒后才重新获取
        if (now - lastRecentFilesUpdateRef.current > 2000 && !isLoadingRecentFilesRef.current) {
          fetchRecentFiles();
        }
        
        if (now - lastRecentDownloadsUpdateRef.current > 2000 && !isLoadingRecentDownloadsRef.current) {
          fetchRecentDownloads();
        }
      }
    };

    // 初始化数据
    if (!hasInitializedRef.current) {
      fetchData();
      hasInitializedRef.current = true;
    }
    
    // 设置轮询间隔，避免重复设置
    if (!pollingTimerRef.current && isPollingEnabled) {
      pollingTimerRef.current = setInterval(fetchData, pollingInterval);
    }
    
    return cleanup;
  }, [fetchRecentFiles, fetchRecentDownloads, isPollingEnabled, pollingInterval]);
  
  // 处理刷新触发器
  useEffect(() => {
    if (refreshTrigger > 0) {
      // 仅当刷新触发器变化时刷新数据
      fetchRecentFiles();
      fetchRecentDownloads();
    }
  }, [refreshTrigger, fetchRecentFiles, fetchRecentDownloads]);

  return {
    // 最近文件相关
    recentFiles,
    loadingRecentFiles,
    
    // 最近下载相关
    recentDownloads,
    loadingRecentDownloads,
    
    // 操作方法
    fetchRecentFiles,
    fetchRecentDownloads,
    refreshContent,
    togglePolling,
    
    // 错误状态
    error
  };
} 