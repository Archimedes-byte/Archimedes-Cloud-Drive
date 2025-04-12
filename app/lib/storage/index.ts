/**
 * 文件存储模块 (File Storage Module)
 * 
 * 此模块负责处理文件的存储、检索和管理，提供统一的文件操作接口。
 * 主要功能：
 * - 本地文件存储与检索
 * - 生成预签名URL用于安全访问
 * - 文件元数据管理
 * - 文件类型判断与处理
 * - 文件访问权限控制
 * - 文件路径管理与URL生成
 * 
 * @example
 * // 存储文件
 * import { saveFile } from '@/app/lib/storage';
 * const filePath = await saveFile(fileObject, userId);
 * 
 * // 获取文件
 * import { getFile } from '@/app/lib/storage';
 * const fileData = await getFile(filePath);
 * 
 * // 文件类型判断
 * import { getFileIcon, formatFileSize } from '@/app/lib/storage';
 * const icon = getFileIcon(type, extension, isFolder);
 * const size = formatFileSize(fileSize);
 * 
 * // 访问权限验证
 * import { validateFileAccess } from '@/app/lib/storage';
 * const hasAccess = await validateFileAccess(file, userId);
 * 
 * // 文件路径与URL生成
 * import { generateFileUrl, getStoragePath } from '@/app/lib/storage';
 * const fileUrl = generateFileUrl(fileId, fileName);
 */

// 导出核心文件存储功能
export { 
  saveFile,
  getFile,
  deleteFile
} from './storage';

// 导出预签名URL功能
export {
  getSignedUrl
} from './getSignedUrl';

// 导出文件服务层功能（仅用于内部服务端操作）
// 这些函数以Service后缀命名，以区分于直接存储操作
export { 
  saveFile as saveFileService,
  getFile as getFileService,
  deleteFile as deleteFileService
} from './service/fileService';

// 导出文件工具函数
export {
  getFileIcon,
  formatFileSize,
  getFileNameAndExtension,
  TYPE_MAP,
  FILE_TYPE_MAP
} from './utils';

// 导出文件访问控制功能
export {
  validateFileAccess
} from './access';

// 导出文件路径工具
export {
  getStoragePath,
  generateUniqueFilename,
  generateFileUrl
} from './paths';

// 导出类型定义
export type { FileType } from './utils';
export type { FileInfo } from './access'; 