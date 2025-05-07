import React, { useState, useEffect, useMemo, JSX } from 'react';
import { ArrowLeft, Palette, Search, Check, Plus, ChevronLeft, Brush, Type, EyeIcon, Save, Trash, AlertCircle } from 'lucide-react';
import { Select, Input, Tabs, Button, Alert, Popconfirm, Modal, message } from 'antd';
import styles from './ThemePanel.module.css';
import { 
  getThemeStyle, 
  applyTheme as applyThemeService,
  getAllThemes,
  saveCustomTheme,
  deleteCustomTheme,
  reinitCustomThemes,
  getContrastColor,
  THEME_STORAGE_KEY
} from '../theme-service';
import { ThemeStyle } from '../theme-definitions';
import { useSession } from 'next-auth/react';

interface ThemePanelProps {
  currentTheme: string | null;
  onThemeChange: (themeId: string, customConfig?: Record<string, string>) => Promise<boolean>;
  onClose: () => void;
}

// 默认自定义主题模板
const defaultCustomTheme: ThemeStyle = {
  primary: '#3b82f6',
  secondary: '',
  background: '#f0f7ff',
  card: 'rgba(255, 255, 255, 0.9)',
  text: '#1a202c',
  category: '自定义主题',
  name: '我的自定义主题',
  success: '#48bb78',
  error: '#f56565',
  warning: '#ecc94b',
  info: '#4299e1',
  successLight: 'rgba(72, 187, 120, 0.2)',
  errorLight: 'rgba(245, 101, 101, 0.2)',
  warningLight: 'rgba(236, 201, 75, 0.2)',
  infoLight: 'rgba(66, 153, 225, 0.2)'
};

