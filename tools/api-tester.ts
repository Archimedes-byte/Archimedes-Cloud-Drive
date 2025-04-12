/**
 * API测试工具
 * 用于测试所有API端点的功能
 * 
 * 使用方法:
 * 1. 在浏览器控制台中引入并运行
 * 2. 作为Node.js脚本运行（需要设置环境变量）
 */

import { API_PATHS } from '../app/lib/api/paths';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  message: string;
  duration: number;
  data?: any;
  error?: any;
}

interface TestCase {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  skip?: boolean;
  dependsOn?: string; // 依赖的测试名称
}

/**
 * API测试类
 */
class ApiTester {
  private baseUrl: string;
  private token: string | null = null;
  private testResults: Record<string, TestResult> = {};
  private testData: Record<string, any> = {};

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  }

  /**
   * 设置认证令牌
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * 获取认证头信息
   */
  private getAuthHeaders(): Record<string, string> {
    return this.token ? { 
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
  }

  /**
   * 运行单个测试
   */
  async runTest(test: TestCase): Promise<TestResult> {
    if (test.skip) {
      return {
        endpoint: test.endpoint,
        method: test.method,
        status: 0,
        success: false,
        message: '测试被跳过',
        duration: 0
      };
    }

    // 检查依赖
    if (test.dependsOn && (!this.testResults[test.dependsOn] || !this.testResults[test.dependsOn].success)) {
      return {
        endpoint: test.endpoint,
        method: test.method,
        status: 0,
        success: false,
        message: `依赖的测试 ${test.dependsOn} 未成功执行`,
        duration: 0
      };
    }

    const url = `${this.baseUrl}${test.endpoint}`;
    const headers = { ...this.getAuthHeaders(), ...(test.headers || {}) };
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: test.method,
        headers,
        body: test.data ? JSON.stringify(test.data) : undefined,
        credentials: 'include'
      });

      const duration = Date.now() - startTime;
      const contentType = response.headers.get('content-type');
      let data;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
      } catch (e) {
        data = { parseError: e.message };
      }

      const result = {
        endpoint: test.endpoint,
        method: test.method,
        status: response.status,
        success: response.ok,
        message: response.ok ? 'Success' : `Failed with status ${response.status}`,
        duration,
        data
      };

      // 存储结果
      this.testResults[test.name] = result;
      
      // 如果响应成功，存储数据以供后续测试使用
      if (response.ok && data) {
        this.testData[test.name] = data;
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = {
        endpoint: test.endpoint,
        method: test.method,
        status: 0,
        success: false,
        message: `Error: ${error.message}`,
        duration,
        error
      };
      
      this.testResults[test.name] = result;
      return result;
    }
  }

  /**
   * 运行多个测试
   */
  async runTests(tests: TestCase[]): Promise<Record<string, TestResult>> {
    console.log(`开始执行 ${tests.length} 个API测试...`);
    
    for (const test of tests) {
      console.log(`测试: ${test.name} - ${test.method} ${test.endpoint}`);
      const result = await this.runTest(test);
      
      console.log(`结果: ${result.success ? '✅ 成功' : '❌ 失败'} (${result.duration}ms)`);
      if (!result.success) {
        console.error(`失败原因: ${result.message}`, result.error || '');
      }
    }
    
    // 计算测试统计数据
    const total = Object.keys(this.testResults).length;
    const succeeded = Object.values(this.testResults).filter(r => r.success).length;
    const failed = total - succeeded;
    
    console.log(`测试完成. 总计: ${total}, 成功: ${succeeded}, 失败: ${failed}`);
    
    return this.testResults;
  }

  /**
   * 构建标准测试用例
   */
  buildStorageApiTests(): TestCase[] {
    // 文件和文件夹操作测试
    const tests: TestCase[] = [
      // 1. 创建文件夹
      {
        name: 'createFolder',
        endpoint: API_PATHS.STORAGE.FOLDERS.CREATE,
        method: 'POST',
        data: { name: 'Test Folder', tags: ['test', 'api'] }
      },
      
      // 2. 获取文件夹信息
      {
        name: 'getFolder',
        endpoint: API_PATHS.STORAGE.FOLDERS.GET('FOLDER_ID'),
        method: 'GET',
        dependsOn: 'createFolder'
      },
      
      // 3. 获取文件列表
      {
        name: 'listFiles',
        endpoint: API_PATHS.STORAGE.FILES.LIST,
        method: 'GET'
      },
      
      // 4. 获取存储统计
      {
        name: 'getStorageStats',
        endpoint: API_PATHS.STORAGE.STATS,
        method: 'GET'
      },
      
      // 5. 获取存储配额
      {
        name: 'getStorageQuota',
        endpoint: API_PATHS.STORAGE.QUOTA,
        method: 'GET'
      },
      
      // 6. 获取最近文件
      {
        name: 'getRecentFiles',
        endpoint: API_PATHS.STORAGE.RECENT,
        method: 'GET'
      },
      
      // 7. 获取标签列表
      {
        name: 'listTags',
        endpoint: API_PATHS.STORAGE.TAGS.LIST,
        method: 'GET'
      },
      
      // 8. 搜索文件
      {
        name: 'searchFiles',
        endpoint: `${API_PATHS.STORAGE.FILES.SEARCH}?query=test`,
        method: 'GET'
      },
      
      // 9. 更新文件夹
      {
        name: 'updateFolder',
        endpoint: API_PATHS.STORAGE.FOLDERS.UPDATE('FOLDER_ID'),
        method: 'PATCH',
        data: { name: 'Updated Test Folder' },
        dependsOn: 'createFolder'
      },
      
      // 10. 删除文件夹
      {
        name: 'deleteFolder',
        endpoint: API_PATHS.STORAGE.FILES.DELETE,
        method: 'POST',
        data: { fileIds: ['FOLDER_ID'] },
        dependsOn: 'updateFolder'
      }
    ];
    
    return tests;
  }
  
  /**
   * 自动替换依赖ID
   */
  prepareTests(tests: TestCase[]): TestCase[] {
    return tests.map(test => {
      // 复制测试以避免修改原始对象
      const preparedTest = { ...test };
      
      if (test.dependsOn && this.testData[test.dependsOn]) {
        const dependencyData = this.testData[test.dependsOn];
        
        // 替换端点中的ID
        if (preparedTest.endpoint.includes('FOLDER_ID') && dependencyData.data && dependencyData.data.id) {
          preparedTest.endpoint = preparedTest.endpoint.replace('FOLDER_ID', dependencyData.data.id);
        }
        
        // 替换数据中的ID
        if (preparedTest.data && typeof preparedTest.data === 'object') {
          const dataStr = JSON.stringify(preparedTest.data);
          if (dataStr.includes('FOLDER_ID') && dependencyData.data && dependencyData.data.id) {
            preparedTest.data = JSON.parse(dataStr.replace('FOLDER_ID', dependencyData.data.id));
          }
        }
      }
      
      return preparedTest;
    });
  }
}

// 创建API测试器实例并导出
export const apiTester = new ApiTester();

/**
 * 运行默认测试
 */
export async function runApiTests(token?: string) {
  if (token) {
    apiTester.setToken(token);
  }
  
  // 构建测试用例
  const tests = apiTester.buildStorageApiTests();
  
  // 准备测试
  const preparedTests = apiTester.prepareTests(tests);
  
  // 运行测试
  return await apiTester.runTests(preparedTests);
}

// 如果是直接执行此脚本，则运行测试
if (typeof require !== 'undefined' && require.main === module) {
  const token = process.env.API_TOKEN;
  runApiTests(token).catch(console.error);
} 