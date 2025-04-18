import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { Clipboard, Clock, Lock, Users } from 'lucide-react';
import styles from './share-modal.module.css';
import { FileInfo } from '@/app/types';
import { message as antMessage } from 'antd';

// 分享有效期选项
const EXPIRY_OPTIONS = [
  { value: 1, label: '1天' },
  { value: 7, label: '7天' },
  { value: 30, label: '30天' },
  { value: 365, label: '365天' },
  { value: -1, label: '永久有效' },
];

// 分享模态窗口属性
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFiles: FileInfo[];
  onShare: (options: ShareOptions) => Promise<{shareLink: string, extractCode: string}>;
}

// 分享选项接口
export interface ShareOptions {
  fileIds: string[];
  expiryDays: number;
  extractCode: string;
  accessLimit: number | null;
  autoRefreshCode: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  selectedFiles,
  onShare
}) => {
  // 状态
  const [expiryDays, setExpiryDays] = useState<number>(365); // 默认365天
  const [extractCodeType, setExtractCodeType] = useState<'system' | 'custom'>('system'); // 系统生成或自定义
  const [customExtractCode, setCustomExtractCode] = useState<string>('');
  const [accessLimit, setAccessLimit] = useState<'unlimited' | 'limited'>('unlimited'); // 不限制或限制访问人数
  const [limitCount, setLimitCount] = useState<number>(10);
  const [autoRefreshCode, setAutoRefreshCode] = useState<boolean>(true);
  const [shareLink, setShareLink] = useState<string>('');
  const [shareCode, setShareCode] = useState<string>('');
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [hasShared, setHasShared] = useState<boolean>(false);

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setExpiryDays(365);
      setExtractCodeType('system');
      setCustomExtractCode('');
      setAccessLimit('unlimited');
      setLimitCount(10);
      setAutoRefreshCode(true);
      setShareLink('');
      setShareCode('');
      setHasShared(false);
    }
  }, [isOpen]);

  // 处理分享
  const handleShare = async () => {
    if (selectedFiles.length === 0) {
      antMessage.warning('请选择要分享的文件');
      return;
    }

    setIsSharing(true);

    try {
      const shareOptions: ShareOptions = {
        fileIds: selectedFiles.map(file => file.id),
        expiryDays,
        extractCode: extractCodeType === 'system' ? '' : customExtractCode,
        accessLimit: accessLimit === 'unlimited' ? null : limitCount,
        autoRefreshCode,
      };

      const result = await onShare(shareOptions);
      setShareLink(result.shareLink);
      setShareCode(result.extractCode);
      setHasShared(true);
      antMessage.success('分享链接已生成');
    } catch (error) {
      console.error('分享失败:', error);
      antMessage.error('分享失败，请重试');
    } finally {
      setIsSharing(false);
    }
  };

  // 复制分享链接
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        antMessage.success('链接已复制到剪贴板');
      })
      .catch(() => {
        antMessage.error('复制失败，请手动复制');
      });
  };

  // 复制提取码
  const copyExtractCode = () => {
    navigator.clipboard.writeText(shareCode)
      .then(() => {
        antMessage.success('提取码已复制到剪贴板');
      })
      .catch(() => {
        antMessage.error('复制失败，请手动复制');
      });
  };

  return (
    <Modal
      title="分享"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
    >
      <div className={styles.shareContainer}>
        {!hasShared ? (
          // 分享设置界面
          <div className={styles.shareSettings}>
            <div className={styles.tabHeader}>
              <div className={styles.tabItem + ' ' + styles.active}>链接分享</div>
              <div className={styles.tabItem}>发给网盘好友</div>
            </div>

            {/* 有效期设置 */}
            <div className={styles.optionItem}>
              <div className={styles.optionLabel}>有效期：</div>
              <div className={styles.optionContent}>
                <div className={styles.radioGroup}>
                  {EXPIRY_OPTIONS.map(option => (
                    <label key={option.value} className={styles.radioItem}>
                      <input
                        type="radio"
                        checked={expiryDays === option.value}
                        onChange={() => setExpiryDays(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 提取码设置 */}
            <div className={styles.optionItem}>
              <div className={styles.optionLabel}>提取码：</div>
              <div className={styles.optionContent}>
                <div className={styles.radioGroup}>
                  <label className={styles.radioItem}>
                    <input
                      type="radio"
                      checked={extractCodeType === 'system'}
                      onChange={() => setExtractCodeType('system')}
                    />
                    <span>系统随机生成提取码</span>
                  </label>
                  <label className={styles.radioItem}>
                    <input
                      type="radio"
                      checked={extractCodeType === 'custom'}
                      onChange={() => setExtractCodeType('custom')}
                    />
                    <span>自定义提取码</span>
                  </label>
                </div>
                {extractCodeType === 'custom' && (
                  <div className={styles.customCodeInput}>
                    <input
                      type="text"
                      placeholder="请输入4位提取码"
                      value={customExtractCode}
                      onChange={e => setCustomExtractCode(e.target.value)}
                      maxLength={4}
                    />
                    <div className={styles.codeTip}>仅支持数字及英文字母</div>
                  </div>
                )}
              </div>
            </div>

            {/* 分享链接自动填充提取码 */}
            <div className={styles.optionItem}>
              <div className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={autoRefreshCode}
                  onChange={() => setAutoRefreshCode(!autoRefreshCode)}
                  id="autoRefreshCode"
                />
                <label htmlFor="autoRefreshCode">分享链接自动填充提取码</label>
              </div>
            </div>

            {/* 访问人数限制 */}
            <div className={styles.optionItem}>
              <div className={styles.optionLabel}>访问人数限制：</div>
              <div className={styles.optionContent}>
                <div className={styles.radioGroup}>
                  <label className={styles.radioItem}>
                    <input
                      type="radio"
                      checked={accessLimit === 'unlimited'}
                      onChange={() => setAccessLimit('unlimited')}
                    />
                    <span>不限制</span>
                  </label>
                  <label className={styles.radioItem}>
                    <input
                      type="radio"
                      checked={accessLimit === 'limited'}
                      onChange={() => setAccessLimit('limited')}
                    />
                    <span>限制人数</span>
                  </label>
                </div>
                {accessLimit === 'limited' && (
                  <div className={styles.limitCountInput}>
                    <span>可直接输入1-10人，或选择不限制</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={limitCount}
                      onChange={e => setLimitCount(parseInt(e.target.value) || 10)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 底部说明及确认按钮 */}
            <div className={styles.footer}>
              <div className={styles.disclaimer}>
                请勿传播分享含有违法信息的文件，违规内容将被清除，严重者封号处理。
              </div>
              <button 
                className={styles.createLinkButton}
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? '创建中...' : '创建链接'}
              </button>
            </div>
          </div>
        ) : (
          // 分享结果界面
          <div className={styles.shareResult}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successTitle}>链接已创建成功</div>

            {/* 分享链接 */}
            <div className={styles.linkItem}>
              <div className={styles.linkLabel}>
                <span>分享链接：</span>
              </div>
              <div className={styles.linkValue}>
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                />
                <button 
                  className={styles.copyButton}
                  onClick={copyShareLink}
                >
                  <Clipboard className="w-4 h-4" />
                  复制
                </button>
              </div>
            </div>

            {/* 提取码 */}
            <div className={styles.linkItem}>
              <div className={styles.linkLabel}>
                <span>提取码：</span>
              </div>
              <div className={styles.linkValue}>
                <input
                  type="text"
                  readOnly
                  value={shareCode}
                />
                <button 
                  className={styles.copyButton}
                  onClick={copyExtractCode}
                >
                  <Clipboard className="w-4 h-4" />
                  复制
                </button>
              </div>
            </div>

            {/* 有效期 */}
            <div className={styles.infoItem}>
              <Clock className="w-4 h-4" />
              <span>有效期: </span>
              <span>{expiryDays === -1 ? '永久有效' : `${expiryDays}天`}</span>
            </div>

            {/* 访问限制 */}
            <div className={styles.infoItem}>
              <Users className="w-4 h-4" />
              <span>访问限制: </span>
              <span>{accessLimit === 'unlimited' ? '不限制' : `${limitCount}人`}</span>
            </div>

            {/* 安全提示 */}
            <div className={styles.securityTip}>
              <Lock className="w-4 h-4" />
              <span>请妥善保管分享链接和提取码</span>
            </div>

            {/* 底部按钮 */}
            <div className={styles.resultButtons}>
              <button 
                className={styles.newShareButton}
                onClick={() => setHasShared(false)}
              >
                新建分享
              </button>
              <button 
                className={styles.doneButton}
                onClick={onClose}
              >
                完成
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal; 