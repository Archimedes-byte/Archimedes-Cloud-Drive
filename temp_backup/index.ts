/**
 * 导入重定向
 * 
 * 这个文件帮助解决导入路径问题，将 @/lib 路径重定向到 @/app/lib
 */

// 导出app/lib中的内容
export * from '../app/lib/importFix';

// 单独导出文件类型，避免命名冲突
import * as FileTypes from '../app/types/file';
import * as AppTypes from '../app/types/index';

export { 
  FileTypes,
  AppTypes
}; 