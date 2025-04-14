'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Space, Tag, Input, message, Progress } from 'antd';
import { UploadOutlined, FolderOutlined } from '@ant-design/icons';
import { UploadModalProps } from '@/app/types/domains/fileManagement';
import { FileTreeNode } from '@/app/types/domains/fileTypes';
import { formatFileSize } from '@/app/lib/utils/file';
import { uploadFile, uploadFolder, processSelectedFiles } from '@/app/lib/upload-service';

// 构建文件树节点
function createFileTreeNode(name: string, type: 'file' | 'folder', size: number = 0, file?: File): FileTreeNode {
  return {
    name,
    type,
    size,
    children: type === 'folder' ? [] : undefined,
    file: file as any
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
function buildFileTree(files: File[], rootName: string): FileTreeNode {
  const root = createFileTreeNode(rootName, 'folder');
  
  files.forEach(file => {
    const paths = (file as any).webkitRelativePath.split('/');
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

/**
 * 文件上传模态框组件
 * 支持文件或文件夹上传，提供拖放和选择界面
 */
const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  currentFolderId,
  isFolderUpload,
  withTags
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [folderName, setFolderName] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 重置所有状态
  const resetState = () => {
    setFiles([]);
    setIsDragging(false);
    setTags([]);
    setTagInput('');
    setFolderName(null);
    setFileTree(null);
    setUploadProgress(0);
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
      const { files: processedFiles, folderName } = processSelectedFiles(droppedFiles, isFolderUpload);
      setFiles(processedFiles);
      setFolderName(folderName);
      
      if (isFolderUpload && folderName) {
        setFileTree(buildFileTree(processedFiles, folderName));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const { files: processedFiles, folderName } = processSelectedFiles(selectedFiles, isFolderUpload);
      setFiles(processedFiles);
      setFolderName(folderName);
      
      if (isFolderUpload && folderName) {
        setFileTree(buildFileTree(processedFiles, folderName));
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
                {formatFileSize(node.size)}
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
    setUploadProgress(0);
    
    try {
      // 处理文件夹上传
      if (isFolderUpload && folderName) {
        await uploadFolder(files, folderName, {
          folderId: currentFolderId || undefined,
          tags,
          onProgress: (progress) => {
            setUploadProgress(progress);
          },
          onSuccess: (response) => {
            message.success(`文件夹 "${folderName}" 上传成功`);
            setIsUploading(false);
            onUploadSuccess();
            handleClose();
          },
          onError: (error) => {
            message.error(`上传失败: ${error.message}`);
            setIsUploading(false);
          }
        });
      } else {
        // 单文件或多文件上传
        let uploadedCount = 0;
        const totalFiles = files.length;
        
        for (const file of files) {
          await uploadFile(file, {
            folderId: currentFolderId || undefined,
            tags,
            onProgress: (fileProgress) => {
              // 计算总体进度：已完成文件 + 当前文件进度
              const totalProgress = Math.round(
                (uploadedCount * 100 + fileProgress) / totalFiles
              );
              setUploadProgress(totalProgress);
            },
            onSuccess: () => {
              uploadedCount++;
              
              // 所有文件上传完成
              if (uploadedCount === totalFiles) {
                message.success(totalFiles > 1 
                  ? `${totalFiles}个文件上传成功` 
                  : '文件上传成功');
                
                setIsUploading(false);
                onUploadSuccess();
                handleClose();
              }
            },
            onError: (error) => {
              message.error(`文件上传失败: ${error.message}`);
              setIsUploading(false);
            }
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败';
      message.error(errorMessage);
      setIsUploading(false);
    }
  };

  return (
    <Modal
      title={isFolderUpload ? '上传文件夹' : '上传文件'}
      open={isOpen}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={isUploading}>
          取消
        </Button>,
        <Button 
          key="upload" 
          type="primary" 
          onClick={handleUpload} 
          disabled={files.length === 0 || isUploading}
          loading={isUploading}
        >
          上传
        </Button>,
      ]}
      width={800}
    >
      {isUploading ? (
        <div className="text-center py-8">
          <div className="my-4">
            <Progress percent={uploadProgress} status="active" />
            <div className="mt-2">{`上传中...${uploadProgress}%`}</div>
          </div>
        </div>
      ) : (
        <div className="upload-content">
          {/* 拖放区域 */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
            }`}
          >
            <div className="upload-icon mb-4">
              {isFolderUpload ? <FolderOutlined style={{ fontSize: 48 }} /> : <UploadOutlined style={{ fontSize: 48 }} />}
            </div>
            <p className="text-lg mb-2">
              {isDragging
                ? isFolderUpload
                  ? '放开以上传文件夹'
                  : '放开以上传文件'
                : isFolderUpload
                ? '拖放文件夹至此处，或'
                : '拖放文件至此处，或'}
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              type="primary"
              icon={isFolderUpload ? <FolderOutlined /> : <UploadOutlined />}
            >
              {isFolderUpload ? '选择文件夹' : '选择文件'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={!isFolderUpload}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              {...(isFolderUpload ? { webkitdirectory: "", directory: "" } : {})}
            />
          </div>

          {/* 标签输入区域 */}
          {withTags && (
            <div className="tags-section mt-6">
              <h4 className="text-base font-medium mb-2">添加标签</h4>
              <div className="tag-input">
                <Input
                  placeholder="输入标签并按Enter添加"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                />
              </div>
              {tags.length > 0 && (
                <div className="tags-list mt-2 flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <Tag
                      key={tag}
                      closable
                      onClose={() => removeTag(tag)}
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 文件列表或文件树 */}
          {files.length > 0 && (
            <div className="file-list mt-6">
              <h4 className="text-base font-medium mb-2">
                {isFolderUpload 
                  ? `文件夹: ${folderName} (${files.length}个文件)` 
                  : `选择的文件 (${files.length})`}
              </h4>
              
              {isFolderUpload && fileTree ? (
                <div className="folder-tree border rounded p-3">
                  {renderFileTree(fileTree)}
                </div>
              ) : (
                <div className="file-items space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.name}
                      className="file-item flex justify-between items-center border rounded p-2"
                    >
                      <div className="file-details flex items-center">
                        <span className="file-icon mr-2">
                          {file.type.startsWith('image/') ? '🖼️' :
                           file.type.includes('pdf') ? '📄' :
                           file.type.includes('word') ? '📝' :
                           '📄'}
                        </span>
                        <div>
                          <div className="file-name font-medium">{file.name}</div>
                          <div className="file-meta text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="text"
                        size="small"
                        danger
                        onClick={() => removeFile(file.name)}
                      >
                        移除
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default UploadModal; 