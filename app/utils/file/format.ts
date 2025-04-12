/**
 * 文件格式化工具函数
 * 处理文件大小、日期等格式化
 */

/**
 * 格式化文件大小
 * @param bytes 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 格式化日期
 * @param date 日期字符串或日期对象
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | Date | undefined): string => {
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
};

/**
 * 处理文件类型显示
 * @param type 文件MIME类型
 * @returns 用户友好的文件类型描述
 */
export const getFileTypeDisplay = (type: string | null): string => {
  if (!type) return '未知';
  if (type.startsWith('image/')) return '图片';
  if (type.startsWith('video/')) return '视频';
  if (type.startsWith('audio/')) return '音频';
  if (type.startsWith('application/pdf')) return 'PDF';
  if (type.startsWith('application/msword') || type.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml')) return 'Word';
  if (type.startsWith('application/vnd.ms-excel') || type.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')) return 'Excel';
  if (type.startsWith('application/vnd.ms-powerpoint') || type.startsWith('application/vnd.openxmlformats-officedocument.presentationml')) return 'PowerPoint';
  return '其他';
};
