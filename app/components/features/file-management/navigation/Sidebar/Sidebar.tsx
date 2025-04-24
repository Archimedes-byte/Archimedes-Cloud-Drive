import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Folder, Files, Image as ImageIcon, FileText, 
  Video, Music, File, Search, ChevronDown, 
  Star, Clock, Tag, Download,
  CheckCircle, Share2, Plus
} from 'lucide-react';
import styles from '@/app/file-management/styles/shared.module.css';
import { fileApi, FavoriteFolderInfo } from '@/app/lib/api/file-api';

export type FileType = 'image' | 'document' | 'video' | 'audio' | 'other' | null;

// 统一视图类型，包含文件类型和功能视图
type ViewType = FileType | 'search' | 'favorites' | 'recent' | 'downloads' | 'tag' | 'shares';

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
  // 新增当前活动视图参数，允许从外部控制
  activeView?: ViewType;
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
  refreshTrigger = 0,
  activeView: externalActiveView
}: SidebarProps) {
  const fileTypes: { type: FileType; label: string; icon: React.ElementType }[] = [
    { type: null, label: '全部文件', icon: Files },
    { type: 'image', label: '图片', icon: ImageIcon },
    { type: 'document', label: '文档', icon: FileText },
    { type: 'video', label: '视频', icon: Video },
    { type: 'audio', label: '音频', icon: Music },
    { type: 'other', label: '其他', icon: File }
  ];

  const [quickAccessExpanded, setQuickAccessExpanded] = useState(true);
  const [myFilesExpanded, setMyFilesExpanded] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState(false);
  const [favoriteFolders, setFavoriteFolders] = useState<FavoriteFolderInfo[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  
  // 整合内部活动视图状态，默认使用外部传入的值或选中的文件类型
  const [internalActiveView, setInternalActiveView] = useState<ViewType>(externalActiveView || selectedFileType);
  
  // 当外部activeView或selectedFileType变化时更新内部状态
  useEffect(() => {
    if (externalActiveView !== undefined) {
      setInternalActiveView(externalActiveView);
    } else if (selectedFileType !== undefined && ['search', 'favorites', 'recent', 'downloads', 'tag', 'shares'].indexOf(internalActiveView as string) === -1) {
      setInternalActiveView(selectedFileType);
    }
  }, [externalActiveView, selectedFileType]);
  
  // 添加缓存时间引用
  const lastFetchTimeRef = useRef(0);
  const cacheTimeoutRef = useRef(30000); // 30秒缓存超时

  // 添加渐变动画渲染完成控制
  const [myFilesVisible, setMyFilesVisible] = useState(true);
  const [quickAccessVisible, setQuickAccessVisible] = useState(true);
  const [favoritesVisible, setFavoritesVisible] = useState(false);

  // 使用useCallback优化获取收藏夹列表函数
  const fetchFavoriteFolders = useCallback(async () => {
    const now = Date.now();
    // 如果距离上次请求的时间小于缓存超时时间且已有数据，则不再请求
    if (now - lastFetchTimeRef.current < cacheTimeoutRef.current && favoriteFolders.length > 0) {
      return;
    }
    
    try {
      setLoadingFolders(true);
      const response = await fileApi.getFavoriteFolders();
      setFavoriteFolders(response.folders || []);
      lastFetchTimeRef.current = now; // 更新最后请求时间
    } catch (error) {
      // 保留错误日志，但移除非必要的详情
      console.error('获取收藏夹列表失败');
    } finally {
      setLoadingFolders(false);
    }
  }, [favoriteFolders.length]);

  // 当收藏夹菜单展开时或刷新触发器更新时，获取收藏夹列表
  useEffect(() => {
    if (favoritesExpanded) {
      fetchFavoriteFolders();
    }
  }, [favoritesExpanded, refreshTrigger, fetchFavoriteFolders]);
  
  // 在展开/折叠状态更新后设置可见性状态
  useEffect(() => {
    if (myFilesExpanded) {
      setMyFilesVisible(true);
    }
    if (quickAccessExpanded) {
      setQuickAccessVisible(true);
    }
    if (favoritesExpanded) {
      setFavoritesVisible(true);
    }
  }, [myFilesExpanded, quickAccessExpanded, favoritesExpanded]);

  // 使用useCallback优化处理类型点击事件，更新统一的活动视图
  const handleTypeClick = useCallback((type: FileType) => {
    console.log('Sidebar: 文件类型点击 -', type);
    setInternalActiveView(type);
    console.log('Sidebar: 内部活动视图已更新为:', type);
    onTypeClick(type);
    console.log('Sidebar: 已调用onTypeClick回调');
  }, [onTypeClick]);

  // 添加按标签搜索处理函数
  const handleTagSearchClick = useCallback(() => {
    setInternalActiveView('tag');
    if (onSearchClick) {
      onSearchClick('tag');
    }
  }, [onSearchClick]);

  // 修改处理我的分享点击事件的函数
  const handleMySharesClick = useCallback(() => {
    setInternalActiveView('shares');
    if (onSharesClick) {
      onSharesClick();
    } else {
      window.location.href = '/file-management/my-shares';
    }
  }, [onSharesClick]);

  // 处理收藏夹点击事件
  const handleFavoriteFolderClick = useCallback((folderId?: string) => {
    setInternalActiveView('favorites');
    if (onFavoritesClick) {
      onFavoritesClick(folderId);
    }
  }, [onFavoritesClick]);

  // 处理搜索点击事件 - 修改为直接在页面中显示搜索界面
  const handleSearchClick = useCallback(() => {
    setInternalActiveView('search');
    if (onSearchClick) {
      // 传递空字符串表示普通搜索，不是标签搜索
      onSearchClick('');
    }
  }, [onSearchClick]);

  // 处理最近访问点击事件
  const handleRecentClick = useCallback(() => {
    setInternalActiveView('recent');
    if (onRecentClick) {
      onRecentClick();
    }
  }, [onRecentClick]);

  // 处理最近下载点击事件
  const handleRecentDownloadsClick = useCallback(() => {
    setInternalActiveView('downloads');
    if (onRecentDownloadsClick) {
      onRecentDownloadsClick();
    }
  }, [onRecentDownloadsClick]);

  // 处理新建收藏夹点击事件
  const handleCreateFavoriteFolderClick = useCallback(() => {
    if (onCreateFavoriteFolder) {
      onCreateFavoriteFolder();
    }
  }, [onCreateFavoriteFolder]);

  // 使用useCallback优化展开/折叠状态切换，添加过渡动画
  const toggleMyFilesExpanded = useCallback(() => {
    if (myFilesExpanded) {
      // 如果是折叠操作，先设置过渡状态，再延迟折叠
      setTimeout(() => {
        setMyFilesExpanded(false);
      }, 300);
      setMyFilesVisible(false);
    } else {
      // 如果是展开操作，直接展开
      setMyFilesExpanded(true);
    }
  }, [myFilesExpanded]);

  const toggleQuickAccessExpanded = useCallback(() => {
    if (quickAccessExpanded) {
      setTimeout(() => {
        setQuickAccessExpanded(false);
      }, 300);
      setQuickAccessVisible(false);
    } else {
      setQuickAccessExpanded(true);
    }
  }, [quickAccessExpanded]);

  const toggleFavoritesExpanded = useCallback(() => {
    if (favoritesExpanded) {
      setTimeout(() => {
        setFavoritesExpanded(false);
      }, 300);
      setFavoritesVisible(false);
    } else {
      setFavoritesExpanded(true);
    }
  }, [favoritesExpanded]);
  
  // 按钮点击涟漪效果
  const createRippleEffect = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add(styles.ripple);
    
    const existingRipple = button.querySelector(`.${styles.ripple}`);
    if (existingRipple) {
      existingRipple.remove();
    }
    
    button.appendChild(circle);
    
    setTimeout(() => {
      circle.remove();
    }, 600);
  }, []);

  // 获取主题变量颜色值，用于统一颜色
  const themeColor = 'var(--theme-primary, #3b82f6)';
  
  // 帮助函数，检查某个视图是否为当前活动视图
  const isActiveView = (view: ViewType): boolean => {
    return internalActiveView === view;
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarSection}>
        <div 
          className={`${styles.sidebarHeader} ${styles.rippleContainer}`}
          onClick={(e) => {
            toggleMyFilesExpanded();
            createRippleEffect(e);
          }}
        >
          <Folder className={styles.icon} />
          我的文件
          <ChevronDown 
            className={styles.icon} 
            style={{ 
              marginLeft: 'auto', 
              transform: myFilesExpanded ? 'rotate(180deg)' : 'rotate(0)', 
              transition: 'transform 0.3s ease-in-out' 
            }} 
            size={16} 
          />
        </div>
        {myFilesExpanded && (
          <div className={`${styles.sidebarSubmenu} ${myFilesVisible ? styles.submenuVisible : styles.submenuHidden}`}>
            {fileTypes.map(({ type, label, icon: Icon }) => (
              <div
                key={type || 'all'}
                className={`${styles.sidebarItem} ${isActiveView(type) ? styles.active : ''} ${styles.rippleContainer}`}
                onClick={(e) => {
                  handleTypeClick(type);
                  createRippleEffect(e);
                }}
              >
                <Icon className={styles.icon} />
                {label}
                {isActiveView(type) && (
                  <CheckCircle 
                    className={styles.icon} 
                    style={{ 
                      marginLeft: 'auto', 
                      color: themeColor,
                      fill: themeColor,
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
          className={`${styles.sidebarHeader} ${styles.rippleContainer}`}
          onClick={(e) => {
            toggleQuickAccessExpanded();
            createRippleEffect(e);
          }}
        >
          <Search className={styles.icon} />
          快捷查询
          <ChevronDown 
            className={styles.icon} 
            style={{ 
              marginLeft: 'auto', 
              transform: quickAccessExpanded ? 'rotate(180deg)' : 'rotate(0)', 
              transition: 'transform 0.3s ease-in-out' 
            }} 
            size={16} 
          />
        </div>
        {quickAccessExpanded && (
          <div className={`${styles.sidebarSubmenu} ${quickAccessVisible ? styles.submenuVisible : styles.submenuHidden}`}>
            <div 
              className={`${styles.sidebarItem} ${isActiveView('search') ? styles.active : ''} ${styles.rippleContainer}`}
              onClick={(e) => {
                handleSearchClick();
                createRippleEffect(e);
              }}
            >
              <Search className={styles.icon} />
              搜索文件
              {isActiveView('search') && (
                <CheckCircle 
                  className={styles.icon} 
                  style={{ 
                    marginLeft: 'auto', 
                    color: themeColor,
                    fill: themeColor,
                    stroke: '#fff',
                    opacity: 0.9,
                  }} 
                  size={16} 
                />
              )}
            </div>
            
            {/* 收藏部分 - 点击主项目显示全部收藏，保留下拉功能 */}
            <div className={styles.sidebarSubmenuItem}>
              <div 
                className={`${styles.sidebarItem} ${isActiveView('favorites') ? styles.active : ''} ${styles.rippleContainer}`}
              >
                {/* 收藏图标和文字区域点击直接显示全部收藏 */}
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    flex: 1,
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    handleFavoriteFolderClick();
                    createRippleEffect(e);
                  }}
                >
                  <Star className={styles.icon} style={{ color: isActiveView('favorites') ? themeColor : undefined }} />
                  我的收藏
                </div>
                
                {/* 单独的箭头按钮用于展开/折叠收藏夹列表 */}
                <ChevronDown 
                  className={styles.icon} 
                  style={{ 
                    marginLeft: 'auto', 
                    transform: favoritesExpanded ? 'rotate(180deg)' : 'rotate(0)', 
                    transition: 'transform 0.3s ease-in-out',
                    color: "rgba(0, 0, 0, 0.5)",
                    cursor: 'pointer'
                  }} 
                  size={16} 
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    toggleFavoritesExpanded();
                  }}
                />
                
                {isActiveView('favorites') && (
                  <CheckCircle 
                    className={styles.icon} 
                    style={{ 
                      marginLeft: '4px', 
                      color: themeColor,
                      fill: themeColor,
                      stroke: '#fff',
                      opacity: 0.9,
                    }} 
                    size={16} 
                  />
                )}
              </div>
              
              {/* 收藏夹展开区域 - 不再显示"全部收藏"选项 */}
              {favoritesExpanded && (
                <div className={`${styles.nestedSubmenu} ${favoritesVisible ? styles.submenuVisible : styles.submenuHidden}`}>
                  {/* 收藏夹列表 */}
                  {loadingFolders ? (
                    <div className={styles.sidebarNestedItem}>
                      <span className={styles.loadingText}>加载中...</span>
                    </div>
                  ) : favoriteFolders.length > 0 ? (
                    favoriteFolders.map(folder => (
                      <div 
                        key={folder.id}
                        className={`${styles.sidebarNestedItem} ${styles.rippleContainer}`}
                        onClick={(e) => {
                          handleFavoriteFolderClick(folder.id);
                          createRippleEffect(e);
                        }}
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
                    className={`${styles.sidebarNestedItem} ${styles.createNewItem} ${styles.rippleContainer}`}
                    onClick={(e) => {
                      handleCreateFavoriteFolderClick();
                      createRippleEffect(e);
                    }}
                  >
                    <Plus className={styles.icon} size={14} />
                    <span style={{ fontStyle: 'italic' }}>新建收藏夹</span>
                  </div>
                </div>
              )}
            </div>
            
            <div 
              className={`${styles.sidebarItem} ${isActiveView('recent') ? styles.active : ''} ${styles.rippleContainer}`}
              onClick={(e) => {
                handleRecentClick();
                createRippleEffect(e);
              }}
            >
              <Clock className={styles.icon} />
              最近访问
              {isActiveView('recent') && (
                <CheckCircle 
                  className={styles.icon} 
                  style={{ 
                    marginLeft: 'auto', 
                    color: themeColor,
                    fill: themeColor,
                    stroke: '#fff',
                    opacity: 0.9,
                  }} 
                  size={16} 
                />
              )}
            </div>
            <div 
              className={`${styles.sidebarItem} ${isActiveView('downloads') ? styles.active : ''} ${styles.rippleContainer}`}
              onClick={(e) => {
                handleRecentDownloadsClick();
                createRippleEffect(e);
              }}
            >
              <Download className={styles.icon} />
              最近下载
              {isActiveView('downloads') && (
                <CheckCircle 
                  className={styles.icon} 
                  style={{ 
                    marginLeft: 'auto', 
                    color: themeColor,
                    fill: themeColor,
                    stroke: '#fff',
                    opacity: 0.9,
                  }} 
                  size={16} 
                />
              )}
            </div>
            <div 
              className={`${styles.sidebarItem} ${isActiveView('tag') ? styles.active : ''} ${styles.rippleContainer}`}
              onClick={(e) => {
                handleTagSearchClick();
                createRippleEffect(e);
              }}
            >
              <Tag className={styles.icon} />
              按标签查找
              {isActiveView('tag') && (
                <CheckCircle 
                  className={styles.icon} 
                  style={{ 
                    marginLeft: 'auto', 
                    color: themeColor,
                    fill: themeColor,
                    stroke: '#fff',
                    opacity: 0.9,
                  }} 
                  size={16} 
                />
              )}
            </div>
            <div 
              className={`${styles.sidebarItem} ${isActiveView('shares') ? styles.active : ''} ${styles.rippleContainer}`}
              onClick={(e) => {
                handleMySharesClick();
                createRippleEffect(e);
              }}
            >
              <Share2 className={styles.icon} />
              我的分享
              {isActiveView('shares') && (
                <CheckCircle 
                  className={styles.icon} 
                  style={{ 
                    marginLeft: 'auto', 
                    color: themeColor,
                    fill: themeColor,
                    stroke: '#fff',
                    opacity: 0.9,
                  }} 
                  size={16} 
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 