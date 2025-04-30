/**
 * 日志工具
 * 使用环境变量控制不同级别的日志输出
 */

// 默认开发环境输出所有级别，生产环境只输出错误和警告
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

// 日志级别权重
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * 检查是否应该输出该级别的日志
 * @param level 当前日志级别
 * @returns 是否应该输出
 */
const shouldLog = (level: keyof typeof LOG_LEVELS): boolean => {
  const configuredLevel = LOG_LEVEL as keyof typeof LOG_LEVELS;
  return LOG_LEVELS[level] >= LOG_LEVELS[configuredLevel];
};

/**
 * 日志工具
 */
export const logger = {
  /**
   * 调试级别日志，仅在开发环境中显示
   */
  debug: (message: string, ...args: any[]): void => {
    if (shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * 信息级别日志
   */
  info: (message: string, ...args: any[]): void => {
    if (shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * 警告级别日志
   */
  warn: (message: string, ...args: any[]): void => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  /**
   * 错误级别日志
   */
  error: (message: string, ...args: any[]): void => {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
};

export default logger; 