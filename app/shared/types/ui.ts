// 导航栏属性接口
export interface NavbarProps {
  className?: string;
  showLogo?: boolean;
  transparent?: boolean;
  fixed?: boolean;
}

// 侧边栏属性接口
export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: SidebarItem[];
  activePath?: string;
  user?: any;
}

// 侧边栏项目接口
export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  path: string;
  children?: SidebarItem[];
}

// 布局属性接口
export interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  showSidebar?: boolean;
  showFooter?: boolean;
  className?: string;
}

// 主题设置接口
export interface ThemeConfig {
  colorScheme: 'light' | 'dark' | 'system';
  primaryColor: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  fontFamily: string;
}

// 通知类型枚举
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

// 通知数据接口
export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
}

// 模态框属性接口
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
}

// 表格列定义接口
export interface TableColumn<T = any> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  width?: number | string;
}

// 页面头部属性接口
export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
} 