'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Table, Button, message, Typography, Space, 
  Tag, Tooltip, Popconfirm, Spin, Empty
} from 'antd';
import { 
  Share2, ExternalLink, Trash2, Copy, 
  File, Folder, FileText, Image as ImageIcon, 
  Video, Music, AlertCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import styles from './my-shares.module.css';

const { Title, Text } = Typography;

interface ShareFile {
  id: string;
  name: string;
  size: number;
  type: string;
  isFolder: boolean;
}

interface ShareItem {
  id: string;
  shareCode: string;
  extractCode: string;
  expiresAt: string | null;
  accessLimit: number | null;
  accessCount: number;
  createdAt: string;
  files: ShareFile[];
}

interface MySharesContentProps {
  onNavigateBack?: () => void;
  titleIcon?: React.ReactNode;
}

export default function MySharesContent({ onNavigateBack, titleIcon }: MySharesContentProps = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  useEffect(() => {
    // 检查用户登录状态
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchShares();
    }
  }, [status, router]);

  // 获取分享列表
  const fetchShares = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/storage/share');
      const data = await response.json();
      
      if (data.success) {
        setShares(data.data);
      } else {
        message.error(data.error || '获取分享列表失败');
      }
    } catch (error) {
      console.error('获取分享列表出错:', error);
      message.error('获取分享列表出错，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 复制分享链接
  const copyShareLink = (shareCode: string, extractCode: string) => {
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/s/${shareCode}?code=${extractCode}`;
    
    navigator.clipboard.writeText(shareLink)
      .then(() => message.success('分享链接已复制到剪贴板'))
      .catch(() => message.error('复制失败，请手动复制'));
  };

  // 删除分享
  const deleteShare = async (shareIds: string[]) => {
    try {
      const response = await fetch('/api/storage/share', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareIds }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        message.success(`成功删除${data.data.deletedCount}个分享`);
        setSelectedRows([]);
        fetchShares();
      } else {
        message.error(data.error || '删除分享失败');
      }
    } catch (error) {
      console.error('删除分享出错:', error);
      message.error('删除分享出错，请重试');
    }
  };

  // 打开分享链接
  const openShareLink = (shareCode: string, extractCode: string) => {
    window.open(`/s/${shareCode}?code=${extractCode}`, '_blank');
  };

  // 获取文件图标
  const getFileIcon = (file: ShareFile) => {
    if (file.isFolder) return <Folder size={18} />;
    
    const fileType = file.type?.toLowerCase() || '';
    
    if (fileType.includes('image')) return <ImageIcon size={18} />;
    if (fileType.includes('video')) return <Video size={18} />;
    if (fileType.includes('audio')) return <Music size={18} />;
    if (fileType.includes('pdf') || fileType.includes('doc') || fileType.includes('txt')) 
      return <FileText size={18} />;
    
    return <File size={18} />;
  };

  // 获取分享状态
  const getShareStatus = (share: ShareItem) => {
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return <Tag color="error">已过期</Tag>;
    }
    
    if (share.accessLimit !== null && share.accessCount >= share.accessLimit) {
      return <Tag color="error">已失效</Tag>;
    }
    
    return <Tag color="success">有效</Tag>;
  };

  // 表格列定义
  const columns = [
    {
      title: '分享文件',
      dataIndex: 'files',
      key: 'files',
      render: (files: ShareFile[]) => (
        <Space direction="vertical" size={4}>
          {files.map(file => (
            <Space key={file.id} align="center">
              {getFileIcon(file)}
              <Text ellipsis={{ tooltip: file.name }} style={{ maxWidth: 200 }}>
                {file.name}
              </Text>
            </Space>
          ))}
        </Space>
      ),
    },
    {
      title: '分享时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Tooltip title={format(new Date(date), 'yyyy-MM-dd HH:mm:ss')}>
          {formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN })}
        </Tooltip>
      ),
      sorter: (a: ShareItem, b: ShareItem) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: ShareItem) => (
        <Space size="small">
          {getShareStatus(record)}
          {record.expiresAt && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {new Date(record.expiresAt) > new Date() 
                ? `${formatDistanceToNow(new Date(record.expiresAt), { locale: zhCN })}后过期`
                : `已过期${formatDistanceToNow(new Date(record.expiresAt), { locale: zhCN })}`}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '浏览次数',
      dataIndex: 'accessCount',
      key: 'accessCount',
      render: (count: number, record: ShareItem) => (
        <Space>
          <Text>{count}次</Text>
          {record.accessLimit && (
            <Text type="secondary">/共{record.accessLimit}次</Text>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ShareItem) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<ExternalLink size={16} />}
            onClick={() => openShareLink(record.shareCode, record.extractCode)}
          >
            访问
          </Button>
          <Button 
            type="text" 
            icon={<Copy size={16} />}
            onClick={() => copyShareLink(record.shareCode, record.extractCode)}
          >
            复制链接
          </Button>
          <Popconfirm
            title="确定要删除这个分享吗?"
            onConfirm={() => deleteShare([record.id])}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="text" 
              danger 
              icon={<Trash2 size={16} />}
            >
              删除
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
        title="确定要删除选中的分享吗?"
        onConfirm={() => deleteShare(selectedRows)}
        okText="确定"
        cancelText="取消"
        disabled={selectedRows.length === 0}
      >
        <Button
          danger
          disabled={selectedRows.length === 0}
          icon={<Trash2 size={16} />}
        >
          批量删除
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

  // 处理导航回主文件页面
  const handleNavigateToMain = () => {
    // 如果提供了回调函数，则调用它
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      // 只有在没有回调函数的情况下才进行页面跳转
      // 这种情况主要是为了兼容直接访问/file-management/my-shares路径的情况
      router.push('/file-management/main');
    }
  };

  return (
    <div className={styles.sharesPage}>
      <div className={styles.header}>
        <Title level={4} className={styles.title}>
          {titleIcon ? (
            titleIcon
          ) : (
            <Share2 className={styles.titleIcon} />
          )}
          我的分享
        </Title>
        <div className={styles.actions}>
          {batchActions}
          <Button
            type="primary"
            icon={<Share2 size={16} />}
            onClick={handleNavigateToMain}
          >
            创建新分享
          </Button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <Text className={styles.loadingText}>加载分享列表中...</Text>
        </div>
      ) : shares.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>
              <AlertCircle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              您还没有创建过分享
            </span>
          }
        >
          <Button 
            type="primary" 
            onClick={handleNavigateToMain}
          >
            去创建分享
          </Button>
        </Empty>
      ) : (
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={shares}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条分享`
          }}
        />
      )}
    </div>
  );
} 