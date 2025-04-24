import { useCallback, useEffect, useState } from 'react';
import { 
  applyTheme as applyThemeService, 
  loadThemeFromStorage, 
  addThemeChangeListener, 
  getAllThemes,
  getThemesByCategory,
  ThemeStyle,
  THEME_STORAGE_KEY
} from '@/app/components/ui/themes';
import { useSession } from 'next-auth/react';

/**
 * 主题管理Hook接口
 */
export interface ThemeManagerHook {
  /** 当前主题ID */
  currentTheme: string | null;
  /** 当前主题样式对象 */
  themeStyle: ThemeStyle | null;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 更新主题（同步到用户设置） */
  updateTheme: (themeId: string) => Promise<boolean>;
  /** 应用主题（本地应用） */
  applyTheme: (themeId: string) => boolean;
  /** 获取所有可用主题 */
  getAllThemes: typeof getAllThemes;
  /** 按分类获取主题 */
  getThemesByCategory: typeof getThemesByCategory;
}

/**
 * 主题管理Hook参数
 */
export interface UseThemeManagerProps {
  /** 保存到服务器的回调函数 */
  saveToServer?: (themeId: string) => Promise<boolean>;
  /** 默认应用主题 */
  defaultTheme?: string;
  /** 当前用户的主题 */
  userTheme?: string | null;
}

/**
 * 从服务器获取用户当前主题
 * @returns 主题ID或null
 */
