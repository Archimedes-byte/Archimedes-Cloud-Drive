import React, { useState, useEffect, useRef } from 'react';
import { getFileTypeByExtension } from '@/app/utils/file/type';
import { 
  File, X, Download, FileText, Folder,
  Image as ImageIcon, Video, Music, Archive, Code,
  ArrowLeft, Share2, ExternalLink
} from 'lucide-react';
import { ExtendedFile, FileInfo } from '@/app/types';
import styles from './FilePreview.module.css';
import { API_PATHS } from '@/app/lib/api/paths';
import { FileIcon } from '@/app/utils/file/icon-map';

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
              console.error('预览响应不包含有效URL:', fileData);
              throw new Error(`无法获取预览URL: ${fileData.message || '服务响应格式错误'}`);
            }
          } 
          // 检查 data.data 结构
          else if (data.data && data.data.url) {
            console.log('获取到预览URL (data.data):', data.data.url);
            setPreviewUrl(data.data.url);
          } 
          // 检查简单 data 结构
          else if (data.url) {
            console.log('获取到预览URL (data):', data.url);
            setPreviewUrl(data.url);
          } else {
            console.error('预览响应不包含有效URL:', data);
            throw new Error('无法获取预览URL: 服务响应格式错误');
          }
        } else {
          // 不支持预览的文件类型
          console.log('文件类型不支持预览:', file.type || extension);
          setError(`不支持预览的文件类型: ${extension || file.type || '未知'}`);
        }
      } catch (error) {
        console.error('获取预览URL出错:', error);
        setError(error instanceof Error ? error.message : '获取预览失败');
      } finally {
        setLoading(false);
      }
    };

    // 保存fetchPreviewUrl的引用
    fetchPreviewUrlRef.current = fetchPreviewUrl;
    
    // 执行获取预览URL
    fetchPreviewUrl();
  }, [file]);

  // 文件图标渲染
  const getFileIconComponent = () => {
    if (!file) return <FileIcon size={48} />;

    // 获取扩展名
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return <FileIcon 
      extension={extension} 
      mimeType={file.type} 
      size={48} 
    />;
  };

  // 处理直接预览
  const tryDirectPreview = () => {
    if (!file) return;
    
    try {
      // 获取文件扩展名
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      
      console.log('尝试直接预览文件:', {
        id: file.id,
        name: file.name,
        extension
      });
      
      // 构建预览URL
      const previewUrl = API_PATHS.STORAGE.FILES.PREVIEW(file.id);
      
      // 在新窗口中打开预览
      window.open(previewUrl, '_blank');
    } catch (error) {
      console.error('直接预览文件出错:', error);
      alert('打开文件预览失败');
    }
  };

  // 渲染预览内容
  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <svg className={styles.loadingIcon} width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
            <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className={styles.loadingText}>正在加载预览...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.errorContainer}>
          {getFileIconComponent()}
          <h3>无法预览此文件</h3>
          <div className={styles.errorMessage}>{error}</div>
          
          <button 
            className={styles.actionButton} 
            onClick={() => {
              if (fetchPreviewUrlRef.current) {
                setLoading(true);
                setError(null);
                fetchPreviewUrlRef.current();
              }
            }}
            style={{ marginTop: '16px' }}
          >
            重试加载
          </button>
          
          <button 
            className={styles.actionButton} 
            onClick={tryDirectPreview}
            style={{ marginTop: '8px' }}
          >
            尝试直接预览
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

    if (!file) {
      return (
        <div className={styles.errorContainer}>
          <FileIcon size={48} className={styles.fileIcon} />
          <h3>无效的文件</h3>
          <div className={styles.errorMessage}>未找到文件数据</div>
        </div>
      );
    }

    // 获取文件扩展名
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    // 图片预览
    if (isImageType(file.type, extension) && previewUrl) {
      return (
        <div className={styles.imagePreviewContainer}>
          <img 
            src={previewUrl} 
            alt={file.name} 
            className={styles.imagePreview}
            onError={() => {
              setError('图片加载失败');
              setPreviewUrl(null);
            }}
          />
        </div>
      );
    }

    // 视频预览
    if (isVideoType(file.type, extension) && previewUrl) {
      return (
        <div className={styles.videoPreviewContainer}>
          <video 
            src={previewUrl} 
            controls 
            className={styles.videoPreview}
            onError={() => {
              setError('视频加载失败');
              setPreviewUrl(null);
            }}
          />
        </div>
      );
    }

    // 音频预览
    if (isAudioType(file.type, extension) && previewUrl) {
      return (
        <div className={styles.audioPreviewContainer}>
          <div className={styles.fileIcon}>
            <FileIcon extension="mp3" size={48} />
          </div>
          <h3>{file.name}</h3>
          <audio 
            src={previewUrl} 
            controls 
            className={styles.audioPreview}
            onError={() => {
              setError('音频加载失败');
              setPreviewUrl(null);
            }}
          />
        </div>
      );
    }

    // PDF预览
    if (isPdfFile(file.type, extension) && previewUrl) {
      return (
        <div className={styles.pdfPreviewContainer}>
          <iframe
            src={previewUrl}
            className={styles.pdfPreview}
            title={file.name}
            onError={() => {
              setError('PDF加载失败');
              setPreviewUrl(null);
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
            title={file.name}
            onError={() => {
              setError('文档加载失败');
              setPreviewUrl(null);
            }}
          />
        </div>
      );
    }

    // 通用文件信息展示
    return (
      <div className={styles.genericPreviewContainer}>
        {getFileIconComponent()}
        <h3>{file.name}</h3>
        <p>此文件类型不支持直接预览</p>
      </div>
    );
  };

  // 渲染文件信息面板
  const renderFileInfo = () => {
    if (!file) return null;

    // 获取扩展名
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    // 获取文件类型
    let fileType = '未知类型';
    if (isImageType(file.type, extension)) {
      fileType = '图片';
    } else if (isVideoType(file.type, extension)) {
      fileType = '视频';
    } else if (isAudioType(file.type, extension)) {
      fileType = '音频';
    } else if (isPdfFile(file.type, extension)) {
      fileType = 'PDF文档';
    } else if (isOfficeFile(file.type, extension)) {
      if (extension === 'doc' || extension === 'docx') {
        fileType = 'Word文档';
      } else if (extension === 'xls' || extension === 'xlsx') {
        fileType = 'Excel表格';
      } else if (extension === 'ppt' || extension === 'pptx') {
        fileType = 'PowerPoint演示文稿';
      } else {
        fileType = 'Office文档';
      }
    } else {
      fileType = extension ? `${extension.toUpperCase()}文件` : '二进制文件';
    }

    return (
      <div className={styles.fileInfoPanel}>
        <div className={styles.fileInfoTitle}>
          <ArrowLeft size={16} className={styles.backButton} onClick={onClose} />
          <span>文件信息</span>
        </div>
        <div className={styles.fileInfoContent}>
          <div className={styles.fileInfoItem}>
            <div className={styles.fileInfoLabel}>文件名</div>
            <div className={styles.fileInfoValue}>{file.name}</div>
          </div>
          <div className={styles.fileInfoItem}>
            <div className={styles.fileInfoLabel}>文件类型</div>
            <div className={styles.fileInfoValue}>{fileType}</div>
          </div>
          <div className={styles.fileInfoItem}>
            <div className={styles.fileInfoLabel}>文件大小</div>
            <div className={styles.fileInfoValue}>{formatFileSize(file.size)}</div>
          </div>
          {file.createdAt && (
            <div className={styles.fileInfoItem}>
              <div className={styles.fileInfoLabel}>创建时间</div>
              <div className={styles.fileInfoValue}>{formatDate(file.createdAt)}</div>
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
          <div className={styles.previewTitle}>
            {getFileIconComponent()}
            <span>{file ? file.name : '文件预览'}</span>
          </div>
          <div className={styles.previewActions}>
            {file && (
              <button 
                className={styles.actionButton}
                onClick={() => onDownload(file)}
                title="下载文件"
              >
                <Download size={20} />
              </button>
            )}
            <button 
              className={styles.closeButton}
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

// 辅助函数
const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null) return '未知大小';
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

const formatDate = (dateString: string | Date): string => {
  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString instanceof Date ? dateString.toString() : dateString;
  }
}; 