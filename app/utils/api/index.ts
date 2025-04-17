/**
 * API请求工具函数
 * 提供统一的API请求接口，支持类型安全、错误处理和缓存
 * 
 * 本模块包含两套API工具:
 * 1. 增强版API工具（推荐）: ApiClient, ApiServiceFactory 等
 * 2. 简单API工具（向后兼容）: apiRequest, apiGet 等
 */

import { ApiResponse, ApiDataResponse } from '@/app/types/api';

// 导出增强版API工具（推荐使用）
export * from './api-client';
export * from './api-factory';

/**
 * 请求配置接口
 */
interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  useCache?: boolean;
  cacheTime?: number;
  retries?: number;
}

/**
 * 默认请求配置
 */
const defaultConfig: RequestConfig = {
  useCache: false,
  cacheTime: 5 * 60 * 1000, // 默认缓存5分钟
  retries: 1,
};

/**
 * 简单的请求缓存实现
 */
const requestCache = new Map<string, { data: any; timestamp: number }>();

/**
 * 清理过期缓存
 */
const cleanCache = () => {
  const now = Date.now();
  for (const [key, { timestamp }] of requestCache.entries()) {
    if (now - timestamp > defaultConfig.cacheTime!) {
      requestCache.delete(key);
    }
  }
};

// 定期清理缓存
setInterval(cleanCache, 60 * 1000);

/**
 * 构建完整的URL，包含查询参数
 */
const buildUrl = (url: string, params?: Record<string, string | number | boolean | undefined | null>): string => {
  if (!params) return url;
  
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  if (!queryString) return url;
  
  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
};

/**
 * 生成缓存键
 */
const getCacheKey = (url: string, config: RequestInit): string => {
  return `${config.method || 'GET'}-${url}-${JSON.stringify(config.body || {})}`;
};

/**
 * 通用API请求函数
 * 
 * @param url 请求URL
 * @param config 请求配置
 * @returns 请求响应
 */
export async function apiRequest<T = any>(url: string, config: RequestConfig = {}): Promise<ApiDataResponse<T>> {
  // 合并默认配置
  const mergedConfig: RequestConfig = { ...defaultConfig, ...config };
  const { params, useCache, cacheTime, retries, ...fetchConfig } = mergedConfig;
  
  // 构建完整URL
  const fullUrl = buildUrl(url, params);
  
  // 检查缓存
  if (useCache && fetchConfig.method === undefined || fetchConfig.method === 'GET') {
    const cacheKey = getCacheKey(fullUrl, fetchConfig);
    const cached = requestCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < (cacheTime || defaultConfig.cacheTime!)) {
      return cached.data;
    }
  }
  
  // 执行请求，支持重试
  let lastError: Error | null = null;
  const maxRetries = retries || 0;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(fullUrl, fetchConfig);
      
      // 解析响应
      const data = await response.json();
      
      // 检查API响应状态
      if (!response.ok) {
        throw new Error(data.error || `请求失败: ${response.status}`);
      }
      
      // 验证API响应格式
      if (data.success === undefined) {
        console.warn('API响应格式不符合规范：', data);
      }
      
      // 缓存成功响应
      if (useCache && (fetchConfig.method === undefined || fetchConfig.method === 'GET')) {
        const cacheKey = getCacheKey(fullUrl, fetchConfig);
        requestCache.set(cacheKey, { data, timestamp: Date.now() });
      }
      
      return data as ApiDataResponse<T>;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 最后一次重试失败，抛出错误
      if (i === maxRetries) {
        throw lastError;
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  // 不应该到达这里，但为了类型安全
  throw lastError || new Error('请求失败');
}

/**
 * GET请求
 */
export async function apiGet<T = any>(url: string, params?: Record<string, string | number | boolean | undefined | null>, config: Omit<RequestConfig, 'params' | 'method'> = {}): Promise<ApiDataResponse<T>> {
  return apiRequest<T>(url, {
    ...config,
    method: 'GET',
    params,
  });
}

/**
 * POST请求
 */
export async function apiPost<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'body' | 'method'> = {}): Promise<ApiDataResponse<T>> {
  return apiRequest<T>(url, {
    ...config,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT请求
 */
export async function apiPut<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'body' | 'method'> = {}): Promise<ApiDataResponse<T>> {
  return apiRequest<T>(url, {
    ...config,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE请求
 */
export async function apiDelete<T = any>(url: string, config: Omit<RequestConfig, 'method'> = {}): Promise<ApiDataResponse<T>> {
  return apiRequest<T>(url, {
    ...config,
    method: 'DELETE',
  });
} 