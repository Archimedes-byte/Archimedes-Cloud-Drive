/**
 * 工具类型定义
 * 
 * 本文件包含通用的工具类型，用于简化类型操作
 */

/**
 * 深度部分类型
 * 将类型的所有属性及嵌套属性设为可选
 * @template T 要转换的类型
 */
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

/**
 * 递归所需类型
 * 将类型的所有属性及嵌套属性设为必需
 * @template T 要转换的类型
 */
export type DeepRequired<T> = T extends object ? {
  [P in keyof T]-?: DeepRequired<T[P]>;
} : T;

/**
 * 递归只读类型
 * 将类型的所有属性及嵌套属性设为只读
 * @template T 要转换的类型
 */
export type DeepReadonly<T> = T extends object ? {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
} : T;

/**
 * 非空过滤类型
 * 保留对象中非空属性
 * @template T 对象类型
 */
export type NonNullableProperties<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * 剔除类型中特定键的类型
 * @template T 对象类型
 * @template K 要剔除的键
 */
export type OmitProperties<T, K extends keyof T> = Omit<T, K>;

/**
 * 只保留类型中特定键的类型
 * @template T 对象类型
 * @template K 要保留的键
 */
export type PickProperties<T, K extends keyof T> = Pick<T, K>;

/**
 * 将对象类型中的指定键的类型替换为另一个类型
 * @template T 对象类型
 * @template K 要替换的键
 * @template R 替换后的类型
 */
export type ReplaceProperty<T, K extends keyof T, R> = Omit<T, K> & { [P in K]: R };

/**
 * 异步函数的返回类型
 * @template T 异步函数类型
 */
export type AsyncReturnType<T extends (...args: any[]) => Promise<any>> = 
  T extends (...args: any[]) => Promise<infer R> ? R : never;

/**
 * 提取React组件的Props类型
 * @template T React组件类型
 */
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;

/**
 * 提取函数参数类型
 * @template T 函数类型
 */
export type FunctionParams<T extends (...args: any[]) => any> = 
  T extends (...args: infer P) => any ? P : never;

/**
 * 创建联合类型的字符串
 * @template T 联合类型
 */
export type ValueOf<T> = T[keyof T];

/**
 * 获取对象类型中的值的类型联合
 * @template T 对象类型
 */
export type ObjectValues<T> = T[keyof T];

/**
 * 可取消的Promise类型
 * 包含取消方法的Promise
 * @template T Promise解析类型
 */
export interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void;
}

/**
 * 限制对象的键类型为字符串
 * @template T 值类型
 */
export type StringKeyed<T> = {
  [key: string]: T;
};

/**
 * 限制对象的键类型为数字
 * @template T 值类型
 */
export type NumberKeyed<T> = {
  [key: number]: T;
};

/**
 * 递归将所有类型中的 undefined 转换为可选属性
 * @template T 要转换的类型
 */
export type UndefinedToOptional<T> = T extends object
  ? { [K in keyof T as undefined extends T[K] ? never : K]: UndefinedToOptional<T[K]> } &
    { [K in keyof T as undefined extends T[K] ? K : never]?: UndefinedToOptional<Exclude<T[K], undefined>> }
  : T; 