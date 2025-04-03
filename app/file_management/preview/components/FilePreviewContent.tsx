import React from 'react';
import { PreviewProps } from '@/types/file';
import { TYPE_MAP, FILE_TYPE_MAP } from '@/lib/fileUtils';
import {
  ImagePreview,
  VideoPreview,
  AudioPreview,
  PDFPreview,
  WordPreview,
  TextPreview,
  FallbackPreview
} from './previewComponents';

// 文件类型常量
const FILE_TYPES = {
  PDF: 'application/pdf',
  WORD: {
    DOC: 'application/msword',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  JSON: 'application/json'
} as const;

export function FilePreviewContent({ type, url, name, onError }: PreviewProps) {
  const renderPreview = () => {
    if (!type) {
      return <FallbackPreview url={url} name={name} type={type} onError={onError} />;
    }

    // 使用统一的文件类型判断
    for (const [fileType, { mimeTypes }] of Object.entries(FILE_TYPE_MAP)) {
      if (mimeTypes.some(mimeType => type.startsWith(mimeType))) {
        switch (fileType) {
          case 'image':
            return <ImagePreview url={url} name={name} onError={onError} />;
          case 'video':
            return <VideoPreview url={url} type={type} onError={onError} />;
          case 'audio':
            return <AudioPreview url={url} onError={onError} />;
          default:
            break;
        }
      }
    }

    // 特殊文件类型判断
    if (type === FILE_TYPES.PDF) {
      return <PDFPreview url={url} name={name} onError={onError} />;
    }

    if (type === FILE_TYPES.WORD.DOC || type === FILE_TYPES.WORD.DOCX) {
      return <WordPreview url={url} name={name} onError={onError} />;
    }

    if (type.startsWith('text/') || type === FILE_TYPES.JSON) {
      return <TextPreview url={url} name={name} onError={onError} />;
    }

    return <FallbackPreview url={url} name={name} type={type} onError={onError} />;
  };

  return (
    <div className="preview-wrapper">
      {renderPreview()}
    </div>
  );
}

// 添加默认导出
export default FilePreviewContent; 