/**
 * 函数工具 - 防抖函数
 * 
 * 防抖函数用于限制函数的调用频率，在一段时间内多次调用只执行最后一次。
 * 典型用例包括：搜索输入、窗口调整大小、滚动事件等。
 */

/**
 * 通用防抖函数
 * 
 * @param fn 要防抖的函数
 * @param ms 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 * 
 * @example
 * // 基本用法
 * const debouncedSearch = debounce((query) => {
 *   searchAPI(query);
 * }, 300);
 * 
 * // 在React组件中使用
 * const handleChange = (e) => {
 *   debouncedSearch(e.target.value);
 * };
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, ms = 300): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

/**
 * 带有返回值支持的防抖函数
 * 返回一个Promise，该Promise在防抖函数最终执行时解析为函数返回值
 * 
 * @param fn 要防抖的函数
 * @param ms 延迟时间（毫秒）
 * @returns 返回Promise的防抖函数
 * 
 * @example
 * // 使用返回Promise的防抖函数
 * const debouncedFetch = debounceWithPromise(async (id) => {
 *   const data = await fetchAPI(id);
 *   return data;
 * }, 300);
 * 
 * // 在组件中使用
 * const handleSearch = async (id) => {
 *   const result = await debouncedFetch(id);
 *   setData(result);
 * };
 */
export function debounceWithPromise<T extends (...args: any[]) => any>(
  fn: T, 
  ms = 300
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout>;
  let pending: Promise<ReturnType<T>> | null = null;
  let resolve: ((value: ReturnType<T>) => void) | null = null;
  
  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    clearTimeout(timeoutId);
    
    // 如果没有待处理的Promise，创建一个新的
    if (!pending) {
      pending = new Promise<ReturnType<T>>((res) => {
        resolve = res;
      });
    }
    
    timeoutId = setTimeout(() => {
      const result = fn(...args) as ReturnType<T>;
      if (resolve) resolve(result);
      pending = null;
      resolve = null;
    }, ms);
    
    return pending;
  };
}

/**
 * 带有立即执行选项的防抖函数
 * 
 * @param fn 要防抖的函数
 * @param ms 延迟时间（毫秒）
 * @param immediate 是否立即执行
 * @returns 防抖处理后的函数
 * 
 * @example
 * // 第一次调用时立即执行
 * const debouncedSave = debounceImmediate(saveData, 500, true);
 */
export function debounceImmediate<T extends (...args: any[]) => any>(
  fn: T,
  ms = 300,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null;
  
  return (...args: Parameters<T>): void => {
    const callNow = immediate && !timeoutId;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) fn(...args);
    }, ms);
    
    if (callNow) fn(...args);
  };
}

/**
 * 可取消的防抖函数
 * 
 * @param fn 要防抖的函数
 * @param ms 延迟时间（毫秒）
 * @returns 带有取消方法的防抖函数对象
 * 
 * @example
 * // 创建可取消的防抖函数
 * const { debouncedFn, cancel } = createCancelableDebounce(fetchData, 500);
 * 
 * // 使用函数
 * debouncedFn(params);
 * 
 * // 需要时取消
 * cancel();
 */
export interface CancelableDebounce<T extends (...args: any[]) => any> {
  /** 防抖后的函数 */
  debouncedFn: (...args: Parameters<T>) => void;
  /** 取消防抖的方法 */
  cancel: () => void;
  /** 立即执行函数 */
  flush: (...args: Parameters<T>) => void;
  /** 防抖状态 - 是否有待执行的调用 */
  isPending: () => boolean;
}

export function createCancelableDebounce<T extends (...args: any[]) => any>(
  fn: T, 
  ms = 300
): CancelableDebounce<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  let latestArgs: Parameters<T> | null = null;
  let hasPending = false;
  
  const debouncedFn = (...args: Parameters<T>): void => {
    latestArgs = args;
    hasPending = true;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (latestArgs) {
        fn(...latestArgs);
        hasPending = false;
        latestArgs = null;
      }
    }, ms);
  };
  
  const cancel = (): void => {
    clearTimeout(timeoutId);
    hasPending = false;
    latestArgs = null;
  };
  
  const flush = (...args: Parameters<T>): void => {
    cancel();
    fn(...(args.length ? args : (latestArgs || [] as unknown as Parameters<T>)));
  };
  
  const isPending = (): boolean => {
    return hasPending;
  };
  
  return { debouncedFn, cancel, flush, isPending };
}

/**
 * 带有跟踪标识的防抖函数
 * 可以跟踪最近的一次调用，适用于处理异步请求竞态条件
 * 
 * @param fn 要防抖的函数
 * @param ms 延迟时间（毫秒）
 * @returns 带有跟踪功能的防抖函数
 * 
 * @example
 * // 处理竞态条件(race condition)
 * const { debouncedFn, getCallId } = createTrackableDebounce(async (query) => {
 *   const callId = getCallId();
 *   const data = await api.search(query);
 *   
 *   // 如果这不是最新的调用，忽略结果
 *   if (callId !== getCallId()) return;
 *   
 *   setResults(data);
 * }, 300);
 */
export interface TrackableDebounce<T extends (...args: any[]) => any> {
  /** 防抖后的函数 */
  debouncedFn: (...args: Parameters<T>) => void;
  /** 获取当前调用ID */
  getCallId: () => number;
  /** 重置调用ID跟踪 */
  resetTracking: () => void;
  /** 取消防抖 */
  cancel: () => void;
}

export function createTrackableDebounce<T extends (...args: any[]) => any>(
  fn: T, 
  ms = 300
): TrackableDebounce<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  let currentCallId = 0;
  
  const debouncedFn = (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);
    currentCallId++;
    
    timeoutId = setTimeout(() => {
      fn(...args);
    }, ms);
  };
  
  const getCallId = (): number => {
    return currentCallId;
  };
  
  const resetTracking = (): void => {
    currentCallId = 0;
  };
  
  const cancel = (): void => {
    clearTimeout(timeoutId);
  };
  
  return { debouncedFn, getCallId, resetTracking, cancel };
} 