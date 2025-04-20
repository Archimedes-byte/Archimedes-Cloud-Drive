import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from '@/app/file-management/styles/SortDropdown.module.css';
import { FileSortInterface, SortDirectionEnum, FileSortEnum, SortField } from '@/app/types';

interface SortDropdownProps {
  sortOrder: FileSortInterface;
  onSortChange: (order: FileSortInterface) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  sortOrder,
  onSortChange
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 根据当前排序字段获取显示文本
  const getSortFieldText = () => {
    switch(sortOrder.field) {
      case 'name': return '文件名';
      case 'size': return '大小';
      case 'createdAt': return '时间';
      default: return '默认';
    }
  };

  // 选择特定排序选项时的处理函数
  const handleSortClick = useCallback(
    (field: SortField, direction: SortDirectionEnum) => {
      console.log('排序选项被点击:', { field, direction });
      
      // 关闭排序下拉菜单
      setShowDropdown(false);
      
      // 创建新的排序选项
      const newSortOrder: FileSortInterface = {
        field,
        direction,
      };
      
      // 调用排序变更回调函数
      if (typeof onSortChange === 'function') {
        console.log('调用onSortChange函数:', newSortOrder);
        onSortChange(newSortOrder);
      } else {
        console.warn('SortDropdown: onSortChange is not a function');
      }
    },
    [onSortChange]
  );

  return (
    <div className={styles.sortDropdown} ref={dropdownRef}>
      <button 
        className={styles.topButton}
        onClick={() => setShowDropdown(!showDropdown)}
        style={{ 
          background: showDropdown ? '#f0f7ff' : 'white',
          borderColor: showDropdown ? '#60a5fa' : '#e8e8e8'
        }}
      >
        <span>↕️</span>
        排序: {getSortFieldText()} {sortOrder.direction === SortDirectionEnum.ASC ? '↑' : '↓'}
      </button>
      {showDropdown && (
        <div className={styles.dropdownMenu}>
          <div 
            className={styles.dropdownItem}
            onClick={() => handleSortClick('name', sortOrder.field === 'name' && sortOrder.direction === SortDirectionEnum.ASC ? SortDirectionEnum.DESC : SortDirectionEnum.ASC)}
            style={{ 
              fontWeight: sortOrder.field === 'name' ? 'bold' : 'normal',
              background: sortOrder.field === 'name' ? '#f0f7ff' : 'transparent'
            }}
          >
            <span>📝</span>
            按文件名{sortOrder.field === 'name' ? (sortOrder.direction === SortDirectionEnum.ASC ? ' ↑' : ' ↓') : ''}
          </div>
          <div 
            className={styles.dropdownItem}
            onClick={() => handleSortClick('size', sortOrder.field === 'size' && sortOrder.direction === SortDirectionEnum.ASC ? SortDirectionEnum.DESC : SortDirectionEnum.ASC)}
            style={{ 
              fontWeight: sortOrder.field === 'size' ? 'bold' : 'normal',
              background: sortOrder.field === 'size' ? '#f0f7ff' : 'transparent'
            }}
          >
            <span>📊</span>
            按大小{sortOrder.field === 'size' ? (sortOrder.direction === SortDirectionEnum.ASC ? ' ↑' : ' ↓') : ''}
          </div>
          <div 
            className={styles.dropdownItem}
            onClick={() => handleSortClick('createdAt', sortOrder.field === 'createdAt' && sortOrder.direction === SortDirectionEnum.ASC ? SortDirectionEnum.DESC : SortDirectionEnum.ASC)}
            style={{ 
              fontWeight: sortOrder.field === 'createdAt' ? 'bold' : 'normal',
              background: sortOrder.field === 'createdAt' ? '#f0f7ff' : 'transparent'
            }}
          >
            <span>🕒</span>
            按时间{sortOrder.field === 'createdAt' ? (sortOrder.direction === SortDirectionEnum.ASC ? ' ↑' : ' ↓') : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortDropdown; 