'use client';

import React, { useState, useRef } from 'react';
import { Progress } from '../ui/progress';
import { API_PATHS } from '@/app/lib/api/paths';

interface FileUploadProps {
  onUploadComplete: (file: any) => void;
  folderId?: string;
}

export function FileUpload({ onUploadComplete, folderId }: FileUploadProps) {
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
      xhr.open('POST', API_PATHS.STORAGE.FILES.UPLOAD, true);

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
          const error = JSON.parse(xhr.responseText);
          throw new Error(error.message || '上传失败');
        }
      };

      xhr.onerror = () => {
        throw new Error('网络错误');
      };

      xhr.send(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
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