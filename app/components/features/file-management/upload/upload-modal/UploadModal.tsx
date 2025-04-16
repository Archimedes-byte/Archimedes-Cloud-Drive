'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Modal, Button, Tag, Input, Progress } from 'antd';
import { InboxOutlined, TagOutlined } from '@ant-design/icons';
import { UploadModalProps } from '@/app/types/domains/file-management';
import styles from './uploadModal.module.css';

// 定义扩展的文件类型
interface ExtendedUploadFile {
  uid: string;
  name: string;
  size?: number;
  type?: string;
  webkitRelativePath?: string;
  originFileObj?: File;
}

/**
 * 文件上传模态框组件
 * 支持文件或文件夹上传，提供拖放和选择界面
 */
const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  onSuccess, // 兼容旧版API
  currentFolderId,
  isFolderUpload = false,
  withTags = true
}) => {
  // 状态管理
  const [fileList, setFileList] = useState<ExtendedUploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // 引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<any>(null);

  // 处理上传成功
  const handleUploadSuccess = useCallback((data?: any) => {
    if (onUploadSuccess) {
      onUploadSuccess(data);
    } else if (onSuccess) {
      onSuccess(data);
    }
  }, [onUploadSuccess, onSuccess]);

  // 重置所有状态
  const resetState = useCallback(() => {
    setFileList([]);
    setTagList([]);
    setTagInput('');
    setUploadProgress(0);
  }, []);

  // 关闭模态窗
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // 触发文件选择
  const triggerFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // 处理文件变更
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFileList = files.map(file => ({
      uid: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      webkitRelativePath: (file as any).webkitRelativePath,
      originFileObj: file
    }));

    setFileList(prev => [...prev, ...newFileList]);
  }, []);

  // 移除文件
  const removeFile = useCallback((index: number) => {
    setFileList(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 处理标签输入变更
  const handleTagInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  }, []);

  // 处理标签输入键盘事件
  const handleTagInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
      setTagInput('');
    }
  }, [tagInput]);

  // 添加标签
  const addTag = useCallback((tag: string) => {
    if (!tag || tagList.includes(tag)) return;
    
    setTagList(prev => [...prev, tag]);
    
    // 添加标签后聚焦回输入框
    if (tagInputRef.current) {
      setTimeout(() => {
        tagInputRef.current.focus();
      }, 0);
    }
  }, [tagList]);

  // 移除标签
  const removeTag = useCallback((tagToRemove: string) => {
    setTagList(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);
  
  // 处理上传
  const handleUpload = useCallback(() => {
    if (fileList.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    // 模拟上传进度
    const timer = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + Math.floor(Math.random() * 10);
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setUploading(false);
            handleUploadSuccess(fileList);
            handleClose();
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  }, [fileList, handleUploadSuccess, handleClose]);

  return (
    <Modal
      title={isFolderUpload ? '上传文件夹' : '上传文件'}
      open={isOpen}
      onCancel={handleClose}
      onOk={handleUpload}
      okText="上传"
      cancelText="取消"
      confirmLoading={uploading}
      width={600}
    >
      {uploading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ margin: '16px 0' }}>
            <Progress percent={uploadProgress} status="active" />
            <div style={{ marginTop: '8px' }}>{`上传中...${uploadProgress}%`}</div>
          </div>
        </div>
      ) : (
        <div>
          {/* 拖放上传区域 */}
          <div 
            className={styles.dropzone || ''}
            onClick={triggerFileInput}
            style={{ 
              border: '2px dashed #d9d9d9',
              borderRadius: '4px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            <p><InboxOutlined style={{ fontSize: '48px', color: '#40a9ff' }} /></p>
            <p style={{ marginTop: '8px', fontWeight: 'bold' }}>
              点击或拖拽{isFolderUpload ? '文件夹' : '文件'}到此区域上传
            </p>
            <p style={{ color: '#888' }}>
              {isFolderUpload
                ? '支持上传整个文件夹及其内部文件，保留文件夹结构'
                : '支持单个或批量上传文件，最大支持同时选择50个文件'}
            </p>
            <Button 
              type="primary" 
              onClick={(e) => { 
                e.stopPropagation(); 
                triggerFileInput(); 
              }}
            >
              选择{isFolderUpload ? '文件夹' : '文件'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={!isFolderUpload}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              {...(isFolderUpload ? { webkitdirectory: "", directory: "" } : {})}
            />
          </div>
          
          {/* 文件列表区域 */}
          {fileList.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                已选择 {fileList.length} 个文件:
              </div>
              <ul style={{ maxHeight: '150px', overflowY: 'auto', padding: '0 0 0 20px' }}>
                {fileList.map((file, index) => (
                  <li key={file.uid} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>
                      {file.name} 
                      {isFolderUpload && file.webkitRelativePath && (
                        <span style={{ fontSize: '12px', color: '#8c8c8c', marginLeft: '4px' }}>
                          (路径: {file.webkitRelativePath.split('/').slice(0, -1).join('/')})
                        </span>
                      )}
                      ({((file.size || 0) / 1024).toFixed(2)} KB)
                    </span>
                    <Button 
                      type="text" 
                      danger 
                      onClick={() => removeFile(index)}
                      style={{ padding: '0 4px' }}
                    >
                      删除
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 标签输入区域 */}
          {withTags && (
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>添加标签:</span>
                <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  (输入标签后按回车添加)
                </span>
              </div>
              
              <div className={styles.tagsInputWrapper}>
                <Input
                  ref={tagInputRef}
                  placeholder="输入标签后按回车添加"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  prefix={<TagOutlined style={{ color: '#bfbfbf' }} />}
                  suffix={
                    <span style={{ color: '#bfbfbf', fontSize: '12px' }}>
                      按回车添加
                    </span>
                  }
                />
              </div>
              
              <div className={styles.tagsContainer}>
                {tagList.length > 0 ? (
                  <div className={styles.tagsList}>
                    {tagList.map((tag, index) => (
                      <Tag
                        key={index}
                        closable
                        onClose={() => removeTag(tag)}
                        className={styles.interactiveTag}
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyTagsHint}>
                    添加一些标签来帮助管理您的文件
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 上传说明区域 */}
          <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '13px', color: '#555' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              {isFolderUpload ? '文件夹上传说明:' : '文件上传说明:'}
            </div>
            <ul style={{ paddingLeft: '16px', margin: '0' }}>
              {isFolderUpload ? (
                <>
                  <li>支持上传整个文件夹及其子文件夹结构</li>
                  <li>保留完整的文件夹层次结构</li>
                  <li>目前仅Chrome、Edge等现代浏览器支持文件夹选择</li>
                  <li>如果您的浏览器不支持文件夹选择，请选择单个文件模式</li>
                </>
              ) : (
                <>
                  <li>支持批量上传多个文件</li>
                  <li>支持常见的文件格式（图片、文档、视频等）</li>
                  <li>每个文件大小限制为50MB</li>
                  <li>一次最多可选择50个文件</li>
                </>
              )}
              <li>您可以为上传的文件添加标签，以便更好地组织和查找</li>
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default UploadModal; 