import { FileType } from '@/app/types/file';

// 文件类型映射
export const TYPE_MAP: Record<FileType, string> = {
  'image': 'image',
  'video': 'video',
  'audio': 'audio',
  'document': 'application',
  'archive': 'application',
  'folder': 'folder',
  'other': 'other'
} as const;

// 文件类型判断配置
export const FILE_TYPE_MAP: Record<Partial<FileType>, { mimeTypes: string[]; extensions: string[] }> = {
  image: {
    mimeTypes: ['image'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  },
  document: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml',
      'text'
    ],
    extensions: ['doc', 'docx', 'txt', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'csv']
  },
  video: {
    mimeTypes: ['video'],
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv']
  },
  audio: {
    mimeTypes: ['audio'],
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a']
  },
  archive: {
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-compressed', 'application/x-tar', 'application/gzip'],
    extensions: ['zip', 'rar', '7z', 'tar', 'gz']
  },
  folder: {
    mimeTypes: ['folder'],
    extensions: []
  },
  other: {
    mimeTypes: [],
    extensions: []
  }
};

// 获取文件图标
export const getFileIcon = (type: string | undefined, extension: string | undefined, isFolder: boolean): string => {
  if (isFolder) {
    return 'folder';
  }

  if (!type && !extension) {
    return 'file';
  }

  for (const [fileType, { mimeTypes, extensions }] of Object.entries(FILE_TYPE_MAP)) {
    // 检查MIME类型
    const hasMimeType = type && mimeTypes.some(mimeType => 
      type.startsWith(mimeType) || type === mimeType
    );
    
    // 检查扩展名
    const hasExtension = extension && extensions.includes(extension.toLowerCase());
    
    if (hasMimeType || hasExtension) {
      switch (fileType) {
        case 'image': return 'image';
        case 'document': return 'file-text';
        case 'video': return 'video';
        case 'audio': return 'music';
        case 'archive': return 'archive';
        case 'other': return 'file';
        default: return 'file';
      }
    }
  }
  return 'file';
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// 获取文件名和后缀
export const getFileNameAndExtension = (filename: string) => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { name: filename, extension: '' };
  }
  return {
    name: filename.substring(0, lastDotIndex),
    extension: filename.substring(lastDotIndex + 1)
  };
}; 