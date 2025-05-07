'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Modal, Button, Tag, Input, Progress, message } from 'antd';
import { InboxOutlined, TagOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { UploadModalProps } from '@/app/types/domains/file-management';
import { API_PATHS } from '@/app/lib/api/paths';
import styles from './uploadModal.module.css';
import { formatFileSize } from '@/app/utils/file';

// 定义扩展的文件类型
interface ExtendedUploadFile {
  uid: string;
  name: string;
  size?: number;
  type?: string;
  webkitRelativePath?: string;
  originFileObj?: File;
  originalName?: string;
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedBytes, setUploadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  // 添加文件名编辑状态
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null);
  const [editingFileName, setEditingFileName] = useState<string>('');
  // 用于显示同名文件冲突警告
  const [nameConflictError, setNameConflictError] = useState<string | null>(null);
  
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
    setUploading(false);
    setEditingFileIndex(null);
    setEditingFileName('');
    setNameConflictError(null);
  }, []);

  // 关闭模态窗
  const handleClose = useCallback(() => {
    // 重置文件列表和标签
    resetState();
    
    // 确保上传状态被重置
    setUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setUploadedBytes(0);
    setTotalBytes(0);
    
    // 清理XHR引用
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    
    // 清空文件输入框的值
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
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
    // 如果正在编辑的文件被移除，重置编辑状态
    if (editingFileIndex === index) {
      setEditingFileIndex(null);
      setEditingFileName('');
    }
  }, [editingFileIndex]);

  // 开始编辑文件名
  const startEditFileName = useCallback((index: number) => {
    const file = fileList[index];
    setEditingFileIndex(index);
    setEditingFileName(file.name);
  }, [fileList]);

  // 保存编辑后的文件名
  const saveEditFileName = useCallback(() => {
    if (editingFileIndex === null || !editingFileName.trim()) return;
    
    setFileList(prev => 
      prev.map((file, index) => {
        if (index === editingFileIndex) {
          // 保持文件原始名称供上传时使用
          const originalName = file.originalName || file.name;
          
          // 获取原始文件扩展名
          const getFileExtension = (fileName: string) => {
            const lastDotIndex = fileName.lastIndexOf('.');
            return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
          };
          
          // 获取原始扩展名（带点）
          const originalExt = getFileExtension(originalName);
          
          // 确保新文件名保留原始扩展名
          let finalName = editingFileName.trim();
          
          // 如果不是文件夹，并且新名称不包含原始扩展名，则自动添加
          if (originalExt && !finalName.endsWith(originalExt)) {
            finalName = `${finalName}${originalExt}`;
          }
          
          return { 
            ...file, 
            name: finalName,
            originalName: originalName
          };
        }
        return file;
      })
    );
    
    setEditingFileIndex(null);
    setEditingFileName('');
    setNameConflictError(null);
  }, [editingFileIndex, editingFileName]);

  // 取消编辑文件名
  const cancelEditFileName = useCallback(() => {
    setEditingFileIndex(null);
    setEditingFileName('');
  }, []);

  // 处理编辑文件名输入变化
  const handleEditFileNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingFileName(e.target.value);
  }, []);

  // 处理编辑文件名键盘事件
  const handleEditFileNameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditFileName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditFileName();
    }
  }, [saveEditFileName, cancelEditFileName]);

  // 检查服务器是否存在同名文件
  const checkFileNameConflicts = useCallback(async () => {
    if (fileList.length === 0) return false;
    
    try {
      // 构造请求体，包含当前目录ID和文件名列表
      const requestBody = {
        folderId: currentFolderId || 'root',
        fileNames: fileList.map(file => file.name)
      };
      
      // 发送请求检查文件名冲突
      const response = await fetch(API_PATHS.STORAGE.FILES.CHECK_NAME_CONFLICTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error('检查文件名冲突失败');
      }
      
      const result = await response.json();
      
      // 如果存在冲突的文件名
      if (result.conflicts && result.conflicts.length > 0) {
        const conflictNames = result.conflicts.join(', ');
        setNameConflictError(`发现同名文件/文件夹: ${conflictNames}，请修改名称后重试`);
        
        // 将有冲突的文件设置为编辑状态
        const firstConflictIndex = fileList.findIndex(file => 
          result.conflicts.includes(file.name)
        );
        
        if (firstConflictIndex !== -1) {
          startEditFileName(firstConflictIndex);
        }
        
        return true; // 存在冲突
      }
      
      setNameConflictError(null);
      return false; // 不存在冲突
      
    } catch (error) {
      console.error('检查文件名冲突出错:', error);
      // 出错时不阻止上传，但记录错误
      return false;
    }
  }, [fileList, currentFolderId, startEditFileName]);

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
  const handleUpload = useCallback(async () => {
    if (fileList.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }
    
    // 先检查文件名冲突
    const hasConflicts = await checkFileNameConflicts();
    
    // 如果有冲突，停止上传过程
    if (hasConflicts) {
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
    
    // 添加所有文件到表单，包括可能被重命名的文件
    fileList.forEach((fileItem, index) => {
      if (fileItem.originFileObj) {
        const file = fileItem.originFileObj;
        
        // 如果文件名被修改，使用新的文件名
        if (fileItem.originalName && fileItem.originalName !== fileItem.name) {
          // 创建新的File对象或Blob以保留原始文件但更改名称
          // 由于File构造函数在某些浏览器可能不完全支持，这里使用Blob
          
          // 获取原始文件扩展名和新文件扩展名
          const getFileExtension = (fileName: string) => {
            const lastDotIndex = fileName.lastIndexOf('.');
            return lastDotIndex !== -1 ? fileName.substring(lastDotIndex).toLowerCase() : '';
          };
          
          // 获取原始扩展名（带点）
          const originalExt = getFileExtension(fileItem.originalName);
          const newExt = getFileExtension(fileItem.name);
          
          // 确保新文件名保留原始扩展名
          let finalName = fileItem.name;
          if (originalExt && !finalName.endsWith(originalExt)) {
            // 如果新文件名不包含原始扩展名，则添加
            finalName = `${finalName}${originalExt}`;
          }
          
          // 判断文件类型是否应该保持不变
          const shouldPreserveType = true; // 始终保留原始文件类型
          
          // 使用原始文件的类型创建Blob
          const blob = new Blob([file], { 
            type: file.type  // 始终使用原始文件类型
          });
          
          formData.append('file', blob, finalName);
          
          // 添加原始文件名和新文件名的映射
          formData.append(`originalName_${index}`, fileItem.originalName);
          formData.append(`newName_${index}`, finalName);
          
          // 确保传递原始文件类型，防止服务器端无法正确识别
          formData.append(`fileType_${index}`, file.type);
        } else {
          // 使用原始文件
          formData.append('file', file);
        }
        
        // 处理文件夹上传的路径信息
        if (isFolderUpload && fileItem.webkitRelativePath) {
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
    
    // 清空文件输入框的值，允许再次选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      
      // 确保上传状态被重置为初始值
      setUploading(false);
      setUploadProgress(0);
      setUploadError(null);
      setUploadedBytes(0);
      setTotalBytes(0);
      
      // 确保文件输入框值被清空
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
      footer={[
        <Button key="cancel" onClick={handleClose}>
          取消
        </Button>,
        <Button 
          key="upload" 
          type="primary" 
          onClick={handleUpload} 
          disabled={fileList.length === 0 || uploading}
          loading={uploading}
          style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
        >
          {uploading ? '上传中...' : '开始上传'}
        </Button>
      ]}
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
                  style={{ marginRight: '10px', backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
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
              onClick={triggerFileInput}
              style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6', color: 'white' }}
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
              
              {/* 添加名称冲突警告 */}
              {nameConflictError && (
                <div style={{ 
                  color: 'red',
                  padding: '8px 12px',
                  background: '#fff2f0',
                  border: '1px solid #ffccc7',
                  borderRadius: '4px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>警告:</div>
                  <div>{nameConflictError}</div>
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    请点击文件名进行编辑，修改后再尝试上传
                  </div>
                </div>
              )}
              
              <ul style={{ maxHeight: '150px', overflowY: 'auto', padding: '0 0 0 20px' }}>
                {fileList.map((file, index) => (
                  <li key={file.uid} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    {editingFileIndex === index ? (
                      // 编辑文件名模式
                      <div style={{ display: 'flex', flexGrow: 1, marginRight: '10px' }}>
                        <Input
                          value={editingFileName}
                          onChange={handleEditFileNameChange}
                          onKeyDown={handleEditFileNameKeyDown}
                          autoFocus
                          style={{ marginRight: '8px' }}
                        />
                        <Button 
                          type="primary" 
                          size="small" 
                          onClick={saveEditFileName}
                          style={{ marginRight: '4px', backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
                        >
                          保存
                        </Button>
                        <Button 
                          size="small" 
                          onClick={cancelEditFileName}
                        >
                          取消
                        </Button>
                      </div>
                    ) : (
                      // 显示文件名模式
                      <span 
                        style={{ 
                          cursor: 'pointer',
                          flex: 1,
                          padding: '4px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={() => startEditFileName(index)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span style={{ fontWeight: file.originalName ? 'bold' : 'normal' }}>
                          {file.name}
                          {file.originalName && file.originalName !== file.name && (
                            <span style={{ fontSize: '12px', color: '#1890ff', marginLeft: '8px' }}>
                              (已重命名)
                            </span>
                          )}
                        </span>
                        {isFolderUpload && file.webkitRelativePath && (
                          <span style={{ fontSize: '12px', color: '#8c8c8c', marginLeft: '4px', display: 'block' }}>
                            (路径: {file.webkitRelativePath.split('/').slice(0, -1).join('/')})
                          </span>
                        )}
                        <span style={{ fontSize: '12px', color: '#999', display: 'block' }}>
                          ({file.size ? formatFileSize(file.size) : '未知大小'})
                        </span>
                      </span>
                    )}
                    
                    <div>
                      <Button 
                        type="text" 
                        onClick={() => startEditFileName(index)}
                        style={{ padding: '0 8px', marginRight: '4px' }}
                      >
                        <EditOutlined style={{ fontSize: '16px' }} />
                      </Button>
                      <Button 
                        type="text" 
                        danger 
                        onClick={() => removeFile(index)}
                        style={{ padding: '0 8px' }}
                      >
                        <DeleteOutlined style={{ fontSize: '16px' }} />
                      </Button>
                    </div>
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