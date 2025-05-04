'use client';

/**
 * 表单Hook实现
 * 
 * 提供统一的表单状态管理和处理逻辑
 */
import { useCallback, useEffect, useReducer } from 'react';
import { 
  FormState, FormStatus, FormOptions, FormHook, 
  FieldValidation, ValidationRule 
} from './types';
import { 
  createFormState, setFieldValue, setFieldTouched, 
  setFieldError, resetFormState, setFormStatus 
} from './formState';

// 重新导出类型以方便使用
export type { FormOptions, FormHook };

// 表单动作类型
type FormAction<T extends Record<string, any>> =
  | { type: 'SET_FIELD_VALUE'; field: keyof T; value: any }
  | { type: 'SET_FIELD_TOUCHED'; field: keyof T; isTouched: boolean }
  | { type: 'SET_FIELD_ERROR'; field: keyof T; error: string }
  | { type: 'SET_FORM_ERRORS'; errors: Partial<Record<keyof T, string>> }
  | { type: 'VALIDATE_FIELD'; field: keyof T }
  | { type: 'VALIDATE_FORM' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; message?: string }
  | { type: 'SUBMIT_ERROR'; message: string }
  | { type: 'RESET_FORM' };

// 表单状态Reducer
function formReducer<T extends Record<string, any>>(
  state: FormState<T>,
  action: FormAction<T>,
  options: FormOptions<T>
): FormState<T> {
  switch (action.type) {
    case 'SET_FIELD_VALUE':
      return setFieldValue(state, action.field, action.value);
      
    case 'SET_FIELD_TOUCHED':
      return setFieldTouched(state, action.field, action.isTouched);
      
    case 'SET_FIELD_ERROR':
      return setFieldError(state, action.field, action.error);
      
    case 'SET_FORM_ERRORS':
      return {
        ...state,
        errors: action.errors,
        isValid: Object.keys(action.errors).length === 0
      };
      
    case 'VALIDATE_FIELD': {
      const field = action.field;
      const value = state.values[field];
      const fieldValidation = options.validationSchema?.[field] || [];
      
      // 检查字段验证规则
      for (const rule of fieldValidation) {
        if (!rule.validator(value, state.values)) {
          return setFieldError(state, field, rule.message);
        }
      }
      
      // 验证通过，清除错误
      const newErrors = { ...state.errors };
      delete newErrors[field as string];
      
      return {
        ...state,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0
      };
    }
    
    case 'VALIDATE_FORM': {
      if (!options.validationSchema) {
        return { ...state, isValid: true, errors: {} };
      }
      
      const newErrors: Partial<Record<keyof T, string>> = {};
      
      // 检查所有字段的验证规则
      for (const field in options.validationSchema) {
        const fieldValidation = options.validationSchema[field as keyof T];
        if (!fieldValidation) continue;
        
        const value = state.values[field as keyof T];
        
        for (const rule of fieldValidation) {
          if (!rule.validator(value, state.values)) {
            newErrors[field as keyof T] = rule.message;
            break;
          }
        }
      }
      
      return {
        ...state,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0
      };
    }
    
    case 'SUBMIT_START':
      return setFormStatus(state, FormStatus.SUBMITTING);
      
    case 'SUBMIT_SUCCESS':
      return {
        ...setFormStatus(state, FormStatus.SUCCESS, action.message || '提交成功'),
        submitCount: state.submitCount + 1
      };
      
    case 'SUBMIT_ERROR':
      return setFormStatus(state, FormStatus.ERROR, action.message);
      
    case 'RESET_FORM':
      return resetFormState(state, options.initialValues);
      
    default:
      return state;
  }
}

/**
 * 表单Hook
 * 
 * @param options 表单配置选项
 */
export function useForm<T extends Record<string, any>>(
  options: FormOptions<T>
): FormHook<T> {
  const initialState = createFormState(options.initialValues);
  
  // 使用useReducer管理表单状态
  const [formState, dispatch] = useReducer(
    (state: FormState<T>, action: FormAction<T>) => formReducer(state, action, options),
    initialState
  );
  
  // 设置字段值
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    dispatch({ type: 'SET_FIELD_VALUE', field, value });
    
    if (options.validateOnChange) {
      dispatch({ type: 'VALIDATE_FIELD', field });
    }
  }, [options.validateOnChange]);
  
  // 设置字段触碰状态
  const setFieldTouched = useCallback((field: keyof T, isTouched = true) => {
    dispatch({ type: 'SET_FIELD_TOUCHED', field, isTouched });
    
    if (options.validateOnBlur && isTouched) {
      dispatch({ type: 'VALIDATE_FIELD', field });
    }
  }, [options.validateOnBlur]);
  
  // 设置字段错误
  const setFieldError = useCallback((field: keyof T, error: string) => {
    dispatch({ type: 'SET_FIELD_ERROR', field, error });
  }, []);
  
  // 验证单个字段
  const validateField = useCallback((field: keyof T) => {
    dispatch({ type: 'VALIDATE_FIELD', field });
    return !(field in formState.errors);
  }, [formState.errors]);
  
  // 验证整个表单
  const validateForm = useCallback(() => {
    dispatch({ type: 'VALIDATE_FORM' });
    return formState.isValid;
  }, [formState.isValid]);
  
  // 重置表单
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);
  
  // 处理表单提交
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    dispatch({ type: 'VALIDATE_FORM' });
    
    if (!formState.isValid) {
      dispatch({ type: 'SUBMIT_ERROR', message: '表单验证失败' });
      return;
    }
    
    if (options.onSubmit) {
      dispatch({ type: 'SUBMIT_START' });
      
      try {
        await options.onSubmit(formState.values, formState);
        dispatch({ type: 'SUBMIT_SUCCESS' });
      } catch (error) {
        dispatch({ 
          type: 'SUBMIT_ERROR', 
          message: error instanceof Error ? error.message : '提交失败'
        });
      }
    }
  }, [formState, options.onSubmit]);
  
  // 处理表单字段变更
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFieldValue(name as keyof T, fieldValue);
  }, [setFieldValue]);
  
  // 处理表单字段失焦
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setFieldTouched(name as keyof T, true);
  }, [setFieldTouched]);
  
  // 初始表单验证
  useEffect(() => {
    if (options.validateOnMount) {
      dispatch({ type: 'VALIDATE_FORM' });
    }
  }, [options.validateOnMount]);
  
  // 添加设置表单状态的方法
  const setFormStatus = useCallback((status: FormStatus, message?: string) => {
    if (status === FormStatus.SUCCESS) {
      dispatch({ type: 'SUBMIT_SUCCESS', message });
    } else if (status === FormStatus.ERROR) {
      dispatch({ type: 'SUBMIT_ERROR', message: message || '操作失败' });
    }
  }, []);
  
  return {
    formState,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    validateField,
    validateForm,
    resetForm,
    handleSubmit,
    handleChange,
    handleBlur,
    setFormStatus
  };
} 