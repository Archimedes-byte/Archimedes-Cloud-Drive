import { FileType } from '@/app/types';

// 文件类型映射
export const TYPE_MAP: Record<string, string> = {
  'image': 'image/',
  'video': 'video/',
  'audio': 'audio/',
  'document': 'application/',
  'other': 'other'
} as const;

// 文件类型判断
export const FILE_TYPE_MAP: Record<string, { mimeTypes: string[]; extensions: string[] }> = {
  image: {
    mimeTypes: ['image/'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  },
  document: {
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/'],
    extensions: ['doc', 'docx', 'txt', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx']
  },
  video: {
    mimeTypes: ['video/'],
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv']
  },
  audio: {
    mimeTypes: ['audio/'],
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a']
  },
  other: {
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-compressed', 'application/x-tar', 'application/gzip'],
    extensions: ['zip', 'rar', '7z', 'tar', 'gz']
  }
};

// 获取文件图标
export const getFileIcon = (type: string | undefined, extension: string | undefined, isFolder: boolean): string => {
  if (isFolder) {
    return 'folder';
  }

  if (!type) {
    return 'file';
  }

  for (const [fileType, { mimeTypes, extensions }] of Object.entries(FILE_TYPE_MAP)) {
    if (mimeTypes.some(mimeType => type.startsWith(mimeType)) || 
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

// 格式化文件大小
export const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

// 格式化日期
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取文件类型
export const getFileType = (type: string | null): string => {
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

// 获取文件名和扩展名
export const getFileNameAndExtension = (filename: string): { name: string; extension: string } => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { name: filename, extension: '' };
  }
  return {
    name: filename.substring(0, lastDotIndex),
    extension: filename.substring(lastDotIndex)
  };
};

// 获取文件路径
export const getFilePath = (path: string | undefined): string => {
  if (!path) return '/';
  const parts = path.split('/');
  return parts.slice(0, -1).join('/') || '/';
};

// 过滤文件
export const filterFiles = (files: any[], type: string | null): any[] => {
  if (!type || type === 'other') return files;
  
  const fileType = FILE_TYPE_MAP[type];
  if (!fileType) return files;
  
  return files.filter(file => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return fileType.mimeTypes.some(mimeType => file.type?.startsWith(mimeType)) ||
           fileType.extensions.includes(extension || '');
  });
}; 