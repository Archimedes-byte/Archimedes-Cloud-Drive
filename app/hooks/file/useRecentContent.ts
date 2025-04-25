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
export function useRecentContent() {
  // 最近文件相关状态
  const [recentFiles, setRecentFiles] = useState<FileInfo[]>([]);
  const [loadingRecentFiles, setLoadingRecentFiles] = useState(false);
  
  // 最近下载文件相关状态
  const [recentDownloads, setRecentDownloads] = useState<FileInfo[]>([]);
  const [loadingRecentDownloads, setLoadingRecentDownloads] = useState(false);
  
  // 增加错误状态
  const [error, setError] = useState<Error | null>(null);
  
  // 使用useRef追踪加载状态，避免依赖循环
  const isLoadingRecentFilesRef = useRef(false);
  const isLoadingRecentDownloadsRef = useRef(false);
  const hasInitializedRef = useRef(false);
  
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
    } catch (error) {
      console.error('📂 获取最近文件失败:', error);
      setRecentFiles([]);
      setError(error instanceof Error ? error : new Error('获取最近文件失败'));
    } finally {
      // 确保在所有情况下都更新加载状态
      console.log('📂 完成获取最近访问文件，设置loadingRecentFiles = false');
      
      // 使用setTimeout确保状态更新在下一个tick执行
      setTimeout(() => {
        setLoadingRecentFiles(false);
        isLoadingRecentFilesRef.current = false;
      }, 0);
    }
  }, []); // 移除loadingRecentFiles依赖，避免依赖循环
  
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
  }, []); // 移除loadingRecentDownloads依赖，避免依赖循环
  
  // 初始加载 - 只执行一次
  useEffect(() => {
    // 使用ref防止重复初始化
    if (hasInitializedRef.current) {
      console.log('🔄 已经初始化过，跳过重复初始化');
      return;
    }
    
    console.log('🔄 useRecentContent 初始化 effect 执行 - 首次');
    hasInitializedRef.current = true;
    
    // 首次加载数据
    fetchRecentFiles();
    fetchRecentDownloads();
    
    // 设置定时刷新
    const refreshInterval = setInterval(() => {
      console.log('🔄 定时刷新最近文件列表');
      fetchRecentFiles();
      fetchRecentDownloads();
    }, 5 * 60 * 1000); // 每5分钟刷新一次
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []); // 空依赖数组，确保只执行一次
  
  // 调试状态变化
  useEffect(() => {
    console.log('📊 最近文件加载状态变化:', loadingRecentFiles);
  }, [loadingRecentFiles]);
  
  useEffect(() => {
    console.log('📊 最近下载加载状态变化:', loadingRecentDownloads);
  }, [loadingRecentDownloads]);
  
  return {
    // 状态
    recentFiles,
    loadingRecentFiles,
    recentDownloads,
    loadingRecentDownloads,
    error,
    
    // 方法
    fetchRecentFiles,
    fetchRecentDownloads
  };
} 