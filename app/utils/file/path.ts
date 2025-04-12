/**
 * 文件路径工具函数
 * 处理文件名、扩展名、路径等
 */

// 获取文件名和后缀
export const getFileNameAndExtension = (filename: string) => {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { name: filename, extension: '' };
  }
  return {
    name: filename.substring(0, lastDotIndex),
    extension: filename.substring(lastDotIndex + 1)
  };
};
