import { FileItemType } from '../components/shared/FileList';

// 本地FileType定义
export interface LocalFileType {
  id: string;
  name: string;
  type: string;
  extension?: string;
  size?: number;
  isFolder?: boolean;
  createdAt?: string | Date;
  tags?: string[];
  parentId?: string | null;
  path?: string;
  updatedAt: string;
}

/**
 * 将LocalFileType转换为FileItemType的工具函数
 */
export const convertToFileItemType = (file: LocalFileType): FileItemType => {
  return {
    id: file.id,
    name: file.name,
    type: file.type,
    extension: file.extension,
    size: file.size,
    isFolder: file.isFolder,
    createdAt: typeof file.createdAt === 'string' ? file.createdAt : file.createdAt?.toString(),
    tags: file.tags
  };
};

/**
 * 将LocalFileType数组转换为FileItemType数组
 */
export const convertFilesForDisplay = (files: LocalFileType[]): FileItemType[] => {
  return files.map(convertToFileItemType);
}; 