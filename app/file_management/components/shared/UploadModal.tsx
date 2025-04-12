import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { InboxOutlined, CloseCircleOutlined, TagOutlined, CloseOutlined } from '@ant-design/icons';
import { Modal, Upload, Input, message, Button, Tag } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import type { UploadProps } from 'antd';
import type { InputRef } from 'antd/es/input';
import { FileInfo, FileResponse } from '@/app/types';
import styles from '../../styles/shared.module.css';
import { useSession } from 'next-auth/react';
import { API_PATHS } from '@/app/lib/api/paths';

const { Dragger } = Upload;

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (files?: FileInfo[]) => void;
  isFolderUpload?: boolean;
  currentFolderId?: string | null;
}

// 扩展UploadFile类型，添加webkitRelativePath属性
interface ExtendedUploadFile extends UploadFile<any> {
  webkitRelativePath?: string;
}

export function UploadModal({
  isOpen,
  onClose,
  onSuccess,
  isFolderUpload = false,
  currentFolderId
}: UploadModalProps) {
  const [fileList, setFileList] = useState<ExtendedUploadFile[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<InputRef>(null);
  const { data: session } = useSession();

  useEffect(() => {
    // 当模态框打开时检查登录状态
    if (isOpen && !session) {
      message.error('请先登录后再上传文件');
      onClose();
    }
  }, [isOpen, session, onClose]);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: ExtendedUploadFile[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      newFiles.push({
        uid: `file-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        originFileObj: file as any,
        webkitRelativePath: file.webkitRelativePath, // 添加相对路径
      });
    }

    setFileList(prev => [...prev, ...newFiles]);
    
    // 清空input以允许再次选择相同的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理标签输入
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  // 处理标签输入的回车事件
  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  // 添加标签
  const addTag = (tag: string) => {
    if (!tag) return;
    
    // 检查标签是否已存在
    if (!tagList.includes(tag)) {
      setTagList(prev => [...prev, tag]);
    }
    
    // 清空输入框
    setTagInput('');
    
    // 聚焦回输入框，方便继续输入
    if (tagInputRef.current) {
      setTimeout(() => {
        tagInputRef.current?.focus();
      }, 0);
    }
  };

  // 删除标签
  const removeTag = (tagToRemove: string) => {
    setTagList(tagList.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      
      // 添加所有文件到FormData
      let filesAdded = 0;
      fileList.forEach((file, index) => {
        const rawFile = file.originFileObj;
        if (rawFile instanceof File) {
          // 使用'file'字段名，与后端对应
          formData.append('file', rawFile);
          
          // 如果是文件夹上传，添加相对路径信息
          if (isFolderUpload && file.webkitRelativePath) {
            // 使用数字索引作为键，确保后端可以正确解析
            formData.append(`paths_${index}`, file.webkitRelativePath);
            console.log(`文件 ${index}: ${file.name} - 路径: ${file.webkitRelativePath}`);
          }
          
          filesAdded++;
          console.log(`添加文件 ${index+1}: ${file.name}, 大小: ${file.size} 字节`);
        } else {
          console.warn(`无法获取文件 ${index+1}: ${file.name} 的原始File对象`);
        }
      });
      
      if (filesAdded === 0) {
        throw new Error('无法处理上传文件，请重新选择文件');
      }
      
      // 添加标志表明这是文件夹上传
      if (isFolderUpload) {
        formData.append('isFolderUpload', 'true');
        console.log('文件夹上传模式已启用');
      }
      
      // 将标签数组转换为逗号分隔的字符串
      if (tagList.length > 0) {
        formData.append('tags', tagList.join(','));
        console.log('添加标签:', tagList.join(','));
      }

      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
        console.log('当前文件夹ID:', currentFolderId);
      }

      console.log(`准备上传 ${filesAdded} 个文件...`);
      
      // 显示上传开始消息
      const uploadKey = `upload-${Date.now()}`;
      message.loading({ content: '正在上传文件...', key: uploadKey, duration: 0 });

      // 使用fetch发送请求
      const response = await fetch(API_PATHS.STORAGE.FILES.UPLOAD, {
        method: 'POST',
        body: formData,
      });

      // 获取响应
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // 如果不是JSON响应，尝试获取文本
        const text = await response.text();
        console.error('服务器返回了非JSON响应:', text);
        throw new Error('服务器返回了无效的响应格式');
      }
      
      // 检查响应状态
      if (!response.ok) {
        console.error('上传响应错误:', data);
        
        // 显示错误消息
        message.error({ 
          content: `上传失败: ${data.details || data.error || '服务器错误'}`, 
          key: uploadKey,
          duration: 5 
        });
        
        throw new Error(data.details || data.error || '上传失败');
      }

      // 上传成功处理
      console.log('上传成功:', data);
      message.success({ content: '上传成功', key: uploadKey, duration: 3 });
      
      // 关闭模态框并通知父组件
      handleClose();
      if (typeof onSuccess === 'function') {
        onSuccess(data.files || (data.file ? [data.file] : undefined));
      } else {
        console.warn('onSuccess不是一个函数，无法通知上传成功');
      }
    } catch (error) {
      console.error('上传过程中出错:', error);
      message.error(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFileList([]);
    setTagInput('');
    setTagList([]);
    onClose();
  };
  
  // 直接使用原生文件输入
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const removeFile = (index: number) => {
    setFileList(prev => prev.filter((_, i) => i !== index));
  };

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
      <div className={styles.uploadContainer || ''}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          multiple={true}
          {...(isFolderUpload ? { webkitdirectory: '', directory: '', mozdirectory: '', msdirectory: '' } : {})}
        />
        
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
          <Button type="primary" onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}>
            选择{isFolderUpload ? '文件夹' : '文件'}
          </Button>
        </div>
        
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
    </Modal>
  );
} 