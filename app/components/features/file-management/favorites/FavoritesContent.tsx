'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Button, message, Typography, Space, 
  Spin, Empty, Select
} from 'antd';
import { 
  Star, Trash2, 
  ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import styles from './favorites.module.css';
import { fileApi, FavoriteFolderInfo } from '@/app/lib/api/file-api';
import { FileInfo } from '@/app/types';
import { AntFileList } from '../file-list';
import { FolderManagement } from '../folder-management';
import { FileIcon } from '@/app/utils/file/icon-map';
import { AUTH_CONSTANTS } from '@/app/constants/auth';

const { Title, Text } = Typography;

// 扩展的FileInfo接口，包含收藏夹相关字段
interface FavoriteFileInfo extends FileInfo {
  favoriteId?: string;
  favoriteFolderId?: string;
  favoriteFolderName?: string;
}

// 文件类型接口
interface FavoriteFile extends Partial<FileInfo> {
  id: string;  // 这是文件真实ID
  name: string;
  size: number;
  type: string;
  isFolder: boolean;
  createdAt: string;
  updatedAt: string;
  path?: string;
  favoriteId?: string; // 标记为可选
  favoriteFolderId?: string;
  favoriteFolderName?: string;
}

// 组件属性接口
interface FavoritesContentProps {
  onNavigateBack?: () => void;
  onOpenFile?: (file: FavoriteFile) => void;
  selectedFolderId?: string;
  titleIcon?: React.ReactNode; // 添加标题图标属性
}

export default function FavoritesContent({ onNavigateBack, onOpenFile, selectedFolderId, titleIcon }: FavoritesContentProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [folders, setFolders] = useState<FavoriteFolderInfo[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [fileUpdateTrigger, setFileUpdateTrigger] = useState(0);
  const [showFolderManagement, setShowFolderManagement] = useState(false);

  // 添加favoritedFileIds以跟踪所有收藏的文件
  const [favoritedFileIds, setFavoritedFileIds] = useState<string[]>([]);

  // 初始化时，如果传入了selectedFolderId，则设置为当前选中的文件夹
  useEffect(() => {
    if (selectedFolderId) {
      setSelectedFolder(selectedFolderId);
    } else {
      // 如果没有指定文件夹ID，则默认为"全部收藏"
      setSelectedFolder('all');
    }
  }, [selectedFolderId]);

  useEffect(() => {
    // 检查用户登录状态
    if (status === 'unauthenticated') {
      // 不再直接跳转，而是触发全局登录事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_CONSTANTS.EVENTS.LOGIN_MODAL));
      }
      return;
    }

    if (status === 'authenticated') {
      // 加载收藏夹列表
      fetchFolders();
    }
  }, [status, router]);

  // 获取收藏夹列表
  const fetchFolders = async () => {
    setLoadingFolders(true);
    try {
      const response = await fileApi.getFavoriteFolders();
      setFolders(response.folders);
    } catch (error) {
      console.error('获取收藏夹列表失败:', error);
      message.error('获取收藏夹列表失败');
    } finally {
      setLoadingFolders(false);
    }
  };

  // 初始获取收藏夹列表
  useEffect(() => {
    fetchFolders();
  }, []);

  // 添加收藏文件ID列表
  useEffect(() => {
    if (status === 'authenticated') {
      // 把所有收藏项的ID添加到favoritedFileIds中
      const getAllFavoriteIds = async () => {
        try {
          const response = await fileApi.getAllFavoriteFiles();
          // 添加空值检查
          if (response && response.items && response.items.length > 0) {
            const ids = response.items.map(item => item.id);
            setFavoritedFileIds(ids);
          }
        } catch (error) {
          console.error('获取收藏文件ID列表失败:', error);
        }
      };
      
      getAllFavoriteIds();
    }
  }, [status]);

  // 当收藏状态变化时更新favoritedFileIds
  useEffect(() => {
    if (favorites.length > 0) {
      const ids = favorites.map(file => file.id);
      setFavoritedFileIds(ids);
    }
  }, [favorites]);

  // 监听全局收藏夹刷新事件
  useEffect(() => {
    // 处理收藏夹刷新事件
    const handleRefreshFavoriteFolders = () => {
      // 重新获取最新的收藏夹列表
      fetchFolders();
    };
    
    // 添加事件监听器
    window.addEventListener('refresh_favorite_folders', handleRefreshFavoriteFolders);
    
    // 清理函数移除监听器
    return () => {
      window.removeEventListener('refresh_favorite_folders', handleRefreshFavoriteFolders);
    };
  }, []);

  // 获取特定收藏夹中的文件
  const fetchFolderFiles = async (folderId: string) => {
    setLoading(true);
    try {
      console.log(`获取收藏夹 ${folderId} 中的文件`);
      
      const response = await fileApi.getFolderFiles(folderId);
      
      if (response && response.items) {
        // 将响应项目转换为 FavoriteFile[]
        const favoriteFiles: FavoriteFile[] = (response.items as FavoriteFileInfo[]).map((item) => ({
          id: item.id,
          name: item.name,
          size: item.size || 0,
          type: item.type || '',
          isFolder: !!item.isFolder,
          createdAt: typeof item.createdAt === 'string' 
            ? item.createdAt 
            : item.createdAt instanceof Date 
              ? item.createdAt.toISOString() 
              : new Date().toISOString(),
          updatedAt: typeof item.updatedAt === 'string' 
            ? item.updatedAt 
            : item.updatedAt instanceof Date 
              ? item.updatedAt.toISOString() 
              : new Date().toISOString(),
          path: item.path,
          // 添加收藏相关字段
          favoriteId: item.favoriteId,
          favoriteFolderId: item.favoriteFolderId || folderId, // 使用当前收藏夹ID作为默认值
          favoriteFolderName: item.favoriteFolderName
        }));
        
        console.log(`成功获取到${favoriteFiles.length}个收藏文件`);
        setFavorites(favoriteFiles);

        // 检查是否有无效项目需要清理
        const invalidItems = favoriteFiles.filter(file => !file.id || file.id === 'undefined');
        if (invalidItems.length > 0) {
          console.warn('发现无效收藏项，将自动清理:', invalidItems.length);
          const invalidIds = invalidItems
            .filter(item => item.favoriteId)
            .map(item => item.favoriteId as string);
          
          if (invalidIds.length > 0) {
            try {
              await removeFavorite(invalidIds);
            } catch (error) {
              console.error('清理无效收藏失败:', error);
            }
          }
        }
      } else {
        console.log('收藏夹文件列表为空或格式不正确');
        setFavorites([]);
      }
    } catch (error) {
      console.error(`获取收藏夹 ${folderId} 文件列表出错:`, error);
      message.error('获取收藏夹文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取收藏列表
  const fetchFavorites = async () => {
    if (selectedFolder === 'all') {
      // 获取所有收藏
      setLoading(true);
      try {
        console.log('开始获取所有收藏列表...');
        
        // 使用新版API获取所有收藏
        const response = await fileApi.getAllFavoriteFiles();
        
        if (response && response.items) {
          // 将响应项目转换为 FavoriteFile[]
          const favoriteFiles: FavoriteFile[] = (response.items as FavoriteFileInfo[]).map((item) => ({
            id: item.id,
            name: item.name,
            size: item.size || 0,
            type: item.type || '',
            isFolder: !!item.isFolder,
            createdAt: typeof item.createdAt === 'string' 
              ? item.createdAt 
              : item.createdAt instanceof Date 
                ? item.createdAt.toISOString() 
                : new Date().toISOString(),
            updatedAt: typeof item.updatedAt === 'string' 
              ? item.updatedAt 
              : item.updatedAt instanceof Date 
                ? item.updatedAt.toISOString() 
                : new Date().toISOString(),
            path: item.path,
            favoriteId: item.favoriteId,
            favoriteFolderId: item.favoriteFolderId,
            favoriteFolderName: item.favoriteFolderName
          }));
          
          console.log(`成功获取到${favoriteFiles.length}个收藏文件`);
          setFavorites(favoriteFiles);
          
          // 检查是否有无效项目需要清理
          const invalidItems = favoriteFiles.filter(file => !file.id || file.id === 'undefined');
          if (invalidItems.length > 0) {
            console.warn('发现无效收藏项，将自动清理:', invalidItems.length);
            const invalidIds = invalidItems
              .filter(item => item.favoriteId)
              .map(item => item.favoriteId as string);
            
            if (invalidIds.length > 0) {
              try {
                await removeFavorite(invalidIds);
              } catch (error) {
                console.error('清理无效收藏失败:', error);
              }
            }
          }
        } else {
          console.log('收藏列表为空或格式不正确');
          setFavorites([]);
        }
      } catch (error) {
        console.error('获取收藏列表出错:', error);
        message.error(`获取收藏列表出错: ${error instanceof Error ? error.message : '请重试'}`);
      } finally {
        setLoading(false);
      }
    } else {
      // 获取指定收藏夹的文件
      await fetchFolderFiles(selectedFolder);
    }
  };

  useEffect(() => {
    // 检查用户登录状态
    if (status === 'unauthenticated') {
      // 不再直接跳转，而是触发全局登录事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_CONSTANTS.EVENTS.LOGIN_MODAL));
      }
      return;
    }

    if (status === 'authenticated') {
      // 加载收藏夹列表
      fetchFolders();
    }
  }, [status, router]);

  // 当收藏夹选择或登录状态变化时，加载文件
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('收藏夹选择变化，当前选择:', selectedFolder);
      fetchFavorites();
    }
  }, [status, selectedFolder]);

  // 删除收藏
  const removeFavorite = async (favoriteIds: string[]) => {
    try {
      console.log('开始移除收藏:', favoriteIds);
      
      // 使用新版API移除收藏（不指定收藏夹ID表示从所有收藏夹中移除）
      const result = await fileApi.removeBatchFromFavoriteFolder(favoriteIds);
      
      if (result && result.count >= 0) {
        message.success(`成功取消收藏${result.count}个文件`);
        setSelectedRows([]);
        fetchFavorites();
        // 刷新收藏夹列表，更新文件计数
        fetchFolders();
        
        // 发布取消收藏事件，通知其他组件更新状态
        const unfavoriteEvent = new CustomEvent('unfavorite_files', { 
          detail: { fileIds: favoriteIds } 
        });
        window.dispatchEvent(unfavoriteEvent);
        console.log('已发布取消收藏事件:', favoriteIds);
      } else {
        message.error('取消收藏失败');
        console.error('取消收藏失败，返回结果异常:', result);
      }
    } catch (error) {
      console.error('取消收藏出错:', error);
      message.error(`取消收藏出错: ${error instanceof Error ? error.message : '请重试'}`);
    }
    
    // 添加触发文件列表更新
    setFileUpdateTrigger(prev => prev + 1);
  };

  // 处理返回主文件页面
  const handleNavigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  // 处理选择文件变更
  const handleSelectFile = (file: FileInfo, checked: boolean) => {
    const favoriteFile = file as FavoriteFile;
    setSelectedRows(prev => {
      if (checked) {
        return [...prev, favoriteFile.id];
      } else {
        return prev.filter(id => id !== favoriteFile.id);
      }
    });
  };
  
  // 全选
  const handleSelectAll = () => {
    setSelectedRows(favorites.map(file => file.id));
  };
  
  // 取消全选
  const handleDeselectAll = () => {
    setSelectedRows([]);
  };

  // 文件打开处理函数
  const handleOpenFile = (file: FileInfo) => {
    if (onOpenFile) {
      onOpenFile(file as FavoriteFile);
    }
  };

  // 获取文件图标
  const getFileIcon = (file: FavoriteFile) => {
    const extension = file.name?.split('.').pop()?.toLowerCase();
    return <FileIcon 
      isFolder={file.isFolder} 
      extension={extension} 
      mimeType={file.type} 
      size={18} 
    />;
  };

  // 处理切换收藏状态
  const handleToggleFavorite = async (file: FileInfo, isFavorite: boolean) => {
    // 收藏内容中的文件始终已被收藏，所以这个函数主要用于取消收藏
    if (!isFavorite) {
      const favoriteItem = favorites.find(f => f.id === file.id);
      if (favoriteItem && favoriteItem.favoriteId) {
        await removeFavorite([favoriteItem.favoriteId]);
        
        // 从当前列表中移除
        setFavorites(prev => prev.filter(item => item.id !== file.id));
        setFavoritedFileIds(prev => prev.filter(id => id !== file.id));
        
        message.success('已从收藏中移除');
      }
    }
  };

  // 加载初始收藏文件数据
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('加载收藏列表...');
      
      if (selectedFolder === 'all') {
        // 加载所有收藏文件
        const response = await fileApi.getAllFavoriteFiles();
        
        if (response && response.items) {
          // 将响应项目转换为 FavoriteFile[]
          const favoriteFiles: FavoriteFile[] = (response.items as FavoriteFileInfo[]).map((item) => ({
            id: item.id,
            name: item.name,
            size: item.size || 0,
            type: item.type || '',
            isFolder: !!item.isFolder,
            createdAt: typeof item.createdAt === 'string' 
              ? item.createdAt 
              : item.createdAt instanceof Date 
                ? item.createdAt.toISOString() 
                : new Date().toISOString(),
            updatedAt: typeof item.updatedAt === 'string' 
              ? item.updatedAt 
              : item.updatedAt instanceof Date 
                ? item.updatedAt.toISOString() 
                : new Date().toISOString(),
            path: item.path,
            favoriteId: item.favoriteId,
            favoriteFolderId: item.favoriteFolderId,
            favoriteFolderName: item.favoriteFolderName
          }));
          
          setFavorites(favoriteFiles);
        }
      } else if (selectedFolder) {
        // 加载指定收藏夹中的文件
        const response = await fileApi.getFolderFiles(selectedFolder);
        
        if (response && response.items) {
          // 将响应项目转换为 FavoriteFile[]
          const favoriteFiles: FavoriteFile[] = (response.items as FavoriteFileInfo[]).map((item) => ({
            id: item.id,
            name: item.name,
            size: item.size || 0,
            type: item.type || '',
            isFolder: !!item.isFolder,
            createdAt: typeof item.createdAt === 'string' 
              ? item.createdAt 
              : item.createdAt instanceof Date 
                ? item.createdAt.toISOString() 
                : new Date().toISOString(),
            updatedAt: typeof item.updatedAt === 'string' 
              ? item.updatedAt 
              : item.updatedAt instanceof Date 
                ? item.updatedAt.toISOString() 
                : new Date().toISOString(),
            path: item.path,
            favoriteId: item.favoriteId,
            favoriteFolderId: item.favoriteFolderId || selectedFolder,
            favoriteFolderName: item.favoriteFolderName
          }));
          
          setFavorites(favoriteFiles);
        }
      }
    } catch (error) {
      console.error('加载收藏列表错误:', error);
      message.error('加载收藏文件失败');
    } finally {
      setLoading(false);
    }
  }, [selectedFolder]);

  // 渲染内容
  return (
    <>
      {/* 收藏夹管理视图 */}
      {showFolderManagement ? (
        <FolderManagement 
          onNavigateBack={() => setShowFolderManagement(false)} 
          onFolderSelect={(folderId: string) => {
            setSelectedFolder(folderId);
            setShowFolderManagement(false);
            fetchFolderFiles(folderId);
          }}
        />
      ) : (
        <div className={styles.favoritesContainer}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              {onNavigateBack && (
                <Button 
                  icon={<ArrowLeft size={16} />} 
                  onClick={handleNavigateBack}
                  className={styles.backButton}
                  type="text"
                >
                  返回
                </Button>
              )}
              <Title level={3} className={styles.title}>
                {titleIcon || <Star className={styles.titleIcon} />}
                我的收藏
              </Title>
            </div>
            
            <div className={styles.headerRight}>
              <Select
                loading={loadingFolders}
                value={selectedFolder}
                onChange={setSelectedFolder}
                style={{ width: 180 }}
                placeholder="选择收藏夹"
                options={[
                  { value: 'all', label: '全部收藏' },
                  ...folders.map(folder => ({ 
                    value: folder.id, 
                    label: folder.name 
                  }))
                ]}
              />
              <Button 
                type="default"
                onClick={() => setShowFolderManagement(true)}
                className={styles.manageFoldersButton}
              >
                管理收藏夹
              </Button>
            </div>
          </div>
          
          {/* 批量操作工具栏 */}
          {selectedRows.length > 0 && (
            <div className={styles.batchActions}>
              <Space>
                <Text>已选择 {selectedRows.length} 项</Text>
                <Button onClick={handleDeselectAll}>取消选择</Button>
                <Button 
                  danger 
                  icon={<Trash2 size={16} />}
                  onClick={() => removeFavorite(selectedRows)}
                >
                  移除收藏
                </Button>
              </Space>
            </div>
          )}
          
          {/* 文件列表 */}
          {loading ? (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
              <p>加载收藏中...</p>
            </div>
          ) : favorites.length > 0 ? (
            <AntFileList
              files={favorites as unknown as FileInfo[]}
              selectedFiles={selectedRows}
              onFileClick={handleOpenFile}
              onFileSelect={handleSelectFile}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              areAllSelected={selectedRows.length === favorites.length && favorites.length > 0}
              showCheckboxes={true}
              fileUpdateTrigger={fileUpdateTrigger}
              isLoading={loading}
              favoritedFileIds={favoritedFileIds}
              onToggleFavorite={handleToggleFavorite}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  当前收藏夹暂无收藏项目
                  <br />
                  <small style={{ color: '#999' }}>
                    浏览文件时点击星标图标可添加收藏
                  </small>
                </span>
              }
            />
          )}
        </div>
      )}
    </>
  );
} 