/**
 * 核心文件存储实现 (Core File Storage Implementation)
 * 
 * 此模块提供文件系统级别的存储操作，管理文件的保存、检索和删除。
 * 实现细节：
 * - 使用本地文件系统作为存储介质
 * - 基于UUID生成唯一文件名
 * - 按用户ID组织文件目录结构
 */

import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// 定义上传目录路径
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

/**
 * 保存文件到存储系统
 * 
 * @param file - 要存储的文件对象
 * @param userId - 用户标识符，用于组织文件目录
 * @returns 返回文件的存储路径
 */
export async function saveFile(file: File, userId: string): Promise<string> {
  const fileExtension = path.extname(file.name)
  const fileName = `${uuidv4()}${fileExtension}`
  const userDir = path.join(UPLOAD_DIR, userId)
  
  // 确保用户目录存在
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true })
  }

  const filePath = path.join(userDir, fileName)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  await fs.promises.writeFile(filePath, buffer)
  return filePath
}

/**
 * 从存储系统中删除文件
 * 
 * @param filePath - 要删除的文件路径
 */
export async function deleteFile(filePath: string): Promise<void> {
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath)
  }
}

/**
 * 从存储系统中获取文件内容
 * 
 * @param filePath - 要获取的文件路径
 * @returns 返回文件内容的Buffer
 * @throws 如果文件不存在或无法读取，将抛出错误
 */
export async function getFile(filePath: string): Promise<Buffer> {
  return await fs.promises.readFile(filePath)
} 