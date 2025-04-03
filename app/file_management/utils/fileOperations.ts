/**
 * 文件操作相关工具函数
 */
import { ExtendedFile, FileType } from '../types/index';
import { FILE_TYPE_MAP } from './typeHelpers';

// 添加获取文件名和后缀的辅助函数
export const getFileNameAndExtension = (filename: string) => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { name: filename, extension: '' };
  }
  return {
    name: filename.substring(0, lastDotIndex),
    extension: filename.substring(lastDotIndex + 1).toLowerCase()
  };
};

// 获取文件图标
export const getFileIcon = (type: string | undefined, extension: string | undefined, isFolder: boolean): string => {
  if (isFolder) {
    return 'folder';
  }

  if (!type) {
    return 'file';
  }

  for (const [fileType, fileTypeInfo] of Object.entries(FILE_TYPE_MAP)) {
    const { mimeTypes, extensions } = fileTypeInfo;
    if (mimeTypes.some((mimeType: string) => type.startsWith(mimeType)) || 
        extensions.includes(extension || '')) {
      switch (fileType) {
        case 'image': return 'image';
        case 'document': return 'file-text';
        case 'video': return 'video';
        case 'audio': return 'music';
        case 'archive': return 'archive';
        default: return 'file';
      }
    }
  }
  return 'file';
};

// 过滤文件
export function filterFiles(files: ExtendedFile[], type: FileType | null): ExtendedFile[] {
  if (!type || type === 'other') return files;
  
  const fileType = FILE_TYPE_MAP[type];
  if (!fileType) return files;
  
  return files.filter(file => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return fileType.mimeTypes.some((mimeType: string) => file.type?.startsWith(mimeType)) ||
           fileType.extensions.includes(extension || '');
  });
}

// 获取文件所在目录路径
export const getFilePath = (path: string | undefined) => {
  if (!path) return '/';
  const parts = path.split('/');
  return parts.slice(0, -1).join('/') || '/';
};

// 排序文件
export function sortFiles(files: ExtendedFile[], field: string, direction: 'asc' | 'desc'): ExtendedFile[] {
  return [...files].sort((a, b) => {
    let comparison = 0;
    
    // 文件夹始终排在前面
    if (a.isFolder !== b.isFolder) {
      return a.isFolder ? -1 : 1;
    }
    
    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = (a.size || 0) - (b.size || 0);
        break;
      case 'type':
        comparison = (a.type || '').localeCompare(b.type || '');
        break;
      case 'uploadTime':
        // 安全处理日期
        const dateA = a.uploadTime ? new Date(a.uploadTime).getTime() : 0;
        const dateB = b.uploadTime ? new Date(b.uploadTime).getTime() : 0;
        comparison = dateA - dateB;
        break;
      default:
        comparison = 0;
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
} 