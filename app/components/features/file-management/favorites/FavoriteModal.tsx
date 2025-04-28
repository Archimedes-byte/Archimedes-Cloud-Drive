'use client';

import React, { useState, useEffect } from 'react';
import { 
  Modal, Button, List, Typography, Input, Form, 
  Space, Spin, Empty, message, Divider, Card,
  Tooltip, Badge
} from 'antd';
import { 
  Star, FolderPlus, Edit, Trash2, FolderOpen,
  FileText, FileImage, FileVideo, FileAudio,
  FileCode, File
} from 'lucide-react';
import { fileApi, FavoriteFolderInfo } from '@/app/lib/api/file-api';
import styles from './favorites.module.css';
import { FileIcon } from '@/app/utils/file/icon-map';

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
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);

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
      
      // 触发刷新事件
      const refreshEvent = new CustomEvent('refresh_favorite_folders');
      window.dispatchEvent(refreshEvent);
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

  // 获取文件图标
  const getFileIcon = () => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return <FileIcon extension={ext} className={styles.fileIcon} size={24} />;
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
      width={600}
      destroyOnClose
      className={styles.favoriteModal}
    >
      <div className={styles.fileInfo}>
        <div className={styles.fileIconContainer}>
          {getFileIcon()}
        </div>
        <div className={styles.fileNameContainer}>
          <Text className={styles.fileName} ellipsis={true} title={fileName}>
            {fileName}
          </Text>
        </div>
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
            <div className={styles.folderGrid}>
              {folders.map((folder) => (
                <Card
                  key={folder.id}
                  className={`${styles.folderCard} ${hoveredFolder === folder.id ? styles.hovered : ''}`}
                  onMouseEnter={() => setHoveredFolder(folder.id)}
                  onMouseLeave={() => setHoveredFolder(null)}
                  onClick={() => handleAddToFolder(folder)}
                >
                  <div className={styles.folderContent}>
                    <div className={styles.folderHeader}>
                      <FolderOpen className={styles.folderIcon} />
                      <div className={styles.folderNameContainer}>
                        <Text className={styles.folderName} ellipsis={true} title={folder.name}>
                          {folder.name}
                        </Text>
                        {folder.isDefault && (
                          <Badge status="processing" text="默认" className={styles.defaultBadge} />
                        )}
                      </div>
                    </div>
                    {folder.description && (
                      <Text type="secondary" className={styles.folderDescription}>
                        {folder.description}
                      </Text>
                    )}
                    <div className={styles.folderFooter}>
                      <Badge count={folder.fileCount || 0} className={styles.fileCount} />
                      <Space className={styles.folderActions}>
                        <Tooltip title="编辑">
                          <Button
                            type="text"
                            icon={<Edit size={16} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(folder);
                            }}
                            disabled={creating}
                          />
                        </Tooltip>
                        {!folder.isDefault && (
                          <Tooltip title="删除">
                            <Button
                              type="text"
                              danger
                              icon={<Trash2 size={16} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder);
                              }}
                              disabled={creating}
                            />
                          </Tooltip>
                        )}
                      </Space>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
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
            <Card className={styles.createForm}>
              <Form layout="vertical">
                <Item 
                  label="收藏夹名称" 
                  required
                  validateStatus={folderName.trim() ? 'success' : 'error'}
                  help={folderName.trim() ? undefined : '请输入收藏夹名称'}
                >
                  <Input
                    placeholder="请输入收藏夹名称"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    maxLength={50}
                  />
                </Item>
                <Item label="描述(可选)">
                  <Input.TextArea
                    placeholder="添加收藏夹描述"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    maxLength={200}
                  />
                </Item>
                <Item>
                  <Space>
                    <Button
                      type="primary"
                      onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
                      loading={creating}
                    >
                      {editingFolder ? '更新' : '创建'}
                    </Button>
                    <Button onClick={cancelEdit}>
                      取消
                    </Button>
                  </Space>
                </Item>
              </Form>
            </Card>
          )}
        </div>
      )}
    </Modal>
  );
} 