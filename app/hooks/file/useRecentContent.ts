import { useState, useCallback, useEffect } from 'react';
import { FileInfo } from '@/app/types';
import { fileApi } from '@/app/lib/api/file-api';

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
  
  /**
   * 获取最近访问的文件
   */
  const fetchRecentFiles = useCallback(async () => {
    setLoadingRecentFiles(true);
    try {
      console.log('📂 开始获取最近访问文件');
      const response = await fileApi.getRecentFiles();
      console.log('📂 最近访问文件API响应:', response);
      
      // 处理不同的响应格式
      if (response) {
        if (Array.isArray(response)) {
          // 直接返回数组的情况
          console.log('📂 响应是数组格式，文件数量:', response.length);
          setRecentFiles(response);
        } else if (typeof response === 'object') {
          // 使用类型断言来避免类型错误
          const responseObj = response as any;
          if ('files' in responseObj && Array.isArray(responseObj.files)) {
            // 包含files字段的对象格式
            console.log('📂 响应包含files字段，文件数量:', responseObj.files.length);
            setRecentFiles(responseObj.files);
          } else if (Object.keys(responseObj).length > 0 && Array.isArray(Object.values(responseObj)[0])) {
            // 可能是其他包装格式，尝试获取第一个数组值
            const filesArray = Object.values(responseObj)[0] as FileInfo[];
            console.log('📂 响应包含数组值，文件数量:', filesArray.length);
            setRecentFiles(filesArray);
          } else {
            console.warn('📂 响应格式不符合预期:', responseObj);
          }
        } else {
          console.warn('📂 响应既不是数组也不是对象:', response);
        }
      } else {
        console.warn('📂 响应为空');
      }
    } catch (error) {
      console.error('📂 获取最近文件失败:', error);
    } finally {
      setLoadingRecentFiles(false);
    }
  }, []);
  
  /**
   * 获取最近下载的文件
   */
  const fetchRecentDownloads = useCallback(async () => {
    setLoadingRecentDownloads(true);
    try {
      console.log('📥 开始获取最近下载文件');
      const response = await fileApi.getRecentDownloads();
      console.log('📥 最近下载文件API响应:', response);
      
      // 处理不同的响应格式
      if (response) {
        if (Array.isArray(response)) {
          // 直接返回数组的情况
          console.log('📥 响应是数组格式，文件数量:', response.length);
          setRecentDownloads(response);
        } else if (typeof response === 'object') {
          // 使用类型断言来避免类型错误
          const responseObj = response as any;
          if ('files' in responseObj && Array.isArray(responseObj.files)) {
            // 包含files字段的对象格式
            console.log('📥 响应包含files字段，文件数量:', responseObj.files.length);
            setRecentDownloads(responseObj.files);
          } else if (Object.keys(responseObj).length > 0 && Array.isArray(Object.values(responseObj)[0])) {
            // 可能是其他包装格式，尝试获取第一个数组值
            const filesArray = Object.values(responseObj)[0] as FileInfo[];
            console.log('📥 响应包含数组值，文件数量:', filesArray.length);
            setRecentDownloads(filesArray);
          } else {
            console.warn('📥 响应格式不符合预期:', responseObj);
          }
        } else {
          console.warn('📥 响应既不是数组也不是对象:', response);
        }
      } else {
        console.warn('📥 响应为空');
      }
    } catch (error) {
      console.error('📥 获取最近下载文件失败:', error);
    } finally {
      setLoadingRecentDownloads(false);
    }
  }, []);
  
  // 初始加载
  useEffect(() => {
    fetchRecentFiles();
    fetchRecentDownloads();
  }, [fetchRecentFiles, fetchRecentDownloads]);
  
  return {
    // 状态
    recentFiles,
    loadingRecentFiles,
    recentDownloads,
    loadingRecentDownloads,
    
    // 方法
    fetchRecentFiles,
    fetchRecentDownloads
  };
} 