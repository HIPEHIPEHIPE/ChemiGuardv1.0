import React, { CSSProperties } from 'react';

export const detailTextStyle: CSSProperties = {
  fontSize: '12px',
  marginBottom: '2px',
};

export const detailHighlightStyle = (type: 'error' | 'warning' | 'suggestion'): CSSProperties => {
  if (type === 'error') return { color: '#dc2626' };
  if (type === 'warning') return { color: '#d97706' };
  if (type === 'suggestion') return { color: '#059669' };
  return {};
};

export const btnStyle = (variant: 'primary' | 'secondary' | 'warning', customStyle?: CSSProperties): CSSProperties => {
  let base: CSSProperties = {
    border: 'none',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    marginRight: '5px',
    color: 'white',
  };
  if (variant === 'primary') base.background = '#10b981';
  else if (variant === 'secondary') base.background = '#6b7280';
  else if (variant === 'warning') base.background = '#f59e0b';
  return { ...base, ...customStyle };
};

// 이슈 타입별 아이콘 반환 함수
export const getIssueIcon = (type: 'error' | 'warning' | 'suggestion') => {
  switch (type) {
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'suggestion': return '✅';
    default: return '📋';
  }
};
