/**
 * 文件收藏API模块
 * 提供管理文件收藏功能的API
 */

// 存储收藏文件的ID
let favoritedFileIds: string[] = [];

/**
 * 添加文件到收藏夹
 * @param fileId 文件ID
 */
export const addFavorite = async (fileId: string): Promise<void> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 检查文件是否已收藏
  if (!favoritedFileIds.includes(fileId)) {
    favoritedFileIds.push(fileId);
  }
};

/**
 * 从收藏夹中移除文件
 * @param fileId 文件ID
 */
export const removeFavorite = async (fileId: string): Promise<void> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 从收藏列表中移除
  favoritedFileIds = favoritedFileIds.filter(id => id !== fileId);
};

/**
 * 获取文件是否已收藏
 * @param fileId 文件ID
 */
export const isFavorited = async (fileId: string): Promise<boolean> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return favoritedFileIds.includes(fileId);
};

/**
 * 批量获取多个文件的收藏状态
 * @param fileIds 文件ID数组
 * @returns 已收藏的文件ID数组
 */
export const getBatchFavoriteStatus = async (fileIds: string[]): Promise<string[]> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // 返回已收藏的文件ID
  return fileIds.filter(id => favoritedFileIds.includes(id));
};

/**
 * 获取所有收藏的文件ID
 */
export const getAllFavorites = async (): Promise<string[]> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [...favoritedFileIds];
}; 