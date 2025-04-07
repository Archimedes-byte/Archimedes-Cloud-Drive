import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LocalFileType } from '../../utils/fileTypeConverter';
import { getFileTypeByExtension } from '../../utils/fileHelpers';
import { 
  File, X, Download, FileText, Folder,
  Image as ImageIcon, Video, Music, Archive, Code 
} from 'lucide-react';
import { ExtendedFile } from '../../types/index';
import styles from '@/app/shared/themes/components/filePreview.module.css';

interface FilePreviewProps {
  file: ExtendedFile | null;
  onClose: () => void;
  onDownload: (file: ExtendedFile) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onClose, onDownload }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

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
          extension: extension
        });

        // 使用isPreviewableFile辅助函数判断文件是否可预览
        if (isPreviewableFile(file.type, extension)) {
          console.log('文件类型支持预览，正在获取预览URL');
          
          const response = await fetch(`/api/files/${file.id}/preview`);
          const responseText = await response.text();
          
          let data;
          try {
            data = JSON.parse(responseText);
            setDebugInfo({ responseStatus: response.status, data });
          } catch (e) {
            setDebugInfo({ responseStatus: response.status, responseText });
            throw new Error('解析预览响应失败');
          }

          if (response.ok && data.success && data.url) {
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
      } finally {
        setLoading(false);
      }
    };

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
      return <div className={styles.loading}>正在加载预览...</div>;
    }

    // 如果是图片，尝试多种方式预览
    if (isImageFile) {
      // 优先使用API获取的预览URL
      if (previewUrl) {
        return (
          <div className={styles.imagePreview}>
            <img src={previewUrl} alt={fileName} onError={(e) => {
              console.error('图片加载失败:', e);
              setError('图片加载失败');
            }} />
          </div>
        );
      }
      
      // 尝试直接预览
      if (directPreviewUrl) {
        return (
          <div className={styles.imagePreview}>
            <img src={directPreviewUrl} alt={fileName} onError={(e) => {
              console.error('图片直接加载失败:', e);
              setError('图片加载失败');
            }} />
          </div>
        );
      }
    }

    // 视频预览
    if (isVideoFile && previewUrl) {
      return (
        <div className={styles.videoPreview}>
          <video controls>
            <source src={previewUrl} type={file.type?.startsWith('video/') ? file.type : `video/${extension}`} />
            您的浏览器不支持视频预览
          </video>
        </div>
      );
    }

    // 音频预览
    if (isAudioFile && previewUrl) {
      return (
        <div className={styles.audioPreview}>
          <audio controls>
            <source src={previewUrl} type={file.type?.startsWith('audio/') ? file.type : `audio/${extension}`} />
            您的浏览器不支持音频预览
          </audio>
        </div>
      );
    }

    // PDF文件预览
    if (isPdfFile(file.type, extension) && previewUrl) {
      return (
        <div className={styles.pdfPreview}>
          <iframe 
            src={previewUrl} 
            className={styles.pdfFrame}
            title={`PDF预览 - ${fileName}`}
          />
        </div>
      );
    }

    // Office文档预览 - 使用Google Docs Viewer或Microsoft Office Online Viewer
    if (isOfficeFile(file.type, extension) && previewUrl) {
      // 对于Office文档，我们可以使用Google Docs或Microsoft Office在线预览
      // 这里使用iframe直接加载预览URL
      return (
        <div className={styles.officePreview}>
          <iframe 
            src={previewUrl}
            className={styles.officeFrame}
            title={`文档预览 - ${fileName}`}
          />
          <div className={styles.officePreviewInfo}>
            <p>正在预览 {extension.toUpperCase()} 文档</p>
            <p className={styles.previewNote}>
              如果文档无法正常预览，请尝试 
              <button 
                className={styles.downloadLink}
                onClick={() => onDownload(file)}
              >
                下载文件
              </button>
            </p>
          </div>
        </div>
      );
    }

    // 错误状态显示
    if (error) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.error}>{error}</div>
          <div className={styles.errorMessage}>无法加载预览，请尝试下载文件查看</div>
          {debugInfo && (
            <div className={styles.debugInfo}>
              <details>
                <summary>调试信息</summary>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      );
    }

    // 对于不支持直接预览的文件类型
    return (
      <div className={styles.noPreview}>
        <div className={styles.fileIcon}>
          <IconComponent size={64} />
        </div>
        <div className={styles.fileInfo}>
          <div className={styles.fileName}>{fileName}</div>
          <div className={styles.fileType}>
            {file.type || `${extension.toUpperCase()} 文件`}
          </div>
          <button 
            className={styles.downloadButton}
            onClick={() => onDownload(file)}
          >
            <Download size={16} />
            下载文件查看
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.previewOverlay} onClick={onClose}>
      <div className={styles.previewContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.previewHeader}>
          <div className={styles.previewTitle}>
            <IconComponent size={20} />
            <span>{fileName}</span>
          </div>
          <div className={styles.previewActions}>
            <button 
              className={styles.downloadAction}
              onClick={() => onDownload(file)}
              title="下载文件"
            >
              <Download size={20} />
            </button>
            <button 
              className={styles.closeAction}
              onClick={onClose}
              title="关闭预览"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className={styles.previewContent}>
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  );
};

export default FilePreview; 