/**
 * 文件操作工具模块
 * 集中处理文件类型判断和其他通用文件操作功能
 */

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

/**
 * 构建数据库查询条件获取特定类型的文件
 * @param type 文件类型
 * @returns 查询条件对象
 */
export function buildFileTypeFilter(type: string) {
  const where: any = { isDeleted: false };
  
  if (type === FILE_CATEGORIES.FOLDER) {
    where.isFolder = true;
    return where;
  }
  
  // 文件查询（非文件夹）
  where.isFolder = false;
  
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