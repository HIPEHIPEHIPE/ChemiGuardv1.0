import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUserStore } from '../../../stores/userStore';

const Sidebar = () => {
  const userInfo = useUserStore((state) => state.userInfo);
  const linkStyle = {
    display: 'block',
    padding: '8px 12px',
    marginBottom: '12px',
    borderRadius: '4px',
    textDecoration: 'none',
    color: 'white',
  };

  const activeStyle = {
    backgroundColor: '#374151',
  };

  return (
    <div style={{
      width: 240,
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '20px 16px',
      boxSizing: 'border-box',
      height: '100%'
    }}>
      <h3 style={{ marginBottom: 24 }}>🧪 ChemiGuard v1.0</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {userInfo?.role === 'admin' && (
          <li>
            <NavLink
              to="/dashboard"
              style={({ isActive }) => ({
                ...linkStyle,
                ...(isActive ? activeStyle : {})
              })}
            >
              관리자 대시보드
            </NavLink>
          </li>
        )}
        <li>
          <NavLink
            to="/data-acquisition"
            style={({ isActive }) => ({
              ...linkStyle,
              ...(isActive ? activeStyle : {})
            })}
          >
            데이터 획득
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/data-management"
            style={({ isActive }) => ({
              ...linkStyle,
              ...(isActive ? activeStyle : {})
            })}
          >
            데이터 관리
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/data-refining"
            style={({ isActive }) => ({
              ...linkStyle,
              ...(isActive ? activeStyle : {})
            })}
          >
            데이터 정제
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/data-processing"
            style={({ isActive }) => ({
              ...linkStyle,
              ...(isActive ? activeStyle : {})
            })}
          >
            데이터 가공
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/qa-generation"
            style={({ isActive }) => ({
              ...linkStyle,
              ...(isActive ? activeStyle : {})
            })}
          >
            Q&amp;A 생성
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/qa-validation"
            style={({ isActive }) => ({
              ...linkStyle,
              ...(isActive ? activeStyle : {})
            })}
          >
            데이터 검수
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
