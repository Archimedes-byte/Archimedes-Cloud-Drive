/**
 * 文件管理功能组件
 * 整合所有与文件管理相关的UI组件
 */

// 核心组件导出
export * from './action-bar';
export * from './file-list';
export * from './file-preview';
export * from './folder-management';
export * from './navigation';
export * from './search-view';
export * from './shared';
export * from './upload';
export * from './rename-modal';

// 选择性导出模块功能组件
export { PageLayout } from './layout/page-layout';

// 整合共享/分享相关功能
export * from './sharing'; // 包含ShareModal和LinkInputModal
export * from './shares';  // 包含SharesContent
export * from './my-shares'; // 包含MySharesContent

// 其他功能组件
export { RecentFilesContent } from './recent-files';
export { RecentDownloadsContent } from './recent-downloads';
export { FavoritesContent, FavoriteModal, CreateFavoriteModal } from './favorites';
export { default as UploadModal } from './upload/upload-modal';
export { CreateFolderModal } from './folder-management/create-folder-modal';
export { default as FolderSelectModal } from './folder-select/FolderSelectModal';
export { DownloadListModal } from './download/DownloadListModal'; 