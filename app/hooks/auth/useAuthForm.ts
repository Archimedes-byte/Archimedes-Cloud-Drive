'use client';

import { useState, ChangeEvent, FocusEvent, useEffect } from 'react';
import { 
  getSecureItem, 
  setSecureItem, 
  removeSecureItem, 
  cleanupExpiredItems,
  STORAGE_CONFIG
} from '@/app/utils/storage/secureStorage';

/**
 * 通用表单状态类型
 */
export interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  status?: string;
}

/**
 * 表单验证函数类型
 */
export type ValidateFn<T> = (values: T) => Record<string, string>;

// 表单数据接口
interface AuthFormData {
  name?: string;
  email?: string;
}

/**
 * 通用认证表单钩子
 * 
 * 提供表单状态管理、验证、提交等功能
 * 使用安全存储功能保护敏感数据
 */
export function useAuthForm<T extends Record<string, any>>(
  initialValues: T, 
  validate?: ValidateFn<T>
) {
  // 清理过期数据
  useEffect(() => {
    cleanupExpiredItems();
  }, []);
  
  // 尝试从安全存储获取保存的表单数据
  const getSavedFormData = async (): Promise<AuthFormData> => {
    try {
      const savedDataStr = await getSecureItem(STORAGE_CONFIG.KEYS.AUTH_FORM_DATA);
      if (!savedDataStr) return {};
      
      return JSON.parse(savedDataStr) as AuthFormData;
    } catch (error) {
      console.error('Failed to load saved form data', error);
      return {};
    }
  };
  
  // 合并保存的数据和初始数据
  const getMergedValues = async (): Promise<T> => {
    const savedData = await getSavedFormData();
    
    // 如果没有保存的数据，直接返回初始值
    if (!Object.keys(savedData).length) {
      return initialValues;
    }
    
    // 仅保留姓名和邮箱字段
    const mergedValues = { ...initialValues };
    
    if (savedData.name && 'name' in initialValues) {
      mergedValues['name' as keyof T] = savedData.name as any;
    }
    
    if (savedData.email && 'email' in initialValues) {
      mergedValues['email' as keyof T] = savedData.email as any;
    }
    
    return mergedValues;
  };

  // 状态管理
  const [values, setValues] = useState<T>(initialValues);
  
  // 从存储中加载数据
  useEffect(() => {
    const loadSavedData = async () => {
      const mergedValues = await getMergedValues();
      setValues(mergedValues);
    };
    
    loadSavedData();
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 保存表单数据到安全存储 (只保存姓名和邮箱)
  const saveFormData = async (formData: T) => {
    try {
      const dataToSave: AuthFormData = {};
      
      if ('name' in formData) {
        dataToSave.name = formData['name' as keyof T] as string;
      }
      
      if ('email' in formData) {
        dataToSave.email = formData['email' as keyof T] as string;
      }
      
      // 只在有数据时保存
      if (Object.keys(dataToSave).length > 0) {
        // 使用安全存储工具保存数据，设置24小时过期
        await setSecureItem(
          STORAGE_CONFIG.KEYS.AUTH_FORM_DATA, 
          JSON.stringify(dataToSave),
          STORAGE_CONFIG.EXPIRATION.MEDIUM
        );
      }
    } catch (error) {
      console.error('Failed to save form data', error);
    }
  };

  // 处理表单字段变更
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setValues(prev => {
      const newValues = { ...prev, [name]: value };
      
      // 仅保存姓名和邮箱字段
      if (name === 'name' || name === 'email') {
        // 异步调用不会阻塞UI更新
        saveFormData(newValues);
      }
      
      return newValues;
    });
    
    // 清除错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // 处理失焦事件
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  // 验证表单
  const validateForm = (): Record<string, string> => {
    if (validate) {
      return validate(values);
    }
    return {};
  };

  // 检查表单是否有效
  const isValid = () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // 重置表单状态
  const resetForm = async () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    
    // 清除存储的表单数据
    await removeSecureItem(STORAGE_CONFIG.KEYS.AUTH_FORM_DATA);
  };
  
  // 设置字段值
  const setFieldValue = (name: string, value: any) => {
    setValues(prev => {
      const newValues = { ...prev, [name]: value };
      
      // 如果是姓名或邮箱字段，保存到安全存储
      if (name === 'name' || name === 'email') {
        // 异步调用不会阻塞UI更新
        saveFormData(newValues);
      }
      
      return newValues;
    });
    
    // 如果有错误，清除
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // 设置提交状态
  const setSubmitting = (submitting: boolean) => {
    setIsSubmitting(submitting);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    isValid,
    resetForm,
    setFieldValue,
    setSubmitting,
    validateForm
  };
} 