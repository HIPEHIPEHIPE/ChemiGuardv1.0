import React from 'react';

const Sidebar = () => {
  return (
    <div style={{
      width: 240,
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '20px 16px',
      boxSizing: 'border-box',
      height: '130vh'
    }}>
      <h3 style={{ marginBottom: 24 }}>🧪 ChemiGuard v1.0</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: 12 }}>관리자 대시보드</li>
        <li style={{ marginBottom: 12 }}>데이터 획득</li>
        <li style={{ marginBottom: 12 }}>데이터 관리</li>
        <li style={{ marginBottom: 12 }}>데이터 정제</li>
        <li style={{ marginBottom: 12 }}>데이터 가공</li>
        <li style={{ marginBottom: 12 }}>Q&A 생성</li>
        <li style={{ marginBottom: 12 }}>데이터 검수</li>
      </ul>
    </div>
  );
};

export default Sidebar;