import React from 'react';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const username = 'admin'; // 하드코딩

  // 경로에 따라 페이지명 설정
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return '관리자 대시보드';
      case '/data-acquisition':
        return '데이터 획득';
      case '/data-management':
        return '데이터 관리';
      case '/data-refining':
        return '데이터 정제';
      case '/data-processing':
        return '데이터 가공';
      case '/qa-generation':
        return 'Q&A 생성';
      case '/qa-validation':
        return 'Q&A 검수';
      // 필요한 페이지들 추가
      default:
        return '';
    }
  };

  return (
    <div style={{
      height: 64,
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
    }}>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>{getPageTitle()}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    {/* 알림 버튼 */}
        <button style={{
        backgroundColor: '#f3f4f6',
        border: '1px solid #d1d5db',
        borderRadius: 6,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        fontSize: 14,
        position: 'relative'
        }}>
        <span role="img" aria-label="notification">🔔</span>
        <span
            style={{
            backgroundColor: '#ef4444', // 빨간 배경
            color: 'white',
            borderRadius: '9999px',
            padding: '2px 6px',
            fontSize: 12,
            fontWeight: 'bold',
            lineHeight: 1,
            }}
        >
            1
        </span>
        </button>

        {/* 사용자 버튼 */}
        <button style={{
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          fontSize: 14
        }}>
          <span role="img" aria-label="user">👤</span>
          <span>{username}</span>
        </button>
      </div>
    </div>
  );
};

export default Header;