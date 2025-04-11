import { message } from 'antd';

// 定义API错误接口
export interface ApiErrorDetails {
  status: number;
  code?: string;
  message: string;
  errors?: Record<string, string[]>;
}

// 自定义API错误类
export class ApiError extends Error {
  status: number;
  code?: string;
  validationErrors?: Record<string, string[]>;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = 'ApiError';
    this.status = details.status;
    this.code = details.code;
    this.validationErrors = details.errors;
  }

  // 获取错误描述
  getDescription(): string {
    if (this.validationErrors) {
      // 提取所有验证错误信息并格式化
      const errorMessages = Object.entries(this.validationErrors)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('\n');
      return `${this.message}\n${errorMessages}`;
    }
    return this.message;
  }
}

// 请求配置接口
export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  showErrorMessage?: boolean;
}

// API客户端类
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * 处理API响应
   */
  private async handleResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    // 如果是无内容响应，直接返回null
    if (response.status === 204) {
      return null;
    }
    
    // 解析响应内容
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // 如果响应不成功，抛出错误
    if (!response.ok) {
      throw new ApiError({
        status: response.status,
        code: data.code,
        message: data.error || data.message || `请求失败: ${response.status}`,
        errors: data.errors
      });
    }
    
    // 返回数据，优先使用data字段
    return data.data !== undefined ? data.data : data;
  }

  /**
   * 构建完整URL并附加查询参数
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return url;
  }

  /**
   * 发送HTTP请求
   */
  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, showErrorMessage = true, ...fetchConfig } = config;
    const url = this.buildUrl(endpoint, params);
    
    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers: {
          'Content-Type': 'application/json',
          ...fetchConfig.headers,
        },
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('API请求失败:', error);
      
      // 显示错误消息
      if (showErrorMessage) {
        if (error instanceof ApiError) {
          message.error(error.getDescription());
        } else {
          message.error('网络请求失败，请稍后重试');
        }
      }
      
      throw error;
    }
  }

  /**
   * HTTP GET请求
   */
  async get<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
    });
  }

  /**
   * HTTP POST请求
   */
  async post<T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * HTTP PUT请求
   */
  async put<T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * HTTP PATCH请求
   */
  async patch<T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * HTTP DELETE请求
   */
  async delete<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  }
}

// 创建全局API客户端实例
export const api = new ApiClient(); 