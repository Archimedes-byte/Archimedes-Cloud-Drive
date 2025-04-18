'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Table, Button, message, Typography, Space, 
  Tag, Tooltip, Popconfirm, Spin, Empty
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

const { Title, Text } = Typography;

// 文件类型接口
interface FavoriteFile {
  id: string;
  name: string;
  size: number;
  type: string;
  isFolder: boolean;
  createdAt: string;
  updatedAt: string;
  path?: string;
  favoriteId: string;
}

// 组件属性接口
interface FavoritesContentProps {
  onNavigateBack?: () => void;
  onOpenFile?: (file: FavoriteFile) => void;
}

export default function FavoritesContent({ onNavigateBack, onOpenFile }: FavoritesContentProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  useEffect(() => {
    // 检查用户登录状态
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchFavorites();
    }
  }, [status, router]);

  // 获取收藏列表
  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/storage/favorites');
      const data = await response.json();
      
      if (data.success) {
        setFavorites(data.data || []);
      } else {
        message.error(data.error || '获取收藏列表失败');
      }
    } catch (error) {
      console.error('获取收藏列表出错:', error);
      message.error('获取收藏列表出错，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除收藏
  const removeFavorite = async (favoriteIds: string[]) => {
    try {
      const response = await fetch('/api/storage/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ favoriteIds }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        message.success(`成功取消收藏${data.deletedCount || favoriteIds.length}个文件`);
        setSelectedRows([]);
        fetchFavorites();
      } else {
        message.error(data.error || '取消收藏失败');
      }
    } catch (error) {
      console.error('取消收藏出错:', error);
      message.error('取消收藏出错，请重试');
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
            onConfirm={() => removeFavorite([record.favoriteId])}
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
          <Button
            type="text"
            icon={<ArrowLeft size={16} />}
            onClick={handleNavigateBack}
            className={styles.backButton}
          >
            返回
          </Button>
          <Title level={4} className={styles.title}>
            <Star className={styles.titleIcon} />
            我的收藏
          </Title>
        </div>
        <div className={styles.actions}>
          {batchActions}
        </div>
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
              您还没有收藏任何文件
            </span>
          }
        >
          <Button 
            type="primary" 
            onClick={handleNavigateBack}
          >
            浏览文件
          </Button>
        </Empty>
      ) : (
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={favorites}
          rowKey="favoriteId"
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