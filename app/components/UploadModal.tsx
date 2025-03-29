'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal, message } from 'antd';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  currentFolderId?: string | null;
  withTags?: boolean;
  isFolderUpload?: boolean;
}

interface ExtendedFile extends Omit<File, 'webkitRelativePath'> {
  webkitRelativePath: string;
  folderName?: string;
}

interface FileTreeNode {
  name: string;
  type: 'file' | 'folder';
  size: number;
  children?: FileTreeNode[];
  file?: ExtendedFile;
}

interface HTMLInputElementWithDirectory extends HTMLInputElement {
  webkitdirectory: boolean;
  directory: boolean;
}

// 构建文件树节点
function createFileTreeNode(name: string, type: 'file' | 'folder', size: number = 0, file?: ExtendedFile): FileTreeNode {
  return {
    name,
    type,
    size,
    children: type === 'folder' ? [] : undefined,
    file
  };
}

// 更新文件夹大小
function updateFolderSize(node: FileTreeNode, fileSize: number) {
  let currentNode = node;
  while (currentNode) {
    currentNode.size += fileSize;
    currentNode = currentNode.children?.find(child => 
      child.type === 'folder'
    ) as FileTreeNode;
  }
}

// 构建文件树结构
function buildFileTree(files: ExtendedFile[], rootName: string): FileTreeNode {
  const root = createFileTreeNode(rootName, 'folder');
  
  files.forEach(file => {
    const paths = file.webkitRelativePath.split('/');
    let currentNode = root;
    
    for (let i = 1; i < paths.length; i++) {
      const pathPart = paths[i];
      const isFile = i === paths.length - 1;

      if (isFile) {
        const fileNode = createFileTreeNode(pathPart, 'file', file.size, file);
        currentNode.children?.push(fileNode);
        updateFolderSize(currentNode, file.size);
      } else {
        let folderNode = currentNode.children?.find(
          child => child.name === pathPart && child.type === 'folder'
        );
        
        if (!folderNode) {
          folderNode = createFileTreeNode(pathPart, 'folder');
          currentNode.children?.push(folderNode);
        }
        currentNode = folderNode;
      }
    }
  });

  return root;
}

