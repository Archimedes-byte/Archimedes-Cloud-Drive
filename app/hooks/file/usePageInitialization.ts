import { useEffect, useRef } from 'react';
import { FileTypeEnum } from '@/app/types/domains/fileTypes';

/**
 * 页面初始化钩子参数
 */
export interface PageInitializationOptions {
  /** 是否显示分享页面（初始化时） */
  initialShowShares?: boolean;
  /** 加载文件的函数 */
  loadFiles: (folderId: string | null, fileType: FileTypeEnum | null, forceRefresh?: boolean) => Promise<void>;
  /** 加载收藏文件ID的函数 */
  loadFavoritedFileIds?: () => Promise<void>;
}

/**
 * 页面初始化钩子接口
 */
export interface PageInitializationHook {
  /** 是否已初始化 */
  hasInitialized: boolean;
}

/**
 * 文件管理页面初始化钩子
 * 处理复杂的页面初始化逻辑，如加载初始文件列表和收藏状态
 * 
 * @param options 初始化配置选项
 * @returns 初始化状态
 */
export const usePageInitialization = ({
  initialShowShares = false,
  loadFiles,
  loadFavoritedFileIds
}: PageInitializationOptions): PageInitializationHook => {
  // 使用ref跟踪初始化状态，避免重复加载
  const hasInitializedRef = useRef(false);

  // 确保在组件加载时只加载一次根目录文件
  useEffect(() => {
    // 仅在第一次渲染时加载根目录文件，避免无限循环
    if (!hasInitializedRef.current && !initialShowShares) {
      console.log('页面初始化：加载根目录文件');
      loadFiles(null, null, true);
      hasInitializedRef.current = true;
    }
  }, [initialShowShares, loadFiles]);

  // 初始化加载收藏文件IDs
  useEffect(() => {
    if (loadFavoritedFileIds) {
      console.log('页面初始化：加载收藏文件ID列表');
      loadFavoritedFileIds().catch(error => {
        console.error('加载收藏文件ID失败:', error);
      });
    }
  }, [loadFavoritedFileIds]);

  return {
    hasInitialized: hasInitializedRef.current
  };
}; 