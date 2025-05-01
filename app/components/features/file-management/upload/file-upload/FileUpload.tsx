'use client';

import React, { useState, useRef } from 'react';
import { Progress } from '@/app/components/ui/atoms/progress';
import { FileUploadService } from '@/app/services/storage';
import { mapFileEntityToFileInfo } from '@/app/types';

interface FileUploadProps {
  onUploadComplete: (file?: any) => void;
  folderId?: string;
  tags?: string[];
  multiple?: boolean;
  allowFolders?: boolean;
  className?: string;
}

export function FileUpload({ 
  onUploadComplete, 
  folderId,
  tags,
  multiple = false, 
  allowFolders = false,
  className = ''
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 创建上传服务实例
  const uploadService = new FileUploadService();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    // 只处理第一个文件 (或在多文件模式下可以处理所有文件)
    const file = files[0];

    try {
      // 创建进度回调
      const onProgressUpdate = (progress: number) => {
        setProgress(progress);
      };
      
      // 构建自定义上传处理
      const uploadHandler = () => {
        return new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          
          formData.append('file', file);
          if (folderId) {
            formData.append('folderId', folderId);
          }
          if (tags && tags.length > 0) {
            formData.append('tags', JSON.stringify(tags));
          }
          
          xhr.open('POST', '/api/storage/files/upload', true);
          
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percentage = Math.round((e.loaded / e.total) * 100);
              onProgressUpdate(percentage);
            }
          };
          
          xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                const fileInfo = response.data;
                onUploadComplete(fileInfo);
                setProgress(100);
                resolve();
              } catch (err) {
                reject(new Error('解析响应失败'));
              }
            } else {
              reject(new Error(`上传失败: ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => reject(new Error('网络错误'));
          xhr.send(formData);
        });
      };
      
      await uploadHandler();
      setUploading(false);
      
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
      setUploading(false);
      
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`w-full max-w-md ${className}`}>
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          multiple={multiple}
          // 如果允许文件夹上传，添加相关属性
          {...(allowFolders ? { webkitdirectory: "", directory: "" } : {})}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-white
            hover:file:bg-primary/80
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {uploading && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">上传进度</span>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

export default FileUpload; 