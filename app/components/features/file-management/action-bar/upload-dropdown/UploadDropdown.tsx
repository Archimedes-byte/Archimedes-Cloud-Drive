import React from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Upload, FolderUp, ChevronDown } from 'lucide-react';
import { BaseDropdown } from '../shared/BaseDropdown';
import sharedStyles from '../shared/shared-dropdown.module.css';

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

  // 自定义触发按钮
  const trigger = (
    <button className={`${sharedStyles.triggerButton} text-white`}>
      <UploadOutlined className="text-white" />
      上传 <ChevronDown size={14} className="text-white" />
    </button>
  );

  // 下拉菜单内容
  const dropdownContent = (
    <>
      <div 
        className={sharedStyles.dropdownItem}
        onClick={handleUploadClick}
      >
        <Upload size={16} />
        上传文件
      </div>
      <div 
        className={sharedStyles.dropdownItem}
        onClick={handleFolderUploadClick}
      >
        <FolderUp size={16} />
        上传文件夹
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