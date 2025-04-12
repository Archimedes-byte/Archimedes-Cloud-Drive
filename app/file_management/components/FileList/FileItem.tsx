import React from 'react';
import { File, Folder, FileText, Image, Video, Music, Archive, Code, File as FileIcon } from 'lucide-react';
import { ExtendedFile } from '@/app/types';
import { formatFileSize } from '@/app/utils/file/format';
import { formatDate } from '@/app/utils/file/format';
import { getFileIcon, getFileType } from '@/app/utils/file/type';
import styles from '@/app/shared/themes/components/fileList.module.css';

interface FileItemProps {
  file: ExtendedFile;
  onClick: (file: ExtendedFile) => void;
  onSelect?: (fileId: string, selected: boolean) => void;
  isSelected?: boolean;
}

const FileItem: React.FC<FileItemProps> = ({ file, onClick, onSelect, isSelected = false }) => {
  // 处理文件名，确保不包含路径前缀
  const displayName = file.name.includes('/') ? file.name.split('/').pop() || file.name : file.name;
  const extension = displayName.split('.').pop()?.toLowerCase() || '';
  
  // 获取正确的图标
  const getIconComponent = () => {
    if (file.isFolder) return Folder;
    
    const iconType = getFileIcon(file.type || '', extension, !!file.isFolder);
    
    switch (iconType) {
      case 'folder': return Folder;
      case 'file-text': return FileText;
      case 'image': return Image;
      case 'video': return Video;
      case 'music': return Music;
      case 'archive': return Archive;
      case 'code': return Code;
      default: return FileIcon;
    }
  };
  
  const IconComponent = getIconComponent();
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(file.id, e.target.checked);
    }
  };
  
  const handleFileItemClick = () => {
    onClick(file);
  };

  return (
    <div 
      className={`${styles.fileItem} ${isSelected ? styles.selected : ''}`}
      onClick={handleFileItemClick}
    >
      {onSelect && (
        <div className={styles.checkboxContainer} onClick={(e) => e.stopPropagation()}>
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={handleCheckboxChange}
            className={styles.checkbox}
          />
        </div>
      )}
      
      <div className={styles.fileIcon}>
        <IconComponent size={20} />
      </div>
      
      <div className={styles.fileDetails}>
        <div className={styles.fileName} title={displayName}>{displayName}</div>
        <div className={styles.fileInfo}>
          {!file.isFolder && (
            <>
              <span className={styles.fileType}>
                {file.type === 'document' ? '文档' : getFileType(file.type || null, extension)}
              </span>
              <span className={styles.fileDivider}>•</span>
              <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
              <span className={styles.fileDivider}>•</span>
            </>
          )}
          <span className={styles.fileDate}>{formatDate(file.updatedAt.toString())}</span>
        </div>
      </div>
    </div>
  );
};

export default FileItem; 