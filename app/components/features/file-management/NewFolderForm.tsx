/**
 * @deprecated 此组件已迁移到新的组件架构中。
 * 请使用 @/app/components/features/file-management/folderManagement/NewFolderForm 组件。
 */

import React, { useRef, useState, useEffect } from 'react';
import { Folder, AlertCircle } from 'lucide-react';
import styles from '../styles/shared.module.css';

interface NewFolderFormProps {
  folderName: string;
  setFolderName: (name: string) => void;
  folderTags: string[];
  setFolderTags: (tags: string[]) => void;
  onCreateFolder: () => void;
  onCancel: () => void;
}

const NewFolderForm: React.FC<NewFolderFormProps> = ({
  folderName,
  setFolderName,
  folderTags,
  setFolderTags,
  onCreateFolder,
  onCancel
}) => {
  const [newTag, setNewTag] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 检查文件夹名称是否有效
  useEffect(() => {
    const trimmedName = folderName.trim();
    
    if (trimmedName === '') {
      setNameError(null); // 空名称不显示错误，但创建按钮会处理
      return;
    }

    // 检查特殊字符
    const invalidChars = /[\/\\:*?"<>|]/;
    if (invalidChars.test(trimmedName)) {
      setNameError('文件夹名称不能包含下列字符: / \\ : * ? " < > |');
      return;
    }

    setNameError(null);
  }, [folderName]);

  // 处理回车键创建文件夹
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !nameError && folderName.trim()) {
      onCreateFolder();
    }
  };

  return (
    <div className={`${styles.newFolderRow} p-4 border border-gray-200 rounded-lg bg-white shadow-sm mb-4`}>
      <div className={`${styles.newFolderForm} flex flex-col space-y-4`}>
        <div className={`flex items-center`}>
          <Folder className="w-6 h-6 text-blue-500 flex-shrink-0 mr-3" />
          <div className={`${styles.newFolderNameContainer} flex-grow relative`}>
            <input
              type="text"
              ref={inputRef}
              className={`${styles.newFolderInput} h-10 px-3 rounded-md border ${nameError ? 'border-red-500' : 'border-gray-300'} w-full text-base`}
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="新文件夹名称"
              autoFocus
              onKeyDown={handleKeyDown}
            />
            {nameError && (
              <div className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                <span>{nameError}</span>
              </div>
            )}
            {!nameError && (
              <div className="text-gray-500 text-xs mt-1">
                相同目录下不能存在同名文件夹
              </div>
            )}
          </div>
        </div>
        
        <div className={`${styles.newFolderTagsContainer} ml-9`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">添加标签</label>
          <div className={`${styles.tagsWrapper} h-10 flex items-center flex-wrap gap-2 border border-gray-300 rounded-md px-3 py-1 overflow-y-auto`}>
            {folderTags.map((tag, index) => (
              <div key={index} className={`${styles.tagItem} h-7 flex items-center bg-blue-100 text-blue-800 px-2 rounded-md`}>
                <span className="text-sm">{tag}</span>
                <button
                  className={`${styles.removeTagButton} ml-1 text-blue-600 hover:text-blue-800 w-5 h-5 flex items-center justify-center rounded-full hover:bg-blue-200`}
                  onClick={() => {
                    const updatedTags = [...folderTags];
                    updatedTags.splice(index, 1);
                    setFolderTags(updatedTags);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <input
              type="text"
              className={`${styles.tagInput} flex-grow h-7 border-0 outline-none text-sm bg-transparent`}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTag.trim()) {
                  setFolderTags([...folderTags, newTag.trim()]);
                  setNewTag('');
                  e.preventDefault();
                }
              }}
              placeholder="添加标签..."
            />
          </div>
        </div>
        
        <div className={`${styles.newFolderActions} flex items-center gap-3 ml-9`}>
          <button 
            className={`${styles.confirmButton} h-10 px-4 ${nameError || !folderName.trim() ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md flex items-center justify-center`}
            onClick={onCreateFolder}
            disabled={!!nameError || !folderName.trim()}
          >
            创建
          </button>
          <button 
            className={`${styles.cancelButton} h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md flex items-center justify-center border border-gray-300`}
            onClick={onCancel}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewFolderForm; 