// 处理文件选择
function processSelectedFiles(files: File[], isFolderUpload: boolean): ExtendedFile[] {
  const firstFile = files[0] as ExtendedFile;
  const folderName = isFolderUpload ? firstFile.webkitRelativePath.split('/')[0] : '';
  
  return files.map(file => {
    const newFile = new File([file], file.name, { type: file.type }) as ExtendedFile;
    Object.defineProperty(newFile, 'webkitRelativePath', {
      value: isFolderUpload ? (file as ExtendedFile).webkitRelativePath : file.name,
      writable: true
    });
    Object.defineProperty(newFile, 'folderName', {
      value: folderName,
      writable: true
    });
    return newFile;
  });
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  currentFolderId = null,
  withTags = true,
  isFolderUpload = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<ExtendedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [folderName, setFolderName] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeNode | null>(null);
  const fileInputRef = useRef<HTMLInputElementWithDirectory>(null);

  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.webkitdirectory = isFolderUpload;
      fileInputRef.current.directory = isFolderUpload;
    }
  }, [isFolderUpload]);

  // 重置所有状态
  const resetState = () => {
    setFiles([]);
    setIsDragging(false);
    setTags([]);
    setTagInput('');
    setFolderName(null);
    setFileTree(null);
  };

  // 监听 isOpen 变化，当弹窗关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const processedFiles = processSelectedFiles(droppedFiles, isFolderUpload);
      setFiles(processedFiles);
      setFolderName(processedFiles[0].folderName || null);
      
      if (isFolderUpload) {
        setFileTree(buildFileTree(processedFiles, processedFiles[0].folderName || '根目录'));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const processedFiles = processSelectedFiles(selectedFiles, isFolderUpload);
      setFiles(processedFiles);
      setFolderName(processedFiles[0].folderName || null);
      
      if (isFolderUpload) {
        setFileTree(buildFileTree(processedFiles, processedFiles[0].folderName || '根目录'));
      }
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 递归渲染文件树组件
  const renderFileTree = (node: FileTreeNode, level: number = 0) => {
    return (
      <div key={node.name} style={{ marginLeft: `${level * 20}px` }}>
        <div className="file-item">
          <div className="file-info">
            <span className="file-type-icon">
              {node.type === 'folder' ? '📁' : 
               node.file?.type.startsWith('image/') ? '🖼️' :
               node.file?.type.includes('pdf') ? '📄' :
               node.file?.type.includes('word') ? '📝' :
               '📄'}
            </span>
            <div>
              <p className="file-name">{node.name}</p>
              <p className="file-size">
                {(node.size / 1024 / 1024).toFixed(2)} MB
                {node.type === 'folder' && ` (${node.children?.length || 0} 个文件)`}
              </p>
            </div>
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="file-children">
            {node.children.map(child => renderFileTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleUpload = async () => {
    if (!files.length) return;

    try {
      setIsUploading(true);

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('isFolderUpload', String(isFolderUpload));
        formData.append('relativePath', file.webkitRelativePath);
        if (folderName) {
          formData.append('folderName', folderName);
        }
        if (currentFolderId) {
          formData.append('parentId', currentFolderId);
        }
        if (tags.length > 0) {
          formData.append('tags', tags.join(','));
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '上传失败');
        }
      }

      message.success('上传成功');
      onUploadSuccess();
      handleClose();
    } catch (error) {
      console.error('上传错误:', error);
      message.error(error instanceof Error ? error.message : '上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title={isFolderUpload ? '上传文件夹' : '上传文件'}
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
    >
      {withTags && (
        <div className="tags-input-container">
          <div className="tags-list">
            {tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
                <button onClick={() => removeTag(tag)} className="remove-tag">×</button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="输入标签后按回车添加..."
            className="tag-input"
          />
        </div>
      )}

      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple={!isFolderUpload}
          style={{ display: 'none' }}
          {...(isFolderUpload ? { webkitdirectory: '', directory: '' } : {})}
        />
        <div className="upload-icon">
          <span>{isFolderUpload ? '📁' : '📄'}</span>
        </div>
        <p className="upload-text">
          拖拽{isFolderUpload ? '文件夹' : '文件'}到此处，或者
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="upload-button"
          >
            点击选择{isFolderUpload ? '文件夹' : '文件'}
          </button>
        </p>
        <p className="upload-hint">
          {isFolderUpload ? '支持选择整个文件夹上传' : '支持任意类型文件'}
        </p>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h3 className="file-list-title">待上传{isFolderUpload ? '文件夹' : '文件'}</h3>
          <div className="file-items">
            {isFolderUpload && fileTree ? (
              renderFileTree(fileTree)
            ) : (
              files.map((file) => (
                <div key={file.name} className="file-item">
                  <div className="file-info">
                    <span className="file-type-icon">
                      {file.type.startsWith('image/') ? '🖼️' :
                       file.type.includes('pdf') ? '📄' :
                       file.type.includes('word') ? '📝' :
                       '📄'}
                    </span>
                    <div>
                      <p className="file-name">{file.name}</p>
                      <p className="file-size">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="file-status">
                    <button
                      onClick={() => removeFile(file.name)}
                      className="remove-button"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="modal-footer">
        <button
          onClick={handleClose}
          className="modal-button cancel"
        >
          取消
        </button>
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className={`modal-button upload ${files.length === 0 || isUploading ? 'disabled' : ''}`}
        >
          {isUploading ? '上传中...' : '上传'}
        </button>
      </div>

      <style jsx>{`
        .tags-input-container {
          margin-bottom: 16px;
          padding: 8px;
          border: 1px solid #e8e8e8;
          border-radius: 4px;
          background: #fff;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          background: #f0f0f0;
          border-radius: 16px;
          font-size: 14px;
          color: #333;
          gap: 4px;
        }

        .remove-tag {
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          font-size: 14px;
        }

        .remove-tag:hover {
          background: #e0e0e0;
          color: #ff4d4f;
        }

        .tag-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          font-size: 14px;
          outline: none;
          transition: all 0.3s;
        }

        .tag-input:focus {
          border-color: #1890ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }

        .tag-input::placeholder {
          color: #bfbfbf;
        }

        .file-children {
          margin-left: 20px;
        }

        .file-item {
          display: flex;
          align-items: center;
          padding: 8px;
          border-bottom: 1px solid #eee;
          background: #fff;
        }

        .file-item:hover {
          background: #f5f5f5;
        }

        .file-type-icon {
          margin-right: 8px;
          font-size: 20px;
        }

        .file-info {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .file-name {
          margin: 0;
          font-size: 14px;
          color: #333;
        }

        .file-size {
          margin: 0;
          font-size: 12px;
          color: #999;
        }
      `}</style>
    </Modal>
  );
};

export default UploadModal; 