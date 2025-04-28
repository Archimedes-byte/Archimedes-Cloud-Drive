import { useEffect } from 'react';

/**
 * 事件监听配置
 */
export interface EventListenerConfig<K extends keyof WindowEventMap> {
  /** 事件类型 */
  type: K;
  /** 事件处理函数 */
  listener: (event: WindowEventMap[K]) => void;
  /** 事件选项 */
  options?: boolean | AddEventListenerOptions;
  /** 是否启用 */
  enabled?: boolean;
  /** 事件目标，默认为window */
  target?: EventTarget;
}

/**
 * 键盘快捷键配置
 */
export interface KeyboardShortcutConfig {
  /** 按键码 */
  key: string;
  /** 是否需要按下Ctrl键 */
  ctrl?: boolean;
  /** 是否需要按下Shift键 */
  shift?: boolean;
  /** 是否需要按下Alt键 */
  alt?: boolean;
  /** 是否需要按下Meta键（Windows/Command键） */
  meta?: boolean;
  /** 事件处理函数 */
  handler: () => void;
  /** 是否阻止默认行为 */
  preventDefault?: boolean;
  /** 是否停止事件传播 */
  stopPropagation?: boolean;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 事件监听钩子
 * 统一管理多个事件监听器的添加和清理
 * 
 * @param listeners 事件监听配置数组
 */
export function useEventListeners<K extends keyof WindowEventMap>(
  listeners: EventListenerConfig<K>[]
): void {
  useEffect(() => {
    // 添加所有事件监听器
    const cleanupFunctions = listeners
      .filter(listener => listener.enabled !== false)
      .map(({ type, listener, options, target = window }) => {
        target.addEventListener(type, listener as EventListener, options);
        return () => target.removeEventListener(type, listener as EventListener, options);
      });

    // 返回清理函数，移除所有事件监听器
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [listeners]);
}

/**
 * 键盘快捷键监听钩子
 * 管理多个键盘快捷键
 * 
 * @param shortcuts 快捷键配置数组
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcutConfig[]): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts
        .filter(shortcut => shortcut.enabled !== false)
        .forEach(shortcut => {
          const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
          const ctrlMatches = !shortcut.ctrl || e.ctrlKey;
          const shiftMatches = !shortcut.shift || e.shiftKey;
          const altMatches = !shortcut.alt || e.altKey;
          const metaMatches = !shortcut.meta || e.metaKey;

          if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
            if (shortcut.preventDefault) {
              e.preventDefault();
            }
            if (shortcut.stopPropagation) {
              e.stopPropagation();
            }
            shortcut.handler();
          }
        });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
} 