import { FileType } from '../types/index';

export const TYPE_MAP: Record<FileType, string> = {
  'image': 'image/',
  'video': 'video/',
  'audio': 'audio/',
  'document': 'application/',
  'archive': 'application/zip',
  'folder': 'folder',
  'other': 'other'
};

export const FILE_TYPE_MAP: Record<FileType, { mimeTypes: string[]; extensions: string[] }> = {
  image: {
    mimeTypes: ['image/'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  },
  document: {
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/'],
    extensions: ['doc', 'docx', 'txt', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx']
  },
  video: {
    mimeTypes: ['video/'],
    extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv']
  },
  audio: {
    mimeTypes: ['audio/'],
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a']
  },
  archive: {
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
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