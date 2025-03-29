import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { maintenanceConfig } from '@/config/maintenance';

// 每天凌晨3点运行
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // 验证请求来源
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: '未授权的访问' }, { status: 401 });
    }

    const startTime = Date.now();
    const { retention, thresholds, logging } = maintenanceConfig;
    const retentionDate = new Date(Date.now() - retention.deletedFiles * 24 * 60 * 60 * 1000);

    if (logging.verbose) {
      console.log('开始清理任务:', {
        retentionDays: retention.deletedFiles,
        retentionDate,
        maxFiles: thresholds.maxFilesPerRun,
        maxFolders: thresholds.maxFoldersPerRun
      });
    }

    // 获取要删除的文件（限制数量）
    const deletedFiles = await prisma.file.findMany({
      where: {
        isDeleted: true,
        isFolder: false,
        deletedAt: {
          lt: retentionDate
        }
      },
      take: thresholds.maxFilesPerRun
    });

    // 删除物理文件
    let deletedCount = 0;
    let errorCount = 0;

    for (const file of deletedFiles) {
      const filePath = join(process.cwd(), file.path);
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
          deletedCount++;
          if (logging.verbose) {
            console.log('物理文件已删除:', filePath);
          }
        } catch (error) {
          errorCount++;
          console.error('删除物理文件失败:', filePath, error);
        }
      }
    }

    // 清理空文件夹
    const emptyFolders = await prisma.file.findMany({
      where: {
        isDeleted: true,
        isFolder: true,
        deletedAt: {
          lt: retentionDate
        }
      },
      take: thresholds.maxFoldersPerRun
    });

    let deletedFolderCount = 0;
    for (const folder of emptyFolders) {
      const folderPath = join(process.cwd(), folder.path);
      if (existsSync(folderPath)) {
        try {
          // 检查文件夹是否为空
          const files = await prisma.file.findMany({
            where: {
              parentId: folder.id,
              isDeleted: false
            }
          });

          if (files.length === 0) {
            await unlink(folderPath);
            deletedFolderCount++;
            if (logging.verbose) {
              console.log('空文件夹已删除:', folderPath);
            }
          }
        } catch (error) {
          console.error('删除空文件夹失败:', folderPath, error);
        }
      }
    }

    // 从数据库中永久删除记录
    const { count: deletedRecords } = await prisma.file.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: {
          lt: retentionDate
        }
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 如果启用了历史记录，保存清理记录
    if (logging.saveHistory) {
      await prisma.maintenanceLog.create({
        data: {
          type: 'cleanup',
          details: {
            deletedFiles: deletedCount,
            deletedFolders: deletedFolderCount,
            deletedRecords,
            errorCount,
            duration
          }
        }
      });
    }

    return NextResponse.json({
      message: '定时清理完成',
      stats: {
        deletedFiles: deletedCount,
        deletedFolders: deletedFolderCount,
        deletedRecords,
        errorCount,
        duration: `${duration / 1000}秒`
      }
    });
  } catch (error) {
    console.error('定时清理出错:', error);
    return NextResponse.json(
      { error: '清理失败，请检查日志' },
      { status: 500 }
    );
  }
} 