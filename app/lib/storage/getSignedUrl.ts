/**
 * 生成文件的签名URL，用于安全访问文件
 * 
 * 该函数为文件生成一个带有时间限制的访问URL
 */

import { join } from 'path';
import { sign } from 'jsonwebtoken';
import { STORAGE_CONFIG } from '../config';

/**
 * 获取文件的签名URL
 * @param filePath 文件的相对路径
 * @param expiresIn 过期时间（秒）
 * @returns 可访问的签名URL
 */
export async function getSignedUrl(filePath: string, expiresIn: number = 600): Promise<string> {
  try {
    // 使用随机ID作为文件标识符
    const fileId = Math.random().toString(36).substring(2, 15);
    
    // 获取秘钥，如果环境变量未设置则使用默认值
    const secret = process.env.JWT_SECRET || 'cloud-drive-secure-file-access';
    
    // 创建JWT token
    const token = sign(
      { id: fileId, path: filePath }, 
      secret, 
      { expiresIn }
    );

    // 构建带有token的URL
    const signedUrl = `/api/storage/files/serve?token=${encodeURIComponent(token)}`;
    
    console.log('生成签名URL:', { filePath, expiresIn, tokenLength: token.length });
    
    return signedUrl;
  } catch (error) {
    console.error('生成签名URL失败:', error);
    throw new Error('生成文件访问链接失败');
  }
} 