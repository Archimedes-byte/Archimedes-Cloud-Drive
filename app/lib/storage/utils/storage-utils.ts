/**
 * 存储工具函数
 * 提供文件类型识别、格式化等功能
 */

// 文件类型映射
export const TYPE_MAP = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
  document: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'txt', 'csv', 'md', 'rtf'],
  video: ['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz'],
  code: ['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'php', 'sql', 'yml', 'yaml']
};

// 文件类型枚举
export type FileType = keyof typeof TYPE_MAP | 'folder' | 'unknown';

// 文件图标类型映射
export const FILE_TYPE_MAP: Record<string, FileType> = 
  Object.entries(TYPE_MAP).reduce((acc, [type, extensions]) => {
    extensions.forEach(ext => {
      acc[ext] = type as FileType;
    });
    return acc;
  }, {} as Record<string, FileType>);

/**
 * 获取文件图标类型
 * @param fileType 文件MIME类型
 * @param extension 文件扩展名
 * @param isFolder 是否为文件夹
 * @returns 文件图标类型
 */
export function getFileIcon(fileType?: string, extension?: string, isFolder?: boolean): FileType {
  // 判断是否为文件夹
  if (isFolder) {
    return 'folder';
  }
  
  // 尝试使用扩展名判断
  if (extension) {
    const ext = extension.toLowerCase().replace('.', '');
    if (FILE_TYPE_MAP[ext]) {
      return FILE_TYPE_MAP[ext];
    }
  }
  
  // 尝试使用MIME类型判断
  if (fileType) {
    const type = fileType.toLowerCase().split('/')[0];
    if (type === 'image' || type === 'video' || type === 'audio') {
      return type as FileType;
    }
    
    if (type === 'application') {
      const subtype = fileType.split('/')[1];
      if (subtype.includes('zip') || subtype.includes('compressed') || subtype.includes('archive')) {
        return 'archive';
      }
      if (subtype.includes('pdf') || subtype.includes('word') || subtype.includes('excel') || subtype.includes('powerpoint')) {
        return 'document';
      }
      if (subtype.includes('json') || subtype.includes('xml') || subtype.includes('javascript')) {
        return 'code';
      }
    }
    
    if (type === 'text') {
      return 'document';
    }
  }
  
  // 默认返回未知类型
  return 'unknown';
}

/**
 * 格式化文件大小
 * @param bytes 文件大小（字节）
 * @param decimals 小数位数
 * @returns 格式化后的文件大小
 */
export function formatFileSize(bytes?: number, decimals: number = 2): string {
  if (bytes === undefined || bytes === null || bytes === 0) {
    return '0 Bytes';
  }
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 获取文件名和扩展名
 * @param filename 文件名
 * @returns 文件名和扩展名
 */
export function getFileNameAndExtension(filename: string): { name: string; extension: string } {
  const lastDotIndex = filename.lastIndexOf('.');
  
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return { name: filename, extension: '' };
  }
  
  const name = filename.substring(0, lastDotIndex);
  const extension = filename.substring(lastDotIndex + 1);
  
  return { name, extension };
} 