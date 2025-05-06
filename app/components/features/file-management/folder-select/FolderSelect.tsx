import React, { useState, useEffect } from 'react';
import { Modal, Tree, Button, Spin, Empty, message } from 'antd';
import { FolderOutlined, HomeOutlined, PlusOutlined } from '@ant-design/icons';
import styles from './folder-select.module.css';

// 文件夹树节点类型
interface FolderNode {
  key: string;
  title: string;
  isLeaf: boolean;
  children?: FolderNode[];
}

// 组件属性
interface FolderSelectProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (folderId: string | null) => void;
  title?: string;
}

/**
 * 文件夹选择组件
 * 用于在各种操作中选择目标文件夹
 */
export const FolderSelect: React.FC<FolderSelectProps> = ({
  visible,
  onCancel,
  onSelect,
  title = "选择目标文件夹"
}) => {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  
  // 根目录节点
  const rootNode: FolderNode = {
    key: 'root',
    title: '根目录',
    isLeaf: false,
    children: []
  };

  // 加载文件夹数据
  useEffect(() => {
    if (visible) {
      loadFolders();
    }
  }, [visible]);

  // 获取所有文件夹
  const loadFolders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/storage/folders');
      const data = await response.json();
      
      if (data.folders) {
        // 构建树形结构
        const folderMap = new Map<string, FolderNode>();
        
        // 初始化所有文件夹节点
        data.folders.forEach((folder: any) => {
          folderMap.set(folder.id, {
            key: folder.id,
            title: folder.name,
            isLeaf: false,
            children: []
          });
        });
        
        // 构建父子关系
        data.folders.forEach((folder: any) => {
          if (folder.parentId) {
            const parentNode = folderMap.get(folder.parentId);
            const currentNode = folderMap.get(folder.id);
            
            if (parentNode && currentNode) {
              if (!parentNode.children) {
                parentNode.children = [];
              }
              parentNode.children.push(currentNode);
            }
          } else {
            // 顶级文件夹
            const node = folderMap.get(folder.id);
            if (node) {
              if (!rootNode.children) {
                rootNode.children = [];
              }
              rootNode.children.push(node);
            }
          }
        });
        
        // 确保根节点有children数组
        if (!rootNode.children) {
          rootNode.children = [];
        }
        
        setFolders([rootNode]);
      }
    } catch (error) {
      console.error('加载文件夹失败', error);
      message.error('加载文件夹失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理选择
  const handleSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0].toString();
      setSelectedFolderId(key === 'root' ? null : key);
    } else {
      setSelectedFolderId(null);
    }
  };

  // 处理展开/收起
  const handleExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys.map(k => k.toString()));
  };

  // 确认选择
  const handleConfirm = () => {
    onSelect(selectedFolderId);
  };

  // 渲染树节点的图标
  const renderIcon = (props: any) => {
    return props.data.key === 'root' ? <HomeOutlined /> : <FolderOutlined />;
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleConfirm}
        >
          确定
        </Button>
      ]}
      width={500}
      className={styles.folderSelectModal}
      destroyOnClose
    >
      <div className={styles.folderTree}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin />
            <p>加载文件夹...</p>
          </div>
        ) : folders.length > 0 ? (
          <Tree
            showIcon
            defaultExpandAll
            blockNode
            selectable
            selectedKeys={selectedFolderId ? [selectedFolderId] : ['root']}
            expandedKeys={expandedKeys.length > 0 ? expandedKeys : ['root']}
            onSelect={handleSelect}
            onExpand={handleExpand}
            treeData={folders}
            className={styles.tree}
            icon={renderIcon}
          />
        ) : (
          <Empty description="没有可用的文件夹" />
        )}
      </div>
    </Modal>
  );
}; 