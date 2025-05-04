/**
 * Hooks导出索引文件
 * 集中导出所有自定义hooks，方便引用
 */

// 核心hooks
export * from './core/useLoadingState';
export * from './core/useUIState';
export * from './core/useThemeManager';
export * from './core/useThemeUI';
export * from './core/useModalState';

// 用户相关hooks
export * from './user/useProfile';
export * from './user/usePassword';
export * from './user/useValidation';
export * from './user/useUserForm';

// 文件相关hooks
export * from './file/useFiles';
export * from './file/useFileOperations';
export * from './file/useFileUpload';
export * from './file/useFileSearch';
export * from './file/useFilePreview';
export * from './file/useShareView';
export * from './file/useRecentContent';
export * from './file/useViewState';
export * from './file/useFavorites';
export * from './file/useFileSelection';
export * from './file/useFolderCreation';
export * from './file/useFileRename';
export * from './file/useFileMoveOperations';
export * from './file/usePageInitialization';
export * from './file/useShareManagement';

// 导出Zustand状态管理
export { default as useFileStore } from '@/app/store/fileStore';

// 认证相关hooks - 仅导出新的统一Hook
export * from './auth';

// 新增的common文件夹中的钩子
export * from './common';

// 导出文件工具函数
export * from '@/app/lib/file'; 