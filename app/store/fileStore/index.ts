import { create } from 'zustand';
import { SortDirectionEnum } from '@/app/types';
import { FileState } from './types';
import { 
  loadFiles,
  loadRecentFiles,
  searchFiles,
  loadFolderPath
} from './fileLoadingActions';
import {
  deleteFiles,
  moveFiles,
  renameFile,
  createFolder
} from './fileOperationActions';
import {
  selectFile,
  selectFiles,
  clearSelection,
  setSortOrder,
  updateFileSort,
  setFileType,
  navigateToFolder
} from './fileSelectionActions';

/**
 * 文件状态存储
 * 使用Zustand管理全局文件状态
 */
const useFileStore = create<FileState>((set, get) => ({
  // 初始状态
  files: [],
  isLoading: false,
  error: null,
  currentFolderId: null,
  folderPath: [],
  selectedFileType: null,
  selectedFileIds: [],
  sortOrder: {
    field: 'createdAt',
    direction: SortDirectionEnum.DESC
  },
  
  // 文件加载相关操作
  loadFiles: loadFiles(get, set),
  loadRecentFiles: loadRecentFiles(get, set),
  searchFiles: searchFiles(get, set),
  loadFolderPath: loadFolderPath(get, set),
  
  // 文件选择相关操作
  selectFile: selectFile(set),
  selectFiles: selectFiles(set),
  clearSelection: clearSelection(set),
  setSortOrder: setSortOrder(get, set),
  
  // 文件操作相关操作
  deleteFiles: deleteFiles(get, set),
  moveFiles: moveFiles(get, set),
  renameFile: renameFile(get, set),
  createFolder: createFolder(get, set),
  
  // 工具方法
  resetState: () => {
    set({
      files: [],
      isLoading: false,
      error: null,
      currentFolderId: null,
      folderPath: [],
      selectedFileType: null,
      selectedFileIds: [],
      sortOrder: {
        field: 'createdAt',
        direction: SortDirectionEnum.DESC
      }
    });
  },
  
  // 从FileContextType迁移的方法
  updateFileSort: updateFileSort(set),
  setFileType: setFileType(get, set),
  navigateToFolder: navigateToFolder(get, set)
}));

export default useFileStore; 