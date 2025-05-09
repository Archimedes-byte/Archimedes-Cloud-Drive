import React, { useState, useRef, useEffect, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import styles from './dropdown.module.css';

export interface BaseDropdownProps {
  /**
   * 触发下拉菜单的元素
   */
  trigger: ReactNode;
  
  /**
   * 下拉菜单内容
   */
  children: ReactNode;
  
  /**
   * 是否使用Portal渲染下拉菜单
   * @default false
   */
  usePortal?: boolean;
  
  /**
   * 下拉菜单的位置
   * @default 'bottom-left'
   */
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  
  /**
   * 自定义样式类
   */
  className?: string;
  
  /**
   * 自定义下拉菜单样式类
   */
  dropdownMenuClassName?: string;
  
  /**
   * 菜单宽度
   * @default 160
   */
  menuWidth?: number;
  
  /**
   * 菜单是否显示
   */
  isOpen?: boolean;
  
  /**
   * 菜单显示状态变化回调
   */
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * 基础下拉菜单组件
 * 提供通用的下拉菜单功能，可以被其他组件复用
 */
export const BaseDropdown: React.FC<BaseDropdownProps> = ({
  trigger,
  children,
  usePortal = false,
  placement = 'bottom-left',
  className = '',
  dropdownMenuClassName = '',
  menuWidth = 160,
  isOpen: controlledIsOpen,
  onOpenChange,
}) => {
  // 支持受控和非受控模式
  const isControlled = controlledIsOpen !== undefined;
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // 切换下拉菜单显示状态
  const toggleDropdown = () => {
    const newState = !isOpen;
    if (!isControlled) {
      setInternalIsOpen(newState);
    }
    if (onOpenChange) {
      onOpenChange(newState);
    }
  };
  
  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        menuRef.current && 
        !menuRef.current.contains(event.target as Node)
      ) {
        if (!isControlled) {
          setInternalIsOpen(false);
        }
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isControlled, onOpenChange]);
  
  // 渲染下拉菜单
  const renderMenu = () => {
    if (!isOpen) return null;
    
    const portalStyle = usePortal ? { 
      position: 'fixed' as const, 
      zIndex: 9999
    } : {};
    
    const menuStyle = {
      width: `${menuWidth}px`,
      ...portalStyle
    };
    
    const menuElement = (
      <div 
        ref={menuRef}
        className={`${styles.dropdownMenu} ${dropdownMenuClassName}`}
        style={menuStyle}
      >
        {children}
      </div>
    );
    
    if (usePortal) {
      return ReactDOM.createPortal(menuElement, document.body);
    } else {
      return menuElement;
    }
  };
  
  return (
    <div 
      ref={containerRef} 
      className={`${styles.dropdownContainer} ${className}`}
    >
      <div onClick={toggleDropdown}>
        {trigger}
      </div>
      {renderMenu()}
    </div>
  );
};

export default BaseDropdown; 