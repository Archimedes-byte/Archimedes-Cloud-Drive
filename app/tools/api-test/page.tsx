'use client';

import { useState, useEffect } from 'react';
import { runApiTests } from '../../../tools/api-tester';
import { useSession } from 'next-auth/react';

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

export default function ApiTestPage() {
  const [results, setResults] = useState<Record<string, TestResult> | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState({ total: 0, success: 0, failed: 0 });
  const { data: session } = useSession();
  
  const runTests = async () => {
    setIsRunning(true);
    try {
      const testResults = await runApiTests();
      setResults(testResults);
      
      // 计算汇总
      const total = Object.keys(testResults).length;
      const success = Object.values(testResults).filter(r => r.success).length;
      setSummary({
        total,
        success,
        failed: total - success
      });
    } catch (error) {
      console.error('测试执行失败:', error);
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">API测试工具</h1>
        
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="mr-4">
              <span className="font-semibold">登录状态:</span>{' '}
              {session ? (
                <span className="text-green-600">已登录 ({session.user?.email})</span>
              ) : (
                <span className="text-red-600">未登录</span>
              )}
            </div>
            
            <button
              onClick={runTests}
              disabled={isRunning || !session}
              className={`px-4 py-2 rounded ${
                !session ? 'bg-gray-300 cursor-not-allowed' : 
                isRunning ? 'bg-blue-300 cursor-wait' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isRunning ? '测试运行中...' : '运行API测试'}
            </button>
          </div>
          
          {!session && (
            <div className="text-orange-500 mb-4">
              请先登录再运行测试. 测试需要授权访问。
            </div>
          )}
        </div>
        
        {results && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-lg font-semibold">总计</div>
                <div className="text-2xl">{summary.total}</div>
              </div>
              <div className="bg-green-100 p-4 rounded">
                <div className="text-lg font-semibold text-green-700">成功</div>
                <div className="text-2xl text-green-700">{summary.success}</div>
              </div>
              <div className="bg-red-100 p-4 rounded">
                <div className="text-lg font-semibold text-red-700">失败</div>
                <div className="text-2xl text-red-700">{summary.failed}</div>
              </div>
            </div>
            
            <div className="border rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      测试名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      端点
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      方法
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      耗时
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      结果
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(results).map(([name, result]) => (
                    <tr key={name} className={result.success ? '' : 'bg-red-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.endpoint}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.duration}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.success
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.success ? '成功' : '失败'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">详细结果</h2>
              <div className="bg-gray-800 text-gray-100 p-4 rounded overflow-auto max-h-96">
                <pre>{JSON.stringify(results, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 