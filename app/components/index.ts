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
 *   - media/: 媒体组件（音视频等）
 * 
 * - features/: 业务功能组件
 *   - dashboard/: 仪表盘相关组件
 *   - file-management/: 文件管理组件
 *   - home/: 首页相关组件
 *   - user-profile/: 用户资料组件
 * 
 * 为保持向后兼容性，所有组件可以从根路径直接导入
 */

// 从新的目录结构中重新导出组件
// UI组件
export * from './ui';

// 导航组件 - 已迁移到file-management/navigation目录
// export { default as Navbar } from './features/dashboard/navigation/navbar';

// 文件管理组件
export { default as UploadModal } from './features/file-management/upload/upload-modal';
export { default as FileUpload } from './features/file-management/upload/file-upload';
export { default as TopActionBar } from './features/file-management/action-bar/top-action-bar';
export { default as SortDropdown } from './features/file-management/action-bar/sort-dropdown';
export { default as NewFolderForm } from './features/file-management/folder-management/new-folder-form';
export { TopActionBar as Toolbar } from './features/file-management/action-bar/top-action-bar';

// 分析组件
export { default as StorageUsage } from './features/dashboard/analytics/storage-usage';

// 媒体组件
export { default as AudioVisualizer } from './common/media/audio-visualizer';

// 用户资料组件
export { default as ProfileHeader } from './features/user-profile/profile-header';
export { default as ProfileCompleteness } from './features/user-profile/completeness';
export { default as PasswordForm } from './features/user-profile/password-form';
export { default as EditProfileForm } from './features/user-profile/edit-form';
export * from './features/user-profile/avatar';

// 表单组件
export * from './common/form';

// 反馈组件
export { default as Toaster } from './common/feedback/toast';

// 首页组件
export { default as Hero } from './features/home/hero';
export { default as HomeHeader } from './features/home/header';
export { default as Footer } from './features/home/footer';
export { default as Features } from './features/home/features';
export { default as CTA } from './features/home/cta'; 