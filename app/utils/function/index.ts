/**
 * 函数工具集中导出
 * 
 * 包含各种函数增强工具：
 * - 防抖函数 (debounce)
 * - 节流函数 (throttle)
 * - 可取消函数 (cancellable)
 * - 延迟函数 (delay) 
 * - 一次执行函数 (once)
 */

// 导出防抖函数
export * from './debounce';

// 导出节流函数
export * from './throttle';

// 导出可取消函数
export * from './cancellable';

// 延迟执行工具
/**
 * 创建一个延迟指定时间后执行的Promise
 * @param ms 延迟时间（毫秒）
 * @returns Promise
 */
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * 确保函数只被执行一次的包装器
 * @param fn 要执行一次的函数
 * @returns 包装后的函数
 */
export function once<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T> {
  let called = false;
  let result: any;

  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

/**
 * 函数执行计时器
 * @param fn 要计时的函数
 * @param name 计时标识名
 * @returns 包装后的函数
 */
export function withTiming<T extends (...args: any[]) => any>(
  fn: T, 
  name: string = 'Function execution'
): (...args: Parameters<T>) => ReturnType<T> {
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    console.time(name);
    const result = fn.apply(this, args);
    console.timeEnd(name);
    return result;
  };
}

/**
 * 带有重试机制的函数包装器
 * @param fn 要执行的函数
 * @param attempts 尝试次数（包括首次尝试）
 * @param delay 重试间隔（毫秒）
 * @returns 包装后的函数
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  attempts: number = 3,
  delay: number = 1000
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async function(this: any, ...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
    let lastError: any;
    
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        lastError = error;
        
        if (i < attempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  };
} 