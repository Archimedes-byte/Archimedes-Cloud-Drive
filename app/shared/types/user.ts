// 用户实体接口 - 基于Prisma模型
export interface UserEntity {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
  storageUsed: number;
  storageLimit: number;
}

// Google用户信息接口
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

// 前端使用的用户信息接口
export interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  storageUsed: number;
  storageLimit: number;
}

// 用户配置文件接口
export interface UserProfile {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  company: string | null;
  avatarUrl: string | null;
  theme: string | null;
  createdAt: string;
  updatedAt: string;
}

// 前端扩展的用户资料接口
export interface ExtendedUserProfile {
  id: string;
  email: string;
  name: string | null;
  displayName?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  company?: string | null;
  avatarUrl?: string | null;
  theme?: string | null;
  storageUsed?: number;
  storageLimit?: number;
  createdAt: string;
  updatedAt?: string;
}

// 类型映射函数 - 将数据库实体转换为前端显示模型
export function mapUserEntityToUserInfo(entity: UserEntity): UserInfo {
  return {
    id: entity.id,
    name: entity.name,
    email: entity.email,
    image: entity.image,
    storageUsed: entity.storageUsed,
    storageLimit: entity.storageLimit
  };
}

// 类型映射函数 - 将Google用户转换为用户信息
export function mapGoogleUserToUserInfo(user: GoogleUser): Partial<UserInfo> {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.picture
  };
} 