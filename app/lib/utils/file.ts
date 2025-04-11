import { FileType, FILE_TYPE_MAP } from '@/app/types/file';

/**
 * 文件操作相关工具函数
 * 整合自多个文件：
 * - app/lib/file/utils.ts
 * - app/file_management/utils/fileHelpers.ts
 * - app/file_management/utils/fileUtils.ts
 * - app/file_management/utils/fileOperations.ts
 * - app/file_management/utils/fileTypeConverter.ts
 */

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
        case 'folder': return 'folder';
        case 'other': return 'file';
        default: return 'file';
      }
    }
  }
  return 'file';
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

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
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
  
  return '文件';
};

// 格式化日期
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
}; 