'use client';

import React, { useRef, useEffect } from 'react';
import { Modal, Input, InputRef } from 'antd';

interface LinkInputModalProps {
  isVisible: boolean;
  shareLink: string;
  shareLinkPassword: string;
  onShareLinkChange: (link: string) => void;
  onShareLinkPasswordChange: (password: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const LinkInputModal: React.FC<LinkInputModalProps> = ({
  isVisible,
  shareLink,
  shareLinkPassword,
  onShareLinkChange,
  onShareLinkPasswordChange,
  onSubmit,
  onCancel
}) => {
  const linkInputRef = useRef<InputRef>(null);

  // 当模态窗口打开时，聚焦到链接输入框
  useEffect(() => {
    if (isVisible && linkInputRef.current) {
      setTimeout(() => {
        linkInputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  return (
    <Modal
      title="打开分享链接"
      open={isVisible}
      onCancel={onCancel}
      onOk={onSubmit}
      okText="验证并打开"
      cancelText="取消"
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>分享链接:</div>
        <Input
          ref={linkInputRef}
          value={shareLink}
          onChange={(e) => onShareLinkChange(e.target.value)}
          placeholder="输入分享链接，例如: https://example.com/pages/share/abcdef"
          onPressEnter={onSubmit}
        />
      </div>
      <div>
        <div style={{ marginBottom: 8 }}>提取码:</div>
        <Input
          value={shareLinkPassword}
          onChange={(e) => onShareLinkPasswordChange(e.target.value)}
          placeholder="输入提取码（如果链接中已包含则无需输入）"
          onPressEnter={onSubmit}
        />
      </div>
    </Modal>
  );
};

// 添加默认导出以兼容index.ts中的导入方式
export default LinkInputModal; 