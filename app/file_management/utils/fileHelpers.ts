import { File, FileType, FILE_TYPE_MAP } from '../types/index';

// 获取文件图标
export const getFileIcon = (type: string | undefined, extension: string | undefined, isFolder: boolean): string => {
  if (isFolder) {
    return 'folder';
  }

  if (!type) {
    return 'file';
  }

  for (const [fileType, fileTypeInfo] of Object.entries(FILE_TYPE_MAP)) {
    const { mimeTypes, extensions } = fileTypeInfo as { mimeTypes: string[]; extensions: string[] };
    if (mimeTypes.some((mimeType: string) => type.startsWith(mimeType)) || 
        extensions.includes(extension || '')) {
      switch (fileType) {
        case 'image': return 'image';
        case 'document': return 'file-text';
        case 'video': return 'video';
        case 'audio': return 'music';
        case 'archive': return 'archive';
        case 'code': return 'code';
        default: return 'file';
      }
    }
  }
  return 'file';
};

// 过滤文件
export function filterFiles(files: File[], type: FileType | null): File[] {
  if (!type || type === 'other') return files;
  
  const fileType = FILE_TYPE_MAP[type];
  if (!fileType) return files;
  
  return files.filter(file => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return fileType.mimeTypes.some((mimeType: string) => file.type.startsWith(mimeType)) ||
           fileType.extensions.includes(extension || '');
  });
}

// 添加获取文件名和后缀的辅助函数
export const getFileNameAndExtension = (filename: string) => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { name: filename, extension: '' };
  }
  return {
    name: filename.substring(0, lastDotIndex),
    extension: filename.substring(lastDotIndex)
  };
};

// 处理文件类型显示
export const getFileType = (type: string | null) => {
  if (!type) return '未知';
  if (type.startsWith('image/')) return '图片';
  if (type.startsWith('video/')) return '视频';
  if (type.startsWith('audio/')) return '音频';
  if (type.startsWith('application/pdf')) return 'PDF';
  if (type.startsWith('application/msword') || type.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml')) return 'Word';
  if (type.startsWith('application/vnd.ms-excel') || type.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')) return 'Excel';
  if (type.startsWith('application/vnd.ms-powerpoint') || type.startsWith('application/vnd.openxmlformats-officedocument.presentationml')) return 'PowerPoint';
  return '其他';
};

// 格式化文件大小
export const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

// 格式化日期
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

// 获取文件所在目录路径
export const getFilePath = (path: string | undefined) => {
  if (!path) return '/';
  const parts = path.split('/');
  return parts.slice(0, -1).join('/') || '/';
}; 