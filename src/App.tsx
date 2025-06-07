
import { useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { useUserStore } from './stores/userStore';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DataAcquisitionPage from './pages/DataAcquisition/DataAcquisitionPage';
import DataManagementPage from './pages/DataManagement/DataManagementPage';
import DataRefiningPage from './pages/DataRefining/DataRefiningPage';
import DataProcessingPage from './pages/DataProcessing/DataProcessingPage';
import QaGenerationPage from './pages/QaGeneration/QaGenerationPage';
import QaValidationPage from './pages/QaValidation/QaValidationPage';
import MainLayout from './layouts/MainLayout';

function App() {
  const userInfo = useUserStore((state) => state.userInfo);
  const setUserInfo = useUserStore((state) => state.setUserInfo);
  const isLoggedIn = !!userInfo;

  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session fetch error:', sessionError);
        return;
      }

      if (session?.user) {
        const { user } = session;
        console.log('Session user:', user);

        const { data: worker, error: workerError } = await supabase
          .from('workers')
          .select('name, organization, role')
          .eq('uuid', user.id)
          .single();

        if (workerError) {
          console.error('Worker fetch error:', workerError);
          return;
        }

         if (worker && worker.name && worker.organization && worker.role) {
          console.log('Restoring user info:', {
            id: user.id,
            email: user.email ?? '',
            name: worker.name,
            organization: worker.organization,
            role: worker.role,
          });

          setUserInfo({
            id: user.id,
            email: user.email ?? '',
            name: worker.name,
            organization: worker.organization,
            role: worker.role,
          });
        }
      }
    };
    console.log('[App.tsx] Rendering with userInfo:', userInfo);
    restoreSession();
  }, [setUserInfo]);

  return (
<Router>
      <Routes>
        {/* 로그인 페이지 */}
        <Route 
          path="/login" 
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />

        {/* 보호된 메인 영역 */}
        <Route 
          path="/" 
          element={isLoggedIn ? <MainLayout /> : <Navigate to="/login" replace />}
        >
          {/* MainLayout의 기본 페이지를 대시보드로 설정 */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* 여기서 직접 분기 처리 */}
          <Route 
            path="dashboard" 
            element={
              userInfo?.role === 'admin' 
                ? <DashboardPage /> 
                : <Navigate to="/data-acquisition" replace /> // 관리자가 아니면 다른 곳으로 리디렉션
            } 
          />
          
          <Route path="data-acquisition" element={<DataAcquisitionPage />} />
          <Route path="data-management" element={<DataManagementPage />} />
          <Route path="data-refining" element={<DataRefiningPage />} />
          <Route path="data-processing" element={<DataProcessingPage />} />
          <Route path="qa-generation" element={<QaGenerationPage />} />
          <Route path="qa-validation" element={<QaValidationPage />} />
          {/* 추후 다른 페이지들도 여기에 추가 */}
        </Route>

        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;