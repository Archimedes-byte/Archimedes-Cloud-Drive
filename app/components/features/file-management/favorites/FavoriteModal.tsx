'use client';

import React, { useState, useEffect } from 'react';
import { 
  Modal, Button, List, Typography, Input, Form, 
  Space, Spin, Empty, message, Divider 
} from 'antd';
import { 
  Star, FolderPlus, Edit, Trash2} from 'lucide-react';
import { fileApi, FavoriteFolderInfo } from '@/app/lib/api/file-api';
import styles from './favorite-modal.module.css';

const { Text } = Typography;
const { Item } = Form;

interface FavoriteModalProps {
  fileId: string;
  fileName: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FavoriteModal({ 
  fileId, 
  fileName, 
  visible, 
  onClose, 
  onSuccess 
}: FavoriteModalProps) {
  const [folders, setFolders] = useState<FavoriteFolderInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [editingFolder, setEditingFolder] = useState<FavoriteFolderInfo | null>(null);

  // 获取收藏夹列表
  const fetchFolders = async () => {
    setLoading(true);
    try {
      const response = await fileApi.getFavoriteFolders();
      setFolders(response.folders);
    } catch (error) {
      console.error('获取收藏夹列表失败:', error);
      message.error('获取收藏夹列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    if (visible) {
      fetchFolders();
    }
  }, [visible]);

  // 创建收藏夹
  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      message.error('请输入收藏夹名称');
      return;
    }

    setCreating(true);
    try {
      const response = await fileApi.createFavoriteFolder(folderName, description);
      message.success('创建收藏夹成功');
      setFolders([...folders, response.folder]);
      setShowCreateForm(false);
      setFolderName('');
      setDescription('');
    } catch (error) {
      console.error('创建收藏夹失败:', error);
      message.error('创建收藏夹失败');
    } finally {
      setCreating(false);
    }
  };

  // 更新收藏夹
  const handleUpdateFolder = async () => {
    if (!editingFolder || !folderName.trim()) {
      message.error('请输入收藏夹名称');
      return;
    }

    setCreating(true);
    try {
      const response = await fileApi.updateFavoriteFolder(editingFolder.id, {
        name: folderName,
        description
      });
      message.success('更新收藏夹成功');
      setFolders(folders.map(f => f.id === response.folder.id ? response.folder : f));
      setEditingFolder(null);
      setFolderName('');
      setDescription('');
    } catch (error) {
      console.error('更新收藏夹失败:', error);
      message.error('更新收藏夹失败');
    } finally {
      setCreating(false);
    }
  };

  // 删除收藏夹
  const handleDeleteFolder = async (folder: FavoriteFolderInfo) => {
    if (folder.isDefault) {
      message.error('不能删除默认收藏夹');
      return;
    }

    try {
      await fileApi.deleteFavoriteFolder(folder.id);
      message.success('删除收藏夹成功');
      setFolders(folders.filter(f => f.id !== folder.id));
    } catch (error) {
      console.error('删除收藏夹失败:', error);
      message.error('删除收藏夹失败');
    }
  };

  // 添加到收藏夹
  const handleAddToFolder = async (folder: FavoriteFolderInfo) => {
    try {
      await fileApi.addToFavoriteFolder(fileId, folder.id);
      message.success(`已将"${fileName}"添加到收藏夹"${folder.name}"`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('添加到收藏夹失败:', error);
      message.error('添加到收藏夹失败');
    }
  };

  // 开始编辑收藏夹
  const startEdit = (folder: FavoriteFolderInfo) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setDescription(folder.description || '');
    setShowCreateForm(true);
  };

  // 取消编辑或创建
  const cancelEdit = () => {
    setEditingFolder(null);
    setFolderName('');
    setDescription('');
    setShowCreateForm(false);
  };

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <Star className={styles.titleIcon} />
          <span>收藏文件</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={450}
      destroyOnClose
    >
      <div className={styles.fileInfo}>
        <Text className={styles.fileLabel}>文件名:</Text>
        <Text className={styles.fileName}>{fileName}</Text>
      </div>

      <Divider>选择收藏夹</Divider>

      {loading ? (
        <div className={styles.loading}>
          <Spin />
          <Text className={styles.loadingText}>加载收藏夹列表...</Text>
        </div>
      ) : (
        <div className={styles.folderList}>
          {folders.length === 0 && !showCreateForm ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="您还没有创建收藏夹"
            />
          ) : (
            <List
              dataSource={folders}
              renderItem={(folder) => (
                <List.Item
                  className={styles.folderItem}
                  actions={[
                    <Space key="actions">
                      <Button
                        type="text"
                        icon={<Edit size={16} />}
                        onClick={() => startEdit(folder)}
                        disabled={creating}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDeleteFolder(folder)}
                        disabled={folder.isDefault || creating}
                      />
                    </Space>
                  ]}
                >
                  <div 
                    className={styles.folderInfo}
                    onClick={() => handleAddToFolder(folder)}
                  >
                    <div className={styles.folderName}>
                      {folder.isDefault && (
                        <span className={styles.defaultBadge}>默认</span>
                      )}
                      {folder.name}
                    </div>
                    {folder.fileCount !== undefined && (
                      <div className={styles.folderCount}>
                        {folder.fileCount} 个文件
                      </div>
                    )}
                    {folder.description && (
                      <div className={styles.folderDescription}>
                        {folder.description}
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          )}

          {!showCreateForm && (
            <Button
              type="dashed"
              block
              icon={<FolderPlus size={16} />}
              onClick={() => setShowCreateForm(true)}
              className={styles.createButton}
            >
              创建新收藏夹
            </Button>
          )}

          {showCreateForm && (
            <div className={styles.createForm}>
              <Form layout="vertical">
                <Item
                  label={editingFolder ? "修改收藏夹名称" : "收藏夹名称"}
                  required
                >
                  <Input
                    placeholder="请输入收藏夹名称"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    maxLength={50}
                    disabled={creating}
                  />
                </Item>
                <Item
                  label="描述"
                >
                  <Input.TextArea
                    placeholder="收藏夹描述（可选）"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    maxLength={200}
                    showCount
                    disabled={creating}
                  />
                </Item>
                <Item>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button 
                      onClick={cancelEdit}
                      disabled={creating}
                    >
                      取消
                    </Button>
                    <Button 
                      type="primary"
                      loading={creating}
                      onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
                    >
                      {editingFolder ? '更新' : '创建'}
                    </Button>
                  </Space>
                </Item>
              </Form>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
} 