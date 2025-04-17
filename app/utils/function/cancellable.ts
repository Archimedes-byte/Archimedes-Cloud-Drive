/**
 * 函数工具 - 可取消函数
 * 
 * 可取消函数允许在需要时取消异步操作，避免不必要的执行和资源浪费。
 * 典型用例包括：API请求、定时任务、动画等。
 */

/**
 * 可取消的Promise包装器
 * 用于创建可取消的Promise
 */
export interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void;
  isCancelled: () => boolean;
}

/**
 * 创建可取消的Promise
 * 
 * @param executor Promise执行器函数
 * @returns 带有cancel方法的Promise
 * 
 * @example
 * const fetchData = makeCancellable(fetch('https://api.example.com/data'));
 * fetchData.then(data => console.log(data)).catch(err => {
 *   if (err.cancelled) {
 *     console.log('请求已取消');
 *   } else {
 *     console.error('请求失败', err);
 *   }
 * });
 * 
 * // 取消请求
 * fetchData.cancel();
 */
export function makeCancellable<T>(promise: Promise<T>): CancellablePromise<T> {
  let isCancelled = false;
  
  // 创建取消错误对象
  const cancelError: Error & { cancelled?: boolean } = new Error('操作已取消');
  cancelError.cancelled = true;
  
  // 包装原始Promise
  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise.then(
      value => isCancelled ? reject(cancelError) : resolve(value),
      error => isCancelled ? reject(cancelError) : reject(error)
    );
  }) as CancellablePromise<T>;
  
  // 添加取消方法
  wrappedPromise.cancel = () => {
    isCancelled = true;
  };
  
  // 添加检查取消状态方法
  wrappedPromise.isCancelled = () => isCancelled;
  
  return wrappedPromise;
}

/**
 * 为异步函数创建可取消的版本
 * 
 * @param fn 要包装的异步函数
 * @returns 返回一个产生可取消Promise的函数
 * 
 * @example
 * const fetchUserData = cancellable(async (userId) => {
 *   const response = await fetch(`/api/users/${userId}`);
 *   return response.json();
 * });
 * 
 * const userPromise = fetchUserData('123');
 * userPromise.then(data => console.log(data));
 * 
 * // 取消请求
 * userPromise.cancel();
 */
export function cancellable<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => CancellablePromise<Awaited<ReturnType<T>>> {
  return (...args: Parameters<T>): CancellablePromise<Awaited<ReturnType<T>>> => {
    const promise = fn(...args) as Promise<Awaited<ReturnType<T>>>;
    return makeCancellable(promise);
  };
}

/**
 * 创建可取消的延迟函数
 * 
 * @param ms 延迟时间（毫秒）
 * @returns 可取消的Promise
 * 
 * @example
 * const delay = cancellableDelay(1000);
 * delay.then(() => console.log('1秒后执行'));
 * 
 * // 取消延迟
 * delay.cancel();
 */
export function cancellableDelay(ms: number): CancellablePromise<void> {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  const promise = new Promise<void>(resolve => {
    timeoutId = setTimeout(resolve, ms);
  });
  
  const cancellablePromise = makeCancellable(promise);
  
  // 增强取消方法，清除定时器
  const originalCancel = cancellablePromise.cancel;
  cancellablePromise.cancel = () => {
    clearTimeout(timeoutId);
    originalCancel();
  };
  
  return cancellablePromise;
} 