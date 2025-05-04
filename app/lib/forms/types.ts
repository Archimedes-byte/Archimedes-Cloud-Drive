/**
 * 表单处理库的类型定义
 */

// 表单状态
export interface FormState<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitCount: number;
  status: FormStatus;
  statusMessage: string;
}

// 表单状态枚举
export enum FormStatus {
  IDLE = 'idle',
  VALIDATING = 'validating',
  SUBMITTING = 'submitting',
  SUCCESS = 'success',
  ERROR = 'error'
}

// 验证规则接口
export interface ValidationRule<T = any> {
  validator: (value: T, values?: Record<string, any>) => boolean;
  message: string;
}

// 字段验证配置
export type FieldValidation<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule[];
};

// 表单提交处理
export interface FormSubmitHandler<T extends Record<string, any>> {
  (values: T, formState: FormState<T>): Promise<void> | void;
}

// 表单钩子配置
export interface FormOptions<T extends Record<string, any>> {
  initialValues: T;
  validationSchema?: FieldValidation<T>;
  onSubmit?: FormSubmitHandler<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnMount?: boolean;
}

// 表单钩子返回值
export interface FormHook<T extends Record<string, any>> {
  formState: FormState<T>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, isTouched?: boolean) => void;
  setFieldError: (field: keyof T, error: string) => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  resetForm: () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  setFormStatus: (status: FormStatus, message?: string) => void;
} 