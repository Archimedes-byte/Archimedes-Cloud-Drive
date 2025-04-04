import React, { createContext, useContext, ReactNode } from 'react';
import { FileContextType, FileState, ExtendedFile, SortOrder, FileType } from '../types/index';
import { useFiles } from '../hooks/useFiles';
import { useFileOperations } from '../hooks/useFileOperations';

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

  // 使用文件操作钩子
  const { 
    loading: operationsLoading
  } = useFileOperations(() => loadFiles(currentFolderId));

  // 提供给上下文的值
  const contextValue: FileContextType = {
    // 状态
    files,
    selectedFiles,
    currentFolderId,
    folderPath,
    isLoading: isLoading || operationsLoading,
    error,
    sortOrder,
    selectedFileType,

    // 方法
    loadFiles,
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