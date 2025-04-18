import { 
  File, 
  FileText, 
  Image, 
  Film, 
  Music, 
  Archive, 
  Code, 
  FileType,
  Table,
  Presentation,
  Folder,
  Package
} from 'lucide-react';

import React from 'react';

export const folderIcon = <Folder size={24} color="#2878ff" />;

/**
 * 获取文件类型的图标
 * @param extension 文件扩展名
 * @returns 文件类型对应的图标
 */
export const FileIcon = ({ extension, size = 24 }: { extension?: string, size?: number }) => {
  if (!extension) {
    return <File size={size} color="#909399" />;
  }

  // 转换为小写以便匹配
  const ext = extension.toLowerCase();

  // 图片类型
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return <Image size={size} color="#13C2C2" />;
  }

  // 视频类型
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v'].includes(ext)) {
    return <Film size={size} color="#722ED1" />;
  }

  // 音频类型
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(ext)) {
    return <Music size={size} color="#EB2F96" />;
  }

  // 文档类型
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
    return <FileText size={size} color="#1890FF" />;
  }

  // PDF类型
  if (ext === 'pdf') {
    return <FileType size={size} color="#F5222D" />;
  }

  // 表格类型
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
    return <Table size={size} color="#52C41A" />;
  }

  // 演示文稿类型
  if (['ppt', 'pptx', 'odp'].includes(ext)) {
    return <Presentation size={size} color="#FA8C16" />;
  }

  // 压缩文件类型
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
    return <Archive size={size} color="#722ED1" />;
  }

  // 代码类型
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'php', 'py', 'java', 'c', 'cpp', 'h', 'json', 'xml'].includes(ext)) {
    return <Code size={size} color="#2878ff" />;
  }

  // 可执行文件类型
  if (['exe', 'msi', 'app', 'apk', 'deb', 'rpm'].includes(ext)) {
    return <Package size={size} color="#F5222D" />;
  }

  // 默认文件图标
  return <File size={size} color="#909399" />;
}; 