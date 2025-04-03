/**
 * 工具函数统一导出入口
 */
// 只使用fileHelpers提供的工具函数，避免冲突
export * from './fileHelpers';
export * from './typeHelpers';

// 注释掉冲突的导出，以后整合这些功能
// export * from './fileUtils';
// export * from './fileOperations';
// export * from './formatters';

// 删除重复的fileHelpers.ts和fileUtils.ts文件 