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
import { ProcessingStep } from '../../types/processingTypes';

// 컴포넌트 imports
import ProcessingStepper from '../../components/DataRefining/ProcessingStepper';
import RefinementOverview from '../../components/DataRefining/RefinementOverview';
import ExcelStyleDataGrid from '../../components/DataRefining/ExcelStyleDataGrid';

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

const DataRefiningPage: React.FC = () => {
  // 스테퍼 기반 상태 관리
  const [currentStep, setCurrentStep] = useState<ProcessingStep>(ProcessingStep.REFINING);
  const [completedSteps, setCompletedSteps] = useState<ProcessingStep[]>([]);
  
  // 기본 데이터 상태
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RefinementStats | null>(null);
  const [products, setProducts] = useState<ProductWithIngredients[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [uploadingTest, setUploadingTest] = useState(false);
  const userInfo = useUserStore((state) => state.userInfo);

  // 단계 변경 핸들러
  const handleStepChange = (step: ProcessingStep) => {
    setCurrentStep(step);
  };

  // 단계 완료 처리
  const completeCurrentStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    
    // 다음 단계로 자동 이동
    const nextStep = getNextStep(currentStep);
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };

  // 다음 단계 결정
  const getNextStep = (current: ProcessingStep): ProcessingStep | null => {
    switch (current) {
      case ProcessingStep.REFINING:
        return ProcessingStep.STANDARDIZING;
      case ProcessingStep.STANDARDIZING:
        return ProcessingStep.ANONYMIZING;
      case ProcessingStep.ANONYMIZING:
        return ProcessingStep.COMPLETED;
      default:
        return null;
    }
  };

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
      {/* 스테퍼 */}
      <ProcessingStepper 
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepChange}
      />

      {/* 현재 단계별 콘텐츠 */}
      {currentStep === ProcessingStep.REFINING && (
        <>
          <RefinementOverview 
            stats={stats}
            products={products}
            onAutoFix={handleAutoFix}
            onComplete={completeCurrentStep}
          />
          <ExcelStyleDataGrid 
            step={currentStep}
            onRefresh={loadRefinementData}
          />
        </>
      )}

      {currentStep === ProcessingStep.STANDARDIZING && (
        <div style={sectionCardStyle}>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
                  🎯 데이터 표준화
                </h3>
                <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>
                  성분명, CAS 번호, 함량 등의 형식을 통일하고 표준화 규칙을 적용합니다.
                </p>
              </div>
              <div style={{ 
                padding: '12px 16px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '8px',
                border: '1px solid #0ea5e9'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0c4a6e' }}>진행 상황</div>
                <div style={{ fontSize: '12px', color: '#0c4a6e' }}>준비 단계</div>
              </div>
            </div>

            {/* 표준화 도구 예시 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div style={{
                padding: '20px',
                backgroundColor: '#fef3c7',
                borderRadius: '12px',
                border: '1px solid #f59e0b'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '12px' }}>🏷️</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
                  성분명 정규화
                </div>
                <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '12px' }}>
                  동의어/이명 통합, IUPAC 명명법 적용
                </div>
                <div style={{ fontSize: '12px', color: '#a16207', padding: '8px', backgroundColor: '#fefbf2', borderRadius: '4px' }}>
                  예: "Sodium Lauryl Sulfate" → "소듐라우릴황산염"
                </div>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#dbeafe',
                borderRadius: '12px',
                border: '1px solid #3b82f6'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '12px' }}>🔢</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
                  CAS 번호 형식 통일
                </div>
                <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '12px' }}>
                  표준 CAS 번호 형식 적용 및 검증
                </div>
                <div style={{ fontSize: '12px', color: '#1e3a8a', padding: '8px', backgroundColor: '#eff6ff', borderRadius: '4px' }}>
                  예: "68585-34-2" → "68585-34-2" (검증 완료)
                </div>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#ecfdf5',
                borderRadius: '12px',
                border: '1px solid #10b981'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '12px' }}>📊</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
                  함량 단위 표준화
                </div>
                <div style={{ fontSize: '14px', color: '#065f46', marginBottom: '12px' }}>
                  함량 표기 및 단위 일관성 확보
                </div>
                <div style={{ fontSize: '12px', color: '#064e3b', padding: '8px', backgroundColor: '#f0fdf4', borderRadius: '4px' }}>
                  예: "10-15%" → "12.5 ± 2.5%"
                </div>
              </div>
            </div>

            {/* 표준화 진행 상황 */}
            <div style={{
              padding: '20px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px'
            }}>
              <h4 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#1f2937' }}>
                표준화 진행 상황
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#3b82f6' }}>158</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>전체 제품</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#10b981' }}>7</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>성분 데이터</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#f59e0b' }}>0</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>표준화 완료</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#6b7280' }}>7</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>대기 중</div>
                </div>
              </div>
            </div>

            {/* 행동 버튼 */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                🛠️ 표준화 규칙 설정
              </button>
              <button 
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ⚡ 일괄 표준화 실행
              </button>
              <button 
                onClick={completeCurrentStep}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ✅ 표준화 완료 (테스트)
              </button>
            </div>

            {/* 개발 예정 안내 */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #0ea5e9',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
                🚧 이 기능은 향후 개발 예정입니다. 현재는 UI 미리보기 및 테스트 모드로 작동합니다.
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === ProcessingStep.ANONYMIZING && (
        <div style={sectionCardStyle}>
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              🔒 데이터 비식별화
            </h3>
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '24px' }}>
              개인정보 보호를 위해 제품명, 브랜드명 등을 비식별 처리합니다.
            </p>
            <div style={{ 
              padding: '32px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '12px', 
              border: '2px dashed #d1d5db',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                비식별화 도구 개발 예정
              </div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                제품명 마스킹, 브랜드 코드화, 민감정보 제거 등
              </div>
            </div>
            <button 
              onClick={completeCurrentStep}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              비식별화 완료 및 다음 단계
            </button>
          </div>
        </div>
      )}

      {currentStep === ProcessingStep.COMPLETED && (
        <div style={sectionCardStyle}>
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              🏆 처리 완료
            </h3>
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '24px' }}>
              모든 단계가 완료되었습니다. 최종 데이터를 확인하고 내보내기할 수 있습니다.
            </p>
            <div style={{ 
              padding: '32px', 
              backgroundColor: '#ecfdf5', 
              borderRadius: '12px', 
              border: '2px solid #10b981',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
                데이터 처리 완료!
              </div>
              <div style={{ color: '#065f46', fontSize: '14px' }}>
                정제 → 표준화 → 비식별화 모든 단계 완료
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                데이터 내보내기
              </button>
              <button 
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                보고서 생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 관리자 도구 (디버깅용) */}
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
            <button
              onClick={() => setShowTestPanel(false)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              닫기
            </button>
          </div>
          <div style={{fontSize: '12px', color: '#64748b', marginTop: '10px'}}>
            ⚠️ 테스트 데이터에는 의도적인 오류가 포함되어 있어 검증 로직을 테스트할 수 있습니다.
          </div>
        </div>
      )}

      {/* 관리자 도구 토글 버튼 */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
        <button
          style={{
            ...adminButtonStyle,
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            fontSize: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onClick={() => setShowTestPanel(!showTestPanel)}
        >
          🔧
        </button>
      </div>
    </div>
  );
};

export default DataRefiningPage;