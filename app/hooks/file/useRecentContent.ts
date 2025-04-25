import { useState, useCallback, useEffect, useRef } from 'react';
import { FileInfo } from '@/app/types';
import { fileApi } from '@/app/lib/api/file-api';

// 添加API响应类型定义
interface FileApiResponse {
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
    console.log('🔄 fetchRecentFiles 被调用，当前加载状态:', isLoadingRecentFilesRef.current);
    
    // 防止重复调用 - 使用ref而不是状态
    if (isLoadingRecentFilesRef.current) {
      console.log('⚠️ fetchRecentFiles 已经在加载中，跳过');
      return;
    }
    
    setError(null);
    setLoadingRecentFiles(true);
    isLoadingRecentFilesRef.current = true;
    
    try {
      console.log('📂 开始获取最近访问文件');
      const response = await fileApi.getRecentFiles();
      console.log('📂 最近访问文件API响应:', response);
      
      // 改进的响应处理逻辑
      if (response) {
        if (Array.isArray(response)) {
          // 直接是文件数组
          console.log('📂 收到文件数组响应，数量:', response.length);
          setRecentFiles(response);
        } else if (typeof response === 'object' && response !== null) {
          const responseObj = response as FileApiResponse;
          if (responseObj.files && Array.isArray(responseObj.files)) {
            // 包含files字段的对象
            console.log('📂 收到包含files字段的对象响应，文件数量:', responseObj.files.length);
            setRecentFiles(responseObj.files);
          } else {
            console.warn('📂 API响应格式不符合预期:', responseObj);
            setRecentFiles([]);
          }
        } else {
          console.warn('📂 API响应格式不符合预期:', response);
          setRecentFiles([]);
        }
      } else {
        console.warn('📂 API返回空响应');
        setRecentFiles([]);
      }
      
      // 更新最后成功获取时间
      lastRecentFilesUpdateRef.current = Date.now();
    } catch (error) {
      console.error('📂 获取最近文件失败:', error);
      setRecentFiles([]);
      setError(error instanceof Error ? error : new Error('获取最近文件失败'));
    } finally {
      // 确保在所有情况下都更新加载状态
      console.log('📂 完成获取最近文件，设置loadingRecentFiles = false');
      
      // 使用setTimeout确保状态更新在下一个tick执行
      setTimeout(() => {
        setLoadingRecentFiles(false);
        isLoadingRecentFilesRef.current = false;
      }, 0);
    }
  }, []);

  /**
   * 获取最近下载的文件
   */
  const fetchRecentDownloads = useCallback(async () => {
    console.log('🔄 fetchRecentDownloads 被调用，当前加载状态:', isLoadingRecentDownloadsRef.current);
    
    // 防止重复调用 - 使用ref而不是状态
    if (isLoadingRecentDownloadsRef.current) {
      console.log('⚠️ fetchRecentDownloads 已经在加载中，跳过');
      return;
    }
    
    setError(null);
    setLoadingRecentDownloads(true);
    isLoadingRecentDownloadsRef.current = true;
    
    try {
      console.log('📥 开始获取最近下载文件');
      const response = await fileApi.getRecentDownloads();
      console.log('📥 最近下载文件API响应:', response);
      
      // 改进的响应处理逻辑 - 与fetchRecentFiles保持一致
      if (response) {
        if (Array.isArray(response)) {
          // 直接是文件数组
          console.log('📥 收到文件数组响应，数量:', response.length);
          setRecentDownloads(response);
        } else if (typeof response === 'object' && response !== null) {
          const responseObj = response as FileApiResponse;
          if (responseObj.files && Array.isArray(responseObj.files)) {
            // 包含files字段的对象
            console.log('📥 收到包含files字段的对象响应，文件数量:', responseObj.files.length);
            setRecentDownloads(responseObj.files);
          } else {
            console.warn('📥 API响应格式不符合预期:', responseObj);
            setRecentDownloads([]);
          }
        } else {
          console.warn('📥 API响应格式不符合预期:', response);
          setRecentDownloads([]);
        }
      } else {
        console.warn('📥 API返回空响应');
        setRecentDownloads([]);
      }
      
      // 更新最后成功获取时间
      lastRecentDownloadsUpdateRef.current = Date.now();
    } catch (error) {
      console.error('📥 获取最近下载文件失败:', error);
      setRecentDownloads([]);
      setError(error instanceof Error ? error : new Error('获取最近下载文件失败'));
    } finally {
      // 确保在所有情况下都更新加载状态
      console.log('📥 完成获取最近下载文件，设置loadingRecentDownloads = false');
      
      // 使用setTimeout确保状态更新在下一个tick执行
      setTimeout(() => {
        setLoadingRecentDownloads(false);
        isLoadingRecentDownloadsRef.current = false;
      }, 0);
    }
  }, []);

  /**
   * 手动刷新所有内容
   */
  const refreshContent = useCallback(() => {
    console.log('🔄 手动刷新最近内容');
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
    const fetchData = async () => {
      // 只有在启用轮询且当前没有正在加载时才进行
      if (isPollingEnabled) {
        const now = Date.now();
        
        // 从上次更新超过2秒后才重新获取最近文件
        if (now - lastRecentFilesUpdateRef.current > 2000 && !isLoadingRecentFilesRef.current) {
          fetchRecentFiles();
        }
        
        // 从上次更新超过2秒后才重新获取最近下载
        if (now - lastRecentDownloadsUpdateRef.current > 2000 && !isLoadingRecentDownloadsRef.current) {
          fetchRecentDownloads();
        }
      }
    };

    // 初始化最近文件和下载列表
    if (!hasInitializedRef.current) {
      fetchData();
      hasInitializedRef.current = true;
    }
    
    // 设置轮询定时器
    pollingTimerRef.current = setInterval(fetchData, pollingInterval);
    
    // 清理函数
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
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