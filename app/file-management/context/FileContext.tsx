import React, { createContext, useContext, ReactNode } from 'react';
import { 
  FileContextType, 
  ExtendedFile, 
  SortOrder,
  convertInterfaceToSortOrder,
  convertSortOrderToInterface
} from '@/app/types';
import { useFiles, useFileOperations } from '@/app/hooks';

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
    toggleSelectFile,
    toggleSelectAll,
    filterByFileType,
    openFolder,
    changeSort
  } = useFiles();

  // 使用文件操作钩子
  const { 
    isLoading: operationsLoading,
    downloadFiles,
    moveFiles,
    deleteFiles
  } = useFileOperations(selectedFiles); 
  
  // 提供给上下文的值
  const contextValue: FileContextType = {
    // 状态
    files: files as any as ExtendedFile[],
    selectedFiles,
    currentFolderId,
    folderPath,
    isLoading: isLoading || operationsLoading,
    error,
    sortOrder: convertInterfaceToSortOrder(sortOrder),
    selectedFileType,

    // 方法
    loadFiles: loadFiles as any,
    selectFiles: (fileIds: string[]) => {
      // 清除当前选择
      toggleSelectAll(false);
      // 然后选择新的文件集合
      fileIds.forEach(id => toggleSelectFile(id));
    },
    clearSelection: () => toggleSelectAll(false),
    updateFileSort: ((order: SortOrder) => {
      // 将 SortOrder 转换回 FileSortInterface
      const sortInterface = convertSortOrderToInterface(order);
      changeSort(sortInterface.field, sortInterface.direction);
    }) as (order: SortOrder) => void,
    setFileType: filterByFileType,
    navigateToFolder: openFolder
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