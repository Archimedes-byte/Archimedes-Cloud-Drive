import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { X, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './AvatarCropper.module.css';

interface AvatarCropperProps {
  image: File | string; // 接受File对象或图片URL
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
  inModal?: boolean; // 是否在Modal中使用
}

// 创建一个圆形裁剪区域
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

// 用于将裁剪区域应用到Canvas上
function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Canvas is empty');
      }
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

// 裁剪Canvas，生成最终图像
async function canvasCrop(
  image: HTMLImageElement,
  crop: PixelCrop,
  scale = 1,
  rotate = 0,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  // 设置输出画布尺寸为正方形
  const size = Math.min(
    crop.width * scaleX * scale,
    crop.height * scaleY * scale
  );
  
  canvas.width = size * pixelRatio;
  canvas.height = size * pixelRatio;

  // 调整画布
  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  // 移动中心点
  const centerX = size / 2;
  const centerY = size / 2;
  
  ctx.translate(centerX, centerY);
  ctx.rotate(rotate * Math.PI / 180);
  ctx.translate(-centerX, -centerY);

  // 绘制裁剪后的图像
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    size,
    size
  );

  // 创建圆形裁剪
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();

  return toBlob(canvas);
}

export default function AvatarCropper({ image, onClose, onCropComplete, inModal = false }: AvatarCropperProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState(1); // 固定为1:1比例
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 加载图片
  useEffect(() => {
    if (image instanceof File) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(image);
    } else if (typeof image === 'string') {
      setImgSrc(image);
    }
  }, [image]);

  // 当图片加载完成后初始化裁剪区域
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // 确保裁剪区域适合显示区域
    const cropWidth = Math.min(width, height) * 0.8;
    
    // 设置自定义裁剪区域，更适合显示
    const crop = {
      unit: '%' as const,
      width: (cropWidth / width) * 100,
      height: (cropWidth / height) * 100,
      x: (100 - (cropWidth / width) * 100) / 2,
      y: (100 - (cropWidth / height) * 100) / 2
    };
    
    setCrop(crop);
  }, []);

  // 当裁剪、缩放或旋转变化时，更新预览
  useEffect(() => {
    async function updatePreview() {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current
      ) {
        try {
          const blob = await canvasCrop(
            imgRef.current,
            completedCrop,
            scale,
            rotate
          );
          const objectUrl = URL.createObjectURL(blob);
          setPreviewUrl(objectUrl);
          
          // 清理前一个预览URL
          return () => {
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
            }
          };
        } catch (e) {
          console.error('预览生成失败:', e);
        }
      }
    }
    
    updatePreview();
  }, [completedCrop, scale, rotate]);

  // 处理裁剪完成
  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;
    
    try {
      setIsLoading(true);
      const croppedBlob = await canvasCrop(
        imgRef.current,
        completedCrop,
        scale,
        rotate
      );
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error('裁剪失败:', e);
      alert('裁剪图片时发生错误，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [completedCrop, scale, rotate, onCropComplete]);

  // 旋转图片
  const handleRotate = useCallback(() => {
    setRotate((prev) => (prev + 90) % 360);
  }, []);

  // 处理缩放
  const handleZoomChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(parseFloat(e.target.value));
  }, []);

  if (inModal) {
    // 在Modal中使用时的渲染方式
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>裁剪头像</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.cropContainer}>
          {imgSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentageCrop) => setCrop(percentageCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="头像裁剪"
                style={{ 
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              加载中...
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <button 
            className={styles.rotateButton} 
            onClick={handleRotate}
            title="旋转图片"
          >
            <RotateCw size={18} />
          </button>
        </div>

        <div className={styles.zoomControl}>
          <ZoomOut size={18} />
          <input
            type="range"
            className={styles.slider}
            min="0.5"
            max="3"
            step="0.01"
            value={scale}
            onChange={handleZoomChange}
          />
          <ZoomIn size={18} />
        </div>

        {previewUrl && (
          <div className={styles.preview}>
            <p className={styles.previewTitle}>预览效果</p>
            <img
              src={previewUrl}
              alt="预览"
              className={styles.previewImage}
            />
          </div>
        )}

        <div className={styles.actions}>
          <button 
            className={`${styles.button} ${styles.cancelButton}`} 
            onClick={onClose}
            disabled={isLoading}
          >
            取消
          </button>
          <button 
            className={`${styles.button} ${styles.applyButton} ${isLoading ? styles.disabled : ''}`} 
            onClick={handleCropComplete}
            disabled={!completedCrop || isLoading}
          >
            {isLoading ? '处理中...' : '应用'}
          </button>
        </div>
      </div>
    );
  }

  // 默认渲染方式
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>裁剪头像</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.cropContainer}>
          {imgSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentageCrop) => setCrop(percentageCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="头像裁剪"
                style={{ 
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          ) : (
            <div>加载中...</div>
          )}
        </div>

        <div className={styles.controls}>
          <button 
            className={styles.rotateButton} 
            onClick={handleRotate}
            title="旋转图片"
          >
            <RotateCw size={20} />
          </button>
        </div>

        <div className={styles.zoomControl}>
          <ZoomOut size={20} />
          <input
            type="range"
            className={styles.slider}
            min="0.5"
            max="3"
            step="0.01"
            value={scale}
            onChange={handleZoomChange}
          />
          <ZoomIn size={20} />
        </div>

        {previewUrl && (
          <div className={styles.preview}>
            <p className={styles.previewTitle}>预览效果</p>
            <img
              src={previewUrl}
              alt="预览"
              className={styles.previewImage}
            />
          </div>
        )}

        <div className={styles.actions}>
          <button 
            className={`${styles.button} ${styles.cancelButton}`} 
            onClick={onClose}
            disabled={isLoading}
          >
            取消
          </button>
          <button 
            className={`${styles.button} ${styles.applyButton} ${isLoading ? styles.disabled : ''}`} 
            onClick={handleCropComplete}
            disabled={!completedCrop || isLoading}
          >
            {isLoading ? '处理中...' : '应用'}
          </button>
        </div>
      </div>
    </div>
  );
} 