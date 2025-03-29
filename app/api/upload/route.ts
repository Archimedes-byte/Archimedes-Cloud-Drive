import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// 全局文件夹缓存
const folderCache = new Map<string, string>();
const folderCreationLocks = new Map<string, Promise<string>>();

// 处理文件夹路径
function processFolderPath(parentPath: string | undefined, folderName: string): string {
  return parentPath ? join(parentPath, folderName) : folderName;
}

async function getOrCreateFolder(
  user: { id: string },
  folderName: string,
  parentId: string | null,
  parentFolder: any | null,
  processedTags: string[]
): Promise<string> {
  const folderPath = processFolderPath(parentFolder?.path, folderName);
  const cacheKey = `${user.id}:${folderPath}:${parentId || 'root'}`;
  
  if (folderCache.has(cacheKey)) {
    return folderCache.get(cacheKey)!;
  }

  if (folderCreationLocks.has(cacheKey)) {
    return folderCreationLocks.get(cacheKey)!;
  }

  const creationPromise = (async () => {
    if (folderCache.has(cacheKey)) {
      return folderCache.get(cacheKey)!;
    }

    const existingFolder = await prisma.file.findFirst({
      where: {
        name: folderName,
        uploaderId: user.id,
        isFolder: true,
        isDeleted: false,
        parentId: parentId,
      },
    });

    if (existingFolder) {
      folderCache.set(cacheKey, existingFolder.id);
      return existingFolder.id;
    }

    const folder = await prisma.file.create({
      data: {
        name: folderName,
        filename: folderName,
        path: folderPath,
        uploaderId: user.id,
        isFolder: true,
        tags: processedTags,
        parentId: parentId,
      },
    });

    folderCache.set(cacheKey, folder.id);
    return folder.id;
  })();

  folderCreationLocks.set(cacheKey, creationPromise);

  try {
    return await creationPromise;
  } finally {
    folderCreationLocks.delete(cacheKey);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isFolderUpload = formData.get('isFolderUpload') === 'true';
    const relativePath = formData.get('relativePath') as string;
    const folderName = formData.get('folderName') as string;
    const tags = formData.get('tags') as string;
    const parentIdStr = formData.get('parentId') as string | null;
    const parentId = parentIdStr && parentIdStr !== 'null' ? parentIdStr : null;
    
    if (!file) {
      return NextResponse.json({ error: '没有找到文件' }, { status: 400 });
    }

    console.log('开始处理上传请求:', {
      isFolderUpload,
      relativePath,
      folderName,
      fileName: file.name,
      parentId,
      parentIdStr,
      fileSize: file.size,
      fileType: file.type
    });

    const processedTags = tags?.trim() 
      ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    const uploadDir = join(process.cwd(), 'uploads', uuidv4());
    await mkdir(uploadDir, { recursive: true });
    console.log('创建上传目录:', uploadDir);

    let parentFolder = null;
    if (parentId) {
      parentFolder = await prisma.file.findFirst({
        where: {
          id: parentId,
          uploaderId: user.id,
          isFolder: true,
          isDeleted: false,
        },
      });
      console.log('找到父文件夹:', parentFolder);
    }

    let filePath;
    let fileRelativePath;
    let parentFolderId = parentId;

    if (isFolderUpload && relativePath) {
      try {
        // 解析相对路径
        const pathParts = relativePath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const folderParts = pathParts.slice(0, -1);
        
        console.log('解析上传路径:', {
          pathParts,
          fileName,
          folderParts,
          rootFolderName: folderName || pathParts[0]
        });

        // 创建或获取根文件夹
        if (folderParts.length > 0) {
          const rootFolderName = folderName || folderParts[0];
          console.log('准备创建根文件夹:', rootFolderName);

          // 检查根文件夹是否已存在
          let rootFolder = await prisma.file.findFirst({
            where: {
              name: rootFolderName,
              uploaderId: user.id,
              isFolder: true,
              isDeleted: false,
              parentId: parentId,
            },
          });
          console.log('检查根文件夹是否存在:', rootFolder);

          if (!rootFolder) {
            // 创建根文件夹记录
            const rootPath = parentFolder 
              ? join(parentFolder.path, rootFolderName)
              : rootFolderName;

            rootFolder = await prisma.file.create({
              data: {
                name: rootFolderName,
                filename: rootFolderName,
                path: rootPath,
                uploaderId: user.id,
                isFolder: true,
                parentId: parentId,
                tags: processedTags,
                type: 'folder',
                size: 0,
              },
            });
            console.log('根文件夹创建成功:', rootFolder);
          }
          
          parentFolderId = rootFolder.id;

          // 创建子文件夹层级
          let currentParentId = parentFolderId;
          let currentPath = rootFolder.path;

          // 从第二个文件夹开始处理（跳过根文件夹）
          for (let i = 1; i < folderParts.length; i++) {
            const folderPart = folderParts[i];
            if (!folderPart) continue;

            currentPath = join(currentPath, folderPart);
            console.log('准备创建子文件夹:', {
              folderPart,
              currentPath,
              currentParentId
            });

            // 检查子文件夹是否已存在
            let subFolder = await prisma.file.findFirst({
              where: {
                name: folderPart,
                uploaderId: user.id,
                isFolder: true,
                isDeleted: false,
                parentId: currentParentId,
              },
            });
            console.log('检查子文件夹是否存在:', subFolder);

            if (!subFolder) {
              // 创建子文件夹记录
              subFolder = await prisma.file.create({
                data: {
                  name: folderPart,
                  filename: folderPart,
                  path: currentPath,
                  uploaderId: user.id,
                  isFolder: true,
                  parentId: currentParentId,
                  tags: [],
                  type: 'folder',
                  size: 0,
                },
              });
              console.log('子文件夹创建成功:', subFolder);
            }

            currentParentId = subFolder.id;
          }

          parentFolderId = currentParentId;
          console.log('文件夹层级创建完成，最终父文件夹ID:', parentFolderId);
        }

        // 设置文件路径
        if (parentFolder) {
          filePath = join(uploadDir, parentFolder.path.startsWith('/') 
            ? parentFolder.path.substring(1) 
            : parentFolder.path, relativePath);
        } else {
          filePath = join(uploadDir, relativePath);
        }
        
        await mkdir(dirname(filePath), { recursive: true });
        console.log('创建文件存储目录:', dirname(filePath));

        // 如果是空文件夹，直接返回
        if (file.size === 0 && !file.type) {
          console.log('检测到空文件夹，跳过文件创建');
          return NextResponse.json({
            message: '文件夹创建成功',
            file: {
              id: parentFolderId,
              name: fileName,
              path: relativePath,
            },
          });
        }
      } catch (error) {
        console.error('文件夹处理错误:', error);
        throw error;
      }
    } else {
      if (parentFolder) {
        filePath = join(uploadDir, parentFolder.path.startsWith('/') 
          ? parentFolder.path.substring(1) 
          : parentFolder.path, file.name);
      } else {
        filePath = join(uploadDir, file.name);
      }
    }

    // 保存文件
    console.log('准备保存文件:', {
      name: file.name,
      path: filePath,
      parentFolderId,
      size: file.size,
      type: file.type
    });

    // 创建目标目录
    await mkdir(dirname(filePath), { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    console.log('文件内容已写入磁盘');

    // 计算相对路径
    fileRelativePath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
    if (!fileRelativePath.startsWith('/')) {
      fileRelativePath = '/' + fileRelativePath;
    }

    const fileRecord = await prisma.file.create({
      data: {
        name: file.name,
        filename: file.name,
        path: fileRelativePath,
        uploaderId: user.id,
        isFolder: false,
        parentId: parentFolderId,
        tags: processedTags,
        data: buffer,
        type: file.type || 'application/octet-stream',
        size: buffer.length
      },
    });
    console.log('文件记录已创建:', fileRecord);

    return NextResponse.json({
      message: '文件上传成功',
      file: fileRecord,
    });
  } catch (error) {
    console.error('上传错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败，请重试' },
      { status: 500 }
    );
  }
} 