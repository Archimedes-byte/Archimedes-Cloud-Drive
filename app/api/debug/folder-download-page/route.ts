import { NextRequest, NextResponse } from 'next/server';
import { API_PATHS } from '@/app/lib/api/paths';

/**
 * 文件夹下载辅助API路由
 * 提供一个专门的页面，从新窗口中发起文件夹下载请求
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const folderId = searchParams.get('id');
  const folderName = searchParams.get('name') || '文件夹';
  
  if (!folderId) {
    return NextResponse.json({ error: '缺少文件夹ID' }, { status: 400 });
  }
  
  // 生成一个HTML页面，在页面加载时立即触发下载
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>下载文件夹: ${folderName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-top: 50px;
        }
        h1 {
          color: #1a73e8;
          margin-bottom: 15px;
        }
        .download-info {
          font-size: 16px;
          margin-bottom: 20px;
        }
        .progress {
          height: 6px;
          background-color: #e0e0e0;
          border-radius: 3px;
          margin: 20px 0;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          background-color: #1a73e8;
          width: 0%;
          transition: width 0.3s ease;
        }
        .manual-download {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        button {
          background-color: #1a73e8;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        button:hover {
          background-color: #0d62d1;
        }
        .success, .error {
          margin-top: 20px;
          padding: 10px;
          border-radius: 4px;
        }
        .success {
          background-color: #e6f7e6;
          color: #2e7d32;
        }
        .error {
          background-color: #ffebee;
          color: #c62828;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>文件夹下载</h1>
        <div class="download-info">
          <p>准备下载文件夹: <strong>${folderName}</strong></p>
          <p>文件夹将被压缩为ZIP格式下载到您的设备</p>
        </div>
        
        <div class="progress">
          <div class="progress-bar" id="progressBar"></div>
        </div>
        
        <div id="status">准备下载中...</div>
        
        <div class="manual-download" id="manualDownload" style="display: none;">
          <p>如果下载没有自动开始，请点击下面的按钮手动下载：</p>
          <button id="downloadButton">开始下载</button>
        </div>
      </div>
      
      <script>
        // 处理下载过程
        document.addEventListener('DOMContentLoaded', function() {
          const folderId = '${folderId}';
          const progressBar = document.getElementById('progressBar');
          const statusEl = document.getElementById('status');
          const manualDownloadEl = document.getElementById('manualDownload');
          const downloadButton = document.getElementById('downloadButton');
          
          let downloadStarted = false;
          
          // 更新进度
          function updateProgress(percent, message) {
            progressBar.style.width = percent + '%';
            if (message) {
              statusEl.textContent = message;
            }
          }
          
          // 显示错误
          function showError(message) {
            statusEl.innerHTML = '<div class="error">' + message + '</div>';
            manualDownloadEl.style.display = 'block';
          }
          
          // 显示成功
          function showSuccess(message) {
            statusEl.innerHTML = '<div class="success">' + message + '</div>';
          }
          
          // 执行下载
          async function startDownload() {
            try {
              if (downloadStarted) return;
              downloadStarted = true;
              
              updateProgress(10, '连接服务器...');
              
              // 发送下载请求
              const response = await fetch('${API_PATHS.STORAGE.FILES.DOWNLOAD}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileIds: [folderId] }),
              });
              
              updateProgress(30, '接收数据中...');
              
              if (!response.ok) {
                throw new Error('下载请求失败，服务器返回错误: ' + response.status);
              }
              
              // 获取文件blob
              const blob = await response.blob();
              updateProgress(70, '处理文件中...');
              
              if (blob.size === 0) {
                throw new Error('下载的文件为空');
              }
              
              // 从响应头获取文件名
              const contentDisposition = response.headers.get('Content-Disposition') || '';
              let fileName = '${folderName}.zip';
              
              const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/);
              if (filenameMatch && filenameMatch[1]) {
                fileName = decodeURIComponent(filenameMatch[1]);
              }
              
              // 确保有.zip扩展名
              if (!fileName.toLowerCase().endsWith('.zip')) {
                fileName += '.zip';
              }
              
              updateProgress(90, '准备下载...');
              
              // 创建下载链接
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              link.style.display = 'none';
              
              // 添加到DOM并点击
              document.body.appendChild(link);
              link.click();
              
              // 清理
              setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                updateProgress(100, '下载已开始');
                showSuccess('下载已成功开始，请检查您的下载文件夹');
              }, 1000);
              
              // 为手动下载按钮设置点击事件
              downloadButton.onclick = function() {
                const newLink = document.createElement('a');
                newLink.href = url;
                newLink.download = fileName;
                newLink.style.display = 'none';
                document.body.appendChild(newLink);
                newLink.click();
                setTimeout(() => {
                  document.body.removeChild(newLink);
                }, 100);
              };
              
              // 显示手动下载选项
              setTimeout(() => {
                manualDownloadEl.style.display = 'block';
              }, 3000);
              
            } catch (error) {
              console.error('下载过程出错:', error);
              showError('下载过程出错: ' + error.message);
              downloadStarted = false;
            }
          }
          
          // 启动下载过程
          setTimeout(startDownload, 1000);
          
          // 设置手动下载按钮
          downloadButton.addEventListener('click', startDownload);
        });
      </script>
    </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
} 