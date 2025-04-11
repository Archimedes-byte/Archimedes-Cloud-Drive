import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { FileInfo, FolderPath, FileType, SortOrder } from '@/app/types';

// 定义应用状态接口
export interface AppState {
  // 文件管理状态
  files: {
    items: FileInfo[];
    isLoading: boolean;
    error: string | null;
    currentFolderId: string | null;
    folderPath: FolderPath[];
    selectedFileType: FileType | null;
    selectedFiles: string[];
    sortOrder: SortOrder;
  };
  
  // UI状态
  ui: {
    sidebarVisible: boolean;
    myFilesExpanded: boolean;
    quickAccessExpanded: boolean;
    isUploadModalOpen: boolean;
    isFolderUploadModalOpen: boolean;
    showUploadDropdown: boolean;
    showSearchView: boolean;
    isCreatingFolder: boolean;
    showThemePanel: boolean;
  };
  
  // 预览和编辑状态
  preview: {
    previewFile: FileInfo | null;
    fileToRename: FileInfo | null;
    isRenameModalOpen: boolean;
    editingFile: FileInfo | null;
    editingName: string;
    editingTags: string[];
  };
  
  // 搜索状态
  search: {
    query: string;
    results: FileInfo[];
    isLoading: boolean;
    error: string | null;
    type: FileType | null;
    enableRealTimeSearch: boolean;
    debounceDelay: number;
  };
  
  // 用户状态
  user: {
    profile: any | null;
    isLoading: boolean;
    error: string | null;
  };

  // 上传状态
  upload: {
    isUploading: boolean;
    uploadProgress: number;
    uploadError: string | null;
    currentFiles: File[];
    uploadedFiles: FileInfo[];
  };
}

// 定义所有可能的操作类型
export type ActionType = 
  // 文件操作
  | { type: 'SET_FILES', payload: FileInfo[] }
  | { type: 'SET_FILES_LOADING', payload: boolean }
  | { type: 'SET_FILES_ERROR', payload: string | null }
  | { type: 'SET_CURRENT_FOLDER', payload: string | null }
  | { type: 'SET_FOLDER_PATH', payload: FolderPath[] }
  | { type: 'SET_SELECTED_FILE_TYPE', payload: FileType | null }
  | { type: 'SET_SELECTED_FILES', payload: string[] }
  | { type: 'SET_SORT_ORDER', payload: SortOrder }
  
  // UI操作
  | { type: 'SET_SIDEBAR_VISIBLE', payload: boolean }
  | { type: 'SET_MY_FILES_EXPANDED', payload: boolean }
  | { type: 'SET_QUICK_ACCESS_EXPANDED', payload: boolean }
  | { type: 'SET_UPLOAD_MODAL_OPEN', payload: boolean }
  | { type: 'SET_FOLDER_UPLOAD_MODAL_OPEN', payload: boolean }
  | { type: 'SET_SHOW_UPLOAD_DROPDOWN', payload: boolean }
  | { type: 'SET_SHOW_SEARCH_VIEW', payload: boolean }
  | { type: 'SET_IS_CREATING_FOLDER', payload: boolean }
  | { type: 'SET_SHOW_THEME_PANEL', payload: boolean }
  
  // 预览和编辑操作
  | { type: 'SET_PREVIEW_FILE', payload: FileInfo | null }
  | { type: 'SET_FILE_TO_RENAME', payload: FileInfo | null }
  | { type: 'SET_IS_RENAME_MODAL_OPEN', payload: boolean }
  | { type: 'SET_EDITING_FILE', payload: FileInfo | null }
  | { type: 'SET_EDITING_NAME', payload: string }
  | { type: 'SET_EDITING_TAGS', payload: string[] }
  
  // 搜索操作
  | { type: 'SET_SEARCH_QUERY', payload: string }
  | { type: 'SET_SEARCH_RESULTS', payload: FileInfo[] }
  | { type: 'SET_SEARCH_LOADING', payload: boolean }
  | { type: 'SET_SEARCH_ERROR', payload: string | null }
  | { type: 'SET_SEARCH_TYPE', payload: FileType | null }
  | { type: 'SET_ENABLE_REAL_TIME_SEARCH', payload: boolean }
  | { type: 'SET_DEBOUNCE_DELAY', payload: number }
  
  // 用户操作
  | { type: 'SET_USER_PROFILE', payload: any }
  | { type: 'SET_USER_LOADING', payload: boolean }
  | { type: 'SET_USER_ERROR', payload: string | null }
  
  // 上传操作
  | { type: 'SET_IS_UPLOADING', payload: boolean }
  | { type: 'SET_UPLOAD_PROGRESS', payload: number }
  | { type: 'SET_UPLOAD_ERROR', payload: string | null }
  | { type: 'SET_CURRENT_FILES', payload: File[] }
  | { type: 'SET_UPLOADED_FILES', payload: FileInfo[] }
  | { type: 'CLEAR_UPLOAD_STATE', payload: void };

