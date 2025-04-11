import React, { useState, useEffect } from 'react';
import { ArrowLeft, Palette, Search, Check, Plus, ChevronLeft, Brush, Type, EyeIcon, Save, Trash, AlertCircle } from 'lucide-react';
import styles from './ThemePanel.module.css';
import { 
  getThemeStyle, 
  applyTheme as applyThemeService,
  getAllThemes,
  ThemeStyle,
  saveCustomTheme,
  deleteCustomTheme
} from '@/app/shared/themes';

interface ThemePanelProps {
  currentTheme: string | null;
  onThemeChange: (themeId: string) => Promise<boolean>;
  onClose: () => void;
}

// 默认自定义主题模板
const defaultCustomTheme: ThemeStyle = {
  primary: '#3b82f6',
  secondary: '#2c5282',
  accent: '#60a5fa',
  background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f0fd 100%)',
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

// 可用字体列表
const availableFonts = [
  { id: 'system', name: '系统默认字体', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { id: 'serif', name: '衬线字体', value: 'Georgia, Cambria, "Times New Roman", Times, serif' },
  { id: 'sans', name: '无衬线字体', value: 'Arial, Helvetica, sans-serif' },
  { id: 'mono', name: '等宽字体', value: '"Courier New", Courier, monospace' },
  { id: 'rounded', name: '圆角字体', value: '"Varela Round", "Nunito", sans-serif' }
];

const ThemePanel: React.FC<ThemePanelProps> = ({ 
  currentTheme, 
  onThemeChange,
  onClose
}) => {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || 'default');
  const [isChanging, setIsChanging] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 自定义主题状态
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customTheme, setCustomTheme] = useState<ThemeStyle>({...defaultCustomTheme});
  const [customThemeName, setCustomThemeName] = useState('我的自定义主题');
  const [selectedFont, setSelectedFont] = useState(availableFonts[0].id);
  const [showPreview, setShowPreview] = useState(false);
  
  // 删除主题状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<string | null>(null);

  // 使用统一的主题服务获取所有主题
  const themes = React.useMemo(() => {
    // 使用全局主题定义映射到需要的格式
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
        category: themeStyle.category || '其他主题',
        // 判断是否是自定义主题
        isCustom: theme.id.startsWith('custom_')
      };
    });
  }, [showDeleteConfirm]); // 添加showDeleteConfirm依赖，确保删除后重新获取主题列表

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
    if (themeId === selectedTheme) return; // 避免重复选择
    
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
        const secondaryColorMatch = theme.secondary.toLowerCase().includes(query);
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
    setCustomTheme(prev => ({
      ...prev,
      [property]: color
    }));
    
    // 自动开启预览
    if (!showPreview) {
      setShowPreview(true);
    }
  };

  // 处理字体变更
  const handleFontChange = (fontId: string) => {
    setSelectedFont(fontId);
    // 在这里我们不直接修改customTheme，而是保存字体ID，应用时再获取字体值
  };

  // 应用自定义主题
  const applyCustomTheme = async () => {
    const selectedFontValue = availableFonts.find(f => f.id === selectedFont)?.value || availableFonts[0].value;
    
    // 创建完整的自定义主题对象
    const fullCustomTheme: ThemeStyle = {
      ...customTheme,
      name: customThemeName,
      // 添加字体属性
      fontFamily: selectedFontValue
    };
    
    // 生成唯一ID - 使用时间戳和随机数组合
    const customThemeId = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    try {
      // 保存自定义主题到本地存储
      const saveSuccess = saveCustomTheme(customThemeId, fullCustomTheme);
      
      if (saveSuccess) {
        // 应用新主题
        applyThemeService(customThemeId);
        
        // 尝试保存到服务器
        const serverSuccess = await onThemeChange(customThemeId);
        
        if (serverSuccess) {
          // 返回到主题列表并选中新创建的主题
          setIsCustomizing(false);
          setSelectedTheme(customThemeId);
        } else {
          alert('主题已在本地应用，但未能保存到服务器');
        }
      } else {
        alert('保存自定义主题失败，请稍后再试');
      }
    } catch (error) {
      console.error('应用自定义主题出错:', error);
      alert('应用自定义主题时发生错误');
    }
  };

  // 自定义主题预览
  const getPreviewStyle = () => {
    const selectedFontValue = availableFonts.find(f => f.id === selectedFont)?.value || availableFonts[0].value;
    
    return {
      '--preview-primary': customTheme.primary,
      '--preview-secondary': customTheme.secondary,
      '--preview-accent': customTheme.accent,
      '--preview-background': customTheme.background,
      '--preview-text': customTheme.text,
      '--preview-font': selectedFontValue
    } as React.CSSProperties;
  };

  // 自定义主题的实时预览背景
  const getCustomThemePreviewStyle = () => {
    return {
      background: `linear-gradient(135deg, ${customTheme.primary} 0%, ${customTheme.secondary} 100%)`,
    } as React.CSSProperties;
  };

  // 处理删除主题
  const handleDeleteTheme = async (themeId: string) => {
    if (!themeId.startsWith('custom_')) {
      alert('只能删除自定义主题');
      return;
    }
    
    setThemeToDelete(themeId);
    setShowDeleteConfirm(true);
  };

  // 确认删除主题
  const confirmDeleteTheme = async () => {
    if (!themeToDelete) return;
    
    try {
      const deleteSuccess = deleteCustomTheme(themeToDelete);
      
      if (deleteSuccess) {
        // 如果当前选中的是被删除的主题，则切换回默认主题
        if (selectedTheme === themeToDelete || currentTheme === themeToDelete) {
          await onThemeChange('default');
          setSelectedTheme('default');
        }
        
        alert(`自定义主题"${themes.find(t => t.id === themeToDelete)?.name || themeToDelete}"已删除`);
      } else {
        alert('删除主题失败，请稍后再试');
      }
    } catch (error) {
      console.error('删除主题出错:', error);
      alert('删除主题时发生错误');
    } finally {
      setShowDeleteConfirm(false);
      setThemeToDelete(null);
    }
  };

  // 自定义主题字体选择界面渲染
  const renderFontOptions = () => (
    <div className={styles.fontOptions}>
      {availableFonts.map(font => (
        <button
          key={font.id}
          className={`${styles.fontOption} ${selectedFont === font.id ? styles.selected : ''}`}
          onClick={() => handleFontChange(font.id)}
          style={{ fontFamily: font.value }}
        >
          <span className={styles.fontName}>{font.name}</span>
          <span className={styles.fontSample} style={{ color: customTheme.primary }}>Aa 中文示例</span>
          {selectedFont === font.id && (
            <span className={styles.fontCheckmark} style={{ background: customTheme.primary }}>
              <Check size={14} />
            </span>
          )}
        </button>
      ))}
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
        
        <div className={styles.previewToggle}>
          <button
            className={`${styles.previewButton} ${showPreview ? styles.active : ''}`}
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? "关闭预览" : "打开预览"}
            style={showPreview ? {} : getCustomThemePreviewStyle()}
          >
            <EyeIcon size={18} />
            {showPreview ? "关闭预览" : "预览"}
          </button>
        </div>
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
                  <span className={styles.colorValue}>{customTheme.primary}</span>
                </div>
              </div>
              
              <div className={styles.colorOption}>
                <label>次要色调</label>
                <div className={styles.colorInputWrapper}>
                  <input 
                    type="color" 
                    value={customTheme.secondary}
                    onChange={(e) => handleColorChange(e.target.value, 'secondary')}
                    className={styles.colorInput}
                  />
                  <span className={styles.colorValue}>{customTheme.secondary}</span>
                </div>
              </div>
              
              <div className={styles.colorOption}>
                <label>强调色</label>
                <div className={styles.colorInputWrapper}>
                  <input 
                    type="color" 
                    value={customTheme.accent || '#60a5fa'}
                    onChange={(e) => handleColorChange(e.target.value, 'accent')}
                    className={styles.colorInput}
                  />
                  <span className={styles.colorValue}>{customTheme.accent || '#60a5fa'}</span>
                </div>
              </div>
              
              <div className={styles.colorOption}>
                <label>文字颜色</label>
                <div className={styles.colorInputWrapper}>
                  <input 
                    type="color" 
                    value={customTheme.text || '#1a202c'}
                    onChange={(e) => handleColorChange(e.target.value, 'text')}
                    className={styles.colorInput}
                  />
                  <span className={styles.colorValue}>{customTheme.text || '#1a202c'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.fontSection}>
            <h3 className={styles.sectionTitle}>
              <Type size={16} />
              字体样式
            </h3>
            
            {renderFontOptions()}
          </div>
        </div>
        
        {showPreview && (
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
        )}
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
          onClick={applyCustomTheme}
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
                className={`${styles.themeOption} ${selectedTheme === theme.id ? styles.selected : ''}`}
                onClick={() => handleThemeSelect(theme.id)}
                disabled={isChanging}
                style={{ 
                  '--theme-preview': theme.preview,
                  '--theme-highlight': theme.primary
                } as React.CSSProperties}
              >
                <div className={styles.themePreview} />
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

  return (
    <div className={styles.themePanel}>
      {isCustomizing ? renderCustomThemeUI() : renderMainUI()}
      {showDeleteConfirm && renderDeleteConfirmDialog()}
      {renderSearchInfo()}
    </div>
  );
};

export default ThemePanel; 