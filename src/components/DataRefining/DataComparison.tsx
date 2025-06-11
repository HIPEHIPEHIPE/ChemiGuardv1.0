import React, { CSSProperties } from 'react';

const sectionCardStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  marginBottom: '20px',
};

const DataComparison: React.FC = () => {
  return (
    <div style={sectionCardStyle}>
      <div style={{padding: '20px'}}>
        <h3>데이터 검수</h3>
        <p>데이터 검수 및 비교 기능이 구현될 예정입니다.</p>
      </div>
    </div>
  );
};

export default DataComparison;
