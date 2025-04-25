'use client';

import React, { useState, useEffect } from 'react';
import { 
  Button, message, Typography, Space, 
  Popconfirm, Spin, Empty, Input, Modal
} from 'antd';
import { 
  Star, Folder, ArrowLeft, Plus, Edit, Trash2
} from 'lucide-react';
import { fileApi, FavoriteFolderInfo } from '@/app/lib/api/file-api';
import { Breadcrumb } from '../navigation/breadcrumb';
import styles from './folder-management.module.css';

const { Title, Text } = Typography;

interface FolderManagementProps {
  onNavigateBack: () => void;
  onFolderSelect?: (folderId: string) => void;
}

/**
 * 文件夹管理组件
 * 提供收藏夹管理功能
 */
export default function FolderManagement({ onNavigateBack, onFolderSelect }: FolderManagementProps) {
  const [folders, setFolders] = useState<FavoriteFolderInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);

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
  
  // 监听收藏夹列表更新事件
  useEffect(() => {
    // 处理收藏夹列表更新事件
    const handleFoldersUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{folders: FavoriteFolderInfo[]}>;
      if (customEvent.detail?.folders) {
        // 直接使用事件中的文件夹列表更新，避免额外的API请求
        setFolders(customEvent.detail.folders);
      } else {
        // 如果事件没有提供数据，则重新获取
        fetchFolderList();
      }
    };
    
    // 添加事件监听器
    window.addEventListener('favorite_folders_updated', handleFoldersUpdated);
    
    // 只监听refresh_favorite_folders事件但不触发它，避免产生循环
    const handleRefreshRequest = () => {
      fetchFolderList();
    };
    window.addEventListener('refresh_favorite_folders', handleRefreshRequest);
    
    // 组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('favorite_folders_updated', handleFoldersUpdated);
      window.removeEventListener('refresh_favorite_folders', handleRefreshRequest);
    };
  }, []);

  // 添加新收藏夹
  const handleAddFolder = async () => {
    if (!newFolderName.trim()) {
      message.error('收藏夹名称不能为空');
      return;
    }

    setAddingFolder(true);
    try {
      const response = await fileApi.createFavoriteFolder(
        newFolderName,
        newFolderDescription
      );
      message.success('收藏夹创建成功');
      setNewFolderName('');
      setNewFolderDescription('');
      setFolders([...folders, response.folder]);
      setIsAddModalVisible(false);
      
      // 触发全局收藏夹刷新事件
      const refreshEvent = new CustomEvent('refresh_favorite_folders');
      window.dispatchEvent(refreshEvent);
    } catch (error) {
      console.error('创建收藏夹失败:', error);
      message.error('创建收藏夹失败');
    } finally {
      setAddingFolder(false);
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
        
        // 直接更新本地列表
        const updatedFolders = folders.filter(f => f.id !== folder.id);
        setFolders(updatedFolders);
        
        // 触发全局刷新事件
        const refreshEvent = new CustomEvent('refresh_favorite_folders');
        window.dispatchEvent(refreshEvent);
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
    <div className={styles.folderManagementContainer}>
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
                      danger
                      size="small"
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
        <div className={styles.emptyContainer}>
          <Empty
            description="暂无收藏夹"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      )}
      
      {/* 创建文件夹模态框 */}
      <Modal
        title="创建新收藏夹"
        open={isAddModalVisible}
        onOk={handleAddFolder}
        onCancel={() => setIsAddModalVisible(false)}
        confirmLoading={addingFolder}
      >
        <div className={styles.formItem}>
          <div className={styles.formLabel}>收藏夹名称:</div>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="请输入收藏夹名称"
            maxLength={50}
          />
        </div>
        
        <div className={styles.formItem}>
          <div className={styles.formLabel}>描述 (可选):</div>
          <Input.TextArea
            value={newFolderDescription}
            onChange={(e) => setNewFolderDescription(e.target.value)}
            placeholder="请输入描述信息"
            rows={3}
            maxLength={200}
          />
        </div>
      </Modal>
    </div>
  );
} 