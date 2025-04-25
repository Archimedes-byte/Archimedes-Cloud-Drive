'use client';

import React, { useState, useEffect } from 'react';
import { 
  Button, message, Typography, Space, 
  Popconfirm, Spin, Empty, Input, Modal
} from 'antd';
import { 
  Star, Folder, ArrowLeft, Plus, Edit, Trash2
} from 'lucide-react';
import styles from './favorites.module.css';
import { fileApi, FavoriteFolderInfo } from '@/app/lib/api/file-api';
import { Breadcrumb } from '../navigation/breadcrumb';

const { Title, Text } = Typography;

interface FolderManagementProps {
  onNavigateBack: () => void;
  onFolderSelect?: (folderId: string) => void;
}

export default function FolderManagement({ onNavigateBack, onFolderSelect }: FolderManagementProps) {
  const [folders, setFolders] = useState<FavoriteFolderInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');

  // 获取收藏夹列表
  const fetchFolderList = async () => {
    setLoading(true);
    try {
      const response = await fileApi.getFavoriteFolders();
      setFolders(response.folders || []);
    } catch (error) {
      console.error('获取收藏夹列表失败:', error);
      message.error('获取收藏夹列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchFolderList();
  }, []);

  // 添加新收藏夹
  const handleAddFolder = async () => {
    if (!newFolderName.trim()) {
      message.error('收藏夹名称不能为空');
      return;
    }
    
    try {
      setLoading(true);
      await fileApi.createFavoriteFolder(newFolderName, newFolderDescription);
      message.success('收藏夹创建成功');
      setIsAddModalVisible(false);
      setNewFolderName('');
      setNewFolderDescription('');
      fetchFolderList();
    } catch (error) {
      console.error('创建收藏夹失败:', error);
      message.error('创建收藏夹失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除收藏夹
  const handleDeleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
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
        fetchFolderList();
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
  
  // 渲染面包屑
  const renderBreadcrumb = () => {
    return (
      <div className={styles.breadcrumbContainer}>
        <Breadcrumb 
          folderPath={[{ id: 'folders', name: '收藏夹管理' }]}
          showHome={true}
          onPathClick={(folderId) => {
            if (folderId === null) {
              // 返回主页面
              onNavigateBack();
            }
          }}
          onBackClick={onNavigateBack}
        />
      </div>
    );
  };

  return (
    <div className={styles.favoritesContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button 
            icon={<ArrowLeft size={16} />} 
            onClick={onNavigateBack}
            className={styles.backButton}
            type="text"
          >
            返回
          </Button>
          <Title level={3} className={styles.title}>
            <Star className={styles.titleIcon} />
            收藏夹管理
          </Title>
        </div>
        
        <div className={styles.headerRight}>
          <Button 
            type="primary" 
            icon={<Plus size={16} />}
            onClick={() => setIsAddModalVisible(true)}
          >
            创建收藏夹
          </Button>
        </div>
      </div>
      
      {renderBreadcrumb()}

      {/* 收藏夹列表 */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <p>加载收藏夹中...</p>
        </div>
      ) : folders.length > 0 ? (
        <div className={styles.folderGrid}>
          {folders.map(folder => (
            <div key={folder.id} className={styles.folderCard}>
              <div className={styles.folderCardHeader}>
                <Folder className={styles.folderIcon} />
                <Text strong>{folder.name}</Text>
                {folder.isDefault && (
                  <span className={styles.defaultBadge}>默认</span>
                )}
              </div>
              
              {folder.description && (
                <div className={styles.folderDescription}>
                  {folder.description}
                </div>
              )}
              
              <div className={styles.folderMeta}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  文件数: {folder.fileCount || 0}
                </Text>
              </div>
              
              <div className={styles.folderCardActions}>
                {onFolderSelect && (
                  <Button 
                    size="small"
                    onClick={() => onFolderSelect(folder.id)}
                  >
                    查看文件
                  </Button>
                )}
                
                {!folder.isDefault && (
                  <Popconfirm
                    title="确定要删除这个收藏夹吗?"
                    description="删除后无法恢复，文件夹中的收藏项将被保留到「默认收藏夹」"
                    onConfirm={() => handleDeleteFolder(folder.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button 
                      size="small" 
                      danger
                      icon={<Trash2 size={14} />}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty 
          description="暂无收藏夹" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      )}
      
      {/* 添加收藏夹模态框 */}
      <Modal
        title="创建新收藏夹"
        open={isAddModalVisible}
        onOk={handleAddFolder}
        onCancel={() => setIsAddModalVisible(false)}
        confirmLoading={loading}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>收藏夹名称</Text>
          <Input 
            placeholder="输入收藏夹名称" 
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
        
        <div>
          <Text strong>描述（可选）</Text>
          <Input.TextArea 
            placeholder="收藏夹描述（可选）" 
            value={newFolderDescription}
            onChange={e => setNewFolderDescription(e.target.value)}
            style={{ marginTop: 8 }}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
} 