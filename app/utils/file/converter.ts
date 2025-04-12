/**
 * 文件类型转换工具函数
 * 用于在不同文件类型表示之间进行转换
 */
import { FileInfo } from '@/app/types';

/**
 * 将数据库文件对象转换为UI显示所需的文件项类型
 * @param file 数据库文件对象
 * @returns UI友好的文件对象
 */
export const convertToFileItemType = (file: FileInfo): FileInfo => {
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
 * 将文件数组转换为UI显示所需的文件数组
 * @param files 文件数组
 * @returns UI友好的文件数组
 */
export const convertFilesForDisplay = (files: FileInfo[]): FileInfo[] => {
  return files.map(convertToFileItemType);
}; 