const fetchUserTheme = async (): Promise<string | null> => {
  try {
    const response = await fetch('/api/user/theme');
    if (!response.ok) {
      console.warn('无法获取用户主题设置:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    const serverTheme = data.success ? data.theme : null;
    
    // 如果API返回的是预设主题，检查是否有自定义主题的映射
    if (serverTheme && typeof window !== 'undefined') {
      // 检查并恢复自定义主题映射
      const themeMapping = JSON.parse(localStorage.getItem('theme-id-mapping') || '{}');
      
      // 检查是否有映射关系（这里尤其是要检查bluePurple这个代理ID）
      if (themeMapping[serverTheme]) {
        const originalThemeId = themeMapping[serverTheme];
        console.log(`恢复主题映射: ${serverTheme} (服务器主题) -> ${originalThemeId} (本地自定义主题)`);
        return originalThemeId;
      }
      
      // 如果本地存在自定义主题，且用户曾经使用过自定义主题，优先返回自定义主题
      const storedTheme = loadThemeFromStorage();
      if (storedTheme && storedTheme.startsWith('custom_')) {
        console.log(`发现本地自定义主题 ${storedTheme}，忽略服务器主题 ${serverTheme}`);
        return storedTheme;
      }
    }
    
    return serverTheme;
  } catch (error) {
    console.error('获取用户主题失败:', error);
    return null;
  }
};

/**
 * 保存用户主题到服务器
 * @param themeId 主题ID
 * @returns 是否成功
 */
const saveUserTheme = async (themeId: string): Promise<boolean> => {
  // 默认主题直接保存
  if (themeId === 'default') {
    console.log('默认主题无需保存到服务器');
    return true;
  }
  
  try {
    // 对于自定义主题，我们使用一个预设主题ID替代
    // 服务器可能只接受预设的主题ID列表
    let serverThemeId = themeId;
    let isCustomTheme = false;
    
    if (themeId.startsWith('custom_')) {
      // 检查服务器是否支持直接保存自定义主题
      // 如果不支持，则使用系统预设主题作为代理
      try {
        // 尝试获取服务器支持的主题列表（这里简化处理，实际应该从服务器获取）
        const supportedThemes = ['default', 'dark', 'light', 'spring', 'summer', 'autumn', 'winter', 'ocean', 'sunset', 'forest', 'bluePurple'];
        
        // 确认服务器是否支持bluePurple主题
        if (supportedThemes.includes('bluePurple')) {
          // 使用bluePurple作为自定义主题在服务器上的代理ID
          serverThemeId = 'bluePurple';
        } else {
          // 如果bluePurple不被支持，则使用spring作为备选
          serverThemeId = 'spring';
        }
        
        isCustomTheme = true;
        
        // 在localStorage中保存映射关系，便于以后恢复
        if (typeof window !== 'undefined') {
          // 记录服务器主题->实际主题的映射
          const themeMapping = JSON.parse(localStorage.getItem('theme-id-mapping') || '{}');
          themeMapping[serverThemeId] = themeId;
          localStorage.setItem('theme-id-mapping', JSON.stringify(themeMapping));
          console.log(`创建主题ID映射: ${serverThemeId} (代理ID) -> ${themeId} (实际自定义主题)`);
        }
      } catch (mappingError) {
        console.error('创建主题映射失败:', mappingError);
        // 失败时使用安全的系统预设主题
        serverThemeId = 'spring';
        isCustomTheme = true;
      }
    }
    
    console.log('正在保存主题到服务器:', serverThemeId);
    
    try {
      const response = await fetch('/api/user/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: serverThemeId }),
      });
      
      if (!response.ok) {
        console.warn(`无法保存用户主题设置: ${response.statusText}`);
        
        // 即使API保存失败，也保证本地主题应用成功
        if (typeof window !== 'undefined') {
          // 确保本地存储了原始主题ID
          localStorage.setItem(THEME_STORAGE_KEY, themeId);
          
          // 确保文档应用了正确的主题属性
          if (isCustomTheme) {
            document.body.dataset.theme = themeId;
          }
        }
        
        // 尝试使用备选系统主题重试一次
        if (isCustomTheme && serverThemeId !== 'spring') {
          console.log('尝试使用备选系统主题重试保存');
          try {
            const retryResponse = await fetch('/api/user/theme', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ theme: 'spring' }),
            });
            
            if (retryResponse.ok) {
              console.log('使用备选主题保存成功');
              
              // 更新映射关系
              if (typeof window !== 'undefined') {
                const themeMapping = JSON.parse(localStorage.getItem('theme-id-mapping') || '{}');
                themeMapping['spring'] = themeId;
                localStorage.setItem('theme-id-mapping', JSON.stringify(themeMapping));
              }
            }
          } catch (retryError) {
            console.error('备选主题保存失败:', retryError);
          }
        }
        
        // 返回false表示API保存失败，但本地应用可能成功
        return false;
      }
      
      const data = await response.json();
      if (isCustomTheme) {
        console.log(`自定义主题 ${themeId} 已通过代理主题 ${serverThemeId} 保存到服务器`);
      } else {
        console.log('主题已成功保存到服务器:', serverThemeId);
      }
      return data.success;
    } catch (fetchError) {
      console.error('API请求失败:', fetchError);
      
      // 确保本地主题应用成功
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, themeId);
        if (isCustomTheme) {
          document.body.dataset.theme = themeId;
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error('保存用户主题失败:', error);
    return false;
  }
};

/**
 * 主题管理Hook
 * 管理应用主题设置，支持本地和远程存储
 * 
 * @param props 配置参数
 * @returns 主题管理接口
 */
