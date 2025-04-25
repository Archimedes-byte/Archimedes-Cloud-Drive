'use client';

import React from 'react';
import { Spin } from 'antd';
import { Zap, X, Download } from 'lucide-react';
import { AntFileList } from '../file-list/AntFileList';
import { FileInfo } from '@/app/types';

interface SearchResultsProps {
  searchQuery: string;
  searchType: string;
  searchResults: FileInfo[];
  searchLoading: boolean;
  selectedFiles: string[];
  favoritedFileIds: string[];
  fileUpdateTrigger: number;
  onFileClick: (file: FileInfo) => void;
  onFileSelect: (file: FileInfo, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleFavorite: (file: FileInfo, isFavorite: boolean) => void;
  onFileContextMenu?: (e: React.MouseEvent, file: FileInfo) => void;
  enableRealTimeSearch?: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchQuery,
  searchType,
  searchResults,
  searchLoading,
  selectedFiles,
  favoritedFileIds,
  fileUpdateTrigger,
  onFileClick,
  onFileSelect,
  onSelectAll,
  onDeselectAll,
  onToggleFavorite,
  onFileContextMenu,
  enableRealTimeSearch = false
}) => {
  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginTop: '12px',
        fontSize: '12px',
        color: '#666',
        justifyContent: 'space-between',
      }}>
        <div>
          {enableRealTimeSearch && (
            <>
              <Zap size={14} style={{ marginRight: '6px', color: '#3490dc' }} />
              实时搜索已启用，输入时自动显示结果
            </>
          )}
        </div>
      </div>
    
      {/* 搜索结果区域 */}
      {searchLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{
            width: '40px',
            height: '40px',
            margin: '0 auto 20px',
            border: '3px solid rgba(52, 144, 220, 0.2)',
            borderTop: '3px solid #3490dc',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}></div>
          <p>正在搜索，请稍候...</p>
        </div>
      ) : searchResults.length > 0 ? (
        <>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
          }}>
            <div style={{
              backgroundColor: 'rgba(52, 144, 220, 0.1)',
              color: '#3490dc',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '14px',
            }}>
              找到 {searchResults.length} 个结果
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {onSelectAll && onDeselectAll && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={onSelectAll}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      color: '#5e6c84',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Download size={12} />
                    全选
                  </button>
                  <button
                    onClick={onDeselectAll}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      color: '#5e6c84',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <X size={12} />
                    取消选择
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <AntFileList 
            files={searchResults}
            selectedFiles={selectedFiles}
            onFileClick={onFileClick}
            onFileSelect={onFileSelect}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            areAllSelected={false}
            showCheckboxes={true}
            favoritedFileIds={favoritedFileIds}
            onToggleFavorite={onToggleFavorite}
            fileUpdateTrigger={fileUpdateTrigger}
            onFileContextMenu={onFileContextMenu}
            isLoading={false}
          />
        </>
      ) : searchQuery && !searchLoading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 0',
          color: '#888',
          backgroundColor: 'rgba(247, 250, 252, 0.5)',
          borderRadius: '12px',
          border: '1px dashed #e2e8f0',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            lineHeight: '60px',
            fontSize: '24px',
            margin: '0 auto 15px',
            backgroundColor: 'rgba(226, 232, 240, 0.5)',
            borderRadius: '50%',
          }}>
            🔍
          </div>
          <p>未找到相关{searchType === 'name' ? '文件' : '标签'}</p>
          <p style={{ fontSize: '14px', color: '#999', maxWidth: '300px', margin: '10px auto' }}>
            尝试使用不同的关键词{searchType === 'tag' ? '或检查标签拼写' : '或检查文件名拼写'}
          </p>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 0',
          color: '#888',
          backgroundColor: 'rgba(247, 250, 252, 0.5)',
          borderRadius: '12px',
          border: '1px dashed #e2e8f0',
        }}>
          <p>请输入关键词开始搜索</p>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}; 