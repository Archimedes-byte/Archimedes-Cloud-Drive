/**
 * 文件管理系统中使用的共享类型定义
 */

// 文件类型
export type FileType = 'image' | 'document' | 'video' | 'audio' | 'other' | null;

// 统一视图类型，包含文件类型和功能视图
export type ViewType = FileType | 'search' | 'favorites' | 'recent' | 'downloads' | 'tag' | 'shares';

// 收藏夹信息接口
export interface FavoriteFolderInfo {
  id: string;
  name: string;
  description: string | null;
  fileCount?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// 侧边栏组件Props接口
export interface AntSidebarProps {
  selectedFileType: FileType;
  onTypeClick: (type: FileType) => void;
  onSearchClick?: (query?: string, searchType?: string) => void;
  onSharesClick?: () => void;
  onFavoritesClick?: (folderId?: string) => void;
  onCreateFavoriteFolder?: () => void;
  onRecentClick?: () => void;
  onRecentDownloadsClick?: () => void;
  refreshTrigger?: number;
  activeView?: ViewType;
  favoriteFolders?: FavoriteFolderInfo[];
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
} 