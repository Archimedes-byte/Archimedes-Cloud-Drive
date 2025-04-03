/**
 * 格式化相关工具函数
 */

// 格式化文件大小
export const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

// 格式化日期
export const formatDate = (date: string | Date): string => {
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

// 处理文件类型显示
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