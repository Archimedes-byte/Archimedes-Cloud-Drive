/**
 * @deprecated 此组件已迁移到新的组件架构中。
 * 请使用 @/app/components/features/fileManagement/actionBar/SortDropdown 组件。
 */

import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/SortDropdown.module.css';
import { FileSortInterface, SortDirectionEnum } from '@/app/types';

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
          <button 
            className={styles.dropdownItem}
            onClick={() => {
              const newSortOrder: FileSortInterface = {
                field: 'name',
                direction: sortOrder.field === 'name' && sortOrder.direction === SortDirectionEnum.ASC ? SortDirectionEnum.DESC : SortDirectionEnum.ASC
              };
              onSortChange(newSortOrder);
              setShowDropdown(false);
            }}
            style={{ 
              fontWeight: sortOrder.field === 'name' ? 'bold' : 'normal',
              background: sortOrder.field === 'name' ? '#f0f7ff' : 'transparent'
            }}
          >
            <span>📝</span>
            按文件名{sortOrder.field === 'name' ? (sortOrder.direction === SortDirectionEnum.ASC ? ' ↑' : ' ↓') : ''}
          </button>
          <button 
            className={styles.dropdownItem}
            onClick={() => {
              const newSortOrder: FileSortInterface = {
                field: 'size',
                direction: sortOrder.field === 'size' && sortOrder.direction === SortDirectionEnum.ASC ? SortDirectionEnum.DESC : SortDirectionEnum.ASC
              };
              onSortChange(newSortOrder);
              setShowDropdown(false);
            }}
            style={{ 
              fontWeight: sortOrder.field === 'size' ? 'bold' : 'normal',
              background: sortOrder.field === 'size' ? '#f0f7ff' : 'transparent'
            }}
          >
            <span>📊</span>
            按大小{sortOrder.field === 'size' ? (sortOrder.direction === SortDirectionEnum.ASC ? ' ↑' : ' ↓') : ''}
          </button>
          <button 
            className={styles.dropdownItem}
            onClick={() => {
              const newSortOrder: FileSortInterface = {
                field: 'createdAt',
                direction: sortOrder.field === 'createdAt' && sortOrder.direction === SortDirectionEnum.ASC ? SortDirectionEnum.DESC : SortDirectionEnum.ASC
              };
              onSortChange(newSortOrder);
              setShowDropdown(false);
            }}
            style={{ 
              fontWeight: sortOrder.field === 'createdAt' ? 'bold' : 'normal',
              background: sortOrder.field === 'createdAt' ? '#f0f7ff' : 'transparent'
            }}
          >
            <span>🕒</span>
            按时间{sortOrder.field === 'createdAt' ? (sortOrder.direction === SortDirectionEnum.ASC ? ' ↑' : ' ↓') : ''}
          </button>
        </div>
      )}
    </div>
  );
};

export default SortDropdown; 