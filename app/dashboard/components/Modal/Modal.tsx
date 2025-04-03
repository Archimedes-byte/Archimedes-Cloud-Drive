import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer
}: ModalProps) => {
  if (!isOpen) return null;
  
  return (
    <>
      <div className={styles.modalBackdrop} />
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>{title}</h2>
            <button className={styles.modalClose} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <div className={styles.modalBody}>
            {children}
          </div>
          {footer && (
            <div className={styles.modalFooter}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Modal; 