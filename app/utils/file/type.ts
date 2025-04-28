/**
 * 文件类型工具函数
 * 处理文件类型判断、图标获取等
 */

import { FileTypeEnum } from '@/app/types';

/**
 * 文件分类常量
 */
export const FILE_CATEGORIES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  ARCHIVE: 'archive',
  CODE: 'code',
  FOLDER: 'folder',
  OTHER: 'other',
};

/**
 * 文件类型映射表
 */
export const FILE_TYPE_MAPS = {
  // 图片文件类型
  IMAGE: {
    mimeTypes: ['image/'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
  },
  // 视频文件类型
  VIDEO: {
    mimeTypes: ['video/'],
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
  },
  // 音频文件类型
  AUDIO: {
    mimeTypes: ['audio/'],
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
  },
  // 文档文件类型
  DOCUMENT: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml',
      'text/',
      'application/rtf',
    ],
    extensions: [
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 
      'txt', 'rtf', 'odt', 'ods', 'odp', 'csv', 'md',
    ],
  },
  // 压缩文件类型
  ARCHIVE: {
    mimeTypes: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
    ],
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
  },
  // 代码文件类型
  CODE: {
    mimeTypes: [
      'text/javascript',
      'application/json',
      'text/html',
      'text/css',
      'text/xml',
    ],
    extensions: [
      'js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'scss', 'less',
      'xml', 'c', 'cpp', 'h', 'py', 'java', 'rb', 'php', 'go', 'rust',
      'sql', 'sh', 'bat', 'ps1', 'yaml', 'toml',
    ],
  },
};

// 扩展名到用户友好文件类型描述的映射
const EXTENSION_TO_TYPE: Record<string, string> = {
  // 图片
  jpg: '图片',
  jpeg: '图片',
  png: '图片',
  gif: '图片',
  bmp: '图片',
  webp: '图片',
  svg: '图片',
  
  // 文档
  pdf: 'PDF文档',
  doc: 'Word文档',
  docx: 'Word文档',
  xls: 'Excel表格',
  xlsx: 'Excel表格',
  ppt: 'PPT演示文稿',
  pptx: 'PPT演示文稿',
  txt: '文本文件',
  rtf: '富文本文档',
  csv: '表格数据',
  
  // 媒体
  mp3: '音频',
  wav: '音频',
  ogg: '音频',
  flac: '音频',
  m4a: '音频',
  mp4: '视频',
  avi: '视频',
  mov: '视频',
  wmv: '视频',
  flv: '视频',
  mkv: '视频',
  
  // 压缩
  zip: '压缩文件',
  rar: '压缩文件',
  '7z': '压缩文件',
  tar: '压缩文件',
  gz: '压缩文件',
  
  // 代码
  html: 'HTML文件',
  css: 'CSS样式表',
  js: 'JavaScript代码',
  ts: 'TypeScript代码',
  json: 'JSON数据',
  xml: 'XML文件',
  md: 'Markdown文档',
  java: 'Java代码',
  py: 'Python代码',
  c: 'C语言代码',
  cpp: 'C++代码',
  cs: 'C#代码'
};

/**
 * 获取文件图标
 * @param type 文件MIME类型
 * @param extension 文件扩展名
 * @param isFolder 是否是文件夹
 * @returns 对应的图标名称
 */
export const getFileIcon = (type: string | undefined, extension: string | undefined, isFolder: boolean): string => {
  if (isFolder) {
    return 'folder';
  }

  if (!type && !extension) {
    return 'file';
  }

  for (const [fileType, fileTypeInfo] of Object.entries(FILE_TYPE_MAPS)) {
    const { mimeTypes, extensions } = fileTypeInfo as { mimeTypes: string[]; extensions: string[] };
    
    // 检查MIME类型
    const hasMimeType = type && mimeTypes.some((mimeType: string) => 
      type.startsWith(mimeType) || type === mimeType
    );
    
    // 检查扩展名
    const hasExtension = extension && extensions.includes(extension.toLowerCase());
    
    if (hasMimeType || hasExtension) {
      switch (fileType) {
        case 'IMAGE': return 'image';
        case 'DOCUMENT': return 'file-text';
        case 'VIDEO': return 'video';
        case 'AUDIO': return 'music';
        case 'ARCHIVE': return 'archive';
        case 'CODE': return 'code';
        case 'FOLDER': return 'folder';
        case 'OTHER': return 'file';
        default: return 'file';
      }
    }
  }
  return 'file';
};

