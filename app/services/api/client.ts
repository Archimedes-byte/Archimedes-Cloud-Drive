/**
 * API客户端
 * 
 * 统一处理所有API请求，包含重试、超时和错误处理逻辑
 */
import { UserProfile, UserProfileInput, ApiResponse } from '@/app/types';

// 重试配置接口
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  increaseDelay?: boolean;
}

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  increaseDelay: true
};

// 默认请求超时时间 (15秒)
const DEFAULT_TIMEOUT = 15000;

/**
 * API客户端类
 * 封装所有API请求逻辑，统一处理错误、重试和超时
 */
export class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * 基础请求方法
   * 处理重试、超时和错误
   */
  async request<T>(
    url: string, 
    options: RequestInit = {}, 
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    const fullUrl = `${this.baseUrl}${url}`;
    let retries = 0;
    
    // 创建AbortController用于请求超时控制
    const controller = new AbortController();
    const { signal } = controller;
    
    // 合并选项
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...(options.headers || {})
      },
      signal
    };
    
    // 设置超时
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, DEFAULT_TIMEOUT);
    
    while (true) {
      try {
        const response = await fetch(fullUrl, fetchOptions);
        
        // 清除超时定时器
        clearTimeout(timeoutId);
        
        // 检查响应状态
        if (!response.ok) {
          throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        }
        
        // 解析JSON响应
        const data = await response.json();
        
        // 检查API响应状态
        if (data.success === false) {
          throw new Error(data.error || '请求失败');
        }
        
        return data as T;
      } catch (error) {
        // 清除超时定时器
        clearTimeout(timeoutId);
        
        // 如果重试次数已达上限，则抛出错误
        if (retries >= retryConfig.maxRetries) {
          throw error;
        }
        
        // 计算重试延迟
        const delay = retryConfig.increaseDelay 
          ? retryConfig.retryDelay * (retries + 1) 
          : retryConfig.retryDelay;
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // 重试次数加1
        retries++;
        
        // 重置AbortController
        const newController = new AbortController();
        fetchOptions.signal = newController.signal;
      }
    }
  }
  
  /**
   * 获取用户资料
   */
  async getUserProfile(): Promise<UserProfile> {
    const response = await this.request<ApiResponse<{profile: UserProfile}>>('/api/user/profile');
    
    if (!response.data) {
      // 添加更详细的错误信息以便调试
      console.error('API返回格式不符合预期:', JSON.stringify(response));
      throw new Error('未返回用户资料');
    }
    
    // 适配新的响应格式
    const profile = response.data.profile;
    if (!profile) {
      console.error('API返回的数据中没有profile字段:', JSON.stringify(response.data));
      throw new Error('未返回用户资料');
    }
    
    return profile;
  }
  
  /**
   * 更新用户资料
   */
  async updateUserProfile(data: UserProfileInput): Promise<UserProfile> {
    const response = await this.request<ApiResponse<{profile: UserProfile}>>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    if (!response.data || !response.data.profile) {
      throw new Error('未返回更新后的用户资料');
    }
    
    return response.data.profile;
  }
}

// 创建单例实例
export const apiClient = new ApiClient();

// 创建hook便于在组件中使用
import { useCallback } from 'react';

export function useApiClient() {
  // 返回实例的方法，确保组件中使用时能够获得最新状态
  return useCallback(() => apiClient, []);
} 