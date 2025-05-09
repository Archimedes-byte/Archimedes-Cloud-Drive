import React from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Upload, FolderUp, ChevronDown } from 'lucide-react';
import { BaseDropdown } from '@/app/components/common/dropdown';
import commonStyles from '@/app/components/common/dropdown/dropdown.module.css';
import menuBarStyles from '@/app/components/features/file-management/action-bar/menu-bar/MenuBar.module.css';

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
  // 处理上传文件点击
  const handleUploadClick = () => {
    if (onUploadClick) {
      onUploadClick();
    } else {
      setIsUploadModalOpen(true);
    }
  };

  // 处理上传文件夹点击
  const handleFolderUploadClick = () => {
    if (onFolderUploadClick) {
      onFolderUploadClick();
    } else {
      setIsFolderUploadModalOpen(true);
    }
  };

  // 自定义触发按钮，使用菜单栏通用样式
  const trigger = (
    <button className={menuBarStyles.triggerButton}>
      <UploadOutlined style={{ color: 'white' }} />
      <span style={{ color: 'white' }}>上传</span> 
      <ChevronDown size={14} style={{ color: 'white' }} />
    </button>
  );

  // 下拉菜单内容
  const dropdownContent = (
    <>
      <div 
        className={commonStyles.dropdownItem}
        onClick={handleUploadClick}
      >
        <Upload size={16} style={{ color: 'white' }} />
        <span style={{ color: 'white' }}>上传文件</span>
      </div>
      <div 
        className={commonStyles.dropdownItem}
        onClick={handleFolderUploadClick}
      >
        <FolderUp size={16} style={{ color: 'white' }} />
        <span style={{ color: 'white' }}>上传文件夹</span>
      </div>
    </>
  );

  return (
    <BaseDropdown
      trigger={trigger}
      placement="bottom-left"
      usePortal={false}
      menuWidth={160}
      dropdownMenuClassName="uploadDropdownMenu"
    >
      {dropdownContent}
    </BaseDropdown>
  );
};

export default UploadDropdown; 