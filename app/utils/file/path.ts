/**
 * 文件路径工具函数
 * 处理文件名、扩展名、路径等
 */

/**
 * 获取文件名和后缀
 * @param filename 文件名
 * @returns 包含名称和扩展名的对象
 */
export const getFileNameAndExtension = (filename: string) => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { name: filename, extension: '' };
  }
  return {
    name: filename.substring(0, lastDotIndex),
    extension: filename.substring(lastDotIndex + 1).toLowerCase()
  };
};

/**
 * 获取文件所在目录路径
 * @param path 文件完整路径
 * @returns 文件所在目录路径
 */
export const getFilePath = (path: string | undefined) => {
  if (!path) return '/';
  const parts = path.split('/');
  return parts.slice(0, -1).join('/') || '/';
};

/**
 * 对文件列表进行简单排序
 * @deprecated 请使用 sort.ts 中的 sortFiles 函数
 * @param files 文件列表
 * @param field 排序字段
 * @param direction 排序方向
 * @returns 排序后的文件列表
 */
export function sortPathFiles(files: any[], field: string, direction: 'asc' | 'desc'): any[] {
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
