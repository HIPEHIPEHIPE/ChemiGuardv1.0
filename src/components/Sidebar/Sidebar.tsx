import React from 'react';

const Sidebar = () => {
  return (
    <div style={{
      width: 240,
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '20px 16px',
      boxSizing: 'border-box',
      height: '100vh'
    }}>
      <h3 style={{ marginBottom: 24 }}>🧪 ChemiGuard</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: 12 }}>대시보드</li>
        <li style={{ marginBottom: 12 }}>데이터 수집</li>
        <li style={{ marginBottom: 12 }}>데이터 관리</li>
        <li style={{ marginBottom: 12 }}>데이터 정제</li>
        <li style={{ marginBottom: 12 }}>QA 생성</li>
        <li style={{ marginBottom: 12 }}>QA 검수</li>
      </ul>
    </div>
  );
};

export default Sidebar;