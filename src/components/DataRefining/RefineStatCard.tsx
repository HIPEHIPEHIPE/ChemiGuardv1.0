import React, { CSSProperties } from 'react';

interface RefineStatCardProps {
  number: string;
  label: string;
  color?: string;
}

const statCardBaseStyle: CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const statNumberStyle = (color?: string): CSSProperties => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: color || '#1f2937',
  marginBottom: '5px',
});

const statLabelStyle: CSSProperties = {
  fontSize: '0.9rem',
  color: '#6b7280',
};

const RefineStatCard: React.FC<RefineStatCardProps> = ({ number, label, color }) => (
  <div style={statCardBaseStyle}>
    <div style={statNumberStyle(color)}>{number}</div>
    <div style={statLabelStyle}>{label}</div>
  </div>
);

export default RefineStatCard;
