'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Table, Button, message, Typography, Space, 
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
  };

  // 删除收藏夹
  const handleDeleteFolder = async () => {
    // 不能删除"all"选项和默认收藏夹
    if (selectedFolder === 'all') {
      message.error('不能删除全部收藏视图');
      return;
    }
    
    const folder = folders.find(f => f.id === selectedFolder);
    if (!folder) {
      message.error('收藏夹不存在');
      return;
    }
    
    if (folder.isDefault) {
      message.error('不能删除默认收藏夹');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`开始删除收藏夹: ${folder.name} (${folder.id})`);
      
      // 调用删除收藏夹API
      const result = await fileApi.deleteFavoriteFolder(folder.id);
      
      if (result.success) {
        message.success(`收藏夹 "${folder.name}" 已删除`);
        
        // 重要：先将已删除的收藏夹ID保存，用于后续日志记录
        const deletedFolderId = folder.id;
        
        // 切换到全部收藏视图
        setSelectedFolder('all');
        
        // 重新加载收藏夹列表
        await fetchFolderList();
        
        // 重要：创建一个获取全部收藏的函数，直接获取所有收藏，不依赖于selectedFolder状态
        const fetchAllFavorites = async () => {
          setLoading(true);
          try {
            console.log('删除收藏夹后获取全部收藏列表...');
            const response = await fetch('/api/storage/favorites', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({}),
            });
            
            if (!response.ok) {
              throw new Error(`服务器返回错误状态码: ${response.status} ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              throw new Error('服务器返回的不是JSON格式');
            }
            
            const text = await response.text();
            if (!text.trim()) {
              console.log('API响应为空，设置空数组');
              setFavorites([]);
              return;
            }
            
            const data = JSON.parse(text);
            console.log('收到API响应:', data);
            
            if (data.success) {
              if (data.data && data.data.items && Array.isArray(data.data.items)) {
                const favoriteFiles = (data.data.items as FavoriteFileInfo[]).map((item) => ({
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
                const favoriteFiles = (data.data as FavoriteFileInfo[]).map((item) => ({
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
        };
        
        // 调用新创建的函数，不依赖selectedFolder状态
        await fetchAllFavorites();
        
        console.log(`收藏夹 ${deletedFolderId} 已删除并成功切换到全部收藏视图`);
      } else {
        message.error(result.message || '删除收藏夹失败');
      }
    } catch (error) {
      console.error('删除收藏夹失败:', error);
      message.error(`删除收藏夹失败: ${error instanceof Error ? error.message : '请重试'}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理文件打开
  const handleOpenFile = (file: FavoriteFile) => {
    // 如果提供了回调函数，则调用它
    if (onOpenFile) {
      onOpenFile(file);
    } else {
      // 作为后备方案，转到文件所在路径
      message.info('正在跳转到文件位置...');
      // 这里假设API返回的path可以作为导航路径使用
      if (file.path) {
        router.push(`/file-management/main?path=${encodeURIComponent(file.path)}`);
      } else {
        message.warning('无法定位此文件');
      }
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

  // 表格列定义
  const columns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: FavoriteFile) => (
        <Space>
          {getFileIcon(record)}
          <Text 
            ellipsis={{ tooltip: record.name }} 
            style={{ maxWidth: 250, cursor: 'pointer' }}
            onClick={() => handleOpenFile(record)}
          >
            {record.name}
          </Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string, record: FavoriteFile) => (
        <Tag color={record.isFolder ? 'blue' : 'green'}>
          {record.isFolder ? '文件夹' : (type || '未知')}
        </Tag>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => (
        size ? `${(size / 1024 / 1024).toFixed(2)} MB` : '-'
      ),
      sorter: (a: FavoriteFile, b: FavoriteFile) => a.size - b.size,
    },
    {
      title: '收藏时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Tooltip title={format(new Date(date), 'yyyy-MM-dd HH:mm:ss')}>
          {formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN })}
        </Tooltip>
      ),
      sorter: (a: FavoriteFile, b: FavoriteFile) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend' as SortOrder,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FavoriteFile) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<ExternalLink size={16} />}
            onClick={() => handleOpenFile(record)}
          >
            打开
          </Button>
          <Popconfirm
            title="确定要取消收藏这个文件吗?"
            onConfirm={() => removeFavorite([record.id])}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="text" 
              danger 
              icon={<Trash2 size={16} />}
            >
              取消收藏
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 批量操作按钮
  const batchActions = (
    <Space size="small">
      <Popconfirm
        title="确定要取消收藏选中的文件吗?"
        onConfirm={() => removeFavorite(selectedRows)}
        okText="确定"
        cancelText="取消"
        disabled={selectedRows.length === 0}
      >
        <Button
          danger
          disabled={selectedRows.length === 0}
          icon={<Trash2 size={16} />}
        >
          批量取消收藏
        </Button>
      </Popconfirm>
    </Space>
  );

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRows(selectedRowKeys as string[]);
    }
  };

  // 处理返回主文件页面
  const handleNavigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  return (
    <div className={styles.favoritesPage}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <Title level={4} className={styles.title}>
            {titleIcon ? (
              titleIcon
            ) : (
              <Star className={styles.titleIcon} style={{ color: 'var(--theme-primary)' }} />
            )}
            我的收藏
          </Title>
        </div>
        <div className={styles.actions}>
          {batchActions}
        </div>
      </div>

      <div className={styles.filterBar}>
        <Select
          className={styles.folderSelect}
          value={selectedFolder}
          onChange={(value) => setSelectedFolder(value)}
          loading={loadingFolders}
          disabled={loadingFolders}
          style={{ width: 200 }}
        >
          <Select.Option value="all">全部收藏</Select.Option>
          {folders.map(folder => (
            <Select.Option key={folder.id} value={folder.id}>
              {folder.name}
              {folder.fileCount !== undefined && ` (${folder.fileCount})`}
              {folder.isDefault && ' [默认]'}
            </Select.Option>
          ))}
        </Select>
        
        {/* 删除收藏夹按钮 */}
        {selectedFolder !== 'all' && (
          <Popconfirm
            title="删除收藏夹"
            description="确定要删除这个收藏夹吗？其中的文件将被移动到默认收藏夹。"
            onConfirm={handleDeleteFolder}
            okText="删除"
            cancelText="取消"
            placement="bottom"
            disabled={loading || loadingFolders || folders.find(f => f.id === selectedFolder)?.isDefault}
          >
            <Button
              type="text"
              danger
              icon={<Trash2 size={16} />}
              style={{ marginLeft: 8 }}
              disabled={loading || loadingFolders || folders.find(f => f.id === selectedFolder)?.isDefault}
              title={folders.find(f => f.id === selectedFolder)?.isDefault ? "默认收藏夹不能删除" : "删除当前收藏夹"}
            >
              删除收藏夹
            </Button>
          </Popconfirm>
        )}
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <Text className={styles.loadingText}>加载收藏列表中...</Text>
        </div>
      ) : favorites.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>
              <AlertCircle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              {selectedFolder === 'all' ? '您还没有收藏任何文件' : '此收藏夹中没有文件'}
            </span>
          }
        >
          <Button 
            type="primary" 
            onClick={handleNavigateBack}
          >
            返回文件列表
          </Button>
        </Empty>
      ) : (
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={Array.isArray(favorites) ? favorites : []}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条收藏`
          }}
        />
      )}
    </div>
  );
} 