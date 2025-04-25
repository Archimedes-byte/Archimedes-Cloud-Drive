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
      
      if (response) {
        if (Array.isArray(response)) {
          setRecentFiles(response);
        } else if (typeof response === 'object') {
          const responseObj = response as any;
          
          if ('files' in responseObj && Array.isArray(responseObj.files)) {
            setRecentFiles(responseObj.files);
          } else if (Object.keys(responseObj).length > 0 && 
                    Array.isArray(Object.values(responseObj)[0])) {
            const filesArray = Object.values(responseObj)[0] as FileInfo[];
            setRecentFiles(filesArray);
          } else {
            console.warn('📂 无法解析响应格式:', responseObj);
            setRecentFiles([]);
          }
        } else {
          setRecentFiles([]);
        }
      } else {
        setRecentFiles([]);
      }
    } catch (error) {
      console.error('📂 获取最近文件失败:', error);
      setRecentFiles([]);
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
      
      if (response) {
        if (Array.isArray(response)) {
          setRecentDownloads(response);
        } else if (typeof response === 'object') {
          const responseObj = response as any;
          
          if ('files' in responseObj && Array.isArray(responseObj.files)) {
            setRecentDownloads(responseObj.files);
          } else if (Object.keys(responseObj).length > 0 && 
                    Array.isArray(Object.values(responseObj)[0])) {
            const filesArray = Object.values(responseObj)[0] as FileInfo[];
            setRecentDownloads(filesArray);
          } else {
            console.warn('📥 无法解析响应格式:', responseObj);
            setRecentDownloads([]);
          }
        } else {
          setRecentDownloads([]);
        }
      } else {
        setRecentDownloads([]);
      }
    } catch (error) {
      console.error('📥 获取最近下载文件失败:', error);
      setRecentDownloads([]);
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