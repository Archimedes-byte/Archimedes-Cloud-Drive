import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// 确保上传目录存在
async function ensureUploadDir(userId: string) {
  const userDir = join(UPLOAD_DIR, userId);
  await mkdir(userDir, { recursive: true });
  return userDir;
}

// 保存文件
export async function saveFile(file: File, userId: string, filename: string): Promise<string> {
  const userDir = await ensureUploadDir(userId);
  const filePath = join(userDir, filename);
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  await writeFile(filePath, buffer);
  return filePath;
}

// 删除文件
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error('删除文件失败:', error);
    throw error;
  }
}

// 获取文件
export async function getFile(filePath: string): Promise<Buffer> {
  try {
    return await readFile(filePath);
  } catch (error) {
    console.error('读取文件失败:', error);
    throw error;
  }
} 