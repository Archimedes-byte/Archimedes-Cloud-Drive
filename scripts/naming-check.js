/**
 * 项目命名规范检查脚本
 * 用于检查和报告不符合命名规范的文件和目录
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// 定义规范
const RULES = {
  // 目录应使用烤串式命名法(kebab-case)
  directory: {
    regex: /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
    exclude: ['node_modules', '.git', '.next', 'dist', '.vscode'],
    description: '目录应使用烤串式命名法(kebab-case)'
  },
  // React组件文件应使用帕斯卡命名法(PascalCase)
  component: {
    regex: /^[A-Z][a-zA-Z0-9]*\.(tsx|jsx)$/,
    description: 'React组件文件应使用帕斯卡命名法(PascalCase)'
  },
  // 非组件文件应使用驼峰命名法(camelCase)
  util: {
    regex: /^[a-z][a-zA-Z0-9]*\.(ts|js|json|mjs)$/,
    description: '非组件文件应使用驼峰命名法(camelCase)'
  },
  // 样式文件应与组件名匹配
  style: {
    regex: /^[A-Z][a-zA-Z0-9]*\.module\.(css|scss)$/,
    description: '样式文件应与组件名匹配并使用帕斯卡命名法(PascalCase)'
  }
};

// 待检查的目录
const DIRS_TO_CHECK = [
  'app',
  'scripts',
  'prisma',
  'public'
];

// 存储结果
const results = {
  directoryIssues: [],
  componentIssues: [],
  utilIssues: [],
  styleIssues: [],
  styleMismatchIssues: []
};

/**
 * 检查文件名是否符合规范
 */
function checkFileName(filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  
  // 排除Next.js特殊页面组件文件
  const nextJsSpecialFiles = ['page.tsx', 'layout.tsx', 'error.tsx', 'loading.tsx', 'not-found.tsx', 'providers.tsx', 'route.js', 'global-error.tsx', 'default.tsx'];
  if (nextJsSpecialFiles.includes(fileName)) {
    return;
  }
  
  const isReactComponent = /\.(tsx|jsx)$/.test(fileName) && 
                          !fileName.includes('.d.ts') && 
                          !fileName.includes('index.') &&
                          !fileName.startsWith('_');
  
  const isStyleFile = /\.module\.(css|scss)$/.test(fileName);
  
  if (isReactComponent) {
    // 检查组件文件是否使用帕斯卡命名法
    if (!RULES.component.regex.test(fileName)) {
      results.componentIssues.push({
        path: filePath,
        issue: RULES.component.description,
        suggestion: toMPascalCase(fileName)
      });
    }
  } else if (isStyleFile) {
    // 检查样式文件是否使用帕斯卡命名法
    if (!RULES.style.regex.test(fileName)) {
      results.styleIssues.push({
        path: filePath,
        issue: RULES.style.description,
        suggestion: toMPascalCase(fileName)
      });
    }
    
    // 检查样式文件名是否与组件文件名匹配
    const baseFileName = fileName.replace(/\.module\.(css|scss)$/, '');
    const componentFileName = `${baseFileName}.tsx`;
    const componentPath = path.join(path.dirname(filePath), componentFileName);
    
    try {
      if (fs.existsSync(componentPath)) {
        // 样式文件和组件文件存在，检查是否一致
      } else {
        // 检查是否存在与样式文件不匹配的组件
        const dir = path.dirname(filePath);
        const componentFiles = fs.readdirSync(dir)
          .filter(file => /\.(tsx|jsx)$/.test(file) && !file.includes('index.'));
        
        // 排除Next.js特殊页面组件文件的样式匹配检查
        const nextJsSpecialFiles = ['page.tsx', 'layout.tsx', 'error.tsx', 'loading.tsx', 'not-found.tsx', 'providers.tsx'];
        const isNextJsStyleFile = nextJsSpecialFiles.some(file => {
          const fileBaseName = file.replace(/\.(tsx|jsx)$/, '');
          return dir.includes(fileBaseName) || baseFileName.toLowerCase() === fileBaseName;
        });
        
        if (!isNextJsStyleFile) {
          for (const componentFile of componentFiles) {
            const componentBaseName = componentFile.replace(/\.(tsx|jsx)$/, '');
            if (componentBaseName !== baseFileName && 
                fs.existsSync(path.join(dir, `${componentFile}`))) {
              results.styleMismatchIssues.push({
                path: filePath,
                componentPath: path.join(dir, componentFile),
                issue: `样式文件 ${fileName} 名称与组件 ${componentFile} 不匹配`,
                suggestion: `将样式文件重命名为 ${componentBaseName}.module${ext}`
              });
            }
          }
        }
      }
    } catch (error) {
      // 忽略错误
    }
  } else if (/\.(ts|js|json|mjs)$/.test(fileName) && 
            !fileName.startsWith('.') && 
            !fileName.includes('.d.ts') &&
            !fileName.includes('index.')) {
    // 检查非组件文件是否使用驼峰命名法
    if (!RULES.util.regex.test(fileName) && !fileName.includes('-')) {
      results.utilIssues.push({
        path: filePath,
        issue: RULES.util.description,
        suggestion: toCamelCase(fileName)
      });
    }
  }
}

/**
 * 检查目录名是否符合规范
 */
