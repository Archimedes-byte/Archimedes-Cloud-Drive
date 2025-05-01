import React, { useCallback } from 'react';
import { BaseDropdown } from '../shared';
import sharedStyles from '../shared/shared-dropdown.module.css';
import { FileSortInterface, SortDirectionEnum, SortField } from '@/app/types';
import { SwapOutlined } from '@ant-design/icons';

interface SortDropdownProps {
  sortOrder: FileSortInterface;
  onSortChange: (order: FileSortInterface) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  sortOrder,
  onSortChange
}) => {
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

  // 自定义触发按钮
  const trigger = (
    <button 
      className={`${sharedStyles.triggerButton} text-white`}
    >
      <SwapOutlined className="text-white" />
      排序: {getSortFieldText()} {sortOrder.direction === SortDirectionEnum.ASC ? '↑' : '↓'}
    </button>
  );

  // 下拉菜单内容
  const dropdownContent = (
    <>
      <div 
        className={sharedStyles.dropdownItem}
        onClick={() => handleSortClick('name', sortOrder.field === 'name' && sortOrder.direction === SortDirectionEnum.ASC ? SortDirectionEnum.DESC : SortDirectionEnum.ASC)}
        style={{ 
          fontWeight: sortOrder.field === 'name' ? 'bold' : 'normal',
          background: sortOrder.field === 'name' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
        }}
      >
        <span>📝</span>
        按文件名{sortOrder.field === 'name' ? (sortOrder.direction === SortDirectionEnum.ASC ? ' ↑' : ' ↓') : ''}
      </div>
      <div 
        className={sharedStyles.dropdownItem}
        onClick={() => handleSortClick('size', sortOrder.field === 'size' && sortOrder.direction === SortDirectionEnum.ASC ? SortDirectionEnum.DESC : SortDirectionEnum.ASC)}
        style={{ 
          fontWeight: sortOrder.field === 'size' ? 'bold' : 'normal',
          background: sortOrder.field === 'size' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
        }}
      >
        <span>📊</span>
        按大小{sortOrder.field === 'size' ? (sortOrder.direction === SortDirectionEnum.ASC ? ' ↑' : ' ↓') : ''}
      </div>
      <div 
        className={sharedStyles.dropdownItem}
        onClick={() => handleSortClick('createdAt', sortOrder.field === 'createdAt' && sortOrder.direction === SortDirectionEnum.ASC ? SortDirectionEnum.DESC : SortDirectionEnum.ASC)}
        style={{ 
          fontWeight: sortOrder.field === 'createdAt' ? 'bold' : 'normal',
          background: sortOrder.field === 'createdAt' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
        }}
      >
        <span>🕒</span>
        按时间{sortOrder.field === 'createdAt' ? (sortOrder.direction === SortDirectionEnum.ASC ? ' ↑' : ' ↓') : ''}
      </div>
    </>
  );

  return (
    <BaseDropdown
      trigger={trigger}
      placement="bottom-left"
      usePortal={false}
      menuWidth={160}
      dropdownMenuClassName="sortDropdownMenu"
    >
      {dropdownContent}
    </BaseDropdown>
  );
};

export default SortDropdown; 