// 初始状态
const initialState: AppState = {
  files: {
    items: [],
    isLoading: false,
    error: null,
    currentFolderId: null,
    folderPath: [],
    selectedFileType: null,
    selectedFiles: [],
    sortOrder: { field: 'createdAt', direction: 'desc' }
  },
  ui: {
    sidebarVisible: true,
    myFilesExpanded: true,
    quickAccessExpanded: true,
    isUploadModalOpen: false,
    isFolderUploadModalOpen: false,
    showUploadDropdown: false,
    showSearchView: false,
    isCreatingFolder: false,
    showThemePanel: false
  },
  preview: {
    previewFile: null,
    fileToRename: null,
    isRenameModalOpen: false,
    editingFile: null,
    editingName: '',
    editingTags: []
  },
  search: {
    query: '',
    results: [],
    isLoading: false,
    error: null,
    type: null,
    enableRealTimeSearch: true,
    debounceDelay: 500
  },
  user: {
    profile: null,
    isLoading: false,
    error: null
  },
  upload: {
    isUploading: false,
    uploadProgress: 0,
    uploadError: null,
    currentFiles: [],
    uploadedFiles: []
  }
};

// 状态减速器
function appReducer(state: AppState, action: ActionType): AppState {
  switch (action.type) {
    // 文件操作
    case 'SET_FILES':
      return { ...state, files: { ...state.files, items: action.payload } };
    case 'SET_FILES_LOADING':
      return { ...state, files: { ...state.files, isLoading: action.payload } };
    case 'SET_FILES_ERROR':
      return { ...state, files: { ...state.files, error: action.payload } };
    case 'SET_CURRENT_FOLDER':
      return { ...state, files: { ...state.files, currentFolderId: action.payload } };
    case 'SET_FOLDER_PATH':
      return { ...state, files: { ...state.files, folderPath: action.payload } };
    case 'SET_SELECTED_FILE_TYPE':
      return { ...state, files: { ...state.files, selectedFileType: action.payload } };
    case 'SET_SELECTED_FILES':
      return { ...state, files: { ...state.files, selectedFiles: action.payload } };
    case 'SET_SORT_ORDER':
      return { ...state, files: { ...state.files, sortOrder: action.payload } };
      
    // UI操作
    case 'SET_SIDEBAR_VISIBLE':
      return { ...state, ui: { ...state.ui, sidebarVisible: action.payload } };
    case 'SET_MY_FILES_EXPANDED':
      return { ...state, ui: { ...state.ui, myFilesExpanded: action.payload } };
    case 'SET_QUICK_ACCESS_EXPANDED':
      return { ...state, ui: { ...state.ui, quickAccessExpanded: action.payload } };
    case 'SET_UPLOAD_MODAL_OPEN':
      return { ...state, ui: { ...state.ui, isUploadModalOpen: action.payload } };
    case 'SET_FOLDER_UPLOAD_MODAL_OPEN':
      return { ...state, ui: { ...state.ui, isFolderUploadModalOpen: action.payload } };
    case 'SET_SHOW_UPLOAD_DROPDOWN':
      return { ...state, ui: { ...state.ui, showUploadDropdown: action.payload } };
    case 'SET_SHOW_SEARCH_VIEW':
      return { ...state, ui: { ...state.ui, showSearchView: action.payload } };
    case 'SET_IS_CREATING_FOLDER':
      return { ...state, ui: { ...state.ui, isCreatingFolder: action.payload } };
    case 'SET_SHOW_THEME_PANEL':
      return { ...state, ui: { ...state.ui, showThemePanel: action.payload } };
      
    // 预览和编辑操作
    case 'SET_PREVIEW_FILE':
      return { ...state, preview: { ...state.preview, previewFile: action.payload } };
    case 'SET_FILE_TO_RENAME':
      return { ...state, preview: { ...state.preview, fileToRename: action.payload } };
    case 'SET_IS_RENAME_MODAL_OPEN':
      return { ...state, preview: { ...state.preview, isRenameModalOpen: action.payload } };
    case 'SET_EDITING_FILE':
      return { ...state, preview: { ...state.preview, editingFile: action.payload } };
    case 'SET_EDITING_NAME':
      return { ...state, preview: { ...state.preview, editingName: action.payload } };
    case 'SET_EDITING_TAGS':
      return { ...state, preview: { ...state.preview, editingTags: action.payload } };
      
    // 搜索操作
    case 'SET_SEARCH_QUERY':
      return { ...state, search: { ...state.search, query: action.payload } };
    case 'SET_SEARCH_RESULTS':
      return { ...state, search: { ...state.search, results: action.payload } };
    case 'SET_SEARCH_LOADING':
      return { ...state, search: { ...state.search, isLoading: action.payload } };
    case 'SET_SEARCH_ERROR':
      return { ...state, search: { ...state.search, error: action.payload } };
    case 'SET_SEARCH_TYPE':
      return { ...state, search: { ...state.search, type: action.payload } };
    case 'SET_ENABLE_REAL_TIME_SEARCH':
      return { ...state, search: { ...state.search, enableRealTimeSearch: action.payload } };
    case 'SET_DEBOUNCE_DELAY':
      return { ...state, search: { ...state.search, debounceDelay: action.payload } };
      
    // 用户操作
    case 'SET_USER_PROFILE':
      return { ...state, user: { ...state.user, profile: action.payload } };
    case 'SET_USER_LOADING':
      return { ...state, user: { ...state.user, isLoading: action.payload } };
    case 'SET_USER_ERROR':
      return { ...state, user: { ...state.user, error: action.payload } };
      
    // 上传操作
    case 'SET_IS_UPLOADING':
      return { ...state, upload: { ...state.upload, isUploading: action.payload } };
    case 'SET_UPLOAD_PROGRESS':
      return { ...state, upload: { ...state.upload, uploadProgress: action.payload } };
    case 'SET_UPLOAD_ERROR':
      return { ...state, upload: { ...state.upload, uploadError: action.payload } };
    case 'SET_CURRENT_FILES':
      return { ...state, upload: { ...state.upload, currentFiles: action.payload } };
    case 'SET_UPLOADED_FILES':
      return { ...state, upload: { ...state.upload, uploadedFiles: action.payload } };
    case 'CLEAR_UPLOAD_STATE':
      return { 
        ...state, 
        upload: { 
          isUploading: false,
          uploadProgress: 0,
          uploadError: null,
          currentFiles: [],
          uploadedFiles: []
        } 
      };
      
    default:
      return state;
  }
}

// 创建AppStateContext
const AppStateContext = createContext<{
  state: AppState;
  dispatch: Dispatch<ActionType>;
}>({
  state: initialState,
  dispatch: () => null,
});

// AppStateProvider组件
export const AppStateProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

// 自定义hook用于访问AppState
export const useAppState = () => useContext(AppStateContext); 