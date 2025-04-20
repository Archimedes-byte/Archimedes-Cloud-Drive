// 数据库重置脚本
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('开始重置数据库...');
    
    // 删除所有现有数据
    console.log('删除现有数据...');
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF;`;
    
    // 在此添加需要清空的表格
    const tables = [
      'File',
      'User',
      'Account',
      'Session',
      'VerificationToken'
    ];
    
    for (const table of tables) {
      await prisma.$executeRaw`DELETE FROM ${table}`;
      console.log(`表 ${table} 已清空`);
    }
    
    await prisma.$executeRaw`PRAGMA foreign_keys = ON;`;
    
    console.log('所有表已清空');
    
    // 可以在这里添加种子数据
    console.log('添加种子数据...');
    
    // 示例：创建默认管理员用户
    await prisma.user.create({
      data: {
        name: '管理员',
        email: 'admin@example.com',
        password: '$2a$10$qlakjdkadjadjlkadkasldkladjklasjkldajsldkj', // 示例哈希密码
      }
    });
    
    console.log('数据库重置完成!');
  } catch (error) {
    console.error('数据库重置失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行重置
resetDatabase(); 