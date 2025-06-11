import React, { CSSProperties } from 'react';

interface IssueCardProps {
  type: 'error' | 'warning' | 'suggestion';
  title: string;
  content: React.ReactNode;
  actions: React.ReactNode;
}

const issueCardStyle = (type: 'error' | 'warning' | 'suggestion'): CSSProperties => {
  let baseStyle: CSSProperties = {
    border: '1px solid',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '10px',
  };
  if (type === 'error') return { ...baseStyle, background: '#fee2e2', borderColor: '#fecaca' };
  if (type === 'warning') return { ...baseStyle, background: '#fef3c7', borderColor: '#fde68a' };
  if (type === 'suggestion') return { ...baseStyle, background: '#d1fae5', borderColor: '#a7f3d0' };
  return baseStyle;
};

const issueTitleStyle = (type: 'error' | 'warning' | 'suggestion'): CSSProperties => {
  let baseStyle: CSSProperties = { fontWeight: 'bold', marginBottom: '5px' };
  if (type === 'error') return { ...baseStyle, color: '#dc2626' };
  if (type === 'warning') return { ...baseStyle, color: '#d97706' };
  if (type === 'suggestion') return { ...baseStyle, color: '#059669' };
  return baseStyle;
};

const issueContentStyle = (type: 'error' | 'warning' | 'suggestion'): CSSProperties => {
  let baseStyle: CSSProperties = { fontSize: '14px', marginBottom: '10px' };
  if (type === 'error') return { ...baseStyle, color: '#7f1d1d' };
  if (type === 'warning') return { ...baseStyle, color: '#92400e' };
  if (type === 'suggestion') return { ...baseStyle, color: '#065f46' };
  return baseStyle;
};

const issueActionsStyle: CSSProperties = {
  marginTop: '10px',
};

const IssueCard: React.FC<IssueCardProps> = ({ type, title, content, actions }) => (
  <div style={issueCardStyle(type)}>
    <div style={issueTitleStyle(type)}>{title}</div>
    <div style={issueContentStyle(type)}>{content}</div>
    <div style={issueActionsStyle}>{actions}</div>
  </div>
);

export default IssueCard;
