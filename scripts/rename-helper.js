/**
 * 目录重命名辅助脚本
 * 用于生成目录重命名和导入路径修复的命令
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// 需要重命名的目录映射
const RENAME_MAPPINGS = [
  {
    from: 'app/components/features/fileManagement',
    to: 'app/components/features/file-management',
    pattern: /fileManagement/g,
    replacement: 'file-management'
  },
  {
    from: 'app/components/features/userProfile',
    to: 'app/components/features/user-profile',
    pattern: /userProfile/g,
    replacement: 'user-profile'
  },
  // 添加其他需要重命名的目录
];

// 需要重命名的文件映射
const FILE_RENAME_MAPPINGS = [
  {
    from: 'app/services/storage-service.ts',
    to: 'app/services/storageService.ts',
    pattern: /storage-service/g,
    replacement: 'storageService'
  },
  // 添加其他需要重命名的文件
];

// 需要创建的文件映射
const CREATE_MAPPINGS = [
  {
    source: 'app/components/features/userProfile/avatar/AvatarCropper.module.css',
    target: 'app/components/features/userProfile/avatar/AvatarModal.module.css',
    fileUpdate: {
      file: 'app/components/features/userProfile/avatar/AvatarModal.tsx',
      pattern: /from\s+['"]\.\/AvatarCropper\.module\.css['"]/g,
      replacement: `from './AvatarModal.module.css'`
    }
  },
  // 添加其他需要创建的文件
];

/**
 * 生成目录重命名命令
 */
async function generateDirectoryRenameCommands() {
  console.log('\n===== 目录重命名命令 =====\n');
  
  for (const mapping of RENAME_MAPPINGS) {
    const { from, to } = mapping;
    
    // 检查源目录是否存在
    try {
      await stat(from);
      // 检查目标目录是否已存在
      try {
        await stat(to);
        console.log(`警告: 目标目录 ${to} 已存在`);
      } catch (err) {
        // 目标目录不存在，可以重命名
        if (process.platform === 'win32') {
          console.log(`mkdir -p "${path.dirname(to)}"`);
          console.log(`Move-Item -Path "${from}" -Destination "${to}"`);
        } else {
          console.log(`mkdir -p "${path.dirname(to)}"`);
          console.log(`mv "${from}" "${to}"`);
        }
      }
    } catch (err) {
      console.log(`警告: 源目录 ${from} 不存在`);
    }
  }
}

/**
 * 生成文件重命名命令
 */
async function generateFileRenameCommands() {
  console.log('\n===== 文件重命名命令 =====\n');
  
  for (const mapping of FILE_RENAME_MAPPINGS) {
    const { from, to } = mapping;
    
    // 检查源文件是否存在
    try {
      await stat(from);
      // 检查目标文件是否已存在
      try {
        await stat(to);
        console.log(`警告: 目标文件 ${to} 已存在`);
      } catch (err) {
        // 目标文件不存在，可以重命名
        if (process.platform === 'win32') {
          console.log(`mkdir -p "${path.dirname(to)}"`);
          console.log(`Move-Item -Path "${from}" -Destination "${to}"`);
        } else {
          console.log(`mkdir -p "${path.dirname(to)}"`);
          console.log(`mv "${from}" "${to}"`);
        }
      }
    } catch (err) {
      console.log(`警告: 源文件 ${from} 不存在`);
    }
  }
}

/**
 * 生成文件创建命令
 */
async function generateFileCreateCommands() {
  console.log('\n===== 文件创建命令 =====\n');
  
  for (const mapping of CREATE_MAPPINGS) {
    const { source, target } = mapping;
    
    // 检查源文件是否存在
    try {
      await stat(source);
      // 检查目标文件是否已存在
      try {
        await stat(target);
        console.log(`警告: 目标文件 ${target} 已存在`);
      } catch (err) {
        // 目标文件不存在，可以创建
        if (process.platform === 'win32') {
          console.log(`mkdir -p "${path.dirname(target)}"`);
          console.log(`Copy-Item -Path "${source}" -Destination "${target}"`);
        } else {
          console.log(`mkdir -p "${path.dirname(target)}"`);
          console.log(`cp "${source}" "${target}"`);
        }
      }
    } catch (err) {
      console.log(`警告: 源文件 ${source} 不存在`);
    }
  }
}

/**
 * 扫描项目文件查找导入引用路径
 */
