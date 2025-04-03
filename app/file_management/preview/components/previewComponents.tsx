import { PreviewProps } from '@/types/file';

// 图片预览
export const ImagePreview: React.FC<PreviewProps> = ({ url, name, onError }) => (
  <div className="image-preview">
    <img 
      src={url} 
      alt={name} 
      className="preview-content"
      onError={(e) => onError('图片', e)}
    />
  </div>
);

// 视频预览
export const VideoPreview: React.FC<PreviewProps> = ({ url, type, onError }) => (
  <div className="video-preview">
    <video 
      controls 
      className="preview-content"
      onError={(e) => onError('视频', e)}
    >
      <source src={url} type={type} />
      您的浏览器不支持视频播放
    </video>
  </div>
);

// 音频预览
export const AudioPreview: React.FC<PreviewProps> = ({ url, onError }) => (
  <div className="audio-preview">
    <audio 
      controls 
      className="preview-content"
      src={url}
      onError={(e) => onError('音频', e)}
    >
      您的浏览器不支持音频播放
    </audio>
  </div>
);

// PDF预览
export const PDFPreview: React.FC<PreviewProps> = ({ url, name, onError }) => (
  <div className="pdf-preview">
    <iframe
      src={url}
      className="preview-content"
      title={name}
      onError={(e) => onError('PDF', e)}
    />
  </div>
);

// Word文档预览
export const WordPreview: React.FC<PreviewProps> = ({ url, name, onError }) => {
  const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + url)}`;
  return (
    <div className="doc-preview">
      <iframe
        src={viewerUrl}
        className="preview-content"
        title={name}
        onError={(e) => onError('Word文档', e)}
      />
    </div>
  );
};

// 文本预览
export const TextPreview: React.FC<PreviewProps> = ({ url, name, onError }) => (
  <div className="text-preview">
    <iframe
      src={url}
      className="preview-content"
      title={name}
      onError={(e) => onError('文本', e)}
    />
  </div>
);

// 不支持的文件类型
export const FallbackPreview: React.FC<PreviewProps> = ({ url, name, type }) => (
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