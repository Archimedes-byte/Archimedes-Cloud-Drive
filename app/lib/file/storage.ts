import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

export async function saveFile(file: File, userId: string): Promise<string> {
  const fileExtension = path.extname(file.name)
  const fileName = `${uuidv4()}${fileExtension}`
  const userDir = path.join(UPLOAD_DIR, uuidv4())
  
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

export async function deleteFile(filePath: string): Promise<void> {
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath)
  }
}

export async function getFile(filePath: string): Promise<Buffer> {
  return await fs.promises.readFile(filePath)
} 