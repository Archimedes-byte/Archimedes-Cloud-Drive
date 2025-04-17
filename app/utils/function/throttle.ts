/**
 * 函数工具 - 节流函数
 * 
 * 节流函数用于限制函数的调用频率，保证一定时间内只执行一次。
 * 典型用例包括：滚动事件处理、窗口调整大小、鼠标移动事件等。
 */

/**
 * 基础节流函数
 * 
 * @param fn 要节流的函数
 * @param ms 节流时间间隔（毫秒）
 * @returns 节流处理后的函数
 * 
 * @example
 * // 基本用法
 * const throttledScroll = throttle(() => {
 *   // 处理滚动逻辑
 * }, 300);
 * 
 * // 在滚动事件中使用
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, ms = 300): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    
    // 检查是否已经过了节流时间
    if (now - lastCall >= ms) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      
      lastCall = now;
      fn.apply(this, args);
    } else {
      // 保存最新的参数
      lastArgs = args;
      
      // 如果没有等待中的定时器，设置一个在剩余时间后执行
      if (!timeout) {
        const remaining = ms - (now - lastCall);
        timeout = setTimeout(() => {
          lastCall = Date.now();
          timeout = null;
          
          if (lastArgs) {
            fn.apply(this, lastArgs);
            lastArgs = null;
          }
        }, remaining);
      }
    }
  };
}

/**
 * 带首次立即执行选项的节流函数
 * 
 * @param fn 要节流的函数
 * @param ms 节流时间间隔（毫秒）
 * @param leading 是否在首次调用时立即执行
 * @param trailing 是否在结束后额外执行一次
 * @returns 节流处理后的函数
 */
export function throttleAdvanced<T extends (...args: any[]) => any>(
  fn: T, 
  ms = 300, 
  leading = true, 
  trailing = true
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    const isFirstCall = lastCall === 0;
    
    // 保存上下文
    lastArgs = args;
    lastThis = this;
    
    // 首次调用且不需要立即执行
    if (isFirstCall && !leading) {
      lastCall = now;
      return;
    }
    
    // 检查是否已经过了节流时间
    if (now - lastCall >= ms) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      
      lastCall = now;
      fn.apply(this, args);
    } else if (trailing && !timeout) {
      // 如果需要结束后执行且没有等待中的定时器
      const remaining = ms - (now - lastCall);
      timeout = setTimeout(() => {
        lastCall = leading ? Date.now() : 0; // 重置时间戳
        timeout = null;
        
        if (lastArgs) {
          fn.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, remaining);
    }
  };
}

/**
 * 可取消的节流函数
 * 
 * @param fn 要节流的函数
 * @param ms 节流时间间隔（毫秒）
 * @returns 带有cancel方法的节流函数
 */
export function createCancelableThrottle<T extends (...args: any[]) => any>(
  fn: T, 
  ms = 300
): { (...args: Parameters<T>): void; cancel: () => void } {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  function throttled(this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    
    if (now - lastCall >= ms) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeout) {
      const remaining = ms - (now - lastCall);
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        fn.apply(this, args);
      }, remaining);
    }
  }
  
  throttled.cancel = function(): void {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return throttled;
} 