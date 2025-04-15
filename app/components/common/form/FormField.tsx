import React, { ReactNode } from 'react';
import styles from './FormField.module.css';

interface FormFieldProps { 
  label: string; 
  icon: ReactNode; 
  children: ReactNode;
}

const FormField = ({ label, icon, children }: FormFieldProps) => (
  <div className={styles.formField}>
    <label className={styles.fieldLabel}>
      <span className={styles.fieldIcon}>{icon}</span>
      {label}
    </label>
    {children}
  </div>
);

export default FormField; 