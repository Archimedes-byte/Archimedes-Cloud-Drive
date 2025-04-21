import React, { useEffect, useState } from 'react';
import { 
  Folder, Files, Image as ImageIcon, FileText, 
  Video, Music, File, Search, ChevronDown, 
  Star, Clock, Tag, Download, Settings,
  CheckCircle, Share2, Plus
} from 'lucide-react';
import styles from '@/app/file-management/styles/shared.module.css';
import { fileApi, FavoriteFolderInfo } from '@/app/lib/api/file-api';
import { message } from 'antd';

export type FileType = 'image' | 'document' | 'video' | 'audio' | 'other' | null;

interface SidebarProps {
  selectedFileType: FileType;
  onTypeClick: (type: FileType) => void;
  onSearchClick?: (query?: string) => void;
  onSharesClick?: () => void;
  onFavoritesClick?: (folderId?: string) => void;
  onCreateFavoriteFolder?: () => void;
  onRecentClick?: () => void;
  onRecentDownloadsClick?: () => void;
  refreshTrigger?: number;
}

export function Sidebar({ 
  selectedFileType, 
  onTypeClick, 
  onSearchClick, 
  onSharesClick, 
  onFavoritesClick,
  onCreateFavoriteFolder,
  onRecentClick,
  onRecentDownloadsClick,
  refreshTrigger = 0
}: SidebarProps) {
  const fileTypes: { type: FileType; label: string; icon: React.ElementType }[] = [
    { type: null, label: '全部文件', icon: Files },
    { type: 'image', label: '图片', icon: ImageIcon },
    { type: 'document', label: '文档', icon: FileText },
    { type: 'video', label: '视频', icon: Video },
    { type: 'audio', label: '音频', icon: Music },
    { type: 'other', label: '其他', icon: File }
  ];

  const [quickAccessExpanded, setQuickAccessExpanded] = React.useState(true);
  const [myFilesExpanded, setMyFilesExpanded] = React.useState(true);
  const [settingsExpanded, setSettingsExpanded] = React.useState(false);
  const [favoritesExpanded, setFavoritesExpanded] = React.useState(false);
  const [favoriteFolders, setFavoriteFolders] = useState<FavoriteFolderInfo[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // 获取收藏夹列表
  const fetchFavoriteFolders = async () => {
    try {
      setLoadingFolders(true);
      const response = await fileApi.getFavoriteFolders();
      setFavoriteFolders(response.folders || []);
    } catch (error) {
      console.error('获取收藏夹列表失败:', error);
    } finally {
      setLoadingFolders(false);
    }
  };

  // 当收藏夹菜单展开时或刷新触发器更新时，获取收藏夹列表
  useEffect(() => {
    if (favoritesExpanded) {
      fetchFavoriteFolders();
    }
  }, [favoritesExpanded, refreshTrigger]);

  // 监听文件类型变化并记录日志
  useEffect(() => {
    console.log('侧边栏：当前选择的文件类型:', selectedFileType);
  }, [selectedFileType]);

  const handleTypeClick = (type: FileType) => {
    // 直接调用回调，不需要任何额外逻辑
    console.log('Sidebar直接点击类型:', type);
    onTypeClick(type);
  };

  // 添加按标签搜索处理函数
  const handleTagSearchClick = () => {
    // 通过onSearchClick回调传递'tag'参数，表示要打开按标签搜索
    if (onSearchClick) {
      onSearchClick('tag');
    }
  };

  // 修改处理我的分享点击事件的函数
  const handleMySharesClick = () => {
    if (onSharesClick) {
      // 如果提供了回调函数，就调用它
      onSharesClick();
    } else {
      // 作为备选方案，如果没有提供回调，则使用传统的页面跳转
      window.location.href = '/file-management/my-shares';
    }
  };

  // 处理收藏夹点击事件
  const handleFavoriteFolderClick = (folderId?: string) => {
    if (onFavoritesClick) {
      // 点击"全部收藏"时，确保传递undefined以显示所有收藏
      if (folderId === undefined) {
        console.log('点击全部收藏，显示所有收藏内容');
      } else {
        console.log('点击特定收藏夹:', folderId);
      }
      onFavoritesClick(folderId);
    }
  };

  // 处理新建收藏夹点击事件
  const handleCreateFavoriteFolderClick = () => {
    if (onCreateFavoriteFolder) {
      onCreateFavoriteFolder();
    }
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarSection}>
        <div 
          className={styles.sidebarHeader} 
          onClick={() => setMyFilesExpanded(!myFilesExpanded)}
        >
          <Folder className={styles.icon} />
          我的文件
          <ChevronDown 
            className={styles.icon} 
            style={{ 
              marginLeft: 'auto', 
              transform: myFilesExpanded ? 'rotate(180deg)' : 'rotate(0)', 
              transition: 'transform 0.3s' 
            }} 
            size={16} 
          />
        </div>
        {myFilesExpanded && (
          <div className={styles.sidebarSubmenu}>
            {fileTypes.map(({ type, label, icon: Icon }) => (
              <div
                key={type || 'all'}
                className={`${styles.sidebarItem} ${selectedFileType === type ? styles.active : ''}`}
                onClick={() => handleTypeClick(type)}
              >
                <Icon className={styles.icon} />
                {label}
                {selectedFileType === type && (
                  <CheckCircle 
                    className={styles.icon} 
                    style={{ 
                      marginLeft: 'auto', 
                      color: 'var(--theme-primary, #3b82f6)',
                      fill: 'var(--theme-primary, #3b82f6)',
                      stroke: '#fff',
                      opacity: 0.9,
                    }} 
                    size={16} 
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.sidebarSection}>
        <div 
          className={styles.sidebarHeader}
          onClick={() => setQuickAccessExpanded(!quickAccessExpanded)}
        >
          <Search className={styles.icon} />
          快捷查询
          <ChevronDown 
            className={styles.icon} 
            style={{ 
              marginLeft: 'auto', 
              transform: quickAccessExpanded ? 'rotate(180deg)' : 'rotate(0)', 
              transition: 'transform 0.3s' 
            }} 
            size={16} 
          />
        </div>
        {quickAccessExpanded && (
          <div className={styles.sidebarSubmenu}>
            <div 
              className={styles.sidebarItem}
              onClick={() => onSearchClick && onSearchClick()}
            >
              <Search className={styles.icon} />
              搜索文件
            </div>
            
            {/* 修改收藏部分为可展开的子菜单 */}
            <div className={styles.sidebarSubmenuItem}>
              <div 
                className={styles.sidebarItem}
                onClick={() => setFavoritesExpanded(!favoritesExpanded)}
              >
                <Star className={styles.icon} style={{ color: "rgba(59, 130, 246, 0.9)" }} />
                我的收藏
                <ChevronDown 
                  className={styles.icon} 
                  style={{ 
                    marginLeft: 'auto', 
                    transform: favoritesExpanded ? 'rotate(180deg)' : 'rotate(0)', 
                    transition: 'transform 0.3s',
                    color: "rgba(0, 0, 0, 0.5)"
                  }} 
                  size={16} 
                />
              </div>
              
              {/* 收藏夹展开区域 */}
              {favoritesExpanded && (
                <div className={styles.nestedSubmenu}>
                  {/* 全部收藏选项 */}
                  <div 
                    className={styles.sidebarNestedItem}
                    onClick={() => handleFavoriteFolderClick()}
                    style={{ fontWeight: "500" }}
                  >
                    <Star className={styles.icon} size={14} style={{ color: "rgba(59, 130, 246, 0.9)" }} />
                    全部收藏
                  </div>
                  
                  {/* 收藏夹列表 */}
                  {loadingFolders ? (
                    <div className={styles.sidebarNestedItem}>
                      <span className={styles.loadingText}>加载中...</span>
                    </div>
                  ) : favoriteFolders.length > 0 ? (
                    favoriteFolders.map(folder => (
                      <div 
                        key={folder.id}
                        className={styles.sidebarNestedItem}
                        onClick={() => handleFavoriteFolderClick(folder.id)}
                      >
                        <Folder className={styles.icon} size={14} style={{ color: "rgba(50, 100, 200, 0.8)" }} />
                        <span className={styles.folderName} title={folder.name}>
                          {folder.name}
                          {folder.isDefault && <span className={styles.defaultBadge}>默认</span>}
                        </span>
                        {folder.fileCount !== undefined && (
                          <span className={styles.folderCount}>({folder.fileCount})</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={styles.sidebarNestedItem}>
                      <span className={styles.emptyText}>暂无收藏夹</span>
                    </div>
                  )}
                  
                  {/* 新建收藏夹选项（斜体） */}
                  <div 
                    className={`${styles.sidebarNestedItem} ${styles.createNewItem}`}
                    onClick={handleCreateFavoriteFolderClick}
                  >
                    <Plus className={styles.icon} size={14} />
                    <span style={{ fontStyle: 'italic' }}>新建收藏夹</span>
                  </div>
                </div>
              )}
            </div>
            
            <div 
              className={styles.sidebarItem}
              onClick={() => onRecentClick && onRecentClick()}
            >
              <Clock className={styles.icon} />
              最近访问
            </div>
            <div 
              className={styles.sidebarItem}
              onClick={() => onRecentDownloadsClick && onRecentDownloadsClick()}
            >
              <Download className={styles.icon} />
              最近下载
            </div>
            <div 
              className={styles.sidebarItem}
              onClick={handleTagSearchClick}
            >
              <Tag className={styles.icon} />
              按标签查找
            </div>
            <div 
              className={styles.sidebarItem}
              onClick={handleMySharesClick}
            >
              <Share2 className={styles.icon} />
              我的分享
            </div>
          </div>
        )}
      </div>

      <div className={styles.sidebarSection}>
        <div 
          className={styles.sidebarHeader}
          onClick={() => setSettingsExpanded(!settingsExpanded)}
        >
          <Settings className={styles.icon} />
          系统设置
          <ChevronDown 
            className={styles.icon} 
            style={{ 
              marginLeft: 'auto', 
              transform: settingsExpanded ? 'rotate(180deg)' : 'rotate(0)', 
              transition: 'transform 0.3s' 
            }} 
            size={16} 
          />
        </div>
        {settingsExpanded && (
          <div className={styles.sidebarSubmenu}>
            <div className={styles.sidebarItem}>
              <Settings className={styles.icon} />
              存储管理
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 