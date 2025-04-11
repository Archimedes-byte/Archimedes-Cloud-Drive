import React, { createContext, useContext, ReactNode } from 'react';
import { FileContextType, FileState, ExtendedFile, SortOrder, FileType } from '@/app/types';
import { useFiles } from '../hooks/useFiles';
import { useFileOperations, CustomFileOperationsHook } from '../hooks/useFileOperations';

// 创建文件上下文
const FileContext = createContext<FileContextType | undefined>(undefined);

/**
 * 文件管理系统上下文提供者
 */
export const FileProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // 使用文件列表钩子
  const {
    files,
    isLoading,
    error,
    currentFolderId,
    folderPath,
    selectedFiles,
    selectedFileType,
    sortOrder,
    loadFiles,
    selectFiles,
    clearSelection,
    setFileType,
    navigateToFolder,
    updateFileSort
  } = useFiles();

  // 使用文件操作钩子，使用类型断言调整类型
  const { 
    loading: operationsLoading
  } = useFileOperations({ 
    loadFiles: loadFiles as any, 
    currentFolderId, 
    selectedFileType: selectedFileType as string | null 
  });

  // 提供给上下文的值，使用类型断言处理 files 类型
  const contextValue: FileContextType = {
    // 状态
    files: files as any as ExtendedFile[],
    selectedFiles,
    currentFolderId,
    folderPath,
    isLoading: isLoading || operationsLoading,
    error,
    sortOrder,
    selectedFileType,

    // 方法
    loadFiles: ((folderId?: string | null, fileType?: FileType | null, forceRefresh?: boolean) => 
      loadFiles(folderId || null, fileType || null, forceRefresh || false)) as any,
    selectFiles,
    clearSelection,
    updateFileSort,
    setFileType,
    navigateToFolder
  };

  return (
    <FileContext.Provider value={contextValue}>
      {children}
    </FileContext.Provider>
  );
};

/**
 * 使用文件上下文的自定义钩子
 */
export const useFileContext = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFileContext必须在FileProvider内部使用');
  }
  return context;
}; 