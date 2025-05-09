import { fileApi } from '@/app/lib/api/file-api';
import { safeAsync } from '@/app/utils/error';
import { FileState } from './types';

/**
 * 删除文件
 */
export const deleteFiles = (
  get: () => FileState,
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => async (fileIds: string[], onSuccess?: () => void): Promise<boolean> => {
  if (!fileIds.length) {
    return false;
  }
  
  const result = await safeAsync(async () => {
    await fileApi.deleteFiles(fileIds);
    
    // 删除后，从当前文件列表中移除这些文件
    set(state => ({
      files: state.files.filter(file => !fileIds.includes(file.id)),
      selectedFileIds: state.selectedFileIds.filter(id => !fileIds.includes(id))
    }));
    
    // 执行成功回调
    if (onSuccess) {
      onSuccess();
    }
    
    return true;
  }, {
    errorMessage: '删除文件失败',
    fallbackValue: false as boolean
  });
  
  return result === null ? false : result;
};

/**
 * 移动文件
 */
export const moveFiles = (
  get: () => FileState,
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => async (fileIds: string[], targetFolderId: string): Promise<boolean> => {
  if (!fileIds.length) {
    return false;
  }
  
  const result = await safeAsync(async () => {
    await fileApi.moveFiles(fileIds, targetFolderId);
    
    // 移动后，从当前文件列表中移除这些文件
    set(state => ({
      files: state.files.filter(file => !fileIds.includes(file.id)),
      selectedFileIds: state.selectedFileIds.filter(id => !fileIds.includes(id))
    }));
    
    return true;
  }, {
    errorMessage: '移动文件失败',
    fallbackValue: false as boolean
  });
  
  return result === null ? false : result;
};

/**
 * 重命名文件
 */
export const renameFile = (
  get: () => FileState,
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => async (fileId: string, newName: string) => {
  return await safeAsync(async () => {
    const updatedFile = await fileApi.updateFile(fileId, newName);
    
    // 更新状态中的文件名
    set(state => ({
      files: state.files.map(file => 
        file.id === fileId ? { ...file, name: newName } : file
      )
    }));
    
    return updatedFile;
  }, {
    errorMessage: '重命名文件失败',
    fallbackValue: null
  });
};

/**
 * 创建文件夹
 */
export const createFolder = (
  get: () => FileState,
  set: (state: Partial<FileState> | ((state: FileState) => Partial<FileState>)) => void
) => async (name: string, parentId: string | null, tags?: string[]) => {
  return await safeAsync(async () => {
    const newFolder = await fileApi.createFolder(name, parentId, tags);
    
    // 重新加载当前文件夹内容
    if (get().currentFolderId === parentId) {
      get().loadFiles(parentId, null, true);
    }
    
    return newFolder.id;
  }, {
    errorMessage: '创建文件夹失败',
    fallbackValue: null
  });
}; 