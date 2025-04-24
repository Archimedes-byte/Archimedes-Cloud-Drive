'use client';

import React, { useState, useRef } from 'react';
import { Progress } from '@/app/components/ui/atoms/progress';
import { mapFileEntityToFileInfo } from '@/app/types';
import { uploadFile } from '@/app/lib/storage/service/uploadService';

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    // 只处理第一个文件 (或在多文件模式下可以处理所有文件)
    const file = files[0];

    try {
      // 使用上传服务模块
      uploadFile(file, {
        folderId,
        tags,
        onProgress: (progress) => {
          setProgress(progress);
        },
        onSuccess: (response) => {
          // 使用类型映射函数转换API响应为FileInfo
          const fileInfo = mapFileEntityToFileInfo ? mapFileEntityToFileInfo(response) : response;
          onUploadComplete(fileInfo);
          setProgress(100);
          setUploading(false);
          
          // 清空文件输入
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        onError: (error) => {
          setError(error.message);
          setUploading(false);
          
          // 清空文件输入
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      });
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