function checkDirectoryName(dirPath, dirName) {
  // 跳过排除的目录
  if (RULES.directory.exclude.includes(dirName)) {
    return;
  }
  
  // 跳过以点开头的目录
  if (dirName.startsWith('.')) {
    return;
  }
  
  // 跳过Next.js的动态路由目录（以[开头的目录）
  if (dirName.startsWith('[')) {
    return;
  }
  
  // 检查目录是否使用烤串式命名法
  if (!RULES.directory.regex.test(dirName)) {
    results.directoryIssues.push({
      path: dirPath,
      issue: RULES.directory.description,
      suggestion: toKebabCase(dirName)
    });
  }
}

/**
 * 将字符串转换为帕斯卡命名法
 */
function toMPascalCase(str) {
  // 移除扩展名
  const extName = path.extname(str);
  const baseName = path.basename(str, extName);
  
  // 转换为帕斯卡命名法
  const pascalCase = baseName
    .replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/^([a-z])/, (_, c) => c.toUpperCase());
  
  return pascalCase + extName;
}

/**
 * 将字符串转换为驼峰命名法
 */
function toCamelCase(str) {
  // 移除扩展名
  const extName = path.extname(str);
  const baseName = path.basename(str, extName);
  
  // 转换为驼峰命名法
  const camelCase = baseName
    .replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/^([A-Z])/, (_, c) => c.toLowerCase());
  
  return camelCase + extName;
}

/**
 * 将字符串转换为烤串式命名法
 */
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * 递归检查目录
 */
async function checkDirectory(directory) {
  try {
    const entries = await readdir(directory);
    
    for (const entry of entries) {
      // 跳过点文件和点目录，以及在排除列表中的目录
      if ((entry.startsWith('.') && entry !== '.env') || RULES.directory.exclude.includes(entry)) {
        continue;
      }
      
      const fullPath = path.join(directory, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // 检查目录名
        checkDirectoryName(fullPath, entry);
        
        // 递归检查子目录
        await checkDirectory(fullPath);
      } else if (stats.isFile()) {
        // 检查文件名
        checkFileName(fullPath, entry);
      }
    }
  } catch (error) {
    console.error(`检查目录 ${directory} 时出错:`, error);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('开始检查项目命名规范...\n');
  
  // 检查指定的目录
  for (const dir of DIRS_TO_CHECK) {
    await checkDirectory(dir);
  }
  
  // 输出结果
  console.log('===== 命名规范检查结果 =====\n');
  
  // 输出目录问题
  if (results.directoryIssues.length > 0) {
    console.log(`\n发现 ${results.directoryIssues.length} 个目录命名不规范:`);
    results.directoryIssues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.path}`);
      console.log(`   问题: ${issue.issue}`);
      console.log(`   建议: 重命名为 ${issue.suggestion}`);
    });
  } else {
    console.log('✅ 所有目录命名符合规范');
  }
  
  // 输出组件文件问题
  if (results.componentIssues.length > 0) {
    console.log(`\n发现 ${results.componentIssues.length} 个组件文件命名不规范:`);
    results.componentIssues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.path}`);
      console.log(`   问题: ${issue.issue}`);
      console.log(`   建议: 重命名为 ${issue.suggestion}`);
    });
  } else {
    console.log('✅ 所有组件文件命名符合规范');
  }
  
  // 输出非组件文件问题
  if (results.utilIssues.length > 0) {
    console.log(`\n发现 ${results.utilIssues.length} 个非组件文件命名不规范:`);
    results.utilIssues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.path}`);
      console.log(`   问题: ${issue.issue}`);
      console.log(`   建议: 重命名为 ${issue.suggestion}`);
    });
  } else {
    console.log('✅ 所有非组件文件命名符合规范');
  }
  
  // 输出样式文件问题
  if (results.styleIssues.length > 0) {
    console.log(`\n发现 ${results.styleIssues.length} 个样式文件命名不规范:`);
    results.styleIssues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.path}`);
      console.log(`   问题: ${issue.issue}`);
      console.log(`   建议: 重命名为 ${issue.suggestion}`);
    });
  } else {
    console.log('✅ 所有样式文件命名符合规范');
  }
  
  // 输出样式文件与组件不匹配的问题
  if (results.styleMismatchIssues.length > 0) {
    console.log(`\n发现 ${results.styleMismatchIssues.length} 个样式文件与组件名不匹配:`);
    results.styleMismatchIssues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.path}`);
      console.log(`   组件: ${issue.componentPath}`);
      console.log(`   问题: ${issue.issue}`);
      console.log(`   建议: ${issue.suggestion}`);
    });
  } else {
    console.log('✅ 所有样式文件与组件名匹配');
  }
  
  // 输出总结
  const totalIssues = 
    results.directoryIssues.length + 
    results.componentIssues.length + 
    results.utilIssues.length + 
    results.styleIssues.length +
    results.styleMismatchIssues.length;
  
  console.log(`\n共检查到 ${totalIssues} 个命名规范问题`);
  
  if (totalIssues > 0) {
    console.log('\n建议修复步骤:');
    console.log('1. 先修复目录命名问题');
    console.log('2. 修复文件命名问题');
    console.log('3. 修复样式文件与组件不匹配的问题');
    console.log('4. 更新相关导入语句');
  }
}

// 运行程序
main().catch(error => {
  console.error('检查命名规范时出错:', error);
  process.exit(1);
}); 