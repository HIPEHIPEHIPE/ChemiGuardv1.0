import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';

const MainLayout = () => {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* 사이드바: 고정 너비 + 전체 높이 + 스크롤 */}
      <div style={{
        width: '240px',
        height: '100vh',
        backgroundColor: '#1f2937',
        overflowY: 'auto',
        position: 'relative'
      }}>
        <Sidebar />
      </div>

      {/* 메인 영역: 헤더 + 페이지 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        <div style={{ flex: 1, padding: '24px', backgroundColor: '#f9fafb', overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;