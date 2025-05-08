import React, { useState, useEffect } from 'react';
import { Modal, Spin, Empty, message, Button, Input } from 'antd';
import { FolderIcon, Search, ChevronRight, FolderPlus, Home, RefreshCw } from 'lucide-react';
import styles from './FolderSelectModal.module.css';
import { fileApi } from '@/app/lib/api/file-api';
import { FileInfo } from '@/app/types';

/**
 * 文件夹选择弹窗Props
 */
export interface FolderSelectModalProps {
  /** 弹窗是否可见 */
  isOpen: boolean;
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 选择确认回调 */
  onConfirm: (targetFolderId: string) => void;
  /** 当前文件夹ID，不能选择自己作为目标 */
  currentFolderId?: string | null;
  /** 不能选择的文件夹ID列表（如被移动的文件夹本身及其子文件夹） */
  disabledFolderIds?: string[];
  /** 标题 */
  title?: string;
  /** 是否正在移动（用于禁用确认按钮和显示移动中状态） */
  isLoading?: boolean;
  /** 刷新文件列表函数 */
  onRefresh?: () => void;
}

/**
 * 文件夹节点类型
 */
interface FolderNode {
  id: string;
  name: string;
  parentId: string | null | undefined;
  path: string;
  children?: FolderNode[];
  isExpanded?: boolean;
}

/**
 * 文件夹选择弹窗组件
 * 用于文件移动操作时选择目标文件夹
 */
