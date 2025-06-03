import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';

const MainLayout = () => {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1, padding: '24px', backgroundColor: '#f9fafb' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;