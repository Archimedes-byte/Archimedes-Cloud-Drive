import { createError, ErrorType } from './errorUtils';

interface ExtendedRequestOptions extends Omit<RequestInit, 'cache'> {
  timeout?: number;
  cache?: boolean;
  retries?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

const DEFAULT_TIMEOUT = 30000; // 30秒
const DEFAULT_RETRIES = 3; // 默认重试次数
const RETRY_DELAY = 1000; // 重试延迟（毫秒）

// 请求缓存
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 缓存时间5分钟

// 处理超时
const timeoutPromise = (timeout: number): Promise<never> =>
  new Promise((_, reject) =>
    setTimeout(() => reject(createError('NETWORK', '请求超时')), timeout)
  );

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 处理响应
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw createError(
      'NETWORK',
      errorData.message || `请求失败: ${response.status}`,
      { status: response.status, ...errorData }
    );
  }
  return response.json();
};

// 检查缓存
const checkCache = (url: string): any | null => {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(url);
  return null;
};

// 设置缓存
const setCache = (url: string, data: any) => {
  cache.set(url, { data, timestamp: Date.now() });
};

// 基础请求函数
export const request = async <T>(
  url: string,
  options: ExtendedRequestOptions = {}
): Promise<T> => {
  const { 
    timeout = DEFAULT_TIMEOUT, 
    cache: useCache = false,
    retries = DEFAULT_RETRIES,
    ...fetchOptions 
  } = options;

  // 检查缓存
  if (useCache && fetchOptions.method === 'GET') {
    const cachedData = checkCache(url);
    if (cachedData) {
      return cachedData;
    }
  }

  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await Promise.race([
        fetch(url, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        }),
        timeoutPromise(timeout),
      ]);

      const data = await handleResponse<T>(response);
      
      // 设置缓存
      if (useCache && fetchOptions.method === 'GET') {
        setCache(url, data);
      }

      return data;
    } catch (error) {
      lastError = error;
      if (i < retries) {
        await delay(RETRY_DELAY * Math.pow(2, i)); // 指数退避
        continue;
      }
    }
  }

  throw createError(
    'NETWORK',
    lastError instanceof Error ? lastError.message : '网络请求失败',
    lastError
  );
};

// 文件上传函数
export const uploadFile = async (
  url: string,
  formData: FormData,
  options: ExtendedRequestOptions = {}
): Promise<ApiResponse> => {
  try {
    const response = await request<ApiResponse>(url, {
      method: 'POST',
      body: formData,
      retries: 1, // 文件上传只重试一次
      headers: {
        // 不设置 Content-Type，让浏览器自动设置
        ...options.headers,
      },
      ...options,
    });

    return response;
  } catch (error) {
    throw createError(
      'FILE_UPLOAD',
      error instanceof Error ? error.message : '文件上传失败',
      error
    );
  }
};

// API请求工具
export const api = {
  get: <T>(url: string, options?: ExtendedRequestOptions) =>
    request<T>(url, { 
      ...options, 
      method: 'GET',
      cache: true // 默认启用GET请求缓存
    }),

  post: <T>(url: string, data?: any, options?: ExtendedRequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(url: string, data?: any, options?: ExtendedRequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T>(url: string, options?: ExtendedRequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE' }),

  upload: uploadFile,
}; 