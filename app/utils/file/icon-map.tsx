import { 
  File, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive, 
  Code, 
  FileType as FileTypeIcon,
  Table,
  Presentation,
  Folder,
  Package
} from 'lucide-react';

import React from 'react';

export const folderIcon = <Folder size={24} color="#2878ff" />;

/**
 * 文件类型与图标颜色映射
 */
export const FILE_ICON_COLORS = {
  folder: '#2878ff',
  image: '#13C2C2',
  video: '#722ED1',
  audio: '#EB2F96',
  document: '#1890FF',
  pdf: '#F5222D',
  spreadsheet: '#52C41A',
  presentation: '#FA8C16',
  archive: '#722ED1',
  code: '#2878ff',
  executable: '#F5222D',
  default: '#909399'
};

/**
 * 文件扩展名分类映射
 */
export const FILE_EXTENSIONS_MAP = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'avif'],
  video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', 'mpeg', '3gp'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'],
  document: ['doc', 'docx', 'txt', 'rtf', 'odt', 'md'],
  pdf: ['pdf'],
  spreadsheet: ['xls', 'xlsx', 'csv', 'ods'],
  presentation: ['ppt', 'pptx', 'odp'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
  code: ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'less', 'php', 'py', 'java', 'c', 'cpp', 'h', 'json', 'xml', 'go', 'rb'],
  executable: ['exe', 'msi', 'app', 'apk', 'deb', 'rpm']
};

/**
 * 根据扩展名或MIME类型确定文件类型
 * @param extension 文件扩展名
 * @param mimeType 文件MIME类型
 * @param isFolder 是否为文件夹
 * @returns 文件类型
 */
export const getFileType = (extension?: string, mimeType?: string, isFolder?: boolean): string => {
  if (isFolder) return 'folder';
  
  // 处理扩展名
  if (extension) {
    const ext = extension.toLowerCase().replace('.', '');
    
    for (const [type, extensions] of Object.entries(FILE_EXTENSIONS_MAP)) {
      if (extensions.includes(ext)) {
        return type;
      }
    }
  }
  
  // 处理MIME类型
  if (mimeType) {
    const mime = mimeType.toLowerCase();
    
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('spreadsheet') || mime.includes('excel')) return 'spreadsheet';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation';
    if (mime.includes('word') || mime.includes('text/')) return 'document';
    if (mime.includes('zip') || mime.includes('archive') || mime.includes('compressed')) return 'archive';
    if (mime.includes('javascript') || mime.includes('json') || mime.includes('xml') || mime.includes('html')) return 'code';
  }
  
  return 'default';
};

/**
 * 统一的文件图标组件
 * 根据文件类型、扩展名或MIME类型返回对应的图标
 */
export interface FileIconProps {
  extension?: string;
  mimeType?: string;
  isFolder?: boolean;
  size?: number;
  color?: string;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ 
  extension, 
  mimeType, 
  isFolder, 
  size = 24, 
  color,
  className
}) => {
  // 确定文件类型
  const fileType = getFileType(extension, mimeType, isFolder);
  // 确定图标颜色
  const iconColor = color || FILE_ICON_COLORS[fileType as keyof typeof FILE_ICON_COLORS] || FILE_ICON_COLORS.default;
  
  // 根据文件类型返回对应图标
  switch (fileType) {
    case 'folder':
      return <Folder size={size} color={iconColor} className={className} />;
    case 'image':
      return <ImageIcon size={size} color={iconColor} className={className} />;
    case 'video':
      return <Film size={size} color={iconColor} className={className} />;
    case 'audio':
      return <Music size={size} color={iconColor} className={className} />;
    case 'document':
      return <FileText size={size} color={iconColor} className={className} />;
    case 'pdf':
      return <FileTypeIcon size={size} color={iconColor} className={className} />;
    case 'spreadsheet':
      return <Table size={size} color={iconColor} className={className} />;
    case 'presentation':
      return <Presentation size={size} color={iconColor} className={className} />;
    case 'archive':
      return <Archive size={size} color={iconColor} className={className} />;
    case 'code':
      return <Code size={size} color={iconColor} className={className} />;
    case 'executable':
      return <Package size={size} color={iconColor} className={className} />;
    default:
      return <File size={size} color={iconColor} className={className} />;
  }
}; 