export const useThemeManager = ({
  saveToServer,
  defaultTheme = 'default',
  userTheme = null
}: UseThemeManagerProps = {}): ThemeManagerHook => {
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [themeStyle, setThemeStyle] = useState<ThemeStyle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  
  // 从API加载用户主题
  const loadUserThemeFromAPI = useCallback(async () => {
    if (status === 'authenticated' && session?.user) {
      console.log('尝试从API获取用户主题设置');
      const apiTheme = await fetchUserTheme();
      
      if (apiTheme) {
        console.log('从API获取到用户主题:', apiTheme);
        return apiTheme;
      } else if (userTheme) {
        // 如果API没有返回主题，使用传入的用户主题
        console.log('使用传入的用户主题:', userTheme);
        return userTheme;
      } else {
        // 尝试从localStorage获取
        const storedTheme = loadThemeFromStorage();
        if (storedTheme) {
          console.log('使用本地存储的主题:', storedTheme);
          // 可选：将localStorage中的主题同步到服务器
          saveUserTheme(storedTheme).catch(console.error);
          return storedTheme;
        }
      }
    } else if (status === 'unauthenticated') {
      // 用户未登录，尝试使用localStorage中的主题
      const storedTheme = loadThemeFromStorage();
      if (storedTheme) {
        console.log('未登录用户，使用本地存储的主题:', storedTheme);
        return storedTheme;
      }
    }
    return null;
  }, [session, status, userTheme]);
  
  // 初始化主题 - 在组件挂载和session状态变化时执行
  useEffect(() => {
    const initTheme = async () => {
      setIsLoading(true);
      
      try {
        // 获取本地存储的主题
        const storedTheme = loadThemeFromStorage();
        
        // 直接检查是否有本地存储的自定义主题，如果有，立即使用
        if (storedTheme && storedTheme.startsWith('custom_')) {
          console.log('发现本地自定义主题，立即应用:', storedTheme);
          const appliedThemeStyle = applyThemeService(storedTheme);
          
          if (appliedThemeStyle) {
            setCurrentTheme(storedTheme);
            setThemeStyle(appliedThemeStyle);
            console.log(`自定义主题 ${storedTheme} 已应用`);
            
            // 如果用户已登录，尝试将自定义主题同步到服务器
            if (status === 'authenticated' && session?.user) {
              saveUserTheme(storedTheme).catch(console.error);
            }
            
            setIsLoading(false);
            return; // 直接返回，跳过后续主题逻辑
          }
        }
        
        // 检查本地主题是否是自定义主题
        const isStoredThemeCustom = storedTheme && storedTheme.startsWith('custom_');
        
        // 修改主题优先级:
        // 1. 本地存储的自定义主题 (用户的最后选择，最高优先级)
        // 2. API获取的非默认用户主题 (已登录用户)
        // 3. 传入的用户主题 (由父组件提供)
        // 4. API获取的默认主题
        // 5. 默认主题
        
        let themeToApply = defaultTheme;
        
        // 如果存在本地存储的自定义主题，直接使用
        if (isStoredThemeCustom) {
          themeToApply = storedTheme;
          console.log('使用本地存储的自定义主题:', storedTheme);
          
          // 如果用户已登录，尝试将自定义主题同步到服务器
          if (status === 'authenticated' && session?.user) {
            saveUserTheme(storedTheme).catch(console.error);
          }
        } 
        // 否则，按照其他优先级规则选择主题
        else {
          // 检查用户是否已登录
          if (status === 'authenticated' && session?.user) {
            // 尝试从API获取用户主题
            const apiTheme = await loadUserThemeFromAPI();
            
            // 再次检查本地是否有自定义主题
            const localTheme = loadThemeFromStorage();
            if (localTheme && localTheme.startsWith('custom_')) {
              themeToApply = localTheme;
              console.log('加载API后再次检查，使用本地自定义主题:', localTheme);
            }
            else if (apiTheme && apiTheme !== 'default') {
              // 如果API返回非默认主题，且本地没有自定义主题，使用API主题
              themeToApply = apiTheme;
              console.log('使用API获取的用户主题:', apiTheme);
            } else if (storedTheme && storedTheme !== 'default') {
              // 如果有本地存储的非默认非自定义主题，使用本地主题
              themeToApply = storedTheme;
              console.log('使用本地存储的主题:', storedTheme);
              // 将本地主题同步到服务器
              saveUserTheme(storedTheme).catch(console.error);
            } else if (userTheme) {
              // 如果有传入的用户主题，再次使用传入主题
              themeToApply = userTheme;
              console.log('使用传入的用户主题:', userTheme);
            } else if (apiTheme === 'default') {
              // 最后才使用API返回的默认主题
              themeToApply = 'default';
              console.log('使用API返回的默认主题');
            }
          } else if (status === 'unauthenticated') {
            // 用户未登录，优先使用localStorage中的主题
            if (storedTheme) {
              themeToApply = storedTheme;
              console.log('未登录用户，使用本地存储的主题:', storedTheme);
            }
          }
        }
        
        console.log(`最终决定应用主题: ${themeToApply}`);
        
        // 应用主题并更新状态
        const appliedThemeStyle = applyThemeService(themeToApply);
        
        if (appliedThemeStyle) {
          setCurrentTheme(themeToApply);
          setThemeStyle(appliedThemeStyle);
          
          // 保存到localStorage作为临时存储
          if (typeof window !== 'undefined') {
            localStorage.setItem('user-theme', themeToApply);
            console.log(`主题 ${themeToApply} 已保存到本地存储`);
          }
        }
      } catch (error) {
        console.error('主题初始化错误:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initTheme();
  }, [status, session, userTheme, defaultTheme, loadUserThemeFromAPI]);
  
  // 添加主题变更事件监听（仅用于同步状态，不再触发新的主题应用）
  useEffect(() => {
    const removeListener = addThemeChangeListener((themeId, styles) => {
      console.log('接收到主题变更事件，同步主题状态:', themeId);
      // 更新本地状态
      setCurrentTheme(themeId);
      setThemeStyle(styles);
    });
    
    // 组件卸载时移除事件监听
    return () => {
      removeListener();
    };
  }, []);
  
  /**
   * 设置主题方法（本地）
   * 仅应用到UI和localStorage，不同步到服务器
   */
  const setTheme = useCallback((themeId: string) => {
    try {
      // 应用主题
      const styles = applyThemeService(themeId);
      
      if (styles) {
        // 更新本地状态
        setCurrentTheme(themeId);
        setThemeStyle(styles);
      }
      
      // 保存到localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user-theme', themeId);
      }
      
      return true;
    } catch (error) {
      console.error('设置主题失败:', error);
      return false;
    }
  }, []);
  
  /**
   * 更新主题（服务器同步）
   * 应用到UI并同步到服务器
   */
  const updateTheme = useCallback(async (themeId: string) => {
    try {
      console.log(`开始更新主题: ${themeId}`);
      
      // 先应用主题到UI和localStorage
      const success = setTheme(themeId);
      
      if (!success) {
        console.error(`主题 ${themeId} 应用失败`);
        return false;
      }
      
      console.log(`主题 ${themeId} 已应用到UI并保存到本地存储`);
      
      // 如果是默认主题，则不需要保存到服务器
      if (themeId === 'default') {
        console.log('默认主题无需保存到服务器');
        return true;
      }
      
      // 如果用户已登录，同步到服务器
      if (status === 'authenticated' && session?.user) {
        try {
          console.log(`正在将主题 ${themeId} 保存到服务器...`);
          // 使用自定义API同步主题
          const apiSuccess = await saveUserTheme(themeId);
          if (!apiSuccess) {
            console.warn('通过API更新用户主题失败，但UI已更新');
          } else {
            console.log(`主题 ${themeId} 已成功保存到服务器`);
          }
        } catch (error) {
          console.warn('保存主题到API失败，但UI已更新:', error);
        }
      } else {
        console.log('用户未登录，主题仅保存在本地');
      }
      
      // 如果有额外的保存回调，也执行
      if (saveToServer) {
        try {
          console.log('执行自定义保存回调...');
          await saveToServer(themeId);
          console.log('自定义保存回调执行完成');
        } catch (error) {
          console.warn('回调保存主题失败，但UI已更新:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('更新主题失败:', error);
      return false;
    }
  }, [saveToServer, setTheme, status, session]);
  
  return {
    // 主题状态
    currentTheme,
    themeStyle,
    isLoading,
    
    // 主题操作
    updateTheme,
    applyTheme: setTheme,
    
    // 主题工具
    getAllThemes,
    getThemesByCategory
  };
};

export default useThemeManager; 