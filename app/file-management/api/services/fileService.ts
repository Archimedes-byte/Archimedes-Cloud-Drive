import { PrismaClient, Prisma } from '@prisma/client';
import { ExtendedFile, FileType } from '@/app/types';

const prisma = new PrismaClient();

export class FileService {
  // 获取文件列表
  static async getFiles(
    userId: string,
    folderId: string | null = null,
    type: FileType | null = null,
    page: number = 1,
    pageSize: number = 20
  ) {
    const where: Prisma.FileWhereInput = {
      uploaderId: userId,
      isDeleted: false,
      ...(folderId ? { parentId: folderId } : { parentId: null }),
      ...(type ? { type } : {})
    };

    const [total, files] = await Promise.all([
      prisma.file.count({ where }),
      prisma.file.findMany({
        where,
        orderBy: [
          { isFolder: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      items: files.map(this.mapToExtendedFile),
      total,
      page,
      pageSize
    };
  }

  // 搜索文件
  static async searchFiles(
    userId: string,
    query: string,
    type: FileType | null = null
  ) {
    const files = await prisma.file.findMany({
      where: {
        uploaderId: userId,
        isDeleted: false,
        ...(type ? { type } : {}),
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            tags: {
              hasSome: [query]
            }
          }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return files.map(this.mapToExtendedFile);
  }

  // 创建文件记录
  static async createFile(data: Prisma.FileCreateInput) {
    const file = await prisma.file.create({ data });
    return this.mapToExtendedFile(file);
  }

  // 更新文件
  static async updateFile(
    fileId: string,
    userId: string,
    data: Partial<Prisma.FileUpdateInput>
  ) {
    const file = await prisma.file.update({
      where: {
        id: fileId,
        uploaderId: userId,
        isDeleted: false
      },
      data
    });
    return this.mapToExtendedFile(file);
  }

  // 删除文件
  static async deleteFiles(fileIds: string[], userId: string) {
    const result = await prisma.file.updateMany({
      where: {
        id: { in: fileIds },
        uploaderId: userId,
        isDeleted: false
      },
      data: {
        isDeleted: true,
        updatedAt: new Date()
      }
    });
    return result.count;
  }

  // 移动文件
  static async moveFiles(
    fileIds: string[],
    targetFolderId: string,
    userId: string
  ) {
    const result = await prisma.file.updateMany({
      where: {
        id: { in: fileIds },
        uploaderId: userId,
        isDeleted: false
      },
      data: {
        parentId: targetFolderId,
        updatedAt: new Date()
      }
    });
    return result.count;
  }

  // 将数据库模型转换为扩展文件类型
  private static mapToExtendedFile(file: any): ExtendedFile {
    return {
      id: file.id,
      name: file.name,
      size: file.size || 0,
      type: file.type as FileType,
      isFolder: file.isFolder,
      isDeleted: file.isDeleted || false,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      uploaderId: file.uploaderId,
      path: file.path,
      tags: file.tags as string[],
      parentId: file.parentId,
      extension: file.name.split('.').pop(),
      fullPath: file.path
    };
  }
} 