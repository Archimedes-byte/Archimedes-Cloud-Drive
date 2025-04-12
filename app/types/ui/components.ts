/**
 * UI组件类型定义
 * 
 * 本文件包含所有与UI组件相关的类型定义
 */

import { FileWithUIState, FileTypeEnum, SortDirectionEnum } from '../domains/fileTypes';
import { ReactNode, CSSProperties } from 'react';

/**
 * 基础组件Props接口
 * 所有组件Props的基础
 */
export interface BaseComponentProps {
  /** CSS类名 */
  className?: string;
  /** 内联样式 */
  style?: CSSProperties;
  /** 子元素 */
  children?: ReactNode;
}

/**
 * 模态框基础Props接口
 * 所有模态框组件的基础
 */
export interface ModalBaseProps extends BaseComponentProps {
  /** 模态框是否打开 */
  isOpen: boolean;
  /** 关闭模态框的回调函数 */
  onClose: () => void;
  /** 模态框标题 */
  title?: string;
  /** 模态框尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 是否显示页脚 */
  showFooter?: boolean;
  /** 是否显示头部 */
  showHeader?: boolean;
}

/**
 * 导航栏组件Props接口
 */
export interface NavbarProps extends BaseComponentProps {
  /** 是否显示认证按钮 */
  showAuth?: boolean;
  /** 是否显示搜索 */
  showSearch?: boolean;
  /** 是否显示用户资料 */
  showProfile?: boolean;
  /** 是否固定位置 */
  fixed?: boolean;
  /** 是否透明背景 */
  transparent?: boolean;
  /** 搜索点击回调 */
  onSearchClick?: () => void;
}

/**
 * 音频可视化组件Props接口
 */
export interface AudioVisualizerProps extends BaseComponentProps {
  /** 音频URL */
  audioUrl: string;
  /** 组件宽度 */
  width?: number;
  /** 组件高度 */
  height?: number;
  /** 条形宽度 */
  barWidth?: number;
  /** 条形间距 */
  barSpacing?: number;
  /** 条形颜色 */
  barColor?: string;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 是否显示控制器 */
  showControls?: boolean;
  /** 是否自动播放 */
  autoPlay?: boolean;
  /** 是否循环播放 */
  loop?: boolean;
  /** FFT大小 */
  fftSize?: 512 | 1024 | 2048 | 4096 | 8192 | 16384 | 32768;
}

/**
 * 音频频谱配置接口
 */
export interface AudioSpectrumConfig {
  /** 最小分贝值 */
  minDecibels: number;
  /** 最大分贝值 */
  maxDecibels: number;
  /** 平滑时间常数 */
  smoothingTimeConstant: number;
  /** FFT大小 */
  fftSize: number;
  /** 条形数量 */
  barCount?: number;
  /** 颜色配置 */
  colors?: {
    /** 背景颜色 */
    background?: string;
    /** 条形颜色 */
    bar?: string;
    /** 条形背景颜色 */
    barBackground?: string;
    /** 文本颜色 */
    text?: string;
    /** 按钮颜色 */
    button?: string;
  };
}

/**
 * 重命名模态框Props接口
 */
export interface RenameModalProps extends ModalBaseProps {
  /** 重命名确认回调函数 */
  onConfirm: (name: string, extension?: string) => void;
  /** 初始文件名 */
  fileName?: string;
  /** 当前名称 */
  currentName?: string;
  /** 文件扩展名 */
  extension?: string;
  /** 可选的取消回调函数 */
  onCancel?: () => void;
}

/**
 * 文件重命名模态框Props接口
 */
export interface FileRenameModalProps extends ModalBaseProps {
  /** 重命名回调函数 */
  onRename: (newName: string, tags?: string[]) => void;
  /** 初始名称 */
  initialName: string;
  /** 初始标签 */
  initialTags?: string[];
  /** 文件类型 */
  fileType: 'file' | 'folder';
}

/**
 * 上传模态框Props接口
 */
export interface UploadModalProps extends ModalBaseProps {
  /** 上传成功回调 */
  onUploadSuccess: () => void;
  /** 是否为文件夹上传 */
  isFolderUpload: boolean;
  /** 是否包含标签 */
  withTags: boolean;
  /** 当前文件夹ID */
  currentFolderId?: string | null;
}

/**
 * 抽屉组件Props接口
 */
export interface DrawerProps extends BaseComponentProps {
  /** 抽屉是否打开 */
  isOpen: boolean;
  /** 关闭抽屉的回调函数 */
  onClose: () => void;
  /** 抽屉标题 */
  title?: string;
  /** 抽屉位置 */
  placement?: 'left' | 'right' | 'top' | 'bottom';
  /** 抽屉尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * 按钮组件Props接口
 */
export interface ButtonProps extends BaseComponentProps {
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否加载中 */
  isLoading?: boolean;
  /** 点击事件回调 */
  onClick?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 按钮图标 */
  icon?: ReactNode;
}

/**
 * 卡片组件Props接口
 */
export interface CardProps extends BaseComponentProps {
  /** 卡片标题 */
  title?: string;
  /** 是否有边框 */
  bordered?: boolean;
  /** 是否可悬停 */
  hoverable?: boolean;
  /** 卡片封面 */
  cover?: ReactNode;
  /** 卡片操作区 */
  actions?: ReactNode[];
}

/**
 * 文件列表Props接口
 */
export interface FileListProps extends BaseComponentProps {
  /** 文件列表 */
  files: FileWithUIState[];
  /** 文件点击事件处理函数 */
  onFileClick?: (file: FileWithUIState) => void;
  /** 文件删除处理函数 */
  onDelete?: (fileIds: string[]) => Promise<void> | void;
  /** 文件移动处理函数 */
  onMove?: (fileIds: string[], targetFolderId: string) => Promise<void> | void;
  /** 是否显示操作菜单 */
  showActions?: boolean;
  /** 是否允许选择 */
  selectable?: boolean;
  /** 是否显示加载状态 */
  isLoading?: boolean;
  /** 文件排序方式 */
  sortDirection?: SortDirectionEnum;
  /** 文件过滤类型 */
  fileTypeFilter?: FileTypeEnum | null;
}

/**
 * 搜索视图Props接口
 */
export interface SearchViewProps extends BaseComponentProps {
  /** 搜索结果 */
  results: FileWithUIState[];
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 搜索查询 */
  searchQuery: string;
  /** 结果点击处理函数 */
  onResultClick?: (file: FileWithUIState) => void;
  /** 文件选择处理函数 */
  onFileSelect?: (fileId: string, selected: boolean) => void;
  /** 下载处理函数 */
  onDownload?: (fileId: string) => void;
  /** 重命名处理函数 */
  onRename?: (file: FileWithUIState) => void;
  /** 清除搜索处理函数 */
  onClearSearch?: () => void;
} 