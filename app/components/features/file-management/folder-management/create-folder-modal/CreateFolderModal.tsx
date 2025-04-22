'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Folder, Tag as TagIcon, X, Plus, Info, AlertCircle } from 'lucide-react';
import styles from '@/app/components/features/file-management/shared/modal-styles.module.css';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, tags: string[]) => Promise<void>;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder
}) => {
  const [folderName, setFolderName] = useState('');
  const [folderTags, setFolderTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // 弹窗打开时重置表单
  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setFolderTags([]);
      setTagInput('');
      setIsSubmitting(false);
      setError(null);
      
      // 延迟聚焦到输入框
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);
  
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
  
  // 处理提交
  const handleSubmit = async () => {
    if (!folderName.trim()) {
      setError('文件夹名称不能为空');
      return;
    }
    
    // 检查特殊字符
    const invalidChars = /[\/\\:*?"<>|]/;
    if (invalidChars.test(folderName)) {
      setError('文件夹名称不能包含下列字符: / \\ : * ? " < > |');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      await onCreateFolder(folderName.trim(), folderTags);
      onClose();
    } catch (error) {
      // 错误处理已在onCreateFolder回调中处理
      setIsSubmitting(false);
    }
  };
  
  // 处理标签输入和添加
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };
  
  const handleInputConfirm = () => {
    if (tagInput && !folderTags.includes(tagInput)) {
      setFolderTags([...folderTags, tagInput]);
    }
    setTagInput('');
    
    // 添加后自动聚焦回标签输入框
    setTimeout(() => {
      if (tagInputRef.current) {
        tagInputRef.current.focus();
      }
    }, 0);
  };
  
  const handleTagClose = (removedTag: string) => {
    const newTags = folderTags.filter(tag => tag !== removedTag);
    setFolderTags(newTags);
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputConfirm();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className={styles['modal-overlay']}>
      <div ref={modalRef} className={styles['modal-content']}>
        <div className={styles['modal-header']}>
          <h3 className={styles['modal-title']}>
            <span className={styles['icon-wrapper']}>
              <Folder size={18} />
            </span>
            新建文件夹
          </h3>
          <button 
            className={styles['modal-close']} 
            onClick={onClose}
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className={styles['modal-body']}>
          <div className={styles['form-group']}>
            <label className={styles['form-label']}>
              文件夹名称
            </label>
            <input
              ref={inputRef}
              type="text"
              className={styles['form-input']}
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="输入文件夹名称"
              autoFocus
            />
            {error && (
              <div style={{ 
                color: '#ff4d4f', 
                fontSize: '13px', 
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </div>
          
          <div className={styles['form-group']}>
            <label className={styles['form-label']}>
              标签
            </label>
            <div className={styles['tags-container']}>
              {folderTags.map((tag, index) => (
                <div key={`${tag}-${index}`} className={styles.tag}>
                  <span>{tag}</span>
                  <button
                    type="button"
                    className={styles['tag-remove']}
                    onClick={() => handleTagClose(tag)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className={styles['tag-input-container']}>
              <TagIcon size={16} className={styles['tag-icon']} />
              <input
                ref={tagInputRef}
                type="text"
                className={styles['tag-input']}
                value={tagInput}
                onChange={handleInputChange}
                onKeyDown={handleTagInputKeyDown}
                placeholder="输入标签，按回车添加"
              />
              <button
                type="button"
                className={styles['tag-add-button']}
                onClick={handleInputConfirm}
                disabled={!tagInput.trim()}
              >
                <Plus size={16} />
              </button>
            </div>
            <div className={styles['form-hint']}>
              相同目录下不能存在同名文件夹
            </div>
          </div>
        </div>
        
        <div className={styles['modal-footer']}>
          <button 
            type="button" 
            className={`${styles['modal-button']} ${styles['cancel-button']}`}
            onClick={onClose}
          >
            取消
          </button>
          <button 
            type="button"
            className={`${styles['modal-button']} ${styles['confirm-button']}`}
            onClick={handleSubmit}
            disabled={isSubmitting || !folderName.trim()}
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateFolderModal; 