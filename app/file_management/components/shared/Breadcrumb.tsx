import React from 'react';
import { Home, ChevronRight } from 'lucide-react';
import styles from '../../styles/shared.module.css';

export interface FolderPath {
  id: string;
  name: string;
}

interface BreadcrumbProps {
  folderPath: FolderPath[];
  onNavigate: (folderId: string | null) => void;
}

export function Breadcrumb({ folderPath, onNavigate }: BreadcrumbProps) {
  return (
    <div className={styles.breadcrumb}>
      <div className={styles.breadcrumbItem}>
        <button
          className={styles.breadcrumbLink}
          onClick={() => onNavigate(null)}
        >
          <Home size={16} className={styles.breadcrumbIcon} />
          根目录
        </button>
      </div>
      
      {folderPath.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <span className={styles.breadcrumbSeparator}>
            <ChevronRight size={14} />
          </span>
          <div className={styles.breadcrumbItem}>
            <button
              className={styles.breadcrumbLink}
              onClick={() => onNavigate(folder.id)}
            >
              {folder.name}
            </button>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
} 