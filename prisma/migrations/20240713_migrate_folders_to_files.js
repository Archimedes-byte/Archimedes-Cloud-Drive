const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

/**
 * 将Folder表中的数据迁移到File表中的脚本
 * 该脚本会将Folder中的所有记录转换为File表中的记录，并保持父子关系
 */
async function migrateFoldersToFiles() {
  console.log('开始迁移文件夹数据到文件表...');
  
  try {
    // 1. 获取所有文件夹记录
    const folders = await prisma.folder.findMany({
      include: {
        parent: true,
        owner: true
      }
    });
    
    console.log(`找到 ${folders.length} 个文件夹需要迁移`);
    
    // 2. 文件夹ID映射表（旧ID → 新ID）
    const folderIdMap = new Map();
    
    // 3. 处理每个文件夹，转换为文件记录
    for (const folder of folders) {
      // 检查该文件夹是否已经在File表中存在
      const existingFile = await prisma.file.findFirst({
        where: {
          name: folder.name,
          uploaderId: folder.userId,
          isFolder: true,
          parentId: folder.parentId ? folderIdMap.get(folder.parentId) : null
        }
      });
      
      if (existingFile) {
        console.log(`文件夹 "${folder.name}" (ID: ${folder.id}) 已存在于File表中，跳过`);
        folderIdMap.set(folder.id, existingFile.id);
        continue;
      }
      
      // 创建新的文件ID
      const newFileId = uuidv4();
      folderIdMap.set(folder.id, newFileId);
      
      // 创建文件记录
      await prisma.file.create({
        data: {
          id: newFileId,
          name: folder.name,
          filename: folder.name,
          path: `/${folder.name}`,
          type: 'folder',
          size: 0,
          isFolder: true,
          uploaderId: folder.userId,
          parentId: folder.parentId ? folderIdMap.get(folder.parentId) : null,
          tags: [],
          url: null,
          updatedAt: folder.updatedAt,
          createdAt: folder.createdAt
        }
      });
      
      console.log(`迁移文件夹 "${folder.name}" (ID: ${folder.id}) 到File表，新ID: ${newFileId}`);
    }
    
    // 4. 第二次遍历文件夹，更新父子关系
    for (const folder of folders) {
      if (folder.parentId) {
        // 更新文件记录的父ID
        await prisma.file.update({
          where: {
            id: folderIdMap.get(folder.id)
          },
          data: {
            parentId: folderIdMap.get(folder.parentId)
          }
        });
        
        console.log(`更新文件夹 "${folder.name}" 的父子关系`);
      }
    }
    
    console.log('文件夹数据迁移完成！');
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行迁移
migrateFoldersToFiles()
  .then(() => console.log('迁移脚本执行完毕'))
  .catch(e => console.error('迁移脚本执行失败:', e)); 