/**
 * 根据扩展名获取文件类型用户友好描述
 * @param extension 文件扩展名
 * @returns 文件类型描述或null
 */
export const getFileTypeByExtension = (extension: string | undefined): string | null => {
  if (!extension) return null;
  
  const ext = extension.toLowerCase();
  return EXTENSION_TO_TYPE[ext] || null;
};

/**
 * 处理文件类型显示
 * @param type 文件MIME类型
 * @param extension 文件扩展名
 * @returns 用户友好的文件类型描述
 */
export const getFileType = (type: string | null, extension?: string): string => {
  if (!type && !extension) return '未知';
  
  // 先尝试根据扩展名判断
  if (extension) {
    const typeByExt = getFileTypeByExtension(extension);
    if (typeByExt) return typeByExt;
  }
  
  if (!type) return '文件';
  
  // 文件夹单独处理
  if (type === 'folder') return '文件夹';
  
  // 使用MIME类型判断
  if (type.startsWith('image')) return '图片';
  if (type.startsWith('video')) return '视频';
  if (type.startsWith('audio')) return '音频';
  
  // 处理文档类型
  if (type.startsWith('application/pdf')) return 'PDF文档';
  if (type.includes('word') || type.includes('wordprocessingml')) return 'Word文档';
  if (type.includes('excel') || type.includes('spreadsheetml')) return 'Excel表格';
  if (type.includes('powerpoint') || type.includes('presentationml')) return 'PPT演示文稿';
  if (type.startsWith('text/plain')) return '文本文件';
  
  // 压缩文件
  if (type.includes('zip') || type.includes('rar') || type.includes('compressed')) return '压缩文件';
  
  // 直接使用document类型
  if (type === 'document') return '文档';
  
  return '文件';
};

/**
 * 根据MIME类型和扩展名确定文件分类
 * @param mimeType 文件MIME类型
 * @param extension 文件扩展名
 * @returns 文件分类名称
 */
export function getFileCategory(mimeType: string, extension: string): string {
  // 转换为小写以便比较
  const lowerMimeType = mimeType.toLowerCase();
  const lowerExtension = extension.toLowerCase();
  
  // 检查是否是文件夹
  if (lowerMimeType === 'folder' || lowerMimeType === 'directory') {
    return FILE_CATEGORIES.FOLDER;
  }
  
  // 根据MIME类型和扩展名判断文件类型
  for (const [category, typeData] of Object.entries(FILE_TYPE_MAPS)) {
    // 检查MIME类型
    if (typeData.mimeTypes.some(type => lowerMimeType.startsWith(type))) {
      return FILE_CATEGORIES[category as keyof typeof FILE_TYPE_MAPS];
    }
    
    // 检查扩展名
    if (typeData.extensions.includes(lowerExtension)) {
      return FILE_CATEGORIES[category as keyof typeof FILE_TYPE_MAPS];
    }
  }
  
  // 默认为其他类型
  return FILE_CATEGORIES.OTHER;
}

/**
 * 统一的文件过滤函数
 * 根据指定的文件类型过滤文件列表
 * 
 * @param files 要过滤的文件列表
 * @param fileType 文件类型枚举或字符串
 * @returns 过滤后的文件列表
 */
export function filterFilesByType<T extends { isFolder: boolean; name: string; type?: string }>(
  files: T[], 
  fileType: FileTypeEnum | string | null
): T[] {
  if (!files || !Array.isArray(files) || !fileType) {
    return files;
  }
  
  // 文件夹处理
  if (fileType === 'folder') {
    return files.filter(file => file.isFolder);
  }
  
  return files.filter(file => {
    // 如果是文件夹，且不是筛选文件夹，则排除
    if (file.isFolder) return false;
    
    // 检查文件是否有显式的类型标记（例如从重命名操作）
    if ((file as any)._forceInclude === true) {
      return true;
    }
    
    // 首先检查文件的type字段，这是从数据库获取的类型
    if (file.type === fileType) {
      return true;
    }
    
    // 然后检查文件扩展名
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext) return false;
    
    // 根据文件类型和扩展名进行过滤
    switch (fileType) {
      case 'document':
        return ['doc', 'docx', 'pdf', 'txt', 'md', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext);
      case 'image':
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext);
      case 'audio':
        return ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext);
      case 'video':
        return ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm'].includes(ext);
      case 'code':
        return ['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'php', 'rb'].includes(ext);
      case 'archive':
        return ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext);
      default:
        return false;
    }
  });
}

