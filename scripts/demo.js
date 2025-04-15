/**
 * Demo script for naming convention fix tools
 * Shows examples of how to use the scripts
 */

console.log('\n===== 项目命名规范修复工具使用示例 =====\n');

console.log('第1步: 检查命名问题');
console.log('------------------------');
console.log('运行以下命令查看项目中存在的命名问题:');
console.log('  node scripts/naming-check.js');
console.log('\n输出示例:');
console.log('  发现 49 个目录命名不规范');
console.log('  发现 5 个样式文件命名不规范');
console.log('  发现 8 个样式文件与组件名不匹配\n');

console.log('第2步: 修复命名问题');
console.log('------------------------');
console.log('方法1: 使用一键修复脚本(推荐)');
console.log('  node scripts/fix-all-naming.js --dry-run  # 试运行模式');
console.log('  node scripts/fix-all-naming.js           # 实际执行修复\n');

console.log('方法2: 分步执行修复脚本');
console.log('1. 修复目录命名:');
console.log('  node scripts/fix-directory-naming.js --dry-run  # 试运行模式');
console.log('  node scripts/fix-directory-naming.js           # 实际执行');
console.log('  node scripts/fix-directory-naming.js --batch 5  # 分批执行\n');

console.log('2. 修复样式文件命名:');
console.log('  node scripts/fix-style-naming.js --dry-run      # 试运行模式');
console.log('  node scripts/fix-style-naming.js               # 实际执行');
console.log('  node scripts/fix-style-naming.js --no-match-fix # 不修复匹配问题\n');

console.log('3. 更新导入路径:');
console.log('  node scripts/update-import-paths.js --dry-run   # 试运行模式');
console.log('  node scripts/update-import-paths.js --verbose   # 显示详细信息\n');

console.log('第3步: 验证修复结果');
console.log('------------------------');
console.log('运行检查脚本验证问题是否已解决:');
console.log('  node scripts/naming-check.js\n');

console.log('推荐做法:');
console.log('------------------------');
console.log('1. 先提交/备份代码');
console.log('2. 运行检查脚本 (node scripts/naming-check.js)');
console.log('3. 使用试运行模式预览更改 (--dry-run)');
console.log('4. 执行真实修复');
console.log('5. 再次检查并测试项目\n');

console.log('更多帮助:');
console.log('------------------------');
console.log('查看指定脚本的帮助:');
console.log('  node scripts/help.js fix-all-naming');
console.log('  node scripts/help.js fix-directory-naming');
console.log('  node scripts/help.js fix-style-naming');
console.log('  node scripts/help.js update-import-paths\n');

console.log('查看详细文档:');
console.log('  scripts/README.md');
console.log('  scripts/使用指南.md\n'); 