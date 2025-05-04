import React, { ReactNode } from 'react';
import styles from './FormField.module.css';

export interface FormFieldProps { 
  label: string; 
  icon: ReactNode; 
  children: ReactNode;
  error?: string;
}

const FormField = ({ label, icon, children, error }: FormFieldProps) => (
  <div className={styles.formField}>
    <label className={styles.fieldLabel}>
      <span className={styles.fieldIcon}>{icon}</span>
      {label}
    </label>
    {children}
    {error && <div className={styles.errorMessage}>{error}</div>}
  </div>
);

export default FormField; 