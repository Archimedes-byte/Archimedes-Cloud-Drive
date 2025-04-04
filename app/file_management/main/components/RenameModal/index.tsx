import React, { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';
import { CloseOutlined, TagOutlined, PlusOutlined } from '@ant-design/icons';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string, tags?: string[]) => void;
  initialName: string;
  initialTags?: string[];
  fileType: 'file' | 'folder';
}

const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  onRename,
  initialName,
  initialTags = [],
  fileType
}) => {
  const [newName, setNewName] = useState(initialName);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNewName(initialName);
    setTags(initialTags);
  }, [initialName, initialTags]);

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
    if (newName.trim() && (newName !== initialName || JSON.stringify(tags) !== JSON.stringify(initialTags))) {
      onRename(newName, tags);
    }
    onClose();
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    // 避免添加重复标签
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    
    setTagInput('');
    
    // 添加后自动聚焦回标签输入框
    setTimeout(() => {
      if (tagInputRef.current) {
        tagInputRef.current.focus();
      }
    }, 0);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
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
          <div className={styles['form-group']}>
            <label className={styles['form-label']}>名称</label>
            <input
              ref={inputRef}
              type="text"
              className={styles['rename-input']}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="输入新名称"
              autoFocus
            />
          </div>
          
          <div className={styles['form-group']}>
            <label className={styles['form-label']}>标签</label>
            <div className={styles['tags-container']}>
              {tags.map((tag, index) => (
                <div key={index} className={styles['tag']}>
                  <span>{tag}</span>
                  <button 
                    type="button"
                    className={styles['tag-remove']}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <div className={styles['tag-input-container']}>
              <TagOutlined className={styles['tag-icon']} />
              <input
                ref={tagInputRef}
                type="text"
                className={styles['tag-input']}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="输入标签，按回车添加"
              />
              <button
                type="button"
                className={styles['tag-add-button']}
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                <PlusOutlined />
              </button>
            </div>
          </div>

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
              disabled={!newName.trim() || (newName === initialName && JSON.stringify(tags) === JSON.stringify(initialTags))}
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