import React from 'react';

interface StyledButtonProps {
  children: React.ReactNode;
  bgColor: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const StyledButton: React.FC<StyledButtonProps> = ({ 
  children, 
  bgColor, 
  onClick, 
  type = 'button',
  disabled = false 
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      backgroundColor: disabled ? '#9ca3af' : bgColor,
      color: '#fff',
      fontSize: '14px',
      fontWeight: 'bold',
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      marginRight: '8px'
    }}
  >
    {children}
  </button>
);

export default StyledButton;
