'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Modal, Button, Tag, Input, Progress, message } from 'antd';
import { InboxOutlined, TagOutlined } from '@ant-design/icons';
import { UploadModalProps } from '@/app/types/domains/file-management';
import { API_PATHS } from '@/app/lib/api/paths';
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
 * 格式化文件大小，自动选择合适的单位
 * @param bytes 文件大小（字节）
 * @returns 格式化后的文件大小字符串，带单位
 */
const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null) return '0 B';
  if (bytes === 0) return '0 B';
  
  // 定义单位数组，支持中英文单位
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  // 计算应该使用的单位索引
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  // 防止索引超出范围
  const unitIndex = Math.min(i, units.length - 1);
  
  // 如果文件小于1KB，使用B为单位不需要小数点
  if (unitIndex === 0) {
    return `${bytes} ${units[unitIndex]}`;
  }
  
  // 计算转换后的值
  const size = bytes / Math.pow(1024, unitIndex);
  
  // 根据大小决定保留的小数位数
  // 如果大于100，只保留1位小数；否则保留2位小数
  const decimalPlaces = size >= 100 ? 1 : 2;
  
  return `${size.toFixed(decimalPlaces)} ${units[unitIndex]}`;
};

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedBytes, setUploadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  
  // 引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<any>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

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
    setUploadError(null);
    setUploadedBytes(0);
    setTotalBytes(0);
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
    if (fileList.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }
    
    // 取消之前的上传请求（如果存在）
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    // 创建FormData对象用于上传
    const formData = new FormData();
    
    // 添加所有文件到表单
    fileList.forEach(fileItem => {
      if (fileItem.originFileObj) {
        formData.append('file', fileItem.originFileObj);
        
        // 处理文件夹上传的路径信息
        if (isFolderUpload && fileItem.webkitRelativePath) {
          const index = fileList.indexOf(fileItem);
          formData.append(`paths_${index}`, fileItem.webkitRelativePath);
        }
      }
    });
    
    // 添加目标文件夹ID（如果有）
    if (currentFolderId) {
      formData.append('folderId', currentFolderId);
    }
    
    // 添加是否为文件夹上传标志
    if (isFolderUpload) {
      formData.append('isFolderUpload', 'true');
    }
    
    // 添加标签
    formData.append('tags', JSON.stringify(tagList));
    
    // 添加时间戳以避免缓存问题
    formData.append('_t', Date.now().toString());
    
    // 创建请求
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    
    // 监听上传进度
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(progress);
        setUploadedBytes(event.loaded);
        setTotalBytes(event.total);
      }
    });
    
    // 设置请求完成处理
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          
          if (response.success) {
            setUploadProgress(100);
            message.success(`成功上传 ${fileList.length} 个文件`);
            
            // 延迟关闭模态框并调用成功回调
            setTimeout(() => {
              handleUploadSuccess(response.data);
              handleClose();
              xhrRef.current = null; // 清理XHR引用
            }, 500);
          } else {
            setUploadError(response.error || '上传失败');
            message.error(response.error || '上传失败');
            setUploading(false);
            // 上传失败时也要清理XHR引用
            xhrRef.current = null;
          }
        } catch (error) {
          const errorMessage = '解析服务器响应失败';
          setUploadError(errorMessage);
          message.error(errorMessage);
          setUploading(false);
          xhrRef.current = null; // 清理XHR引用
        }
      } else {
        const errorMessage = `上传失败，服务器返回状态码: ${xhr.status}`;
        setUploadError(errorMessage);
        message.error(errorMessage);
        setUploading(false);
        xhrRef.current = null; // 清理XHR引用
      }
    };
    
    // 处理请求错误
    xhr.onerror = () => {
      const errorMessage = '网络错误，上传失败';
      setUploadError(errorMessage);
      message.error(errorMessage);
      setUploading(false);
      xhrRef.current = null; // 清理XHR引用
    };
    
    // 处理请求取消
    xhr.onabort = () => {
      const errorMessage = '上传已取消';
      setUploadError(errorMessage);
      message.info(errorMessage);
      setUploading(false);
      xhrRef.current = null; // 清理XHR引用
    };
    
    // 设置超时处理
    xhr.timeout = 300000; // 5分钟超时
    xhr.ontimeout = () => {
      const errorMessage = '上传超时，请检查网络或文件大小';
      setUploadError(errorMessage);
      message.error(errorMessage);
      setUploading(false);
      xhrRef.current = null; // 清理XHR引用
    };
    
    // 发送请求
    xhr.open('POST', API_PATHS.STORAGE.FILES.UPLOAD);
    xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    xhr.setRequestHeader('Pragma', 'no-cache');
    xhr.setRequestHeader('Expires', '0');
    xhr.send(formData);
  }, [fileList, handleUploadSuccess, handleClose, currentFolderId, tagList, isFolderUpload]);

  // 添加取消上传功能
  const cancelUpload = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    message.info('已取消上传');
    setUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setUploadedBytes(0);
    setTotalBytes(0);
  }, []);

  // isOpen状态变化时重置组件状态
  useEffect(() => {
    if (isOpen) {
      // 模态框打开时，确保状态被重置
      resetState();
      
      // 如果存在旧的XMLHttpRequest，取消它
      if (xhrRef.current) {
        xhrRef.current.abort();
        xhrRef.current = null;
      }
    }
  }, [isOpen, resetState]);

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
            <Progress percent={uploadProgress} status={uploadError ? "exception" : "active"} />
            <div style={{ marginTop: '8px' }}>
              {uploadError ? 
                <span style={{ color: 'red' }}>{uploadError}</span> : 
                <>
                  <div>{`上传中...${uploadProgress}%`}</div>
                  {totalBytes > 0 && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {`${formatFileSize(uploadedBytes)} / ${formatFileSize(totalBytes)}`}
                    </div>
                  )}
                </>
              }
            </div>
            
            {/* 添加错误状态下的操作按钮 */}
            {uploadError && (
              <div style={{ marginTop: '16px' }}>
                <Button 
                  type="primary" 
                  onClick={handleUpload}
                  style={{ marginRight: '10px' }}
                >
                  重试上传
                </Button>
                <Button onClick={handleClose}>
                  关闭
                </Button>
              </div>
            )}
            
            {/* 添加上传中的取消按钮 */}
            {!uploadError && uploadProgress < 100 && (
              <div style={{ marginTop: '16px' }}>
                <Button 
                  danger
                  onClick={cancelUpload}
                >
                  取消上传
                </Button>
              </div>
            )}
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
                      ({formatFileSize(file.size)})
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