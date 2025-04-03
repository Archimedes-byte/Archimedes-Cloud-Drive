import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import styles from './ThemeSelector.module.css';

interface ThemeOption {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  preview: string;
  accent?: string;
  category?: string;
}

interface ThemeSelectorProps {
  currentTheme: string | null;
  onThemeChange: (themeId: string) => Promise<boolean>;
}

const ThemeSelector = ({ currentTheme, onThemeChange }: ThemeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || 'default');
  const [isChanging, setIsChanging] = useState(false);
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // 预设主题选项
  const themes: ThemeOption[] = [
    // 基础色彩主题
    {
      id: 'default',
      name: '默认蓝',
      primary: '#3b82f6',
      secondary: '#3b98f5',
      background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f0fd 100%)',
      preview: 'linear-gradient(135deg, #3b82f6 0%, #3b98f5 100%)',
      category: '基础色彩'
    },
    {
      id: 'violet',
      name: '梦幻紫',
      primary: '#8b5cf6',
      secondary: '#a855f7',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      preview: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
      category: '基础色彩'
    },
    {
      id: 'emerald',
      name: '自然绿',
      primary: '#10b981',
      secondary: '#059669',
      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      preview: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      category: '基础色彩'
    },
    {
      id: 'amber',
      name: '温暖橙',
      primary: '#f59e0b',
      secondary: '#d97706',
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      preview: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      category: '基础色彩'
    },
    {
      id: 'rose',
      name: '浪漫粉',
      primary: '#f43f5e',
      secondary: '#e11d48',
      background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      preview: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
      category: '基础色彩'
    },
    
    // 渐变主题
    {
      id: 'ocean',
      name: '深海蓝',
      primary: '#0ea5e9',
      secondary: '#0284c7',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
      preview: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      accent: '#38bdf8',
      category: '渐变主题'
    },
    {
      id: 'sunset',
      name: '日落',
      primary: '#f97316',
      secondary: '#ea580c',
      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      preview: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
      accent: '#fb923c',
      category: '渐变主题'
    },
    {
      id: 'forest',
      name: '森林',
      primary: '#16a34a',
      secondary: '#15803d',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      preview: 'linear-gradient(135deg, #16a34a 0%, #166534 100%)',
      accent: '#22c55e',
      category: '渐变主题'
    },
    {
      id: 'galaxy',
      name: '星空',
      primary: '#6366f1',
      secondary: '#4f46e5',
      background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
      preview: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
      accent: '#818cf8',
      category: '渐变主题'
    },
    
    // 季节主题
    {
      id: 'spring',
      name: '春日',
      primary: '#ec4899',
      secondary: '#db2777',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 100%)',
      preview: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      accent: '#f472b6',
      category: '季节主题'
    },
    {
      id: 'summer',
      name: '盛夏',
      primary: '#eab308',
      secondary: '#ca8a04',
      background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
      preview: 'linear-gradient(135deg, #eab308 0%, #a16207 100%)',
      accent: '#facc15',
      category: '季节主题'
    },
    {
      id: 'autumn',
      name: '金秋',
      primary: '#b45309',
      secondary: '#92400e',
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      preview: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
      accent: '#f59e0b',
      category: '季节主题'
    },
    {
      id: 'winter',
      name: '冬雪',
      primary: '#0369a1',
      secondary: '#075985',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      preview: 'linear-gradient(135deg, #0ea5e9 0%, #0c4a6e 100%)',
      accent: '#38bdf8',
      category: '季节主题'
    },
    
    // 柔和主题 - 浅色系列
    {
      id: 'pastel_pink',
      name: '粉彩洋',
      primary: '#f9a8d4',
      secondary: '#ec4899',
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
      preview: 'linear-gradient(135deg, #f9a8d4 0%, #ec4899 100%)',
      accent: '#fbcfe8',
      category: '柔和主题'
    },
    {
      id: 'pastel_blue',
      name: '天空蓝',
      primary: '#93c5fd',
      secondary: '#60a5fa',
      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      preview: 'linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%)',
      accent: '#bfdbfe',
      category: '柔和主题'
    },
    {
      id: 'pastel_lavender',
      name: '薰衣草',
      primary: '#c4b5fd',
      secondary: '#a78bfa',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      preview: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)',
      accent: '#ddd6fe',
      category: '柔和主题'
    },
    {
      id: 'pastel_mint',
      name: '薄荷绿',
      primary: '#6ee7b7',
      secondary: '#34d399',
      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      preview: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)',
      accent: '#a7f3d0',
      category: '柔和主题'
    },
    {
      id: 'pastel_peach',
      name: '蜜桃粉',
      primary: '#fda4af',
      secondary: '#fb7185',
      background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      preview: 'linear-gradient(135deg, #fda4af 0%, #fb7185 100%)',
      accent: '#fecdd3',
      category: '柔和主题'
    },
    {
      id: 'pastel_lemon',
      name: '柠檬黄',
      primary: '#fde68a',
      secondary: '#fcd34d',
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      preview: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)',
      accent: '#fef3c7',
      category: '柔和主题'
    },
    {
      id: 'pastel_teal',
      name: '青瓷绿',
      primary: '#5eead4',
      secondary: '#2dd4bf',
      background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
      preview: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)',
      accent: '#99f6e4',
      category: '柔和主题'
    }
  ];

  // 获取所有主题分类
  const categories: string[] = Array.from(new Set(themes.map(theme => theme.category || '')));

  // 当外部主题变化时更新内部选中状态
  useEffect(() => {
    if (currentTheme) {
      setSelectedTheme(currentTheme);
    }
  }, [currentTheme]);

  // 当组件打开时应用CSS变量
  useEffect(() => {
    // 当选择器打开时应用CSS自定义属性以实现主题预览
    if (isOpen) {
      document.body.classList.add('theme-preview-active');
    } else {
      document.body.classList.remove('theme-preview-active');
    }

    return () => {
      document.body.classList.remove('theme-preview-active');
    };
  }, [isOpen]);

  // 处理主题预览
  const handleThemePreview = (themeId: string | null) => {
    setHoveredTheme(themeId);
    
    if (!themeId) return;
    
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    
    // 仅预览不保存
    document.documentElement.style.setProperty('--preview-primary', theme.primary);
    document.documentElement.style.setProperty('--preview-secondary', theme.secondary);
    document.documentElement.style.setProperty('--preview-background', theme.background);
    if (theme.accent) {
      document.documentElement.style.setProperty('--preview-accent', theme.accent);
    }
  };

  // 处理主题选择
  const handleThemeSelect = async (themeId: string) => {
    setIsChanging(true);
    setSelectedTheme(themeId);
    
    try {
      const success = await onThemeChange(themeId);
      if (success) {
        // 应用主题
        applyTheme(themeId);
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
      setHoveredTheme(null);
    }
  };

  // 将主题应用到文档
  const applyTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) {
      console.error(`找不到主题: ${themeId}`);
      return;
    }

    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
    document.documentElement.style.setProperty('--theme-background', theme.background);
    if (theme.accent) {
      document.documentElement.style.setProperty('--theme-accent', theme.accent);
    }
    
    // 确保主题已成功应用
    console.log(`已将主题 ${theme.name} 应用到文档`, {
      primary: theme.primary,
      secondary: theme.secondary,
      background: theme.background,
      accent: theme.accent
    });
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
                onMouseEnter={() => handleThemePreview(theme.id)}
                onMouseLeave={() => setHoveredTheme(null)}
                disabled={isChanging}
                style={{ 
                  '--theme-preview': theme.preview,
                  '--theme-highlight': theme.primary
                } as React.CSSProperties}
              >
                <div className={`${styles.themePreview} ${hoveredTheme === theme.id ? styles.hovered : ''}`} />
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