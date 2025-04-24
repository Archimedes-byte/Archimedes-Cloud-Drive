'use client';

import React from 'react';
import { SearchInput } from './search-input';
import { SearchResults } from './search-results';
import { FileInfo } from '@/app/types';

interface SearchContainerProps {
  searchQuery: string;
  searchType: string;
  searchResults: FileInfo[];
  searchLoading: boolean;
  selectedFiles: string[];
  favoritedFileIds: string[];
  fileUpdateTrigger: number;
  enableRealTimeSearch: boolean;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  onSearchClear: () => void;
  onSearchClose: () => void;
  onRealTimeSearchChange: (enabled: boolean) => void;
  onFileClick: (file: FileInfo) => void;
  onFileSelect: (file: FileInfo, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleFavorite: (file: FileInfo, isFavorite: boolean) => void;
  onFileContextMenu?: (e: React.MouseEvent, file: FileInfo) => void;
}

export const SearchContainer: React.FC<SearchContainerProps> = ({
  searchQuery,
  searchType,
  searchResults,
  searchLoading,
  selectedFiles,
  favoritedFileIds,
  fileUpdateTrigger,
  enableRealTimeSearch,
  onSearchChange,
  onSearch,
  onSearchClear,
  onSearchClose,
  onRealTimeSearchChange,
  onFileClick,
  onFileSelect,
  onSelectAll,
  onDeselectAll,
  onToggleFavorite,
  onFileContextMenu
}) => {
  return (
    <div>
      {/* 搜索输入部分 */}
      <SearchInput 
        searchQuery={searchQuery}
        searchType={searchType}
        onSearchChange={onSearchChange}
        onSearch={onSearch}
        onClear={onSearchClear}
        onClose={onSearchClose}
        enableRealTimeSearch={enableRealTimeSearch}
        onRealTimeSearchChange={onRealTimeSearchChange}
      />
      
      {/* 搜索结果部分 */}
      <div style={{ marginTop: '20px' }}>
        <SearchResults 
          searchQuery={searchQuery}
          searchType={searchType}
          searchResults={searchResults}
          searchLoading={searchLoading}
          selectedFiles={selectedFiles}
          favoritedFileIds={favoritedFileIds}
          fileUpdateTrigger={fileUpdateTrigger}
          onFileClick={onFileClick}
          onFileSelect={onFileSelect}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          onToggleFavorite={onToggleFavorite}
          onFileContextMenu={onFileContextMenu}
          enableRealTimeSearch={enableRealTimeSearch}
        />
      </div>
    </div>
  );
}; 