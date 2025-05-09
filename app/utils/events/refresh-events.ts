/**
 * 文件刷新相关的事件处理工具
 */

// 文件刷新事件名称
export const FILE_REFRESH_EVENT = 'file-list-refresh';
export const USER_SWITCHED_EVENT = 'user-switched';

/**
 * 触发文件列表刷新事件
 */
export function refreshFiles(): void {
  if (typeof window === 'undefined') return;
  
  // 发布文件刷新事件
  window.dispatchEvent(new CustomEvent(FILE_REFRESH_EVENT, {
    detail: { timestamp: new Date().getTime() }
  }));
  
  // 尝试重新加载文件列表组件
  const fileListElements = document.querySelectorAll('[data-file-list]');
  if (fileListElements.length > 0) {
    fileListElements.forEach(element => {
      // 添加刷新标记
      element.setAttribute('data-refresh', new Date().getTime().toString());
    });
  }
}

/**
 * 订阅文件列表刷新事件
 * @param callback 回调函数
 */
export function subscribeToFileRefresh(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleRefresh = () => {
    callback();
  };
  
  // 同时监听两种事件
  window.addEventListener(FILE_REFRESH_EVENT, handleRefresh);
  window.addEventListener(USER_SWITCHED_EVENT, handleRefresh);
  
  // 返回取消订阅函数
  return () => {
    window.removeEventListener(FILE_REFRESH_EVENT, handleRefresh);
    window.removeEventListener(USER_SWITCHED_EVENT, handleRefresh);
  };
} 