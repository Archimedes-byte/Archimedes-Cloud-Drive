/**
 * 旧API路由清理脚本
 * 
 * 此脚本用于标识和删除旧的API路由文件
 * 请在迁移完成并确认新API正常工作后运行
 * 
 * 使用方法:
 * 1. 先运行 node tools/cleanup-old-apis.js identify - 只标识旧API路由，不删除
 * 2. 确认后运行 node tools/cleanup-old-apis.js delete - 删除旧API路由
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

// 旧API路径模式
const OLD_API_PATTERNS = [
  '/app/api/files',
  '/app/api/folders',
];

// 排除这些文件（保留的文件）
const EXCLUDE_PATTERNS = [
  '/app/api/files/serve', // 文件服务路由可能仍需要保留
];

// 记录文件
let filesToDelete = [];
let dirsToDelete = [];

/**
 * 递归扫描目录
 */
async function scanDirectory(directory) {
  const files = await readdir(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stats = await stat(fullPath);
    
    // 跳过排除的路径
    if (EXCLUDE_PATTERNS.some(pattern => fullPath.includes(pattern))) {
      console.log(`跳过排除的路径: ${fullPath}`);
      continue;
    }
    
    if (stats.isDirectory()) {
      // 如果是旧API目录，记录它和其下所有文件
      if (OLD_API_PATTERNS.some(pattern => fullPath.includes(pattern))) {
        // 只记录目录，不删除
        if (!dirsToDelete.includes(fullPath)) {
          dirsToDelete.push(fullPath);
        }
        
        // 递归扫描子目录
        await scanDirectory(fullPath);
      }
    } else {
      // 文件：检查是否在旧API目录下
      if (OLD_API_PATTERNS.some(pattern => fullPath.includes(pattern))) {
        filesToDelete.push(fullPath);
      }
    }
  }
}

/**
 * 标识旧API文件，但不删除
 */
async function identifyOldApis() {
  console.log('标识旧API路由文件...');
  
  // 扫描API目录
  await scanDirectory(path.join(process.cwd(), 'app/api'));
  
  console.log('\n找到以下旧API文件:');
  filesToDelete.forEach(file => console.log(`- ${file}`));
  
  console.log('\n找到以下旧API目录:');
  dirsToDelete.forEach(dir => console.log(`- ${dir}`));
  
  console.log(`\n总计: ${filesToDelete.length} 个文件, ${dirsToDelete.length} 个目录`);
  console.log('\n要删除这些文件，请运行: node tools/cleanup-old-apis.js delete');
}

/**
 * 删除旧API文件
 */
async function deleteOldApis() {
  console.log('删除旧API路由文件...');
  
  // 先扫描API目录
  await scanDirectory(path.join(process.cwd(), 'app/api'));
  
  // 删除文件
  for (const file of filesToDelete) {
    try {
      console.log(`删除文件: ${file}`);
      await unlink(file);
    } catch (err) {
      console.error(`删除文件 ${file} 失败:`, err);
    }
  }
  
  // 按照目录深度排序，确保先删除子目录
  const sortedDirs = dirsToDelete.sort((a, b) => {
    const depthA = a.split(path.sep).length;
    const depthB = b.split(path.sep).length;
    return depthB - depthA; // 降序，深度更大的先删除
  });
  
  // 删除目录
  for (const dir of sortedDirs) {
    try {
      console.log(`删除目录: ${dir}`);
      await rmdir(dir);
    } catch (err) {
      console.error(`删除目录 ${dir} 失败:`, err);
    }
  }
  
  console.log(`\n操作完成. 删除了 ${filesToDelete.length} 个文件, ${dirsToDelete.length} 个目录`);
}

/**
 * 主函数
 */
async function main() {
  const command = process.argv[2];
  
  if (!command || (command !== 'identify' && command !== 'delete')) {
    console.log('用法:');
    console.log('  node tools/cleanup-old-apis.js identify  - 标识旧API路由，不删除');
    console.log('  node tools/cleanup-old-apis.js delete    - 删除旧API路由');
    process.exit(1);
  }
  
  try {
    if (command === 'identify') {
      await identifyOldApis();
    } else if (command === 'delete') {
      await deleteOldApis();
    }
  } catch (err) {
    console.error('脚本执行失败:', err);
    process.exit(1);
  }
}

// 执行主函数
main().catch(console.error); 