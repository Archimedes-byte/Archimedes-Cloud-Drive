/**
 * 文件存储处理器
 * 用于处理文件的读取、写入、流处理等操作
 */
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// 文件存储基础路径
const STORAGE_BASE_PATH = process.env.FILE_STORAGE_PATH || path.join(process.cwd(), 'uploads');

// 确保存储目录存在
try {
  if (!fs.existsSync(STORAGE_BASE_PATH)) {
    fs.mkdirSync(STORAGE_BASE_PATH, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create storage directory:', error);
}

/**
 * 获取文件的完整路径
 * @param filename 文件名
 * @returns 文件的完整路径
 */
export function getFilePath(filename: string): string {
  return path.join(STORAGE_BASE_PATH, filename);
}

/**
 * 获取文件的可读流
 * @param filename 文件名
 * @returns 文件的可读流，如果文件不存在则返回null
 */
export async function getFileStream(filename: string): Promise<Readable | null> {
  const filePath = getFilePath(filename);
  
  try {
    // 检查文件是否存在
    await fs.promises.access(filePath, fs.constants.R_OK);
    // 创建可读流
    const stream = fs.createReadStream(filePath);
    return stream;
  } catch (error) {
    console.error('Cannot access file:', filename, error);
    return null;
  }
}

/**
 * 将文件保存到存储系统
 * @param fileBuffer 文件数据缓冲区
 * @param filename 文件名
 * @returns 保存结果
 */
export async function saveFile(fileBuffer: Buffer, filename: string): Promise<boolean> {
  const filePath = getFilePath(filename);
  
  try {
    await fs.promises.writeFile(filePath, fileBuffer);
    return true;
  } catch (error) {
    console.error('Failed to save file:', filename, error);
    return false;
  }
}

/**
 * 删除存储系统中的文件
 * @param filename 文件名
 * @returns 删除结果
 */
export async function deleteFile(filename: string): Promise<boolean> {
  const filePath = getFilePath(filename);
  
  try {
    // 检查文件是否存在
    await fs.promises.access(filePath, fs.constants.F_OK);
    // 删除文件
    await fs.promises.unlink(filePath);
    return true;
  } catch (error) {
    // 如果是文件不存在错误，也返回成功
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return true;
    }
    console.error('Failed to delete file:', filename, error);
    return false;
  }
}

/**
 * 检查文件是否存在
 * @param filename 文件名
 * @returns 文件是否存在
 */
export async function fileExists(filename: string): Promise<boolean> {
  const filePath = getFilePath(filename);
  
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取文件大小
 * @param filename 文件名
 * @returns 文件大小（字节）
 */
export async function getFileSize(filename: string): Promise<number> {
  const filePath = getFilePath(filename);
  
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error('Failed to get file size:', filename, error);
    return 0;
  }
} 