'use client';

import React from 'react';
import { Button, Switch } from 'antd';
import { Search, Tag as TagIcon, X } from 'lucide-react';

interface SearchInputProps {
  searchQuery: string;
  searchType: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onClose: () => void;
  enableRealTimeSearch: boolean;
  onRealTimeSearchChange: (enabled: boolean) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  searchQuery,
  searchType,
  onSearchChange,
  onSearch,
  onClear,
  onClose,
  enableRealTimeSearch,
  onRealTimeSearchChange
}) => {
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 0' 
      }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {searchType === 'name' ? (
            <Search size={24} style={{ color: 'var(--theme-primary, #3b82f6)' }} />
          ) : (
            <TagIcon size={24} style={{ color: 'var(--theme-primary, #3b82f6)' }} />
          )}
          {searchType === 'name' ? '搜索文件' : '标签搜索'}
        </h2>
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(247, 250, 252, 0.9)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            color: '#5e6c84',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>
      </div>
      
      {/* 搜索输入区域 */}
      <div style={{
        marginBottom: '20px',
        backgroundColor: 'rgba(247, 250, 252, 0.5)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(226, 232, 240, 0.5)',
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ 
            display: 'flex',
            flexGrow: 1,
            position: 'relative'
          }}>
            <input
              type="text"
              placeholder={searchType === 'name' ? "输入文件名搜索..." : "输入标签搜索..."}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                padding: '10px 16px 10px 40px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '16px',
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: 'white',
              }}
            />
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8'
            }}>
              <Search size={18} />
            </div>
            {searchQuery && (
              <div 
                onClick={onClear}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '50%',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} />
              </div>
            )}
          </div>
          
          <Button 
            type="primary"
            onClick={onSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '42px',
              borderRadius: '8px',
              padding: '0 16px',
            }}
          >
            搜索
          </Button>
        </div>
        
        <div style={{
          display: 'flex',
          marginTop: '12px',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Switch 
              size="small" 
              checked={enableRealTimeSearch}
              onChange={onRealTimeSearchChange}
            />
            <span style={{ fontSize: '14px', color: '#64748b' }}>实时搜索</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 