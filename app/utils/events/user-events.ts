/**
 * 用户相关事件管理工具
 * 用于处理用户登录、切换等全局事件
 */

// 事件名称常量
export const USER_SWITCHED_EVENT = 'user-switched';
export const USER_LOGGED_IN_EVENT = 'user-logged-in';
export const USER_LOGGED_OUT_EVENT = 'user-logged-out';
export const THEME_REFRESH_EVENT = 'theme-refresh';

/**
 * 触发用户切换事件
 * @param newUserEmail 新用户的邮箱
 */
export function triggerUserSwitch(newUserEmail?: string): void {
  if (typeof window === 'undefined') return;
  
  // 创建自定义事件并携带用户信息
  window.dispatchEvent(new CustomEvent(USER_SWITCHED_EVENT, {
    detail: { 
      timestamp: new Date().getTime(),
      userEmail: newUserEmail || null
    }
  }));
  
  // 存储当前活跃用户ID到localStorage - 用于主题重载
  if (newUserEmail) {
    localStorage.setItem('current_active_user', newUserEmail);
  }
  
  // 尝试从服务器获取用户主题设置
  if (newUserEmail) {
    fetchUserThemeFromServer(newUserEmail);
  }
  
  // 触发视图刷新
  triggerViewRefresh();
  
  // 触发主题刷新
  triggerThemeRefresh();
}

/**
 * 从服务器获取用户主题设置
 * @param userEmail 用户邮箱
 */
async function fetchUserThemeFromServer(userEmail: string): Promise<void> {
  try {
    // 请求用户主题API
    const response = await fetch('/api/user/theme');
    
    if (!response.ok) {
      console.error('获取用户主题失败, 状态码:', response.status);
      return;
    }
    
    const data = await response.json();
    
    // 如果API返回了有效的主题设置
    if (data.success && data.theme) {
      // 将主题保存到localStorage
      localStorage.setItem('user-theme', data.theme);
      localStorage.setItem(`app-theme-preference-${userEmail}`, data.theme);
      localStorage.setItem('app-theme-preference', data.theme);
      
      // 立即应用主题
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', data.theme);
        document.body.dataset.theme = data.theme;
      }
    }
  } catch (error) {
    console.error('获取用户主题时出错:', error);
  }
}

/**
 * 触发主题刷新
 * 用于在用户切换后加载新用户的主题设置
 */
export function triggerThemeRefresh(): void {
  if (typeof window === 'undefined') return;
  
  // 触发主题刷新事件
  window.dispatchEvent(new CustomEvent(THEME_REFRESH_EVENT, {
    detail: { timestamp: new Date().getTime() }
  }));
  
  // 尝试调用主题刷新API
  try {
    // 查找页面上的主题管理相关元素并触发刷新
    const themeElements = document.querySelectorAll('[data-theme-controller]');
    if (themeElements.length > 0) {
      themeElements.forEach(element => {
        // 设置数据刷新标记
        element.setAttribute('data-theme-refresh', new Date().getTime().toString());
      });
    }
    
    // 尝试从localStorage获取当前用户和主题设置
    setTimeout(() => {
      try {
        // 获取当前活跃用户
        const currentUser = localStorage.getItem('current_active_user');
        
        if (currentUser) {
          // 获取该用户的主题设置
          const userThemeKey = `app-theme-preference-${currentUser}`;
          const userTheme = localStorage.getItem(userThemeKey);
          
          if (userTheme) {
            // 设置文档根元素的主题类
            document.documentElement.setAttribute('data-theme', userTheme);
            document.body.dataset.theme = userTheme;
            
            // 保存到通用主题键中
            localStorage.setItem('user-theme', userTheme);
            localStorage.setItem('app-theme-preference', userTheme);
          } else {
            // 如果没有用户特定主题，尝试获取通用主题设置
            const generalTheme = localStorage.getItem('app-theme-preference');
            if (generalTheme) {
              document.documentElement.setAttribute('data-theme', generalTheme);
              document.body.dataset.theme = generalTheme;
            }
          }
        }
      } catch (error) {
        console.error('应用主题设置失败:', error);
      }
    }, 100);
  } catch (error) {
    console.error('触发主题刷新失败:', error);
  }
}

/**
 * 触发视图刷新
 * 刷新所有需要根据用户状态更新的组件
 */
export function triggerViewRefresh(): void {
  if (typeof window === 'undefined') return;
  
  // 触发DOM事件通知视图刷新
  window.dispatchEvent(new CustomEvent('view-refresh', {
    detail: { timestamp: new Date().getTime() }
  }));
  
  // 主动刷新需要更新的DOM元素
  const refreshableElements = document.querySelectorAll('[data-refresh-on-user-switch]');
  refreshableElements.forEach(element => {
    element.setAttribute('data-refresh', new Date().getTime().toString());
  });
  
  // 触发文件列表刷新
  try {
    // 导入文件刷新事件工具
    const { refreshFiles } = require('./refresh-events');
    refreshFiles();
  } catch (error) {
    console.error('触发文件刷新失败:', error);
  }
  
  // 添加路由刷新逻辑
  try {
    // 尝试获取Next.js router并刷新
    // 注意：这种方式可能不会在所有环境中都有效
    const currentPath = window.location.pathname;
    if (currentPath.includes('/file') || currentPath.includes('/dashboard')) {
      // 对文件页面和仪表板页面进行特殊处理
      console.log('检测到文件或仪表板页面，触发视图强制刷新');
      // 可选方案：如果路由刷新不起作用，可以考虑强制刷新页面
      // window.location.reload();
    }
  } catch (error) {
    console.error('尝试路由刷新失败:', error);
  }
}

/**
 * 订阅用户切换事件
 * @param callback 回调函数
 * @returns 取消订阅函数
 */
export function subscribeToUserSwitch(callback: (data?: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleEvent = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };
  
  window.addEventListener(USER_SWITCHED_EVENT, handleEvent);
  
  // 返回取消订阅函数
  return () => {
    window.removeEventListener(USER_SWITCHED_EVENT, handleEvent);
  };
}

/**
 * 订阅主题刷新事件
 * @param callback 回调函数
 * @returns 取消订阅函数
 */
export function subscribeToThemeRefresh(callback: (data?: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleEvent = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };
  
  window.addEventListener(THEME_REFRESH_EVENT, handleEvent);
  
  // 返回取消订阅函数
  return () => {
    window.removeEventListener(THEME_REFRESH_EVENT, handleEvent);
  };
} 