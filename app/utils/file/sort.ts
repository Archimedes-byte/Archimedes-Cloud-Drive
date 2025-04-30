/**
 * 文件排序工具函数
 * 提供统一的文件排序实现
 */

import { SortDirectionEnum, SortField } from '@/app/types';

/**
 * 文件排序接口
 */
export interface FileSortConfig {
  field: SortField;
  direction: SortDirectionEnum;
}

/**
 * 排序文件列表
 * 根据指定的排序字段和排序方向对文件列表进行排序
 * 
 * @param fileList 要排序的文件列表
 * @param sortConfig 排序配置，包含字段名和排序方向
 * @returns 排序后的文件列表
 */
export function sortFiles<T extends { 
  isFolder?: boolean; 
  name: string; 
  size?: number | undefined; 
  createdAt?: string | Date | null;
}>(fileList: T[], sortConfig: FileSortConfig): T[] {
  if (!Array.isArray(fileList) || fileList.length === 0) {
    return fileList;
  }

  return [...fileList].sort((a, b) => {
    // 文件夹始终排在前面，无论排序类型或方向如何
    if (a.isFolder !== undefined && b.isFolder !== undefined && a.isFolder !== b.isFolder) {
      return a.isFolder ? -1 : 1;
    }

    // 根据排序规则排序
    let comparison = 0;
    switch (sortConfig.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name, undefined, {sensitivity: 'accent'});
        break;
      case 'size':
        const sizeA = a.size || 0;
        const sizeB = b.size || 0;
        comparison = sizeA - sizeB;
        break;
      case 'createdAt':
        const timeA = a.createdAt 
          ? (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.getTime()) 
          : 0;
        const timeB = b.createdAt 
          ? (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.getTime()) 
          : 0;
        comparison = timeA - timeB;
        break;
      default:
        break;
    }

    return sortConfig.direction === SortDirectionEnum.ASC ? comparison : -comparison;
  });
} 