async function scanForImportReferences() {
  console.log('\n===== 导入路径引用修复 =====\n');
  
  // 扫描文件的目录
  const dirsToScan = ['app', 'scripts', 'prisma'];
  
  // 存储需要修改的文件
  const filesToFix = [];
  
  // 创建正则表达式，匹配所有需要替换的模式
  const patterns = RENAME_MAPPINGS.map(m => m.pattern);
  const replacements = RENAME_MAPPINGS.map(m => m.replacement);
  
  /**
   * 递归检查目录中的文件
   */
  async function scanDirectory(directory) {
    try {
      const entries = await readdir(directory);
      
      for (const entry of entries) {
        // 跳过node_modules和.git目录
        if (entry === 'node_modules' || entry === '.git' || entry === '.next' || entry === 'dist') {
          continue;
        }
        
        const fullPath = path.join(directory, entry);
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          // 递归检查子目录
          await scanDirectory(fullPath);
        } else if (stats.isFile()) {
          // 只检查JavaScript、TypeScript和JSON文件
          if (/\.(js|jsx|ts|tsx|json)$/.test(entry)) {
            try {
              const content = await readFile(fullPath, 'utf8');
              
              // 检查文件内容中是否包含需要替换的路径
              let hasMatch = false;
              let updatedContent = content;
              
              for (let i = 0; i < patterns.length; i++) {
                if (patterns[i].test(content)) {
                  hasMatch = true;
                  updatedContent = updatedContent.replace(patterns[i], replacements[i]);
                }
              }
              
              if (hasMatch) {
                filesToFix.push({
                  path: fullPath,
                  oldContent: content,
                  newContent: updatedContent
                });
              }
            } catch (err) {
              console.error(`读取文件 ${fullPath} 时出错:`, err);
            }
          }
        }
      }
    } catch (error) {
      console.error(`扫描目录 ${directory} 时出错:`, error);
    }
  }
  
  // 扫描指定的目录
  for (const dir of dirsToScan) {
    await scanDirectory(dir);
  }
  
  // 输出结果
  console.log(`找到 ${filesToFix.length} 个文件需要更新导入路径:`);
  
  for (const file of filesToFix) {
    console.log(`\n文件: ${file.path}`);
    
    // 生成替换内容的差异
    const oldLines = file.oldContent.split('\n');
    const newLines = file.newContent.split('\n');
    
    for (let i = 0; i < oldLines.length; i++) {
      if (oldLines[i] !== newLines[i]) {
        console.log(`行 ${i + 1}:`);
        console.log(`- ${oldLines[i]}`);
        console.log(`+ ${newLines[i]}`);
      }
    }
  }
  
  console.log('\n===== 自动修复命令 =====\n');
  
  if (filesToFix.length > 0) {
    console.log('要自动修复所有文件，请运行以下命令:\n');
    console.log('node scripts/fix-imports.js');
    
    // 创建自动修复脚本
    const fixScript = `/**
 * 自动修复导入路径脚本
 * 由rename-helper.js自动生成
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);

// 需要修复的文件
const filesToFix = ${JSON.stringify(filesToFix.map(f => ({ path: f.path, newContent: f.newContent })), null, 2)};

async function fixImports() {
  console.log('开始修复导入路径...');
  
  for (const file of filesToFix) {
    try {
      await writeFile(file.path, file.newContent, 'utf8');
      console.log(\`已修复: \${file.path}\`);
    } catch (err) {
      console.error(\`修复文件 \${file.path} 时出错:\`, err);
    }
  }
  
  console.log('\\n修复完成!');
}

fixImports().catch(err => {
  console.error('修复导入路径时出错:', err);
  process.exit(1);
});
`;
    
    // 写入修复脚本
    await writeFile('scripts/fix-imports.js', fixScript, 'utf8');
    console.log('已创建自动修复脚本: scripts/fix-imports.js');
  } else {
    console.log('没有找到需要修复的文件');
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('项目命名规范修复辅助工具');
  console.log('==========================\n');
  
  await generateDirectoryRenameCommands();
  await generateFileRenameCommands();
  await generateFileCreateCommands();
  await scanForImportReferences();
  
  console.log('\n===== 修复建议 =====\n');
  console.log('1. 先执行目录重命名命令');
  console.log('2. 创建缺失的样式文件');
  console.log('3. 重命名问题文件');
  console.log('4. 运行自动修复脚本更新导入路径');
  console.log('5. 运行项目确认没有错误');
}

// 运行程序
main().catch(error => {
  console.error('脚本执行出错:', error);
  process.exit(1);
}); 