// src/pages/DataRefining/DataRefiningPage.tsx
import React, { useState, useEffect, CSSProperties } from 'react';
import { 
  getRefinementStats, 
  getProductsForRefinement,
  applyAutoRefinement,
  RefinementStats,
  ProductWithIngredients,
  RefinementIssue
} from '../../api/dataRefinement';
import { useUserStore } from '../../stores/userStore';
import { uploadTestDataToDB, checkCurrentDataStatus, testDatabaseConnection } from '../../utils/uploadTestData';

// 컴포넌트 imports
import RefinementOverview from '../../components/DataRefining/RefinementOverview';
import DataComparison from '../../components/DataRefining/DataComparison';
import FinalizedData from '../../components/DataRefining/FinalizedData';

// --- 스타일 객체 정의 ---

const pageWrapperStyle: CSSProperties = {
  padding: '24px',
  backgroundColor: '#f9fafb',
};

const sectionCardStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  marginBottom: '20px',
};

const tabContainerStyle: CSSProperties = {
  ...sectionCardStyle,
  padding: '20px 20px 0 20px',
  borderBottom: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const tabGroupStyle: CSSProperties = {
  display: 'flex',
};

const tabButtonStyle = (isActive: boolean): CSSProperties => ({
  padding: '10px 15px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: isActive ? 'bold' : 'normal',
  color: isActive ? '#3b82f6' : '#6b7280',
  borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
  marginBottom: '-1px',
});

const adminButtonStyle: CSSProperties = {
  padding: '8px 12px',
  backgroundColor: '#10b981',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  marginLeft: '10px',
};

const tabContentStyle = (isActive: boolean): CSSProperties => ({
  display: isActive ? 'block' : 'none',
});

const errorMessageStyle: CSSProperties = {
  padding: '20px',
  backgroundColor: '#fee2e2',
  borderRadius: '8px',
  border: '1px solid #fecaca',
  color: '#dc2626',
  textAlign: 'center',
  marginBottom: '20px'
};

const testDataPanelStyle: CSSProperties = {
  padding: '15px',
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  border: '1px solid #0ea5e9',
  marginBottom: '20px',
};

const infoBoxStyle: CSSProperties = {
  padding: '16px',
  backgroundColor: '#dbeafe',
  borderRadius: '8px',
  border: '1px solid #3b82f6',
  marginBottom: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
};

// --- 컴포넌트 정의 ---

interface TabInfo {
  id: string;
  label: string;
}

const DataRefiningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('data-refining-tab-content-processing');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RefinementStats | null>(null);
  const [products, setProducts] = useState<ProductWithIngredients[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [uploadingTest, setUploadingTest] = useState(false);
  const userInfo = useUserStore((state) => state.userInfo);

  // 자동 정제 탭 제거 - PDF 분석은 데이터 획득에서 수행
  const tabs: TabInfo[] = [
    { id: 'data-refining-tab-content-processing', label: '데이터 정제' },
    { id: 'comparison', label: '검수' },
    { id: 'finalized', label: '완료' },
  ];

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadRefinementData();
  }, []);

  const loadRefinementData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 정제 데이터 로딩 시작...');
      
      // 통계 데이터 로드 (에러가 있어도 기본값으로 계속 진행)
      const statsResult = await getRefinementStats();
      if (statsResult.error) {
        console.error('⚠️ 통계 데이터 오류 (기본값 사용):', statsResult.error);
        setStats({
          total_products: 0,
          total_ingredients: 0,
          error_count: 0,
          warning_count: 0,
          suggestion_count: 0,
          completed_count: 0
        });
      } else {
        setStats(statsResult.data);
      }
      
      // 제품 데이터 로드 (에러가 있어도 빈 배열로 계속 진행)
      const productsResult = await getProductsForRefinement(50, 0, ['collected', 'refining']);
      if (productsResult.error) {
        console.error('⚠️ 제품 데이터 오류 (빈 배열 사용):', productsResult.error);
        setProducts([]);
      } else {
        setProducts(productsResult.data);
      }
      
      // 결과 로깅
      const finalStats = statsResult.data || { total_products: 0, total_ingredients: 0, error_count: 0, warning_count: 0, suggestion_count: 0, completed_count: 0 };
      const finalProducts = productsResult.data || [];
      const totalIssues = finalProducts.reduce((sum, product) => 
        sum + product.ingredients.reduce((ingredientSum, ingredient) => 
          ingredientSum + (ingredient.issues?.length || 0), 0), 0);
      
      console.log('✅ 정제 데이터 로딩 완료', {
        stats: finalStats,
        products: finalProducts.length,
        totalIssues,
        errors: {
          statsError: !!statsResult.error,
          productsError: !!productsResult.error
        }
      });
      
      // 데이터베이스 연결 상태 체크
      if (statsResult.error && productsResult.error) {
        setError('데이터베이스 연결에 문제가 있습니다. Supabase 설정을 확인해주세요.');
      } else if (finalProducts.length === 0 && !productsResult.error) {
        console.log('ℹ️ 데이터베이스는 정상이지만 제품 데이터가 없습니다.');
      }
      
    } catch (err) {
      console.error('❌ 데이터 로딩 치명적 오류:', err);
      setError(err instanceof Error ? err.message : '데이터 로딩 중 치명적 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 자동 정제 적용 핸들러
  const handleAutoFix = async (ingredientId: string, issues: RefinementIssue[]) => {
    try {
      console.log('🔧 자동 정제 적용:', ingredientId);
      
      const result = await applyAutoRefinement(ingredientId, issues);
      if (result.success) {
        console.log('✅ 자동 정제 완료');
        // 데이터 새로고침
        await loadRefinementData();
        alert('자동 정제가 완료되었습니다!');
      } else {
        throw new Error('자동 정제 실패');
      }
    } catch (err) {
      console.error('❌ 자동 정제 오류:', err);
      alert('자동 정제 중 오류가 발생했습니다.');
    }
  };

  // 테스트 데이터 업로드 핸들러
  const handleUploadTestData = async () => {
    try {
      setUploadingTest(true);
      console.log('🚀 테스트 데이터 업로드 시작...');
      
      const result = await uploadTestDataToDB();
      if (result.success) {
        console.log('✅ 테스트 데이터 업로드 완료', result.summary);
        alert(`테스트 데이터 업로드 완료!\n제품: ${result.summary?.products || 0}개\n성분: ${result.summary?.ingredients || 0}개`);
        
        // 데이터 새로고침
        await loadRefinementData();
      } else {
        throw new Error('테스트 데이터 업로드 실패');
      }
    } catch (err) {
      console.error('❌ 테스트 데이터 업로드 오류:', err);
      alert('테스트 데이터 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingTest(false);
    }
  };

  // DB 연결 테스트 핸들러
  const handleTestConnection = async () => {
    try {
      console.log('🔍 DB 연결 테스트...');
      const result = await testDatabaseConnection();
      
      if (result.connected) {
        alert('✅ 데이터베이스 연결 성공!');
      } else {
        alert('❌ 데이터베이스 연결 실패!\n' + JSON.stringify(result.error));
      }
    } catch (err) {
      console.error('❌ DB 연결 테스트 오류:', err);
      alert('DB 연결 테스트 중 오류가 발생했습니다.');
    }
  };

  // 현재 데이터 상태 확인 핸들러
  const handleCheckDataStatus = async () => {
    try {
      console.log('📊 데이터 상태 확인...');
      const status = await checkCurrentDataStatus();
      
      if (status) {
        const message = `현재 데이터 상태:\n총 제품: ${status.totalProducts}개\n총 성분: ${status.totalIngredients}개\n테스트 데이터: ${status.testProducts.length}개`;
        alert(message);
      } else {
        alert('데이터 상태 확인에 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 데이터 상태 확인 오류:', err);
      alert('데이터 상태 확인 중 오류가 발생했습니다.');
    }
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <div style={pageWrapperStyle}>
        <div style={{...sectionCardStyle, padding: '40px', textAlign: 'center'}}>
          <div style={{fontSize: '18px', marginBottom: '10px'}}>📊 데이터를 불러오는 중...</div>
          <div style={{fontSize: '14px', color: '#6b7280'}}>
            Supabase에서 제품 및 성분 데이터를 조회하고 있습니다.
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div style={pageWrapperStyle}>
        <div style={errorMessageStyle}>
          <div style={{fontSize: '18px', marginBottom: '10px'}}>⚠️ 오류 발생</div>
          <div>{error}</div>
          <button 
            onClick={loadRefinementData}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapperStyle}>
      {/* 페이지 헤더 */}
      <div style={sectionCardStyle}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>
            데이터 정제
          </h2>
          <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>
            수집된 데이터의 품질을 검증하고 문제를 해결합니다
          </p>
        </div>
        
        

     
      </div>

      {/* 탭 헤더 + 관리자 도구 */}
      <div style={{...sectionCardStyle, padding: 0}}>
        <div style={tabContainerStyle}>
          <div style={tabGroupStyle}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                style={tabButtonStyle(activeTab === tab.id)}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* 관리자 도구 */}
          <div>
            <button
              style={adminButtonStyle}
              onClick={() => setShowTestPanel(!showTestPanel)}
            >
              🔧 관리자 도구
            </button>
          </div>
        </div>
      </div>

      {/* 테스트 데이터 패널 */}
      {showTestPanel && (
        <div style={testDataPanelStyle}>
          <div style={{fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#0c4a6e'}}>
            🔧 개발자/관리자 도구
          </div>
          <div style={{fontSize: '14px', color: '#0c4a6e', marginBottom: '15px'}}>
            검증 로직 테스트를 위한 오류 데이터를 포함한 테스트 데이터셋을 업로드할 수 있습니다.
          </div>
          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            <button
              onClick={handleTestConnection}
              style={{
                padding: '8px 12px',
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              DB 연결 테스트
            </button>
            <button
              onClick={handleCheckDataStatus}
              style={{
                padding: '8px 12px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              데이터 상태 확인
            </button>
            <button
              onClick={handleUploadTestData}
              disabled={uploadingTest}
              style={{
                padding: '8px 12px',
                backgroundColor: uploadingTest ? '#9ca3af' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: uploadingTest ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {uploadingTest ? '업로드 중...' : '테스트 데이터 업로드'}
            </button>
          </div>
          <div style={{fontSize: '12px', color: '#64748b', marginTop: '10px'}}>
            ⚠️ 테스트 데이터에는 의도적인 오류가 포함되어 있어 검증 로직을 테스트할 수 있습니다.
          </div>
        </div>
      )}

      {/* 데이터 정제 탭 내용 */}
      <div style={tabContentStyle(activeTab === 'data-refining-tab-content-processing')}>
        <RefinementOverview 
          stats={stats}
          products={products}
          onAutoFix={handleAutoFix}
        />
      </div>

      {/* 검수 탭 */}
      <div style={tabContentStyle(activeTab === 'comparison')}>
        <DataComparison />
      </div>

      {/* 완료 탭 */}
      <div style={tabContentStyle(activeTab === 'finalized')}>
        <FinalizedData stats={stats} />
      </div>
    </div>
  );
};

export default DataRefiningPage;