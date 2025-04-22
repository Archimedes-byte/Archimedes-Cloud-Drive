import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getFileTypeByExtension } from '@/app/utils/file/type';
import { 
  File, X, Download, FileText, Folder,
  Image as ImageIcon, Video, Music, Archive, Code,
  ArrowLeft, Share2
} from 'lucide-react';
import { ExtendedFile, FileInfo } from '@/app/types';
import styles from './FilePreview.module.css';
import { API_PATHS } from '@/app/lib/api/paths';

interface FilePreviewProps {
  file: ExtendedFile | FileInfo | null;
  onClose: () => void;
  onDownload: (file: ExtendedFile | FileInfo) => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onClose, onDownload }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // 保存fetchPreviewUrl的引用以便在重试按钮中使用
  const fetchPreviewUrlRef = useRef<(() => Promise<void>) | null>(null);

  // 判断文件类型的辅助函数
  const isImageType = (type?: string, extension?: string): boolean => {
    if (!type && !extension) return false;
    
    // 检查简单类型和MIME类型
    const isTypeImage = type === 'image' || (type?.startsWith('image/') ?? false);
    
    // 检查扩展名
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
    const hasImageExt = !!extension && imageExtensions.includes(extension.toLowerCase());
    
    return isTypeImage || hasImageExt;
  };
  
  const isVideoType = (type?: string, extension?: string): boolean => {
    if (!type && !extension) return false;
    
    // 检查简单类型和MIME类型
    const isTypeVideo = type === 'video' || (type?.startsWith('video/') ?? false);
    
    // 检查扩展名
    const videoExtensions = ['mp4', 'webm', 'ogv', 'mov', 'avi'];
    const hasVideoExt = !!extension && videoExtensions.includes(extension.toLowerCase());
    
    return isTypeVideo || hasVideoExt;
  };
  
  const isAudioType = (type?: string, extension?: string): boolean => {
    if (!type && !extension) return false;
    
    // 检查简单类型和MIME类型
    const isTypeAudio = type === 'audio' || (type?.startsWith('audio/') ?? false);
    
    // 检查扩展名
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
    const hasAudioExt = !!extension && audioExtensions.includes(extension.toLowerCase());
    
    return isTypeAudio || hasAudioExt;
  };

  const isDocumentType = (type?: string, extension?: string): boolean => {
    if (!type && !extension) return false;
    
    // 检查简单类型和MIME类型
    const isTypeDocument = 
      type === 'document' || 
      type?.startsWith('application/') || 
      type?.startsWith('text/');
    
    // 检查扩展名
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'];
    const hasDocumentExt = !!extension && documentExtensions.includes(extension.toLowerCase());
    
    return isTypeDocument || hasDocumentExt;
  };

  // 判断文件是否可以预览
  const isPreviewableFile = (type?: string, extension?: string): boolean => {
    return isImageType(type, extension) || 
           isVideoType(type, extension) || 
           isAudioType(type, extension) ||
           isPdfFile(type, extension) ||
           isOfficeFile(type, extension);
  };

  // 判断文件是否为PDF
  const isPdfFile = (type?: string, extension?: string): boolean => {
    if (!type && !extension) return false;
    
    // 检查MIME类型
    const isPdfType = type === 'application/pdf' || type?.includes('pdf');
    
    // 检查扩展名
    const hasPdfExt = extension === 'pdf';
    
    return isPdfType || hasPdfExt;
  };
  
  // 判断文件是否为Office文档
  const isOfficeFile = (type?: string, extension?: string): boolean => {
    if (!type && !extension) return false;
    
    // 检查简化类型
    const isDocType = type === 'document';
    
    // 检查MIME类型
    const isOfficeType = 
      type?.includes('msword') || 
      type?.includes('officedocument') ||
      type?.includes('ms-excel') ||
      type?.includes('spreadsheet') ||
      type?.includes('powerpoint') ||
      type?.includes('presentation');
    
    // 检查扩展名
    const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'];
    const hasOfficeExt = !!extension && officeExtensions.includes(extension.toLowerCase());
    
    return isDocType || isOfficeType || hasOfficeExt;
  };

  useEffect(() => {
    if (!file) return;

    // 重置状态
    setLoading(true);
    setError(null);
    setPreviewUrl(null);
    setDebugInfo(null);

    const fetchPreviewUrl = async () => {
      try {
        // 获取文件扩展名
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        
        console.log('尝试获取预览URL，文件信息:', {
          id: file.id,
          name: file.name,
          type: file.type,
          extension: extension,
          apiPath: API_PATHS.STORAGE.FILES.PREVIEW(file.id)
        });

        // 使用isPreviewableFile辅助函数判断文件是否可预览
        if (isPreviewableFile(file.type, extension)) {
          console.log('文件类型支持预览，正在获取预览URL');
          
          // 构建请求URL
          const requestUrl = `${API_PATHS.STORAGE.FILES.PREVIEW(file.id)}?format=json`;
          console.log('预览请求URL:', requestUrl);
          
          // 使用新API并添加format=json参数获取JSON格式的预览URL
          const response = await fetch(requestUrl, {
            // 添加缓存控制，确保不使用缓存数据
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            },
            cache: 'no-store'
          });
          
          // 检查HTTP请求状态
          if (!response.ok) {
            // 保存响应状态用于调试
            const statusInfo = {
              status: response.status,
              statusText: response.statusText,
              url: response.url
            };
            
            setDebugInfo(statusInfo);
            
            // 尝试解析错误消息
            try {
              const errorData = await response.json();
              throw new Error(`预览请求失败: HTTP ${response.status} - ${errorData.error || errorData.message || response.statusText}`);
            } catch (parseError) {
              // 如果无法解析JSON，可能是非JSON响应
              throw new Error(`预览请求失败: HTTP ${response.status} - ${response.statusText}`);
            }
          }
          
          // 解析JSON响应
          const data = await response.json();
          setDebugInfo({ responseStatus: response.status, data });
          
          // 处理嵌套data结构
          // 检查是否有嵌套数据结构 data.data.data
          if (data.data && data.data.success && data.data.data) {
            const fileData = data.data.data;
            if (fileData.success && fileData.url) {
              console.log('获取到预览URL:', fileData.url);
              setPreviewUrl(fileData.url);
            } else {
              throw new Error(fileData.error || '获取预览URL失败');
            }
          } 
          // 检查第一层嵌套 data.data
          else if (data.data && data.data.success && data.data.url) {
            console.log('获取到预览URL:', data.data.url);
            setPreviewUrl(data.data.url);
          }
          // 检查无嵌套的情况
          else if (data.success && data.url) {
            console.log('获取到预览URL:', data.url);
            setPreviewUrl(data.url);
          } else {
            throw new Error(data.error || '获取预览URL失败');
          }
        } else {
          // 对于不支持预览的文件类型，直接显示不支持预览的信息
          console.log('文件类型不支持预览:', file.type, extension);
          setError('此文件类型不支持预览');
        }
      } catch (err) {
        console.error('预览加载失败:', err);
        setError(err instanceof Error ? err.message : '预览加载失败');
        
        // 添加重试按钮
        if (!debugInfo) {
          setDebugInfo({
            errorInfo: err instanceof Error ? err.message : String(err),
            apiPath: API_PATHS.STORAGE.FILES.PREVIEW(file.id)
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPreviewUrlRef.current = fetchPreviewUrl;
    fetchPreviewUrl();
  }, [file]);

  if (!file) return null;

  const fileName = file.name.split('/').pop() || file.name;
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  // 使用辅助函数判断文件类型
  const isImageFile = isImageType(file.type, extension);
  const isVideoFile = isVideoType(file.type, extension);
  const isAudioFile = isAudioType(file.type, extension);
  const isDocumentFile = isDocumentType(file.type, extension);

  // 确定文件图标
  const getFileIconComponent = () => {
    if (file.isFolder) return Folder;
    
    if (isImageFile) return ImageIcon;
    if (isVideoFile) return Video;
    if (isAudioFile) return Music;
    if (isDocumentFile) return FileText;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return Archive;
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'go', 'rb', 'php', 'html', 'css'].includes(extension)) return Code;
    
    return File;
  };

  const IconComponent = getFileIconComponent();

  // 直接从文件路径尝试预览图片
  const tryDirectPreview = () => {
    if (isImageFile && file.path) {
      // 尝试构建一个直接的文件URL
      try {
        // 如果有预览URL就优先使用预览URL
        if (previewUrl) return previewUrl;
        
        // 尝试使用后端路径
        return `/uploads/${file.id}`;
      } catch (e) {
        console.error('构建直接预览URL失败:', e);
        return null;
      }
    }
    return null;
  };

  const directPreviewUrl = tryDirectPreview();

  // 渲染文件预览内容
  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <span className={styles.loadingText}>加载预览中...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.errorContainer}>
          <IconComponent size={48} className={styles.fileIcon} />
          <h3 className={styles.fileName}>{fileName}</h3>
          <p className={styles.errorMessage}>{error}</p>
          
          {/* 添加重试按钮 */}
          <button 
            className={styles.retryButton}
            onClick={() => {
              setLoading(true);
              setError(null);
              setPreviewUrl(null);
              fetchPreviewUrlRef.current?.();
            }}
          >
            重试加载
          </button>
          
          {debugInfo && (
            <details className={styles.debugInfo}>
              <summary>调试信息</summary>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          )}
        </div>
      );
    }

    // 图片预览
    if (isImageFile && (previewUrl || directPreviewUrl)) {
      return (
        <div className={styles.imagePreviewContainer}>
          <img 
            src={previewUrl || directPreviewUrl || ''} 
            alt={fileName}
            className={styles.imagePreview}
            onError={(e) => {
              console.error('图片加载失败:', e);
              setError('图片加载失败');
            }}
          />
        </div>
      );
    }

    // 视频预览
    if (isVideoFile && previewUrl) {
      return (
        <div className={styles.videoPreviewContainer}>
          <video 
            controls 
            className={styles.videoPreview}
            onError={(e) => {
              console.error('视频加载失败:', e);
              setError('视频加载失败');
            }}
          >
            <source src={previewUrl} />
            您的浏览器不支持视频播放
          </video>
        </div>
      );
    }

    // 音频预览
    if (isAudioFile && previewUrl) {
      return (
        <div className={styles.audioPreviewContainer}>
          <IconComponent size={48} className={styles.fileIcon} />
          <h3 className={styles.fileName}>{fileName}</h3>
          <audio 
            controls 
            className={styles.audioPreview}
            onError={(e) => {
              console.error('音频加载失败:', e);
              setError('音频加载失败');
            }}
          >
            <source src={previewUrl} />
            您的浏览器不支持音频播放
          </audio>
        </div>
      );
    }

    // PDF预览（使用iframe）
    if (isPdfFile(file.type, extension) && previewUrl) {
      return (
        <div className={styles.pdfPreviewContainer}>
          <iframe
            src={previewUrl}
            className={styles.pdfPreview}
            title={fileName}
            frameBorder="0"
            onError={(e) => {
              console.error('PDF加载失败:', e);
              setError('PDF加载失败');
            }}
          />
        </div>
      );
    }

    // Office文档预览
    if (isOfficeFile(file.type, extension) && previewUrl) {
      return (
        <div className={styles.officePreviewContainer}>
          <iframe
            src={previewUrl}
            className={styles.officePreview}
            title={fileName}
            frameBorder="0"
            onError={(e) => {
              console.error('文档加载失败:', e);
              setError('文档加载失败');
            }}
          />
        </div>
      );
    }

    // 其他文件类型的通用预览界面
    return (
      <div className={styles.genericPreviewContainer}>
        <IconComponent size={64} className={styles.fileIcon} />
        <h2 className={styles.fileName}>{fileName}</h2>
        <p className={styles.fileInfo}>
          {file.type && <span className={styles.fileType}>{getFileTypeByExtension(extension)}</span>}
          {file.size && <span className={styles.fileSize}>{formatFileSize(file.size)}</span>}
        </p>
        {file.updatedAt && <p className={styles.fileDate}>最后修改: {formatDate(file.updatedAt.toString())}</p>}
        <div className={styles.previewMessage}>
          <p>此文件类型不支持直接预览</p>
        </div>
      </div>
    );
  };

  // 渲染文件信息面板
  const renderFileInfo = () => {
    if (!file) return null;
    
    return (
      <div className={styles.fileInfoPanel}>
        <h3 className={styles.fileInfoTitle}>文件信息</h3>
        <div className={styles.fileInfoContent}>
          <div className={styles.fileInfoItem}>
            <span className={styles.fileInfoLabel}>文件名</span>
            <span className={styles.fileInfoValue}>{fileName}</span>
          </div>
          {file.type && (
            <div className={styles.fileInfoItem}>
              <span className={styles.fileInfoLabel}>类型</span>
              <span className={styles.fileInfoValue}>{getFileTypeByExtension(extension)}</span>
            </div>
          )}
          {file.size && (
            <div className={styles.fileInfoItem}>
              <span className={styles.fileInfoLabel}>大小</span>
              <span className={styles.fileInfoValue}>{formatFileSize(file.size)}</span>
            </div>
          )}
          {file.updatedAt && (
            <div className={styles.fileInfoItem}>
              <span className={styles.fileInfoLabel}>修改时间</span>
              <span className={styles.fileInfoValue}>{formatDate(file.updatedAt.toString())}</span>
            </div>
          )}
          {file.createdAt && (
            <div className={styles.fileInfoItem}>
              <span className={styles.fileInfoLabel}>创建时间</span>
              <span className={styles.fileInfoValue}>{formatDate(file.createdAt.toString())}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.previewOverlay}>
      <div className={styles.filePreviewModal}>
        <div className={styles.previewHeader}>
          <h2 className={styles.previewTitle}>
            <button 
              className={styles.backButton}
              onClick={onClose}
              title="返回"
            >
              <ArrowLeft size={20} />
            </button>
            <IconComponent size={24} />
            {fileName}
          </h2>
          <div className={styles.previewActions}>
            <button 
              className={styles.actionButton}
              onClick={() => onDownload(file)}
              title="下载文件"
            >
              <Download size={20} />
            </button>
            <button 
              className={styles.actionButton}
              title="分享文件"
            >
              <Share2 size={20} />
            </button>
            <button 
              className={styles.actionButton}
              onClick={onClose}
              title="关闭预览"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className={styles.previewContainer}>
          <div className={styles.previewContent}>
            {renderPreviewContent()}
          </div>
          {renderFileInfo()}
        </div>
      </div>
    </div>
  );
};

// 辅助函数：格式化文件大小
const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null) return '';
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

// 辅助函数：格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}; 