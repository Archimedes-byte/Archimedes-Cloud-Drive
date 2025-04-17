/**
 * 调试工具 - 用于辅助定位问题和测试功能
 */
import { API_PATHS } from '@/app/lib/api/paths';

/**
 * 直接测试文件夹下载
 * @param folderId 文件夹ID
 */
export async function testFolderDownload(folderId: string): Promise<void> {
  if (!folderId || typeof folderId !== 'string') {
    console.error('无效的文件夹ID');
    return;
  }

  console.log(`开始测试文件夹下载, 文件夹ID: ${folderId}`);
  const startTime = performance.now();

  try {
    // 发送下载请求
    console.log('发送下载请求...');
    const response = await fetch(API_PATHS.STORAGE.FILES.DOWNLOAD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds: [folderId] }),
    });

    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    if (response.redirected) {
      console.error(`请求被重定向到: ${response.url}, 这可能是问题所在!`);
    }

    console.log('响应头信息:');
    response.headers.forEach((value, name) => {
      console.log(`- ${name}: ${value}`);
    });

    if (!response.ok) {
      console.error('下载请求失败');
      try {
        const errorData = await response.json();
        console.error('错误详情:', errorData);
      } catch (e) {
        console.error('无法解析错误响应');
      }
      return;
    }

    // 获取响应体
    console.log('正在读取响应数据...');
    const blob = await response.blob();
    console.log(`响应数据读取完成，大小: ${(blob.size / 1024).toFixed(2)} KB, 用时: ${(performance.now() - startTime).toFixed(0)}ms`);

    // 检查是否为ZIP类型
    const isZip = response.headers.get('Content-Type') === 'application/zip';
    console.log(`响应类型是否为ZIP: ${isZip ? '是' : '否'}`);

    // 从Content-Disposition获取文件名
    const contentDisposition = response.headers.get('Content-Disposition') || '';
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    const fileName = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'folder.zip';
    console.log(`下载文件名: ${fileName}`);

    // 创建下载链接
    console.log('创建下载链接...');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    // 添加到DOM并触发点击
    console.log('触发下载...');
    document.body.appendChild(link);
    link.click();

    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log(`测试完成，总用时: ${(performance.now() - startTime).toFixed(0)}ms`);
    }, 200);

  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

/**
 * 检查浏览器下载支持情况
 */
export function checkDownloadSupport(): void {
  try {
    console.log('检查浏览器下载支持:');
    
    // 检查 URL 和 Blob API
    console.log(`URL.createObjectURL 可用: ${typeof URL.createObjectURL === 'function'}`);
    console.log(`Blob 构造函数可用: ${typeof Blob === 'function'}`);
    
    // 尝试创建下载链接
    const testBlob = new Blob(['测试内容'], {type: 'text/plain'});
    console.log(`创建测试 Blob 成功，大小: ${testBlob.size} 字节`);
    
    const objectUrl = URL.createObjectURL(testBlob);
    console.log(`创建 ObjectURL 成功: ${objectUrl}`);
    
    // 测试链接元素的download属性
    const link = document.createElement('a');
    console.log(`a.download 属性可用: ${'download' in link}`);
    
    // 清理
    URL.revokeObjectURL(objectUrl);
    console.log('检查完成，浏览器支持文件下载所需的所有功能');
  } catch (e) {
    console.error('检查过程中出错:', e);
  }
}

// 添加到全局对象，以便在浏览器控制台中使用
if (typeof window !== 'undefined') {
  (window as any).__debugTools = {
    testFolderDownload,
    checkDownloadSupport
  };
  console.log('调试工具已加载。在控制台使用 __debugTools 对象访问。');
} 