/**
 * 构建数据库查询条件获取特定类型的文件
 * @param type 文件类型
 * @param includeFolder 是否在非文件夹类型中也包含文件夹，默认为 false
 * @returns 查询条件对象
 */
export function buildFileTypeFilter(type: string, includeFolder: boolean = false) {
  const where: any = { isDeleted: false };
  
  // 文件夹类型特殊处理
  if (type === FILE_CATEGORIES.FOLDER) {
    where.isFolder = true;
    return where;
  }
  
  // 只有在不包含文件夹时才添加 isFolder: false 条件
  if (!includeFolder) {
    where.isFolder = false;
  }
  
  // 根据不同类型构建查询条件
  if (type === FILE_CATEGORIES.IMAGE) {
    where.type = { startsWith: 'image' };
  } else if (type === FILE_CATEGORIES.VIDEO) {
    where.type = { startsWith: 'video' };
  } else if (type === FILE_CATEGORIES.AUDIO) {
    where.OR = [
      { type: FILE_CATEGORIES.AUDIO },
      { type: { startsWith: 'audio/' } }
    ];
  } else if (type === FILE_CATEGORIES.DOCUMENT) {
    where.OR = [
      { type: FILE_CATEGORIES.DOCUMENT },
      { type: { startsWith: 'application/pdf' } },
      { type: { startsWith: 'application/msword' } },
      { type: { startsWith: 'application/vnd.openxmlformats-officedocument.wordprocessingml' } },
      { type: { startsWith: 'application/vnd.ms-excel' } },
      { type: { startsWith: 'application/vnd.openxmlformats-officedocument.spreadsheetml' } },
      { type: { startsWith: 'application/vnd.ms-powerpoint' } },
      { type: { startsWith: 'application/vnd.openxmlformats-officedocument.presentationml' } },
      { type: { startsWith: 'text' } }
    ];
  } else if (type === FILE_CATEGORIES.ARCHIVE) {
    where.OR = [
      { type: FILE_CATEGORIES.ARCHIVE },
      {
        type: {
          in: [
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'application/x-compressed',
            'application/x-tar',
            'application/gzip'
          ]
        }
      }
    ];
  } else if (type === FILE_CATEGORIES.CODE) {
    where.OR = [
      { type: FILE_CATEGORIES.CODE },
      { type: { startsWith: 'text/javascript' } },
      { type: { startsWith: 'application/json' } },
      { type: { startsWith: 'text/html' } },
      { type: { startsWith: 'text/css' } },
      { type: { startsWith: 'text/xml' } },
    ];
  } else if (type === FILE_CATEGORIES.OTHER) {
    // 排除所有已知类型
    where.AND = [
      { type: { not: { startsWith: 'image' } } },
      { type: { not: { startsWith: 'video' } } },
      { type: { not: { startsWith: 'audio' } } },
      { type: { not: { startsWith: 'application/pdf' } } },
      { type: { not: { startsWith: 'application/msword' } } },
      { type: { not: { startsWith: 'application/vnd.openxmlformats-officedocument' } } },
      { type: { not: { startsWith: 'application/vnd.ms-' } } },
      { type: { not: { startsWith: 'text' } } },
      { type: { not: { in: [
        FILE_CATEGORIES.DOCUMENT,
        FILE_CATEGORIES.AUDIO,
        FILE_CATEGORIES.ARCHIVE,
        FILE_CATEGORIES.CODE
      ] } } }
    ];
  }
  
  return where;
}

/**
 * 生成文件唯一标识符
 * @param extension 文件扩展名
 * @returns 唯一文件名
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  
  // 保留原始文件扩展名
  const extension = originalName.split('.').pop() || '';
  const filename = `${timestamp}-${randomString}${extension ? `.${extension}` : ''}`;
  
  return filename;
}

/**
 * 清理文件名，移除不安全字符
 * @param filename 原始文件名
 * @returns 清理后的文件名
 */
