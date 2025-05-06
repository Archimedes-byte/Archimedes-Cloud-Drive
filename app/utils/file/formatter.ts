/**
 * 文件格式化工具函数
 */

/**
 * 格式化文件大小
 * @param bytes 文件大小（字节）
 * @param decimals 小数位数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * 格式化日期为易读字符串
 * @param date 日期
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 获取相对时间描述（例如"3分钟前"）
 * @param date 日期
 * @returns 相对时间描述
 */
export function getRelativeTimeString(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  // 负值表示未来时间
  if (seconds < 0) {
    return formatDate(d);
  }
  
  // 相对时间描述
  if (seconds < 60) return `${seconds}秒前`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}天前`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}个月前`;
  
  // 超过一年显示具体日期
  return formatDate(d);
}

/**
 * 将数据库文件实体转换为前端友好的文件信息对象
 * @param file 数据库文件实体
 * @returns 格式化后的文件信息对象
 */
export function formatFile(file: any): any {
  if (!file) return undefined;
  
  // 提取基本字段
  const result: any = {
    id: file.id,
    name: file.name,
    path: file.path || '',
    isFolder: !!file.isFolder,
    parentId: file.parentId || null,
    createdAt: formatDate(file.createdAt),
    updatedAt: file.updatedAt ? file.updatedAt.toString() : new Date().toString(),
  };
  
  // 添加可选字段
  if (file.type !== null && file.type !== undefined) {
    result.type = file.type;
  }
  
  if (file.size !== null && file.size !== undefined) {
    result.size = file.size;
    result.sizeFormatted = formatFileSize(file.size);
  }
  
  // 添加文件扩展名
  if (file.name) {
    const parts = file.name.split('.');
    if (parts.length > 1) {
      result.extension = parts[parts.length - 1].toLowerCase();
    } else {
      result.extension = '';
    }
  }
  
  // 添加其他可选字段
  if (file.uploaderId) result.uploaderId = file.uploaderId;
  if (file.url) result.url = file.url;
  if (file.tags) result.tags = file.tags;
  
  // 处理文件夹信息
  if (file.folder) {
    result.folder = file.folder;
  }
  
  return result;
} 