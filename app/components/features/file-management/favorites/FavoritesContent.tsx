'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Button, message, Typography, Space, 
  Tag, Tooltip, Popconfirm, Spin, Empty, Tabs, Select
} from 'antd';
import { 
  Star, ExternalLink, Trash2, 
  File, Folder, FileText, Image as ImageIcon, 
  Video, Music, AlertCircle, ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import styles from './favorites.module.css';
import type { SortOrder } from 'antd/es/table/interface';
import { fileApi, FavoriteFolderInfo } from '@/app/lib/api/file-api';
import { FileInfo } from '@/app/types';
import { AntFileList } from '../file-list';
import { Breadcrumb } from '../navigation/breadcrumb';
import { FolderManagement } from '../folder-management';

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
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      // 加载收藏夹列表
      fetchFolderList();
    }
  }, [status, router]);

  // 获取收藏夹列表
  const fetchFolderList = async () => {
    setLoadingFolders(true);
    try {
      const response = await fileApi.getFavoriteFolders();
      setFolders(response.folders || []);
    } catch (error) {
      console.error('获取收藏夹列表失败:', error);
      message.error('获取收藏夹列表失败');
    } finally {
      setLoadingFolders(false);
    }
  };

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
        const response = await fetch('/api/storage/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        
        // 检查响应状态
        if (!response.ok) {
          throw new Error(`服务器返回错误状态码: ${response.status} ${response.statusText}`);
        }
        
        // 检查响应内容类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('服务器返回的不是JSON格式');
        }
        
        // 如果响应为空，返回空数组
        const text = await response.text();
        if (!text.trim()) {
          console.log('API响应为空，设置空数组');
          setFavorites([]);
          return;
        }
        
        // 解析JSON
        const data = JSON.parse(text);
        console.log('收到API响应:', data);
        
        if (data.success) {
          // 确保正确提取items数组
          if (data.data && data.data.items && Array.isArray(data.data.items)) {
            console.log(`成功获取到${data.data.items.length}个收藏项`);
            // 使用类型断言并转换为需要的格式
            const favoriteFiles: FavoriteFile[] = (data.data.items as FavoriteFileInfo[]).map((item) => ({
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
          } else if (data.data && Array.isArray(data.data)) {
            console.log(`成功获取到${data.data.length}个收藏项`);
            // 处理服务端可能返回的不同数据结构
            const favoriteFiles: FavoriteFile[] = (data.data as FavoriteFileInfo[]).map((item) => ({
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
          } else {
            console.warn('API返回的数据格式不符合预期', data.data);
            setFavorites([]);
          }
        } else {
          message.error(data.error || '获取收藏列表失败');
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
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      // 加载收藏夹列表
      fetchFolderList();
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
      
      const response = await fetch('/api/storage/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds: favoriteIds }),
      });
      
      // 检查HTTP状态
      if (!response.ok) {
        console.error(`服务器返回错误状态码: ${response.status} ${response.statusText}`);
        throw new Error(`服务器返回错误状态码: ${response.status}`);
      }
      
      // 获取响应内容
      const text = await response.text();
      if (!text.trim()) {
        console.warn('服务器返回空响应');
        throw new Error('服务器返回空响应');
      }
      
      // 解析JSON
      const data = JSON.parse(text);
      console.log('收到取消收藏API响应:', data);
      
      if (data.success) {
        message.success(`成功取消收藏${data.data?.deletedCount || favoriteIds.length}个文件`);
        setSelectedRows([]);
        fetchFavorites();
        // 刷新收藏夹列表，更新文件计数
        fetchFolderList();
        
        // 发布取消收藏事件，通知其他组件更新状态
        // 使用自定义事件通知应用的其他部分
        const unfavoriteEvent = new CustomEvent('unfavorite_files', { 
          detail: { fileIds: favoriteIds } 
        });
        window.dispatchEvent(unfavoriteEvent);
        console.log('已发布取消收藏事件:', favoriteIds);
      } else {
        message.error(data.error || '取消收藏失败');
        console.error('取消收藏失败原因:', data.error);
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
    const favoriteFile = file as FavoriteFile;
    if (onOpenFile) {
      onOpenFile(favoriteFile);
    }
  };

  // 获取文件图标
  const getFileIcon = (file: FavoriteFile) => {
    if (file.isFolder) return <Folder size={18} />;
    
    const fileType = file.type?.toLowerCase() || '';
    
    if (fileType.includes('image')) return <ImageIcon size={18} />;
    if (fileType.includes('video')) return <Video size={18} />;
    if (fileType.includes('audio')) return <Music size={18} />;
    if (fileType.includes('pdf') || fileType.includes('doc') || fileType.includes('txt')) 
      return <FileText size={18} />;
    
    return <File size={18} />;
  };

  // 渲染面包屑
  const renderBreadcrumb = () => {
    // 创建面包屑路径
    const folderPath = selectedFolder !== 'all' 
      ? folders.filter(folder => folder.id === selectedFolder)
          .map(folder => ({ id: folder.id, name: folder.name }))
      : [];
      
    return (
      <div className={styles.breadcrumbContainer}>
        <Breadcrumb 
          folderPath={folderPath}
          showHome={true}
          onPathClick={(folderId) => {
            if (folderId === null) {
              // 点击主目录
              setSelectedFolder('all');
              fetchFavorites();
            } else {
              // 点击特定文件夹
              setSelectedFolder(folderId);
              fetchFolderFiles(folderId);
            }
          }}
          onBackClick={handleNavigateBack}
        />
      </div>
    );
  };

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
          
          {renderBreadcrumb()}

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