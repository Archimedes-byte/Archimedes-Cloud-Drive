/**
 * 表单状态管理
 * 
 * 提供表单状态的创建和更新方法
 */
import { FormState, FormStatus } from './types';

/**
 * 创建初始表单状态
 */
export function createFormState<T extends Record<string, any>>(initialValues: T): FormState<T> {
  return {
    values: { ...initialValues },
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false,
    submitCount: 0,
    status: FormStatus.IDLE,
    statusMessage: ''
  };
}

/**
 * 更新表单字段值
 */
export function setFieldValue<T extends Record<string, any>>(
  state: FormState<T>,
  field: keyof T,
  value: any
): FormState<T> {
  return {
    ...state,
    values: {
      ...state.values,
      [field]: value
    },
    isDirty: true
  };
}

/**
 * 设置字段被触碰状态
 */
export function setFieldTouched<T extends Record<string, any>>(
  state: FormState<T>,
  field: keyof T,
  isTouched: boolean = true
): FormState<T> {
  return {
    ...state,
    touched: {
      ...state.touched,
      [field]: isTouched
    }
  };
}

/**
 * 设置字段错误
 */
export function setFieldError<T extends Record<string, any>>(
  state: FormState<T>,
  field: keyof T,
  error: string
): FormState<T> {
  const newErrors = {
    ...state.errors,
    [field]: error
  };
  
  return {
    ...state,
    errors: newErrors,
    isValid: Object.keys(newErrors).length === 0
  };
}

/**
 * 重置表单状态
 */
export function resetFormState<T extends Record<string, any>>(
  state: FormState<T>,
  initialValues: T
): FormState<T> {
  return createFormState(initialValues);
}

/**
 * 设置表单状态
 */
export function setFormStatus<T extends Record<string, any>>(
  state: FormState<T>,
  status: FormStatus,
  message: string = ''
): FormState<T> {
  return {
    ...state,
    status,
    statusMessage: message,
    isSubmitting: status === FormStatus.SUBMITTING
  };
} 