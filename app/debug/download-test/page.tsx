'use client';

import React, { useState } from 'react';
import { testFolderDownload, testBlobDownload, checkBrowserDownloadSupport } from '../download-debug';

// 简单的卡片样式
const cardStyle = {
  padding: '20px',
  margin: '10px 0',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  backgroundColor: 'white'
};

// 按钮样式
const buttonStyle = {
  padding: '8px 16px',
  margin: '0 8px 8px 0',
  backgroundColor: '#4285f4',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

// 输入框样式
const inputStyle = {
  padding: '8px',
  margin: '0 8px 8px 0',
  borderRadius: '4px',
  border: '1px solid #ccc',
  width: '300px'
};

// 日志区域样式
const logContainerStyle = {
  backgroundColor: '#f8f9fa',
  padding: '16px',
  borderRadius: '4px',
  maxHeight: '400px',
  overflowY: 'auto' as const,
  fontFamily: 'monospace',
  fontSize: '14px',
  whiteSpace: 'pre-wrap' as const,
  marginTop: '20px'
};

const DownloadTestPage: React.FC = () => {
  // 状态管理
  const [folderId, setFolderId] = useState('b31c2164-933e-426f-80a9-bfd55fab7fc6');
  const [fileId, setFileId] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [testType, setTestType] = useState('text');
  const [testSize, setTestSize] = useState('10240');
  const [folderFileCount, setFolderFileCount] = useState('5');
  const [folderFileSize, setFolderFileSize] = useState('1024');

  // 替换控制台输出，捕获日志
  const captureConsoleOutput = () => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setLogs(prev => [...prev, `[LOG] ${message}`]);
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setLogs(prev => [...prev, `[ERROR] ${message}`]);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setLogs(prev => [...prev, `[WARN] ${message}`]);
      originalWarn.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  };

  // 执行测试并捕获日志
  const runTest = async (testFn: () => Promise<void>) => {
    setLogs([]);
    const restoreConsole = captureConsoleOutput();
    try {
      await testFn();
    } catch (e) {
      console.error('测试执行失败:', e);
    } finally {
      setTimeout(restoreConsole, 500); // 延迟恢复控制台，以确保所有日志都被捕获
    }
  };

  // 测试API调试端点
  const testApiEndpoint = async () => {
    try {
      console.log(`测试API调试端点，类型: ${testType}, 大小: ${testSize} 字节`);
      
      // 构建URL
      const url = `/api/debug?type=${testType}&size=${testSize}`;
      console.log(`请求URL: ${url}`);
      
      // 发送请求
      const response = await fetch(url);
      console.log(`响应状态: ${response.status} ${response.statusText}`);
      
      // 记录响应头
      console.log('响应头:');
      response.headers.forEach((value, name) => {
        console.log(`- ${name}: ${value}`);
      });
      
      if (!response.ok) {
        console.error('API请求失败');
        return;
      }
      
      // 获取响应体
      const blob = await response.blob();
      console.log(`响应大小: ${blob.size} 字节, 类型: ${blob.type}`);
      
      // 创建下载链接
      const url2 = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url2;
      
      // 从Content-Disposition中获取文件名
      const contentDisposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      const fileName = filenameMatch ? filenameMatch[1] : 'download';
      
      link.download = fileName;
      link.style.display = 'none';
      
      // 添加到DOM并触发点击
      document.body.appendChild(link);
      link.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url2);
        console.log('API测试下载完成');
      }, 200);
      
    } catch (e) {
      console.error('API测试过程出错:', e);
    }
  };

  // 检测浏览器下载安全策略
  const checkBrowserSecurity = () => {
    console.log('检查浏览器安全策略:');
    
    // 检查 CSP (Content Security Policy)
    console.log('1. 内容安全策略 (CSP) 检查:');
    try {
      const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (meta) {
        console.log(`CSP策略存在: ${meta.getAttribute('content')}`);
      } else {
        console.log('页面没有定义CSP策略');
      }
    } catch (e) {
      console.error('CSP检查失败:', e);
    }
    
    // 检查是否可以使用 Blob URL
    console.log('2. Blob URL 使用检查:');
    try {
      const testBlob = new Blob(['test']);
      const testUrl = URL.createObjectURL(testBlob);
      console.log(`成功创建Blob URL: ${testUrl}`);
      URL.revokeObjectURL(testUrl);
    } catch (e) {
      console.error('Blob URL创建失败:', e);
    }
    
    // 检查浏览器阻止的功能
    console.log('3. 弹出窗口阻止检查:');
    try {
      const popupTest = window.open('about:blank');
      if (popupTest) {
        console.log('弹出窗口未被阻止');
        popupTest.close();
      } else {
        console.log('弹出窗口被阻止 - 可能影响下载功能');
      }
    } catch (e) {
      console.error('弹出窗口测试失败:', e);
    }
    
    console.log('4. 浏览器版本信息:');
    console.log(`User Agent: ${navigator.userAgent}`);
  };

  // 测试模拟文件夹下载
  const testFolderDownloadMock = async () => {
    try {
      console.log(`测试模拟文件夹下载，文件数: ${folderFileCount}, 每文件大小: ${folderFileSize} 字节`);
      
      // 构建URL
      const url = `/api/debug/folder-download?files=${folderFileCount}&size=${folderFileSize}`;
      console.log(`请求URL: ${url}`);
      
      // 发送请求
      const response = await fetch(url);
      console.log(`响应状态: ${response.status} ${response.statusText}`);
      
      // 记录响应头
      console.log('响应头:');
      response.headers.forEach((value, name) => {
        console.log(`- ${name}: ${value}`);
      });
      
      if (!response.ok) {
        console.error('文件夹下载请求失败');
        return;
      }
      
      // 获取响应体
      const blob = await response.blob();
      console.log(`文件夹下载响应大小: ${blob.size} 字节, 类型: ${blob.type}`);
      
      // 检查blob是否为空
      if (blob.size === 0) {
        console.error('下载的ZIP文件为空');
        return;
      }
      
      // 检查是否是ZIP文件
      if (blob.type !== 'application/zip') {
        console.warn(`响应不是ZIP文件，而是: ${blob.type}`);
      }
      
      // 创建下载链接
      console.log('创建下载链接...');
      const url2 = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url2;
      link.download = 'test_folder.zip';
      link.style.display = 'none';
      
      // 触发下载
      console.log('添加链接到DOM并触发点击...');
      document.body.appendChild(link);
      link.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url2);
        console.log('文件夹下载过程完成');
      }, 200);
      
    } catch (e) {
      console.error('文件夹下载测试过程出错:', e);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>下载功能调试页面</h1>
      
      <div style={cardStyle}>
        <h2>浏览器下载支持检查</h2>
        <button 
          style={buttonStyle}
          onClick={() => runTest(async () => checkBrowserDownloadSupport())}
        >
          检查浏览器下载支持
        </button>
      </div>
      
      <div style={cardStyle}>
        <h2>文件夹下载测试</h2>
        <div>
          <input
            style={inputStyle}
            type="text"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            placeholder="输入文件夹ID"
          />
        </div>
        <button 
          style={buttonStyle}
          onClick={() => runTest(async () => testFolderDownload(folderId))}
        >
          测试文件夹下载
        </button>
      </div>
      
      <div style={cardStyle}>
        <h2>通用下载测试</h2>
        <div>
          <input
            style={inputStyle}
            type="text"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            placeholder="输入文件ID（可选）"
          />
        </div>
        <button 
          style={buttonStyle}
          onClick={() => runTest(async () => testBlobDownload(fileId))}
        >
          测试Blob下载
        </button>
      </div>
      
      <div style={cardStyle}>
        <h2>浏览器安全检查</h2>
        <button 
          style={buttonStyle}
          onClick={() => runTest(async () => checkBrowserSecurity())}
        >
          检查浏览器安全策略
        </button>
      </div>
      
      <div style={cardStyle}>
        <h2>API调试端点测试</h2>
        <div>
          <select 
            style={{...inputStyle, width: '150px'}} 
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
          >
            <option value="text">文本文件</option>
            <option value="binary">二进制文件</option>
            <option value="zip">ZIP文件</option>
            <option value="headers-only">仅头信息</option>
          </select>
          
          <input
            style={{...inputStyle, width: '150px'}}
            type="number"
            value={testSize}
            onChange={(e) => setTestSize(e.target.value)}
            placeholder="文件大小 (字节)"
          />
        </div>
        <button 
          style={buttonStyle}
          onClick={() => runTest(async () => testApiEndpoint())}
        >
          测试API下载
        </button>
      </div>
      
      <div style={cardStyle}>
        <h2>模拟文件夹下载测试</h2>
        <div>
          <input
            style={{...inputStyle, width: '150px'}}
            type="number"
            value={folderFileCount}
            onChange={(e) => setFolderFileCount(e.target.value)}
            placeholder="文件数量"
          />
          
          <input
            style={{...inputStyle, width: '150px'}}
            type="number"
            value={folderFileSize}
            onChange={(e) => setFolderFileSize(e.target.value)}
            placeholder="每个文件大小 (字节)"
          />
        </div>
        <button 
          style={buttonStyle}
          onClick={() => runTest(async () => testFolderDownloadMock())}
        >
          测试模拟文件夹下载
        </button>
        <p style={{ fontSize: '14px', color: '#666' }}>
          此测试创建一个包含指定数量文件的ZIP压缩包，绕过实际文件系统，可以排除文件读取问题。
        </p>
      </div>
      
      {/* 日志显示区域 */}
      <div style={logContainerStyle}>
        <h3>测试日志</h3>
        {logs.length === 0 ? (
          <p>尚未运行测试...</p>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index} 
              style={{ 
                color: log.startsWith('[ERROR]') ? 'red' : 
                       log.startsWith('[WARN]') ? 'orange' : 'black',
                marginBottom: '4px'
              }}
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DownloadTestPage; 