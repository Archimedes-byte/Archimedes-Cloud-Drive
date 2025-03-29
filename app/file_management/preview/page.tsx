'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './styles.css';
import AudioVisualizer from '@/app/components/AudioVisualizer';

interface FilePreviewProps {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  createdAt: string;
  tag?: string | null;
  source?: string | null;
}

interface FileInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  path: string;
  data: string | null;
}

export default function FilePreview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fileInfo, setFileInfo] = useState<FilePreviewProps | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchFileInfo = useCallback(async () => {
    const fileId = searchParams.get('id');
    if (!fileId) {
      console.error('文件ID不存在');
      setError('文件ID不存在');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('开始获取文件信息:', { fileId });
      const response = await fetch(`/api/files/${fileId}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('文件信息响应状态:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      console.log('获取到的文件信息:', data);

      if (!response.ok) {
        throw new Error(data.error || '获取文件信息失败');
      }

      // 构建文件URL
      const fileUrl = `/api/files/${fileId}/content`;
      console.log('构建的文件URL:', fileUrl);

      setFileInfo({
        ...data,
        url: fileUrl
      });

    } catch (error) {
      console.error('预览文件错误:', error);
      setError(error instanceof Error ? error.message : '获取文件信息失败');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchFileInfo();
  }, [fetchFileInfo]);

  useEffect(() => {
    if (audioRef.current && fileInfo?.data) {
      audioRef.current.src = fileInfo.data;
    }
  }, [fileInfo?.data]);

  const handleBack = () => {
    router.back();
  };

  const handleFileError = useCallback((type: string, error: any) => {
    console.error(`${type}加载失败:`, error);
    setError(`${type}加载失败，请检查文件是否存在或格式是否正确`);
  }, []);

  const renderPreview = () => {
    if (!fileInfo) return null;

    const { type, url, name } = fileInfo;
    console.log('渲染预览:', { type, url, name });

    // 图片预览
    if (type.startsWith('image/')) {
      return (
        <div className="image-preview">
          <img 
            src={url} 
            alt={name} 
            className="preview-content"
            onError={(e) => handleFileError('图片', e)}
          />
        </div>
      );
    }

    // 视频预览
    if (type.startsWith('video/')) {
      return (
        <div className="video-preview">
          <video 
            controls 
            className="preview-content"
            onError={(e) => handleFileError('视频', e)}
          >
            <source src={url} type={type} />
            您的浏览器不支持视频播放
          </video>
        </div>
      );
    }

    // 音频预览
    if (type.startsWith('audio/')) {
      console.log('准备渲染音频预览:', {
        type,
        url,
        name,
        size: fileInfo.size
      });

      return (
        <div className="audio-preview">
          <div className="audio-player">
            <audio 
              ref={audioRef}
              controls 
              className="audio-element"
              onLoadStart={() => console.log('音频开始加载')}
              onLoadedMetadata={(e) => console.log('音频元数据加载完成:', {
                duration: e.currentTarget.duration,
                readyState: e.currentTarget.readyState
              })}
              onCanPlay={() => console.log('音频可以开始播放')}
              onError={(e) => {
                const error = e.currentTarget.error;
                console.error('音频加载错误:', {
                  code: error?.code,
                  message: error?.message,
                  type: error?.name
                });
                handleFileError('音频', error);
              }}
            >
              <source 
                src={url} 
                type={type} 
                onError={(e) => console.error('音频源加载错误:', e)}
              />
              您的浏览器不支持音频播放
            </audio>
            <p className="audio-title">{name}</p>
          </div>
          <div className="visualizer-container">
            <AudioVisualizer audioElement={audioRef.current} />
          </div>
        </div>
      );
    }

    // PDF预览
    if (type === 'application/pdf') {
      return (
        <div className="pdf-preview">
          <iframe
            src={url}
            className="preview-content"
            title={name}
            onError={(e) => handleFileError('PDF', e)}
          />
        </div>
      );
    }

    // Word文档预览
    if (type === 'application/msword' || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // 使用Microsoft Office Online Viewer
      const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + url)}`;
      
      return (
        <div className="doc-preview">
          <iframe
            src={viewerUrl}
            className="preview-content"
            title={name}
            onError={(e) => handleFileError('Word文档', e)}
          />
        </div>
      );
    }

    // 文本文件预览
    if (type.startsWith('text/') || type === 'application/json') {
      return (
        <div className="text-preview">
          <iframe
            src={url}
            className="preview-content"
            title={name}
            onError={(e) => handleFileError('文本', e)}
          />
        </div>
      );
    }

    // 不支持的文件类型
    return (
      <div className="preview-fallback">
        <div className="fallback-icon">📄</div>
        <h3 className="fallback-title">{name}</h3>
        <p className="fallback-message">该文件类型暂不支持预览</p>
        <p className="fallback-type">文件类型: {type}</p>
        <a 
          href={url} 
          download={name}
          className="download-button"
          onClick={(e) => {
            e.preventDefault();
            window.open(url, '_blank');
          }}
        >
          下载文件
        </a>
      </div>
    );
  };

  return (
    <div className="preview-container">
      <div className="preview-header">
        <button onClick={handleBack} className="back-button">
          <span className="back-icon">←</span>
          返回
        </button>
        <h1 className="preview-title">{fileInfo?.name || '文件预览'}</h1>
        {fileInfo && (
          <div className="file-info">
            <span className="file-size">
              大小: {(fileInfo.size / 1024).toFixed(2)} KB
            </span>
            <span className="file-date">
              上传时间: {new Date(fileInfo.createdAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>
      
      <div className="preview-main">
        {loading ? (
          <div className="preview-loading">
            <div className="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        ) : error ? (
          <div className="preview-error">
            <div className="error-icon">❌</div>
            <p>{error}</p>
            <button 
              onClick={fetchFileInfo}
              className="retry-button"
            >
              重试
            </button>
          </div>
        ) : (
          renderPreview()
        )}
      </div>
    </div>
  );
} 