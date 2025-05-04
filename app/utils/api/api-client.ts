/**
 * 增强型API客户端
 * 提供统一的API请求接口，集成错误处理、重试机制、缓存策略和请求拦截
 */

import { ApiDataResponse } from '@/app/types/api';
import { formatError, ApiError, TimeoutError } from '@/app/utils/error';

// 引入LRU缓存策略
import LRUCache from 'lru-cache';

/**
 * API客户端配置接口
 */
export interface ApiClientConfig {
  /** 基础URL */
  baseUrl?: string;
  /** 默认请求头 */
  defaultHeaders?: Record<string, string>;
  /** 请求超时时间(毫秒) */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟(毫秒) */
  retryDelay?: number;
  /** 是否默认启用缓存 */
  useCache?: boolean;
  /** 默认缓存时间(毫秒) */
  defaultCacheTime?: number;
  /** 缓存最大条目数 */
  maxCacheEntries?: number;
  /** 请求拦截器 */
  requestInterceptor?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  /** 响应拦截器 */
  responseInterceptor?: (response: ApiDataResponse<any>) => ApiDataResponse<any> | Promise<ApiDataResponse<any>>;
  /** 错误拦截器 */
  errorInterceptor?: (error: Error) => Error | Promise<Error>;
}

/**
 * 请求配置接口
 */
