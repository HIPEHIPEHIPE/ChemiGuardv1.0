import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DataAcquisitionPage from './pages/DataAcquisition/DataAcquisitionPage';
import DataManagementPage from './pages/DataManagement/DataManagementPage';
import DataRefiningPage from './pages/DataRefining/DataRefiningPage';
import DataProcessingPage from './pages/DataProcessing/DataProcessingPage';
import QaGenerationPage from './pages/QaGeneration/QaGenerationPage';
import QaValidationPage from './pages/QaValidation/QaValidationPage';
import SignupSuccessPage from './pages/SignupSuccess/SignupSuccessPage';


import MainLayout from './layouts/MainLayout';

function App() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return (
    <Router>
      <Routes>
        {/* 로그인 페이지는 누구나 접근 가능 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup-success" element={<SignupSuccessPage />} />

        {/* 로그인된 사용자만 접근 가능한 메인 레이아웃 */}
        {isLoggedIn && (
          <Route path="/" element={<MainLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="data-acquisition" element={<DataAcquisitionPage />} />
            <Route path="data-management" element={<DataManagementPage />} />
            <Route path="data-refining" element={<DataRefiningPage />} />
            <Route path="data-processing" element={<DataProcessingPage />} />
            <Route path="qa-generation" element={<QaGenerationPage />} />
            <Route path="qa-validation" element={<QaValidationPage />} />
            {/* 추후 다른 페이지들도 여기에 추가 */}
          </Route>
        )}

        {/* 로그인 안 되어 있을 경우 모든 경로에서 로그인으로 리디렉션 */}
        {!isLoggedIn && <Route path="*" element={<Navigate to="/login" replace />} />}

        {/* 루트 경로에서 자동 분기 */}
        <Route
          path="/"
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;