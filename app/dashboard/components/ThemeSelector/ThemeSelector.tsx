import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import styles from './ThemeSelector.module.css';
import { 
  getThemeStyle, 
  applyTheme as applyThemeService,
  getAllThemes,
  ThemeStyle
} from '@/app/shared/themes';

interface ThemeSelectorProps {
  currentTheme: string | null;
  onThemeChange: (themeId: string) => Promise<boolean>;
}

const ThemeSelector = ({ currentTheme, onThemeChange }: ThemeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || 'default');
  const [isChanging, setIsChanging] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // 使用统一的主题服务获取所有主题
  const themes = React.useMemo(() => {
    // 从全局主题定义映射到ThemeSelector所需格式
    return getAllThemes().map(theme => {
      const themeStyle = getThemeStyle(theme.id);
      return {
        id: theme.id,
        name: theme.name,
        primary: themeStyle.primary,
        secondary: themeStyle.secondary,
        background: themeStyle.background,
        preview: `linear-gradient(135deg, ${themeStyle.primary} 0%, ${themeStyle.secondary} 100%)`,
        accent: themeStyle.accent,
        // 直接使用主题服务中定义的分类
        category: themeStyle.category || '其他主题'
      };
    });
  }, []);

  // 获取所有主题分类
  const categories: string[] = Array.from(new Set(themes.map(theme => theme.category || '')));

  // 当外部主题变化时更新内部选中状态
  useEffect(() => {
    if (currentTheme) {
      setSelectedTheme(currentTheme);
    }
  }, [currentTheme]);

  // 处理主题选择
  const handleThemeSelect = async (themeId: string) => {
    setIsChanging(true);
    setSelectedTheme(themeId);
    
    try {
      // 使用onThemeChange回调保存到服务器
      const success = await onThemeChange(themeId);
      if (success) {
        // 应用主题 - 使用全局服务
        applyThemeService(themeId);
        console.log(`主题 ${themeId} 已成功应用`);
      } else {
        console.error(`主题 ${themeId} 应用失败`);
        // 恢复之前的主题
        if (currentTheme) {
          setSelectedTheme(currentTheme);
        }
        // 显示错误消息
        alert(`主题应用失败，请稍后再试。`);
      }
    } catch (error) {
      console.error(`应用主题时出错:`, error);
      // 恢复之前的主题
      if (currentTheme) {
        setSelectedTheme(currentTheme);
      }
      // 显示错误消息
      alert(`应用主题时发生错误，请稍后再试。`);
    } finally {
      setIsChanging(false);
      setIsOpen(false);
    }
  };

  // 根据当前选中的主题设置按钮样式
  const getButtonStyle = () => {
    const theme = themes.find(t => t.id === selectedTheme);
    if (!theme) return {};
    
    return {
      background: theme.preview,
      borderColor: theme.primary
    } as React.CSSProperties;
  };

  // 过滤显示的主题
  const filteredThemes = activeCategory 
    ? themes.filter(theme => theme.category === activeCategory)
    : themes;

  return (
    <div className={styles.container}>
      <button 
        className={styles.themeButton}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        style={getButtonStyle()}
      >
        <Palette size={18} />
        <span>更换主题</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>选择主题</h3>
            <button 
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
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
          
          <div className={styles.themeOptions}>
            {filteredThemes.map(theme => (
              <button
                key={theme.id}
                className={`${styles.themeOption} ${selectedTheme === theme.id ? styles.selected : ''}`}
                onClick={() => handleThemeSelect(theme.id)}
                disabled={isChanging}
                style={{ 
                  '--theme-preview': theme.preview,
                  '--theme-highlight': theme.primary
                } as React.CSSProperties}
              >
                <div className={styles.themePreview} />
                <span>{theme.name}</span>
                {selectedTheme === theme.id && (
                  <span className={styles.checkmark}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector; 