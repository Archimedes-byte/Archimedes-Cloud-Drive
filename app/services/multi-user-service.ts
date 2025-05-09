/**
 * 多用户会话管理服务
 * 
 * 提供多用户同时登录的状态管理与切换功能
 */
import { User } from 'next-auth';

// 扩展的用户类型，包含最后一次活跃时间
export interface ActiveUser extends User {
  lastActive: Date;
}

// 用户切换事件类型
export type UserSwitchEventHandler = (newUser: User) => void;

class MultiUserService {
  private static instance: MultiUserService;
  private readonly storage_key = 'cloud_drive_logged_users';
  private users: ActiveUser[] = [];
  private switchEventListeners: UserSwitchEventHandler[] = [];
  private initialized = false;

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): MultiUserService {
    if (!MultiUserService.instance) {
      MultiUserService.instance = new MultiUserService();
    }
    return MultiUserService.instance;
  }

  /**
   * 从localStorage加载用户列表
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const storedUsers = localStorage.getItem(this.storage_key);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      }
      this.initialized = true;
    } catch (error) {
      console.error('从本地存储加载用户列表失败:', error);
      this.users = [];
    }
  }

  /**
   * 将用户列表保存到localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storage_key, JSON.stringify(this.users));
    } catch (error) {
      console.error('保存用户列表到本地存储失败:', error);
    }
  }

  /**
   * 获取所有活跃用户
   */
  public getUsers(): ActiveUser[] {
    if (!this.initialized) this.loadFromStorage();
    return [...this.users];
  }

  /**
   * 添加用户到登录列表
   * @param user 用户信息
   */
  public addUser(user: User): void {
    if (!this.initialized) this.loadFromStorage();
    
    // 检查用户是否已存在
    const existingUserIndex = this.users.findIndex(u => u.email === user.email);
    
    if (existingUserIndex >= 0) {
      // 更新现有用户的信息和活跃时间
      this.users[existingUserIndex] = {
        ...user,
        lastActive: new Date()
      };
    } else {
      // 添加新用户
      this.users.push({
        ...user,
        lastActive: new Date()
      });
    }
    
    this.saveToStorage();
  }

  /**
   * 从登录列表中移除用户
   * @param email 用户邮箱
   */
  public removeUser(email: string): void {
    if (!this.initialized) this.loadFromStorage();
    
    this.users = this.users.filter(user => user.email !== email);
    this.saveToStorage();
  }

  /**
   * 清除所有登录用户
   */
  public clearAllUsers(): void {
    this.users = [];
    this.saveToStorage();
  }

  /**
   * 更新用户活跃时间
   * @param email 用户邮箱
   */
  public updateUserActivity(email: string): void {
    if (!this.initialized) this.loadFromStorage();
    
    const userIndex = this.users.findIndex(user => user.email === email);
    if (userIndex >= 0) {
      this.users[userIndex].lastActive = new Date();
      this.saveToStorage();
    }
  }

  /**
   * 添加用户切换事件监听器
   * @param listener 事件处理函数
   */
  public addSwitchEventListener(listener: UserSwitchEventHandler): void {
    this.switchEventListeners.push(listener);
  }

  /**
   * 移除用户切换事件监听器
   * @param listener 事件处理函数
   */
  public removeSwitchEventListener(listener: UserSwitchEventHandler): void {
    this.switchEventListeners = this.switchEventListeners.filter(l => l !== listener);
  }

  /**
   * 触发用户切换事件
   * @param newUser 新的当前用户
   */
  public triggerUserSwitch(newUser: User): void {
    // 更新用户最后活跃时间
    this.updateUserActivity(newUser.email as string);
    
    // 触发所有注册的监听器
    for (const listener of this.switchEventListeners) {
      listener(newUser);
    }
    
    // 存储当前活跃用户ID到localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('current_active_user', newUser.email as string);
      } catch (error) {
        console.error('存储当前活跃用户ID失败:', error);
      }
    }
  }
}

export default MultiUserService.getInstance(); 