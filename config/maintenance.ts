export const maintenanceConfig = {
  // 文件保留策略
  retention: {
    // 已删除文件保留天数
    deletedFiles: 7,
    // 空文件夹保留天数
    emptyFolders: 7,
    // 临时文件保留时间（小时）
    tempFiles: 24
  },

  // 清理时间
  schedule: {
    // 每天凌晨3点运行
    cleanupTime: '0 3 * * *'
  },

  // 清理阈值
  thresholds: {
    // 单次清理最大文件数
    maxFilesPerRun: 1000,
    // 单次清理最大文件夹数
    maxFoldersPerRun: 100
  },

  // 日志设置
  logging: {
    // 是否记录详细日志
    verbose: process.env.NODE_ENV === 'development',
    // 是否保存清理历史
    saveHistory: true,
    // 清理历史保留天数
    historyRetention: 30
  }
}; 