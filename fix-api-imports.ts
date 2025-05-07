/**
 * 修复API类型导入脚本
 * 
 * 此脚本用于帮助识别和修复项目中的API类型导入，
 * 确保所有API类型的导入都遵循统一规范：
 * 
 * 1. 优先从 @/app/types 导入类型
 * 2. 避免直接从 @/app/types/shared/api-types 导入
 * 3. 确保使用统一定义的类型，减少重复定义
 * 
 * 使用方法：
 * 1. 运行此脚本识别需要修改的文件
 * 2. 根据脚本输出手动更新导入语句
 */

import * as fs from 'fs';
import * as path from 'path';

// 要搜索的目录
const ROOT_DIR = './app';

// 要查找的导入模式
const PATTERN_TO_FIND = /from ['"]@\/app\/types\/shared\/api-types['"]/g;
// 理想的导入模式
const IDEAL_IMPORT = 'from \'@/app/types\'';

// 递归搜索文件
function searchFiles(dir: string): void {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory() && !filePath.includes('node_modules')) {
      searchFiles(filePath);
    } else if (stats.isFile() && (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
      checkFile(filePath);
    }
  }
}

// 检查文件中的导入语句
function checkFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (PATTERN_TO_FIND.test(content)) {
    // 重置正则表达式的lastIndex
    PATTERN_TO_FIND.lastIndex = 0;
    
    console.log(`在文件 ${filePath} 中找到直接导入:`);
    
    // 提取导入语句
    const importLines: string[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('from \'@/app/types/shared/api-types\'') || 
          lines[i].includes('from "@/app/types/shared/api-types"')) {
        importLines.push(`  行 ${i+1}: ${lines[i].trim()}`);
      }
    }
    
    // 输出找到的导入语句
    importLines.forEach(line => console.log(line));
    console.log(`  建议更改为: ${IDEAL_IMPORT}\n`);
  }
}

// 开始搜索
console.log('开始搜索直接导入 @/app/types/shared/api-types 的文件...\n');
searchFiles(ROOT_DIR);
console.log('搜索完成。请根据上述输出手动修改导入语句。'); 