// 清空所有数据文件和迁移记录的脚本
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const prisma = new PrismaClient();

async function cleanAllData() {
  try {
    console.log('开始清空所有数据...');
    
    // 1. 清空上传目录
    console.log('清空上传目录...');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
      console.log(`已删除 ${files.length} 个上传文件`);
    }
    
    // 2. 清空数据库数据
    console.log('清空数据库数据...');
    
    // 对于PostgreSQL，使用事务代替PRAGMA
    await prisma.$transaction(async (tx) => {
      // 在PostgreSQL中禁用外键约束
      await tx.$executeRawUnsafe(`SET CONSTRAINTS ALL DEFERRED`);
      
      const tables = [
        'File',
        'User',
        'Account',
        'Session',
        'VerificationToken',
        'FileAccessHistory',
        'DownloadHistory',
        'FavoriteFolder',
        'UserProfile',
        'MaintenanceLog'
      ];
      
      for (const table of tables) {
        try {
          // 为表名添加双引号，避免PostgreSQL保留字问题
          await tx.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
          console.log(`表 ${table} 已清空`);
        } catch (e) {
          console.log(`表 ${table} 清空失败: ${e.message}`);
        }
      }
      
      // 启用外键约束
      await tx.$executeRawUnsafe(`SET CONSTRAINTS ALL IMMEDIATE`);
    });
    
    console.log('数据库数据已清空');
    
    // 3. 重置迁移记录 (可选，谨慎操作)
    const resetMigrations = false; // 设置为 true 来重置迁移记录
    if (resetMigrations) {
      console.log('警告: 重置迁移记录将会删除数据库架构！需要重新应用迁移。');
      console.log('重置迁移记录...');
      
      // 对于PostgreSQL，不需要删除数据库文件
      // 直接清理迁移记录目录
      
      // 只保留 migration_lock.toml，删除其他迁移记录
      const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
      if (fs.existsSync(migrationsDir)) {
        const items = fs.readdirSync(migrationsDir);
        for (const item of items) {
          const itemPath = path.join(migrationsDir, item);
          if (item !== 'migration_lock.toml' && fs.statSync(itemPath).isDirectory()) {
            fs.rmdirSync(itemPath, { recursive: true });
          }
        }
        console.log('迁移记录已重置');
      }
      
      // 重新创建数据库架构
      console.log('重新应用迁移...');
      await execPromise('npx prisma migrate dev --name init');
    }
    
    console.log('所有数据已清空完成！');

  } catch (error) {
    console.error('清空数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行清空操作
cleanAllData(); 