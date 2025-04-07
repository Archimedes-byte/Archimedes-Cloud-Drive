/* SearchView 主题相关样式 */

.search-view {
  width: 100%;
  padding: 1.5rem;
  background-color: var(--theme-card, white);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-header h2 {
  font-size: 1.5rem;
  margin-bottom: 1.25rem;
  color: var(--theme-text, #1a202c);
  font-weight: 600;
  position: relative;
  padding-bottom: 0.75rem;
}

.search-header h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background: var(--theme-primary, #3b82f6);
  background: linear-gradient(to right, var(--theme-primary, #3b82f6), var(--theme-accent, #60a5fa));
  border-radius: 3px;
}

.search-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: rgba(var(--theme-background-rgb, 249, 250, 252), 0.5);
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid rgba(var(--theme-border-rgb, 229, 231, 235), 0.5);
}

.search-type-select {
  padding: 0.625rem 1rem;
  border: 1px solid var(--theme-border, #e2e8f0);
  border-radius: 6px;
  background-color: var(--theme-card, white);
  color: var(--theme-text, #4a5568);
  width: 100%;
  max-width: 220px;
  font-size: 0.95rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234a5568'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.search-type-select:focus {
  outline: none;
  border-color: var(--theme-primary, #4299e1);
  box-shadow: 0 0 0 3px rgba(var(--theme-primary-rgb, 66, 153, 225), 0.15);
}

.search-input-group input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--theme-border, #e2e8f0);
  border-right: none;
  border-radius: 6px 0 0 6px;
  outline: none;
  font-size: 0.95rem;
  color: var(--theme-text, #2d3748);
  transition: all 0.2s;
  background-color: var(--theme-card, white);
}

.search-input-group input:focus {
  border-color: var(--theme-primary, #4299e1);
  box-shadow: 0 0 0 3px rgba(var(--theme-primary-rgb, 66, 153, 225), 0.15);
}

.search-input-group button {
  background: var(--theme-primary, #3b82f6);
  background: linear-gradient(to right, var(--theme-primary, #3b82f6), var(--theme-accent, #60a5fa));
  color: white;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(var(--theme-primary-rgb, 59, 130, 246), 0.5);
}

.search-input-group button:hover {
  background: var(--theme-secondary, #2563eb);
  background: linear-gradient(to right, var(--theme-secondary, #2563eb), var(--theme-primary, #4f46e5));
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(var(--theme-primary-rgb, 59, 130, 246), 0.3);
}

.error-message {
  background-color: var(--theme-error-light, #fee2e2);
  color: var(--theme-error, #b91c1c);
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  border-left: 4px solid var(--theme-error, #ef4444);
}

.loading {
  color: var(--theme-text-secondary, #4a5568);
}

.results-count::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: var(--theme-primary, #3b82f6);
  border-radius: 50%;
}

.file-table th {
  background-color: rgba(var(--theme-background-rgb, 248, 250, 252), 0.8);
  color: var(--theme-text, #475569);
}

.file-row:hover {
  background-color: rgba(var(--theme-background-rgb, 248, 250, 252), 0.8);
  box-shadow: 0 2px 5px rgba(var(--theme-border-rgb, 0, 0, 0), 0.05);
}

.file-type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: rgba(var(--theme-primary-rgb, 240, 245, 255), 0.2);
  border-radius: 8px;
  color: var(--theme-primary, #3b82f6);
}

.file-name {
  color: var(--theme-text, #1e293b);
}

.tag-badge {
  background-color: rgba(var(--theme-primary-rgb, 229, 237, 255), 0.2);
  color: var(--theme-primary, #3b82f6);
  font-size: 0.75rem;
  padding: 3px 8px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.tag-badge:hover {
  background-color: rgba(var(--theme-primary-rgb, 219, 234, 254), 0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state {
  background-color: rgba(var(--theme-background-rgb, 248, 250, 252), 0.8);
  border: 1px dashed rgba(var(--theme-text-rgb, 203, 213, 225), 0.3);
  color: var(--theme-text-secondary, #64748b);
}

.empty-icon {
  color: var(--theme-text-tertiary, #94a3b8);
}

.empty-hint {
  color: var(--theme-text-tertiary, #94a3b8);
}

/* 响应式样式 */
@media (min-width: 640px) {
  .search-controls {
    flex-direction: row;
    align-items: center;
  }
} 