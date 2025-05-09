/**
 * 核心库模块统一入口 (Core Library Entry Point)
 * 
 * 此文件作为核心库的统一入口点，提供对所有子模块的访问。
 * 主要功能：
 * - 集中导出所有模块功能
 * - 提供便捷的导入路径
 * - 确保模块间依赖关系清晰
 * 
 * 推荐通过专用模块路径导入具体功能，而不是通过此文件导入所有内容：
 * 
 * @example
 * // 推荐方式：从具体模块导入
 * import { prisma } from '@/app/lib/database';
 * import { fileApi } from '@/app/lib/api';
 * 
 * // 不推荐方式：通过统一入口导入
 * import { database, api } from '@/app/lib';
 */

// 导出数据库模块
import * as database from './database';
export { database };

// 导出存储模块
import * as storage from './storage';
export { storage };

// 导出认证模块
import * as auth from './auth';
export { auth };

// 导出API模块
import * as api from './api';
export { api };

// 导出配置模块
import * as config from './config';
export { config }; 