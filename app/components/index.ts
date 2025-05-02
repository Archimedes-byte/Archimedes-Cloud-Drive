/**
 * 组件库索引文件
 * 
 * 所有组件已按照原子设计模式进行重组：
 * - ui/: 基础UI组件
 *   - atoms/: 原子级组件（按钮、输入框等）
 *   - molecules/: 分子级组件（复合UI元素）
 *   - organisms/: 有机体组件（完整UI区块）
 * 
 * - common/: 通用功能组件
 *   - feedback/: 反馈类组件（提示、通知等）
 *   - form/: 表单相关组件
 * 
 * - features/: 业务功能组件
 *   - dashboard/: 仪表盘相关组件
 *   - file-management/: 文件管理组件
 *   - home/: 首页相关组件
 *   - user-profile/: 用户资料组件
 *   - auth/: 认证相关组件
 * 
 * 统一组件库：
 * - 所有基础UI组件统一使用Ant Design
 * - 所有自定义组件封装基于Ant Design
 * - UI组件请从 ./ui/ant 导入，不要直接从antd导入
 */

// 导出Ant Design UI组件 (这是基础组件的统一导出点)
// 不要从这里导出全部ui/ant组件，避免与features组件产生命名冲突
import * as AntComponents from './ui/ant';
// 选择性重新导出，排除与features中冲突的组件
export { 
  Button, Space, Flex, Divider, Form, Input, Checkbox, 
  Radio, Select, Switch, Slider, DatePicker, TimePicker,
  InputNumber, Table, Tabs, Card, List, Avatar, Badge, Tag,
  Modal, Drawer, Tooltip, Popover, Popconfirm, message,
  notification, Progress, Spin, Alert, Menu, Pagination,
  Dropdown, Steps, Affix, ConfigProvider, theme, Row, Col,
  Typography, Title, Text, Paragraph, Link,
  // 所有图标
  SearchOutlined, UserOutlined, FileOutlined, FolderOutlined,
  HomeOutlined, SettingOutlined, UploadOutlined, DownloadOutlined,
  DeleteOutlined, EditOutlined, EyeOutlined, MenuOutlined,
  CloseOutlined, CheckOutlined, InfoCircleOutlined, WarningOutlined,
  ExclamationCircleOutlined, QuestionCircleOutlined, PlusOutlined,
  MinusOutlined, ArrowUpOutlined, ArrowDownOutlined, ArrowLeftOutlined,
  ArrowRightOutlined, CloudUploadOutlined, CloudDownloadOutlined,
  ClockCircleOutlined, LockOutlined, UnlockOutlined, CalendarOutlined,
  StarOutlined,
} from './ui/ant';

// 为避免命名冲突，重命名导出
export { Breadcrumb as AntBreadcrumb } from './ui/ant';

// 导出通用组件 
export * from './common/form';

// 导出业务功能组件
export * from './features';

// 业务组件导出 (保持向后兼容)
export { default as UploadModal } from './features/file-management/upload/upload-modal';
export { default as FileUpload } from './features/file-management/upload/file-upload';
export { default as SortDropdown } from './features/file-management/action-bar/sort-dropdown';
export { default as MenuBar } from './features/file-management/action-bar/menu-bar';
export { default as UploadDropdown } from './features/file-management/action-bar/upload-dropdown';
// 注意：移除了不存在的NewFolderForm导出

// 注：分析组件StorageUsage已被移除，不再导出

// 用户资料组件
export { default as ProfileHeader } from './features/user-profile/profile-header';
export { default as ProfileCompleteness } from './features/user-profile/completeness';
export { default as PasswordForm } from './features/user-profile/password-form';
export { default as EditProfileForm } from './features/user-profile/edit-form';
export * from './features/user-profile/avatar';

// 认证组件
export * from './features/auth';

// 反馈组件
export { ToastProvider, useToast } from './features/dashboard/toaster/Toaster';

// 首页组件
export { default as Hero } from './features/home/hero';
export { default as HomeHeader } from './features/home/header';
export { default as Footer } from './features/home/footer';
export { default as Features } from './features/home/features';
export { default as CTA } from './features/home/cta'; 