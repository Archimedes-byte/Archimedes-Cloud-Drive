import React, { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';
import { CloseOutlined } from '@ant-design/icons';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  initialName: string;
  fileType: 'file' | 'folder';
}

const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  onRename,
  initialName,
  fileType
}) => {
  const [newName, setNewName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNewName(initialName);
  }, [initialName]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // 自动聚焦输入框并选中文件名（不包括扩展名）
      inputRef.current.focus();
      
      const extension = fileType === 'file' ? initialName.lastIndexOf('.') : -1;
      if (extension !== -1) {
        inputRef.current.setSelectionRange(0, extension);
      } else {
        inputRef.current.select();
      }
    }
  }, [isOpen, initialName, fileType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newName !== initialName) {
      onRename(newName);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles['modal-overlay']}>
      <div ref={modalRef} className={`${styles['modal-content']} ${styles['rename-modal']}`}>
        <div className={styles['modal-header']}>
          <h3 className={styles['modal-title']}>
            {fileType === 'folder' ? '重命名文件夹' : '重命名文件'}
          </h3>
          <button 
            className={styles['modal-close']} 
            onClick={onClose}
            aria-label="关闭"
          >
            <CloseOutlined />
          </button>
        </div>
        
        <form className={styles['rename-form']} onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className={styles['rename-input']}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="输入新名称"
            autoFocus
          />

          <div className={styles['modal-footer']}>
            <button 
              type="button" 
              className={`${styles['modal-button']} ${styles.cancel}`}
              onClick={onClose}
            >
              取消
            </button>
            <button 
              type="submit" 
              className={`${styles['modal-button']} ${styles.confirm}`}
              disabled={!newName.trim() || newName === initialName}
            >
              确认
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal; 