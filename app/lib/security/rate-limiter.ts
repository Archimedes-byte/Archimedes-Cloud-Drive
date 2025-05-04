/**
 * 速率限制器
 * 
 * 提供基于内存的简单速率限制功能，防止暴力攻击
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// 存储速率限制记录
const limiterStore: Record<string, Record<string, RateLimitRecord>> = {};

/**
 * 速率限制器类
 */
export class RateLimiter {
  private namespace: string;
  private maxRequests: number;
  private windowMs: number;

  /**
   * 创建一个速率限制器实例
   * 
   * @param namespace 限制器命名空间，用于隔离不同API的限制
   * @param maxRequests 在时间窗口内允许的最大请求数
   * @param windowMs 时间窗口大小（毫秒）
   */
  constructor(namespace: string, maxRequests: number, windowMs: number) {
    this.namespace = namespace;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // 确保存在该命名空间的存储
    if (!limiterStore[namespace]) {
      limiterStore[namespace] = {};
    }

    // 定期清理过期记录
    this.setupCleanup();
  }

  /**
   * 检查某个标识符是否超过速率限制
   * 
   * @param identifier 用户标识符（如IP地址）
   * @returns 是否允许请求
   */
  public check(identifier: string): boolean {
    const now = Date.now();
    const store = limiterStore[this.namespace];
    
    // 获取或创建记录
    if (!store[identifier] || now > store[identifier].resetAt) {
      store[identifier] = {
        count: 1,
        resetAt: now + this.windowMs
      };
      return true;
    }
    
    // 增加计数并检查是否超过限制
    const record = store[identifier];
    if (record.count >= this.maxRequests) {
      return false;
    }
    
    record.count++;
    return true;
  }

  /**
   * 重置特定标识符的限制
   * 
   * @param identifier 用户标识符
   */
  public reset(identifier: string): void {
    const store = limiterStore[this.namespace];
    if (store[identifier]) {
      delete store[identifier];
    }
  }

  /**
   * 设置定期清理过期记录的计时器
   */
  private setupCleanup(): void {
    if (typeof process !== 'undefined') {
      // 服务器端：每小时清理一次
      setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }
  }

  /**
   * 清理所有过期的记录
   */
  private cleanup(): void {
    const now = Date.now();
    const store = limiterStore[this.namespace];
    
    Object.keys(store).forEach(identifier => {
      if (now > store[identifier].resetAt) {
        delete store[identifier];
      }
    });
  }
} 