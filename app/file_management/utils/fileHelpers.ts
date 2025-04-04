import { File, FileType, FILE_TYPE_MAP } from '../types/index';

// 获取文件图标
export const getFileIcon = (type: string | undefined, extension: string | undefined, isFolder: boolean): string => {
  if (isFolder) {
    return 'folder';
  }

  if (!type && !extension) {
    return 'file';
  }

  for (const [fileType, fileTypeInfo] of Object.entries(FILE_TYPE_MAP)) {
    const { mimeTypes, extensions } = fileTypeInfo as { mimeTypes: string[]; extensions: string[] };
    
    // 检查MIME类型
    const hasMimeType = type && mimeTypes.some((mimeType: string) => 
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
        case 'code': return 'code';
        default: return 'file';
      }
    }
  }
  return 'file';
};

// 过滤文件
export function filterFiles(files: File[], type: FileType | null): File[] {
  // 如果没有类型或是"other"类型，返回所有文件
  if (!type || type === 'other') return files;
  
  // 处理folder类型
  if (type === 'folder') {
    return files.filter(file => file.isFolder);
  }
  
  // 获取类型定义
  const fileTypeInfo = FILE_TYPE_MAP[type];
  if (!fileTypeInfo) return files;
  
  return files.filter(file => {
    // 排除文件夹（除非请求的就是folder类型）
    if (file.isFolder) return false;
    
    // 提取文件扩展名
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // 如果文件类型字段直接匹配当前过滤类型，则返回true
    if (file.type === type) return true;
    
    // 检查MIME类型
    const mimeTypeMatch = file.type && fileTypeInfo.mimeTypes.some(mimeType => 
      file.type!.startsWith(mimeType) || file.type === mimeType
    );
    
    // 检查扩展名
    const extensionMatch = fileTypeInfo.extensions.includes(extension);
    
    return mimeTypeMatch || extensionMatch;
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
    extension: filename.substring(lastDotIndex + 1)
  };
};

// 扩展名到文件类型的映射
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

// 根据扩展名获取文件类型
export const getFileTypeByExtension = (extension: string | undefined): string | null => {
  if (!extension) return null;
  
  const ext = extension.toLowerCase();
  return EXTENSION_TO_TYPE[ext] || null;
};

// 处理文件类型显示
export const getFileType = (type: string | null, extension?: string): string => {
  if (!type && !extension) return '未知';
  
  // 先尝试根据扩展名判断
  if (extension) {
    const typeByExt = getFileTypeByExtension(extension);
    if (typeByExt) return typeByExt;
  }
  
  if (!type) return '文件';
  
  // 检查"audio"类型
  if (type === 'audio') return '音频';
  
  // 使用MIME类型判断
  if (type.startsWith('image')) return '图片';
  if (type.startsWith('video')) return '视频';
  if (type.startsWith('audio')) return '音频';
  
  // 处理文档类型，提供更详细的区分
  if (type.startsWith('application/pdf')) return 'PDF文档';
  
  // Word文档
  if (type.startsWith('application/msword') || 
      type.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml')) 
    return 'Word文档';
  
  // Excel表格
  if (type.startsWith('application/vnd.ms-excel') || 
      type.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')) 
    return 'Excel表格';
  
  // PowerPoint演示文稿
  if (type.startsWith('application/vnd.ms-powerpoint') || 
      type.startsWith('application/vnd.openxmlformats-officedocument.presentationml')) 
    return 'PPT演示文稿';
  
  // 文本文件
  if (type.startsWith('text/plain')) return '文本文件';
  if (type.startsWith('text/html')) return 'HTML文件';
  if (type.startsWith('text/css')) return 'CSS样式表';
  if (type.startsWith('text/javascript') || type.startsWith('application/javascript')) 
    return 'JavaScript代码';
  
  // 压缩文件
  if (type.startsWith('application/zip') || 
      type.startsWith('application/x-rar-compressed') ||
      type.startsWith('application/x-7z-compressed') ||
      type.startsWith('application/x-tar') ||
      type.startsWith('application/gzip')) 
    return '压缩文件';
  
  // 文件夹单独处理
  if (type === 'folder') return '文件夹';
  
  // 直接使用document类型
  if (type === 'document') return '文档';
  
  // 返回类型作为字符串，以便显示更多信息
  return type;
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