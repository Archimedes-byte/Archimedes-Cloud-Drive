import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/app/lib/database';
import { authOptions } from '@/app/lib/auth';

/**
 * 保存分享文件到自己的网盘
 * POST /api/storage/share/save
 */
export async function POST(request: NextRequest) {
  try {
    console.log('开始处理保存分享文件请求');
    
    // 解析请求体
    const body = await request.json();
    const { shareCode, extractCode, fileId, folderId, isFolder } = body;
    
    console.log('保存分享文件请求参数:', JSON.stringify({
      shareCode,
      hasExtractCode: !!extractCode,
      fileId,
      targetFolderId: folderId || 'root',
      isFolder: !!isFolder
    }));

    if (!shareCode) {
      return NextResponse.json({ success: false, error: '分享链接无效' }, { status: 400 });
    }

    if (!fileId) {
      return NextResponse.json({ success: false, error: '请指定要保存的文件' }, { status: 400 });
    }

    // 获取当前用户会话
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // 查找分享记录
    const share = await prisma.fileShare.findUnique({
      where: {
        shareCode,
      },
      include: {
        files: {
          include: {
            file: true
          }
        }
      }
    });

    if (!share) {
      return NextResponse.json({ success: false, error: '分享链接不存在或已失效' }, { status: 404 });
    }

    // 验证提取码
    if (share.extractCode && share.extractCode !== extractCode && !share.autoFillCode) {
      return NextResponse.json({ success: false, error: '提取码错误' }, { status: 403 });
    }

    // 检查分享是否过期
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: '分享链接已过期' }, { status: 410 });
    }

    // 验证目标文件夹权限（如果指定了文件夹）
    if (folderId) {
      const targetFolder = await prisma.folder.findUnique({
        where: {
          id: folderId,
          userId
        }
      });

      if (!targetFolder) {
        return NextResponse.json({ success: false, error: '目标文件夹不存在或没有权限' }, { status: 403 });
      }
    }

    // 处理不同的保存类型（文件或文件夹）
    if (isFolder) {
      // 保存文件夹
      return await saveFolder(fileId, userId, folderId, shareCode, extractCode);
    } else {
      // 保存单个文件
      return await saveFile(fileId, userId, folderId, share);
    }
  } catch (error) {
    console.error('保存分享文件时出错:', error);
    return NextResponse.json(
      { success: false, error: '保存失败', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * 保存单个文件
 */
async function saveFile(fileId: string, userId: string, folderId: string | null, share: any) {
  try {
    // 查找要保存的源文件
    const fileToSave = share.files.find((f: any) => f.fileId === fileId)?.file;
    
    if (!fileToSave) {
      return NextResponse.json({ success: false, error: '文件不存在或无权限访问' }, { status: 404 });
    }

    // 检查用户空间是否足够
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: '用户信息不存在' }, { status: 500 });
    }

    const availableSpace = user.storageLimit - user.storageUsed;
    if (fileToSave.size && fileToSave.size > availableSpace) {
      return NextResponse.json({ success: false, error: '存储空间不足' }, { status: 403 });
    }

    // 检查同名文件
    const existingFile = await prisma.file.findFirst({
      where: {
        name: fileToSave.name,
        parentId: folderId,
        uploaderId: userId
      }
    });

    let fileName = fileToSave.name;
    if (existingFile) {
      // 如果存在同名文件，添加(1)、(2)等后缀
      const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      const ext = fileName.substring(fileName.lastIndexOf('.')) || '';
      let counter = 1;
      let isUnique = false;
      
      while (!isUnique) {
        const newName = `${nameWithoutExt}(${counter})${ext}`;
        const exists = await prisma.file.findFirst({
          where: {
            name: newName,
            parentId: folderId,
            uploaderId: userId
          }
        });
        
        if (!exists) {
          fileName = newName;
          isUnique = true;
        } else {
          counter++;
        }
      }
    }

    // 复制文件记录
    const newFile = await prisma.file.create({
      data: {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 生成唯一ID
        name: fileName,
        filename: fileToSave.filename || fileName, // 使用原文件的filename或名称
        size: fileToSave.size,
        type: fileToSave.type,
        path: fileToSave.path, // 复用原文件的物理存储路径
        storagePath: fileToSave.storagePath,
        uploaderId: userId,
        parentId: folderId,
        updatedAt: new Date()
      }
    });

    // 更新用户存储空间使用量
    await prisma.user.update({
      where: { id: userId },
      data: {
        storageUsed: {
          increment: fileToSave.size || 0
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        file: newFile
      }
    });
  } catch (error) {
    console.error('保存文件时出错:', error);
    return NextResponse.json(
      { success: false, error: '保存文件失败', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * 递归保存文件夹及其内容
 */
async function saveFolder(folderId: string, userId: string, targetFolderId: string | null, shareCode: string, extractCode: string | null) {
  try {
    // 获取源文件夹信息
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/storage/share/folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shareCode,
        extractCode,
        folderId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ success: false, error: errorData.error || '获取文件夹信息失败' }, { status: response.status });
    }

    const data = await response.json();
    const folderInfo = data.data;
    
    if (!folderInfo) {
      return NextResponse.json({ success: false, error: '文件夹不存在或无权限访问' }, { status: 404 });
    }

    // 检查同名文件夹
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: folderInfo.name,
        parentId: targetFolderId,
        userId
      }
    });

    let folderName = folderInfo.name;
    if (existingFolder) {
      // 如果存在同名文件夹，添加(1)、(2)等后缀
      let counter = 1;
      let isUnique = false;
      
      while (!isUnique) {
        const newName = `${folderName}(${counter})`;
        const exists = await prisma.folder.findFirst({
          where: {
            name: newName,
            parentId: targetFolderId,
            userId
          }
        });
        
        if (!exists) {
          folderName = newName;
          isUnique = true;
        } else {
          counter++;
        }
      }
    }

    // 创建新文件夹
    const newFolder = await prisma.folder.create({
      data: {
        name: folderName,
        parentId: targetFolderId,
        userId
      }
    });

    // 处理文件夹内容
    const folderContents = folderInfo.contents || [];
    let savedFilesCount = 0;
    let totalSize = 0;

    // 检查用户空间是否足够
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: '用户信息不存在' }, { status: 500 });
    }

    // 计算所有文件的总大小
    for (const item of folderContents) {
      if (!item.isFolder) {
        totalSize += item.size || 0;
      }
    }

    const availableSpace = user.storageLimit - user.storageUsed;
    if (totalSize > availableSpace) {
      // 清理已创建的文件夹
      await prisma.folder.delete({
        where: { id: newFolder.id }
      });
      return NextResponse.json({ success: false, error: '存储空间不足' }, { status: 403 });
    }

    // 保存文件夹内的文件
    for (const item of folderContents) {
      if (item.isFolder) {
        // 递归保存子文件夹
        await saveFolder(item.id, userId, newFolder.id, shareCode, extractCode);
      } else {
        try {
          // 查找要保存的源文件
          const fileDetails = await prisma.file.findUnique({
            where: { id: item.id }
          });
          
          if (fileDetails) {
            // 创建文件记录
            await prisma.file.create({
              data: {
                id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 生成唯一ID
                name: item.name,
                filename: fileDetails.filename || item.name,
                size: fileDetails.size,
                type: fileDetails.type,
                path: fileDetails.path, // 复用原文件的物理存储路径
                storagePath: fileDetails.storagePath,
                uploaderId: userId,
                parentId: newFolder.id,
                updatedAt: new Date()
              }
            });
            
            savedFilesCount++;
          }
        } catch (fileError) {
          console.error('保存文件时出错:', fileError);
          // 继续处理其他文件
        }
      }
    }

    // 更新用户存储空间使用量
    if (savedFilesCount > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          storageUsed: {
            increment: totalSize
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        folder: newFolder,
        savedFilesCount,
        totalSize
      }
    });
  } catch (error) {
    console.error('保存文件夹时出错:', error);
    return NextResponse.json(
      { success: false, error: '保存文件夹失败', details: (error as Error).message },
      { status: 500 }
    );
  }
} 