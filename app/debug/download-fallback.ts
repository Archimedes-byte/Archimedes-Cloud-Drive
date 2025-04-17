// 文件夹下载备用方法
import { API_PATHS } from '@/app/lib/api/paths';

/**
 * 文件夹下载备用方法
 * 使用多种技术确保文件夹ZIP下载的可靠性
 * 
 * @param folderId 文件夹ID
 * @param fileName 可选的文件名
 * @returns 是否成功触发下载
 */
export async function downloadFolderFallback(folderId: string, fileName?: string): Promise<boolean> {
  console.log(`开始备用方法下载文件夹: ${folderId}`);
  
  try {
    // 构建请求
    const request = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileIds: [folderId] }),
    };
    
    // 发起请求
    console.log('发送下载请求...');
    const response = await fetch(API_PATHS.STORAGE.FILES.DOWNLOAD, request);
    
    if (!response.ok) {
      console.error('下载请求失败:', response.status, response.statusText);
      return false;
    }
    
    // 获取文件Blob
    const blob = await response.blob();
    if (blob.size === 0) {
      console.error('下载的文件为空');
      return false;
    }
    
    // 设置文件名
    let downloadFileName = fileName || '下载文件.zip';
    if (!downloadFileName.toLowerCase().endsWith('.zip')) {
      downloadFileName += '.zip';
    }
    
    // 尝试多种下载方法
    return await tryMultipleDownloadMethods(blob, downloadFileName);
  } catch (error) {
    console.error('备用下载方法失败:', error);
    return false;
  }
}

/**
 * 尝试多种下载方法
 * 按优先级依次尝试不同的下载技术
 */
async function tryMultipleDownloadMethods(blob: Blob, fileName: string): Promise<boolean> {
  // 创建blob URL
  const blobUrl = URL.createObjectURL(blob);
  
  try {
    // 方法1: 标准的下载方法
    if (await tryStandardDownload(blobUrl, fileName)) {
      return true;
    }
    
    // 方法2: iframe下载方法
    if (await tryIframeDownload(blobUrl, fileName)) {
      return true;
    }
    
    // 方法3: window.open下载方法
    if (await tryWindowOpenDownload(blobUrl, fileName)) {
      return true;
    }
    
    // 方法4: form提交下载方法
    if (await tryFormSubmitDownload(blob, fileName)) {
      return true;
    }
    
    // 所有方法都失败
    console.error('所有下载方法尝试失败');
    return false;
  } finally {
    // 清理blob URL
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  }
}

/**
 * 标准下载方法
 */
async function tryStandardDownload(blobUrl: string, fileName: string): Promise<boolean> {
  return new Promise(resolve => {
    try {
      console.log('尝试标准下载方法...');
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      // 添加事件监听器检测是否成功点击
      let clicked = false;
      link.addEventListener('click', () => {
        clicked = true;
      });
      
      document.body.appendChild(link);
      link.click();
      
      // 给浏览器一些时间处理下载
      setTimeout(() => {
        try {
          document.body.removeChild(link);
        } catch (e) {
          // 忽略清理错误
        }
        resolve(clicked);
      }, 500);
    } catch (e) {
      console.error('标准下载方法失败:', e);
      resolve(false);
    }
  });
}

/**
 * iframe下载方法
 * 使用iframe创建独立上下文来触发下载
 */
