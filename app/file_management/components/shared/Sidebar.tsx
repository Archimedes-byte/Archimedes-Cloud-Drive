import React, { useEffect } from 'react';
import { 
  Folder, Files, Image as ImageIcon, FileText, 
  Video, Music, File, Search, ChevronDown, 
  Star, Clock, Tag, Download, Settings,
  CheckCircle
} from 'lucide-react';
import styles from '../../styles/shared.module.css';

export type FileType = 'image' | 'document' | 'video' | 'audio' | 'other' | null;

interface SidebarProps {
  selectedFileType: FileType;
  onTypeClick: (type: FileType) => void;
  onSearchClick?: () => void;
}

export function Sidebar({ selectedFileType, onTypeClick, onSearchClick }: SidebarProps) {
  const fileTypes: { type: FileType; label: string; icon: React.ElementType }[] = [
    { type: null, label: '全部文件', icon: Files },
    { type: 'image', label: '图片', icon: ImageIcon },
    { type: 'document', label: '文档', icon: FileText },
    { type: 'video', label: '视频', icon: Video },
    { type: 'audio', label: '音频', icon: Music },
    { type: 'other', label: '其他', icon: File }
  ];

  const [quickAccessExpanded, setQuickAccessExpanded] = React.useState(true);
  const [myFilesExpanded, setMyFilesExpanded] = React.useState(true);
  const [settingsExpanded, setSettingsExpanded] = React.useState(false);

  // 监听文件类型变化并记录日志
  useEffect(() => {
    console.log('侧边栏：当前选择的文件类型:', selectedFileType);
  }, [selectedFileType]);

  const handleTypeClick = (type: FileType) => {
    // 直接调用回调，不需要任何额外逻辑
    console.log('Sidebar直接点击类型:', type);
    onTypeClick(type);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarSection}>
        <div 
          className={styles.sidebarHeader} 
          onClick={() => setMyFilesExpanded(!myFilesExpanded)}
        >
          <Folder className={styles.icon} />
          我的文件
          <ChevronDown 
            className={styles.icon} 
            style={{ 
              marginLeft: 'auto', 
              transform: myFilesExpanded ? 'rotate(180deg)' : 'rotate(0)', 
              transition: 'transform 0.3s' 
            }} 
            size={16} 
          />
        </div>
        {myFilesExpanded && (
          <div className={styles.sidebarSubmenu}>
            {fileTypes.map(({ type, label, icon: Icon }) => (
              <div
                key={type || 'all'}
                className={`${styles.sidebarItem} ${selectedFileType === type ? styles.active : ''}`}
                onClick={() => handleTypeClick(type)}
              >
                <Icon className={styles.icon} />
                {label}
                {selectedFileType === type && (
                  <CheckCircle 
                    className={styles.icon} 
                    style={{ 
                      marginLeft: 'auto', 
                      color: 'var(--theme-primary, #3b82f6)',
                      fill: 'var(--theme-primary, #3b82f6)',
                      stroke: '#fff',
                      opacity: 0.9,
                    }} 
                    size={16} 
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.sidebarSection}>
        <div 
          className={styles.sidebarHeader}
          onClick={() => setQuickAccessExpanded(!quickAccessExpanded)}
        >
          <Search className={styles.icon} />
          快捷查询
          <ChevronDown 
            className={styles.icon} 
            style={{ 
              marginLeft: 'auto', 
              transform: quickAccessExpanded ? 'rotate(180deg)' : 'rotate(0)', 
              transition: 'transform 0.3s' 
            }} 
            size={16} 
          />
        </div>
        {quickAccessExpanded && (
          <div className={styles.sidebarSubmenu}>
            <div 
              className={styles.sidebarItem}
              onClick={onSearchClick}
            >
              <Search className={styles.icon} />
              搜索文件
            </div>
            <div className={styles.sidebarItem}>
              <Star className={styles.icon} />
              收藏文件
            </div>
            <div className={styles.sidebarItem}>
              <Clock className={styles.icon} />
              最近访问
            </div>
            <div className={styles.sidebarItem}>
              <Tag className={styles.icon} />
              按标签查找
            </div>
            <div className={styles.sidebarItem}>
              <Download className={styles.icon} />
              下载记录
            </div>
          </div>
        )}
      </div>

      <div className={styles.sidebarSection}>
        <div 
          className={styles.sidebarHeader}
          onClick={() => setSettingsExpanded(!settingsExpanded)}
        >
          <Settings className={styles.icon} />
          系统设置
          <ChevronDown 
            className={styles.icon} 
            style={{ 
              marginLeft: 'auto', 
              transform: settingsExpanded ? 'rotate(180deg)' : 'rotate(0)', 
              transition: 'transform 0.3s' 
            }} 
            size={16} 
          />
        </div>
        {settingsExpanded && (
          <div className={styles.sidebarSubmenu}>
            <div className={styles.sidebarItem}>
              <Settings className={styles.icon} />
              存储管理
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 