import React, { useState, useEffect } from 'react';
import { Button, Table, message, Popconfirm, Space, Typography } from 'antd';
import { ArrowLeft, Share2, Trash2, Clock, Users, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import styles from './shares-content.module.css';

const { Title } = Typography;

interface SharesContentProps {
  onNavigateBack?: () => void;
  onOpenFile?: (fileId: string) => void;
  titleIcon?: React.ReactNode;
}

interface ShareItem {
  id: string;
  fileId: string;
  fileName: string;
  shareLink: string;
  extractCode: string;
  expiryDays: number;
  accessLimit: number | null;
  createdAt: string;
  accessCount: number;
}

export default function SharesContent({ onNavigateBack, onOpenFile, titleIcon }: SharesContentProps) {
  const { data: session, status } = useSession();
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载分享列表
  useEffect(() => {
    const fetchShares = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/storage/share');
        if (!response.ok) {
          throw new Error('获取分享列表失败');
        }
        const data = await response.json();
        setShares(data.shares);
      } catch (error) {
        console.error('加载分享列表失败:', error);
        message.error('加载分享列表失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchShares();
    }
  }, [status]);

  // 处理删除分享
  const handleDeleteShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/storage/share`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shareIds: [shareId] })
      });
      
      if (!response.ok) {
        throw new Error('删除分享失败');
      }
      
      setShares(shares.filter(share => share.id !== shareId));
      message.success('分享已删除');
    } catch (error) {
      console.error('删除分享失败:', error);
      message.error('删除分享失败，请重试');
    }
  };

  // 复制分享链接
  const copyShareLink = (shareLink: string, extractCode: string) => {
    const textToCopy = extractCode 
      ? `分享链接：${shareLink}\n提取码：${extractCode}` 
      : `分享链接：${shareLink}`;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        message.success('分享链接已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text: string, record: ShareItem) => (
        <div className={styles.fileNameCell}>
          <span className={styles.fileName}>{text}</span>
          {onOpenFile && (
            <Button 
              type="link" 
              onClick={() => onOpenFile(record.fileId)}
              className={styles.openButton}
            >
              打开
            </Button>
          )}
        </div>
      ),
    },
    {
      title: '分享链接',
      dataIndex: 'shareLink',
      key: 'shareLink',
      render: (text: string, record: ShareItem) => (
        <div className={styles.shareLinkCell}>
          <span className={styles.shareLink}>{text}</span>
          <Button 
            type="link" 
            onClick={() => copyShareLink(text, record.extractCode)}
            className={styles.copyButton}
          >
            复制
          </Button>
        </div>
      ),
    },
    {
      title: '提取码',
      dataIndex: 'extractCode',
      key: 'extractCode',
    },
    {
      title: '有效期',
      dataIndex: 'expiryDays',
      key: 'expiryDays',
      render: (days: number) => (
        <div className={styles.expiryCell}>
          <Clock size={16} className={styles.icon} />
          <span>{days === -1 ? '永久有效' : `${days}天`}</span>
        </div>
      ),
    },
    {
      title: '访问限制',
      dataIndex: 'accessLimit',
      key: 'accessLimit',
      render: (limit: number | null) => (
        <div className={styles.accessLimitCell}>
          <Users size={16} className={styles.icon} />
          <span>{limit === null ? '不限制' : `${limit}人`}</span>
        </div>
      ),
    },
    {
      title: '访问次数',
      dataIndex: 'accessCount',
      key: 'accessCount',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <div className={styles.createdAtCell}>
          {formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN })}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ShareItem) => (
        <Space size="middle">
          <Popconfirm
            title="确定要删除这个分享吗？"
            onConfirm={() => handleDeleteShare(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="text" 
              danger 
              icon={<Trash2 size={16} />}
              className={styles.deleteButton}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.sharesContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {onNavigateBack && (
            <Button 
              icon={<ArrowLeft size={16} />} 
              onClick={onNavigateBack}
              className={styles.backButton}
              type="text"
            >
              返回
            </Button>
          )}
          <Title level={3} className={styles.title}>
            {titleIcon || <Share2 className={styles.titleIcon} />}
            我的分享
          </Title>
        </div>
      </div>

      <div className={`${styles.content} ${styles.tableStyles}`}>
        <Table
          columns={columns}
          dataSource={shares}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条分享记录`,
          }}
        />
      </div>
    </div>
  );
} 