import { ExtendedFile } from '../types/index';

export function getFileNameAndExtension(filename: string): { name: string; extension: string } {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { name: filename, extension: '' };
  }
  return {
    name: filename.substring(0, lastDotIndex),
    extension: filename.substring(lastDotIndex + 1).toLowerCase()
  };
}

export function getFileIcon(type?: string, extension?: string, isFolder?: boolean): string {
  if (isFolder) return 'folder';
  
  if (type === 'image') return 'image';
  if (type === 'document') return 'file-text';
  if (type === 'video') return 'video';
  if (type === 'audio') return 'music';
  
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];
  const codeExtensions = ['js', 'ts', 'py', 'java', 'cpp', 'html', 'css'];
  
  if (extension && archiveExtensions.includes(extension)) return 'archive';
  if (extension && codeExtensions.includes(extension)) return 'code';
  
  return 'file';
}

export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '-';
  }
}

export function getFileType(type?: string): string {
  const typeMap: Record<string, string> = {
    image: '图片',
    document: '文档',
    video: '视频',
    audio: '音频',
    folder: '文件夹',
    other: '其他'
  };
  return type ? typeMap[type] || '未知' : '未知';
}

export function sortFiles(files: ExtendedFile[], field: string, direction: 'asc' | 'desc'): ExtendedFile[] {
  return [...files].sort((a, b) => {
    let comparison = 0;
    
    // 文件夹始终排在前面
    if ((a.isFolder === true) !== (b.isFolder === true)) {
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
      case 'createdAt':
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = dateA - dateB;
        break;
      default:
        comparison = 0;
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
} 