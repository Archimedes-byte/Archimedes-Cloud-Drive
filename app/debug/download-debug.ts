// 文件下载调试工具
import { API_PATHS } from '@/app/lib/api/paths';

/**
 * 测试文件夹下载功能
 * @param folderId 要下载的文件夹ID
 */
export async function testFolderDownload(folderId: string): Promise<void> {
  console.log(`开始测试文件夹下载, 文件夹ID: ${folderId}`);
  
  try {
    // 记录开始时间
    const startTime = performance.now();
    
    // 使用POST方法处理下载
    console.log('发送下载请求...');
    const response = await fetch(API_PATHS.STORAGE.FILES.DOWNLOAD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds: [folderId] }),
    });
    
    console.log(`请求响应状态: ${response.status} ${response.statusText}`);
    console.log('响应头信息:');
    response.headers.forEach((value, name) => {
      console.log(`- ${name}: ${value}`);
    });
    
    if (!response.ok) {
      console.error('下载请求失败:', response.status, response.statusText);
      try {
        const errorData = await response.json();
        console.error('错误详情:', errorData);
      } catch (e) {
        console.error('无法解析错误响应');
      }
      return;
    }
    
    console.log('下载请求成功，获取Blob数据...');
    const blob = await response.blob();
    console.log(`Blob数据获取完成，大小: ${(blob.size / 1024).toFixed(2)} KB, 用时: ${(performance.now() - startTime).toFixed(2)}ms`);
    
    // 检查blob是否为空
    if (blob.size === 0) {
      console.error('下载的文件为空');
      return;
    }
    
    // 从响应头获取文件名和内容类型
    const contentDisposition = response.headers.get('Content-Disposition') || '';
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    console.log(`内容类型: ${contentType}`);
    console.log(`内容处理方式: ${contentDisposition}`);
    
    let fileName = '下载文件';
    
    // 尝试从响应头中提取文件名
    const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(?:;|$)/);
    if (filenameMatch && filenameMatch[1]) {
      fileName = decodeURIComponent(filenameMatch[1]);
      console.log(`从响应头解析的文件名: ${fileName}`);
    } else {
      console.log('从响应头无法获取文件名，使用默认名称');
    }
    
    // 确保ZIP文件有正确的扩展名
    if (contentType === 'application/zip' && !fileName.toLowerCase().endsWith('.zip')) {
      fileName = `${fileName}.zip`;
      console.log(`调整文件名为: ${fileName}`);
    }
    
    console.log(`准备下载文件: ${fileName}, 类型: ${contentType}`);
    
    // 创建下载链接 - 使用更安全可靠的方式
    console.log('创建下载链接...');
    const url = URL.createObjectURL(new Blob([blob], { type: contentType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    // 触发下载
    console.log('添加链接到DOM并触发点击...');
    document.body.appendChild(link);
    
    // 添加点击事件监听器以验证是否被点击
    link.addEventListener('click', () => {
      console.log('下载链接被点击');
    });
    
    link.click();
    
    console.log('链接已点击，等待200ms后清理...');
    
    // 清理 - 使用更可靠的方式
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log(`文件下载过程完成，总用时: ${(performance.now() - startTime).toFixed(2)}ms`);
      } catch (e) {
        console.error('清理下载链接时出错:', e);
      }
    }, 200);
    
  } catch (error) {
    console.error('下载文件过程中发生错误:', error);
  }
}

/**
 * 通用下载测试
 * @param fileId 文件ID
 */
export async function testBlobDownload(fileId: string): Promise<void> {
  console.log(`开始Blob下载测试，文件ID: ${fileId}`);
  
  // 创建一个测试Blob
  const testBlob = new Blob(['这是一个测试文件内容'], { type: 'text/plain' });
  
  try {
    // 直接测试浏览器下载功能
    const url = URL.createObjectURL(testBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'test-download.txt';
    link.style.display = 'none';
    
    console.log('创建测试下载链接:', link.href);
    
    // 添加到DOM并触发点击
    document.body.appendChild(link);
    console.log('链接已添加到DOM，准备点击');
    
    // 添加点击事件监听器以验证是否被点击
    link.addEventListener('click', () => {
      console.log('测试下载链接被点击');
    });
    
    link.click();
    console.log('测试下载链接已点击');
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('测试下载完成');
    }, 200);
    
  } catch (e) {
    console.error('测试下载过程中出错:', e);
  }
}

/**
 * 检查浏览器下载功能是否正常
 */
export function checkBrowserDownloadSupport(): void {
  console.log('检查浏览器下载支持情况:');
  console.log(`- URL.createObjectURL存在: ${typeof URL.createObjectURL === 'function'}`);
  console.log(`- document.createElement存在: ${typeof document.createElement === 'function'}`);
  console.log(`- Blob API存在: ${typeof Blob === 'function'}`);
  
  try {
    // 测试创建Blob
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    console.log(`- 创建Blob成功: ${testBlob.size} 字节`);
    
    // 测试创建ObjectURL
    const url = URL.createObjectURL(testBlob);
    console.log(`- 创建ObjectURL成功: ${url}`);
    URL.revokeObjectURL(url);
    
    // 测试创建下载链接
    const link = document.createElement('a');
    console.log(`- 创建<a>元素成功: ${link instanceof HTMLAnchorElement}`);
    console.log(`- <a>元素支持download属性: ${'download' in link}`);
    
    console.log('✅ 浏览器支持下载功能');
  } catch (e) {
    console.error('❌ 浏览器下载功能测试失败:', e);
  }
} 