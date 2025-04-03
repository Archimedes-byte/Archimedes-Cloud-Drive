import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files[]') as File[];
    const tags = JSON.parse(formData.get('tags') as string || '[]') as string[];
    const folderId = formData.get('folderId') as string | null;

    if (files.length === 0) {
      return NextResponse.json(
        { error: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name;
      const fileId = uuidv4();
      const fileExtension = fileName.split('.').pop() || '';
      const filePath = join(UPLOAD_DIR, `${fileId}.${fileExtension}`);

      // 保存文件到磁盘
      await writeFile(filePath, buffer);

      // 获取文件类型
      const fileType = file.type.split('/')[0];
      const size = buffer.length;

      // 创建文件记录
      const fileRecord = await prisma.file.create({
        data: {
          id: fileId,
          name: fileName,
          filename: `${fileId}.${fileExtension}`,
          path: filePath,
          type: fileType,
          size,
          isFolder: false,
          uploaderId: session.user.id,
          tags,
          parentId: folderId,
          url: `/api/files/${fileId}/content`
        }
      });

      uploadedFiles.push({
        id: fileRecord.id,
        name: fileRecord.name,
        size: fileRecord.size || 0,
        type: fileRecord.type,
        isFolder: fileRecord.isFolder,
        createdAt: fileRecord.createdAt.toISOString(),
        updatedAt: fileRecord.updatedAt.toISOString(),
        uploaderId: fileRecord.uploaderId,
        path: fileRecord.path,
        tags: fileRecord.tags as string[],
        parentId: fileRecord.parentId,
        extension: fileExtension,
        fullPath: fileRecord.path
      });
    }

    return NextResponse.json({
      success: true,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    return NextResponse.json(
      { error: '上传文件失败' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false
  }
}; 