export interface RequestConfig extends RequestInit {
  /** URL参数 */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** 是否启用缓存 */
  useCache?: boolean;
  /** 缓存时间(毫秒) */
  cacheTime?: number;
  /** 重试次数 */
  retries?: number;
  /** 请求超时时间(毫秒) */
  timeout?: number;
  /** 自定义缓存键 */
  cacheKey?: string;
  /** 强制刷新缓存 */
  forceRefresh?: boolean;
  /** 忽略全局拦截器 */
  skipInterceptors?: boolean;
}

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * 增强型API客户端类
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private useCache: boolean;
  private defaultCacheTime: number;
  private requestInterceptor?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  private responseInterceptor?: (response: ApiDataResponse<any>) => ApiDataResponse<any> | Promise<ApiDataResponse<any>>;
  private errorInterceptor?: (error: Error) => Error | Promise<Error>;
  private cache: LRUCache<string, CacheItem<any>>;

  /**
   * 构造函数
   * @param config API客户端配置
   */
  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '';
    this.defaultHeaders = config.defaultHeaders || {};
    this.timeout = config.timeout || 30000; // 默认30秒超时
    this.maxRetries = config.maxRetries || 1;
    this.retryDelay = config.retryDelay || 1000;
    this.useCache = config.useCache || false;
    this.defaultCacheTime = config.defaultCacheTime || 5 * 60 * 1000; // 默认5分钟缓存
    this.requestInterceptor = config.requestInterceptor;
    this.responseInterceptor = config.responseInterceptor;
    this.errorInterceptor = config.errorInterceptor;

    // 初始化LRU缓存
    this.cache = new LRUCache({
      max: config.maxCacheEntries || 100, // 默认最多缓存100个请求
      ttl: this.defaultCacheTime, // 使用默认缓存时间作为TTL
      updateAgeOnGet: true, // 访问时更新缓存项的年龄
    });
  }

  /**
   * 生成完整URL
   * @param endpoint API端点
   * @param params URL参数
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    // 构建基础URL
    let url = endpoint.startsWith('http') || endpoint.startsWith('//')
      ? endpoint // 已经是完整URL
      : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    // 如果没有参数，直接返回
    if (!params) return url;
    
    // 构建查询参数
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    if (!queryString) return url;
    
    // 添加查询参数到URL
    return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
  }

  /**
   * 生成缓存键
   * @param method 请求方法
   * @param url 完整URL
   * @param body 请求体
   * @param customKey 自定义缓存键
   */
  private generateCacheKey(method: string, url: string, body?: any, customKey?: string): string {
    if (customKey) return customKey;
    return `${method}-${url}-${body ? JSON.stringify(body) : ''}`;
  }

  /**
   * 设置请求超时
   * @param ms 超时时间(毫秒)
   */
  private setRequestTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`请求超时(${ms}ms)`));
      }, ms);
    });
  }

  /**
   * 执行请求
   * @param method 请求方法
   * @param endpoint API端点
   * @param config 请求配置
   */
  private async request<T = any>(
    method: string,
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiDataResponse<T>> {
    // 合并配置
    const {
      params,
      useCache = this.useCache,
      cacheTime = this.defaultCacheTime,
      retries = this.maxRetries,
      timeout = this.timeout,
      cacheKey: customCacheKey,
      forceRefresh = false,
      skipInterceptors = false,
      ...fetchConfig
    } = config;

    // 构建请求配置
    let requestConfig: RequestConfig = {
      ...fetchConfig,
      method,
      headers: {
        ...this.defaultHeaders,
        ...fetchConfig.headers,
      },
    };

    // 应用请求拦截器
    if (this.requestInterceptor && !skipInterceptors) {
      requestConfig = await this.requestInterceptor(requestConfig);
    }

    // 构建完整URL
    const fullUrl = this.buildUrl(endpoint, params);
    
    // 处理GET请求缓存
    if (useCache && method === 'GET' && !forceRefresh) {
      const cacheKey = this.generateCacheKey(method, fullUrl, undefined, customCacheKey);
      const cachedItem = this.cache.get(cacheKey);
      
      if (cachedItem && cachedItem.expiresAt > Date.now()) {
        return cachedItem.data;
      }
    }
    
    // 执行请求与重试逻辑
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // 创建超时Promise
        const timeoutPromise = this.setRequestTimeout(timeout);
        
        // 执行fetch请求
        const responsePromise = fetch(fullUrl, requestConfig);
        
        // 竞争Promise，谁先完成就用谁的结果
        const response = await Promise.race([responsePromise, timeoutPromise]);
        
        // 解析响应体
        let data: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // 非JSON响应
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            data = { data: text, success: response.ok };
          }
        }
        
        // 检查HTTP响应状态
        if (!response.ok) {
          throw new ApiError(
            data.error || data.message || `请求失败: ${response.status}`,
            response.status,
            undefined, // code参数可选，传入undefined
            { status: response.status, url: fullUrl, data }
          );
        }
        
        // 处理API响应
        const apiResponse = data as ApiDataResponse<T>;
        
        // 应用响应拦截器
        let processedResponse = apiResponse;
        if (this.responseInterceptor && !skipInterceptors) {
          processedResponse = await this.responseInterceptor(apiResponse);
        }
        
        // 缓存GET请求的成功响应
        if (useCache && method === 'GET') {
          const cacheKey = this.generateCacheKey(method, fullUrl, undefined, customCacheKey);
          const now = Date.now();
          
          this.cache.set(cacheKey, {
            data: processedResponse,
            timestamp: now,
            expiresAt: now + cacheTime,
          });
        }
        
        return processedResponse;
      } catch (error) {
        // 处理错误
        let processedError: Error;
        
        if (error instanceof Error) {
          processedError = error;
        } else {
          processedError = new Error(String(error));
        }
        
        // 应用错误拦截器
        if (this.errorInterceptor && !skipInterceptors) {
          processedError = await this.errorInterceptor(processedError);
        }
        
        lastError = processedError;
        
        // 最后一次重试失败，抛出错误
        if (attempt === retries) {
          throw formatError(lastError);
        }
        
        // 等待后重试
        const delayMs = this.retryDelay * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    // 不应该到达这里，但为了类型安全
    throw formatError(lastError || new Error('请求失败'));
  }

  /**
   * 执行GET请求
   * @param endpoint API端点
   * @param params URL参数
   * @param config 请求配置
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    config: Omit<RequestConfig, 'method' | 'params'> = {}
  ): Promise<ApiDataResponse<T>> {
    return this.request<T>('GET', endpoint, { ...config, params });
  }

  /**
   * 执行POST请求
   * @param endpoint API端点
   * @param data 请求数据
   * @param config 请求配置
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiDataResponse<T>> {
    const requestConfig: RequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: data !== undefined ? JSON.stringify(data) : undefined,
    };
    
    return this.request<T>('POST', endpoint, requestConfig);
  }

  /**
   * 执行PUT请求
   * @param endpoint API端点
   * @param data 请求数据
   * @param config 请求配置
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiDataResponse<T>> {
    const requestConfig: RequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: data !== undefined ? JSON.stringify(data) : undefined,
    };
    
    return this.request<T>('PUT', endpoint, requestConfig);
  }

  /**
   * 执行DELETE请求
   * @param endpoint API端点
   * @param config 请求配置
   */
  async delete<T = any>(
    endpoint: string,
    config: Omit<RequestConfig, 'method'> = {}
  ): Promise<ApiDataResponse<T>> {
    return this.request<T>('DELETE', endpoint, config);
  }

  /**
   * 执行PATCH请求
   * @param endpoint API端点
   * @param data 请求数据
   * @param config 请求配置
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config: Omit<RequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiDataResponse<T>> {
    const requestConfig: RequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: data !== undefined ? JSON.stringify(data) : undefined,
    };
    
    return this.request<T>('PATCH', endpoint, requestConfig);
  }

  /**
   * 上传文件
   * @param endpoint API端点
   * @param formData 表单数据
   * @param config 请求配置
   */
  async upload<T = any>(
    endpoint: string,
    formData: FormData,
    config: Omit<RequestConfig, 'method' | 'body' | 'headers'> = {}
  ): Promise<ApiDataResponse<T>> {
    const requestConfig: RequestConfig = {
      ...config,
      // 注意不要设置Content-Type，让浏览器自动设置正确的边界
      body: formData,
    };
    
    return this.request<T>('POST', endpoint, requestConfig);
  }

  /**
   * 清除特定缓存
   * @param method 请求方法
   * @param endpoint API端点
   * @param params URL参数
   */
  clearCache(method: string, endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): void {
    const fullUrl = this.buildUrl(endpoint, params);
    const cacheKey = this.generateCacheKey(method, fullUrl);
    this.cache.delete(cacheKey);
  }

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    this.cache.clear();
  }
} 