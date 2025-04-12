'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Button, Space, Upload, Spin, Input, message } from 'antd';
import { UploadOutlined, FolderOutlined } from '@ant-design/icons';
import { UploadModalProps, FileTreeNode as IFileTreeNode, FileInfo, mapFileResponseToFileInfo } from '@/app/types';
import { formatFileSize } from '@/app/lib/utils/file';
import { API_PATHS } from '@/app/lib/api/paths';
import { fileApi } from '@/app/lib/api/file-api';

interface ExtendedFile extends Omit<File, 'webkitRelativePath'> {
  webkitRelativePath: string;
  folderName?: string;
}

interface HTMLInputElementWithDirectory extends HTMLInputElement {
  webkitdirectory: boolean;
  directory: boolean;
}

// 构建文件树节点
function createFileTreeNode(name: string, type: 'file' | 'folder', size: number = 0, file?: ExtendedFile): IFileTreeNode {
  return {
    name,
    type,
    size,
    children: type === 'folder' ? [] : undefined,
    file: file as any
  };
}

// 更新文件夹大小
function updateFolderSize(node: IFileTreeNode, fileSize: number) {
  let currentNode = node;
  while (currentNode) {
    currentNode.size += fileSize;
    currentNode = currentNode.children?.find(child => 
      child.type === 'folder'
    ) as IFileTreeNode;
  }
}

// 构建文件树结构
function buildFileTree(files: ExtendedFile[], rootName: string): IFileTreeNode {
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
  currentFolderId,
  isFolderUpload,
  withTags
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<ExtendedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [folderName, setFolderName] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<IFileTreeNode | null>(null);
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
  const renderFileTree = (node: IFileTreeNode, level: number = 0) => {
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

  // 上传处理函数
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // 处理文件夹上传
      if (isFolderUpload && folderName) {
        // 创建根文件夹
        const folder = await fileApi.createFolder(folderName, currentFolderId);
        
        // 上传文件到新创建的文件夹
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folderId', folder.id);
          
          if (tags.length > 0) {
            formData.append('tags', JSON.stringify(tags));
          }
          
          await fetch(API_PATHS.STORAGE.FILES.UPLOAD, {
            method: 'POST',
            body: formData,
          });
        }
        
        message.success(`文件夹 "${folderName}" 上传成功`);
        handleClose();
        onUploadSuccess();
      } else {
        // 处理文件上传
        const formData = new FormData();
        
        for (const file of files) {
          formData.append('file', file);
        }
        
        if (currentFolderId) {
          formData.append('folderId', currentFolderId);
        }
        
        if (tags.length > 0) {
          formData.append('tags', JSON.stringify(tags));
        }
        
        const response = await fetch(API_PATHS.STORAGE.FILES.UPLOAD, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('文件上传失败');
        }
        
        message.success(`${files.length} 个文件上传成功`);
        handleClose();
        onUploadSuccess();
      }
    } catch (error) {
      console.error('上传失败:', error);
      message.error('上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title={isFolderUpload ? "上传文件夹" : "上传文件"}
      open={isOpen}
      onCancel={handleClose}
      onOk={handleUpload}
      okText="上传"
      cancelText="取消"
      confirmLoading={isUploading}
    >
      {/* 渲染上传UI */}
    </Modal>
  );
};

export default UploadModal; 