const FolderSelectModal: React.FC<FolderSelectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentFolderId,
  disabledFolderIds = [],
  title = '选择网盘保存路径',
  isLoading = false,
  onRefresh
}) => {
  // 状态管理
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<{id: string | null, name: string}[]>([
    { id: null, name: '全部文件' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredFolders, setFilteredFolders] = useState<FolderNode[]>([]);
  
  // 添加移动成功状态
  const [moveSuccess, setMoveSuccess] = useState(false);
  
  // 初始加载根文件夹
  useEffect(() => {
    if (isOpen) {
      loadFolders(null);
      setMoveSuccess(false);
      // 重置选择状态，避免上次选择的文件夹被保留
      setSelectedFolderId(null);
    } else {
      // 重置状态
      setSelectedFolderId(null);
      setCurrentPath([{ id: null, name: '全部文件' }]);
      setSearchTerm('');
    }
  }, [isOpen]);
  
  // 筛选文件夹
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFolders(folders);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = folders.filter(folder => 
        folder.name.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredFolders(filtered);
    }
  }, [folders, searchTerm]);
  
  /**
   * 加载文件夹列表
   * @param parentId 父文件夹ID
   */
  const loadFolders = async (parentId: string | null) => {
    try {
      setLoading(true);
      setError(null);
      
      // 调用API获取文件夹列表
      const response = await fileApi.getFolders(parentId);
      const folderItems = response.items?.filter(item => item.isFolder) || [];
      
      // 构建文件夹树
      const folderNodes: FolderNode[] = folderItems.map(folder => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        path: folder.path || '/',
        isExpanded: false
      }));
      
      setFolders(folderNodes);
      setFilteredFolders(folderNodes);
      
      // 当切换文件夹后，清除选中状态
      // 但如果这是初始加载，且当前目录不是根目录，可以预选当前目录的父目录
      if (parentId !== null || currentFolderId === null) {
        setSelectedFolderId(null);
      } else if (currentFolderId && parentId === null) {
        // 如果处于根目录，尝试查找并选中当前文件夹的父文件夹
        try {
          const currentFolder = await fileApi.getFile(currentFolderId);
          if (currentFolder && currentFolder.parentId) {
            setSelectedFolderId(currentFolder.parentId);
          }
        } catch (error) {
          console.error('获取当前文件夹信息失败:', error);
        }
      }
    } catch (error) {
      console.error('加载文件夹失败:', error);
      setError('加载文件夹失败，请重试');
      message.error('加载文件夹失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 处理文件夹点击事件
   * @param folder 点击的文件夹节点
   */
  const handleFolderClick = (folder: FolderNode) => {
    // 更新路径
    setCurrentPath([...currentPath, {id: folder.id, name: folder.name}]);
    // 加载该文件夹的子文件夹
    loadFolders(folder.id);
    // 清空搜索
    setSearchTerm('');
  };
  
  /**
   * 处理路径导航点击
   * @param index 路径索引
   */
  const handlePathClick = (index: number) => {
    // 截断路径到点击的位置
    const newPath = currentPath.slice(0, index + 1);
    setCurrentPath(newPath);
    // 加载对应文件夹
    loadFolders(newPath[index].id);
    // 清空搜索
    setSearchTerm('');
  };
  
  /**
   * 处理回到根目录
   */
  const handleHomeClick = () => {
    setCurrentPath([{ id: null, name: '全部文件' }]);
    loadFolders(null);
    setSearchTerm('');
  };
  
  /**
   * 处理文件夹选择
   * @param folder 选择的文件夹
   */
  const handleFolderSelect = (folder: FolderNode) => {
    // 如果是重复点击已选中的文件夹，则取消选择
    if (selectedFolderId === folder.id) {
      setSelectedFolderId(null);
    } else {
      setSelectedFolderId(folder.id);
    }
  };
  
  /**
   * 确认移动
   */
  const handleConfirm = () => {
    if (selectedFolderId) {
      // 移动前检查，确保不会移动到被禁用的目录
      if (disabledFolderIds.includes(selectedFolderId)) {
        message.error('不能移动到所选文件夹或其子文件夹');
        return;
      }
      
      // 确认不是移动到当前目录
      if (selectedFolderId === currentFolderId) {
        message.warning('不能移动到文件的当前位置');
        return;
      }
      
      // 设置移动成功状态为true，显示刷新按钮
      setMoveSuccess(true);
      onConfirm(selectedFolderId);
    } else {
      message.warning('请选择目标文件夹');
    }
  };
  
  /**
   * 手动刷新
   */
  const handleManualRefresh = () => {
    if (onRefresh) {
      onRefresh();
      message.success('文件列表已刷新');
      // 刷新后关闭弹窗
      onClose();
    }
  };
  
  // 判断文件夹是否禁用，只禁用被移动的文件夹及其子文件夹
  const isFolderDisabled = (folderId: string): boolean => {
    return disabledFolderIds.includes(folderId);
  };
  
  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <span>{title}</span>
          {isLoading && <span className={styles.loadingText}>正在移动...</span>}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        moveSuccess && onRefresh && (
          <Button 
            key="refresh" 
            icon={<RefreshCw size={16} />}
            onClick={handleManualRefresh}
            disabled={isLoading}
          >
            刷新文件列表
          </Button>
        ),
        <Button key="cancel" onClick={onClose} disabled={isLoading}>
          取消
        </Button>,
        <Button
          key="moveToRoot"
          onClick={() => onConfirm('root')}
          disabled={isLoading || currentFolderId === null}
          style={{ marginRight: 8 }}
        >
          移动到根目录
        </Button>,
        <Button 
          key="confirm" 
          type="primary" 
          onClick={handleConfirm} 
          disabled={!selectedFolderId || isLoading}
          loading={isLoading}
        >
          {isLoading ? '移动中...' : '移动到此'}
        </Button>
      ].filter(Boolean)}
      width={700}
      maskClosable={false}
      destroyOnClose={true}
      className={styles.folderSelectModal}
    >
      <div className={styles.modalContent}>
        {/* 操作栏 */}
        <div className={styles.actionBar}>
          <Button 
            icon={<Home size={16} />} 
            onClick={handleHomeClick}
            type="text"
            className={styles.homeButton}
          >
            根目录
          </Button>
          
          {/* 搜索框 */}
          <div className={styles.searchContainer}>
            <Input
              placeholder="搜索文件夹..." 
              prefix={<Search size={16} className={styles.searchIcon} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* 面包屑导航 */}
        <div className={styles.breadcrumb}>
          {currentPath.map((path, index) => (
            <React.Fragment key={path.id || 'root'}>
              {index > 0 && <ChevronRight size={16} className={styles.breadcrumbSeparator} />}
              <span 
                className={`${styles.breadcrumbItem} ${index === currentPath.length - 1 ? styles.breadcrumbActive : ''}`}
                onClick={() => handlePathClick(index)}
              >
                {path.name}
              </span>
            </React.Fragment>
          ))}
        </div>
        
        {/* 文件夹列表 */}
        <div className={styles.folderListContainer}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <Spin size="large">
                <div style={{ padding: '50px', textAlign: 'center' }}>
                  加载中...
                </div>
              </Spin>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <div className={styles.errorMessage}>{error}</div>
              <Button 
                type="primary"
                onClick={() => loadFolders(currentPath[currentPath.length - 1].id)}
                className={styles.retryButton}
              >
                重试
              </Button>
            </div>
          ) : filteredFolders.length === 0 ? (
            <Empty 
              description={
                searchTerm 
                  ? `没有找到包含 "${searchTerm}" 的文件夹` 
                  : "此文件夹为空"
              } 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
              className={styles.emptyState}
            />
          ) : (
            <div className={styles.folderGrid}>
              {filteredFolders.map(folder => (
                <div 
                  key={folder.id}
                  className={`${styles.folderItem} ${isFolderDisabled(folder.id) ? styles.folderDisabled : ''} ${selectedFolderId === folder.id ? styles.folderSelected : ''}`}
                  onClick={() => !isFolderDisabled(folder.id) && handleFolderSelect(folder)}
                  onDoubleClick={() => !isFolderDisabled(folder.id) && handleFolderClick(folder)}
                >
                  <div className={styles.folderIcon}>
                    <FolderIcon 
                      size={36} 
                      color={isFolderDisabled(folder.id) ? "#ccc" : selectedFolderId === folder.id ? "#1677ff" : "#ffc107"} 
                    />
                  </div>
                  <div className={styles.folderName} title={folder.name}>
                    {folder.name}
                  </div>
                  {selectedFolderId === folder.id && (
                    <div className={styles.selectedIndicator} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.modalFooterHint}>
          <p>
            <span className={styles.hintIcon}>💡</span>
            提示: 单击选择文件夹，双击进入文件夹
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default FolderSelectModal; 