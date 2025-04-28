import { useState, useCallback, useEffect } from 'react';
import { fileApi } from '@/app/lib/api/file-api';
import { message } from 'antd';
import { FileInfo } from '@/app/types';

/**
 * 收藏文件管理Hook
 * 管理文件收藏相关状态和操作
 */
export function useFavorites() {
  // 收藏文件IDs状态
  const [favoritedFileIds, setFavoritedFileIds] = useState<string[]>([]);
  
  // 收藏模态窗口状态
  const [favoriteModalVisible, setFavoriteModalVisible] = useState(false);
  const [selectedFileForFavorite, setSelectedFileForFavorite] = useState<{id: string, name: string} | null>(null);
  
  // 状态
  const [isLoading, setIsLoading] = useState(false);

  // 初始加载收藏文件IDs
  const loadFavoritedFileIds = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('加载收藏文件ID列表...');
      // 使用新版收藏夹API获取所有收藏（不指定收藏夹ID表示获取所有收藏）
      const favorites = await fileApi.getAllFavoriteFiles();
      if (favorites && favorites.items) {
        const favoriteIds = favorites.items.map(item => item.id);
        console.log(`加载了${favoriteIds.length}个收藏文件ID`);
        setFavoritedFileIds(favoriteIds);
        return favoriteIds;
      }
      return [];
    } catch (error) {
      console.error('加载收藏文件ID列表失败:', error);
      message.error('加载收藏列表失败');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 切换收藏状态
  const toggleFavorite = useCallback(async (file: FileInfo, isFavorite: boolean) => {
    // 实现切换收藏功能
    console.log('切换收藏状态', file, isFavorite);
    
    // 立即更新UI状态，确保星标即时显示变化
    setFavoritedFileIds(prevIds => {
      if (isFavorite) {
        // 添加到收藏
        if (!prevIds.includes(file.id)) {
          return [...prevIds, file.id];
        }
      } else {
        // 从收藏中移除
        return prevIds.filter(id => id !== file.id);
      }
      return prevIds;
    });
    
    // 调用API保存收藏状态
    try {
      await fileApi.toggleFavorite(file.id, isFavorite);
      console.log('收藏状态已保存');
    } catch (error) {
      console.error('收藏操作失败', error);
      message.error('收藏状态更新失败，请重试');
      
      // 恢复原始状态
      setFavoritedFileIds(prevIds => {
        if (isFavorite) {
          // 如果添加收藏失败，从列表中移除
          return prevIds.filter(id => id !== file.id);
        } else {
          // 如果移除收藏失败，添加回列表
          if (!prevIds.includes(file.id)) {
            return [...prevIds, file.id];
          }
        }
        return prevIds;
      });
    }
  }, []);

  // 打开收藏夹选择模态窗口
  const openFavoriteModal = useCallback((fileId: string, fileName: string) => {
    setSelectedFileForFavorite({ id: fileId, name: fileName });
    setFavoriteModalVisible(true);
  }, []);

  // 关闭收藏夹选择模态窗口
  const closeFavoriteModal = useCallback(() => {
    setFavoriteModalVisible(false);
    setSelectedFileForFavorite(null);
  }, []);

  // 处理收藏成功
  const handleFavoriteSuccess = useCallback(() => {
    if (selectedFileForFavorite) {
      setFavoritedFileIds(prev => [...prev, selectedFileForFavorite.id]);
    }
    closeFavoriteModal();
  }, [selectedFileForFavorite, closeFavoriteModal]);

  // 监听取消收藏事件
  useEffect(() => {
    // 收藏页面取消收藏后更新星标状态的处理函数
    const handleUnfavoriteEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{fileIds: string[]}>;
      const unfavoritedIds = customEvent.detail.fileIds;
      
      console.log('收到取消收藏事件，更新星标状态:', unfavoritedIds);
      
      // 更新收藏文件ID列表，移除已取消收藏的文件ID
      setFavoritedFileIds(prevIds => 
        prevIds.filter(id => !unfavoritedIds.includes(id))
      );
    };
    
    // 添加事件监听器
    window.addEventListener('unfavorite_files', handleUnfavoriteEvent);
    
    // 组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('unfavorite_files', handleUnfavoriteEvent);
    };
  }, []);

  // 监听打开收藏模态窗口事件
  useEffect(() => {
    const handleOpenFavoriteModal = (event: Event) => {
      const customEvent = event as CustomEvent<{fileId: string, fileName: string}>;
      openFavoriteModal(customEvent.detail.fileId, customEvent.detail.fileName);
    };

    window.addEventListener('open_favorite_modal', handleOpenFavoriteModal);
    return () => {
      window.removeEventListener('open_favorite_modal', handleOpenFavoriteModal);
    };
  }, [openFavoriteModal]);

  return {
    // 状态
    favoritedFileIds,
    favoriteModalVisible,
    selectedFileForFavorite,
    isLoading,
    
    // 设置器
    setFavoriteModalVisible,
    setSelectedFileForFavorite,
    
    // 方法
    loadFavoritedFileIds,
    toggleFavorite,
    openFavoriteModal,
    closeFavoriteModal,
    handleFavoriteSuccess
  };
} 