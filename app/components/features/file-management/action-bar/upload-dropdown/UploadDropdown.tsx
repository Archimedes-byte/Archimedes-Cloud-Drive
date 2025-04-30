import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '@/app/components/ui/ant';
import { Upload, FolderUp, ChevronDown } from 'lucide-react';
import styles from './UploadDropdown.module.css';

export interface UploadDropdownProps {
  setIsUploadModalOpen?: (open: boolean) => void;
  setIsFolderUploadModalOpen?: (open: boolean) => void;
  onUploadClick?: () => void;
  onFolderUploadClick?: () => void;
}

/**
 * 上传下拉菜单组件
 * 合并上传文件和上传文件夹为一个下拉菜单按钮
 */
export const UploadDropdown: React.FC<UploadDropdownProps> = ({
  setIsUploadModalOpen = () => {},
  setIsFolderUploadModalOpen = () => {},
  onUploadClick,
  onFolderUploadClick,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  // 计算菜单位置
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 160 + window.scrollX, // 下拉菜单宽度为160px
        width: 160
      });
    }
  }, [showDropdown]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node) &&
        menuRef.current && 
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理上传文件点击
  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(false);
    
    if (onUploadClick) {
      onUploadClick();
    } else {
      setIsUploadModalOpen(true);
    }
  };

  // 处理上传文件夹点击
  const handleFolderUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(false);
    
    if (onFolderUploadClick) {
      onFolderUploadClick();
    } else {
      setIsFolderUploadModalOpen(true);
    }
  };

  // 菜单内容
  const renderMenu = () => {
    // 使用 portal 将菜单渲染到 body 下，避免任何容器干扰
    if (!showDropdown) return null;
    
    return ReactDOM.createPortal(
      <div 
        ref={menuRef}
        className={styles.dropdownMenu} 
        style={{
          position: 'absolute',
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          width: `${menuPosition.width}px`,
          zIndex: 9999
        }}
      >
        <div 
          className={styles.dropdownItem}
          onClick={handleUploadClick}
        >
          <Upload size={16} />
          上传文件
        </div>
        <div 
          className={styles.dropdownItem}
          onClick={handleFolderUploadClick}
        >
          <FolderUp size={16} />
          上传文件夹
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className={styles.uploadDropdown} ref={buttonRef}>
      <Button 
        variant="text"
        onClick={() => setShowDropdown(!showDropdown)}
        icon={<Upload size={16} className="text-white" />}
        style={{ minWidth: '80px', color: 'white' }}
        className="text-white hover:bg-white/10"
      >
        上传 <ChevronDown size={14} style={{ marginLeft: '4px' }} className="text-white" />
      </Button>
      
      {renderMenu()}
    </div>
  );
};

export default UploadDropdown; 