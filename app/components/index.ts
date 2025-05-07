/**
 * 组件库索引文件
 * 
 * 组件架构：
 * - ui/ant/: 基础UI组件 (Ant Design)
 * - common/: 通用功能组件
 * - features/: 业务功能组件
 * 
 * 导入规范：
 * 1. 基础UI组件: import { Button, Table } from '@/app/components/ui/ant'
 * 2. 业务组件: import { UploadModal, FileList } from '@/app/components'
 */

// 导出业务功能组件
export * from './features';

// 导出通用组件 
export * from './common/form';

// 文件管理组件 
export { default as UploadModal } from './features/file-management/upload/upload-modal';
export { default as FileUpload } from './features/file-management/upload/file-upload';
export { default as SortDropdown } from './features/file-management/action-bar/sort-dropdown';
export { default as MenuBar } from './features/file-management/action-bar/menu-bar';
export { default as UploadDropdown } from './features/file-management/action-bar/upload-dropdown';

// 用户资料组件
export { default as ProfileHeader } from './features/user-profile/profile-header';
export { default as ProfileCompleteness } from './features/user-profile/completeness';
export { default as PasswordForm } from './features/user-profile/password-form';
export { default as ProfileForm } from './features/user-profile/ProfileForm';
export * from './features/user-profile/avatar';

// 认证组件
export * from './features/auth';

// 反馈组件
export { ToastContainer } from './features/dashboard/toaster/Toaster';
export { ToastProvider, useToast } from '@/app/contexts';

// 首页组件
export { default as Hero } from './features/home/hero';
export { default as HomeHeader } from './features/home/header';
export { default as Footer } from './features/home/footer';
export { default as Features } from './features/home/features';
export { default as CTA } from './features/home/cta'; 