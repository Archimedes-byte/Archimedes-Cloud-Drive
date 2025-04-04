/**
 * 文件路径处理工具
 * 提供统一的文件路径处理函数，确保路径处理一致性
 */
import { join, basename, dirname, extname } from 'path';
import { STORAGE_CONFIG } from '../config';
import { v4 as uuidv4 } from 'uuid';

/**
 * 获取文件存储路径
 * @param filename 文件名或UUID
 * @returns 完整的文件存储路径
 */
export function getStoragePath(filename: string): string {
  return join(STORAGE_CONFIG.UPLOAD_PATH, filename);
}

/**
 * 生成唯一的文件名
 * 使用时间戳+原始文件名的格式，确保唯一性的同时保留原始文件名
 * @param originalFilename 原始文件名
 * @returns 生成的唯一文件名
 */
export function generateUniqueFilename(originalFilename: string): string {
  // 解析文件名和扩展名
  const ext = extname(originalFilename);
  const nameWithoutExt = originalFilename.substr(0, originalFilename.length - ext.length);
  
  // 时间戳 + 随机字符串 + 原始文件名
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  // 清理原始文件名，移除特殊字符
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
  
  // 组合新的文件名 (格式: 时间戳-原始文件名-随机字符串.扩展名)
  return `${timestamp}-${sanitizedName}-${randomString}${ext}`;
}

/**
 * 生成文件的URL路径
 * @param fileId 文件ID
 * @returns 可访问的文件URL
 */
export function generateFileUrl(fileId: string): string {
  return `${STORAGE_CONFIG.FILE_BASE_URL}/${fileId}/content`;
}

/**
 * 标准化文件夹路径
 * 确保路径使用正斜杠且以/开头
 * @param path 原始路径
 * @returns 标准化的路径
 */
export function normalizeFolderPath(path: string): string {
  // 替换反斜杠为正斜杠
  let normalizedPath = path.replace(/\\/g, '/');
  
  // 确保路径以/开头
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }
  
  // 确保路径不以/结尾（除非是根路径/）
  if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  
  return normalizedPath;
}

/**
 * 构建子文件夹路径
 * @param parentPath 父文件夹路径
 * @param folderName 子文件夹名称
 * @returns 完整的子文件夹路径
 */
export function buildChildFolderPath(parentPath: string, folderName: string): string {
  const normalizedParent = normalizeFolderPath(parentPath);
  
  // 如果是根路径，直接连接
  if (normalizedParent === '/') {
    return normalizeFolderPath(folderName);
  }
  
  // 否则添加/分隔符
  return normalizeFolderPath(`${normalizedParent}/${folderName}`);
}

/**
 * 从文件存储路径中提取相对路径
 * @param absolutePath 绝对文件路径
 * @returns 相对于UPLOAD_DIR的路径
 */
export function getRelativePath(absolutePath: string): string {
  const normalizedAbsPath = absolutePath.replace(/\\/g, '/');
  const normalizedBasePath = STORAGE_CONFIG.UPLOAD_PATH.replace(/\\/g, '/');
  
  if (normalizedAbsPath.startsWith(normalizedBasePath)) {
    return normalizedAbsPath.substring(normalizedBasePath.length);
  }
  
  return normalizedAbsPath;
}

/**
 * 解析文件路径的各个部分
 * @param filePath 文件路径
 * @returns 包含路径各部分的对象
 */
export function parseFilePath(filePath: string): {
  dirname: string;
  basename: string;
  extension: string;
  filename: string;
} {
  const dir = dirname(filePath);
  const base = basename(filePath);
  const ext = extname(filePath);
  const name = ext ? base.slice(0, -ext.length) : base;
  
  return {
    dirname: dir,
    basename: base,
    extension: ext.slice(1), // 去掉开头的点
    filename: name
  };
} 