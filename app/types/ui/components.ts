/**
 * UI组件类型定义
 * 
 * 本文件包含所有与UI组件相关的类型定义
 */

// Navbar组件属性
export interface NavbarProps {
  showAuth?: boolean;
  showSearch?: boolean;
  showProfile?: boolean;
  fixed?: boolean;
  transparent?: boolean;
  onSearchClick?: () => void;
}

// 音频可视化组件属性
export interface AudioVisualizerProps {
  audioUrl: string;
  width?: number;
  height?: number;
  barWidth?: number;
  barSpacing?: number;
  barColor?: string;
  backgroundColor?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  fftSize?: number; // 512, 1024, 2048, 4096, 8192, 16384, 32768
}

// 音频频谱配置，添加缺少的属性
export interface AudioSpectrumConfig {
  minDecibels: number;
  maxDecibels: number;
  smoothingTimeConstant: number;
  fftSize: number;
  barCount?: number;
  colors?: {
    background?: string;
    bar?: string;
    barBackground?: string;
    text?: string;
    button?: string;
  };
}

// 模态框基本属性
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showFooter?: boolean;
  showHeader?: boolean;
}

// 抽屉基本属性
export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// 按钮属性
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

// 卡片属性
export interface CardProps {
  title?: string;
  bordered?: boolean;
  hoverable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  cover?: React.ReactNode;
  actions?: React.ReactNode[];
} 