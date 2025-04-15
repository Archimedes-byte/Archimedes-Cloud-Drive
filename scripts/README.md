# 命名规范修复脚本

此目录包含用于检查和修复项目命名规范的脚本。

## 脚本列表

1. **naming-check.js** - 检查项目中不符合命名规范的文件和目录
2. **fix-directory-naming.js** - 修复目录命名（将不符合kebab-case的目录重命名）
3. **fix-style-naming.js** - 修复样式文件命名（将不符合PascalCase的样式文件重命名）
4. **update-import-paths.js** - 更新代码中的导入路径，以匹配重命名后的文件/目录
5. **rename-logger.js** - 用于记录重命名操作的工具类
6. **fix-all-naming.js** - 协调运行所有修复脚本的主脚本

## 使用方法

### 1. 检查命名规范问题

首先运行检查脚本，查看项目中存在的命名问题：

```bash
node scripts/naming-check.js
```

### 2. 使用统一修复脚本

推荐使用统一修复脚本，它会按正确的顺序执行所有修复步骤：

```bash
# 先执行干运行，查看会进行哪些修改（不实际更改文件）
node scripts/fix-all-naming.js --dry-run

# 实际执行修复
node scripts/fix-all-naming.js
```

### 3. 分步执行修复脚本

如果需要更精细的控制，可以分步骤执行各个脚本：

#### 修复目录命名

```bash
# 干运行模式（不实际修改文件）
node scripts/fix-directory-naming.js --dry-run

# 实际执行修复
node scripts/fix-directory-naming.js

# 分批次执行（每批处理5个目录）
node scripts/fix-directory-naming.js --batch 5
```

#### 修复样式文件命名

```bash
# 干运行模式
node scripts/fix-style-naming.js --dry-run

# 实际执行修复
node scripts/fix-style-naming.js

# 分批次执行
node scripts/fix-style-naming.js --batch 5

# 不修复样式文件与组件名不匹配的问题
node scripts/fix-style-naming.js --no-match-fix
```

#### 更新导入路径

```bash
# 干运行模式
node scripts/update-import-paths.js --dry-run

# 实际执行更新
node scripts/update-import-paths.js

# 显示详细信息
node scripts/update-import-paths.js --verbose

# 分批次执行
node scripts/update-import-paths.js --batch 10
```

## 注意事项

1. **备份或提交代码** - 在运行修复脚本前，确保已提交或备份代码，以便在出现问题时可以恢复
2. **按顺序执行** - 先修复目录命名，再修复文件命名，最后更新导入路径
3. **检查自动修复结果** - 脚本会尽力修复问题，但可能无法处理所有复杂情况，请检查修复结果
4. **运行测试** - 修复完成后，确保运行项目的测试套件，验证功能是否正常

## 常见问题

### 如果修复过程中断

修复过程会将已完成的重命名操作记录到 `directory-renames.json` 和 `style-renames.json` 文件中。如果过程中断，再次运行脚本时会从这些文件加载已完成的操作，避免重复工作。

### 手动编辑重命名映射

如果需要手动指定重命名规则，可以编辑 `update-import-paths.js` 中的 `generateRenameMapping` 函数，添加自定义的重命名映射。 