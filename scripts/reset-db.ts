import { PrismaClient } from '@prisma/client';

/**
 * 数据库重置脚本
 * 该脚本会清空数据库中的所有数据，但保留数据库结构
 * 请谨慎使用！
 */

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('开始清空数据库...');
    
    // 按照关系依赖顺序删除数据
    // 首先删除具有外键依赖的表
    console.log('删除分享记录...');
    await prisma.share.deleteMany();
    
    console.log('删除文件...');
    await prisma.file.deleteMany();
    
    console.log('删除文件夹...');
    await prisma.folder.deleteMany();
    
    console.log('删除用户资料...');
    await prisma.userProfile.deleteMany();
    
    console.log('删除维护日志...');
    await prisma.maintenanceLog.deleteMany();
    
    console.log('删除用户...');
    await prisma.user.deleteMany();
    
    console.log('数据库清空完成！');
  } catch (error) {
    console.error('清空数据库过程中出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 