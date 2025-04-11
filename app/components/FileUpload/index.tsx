'use client';

import React, { useState, useRef } from 'react';
import { Progress } from '../ui/progress';
import { FileInfo } from '@/app/types';

interface FileUploadProps {
  onUploadComplete: (file: FileInfo) => void;
  folderId?: string;
  accept?: string;
  multiple?: boolean;
}

export function FileUpload({ 
  onUploadComplete, 
  folderId,
  accept,
  multiple = false
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/files', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(Math.round(percentComplete));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onUploadComplete(response);
          setProgress(100);
        } else {
          let errorMessage = '上传失败';
          try {
            const error = JSON.parse(xhr.responseText);
            errorMessage = error.message || error.error || errorMessage;
          } catch (e) {
            // 解析错误时使用默认错误信息
          }
          setError(errorMessage);
        }
      };

      xhr.onerror = () => {
        setError('网络错误，请检查您的连接并重试');
      };

      xhr.send(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancelUpload = () => {
    // 在此可添加取消上传逻辑
    setUploading(false);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          accept={accept}
          multiple={multiple}
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
          <button 
            onClick={handleCancelUpload}
            className="mt-2 text-xs text-red-600 hover:text-red-800"
          >
            取消上传
          </button>
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