const ThemePanel: React.FC<ThemePanelProps> = ({ 
  currentTheme, 
  onThemeChange,
  onClose
}): JSX.Element => {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || 'default');
  const [isChanging, setIsChanging] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [renderKey, setRenderKey] = useState(Date.now());
  
  // 自定义主题状态
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customTheme, setCustomTheme] = useState<ThemeStyle>({...defaultCustomTheme});
  const [customThemeName, setCustomThemeName] = useState('我的自定义主题');
  const [showPreview, setShowPreview] = useState(false);
  const [hasSecondaryColor, setHasSecondaryColor] = useState(false);
  
  // 删除主题状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<string | null>(null);
  
  // 创建成功提示状态
  const [showCreationSuccess, setShowCreationSuccess] = useState(false);
  const [newCreatedThemeId, setNewCreatedThemeId] = useState<string | null>(null);
  
  // 获取用户会话信息
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // 使用统一的主题服务获取所有主题
  const themes = React.useMemo(() => {
    // 确保自定义主题库是最新的
    if (userId) {
      reinitCustomThemes(userId);
    }
    
    // 使用全局主题定义映射到需要的格式
    return getAllThemes(userId).map(theme => {
      const themeStyle = getThemeStyle(theme.id);
      return {
        id: theme.id,
        name: theme.name,
        primary: themeStyle.primary,
        secondary: themeStyle.secondary,
        background: themeStyle.background,
        preview: themeStyle.secondary ? 
          `linear-gradient(135deg, ${themeStyle.primary} 0%, ${themeStyle.secondary} 100%)` : 
          themeStyle.primary,
        accent: themeStyle.accent,
        // 直接使用主题服务中定义的分类
        category: themeStyle.category || '其他主题',
        // 判断是否是自定义主题
        isCustom: theme.id.startsWith('custom_')
      };
    });
  }, [showDeleteConfirm, userId, renderKey]); // 添加renderKey作为依赖，确保强制刷新时重新获取主题列表

  // 获取所有主题分类
  const categories: string[] = Array.from(new Set(themes.map(theme => theme.category || '')));

  // 当外部主题变化时更新内部选中状态
  useEffect(() => {
    if (currentTheme) {
      setSelectedTheme(currentTheme);
    }
  }, [currentTheme]);

  // 当isCustomizing变为true时，初始化自定义主题状态
  useEffect(() => {
    if (isCustomizing) {
      // 重置自定义主题为默认值
      const initialTheme = {...defaultCustomTheme};
      setCustomTheme(initialTheme);
      setCustomThemeName('我的自定义主题');
      // 始终启用预览
      setShowPreview(true);
      // 检查是否有次要色调并相应更新状态
      setHasSecondaryColor(!!initialTheme.secondary && initialTheme.secondary !== '');
    }
  }, [isCustomizing]);

  // 当主题的主色调变化时，如果有次要色调则更新背景渐变
  useEffect(() => {
    if (hasSecondaryColor && customTheme.secondary && customTheme.secondary !== '') {
      // 更新背景为渐变色
      setCustomTheme(prev => ({
        ...prev,
        background: `linear-gradient(135deg, ${prev.primary} 0%, ${prev.secondary || prev.primary} 100%)`
      }));
    } else if (!hasSecondaryColor) {
      // 更新背景为纯色
      setCustomTheme(prev => {
        const newTheme = { ...prev };
        delete newTheme.secondary;
        return {
          ...newTheme,
          background: prev.primary
        };
      });
    }
  }, [customTheme.primary, customTheme.secondary, hasSecondaryColor]);

  // 处理主题选择
  const handleThemeSelect = async (themeId: string) => {
    if (themeId === selectedTheme) return; // 避免重复选择
    
    setIsChanging(true);
    setSelectedTheme(themeId);
    
    try {
      console.log(`开始应用主题: ${themeId}`);
      
      // 优先保存到本地存储，确保即使服务器保存失败也能应用主题
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, themeId);
        console.log(`主题 ${themeId} 已保存到本地存储`);
      }
      
      // 优先应用主题到UI，防止后续步骤出错导致主题不应用
      applyThemeService(themeId, true, userId);
      console.log(`主题 ${themeId} 已本地应用`);
      
      // 使用onThemeChange回调保存到服务器
      try {
        console.log(`正在将主题 ${themeId} 同步到服务器...`);
        
        // 始终传递完整的themeId，不再区分是否自定义
        const customConfig = { themeId, userId: userId || '' };
        
        const success = await onThemeChange(themeId, customConfig);
        
        if (success) {
          console.log(`主题 ${themeId} 已成功同步到服务器`);
        } else {
          console.error(`主题 ${themeId} 服务器同步失败，但已本地应用并保存`);
          
          // 只有在失败时才显示提示，避免打扰用户体验
          if (themeId.startsWith('custom_')) {
            alert(`自定义主题已在本地应用，但未能同步到服务器。下次登录时可能需要重新选择主题。`);
          }
        }
      } catch (error) {
        console.error(`同步主题到服务器出错:`, error);
        
        // 只对自定义主题显示错误提示
        if (themeId.startsWith('custom_')) {
          alert(`自定义主题已在本地应用，但未能同步到服务器。下次登录时可能需要重新选择主题。`);
        }
      }
    } catch (error) {
      console.error(`应用主题出错:`, error);
      // 恢复之前的主题选择状态
      if (currentTheme) {
        setSelectedTheme(currentTheme);
      }
      // 显示错误消息
      alert(`应用主题时发生错误，请稍后再试。`);
    } finally {
      setIsChanging(false);
    }
  };

  // 过滤主题
  const filteredThemes = React.useMemo(() => {
    let filtered = themes;
    
    // 按分类过滤
    if (activeCategory) {
      filtered = filtered.filter(theme => theme.category === activeCategory);
    }
    
    // 按搜索词过滤 - 增强搜索能力
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      filtered = filtered.filter(theme => {
        // 基础搜索：名称和分类
        const nameMatch = theme.name.toLowerCase().includes(query);
        const categoryMatch = theme.category.toLowerCase().includes(query);
        
        // 增强搜索：ID中的关键字、颜色值、类型
        const idMatch = theme.id.toLowerCase().includes(query);
        const primaryColorMatch = theme.primary.toLowerCase().includes(query);
        const secondaryColorMatch = theme.secondary ? theme.secondary.toLowerCase().includes(query) : false;
        const typeMatch = theme.isCustom ? 
          '自定义'.includes(query) || 'custom'.includes(query) : 
          '预设'.includes(query) || 'preset'.includes(query);
        
        // 智能搜索：分词匹配 - 将搜索词分解为多个关键词进行匹配
        const keywords = query.split(/\s+/);
        const keywordMatch = keywords.length > 1 ? 
          keywords.every(keyword => 
            theme.name.toLowerCase().includes(keyword) || 
            theme.category.toLowerCase().includes(keyword) ||
            theme.id.toLowerCase().includes(keyword)
          ) : false;
        
        // 组合所有匹配结果
        return nameMatch || categoryMatch || idMatch || 
               primaryColorMatch || secondaryColorMatch || 
               typeMatch || keywordMatch;
      });
    }
    
    return filtered;
  }, [themes, activeCategory, searchQuery]);

  // 处理颜色变更
  const handleColorChange = (color: string, property: keyof ThemeStyle) => {
    setCustomTheme((prev: ThemeStyle) => ({
      ...prev,
      [property]: color
    }));
    
    // 自动开启预览
    if (!showPreview) {
      setShowPreview(true);
    }
  };

  // 处理添加/移除次要色调
  const toggleSecondaryColor = () => {
    if (hasSecondaryColor) {
      // 如果已有次要色调，移除它
      setCustomTheme((prev: ThemeStyle) => {
        // 创建新对象，同时移除secondary属性
        const newTheme = { ...prev };
        delete newTheme.secondary;
        return {
          ...newTheme,
          background: prev.primary // 更新背景为纯色
        };
      });
      setHasSecondaryColor(false);
    } else {
      // 如果没有次要色调，添加默认值并设置渐变背景
      const secondaryColor = getComplementaryColor(customTheme.primary);
      setCustomTheme((prev: ThemeStyle) => ({
        ...prev,
        secondary: secondaryColor,
        background: `linear-gradient(135deg, ${prev.primary} 0%, ${secondaryColor} 100%)`
      }));
      setHasSecondaryColor(true);
    }
    
    // 自动开启预览
    if (!showPreview) {
      setShowPreview(true);
    }
  };

  // 计算互补色函数
  const getComplementaryColor = (hexColor: string): string => {
    // 移除#号
    const hex = hexColor.replace('#', '');
    
    // 将十六进制转换为RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // 计算HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // 灰色
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      
      h /= 6;
    }
    
    // 创建互补色 - 在HSL空间中旋转色相180度
    h = (h + 0.5) % 1;
    
    // 将HSL转回RGB
    let r1, g1, b1;
    
    if (s === 0) {
      r1 = g1 = b1 = l; // 灰色
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r1 = hue2rgb(p, q, h + 1/3);
      g1 = hue2rgb(p, q, h);
      b1 = hue2rgb(p, q, h - 1/3);
    }
    
    // 转回十六进制
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
  };

  // 保存自定义主题并应用
  const handleSaveCustomTheme = async () => {
    if (customThemeName.trim() === '') {
      message.error('请输入主题名称');
      return;
    }
    
    // 生成唯一ID
    const timestamp = Date.now();
    const newThemeId = `custom_${timestamp}`;
    
    // 准备保存的主题对象
    const themeToSave: ThemeStyle = {
      ...customTheme,
      name: customThemeName,
      category: hasSecondaryColor ? '渐变主题' : '纯色系统'
    };
    
    console.log("正在保存自定义主题:", themeToSave);
    
    // 使用主题服务保存自定义主题
    const success = saveCustomTheme(newThemeId, themeToSave, userId);
    
    if (success) {
      // 保存成功后应用新主题
      setIsChanging(true);
      
      // 保存新创建的主题ID，用于高亮显示
      setNewCreatedThemeId(newThemeId);
      
      // 显示创建成功提示
      setShowCreationSuccess(true);
      
      // 应用新主题 - 传递完整的themeId而非类型
      const customConfig = { themeId: newThemeId, userId: userId || '' };
      const applyResult = await onThemeChange(newThemeId, customConfig);
      
      if (applyResult) {
        console.log(`自定义主题 ${newThemeId} 应用成功`);
        
        // 更新当前选中的主题
        setSelectedTheme(newThemeId);
        
        // 强制刷新主题列表
        setRenderKey(Date.now());
        
        // 关闭自定义界面，返回主题列表
        setIsCustomizing(false);
        
        // 3秒后关闭创建成功提示
        setTimeout(() => {
          setShowCreationSuccess(false);
          setNewCreatedThemeId(null);
        }, 3000);
      } else {
        message.error('主题应用失败，请重试');
      }
    } else {
      message.error('保存自定义主题失败，请重试');
    }
    
    setIsChanging(false);
  };

  // 自定义主题预览
  const getPreviewStyle = () => {
    // 强制检查是否为纯色系统
    const isPureColorSystem = !hasSecondaryColor || !customTheme.secondary;
    
    // 纯色系统下使用主色调作为背景
    // 渐变色系统下确保使用完整的渐变表达式
    const previewBackground = isPureColorSystem
      ? customTheme.primary
      : `linear-gradient(135deg, ${customTheme.primary} 0%, ${customTheme.secondary} 100%)`;

    // 为顶部栏和侧边栏始终设置渐变背景（在渐变系统中）
    const headerBackground = isPureColorSystem
      ? customTheme.primary
      : `linear-gradient(90deg, ${customTheme.primary} 0%, ${customTheme.secondary} 100%)`;

    const sidebarBackground = isPureColorSystem
      ? customTheme.primary 
      : `linear-gradient(180deg, ${customTheme.primary} 0%, ${customTheme.secondary} 100%)`;

    // 为纯色系统计算对比文本色
    const textColor = isPureColorSystem 
      ? getContrastColor(customTheme.primary, '#1e293b', '#ffffff')
      : (customTheme.text || '#1e293b');

    // 返回完整的预览样式 - 使用白色背景
    return {
      '--preview-primary': customTheme.primary,
      '--preview-secondary': isPureColorSystem ? customTheme.primary : customTheme.secondary,
      '--preview-accent': isPureColorSystem ? customTheme.primary : (customTheme.accent || customTheme.primary),
      '--preview-background': '#ffffff', // 改为白色背景
      '--preview-header-bg': headerBackground,
      '--preview-sidebar-bg': sidebarBackground,
      '--preview-card': 'rgba(255, 255, 255, 0.95)',
      '--preview-text': '#1e293b', // 固定文本为深色
    } as React.CSSProperties;
  };

  // 自定义主题的实时预览背景
  const getCustomThemePreviewStyle = () => {
    // 同样强制检查是否为纯色系统
    const isPureColorSystem = !hasSecondaryColor || !customTheme.secondary;
    
    if (isPureColorSystem) {
      // 纯色系统
      const textColor = getContrastColor(customTheme.primary, '#1e293b', '#ffffff');
      return { 
        background: customTheme.primary,
        color: textColor,
      } as React.CSSProperties;
    } else {
      // 渐变系统
      return { 
        background: `linear-gradient(135deg, ${customTheme.primary} 0%, ${customTheme.secondary} 100%)`,
        color: "#ffffff", // 为渐变背景设置白色文本以确保可读性
      } as React.CSSProperties;
    }
  };

  // 处理删除主题
  const handleDeleteTheme = (themeId: string) => {
    setThemeToDelete(themeId);
    setShowDeleteConfirm(true);
  };

  // 确认删除主题
  const confirmDeleteTheme = async () => {
    if (!themeToDelete) return;
    
    try {
      // 删除主题，传入用户ID
      const success = deleteCustomTheme(themeToDelete, userId);
      
      if (success) {
        console.log(`已删除主题: ${themeToDelete}`);
        
        // 如果删除的是当前主题，切换到默认主题
        if (themeToDelete === selectedTheme) {
          handleThemeSelect('default');
        } else {
          // 强制刷新主题列表
          setRenderKey(Date.now());
        }
      } else {
        console.error(`删除主题失败: ${themeToDelete}`);
      }
    } catch (error) {
      console.error('删除主题出错:', error);
    } finally {
      setThemeToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  // 添加创建成功提示组件
  const renderCreationSuccessMessage = (): JSX.Element | null => {
    if (!showCreationSuccess) return null;
    
    return (
      <div className={styles.creationSuccessOverlay}>
        <div className={styles.creationSuccessMessage}>
          <div className={styles.creationSuccessIcon}>
            <Check size={24} />
          </div>
          <h3>创建成功!</h3>
          <p>自定义主题「{customThemeName}」已创建并应用</p>
        </div>
      </div>
    );
  };

  // 自动隐藏创建成功提示
  useEffect(() => {
    if (showCreationSuccess) {
      const timer = setTimeout(() => {
        setShowCreationSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showCreationSuccess]);

  // 渲染自定义主题界面
  const renderCustomThemeUI = () => (
    <div className={styles.customThemeContainer}>
      <div className={styles.customThemeHeader}>
        <button 
          className={styles.backButton}
          onClick={() => setIsCustomizing(false)}
          title="返回主题列表"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className={styles.title}>
          <Brush size={20} className={styles.titleIcon} />
          自定义主题
        </h2>
      </div>
      
      <div className={styles.customThemeContent}>
        <div className={styles.customThemeForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>主题名称</label>
            <input
              type="text"
              className={styles.textInput}
              value={customThemeName}
              onChange={(e) => setCustomThemeName(e.target.value)}
              placeholder="输入主题名称"
            />
          </div>
          
          <div className={styles.colorSection}>
            <h3 className={styles.sectionTitle}>
              <Palette size={16} />
              主题颜色
            </h3>
            
            <div className={styles.colorOptions}>
              <div className={styles.colorOption}>
                <label>主色调</label>
                <div className={styles.colorInputWrapper}>
                  <input 
                    type="color" 
                    value={customTheme.primary}
                    onChange={(e) => handleColorChange(e.target.value, 'primary')}
                    className={styles.colorInput}
                  />
                </div>
              </div>
              
              {hasSecondaryColor && customTheme.secondary && (
                <div className={styles.colorOption}>
                  <label>次要色调</label>
                  <div className={styles.colorInputWrapper}>
                    <input 
                      type="color" 
                      value={customTheme.secondary}
                      onChange={(e) => handleColorChange(e.target.value, 'secondary')}
                      className={styles.colorInput}
                    />
                  </div>
                </div>
              )}
              
              <div className={styles.colorOption}>
                <button 
                  className={styles.addSecondaryColorButton}
                  onClick={toggleSecondaryColor}
                  title={hasSecondaryColor ? "移除次要色调" : "添加次要色调"}
                >
                  {hasSecondaryColor ? "移除次要色调" : "➕ 添加次要色调"}
                </button>
                <div className={styles.secondaryColorHint}>
                  {hasSecondaryColor ? "渐变色系统" : "纯色系统"}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.themePreviewContainer} style={getPreviewStyle()}>
          <h3 className={styles.previewTitle}>预览效果</h3>
          <div className={styles.previewContent}>
            <div className={styles.previewHeader}>
              <div className={styles.previewLogo}>
                <Palette size={24} />
                <span>{customThemeName}</span>
              </div>
              <div className={styles.previewButtons}>
                <div className={styles.previewButton}></div>
                <div className={styles.previewButton}></div>
              </div>
            </div>
            <div className={styles.previewBody}>
              <div className={styles.previewSidebar}>
                <div className={styles.previewSidebarItem}></div>
                <div className={styles.previewSidebarItem}></div>
                <div className={styles.previewSidebarItem}></div>
              </div>
              <div className={styles.previewMain}>
                <div className={styles.previewCard}>
                  <h4>标题示例</h4>
                  <p>这是一段示例文字，展示在该主题下的文字效果。</p>
                  <div className={styles.previewButtonGroup}>
                    <button className={styles.previewPrimaryButton}>主按钮</button>
                    <button className={styles.previewSecondaryButton}>次按钮</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.customThemeFooter}>
        <button 
          className={styles.cancelButton}
          onClick={() => setIsCustomizing(false)}
        >
          取消
        </button>
        <button 
          className={styles.applyButton}
          onClick={handleSaveCustomTheme}
        >
          <Save size={16} />
          保存并应用
        </button>
      </div>
    </div>
  );

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // 重置搜索
  const resetSearch = () => {
    setSearchQuery('');
    setActiveCategory(null);
  };

  // 获取搜索结果状态
  const hasSearchResults = filteredThemes.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  // 渲染搜索信息提示
  const renderSearchInfo = () => {
    if (!isSearching) return null;
    
    return (
      <div className={styles.searchInfo}>
        <p className={styles.searchResultsCount}>
          {hasSearchResults 
            ? `找到 ${filteredThemes.length} 个匹配主题` 
            : '没有找到匹配的主题'}
        </p>
      </div>
    );
  };

  // 渲染无结果提示
  const renderNoResults = () => (
    <div className={styles.noResults}>
      <div className={styles.noResultsIcon}>🔍</div>
      <p className={styles.noResultsText}>
        {isSearching 
          ? `没有找到与"${searchQuery}"相关的主题` 
          : "该分类下暂无主题"}
      </p>
      <div className={styles.noResultsHint}>
        {isSearching && (
          <p className={styles.searchHint}>
            尝试以下搜索技巧:
            <ul>
              <li>检查拼写是否正确</li>
              <li>使用更简短的关键词</li>
              <li>尝试搜索颜色值(如 #3b82f6)</li>
              <li>搜索主题类型(如 "自定义"或"预设")</li>
            </ul>
          </p>
        )}
      </div>
      <button 
        className={styles.clearButton}
        onClick={resetSearch}
      >
        显示所有主题
      </button>
    </div>
  );

  // 渲染删除确认对话框
  const renderDeleteConfirmDialog = () => {
    const themeToDeleteName = themes.find(t => t.id === themeToDelete)?.name || themeToDelete;
    
    return (
      <div className={styles.deleteConfirmOverlay}>
        <div className={styles.deleteConfirmDialog}>
          <div className={styles.deleteConfirmHeader}>
            <AlertCircle size={24} className={styles.deleteConfirmIcon} />
            <h3>确认删除主题</h3>
          </div>
          <div className={styles.deleteConfirmContent}>
            <p>您确定要删除自定义主题 <strong>"{themeToDeleteName}"</strong> 吗？</p>
            <p>此操作无法撤销，删除后将无法恢复。</p>
          </div>
          <div className={styles.deleteConfirmActions}>
            <button 
              className={styles.cancelButton}
              onClick={() => {
                setShowDeleteConfirm(false);
                setThemeToDelete(null);
              }}
            >
              取消
            </button>
            <button 
              className={styles.deleteButton}
              onClick={confirmDeleteTheme}
            >
              <Trash size={16} />
              确认删除
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 渲染主界面
  const renderMainUI = () => (
    <>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={onClose}
          title="返回"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className={styles.title}>
          <Palette size={20} className={styles.titleIcon} />
          主题设置
        </h2>
        
        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="搜索主题名称、颜色、类型..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              // 按ESC键清空搜索
              if (e.key === 'Escape') {
                resetSearch();
              }
            }}
          />
          {isSearching && (
            <button 
              className={styles.clearSearch}
              onClick={resetSearch}
              title="清除搜索"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      <div className={styles.categoryTabs}>
        <button 
          className={`${styles.categoryTab} ${activeCategory === null ? styles.active : ''}`}
          onClick={() => setActiveCategory(null)}
        >
          全部
        </button>
        {categories.map(category => (
          <button 
            key={category}
            className={`${styles.categoryTab} ${activeCategory === category ? styles.active : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      <div className={styles.customThemeButton}>
        <button
          className={styles.createCustomThemeBtn}
          onClick={() => setIsCustomizing(true)}
        >
          <Plus size={16} />
          创建自定义主题
        </button>
      </div>
      
      <div className={styles.themesContainer}>
        {hasSearchResults ? (
          <>
            {filteredThemes.map(theme => (
              <button
                key={theme.id}
                className={`${styles.themeOption} ${selectedTheme === theme.id ? styles.selected : ''} ${newCreatedThemeId === theme.id ? styles.newCreated : ''}`}
                onClick={() => handleThemeSelect(theme.id)}
                disabled={isChanging}
                style={{ 
                  '--theme-preview': theme.preview,
                  '--theme-highlight': theme.primary
                } as React.CSSProperties}
              >
                <div 
                  className={styles.themePreview} 
                  style={{
                    background: theme.preview
                  } as React.CSSProperties}
                />
                <span className={styles.themeName}>{theme.name}</span>
                {selectedTheme === theme.id && (
                  <span className={styles.checkmark}>
                    <Check size={14} />
                  </span>
                )}
                <span className={styles.categoryTag}>{theme.category}</span>
                
                {/* 添加删除按钮，仅对自定义主题显示 */}
                {theme.isCustom && (
                  <button
                    className={styles.deleteThemeButton}
                    onClick={(e) => {
                      e.stopPropagation(); // 阻止事件冒泡，避免触发主题选择
                      handleDeleteTheme(theme.id);
                    }}
                    title="删除此主题"
                  >
                    <Trash size={14} />
                  </button>
                )}
              </button>
            ))}
          </>
        ) : (
          renderNoResults()
        )}
      </div>
      
      <div className={styles.footer}>
        <p className={styles.footerText}>
          当前主题: <span className={styles.currentTheme}>
            {themes.find(t => t.id === selectedTheme)?.name || "默认主题"}
          </span>
        </p>
        <button 
          className={styles.closeButton}
          onClick={onClose}
        >
          返回文件管理
        </button>
      </div>
    </>
  );

  // 在组件挂载时加载当前用户的主题
  useEffect(() => {
    // 先尝试加载匿名主题
    reinitCustomThemes();
    
    // 然后加载当前用户的主题
    if (userId) {
      reinitCustomThemes(userId);
    }
    
    // 为了确保现有的所有主题都能被正确加载，我们再次设置renderKey触发主题列表刷新
    setRenderKey(Date.now());
    
    // 清除新创建主题的高亮状态
    setTimeout(() => {
      setNewCreatedThemeId(null);
    }, 5000);
  }, [userId]);

  return (
    <div className={styles.themePanel}>
      {isCustomizing ? renderCustomThemeUI() : renderMainUI()}
      {showDeleteConfirm && renderDeleteConfirmDialog()}
      {showCreationSuccess && renderCreationSuccessMessage()}
      {renderSearchInfo()}
    </div>
  );
};

export default ThemePanel; 