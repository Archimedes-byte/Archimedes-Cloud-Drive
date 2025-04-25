/**
 * 最近文件API模块
 * 提供获取最近访问的文件数据的功能
 */

import { FileInfo } from '@/app/types';

// 临时数据样本
const getMockFileData = (count: number, prefix: string, timeOffsetHours: number): FileInfo[] => {
  const result: FileInfo[] = [];
  
  for (let i = 1; i <= count; i++) {
    // 生成不同的日期，基于当前时间减去指定的时间偏移
    const date = new Date();
    date.setHours(date.getHours() - timeOffsetHours - Math.floor(Math.random() * 5));
    
    const extension = ['pdf', 'docx', 'jpg', 'png', 'txt'][Math.floor(Math.random() * 5)];
    
    // 根据扩展名确定文件类型
    const getFileType = (ext: string) => {
      switch (ext) {
        case 'jpg':
        case 'png':
          return 'image/jpeg';
        case 'pdf':
          return 'application/pdf';
        case 'docx':
          return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'txt':
          return 'text/plain';
        default:
          return 'application/octet-stream';
      }
    };
    
    const isFolder = Math.random() > 0.8;
    
    result.push({
      id: `${prefix}-${i}`,
      name: `${prefix} 文件 ${i}${isFolder ? '' : '.' + extension}`,
      size: Math.floor(Math.random() * 10000000), // 随机文件大小
      isFolder: isFolder, 
      extension: isFolder ? undefined : extension,
      type: isFolder ? 'folder' : getFileType(extension), // 添加type字段
      tags: Math.random() > 0.5 ? ['重要', '工作'] : [], // 随机添加标签
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10天前创建
      updatedAt: date.toISOString(),
    });
  }
  
  return result;
};

/**
 * 获取今天访问的文件
 */
export const getTodayFiles = async (): Promise<FileInfo[]> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  return getMockFileData(3, 'today', 2);
};

/**
 * 获取昨天访问的文件
 */
export const getYesterdayFiles = async (): Promise<FileInfo[]> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  return getMockFileData(2, 'yesterday', 25);
};

/**
 * 获取过去一周访问的文件
 */
export const getPastWeekFiles = async (): Promise<FileInfo[]> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  return getMockFileData(4, 'past-week', 72);
};

/**
 * 获取更早之前访问的文件
 */
export const getOlderFiles = async (): Promise<FileInfo[]> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  return getMockFileData(2, 'older', 240);
}; 