import React, { ReactNode } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Modal as AntModal } from '@/app/components/ui/ant';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  className = ''
}: ModalProps) => {
  return (
    <AntModal
      open={isOpen}
      onCancel={onClose}
      title={<div className={styles.modalTitle}>{title}</div>}
      footer={footer}
      closeIcon={<CloseOutlined className={styles.modalCloseIcon} />}
      className={`${styles.customModal} ${className}`}
      wrapClassName={`${styles.modalBackdrop} ${className}`}
      centered
    >
      <div className={styles.modalBody}>
        {children}
      </div>
    </AntModal>
  );
};

export default Modal; 