async function tryIframeDownload(blobUrl: string, fileName: string): Promise<boolean> {
  return new Promise(resolve => {
    try {
      console.log('尝试iframe下载方法...');
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // 设置超时，以防iframe加载失败
      const timeout = setTimeout(() => {
        console.log('iframe下载方法超时');
        try {
          document.body.removeChild(iframe);
        } catch (e) {
          // 忽略清理错误
        }
        resolve(false);
      }, 3000);
      
      iframe.onload = () => {
        clearTimeout(timeout);
        
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) {
            console.error('无法访问iframe文档');
            resolve(false);
            return;
          }
          
          const iframeLink = iframeDoc.createElement('a');
          iframeLink.href = blobUrl;
          iframeLink.download = fileName;
          iframeLink.textContent = '下载文件';
          iframeDoc.body.appendChild(iframeLink);
          
          // 使用用户交互模拟点击
          iframeLink.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: iframe.contentWindow || window
          }));
          
          // 再次尝试直接点击
          iframeLink.click();
          
          setTimeout(() => {
            try {
              document.body.removeChild(iframe);
            } catch (e) {
              // 忽略清理错误
            }
            resolve(true);
          }, 1000);
        } catch (e) {
          console.error('iframe内部操作失败:', e);
          try {
            document.body.removeChild(iframe);
          } catch (err) {
            // 忽略清理错误
          }
          resolve(false);
        }
      };
      
      // 触发iframe加载
      iframe.src = 'about:blank';
    } catch (e) {
      console.error('iframe下载方法设置失败:', e);
      resolve(false);
    }
  });
}

/**
 * window.open下载方法
 * 使用新窗口来触发下载
 */
async function tryWindowOpenDownload(blobUrl: string, fileName: string): Promise<boolean> {
  return new Promise(resolve => {
    try {
      console.log('尝试window.open下载方法...');
      
      const newWindow = window.open(blobUrl, '_blank');
      
      // 如果window.open返回null，可能被浏览器阻止了
      if (!newWindow) {
        console.warn('window.open被阻止');
        resolve(false);
        return;
      }
      
      // 尝试在新窗口中设置下载属性
      setTimeout(() => {
        try {
          if (newWindow.document) {
            newWindow.document.title = `下载 ${fileName}`;
            
            // 创建下载链接
            const link = newWindow.document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            link.textContent = `点击下载: ${fileName}`;
            link.style.display = 'block';
            link.style.margin = '20px';
            link.style.fontSize = '16px';
            
            // 清空文档并添加链接
            newWindow.document.body.innerHTML = '';
            newWindow.document.body.appendChild(link);
            
            // 点击链接
            link.click();
            
            // 自动关闭窗口
            setTimeout(() => {
              newWindow.close();
            }, 1000);
          }
        } catch (e) {
          console.error('新窗口操作失败:', e);
          try {
            newWindow.close();
          } catch (err) {
            // 忽略关闭错误
          }
        }
        resolve(true);
      }, 500);
    } catch (e) {
      console.error('window.open下载方法失败:', e);
      resolve(false);
    }
  });
}

/**
 * form提交下载方法
 * 使用表单提交来触发下载
 */
async function tryFormSubmitDownload(blob: Blob, fileName: string): Promise<boolean> {
  return new Promise(resolve => {
    try {
      console.log('尝试form提交下载方法...');
      
      // 创建一个隐藏的表单
      const form = document.createElement('form');
      form.method = 'post';
      form.action = '/api/debug/download-helper';
      form.enctype = 'multipart/form-data';
      form.style.display = 'none';
      
      // 创建文件数据的FormData
      const formData = new FormData();
      formData.append('file', blob, fileName);
      
      // 转换blob为base64并添加到表单
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64data = reader.result?.toString().split(',')[1] || '';
          
          // 添加数据字段
          const fileField = document.createElement('input');
          fileField.type = 'hidden';
          fileField.name = 'fileData';
          fileField.value = base64data;
          form.appendChild(fileField);
          
          // 添加文件名字段
          const nameField = document.createElement('input');
          nameField.type = 'hidden';
          nameField.name = 'fileName';
          nameField.value = fileName;
          form.appendChild(nameField);
          
          // 添加表单到文档并提交
          document.body.appendChild(form);
          form.submit();
          
          // 给表单提交一些时间
          setTimeout(() => {
            try {
              document.body.removeChild(form);
            } catch (e) {
              // 忽略清理错误
            }
            resolve(true);
          }, 1000);
        } catch (e) {
          console.error('表单处理失败:', e);
          resolve(false);
        }
      };
      
      reader.onerror = () => {
        console.error('文件读取失败');
        resolve(false);
      };
      
      // 开始读取blob
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error('form提交下载方法失败:', e);
      resolve(false);
    }
  });
} 