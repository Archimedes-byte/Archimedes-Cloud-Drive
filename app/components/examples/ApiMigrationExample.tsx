'use client';

import { useState, useEffect } from 'react';
import { fileApi } from '@/app/lib/api/file-api';
import { FileInfo } from '@/app/types';

/**
 * API迁移示例组件
 * 展示旧API和新API的使用对比
 */
export default function ApiMigrationExample() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiType, setApiType] = useState<'old' | 'new'>('new');
  
  // 使用旧API获取文件列表
  const fetchFilesOldApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 旧方式：直接调用API
      const response = await fetch('/api/storage/files');
      const data = await response.json();
      
      if (data && Array.isArray(data.files)) {
        setFiles(data.files);
      } else {
        throw new Error('无效的响应格式');
      }
    } catch (err) {
      console.error('获取文件失败:', err);
      setError(err.message || '获取文件列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 使用新API获取文件列表
  const fetchFilesNewApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 新方式：使用API客户端
      const { items } = await fileApi.getFiles({
        page: 1,
        pageSize: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      setFiles(items);
    } catch (err) {
      console.error('获取文件失败:', err);
      setError(err.message || '获取文件列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // 根据选择的API类型获取文件
    if (apiType === 'old') {
      fetchFilesOldApi();
    } else {
      fetchFilesNewApi();
    }
  }, [apiType]);
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">API迁移示例</h2>
      
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-2">
          <span className="font-medium">API类型:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setApiType('old')}
              className={`px-3 py-1 rounded ${
                apiType === 'old'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              旧API (直接fetch)
            </button>
            <button
              onClick={() => setApiType('new')}
              className={`px-3 py-1 rounded ${
                apiType === 'new'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              新API (客户端)
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          {apiType === 'old' ? (
            <>
              <code>const response = await fetch('/api/storage/files'); const data = await response.json();</code>
              <div className="mt-1 text-red-500 text-xs">注意: 直接使用API路径是不推荐的方式，请使用API客户端</div>
            </>
          ) : (
            <code>const {'{ items }'} = await fileApi.getFiles();</code>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">文件列表</h3>
            <span className="text-sm text-gray-500">{files.length}个文件</span>
          </div>
          
          {files.length === 0 ? (
            <div className="bg-gray-100 p-4 rounded text-center text-gray-600">
              没有文件
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {files.map(file => (
                <li key={file.id} className="py-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 mr-3 flex-shrink-0 text-center">
                      {file.isFolder ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.isFolder ? '文件夹' : `${file.type} · ${formatBytes(file.size || 0)}`}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {file.updatedAt ? new Date(file.updatedAt).toLocaleDateString() : '无日期'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <div className="mt-6 border-t pt-4">
        <h3 className="font-semibold mb-2">迁移要点</h3>
        <ul className="space-y-1 text-sm list-disc pl-5">
          <li>使用API客户端简化API调用</li>
          <li>统一的响应格式处理</li>
          <li>更好的类型支持和自动补全</li>
          <li>统一的错误处理</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
} 