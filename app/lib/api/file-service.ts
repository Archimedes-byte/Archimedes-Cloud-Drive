import { API_PATHS } from './paths';

/**
 * 检查文件或文件夹名称是否存在冲突
 * @param folderId 目标文件夹ID
 * @param fileNames 要检查的文件名数组
 * @returns 包含冲突文件名的对象 { conflicts: string[] }
 */
export async function checkFileNameConflicts(folderId: string, fileNames: string[]) {
  try {
    const response = await fetch(API_PATHS.STORAGE.FILES.CHECK_NAME_CONFLICTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId,
        fileNames
      })
    });

    if (!response.ok) {
      throw new Error(`检查文件名冲突失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('检查文件名冲突时发生错误:', error);
    // 出错时返回空冲突列表
    return { conflicts: [] };
  }
} 