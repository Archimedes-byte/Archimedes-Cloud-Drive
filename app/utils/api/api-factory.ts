/**
 * API 服务工厂
 * 
 * 提供统一的 API 服务创建和管理机制，确保所有 API 服务共享相同的错误处理和缓存策略
 */

import { ApiClient, ApiClientConfig, RequestConfig } from './api-client';
import { ApiDataResponse } from '@/app/types/api';
import { withErrorHandling } from '@/app/utils/error';

/**
 * API服务接口
 * 定义所有API服务的基本结构
 */
export interface ApiService {
  /** 重置API客户端状态 */
  reset(): void;
  /** 清除所有缓存 */
  clearCache(): void;
}

/**
 * 全局API配置
 */
const globalApiConfig: ApiClientConfig = {
  // 默认重试一次
  maxRetries: 1,
  // 默认启用缓存
  useCache: true,
  // 默认缓存5分钟
  defaultCacheTime: 5 * 60 * 1000,
  // 默认超时10秒
  timeout: 10000,
  // 全局请求拦截器
  requestInterceptor: (config) => {
    // 在这里可以添加全局认证令牌等
    return config;
  },
  // 全局响应拦截器
  responseInterceptor: (response) => {
    // 在这里可以处理通用的响应逻辑
    return response;
  },
  // 全局错误拦截器
  errorInterceptor: (error) => {
    // 在这里可以处理通用的错误逻辑，例如401错误时刷新token
    console.error('API错误:', error);
    return error;
  }
};

/**
 * API服务工厂类
 * 用于创建和管理所有API服务
 */
export class ApiServiceFactory {
  private static instance: ApiServiceFactory;
  private services: Map<string, ApiService> = new Map();
  private defaultConfig: ApiClientConfig;

  /**
   * 私有构造函数，单例模式
   */
  private constructor(config: ApiClientConfig = {}) {
    this.defaultConfig = {
      ...globalApiConfig,
      ...config
    };
  }

  /**
   * 获取工厂实例
   */
  public static getInstance(config?: ApiClientConfig): ApiServiceFactory {
    if (!ApiServiceFactory.instance) {
      ApiServiceFactory.instance = new ApiServiceFactory(config);
    }
    return ApiServiceFactory.instance;
  }

  /**
   * 创建API服务
   * @param serviceName 服务名称
   * @param baseUrl 服务基础URL
   * @param config 额外配置
   */
  public createService<T extends ApiService>(
    serviceName: string,
    serviceCreator: (client: ApiClient) => T,
    baseUrl: string = '',
    config: Partial<ApiClientConfig> = {}
  ): T {
    // 检查是否已经存在同名服务
    if (this.services.has(serviceName)) {
      return this.services.get(serviceName) as T;
    }

    // 创建API客户端
    const apiClient = new ApiClient({
      ...this.defaultConfig,
      baseUrl,
      ...config
    });

    // 创建服务
    const service = serviceCreator(apiClient);
    this.services.set(serviceName, service);

    return service;
  }

  /**
   * 获取已创建的服务
   * @param serviceName 服务名称
   */
  public getService<T extends ApiService>(serviceName: string): T | undefined {
    return this.services.get(serviceName) as T | undefined;
  }

  /**
   * 重置所有服务
   */
  public resetAllServices(): void {
    this.services.forEach(service => {
      service.reset();
    });
  }

  /**
   * 清除所有服务的缓存
   */
  public clearAllCaches(): void {
    this.services.forEach(service => {
      service.clearCache();
    });
  }
}

/**
 * 创建基础API服务
 * @param client API客户端
 * @returns 基础API服务
 */
export function createBaseApiService(client: ApiClient): ApiService {
  return {
    reset() {
      client.clearAllCache();
    },
    clearCache() {
      client.clearAllCache();
    }
  };
}

/**
 * 创建API服务工厂实例
 */
export const apiServiceFactory = ApiServiceFactory.getInstance(); 