export function sanitizeFilename(filename: string): string {
  // 移除路径分隔符和其他不安全字符
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-') // 替换Windows/Unix不允许的字符
    .trim();
}

// 保留兼容性的别名函数
export const filterFiles = filterFilesByType;

/**
 * 文件类型工具
 * 提供文件类型检测和筛选相关功能
 */

// 文件类型扩展名映射
export const FILE_TYPE_EXTENSIONS: Record<FileTypeEnum, string[]> = {
  [FileTypeEnum.FOLDER]: [],
  [FileTypeEnum.DOCUMENT]: ['doc', 'docx', 'pdf', 'txt', 'md', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'],
  [FileTypeEnum.IMAGE]: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'ico'],
  [FileTypeEnum.AUDIO]: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'],
  [FileTypeEnum.VIDEO]: ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv', 'mpeg', '3gp'],
  [FileTypeEnum.CODE]: ['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'php', 'rb', 'swift'],
  [FileTypeEnum.ARCHIVE]: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso'],
  [FileTypeEnum.PDF]: ['pdf'],
  [FileTypeEnum.UNKNOWN]: []
};

/**
 * 获取文件扩展名（不带点）
 * @param filename 文件名
 * @returns 文件扩展名（小写）
 */
export function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * 根据文件名和类型判断文件是否符合特定类型
 * @param filename 文件名
 * @param isFolder 是否为文件夹
 * @param fileType 要检查的文件类型
 * @returns 是否符合类型
 */
export function matchesFileType(filename: string, isFolder: boolean, fileType: FileTypeEnum): boolean {
  // 对所有文件或为空类型，直接返回true
  if (!fileType || fileType === FileTypeEnum.UNKNOWN) {
    return true;
  }
  
  // 文件夹类型判断
  if (fileType === FileTypeEnum.FOLDER) {
    return isFolder;
  }
  
  // 非文件夹但要求文件夹类型
  if (isFolder) {
    return false;
  }
  
  // 获取文件扩展名
  const extension = getFileExtension(filename).toLowerCase();
  
  // 检查是否匹配指定类型的扩展名
  return FILE_TYPE_EXTENSIONS[fileType].includes(extension);
}

/**
 * 判断文件是否是图片
 * @param filename 文件名
 * @returns 是否为图片
 */
export function isImageFile(filename: string): boolean {
  return matchesFileType(filename, false, FileTypeEnum.IMAGE);
}

/**
 * 判断文件是否是文档
 * @param filename 文件名
 * @returns 是否为文档
 */
export function isDocumentFile(filename: string): boolean {
  return matchesFileType(filename, false, FileTypeEnum.DOCUMENT);
}

/**
 * 判断文件是否是视频
 * @param filename 文件名
 * @returns 是否为视频
 */
export function isVideoFile(filename: string): boolean {
  return matchesFileType(filename, false, FileTypeEnum.VIDEO);
}

/**
 * 判断文件是否是音频
 * @param filename 文件名
 * @returns 是否为音频
 */
export function isAudioFile(filename: string): boolean {
  return matchesFileType(filename, false, FileTypeEnum.AUDIO);
}

/**
 * 根据文件名获取可能的文件类型
 * @param filename 文件名
 * @param isFolder 是否为文件夹
 * @returns 文件类型枚举
 */
export function getFileTypeByName(filename: string, isFolder: boolean): FileTypeEnum {
  if (isFolder) {
    return FileTypeEnum.FOLDER;
  }
  
  // 获取文件扩展名
  const ext = getFileExtension(filename).toLowerCase();
  
  // 没有扩展名，返回未知类型
  if (!ext) {
    return FileTypeEnum.UNKNOWN;
  }
  
  // 检查所有文件类型
  for (const [type, extensions] of Object.entries(FILE_TYPE_EXTENSIONS)) {
    if (type !== FileTypeEnum.FOLDER && type !== FileTypeEnum.UNKNOWN && extensions.includes(ext)) {
      return type as FileTypeEnum;
    }
  }
  
  // 默认返回未知类型
  return FileTypeEnum.UNKNOWN;
}
