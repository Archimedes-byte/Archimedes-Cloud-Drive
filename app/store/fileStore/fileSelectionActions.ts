import { FileState } from './types';
import { sortFiles } from '@/app/utils/file';
import { FileTypeEnum, FileSortInterface } from '@/app/types';

/**
 * 选择单个文件
 */
export const selectFile = (
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => (fileId: string, selected: boolean): void => {
  set(state => {
    if (selected) {
      if (state.selectedFileIds.includes(fileId)) {
        return state;
      }
      return {
        selectedFileIds: [...state.selectedFileIds, fileId]
      };
    } else {
      return {
        selectedFileIds: state.selectedFileIds.filter(id => id !== fileId)
      };
    }
  });
};

/**
 * 选择多个文件
 */
export const selectFiles = (
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => (fileIds: string[]): void => {
  set({ selectedFileIds: fileIds });
};

/**
 * 清除选择
 */
export const clearSelection = (
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => (): void => {
  set({ selectedFileIds: [] });
};

/**
 * 设置排序顺序
 */
export const setSortOrder = (
  get: () => FileState,
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => (sortOrder: FileSortInterface): void => {
  set(state => {
    // 使用新的排序重新排序文件
    const sortedFiles = sortFiles(state.files, sortOrder);
    return {
      sortOrder,
      files: sortedFiles
    };
  });
};

/**
 * 更新文件排序
 */
export const updateFileSort = (
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => (sortOrder: FileSortInterface): void => {
  set({ sortOrder });
};

/**
 * 设置文件类型过滤
 */
export const setFileType = (
  get: () => FileState,
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => (type: FileTypeEnum | null): void => {
  set({ selectedFileType: type });
  // 如果类型改变，重新加载文件列表
  get().loadFiles(get().currentFolderId, type, true);
};

/**
 * 导航到文件夹
 */
export const navigateToFolder = (
  get: () => FileState,
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => (folderId: string | null): void => {
  // 切换文件夹时清除之前的类型筛选
  set({ selectedFileType: null });
  get().loadFiles(folderId, null, true);
}; 