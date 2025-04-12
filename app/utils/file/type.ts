/**
 * 文件类型工具函数
 * 处理文件类型判断、图标获取等
 */

import { FILE_TYPE_MAP, FileInfo, FileTypeEnum } from '@/app/types';

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
        case 'folder': return 'folder';
        case 'other': return 'file';
        default: return 'file';
      }
    }
  }
  return 'file';
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

/**
 * 根据扩展名获取文件类型
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
  
  // 文档类型
  if (fileType === 'document') {
    return files.filter(file => {
      if (file.isFolder) return false;
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && ['doc', 'docx', 'pdf', 'txt', 'md', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext);
    });
  }

  // 图片类型
  if (fileType === 'image') {
    return files.filter(file => {
      if (file.isFolder) return false;
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext);
    });
  }

  // 音频类型
  if (fileType === 'audio') {
    return files.filter(file => {
      if (file.isFolder) return false;
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext);
    });
  }

  // 视频类型
  if (fileType === 'video') {
    return files.filter(file => {
      if (file.isFolder) return false;
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm'].includes(ext);
    });
  }
  
  // 代码类型
  if (fileType === 'code') {
    return files.filter(file => {
      if (file.isFolder) return false;
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && ['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'php', 'rb'].includes(ext);
    });
  }
  
  // 压缩类型
  if (fileType === 'archive') {
    return files.filter(file => {
      if (file.isFolder) return false;
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext);
    });
  }

  // 默认行为 - 返回所有文件
  return files;
}

// 旧的filterFiles函数保留兼容性，但内部调用新的实现
export function filterFiles<T extends { isFolder: boolean; name: string; type?: string }>(
  files: T[], 
  type: string | null
): T[] {
  return filterFilesByType(files, type);
}
