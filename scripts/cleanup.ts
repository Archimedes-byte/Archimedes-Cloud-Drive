import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log('开始清理已删除的文件...');

    // 获取所有已标记为删除的文件
    const deletedFiles = await prisma.file.findMany({
      where: {
        isDeleted: true,
        isFolder: false
      }
    });

    console.log(`找到 ${deletedFiles.length} 个已删除的文件记录`);

    // 删除物理文件
    let deletedCount = 0;
    let errorCount = 0;

    for (const file of deletedFiles) {
      const filePath = join(process.cwd(), file.path);
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
          deletedCount++;
          console.log(`成功删除文件: ${filePath}`);
        } catch (error) {
          errorCount++;
          console.error(`删除文件失败: ${filePath}`, error);
        }
      }
    }

    console.log('清理完成!');
    console.log(`成功删除: ${deletedCount} 个文件`);
    console.log(`失败: ${errorCount} 个文件`);

  } catch (error) {
    console.error('清理过程出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup(); 