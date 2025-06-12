// src/components/DataProcessing/CaptionGenerationSystem.tsx
import React, { useState, useEffect, CSSProperties } from 'react';
import { ChemicalData, GeneratedCaption } from '../../types/dataProcessing';
import { generateCaption, evaluateCaption } from '../../api/captionGeneration';

// --- 인터페이스 정의 ---
interface CaptionGenerationSystemProps {
  selectedChemical: ChemicalData;
}

// --- 스타일 객체 정의 ---
const processingSystemStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  padding: '20px',
  marginTop: '20px',
};

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  paddingBottom: '15px',
  borderBottom: '1px solid #e5e7eb',
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.5rem',
  fontWeight: 600,
  color: '#1f2937',
};

const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
};

const btnStyle = (variant: 'secondary' | 'success' | 'primary' | 'warning', disabled?: boolean): CSSProperties => {
  let base: CSSProperties = {
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: 'white',
    fontWeight: 500,
    transition: 'all 0.2s',
    opacity: disabled ? 0.7 : 1,
  };

  switch (variant) {
    case 'secondary':
      return { ...base, backgroundColor: disabled ? '#9ca3af' : '#6b7280', borderRadius: '6px' };
    case 'success':
      return { ...base, color: disabled ? '#ffffff' : 'white', fontSize: '14px', fontWeight: 500 };
    case 'primary':
      return { ...base, backgroundColor: disabled ? '#6b7280' : '#3b82f6' };
    case 'warning':
      return { ...base, margin: '0', fontSize: '14px', fontWeight: 600, color: '#1f2937' };
    default:
      return base;
  }
};

const tabsContainerStyle: CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid #e5e7eb',
  marginBottom: '20px',
};

const tabButtonStyle = (isActive: boolean): CSSProperties => ({
  padding: '10px 20px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: isActive ? 'bold' : 'normal',
  color: isActive ? '#3b82f6' : '#6b7280',
  borderBottom: isActive ? '3px solid #3b82f6' : '3px solid transparent',
  marginRight: '10px',
});

const tabContentStyle = (isVisible: boolean): CSSProperties => ({
  display: isVisible ? 'block' : 'none',
});

const chemicalInfoStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '15px',
  marginBottom: '20px',
};

const infoGroupStyle: CSSProperties = {
  background: '#f9fafb',
  padding: '12px',
  borderRadius: '6px',
  borderLeft: '4px solid #3b82f6',
};

const infoLabelStyle: CSSProperties = {
  fontWeight: 600,
  color: '#374151',
  marginBottom: '5px',
  fontSize: '14px',
};

const infoValueStyle: CSSProperties = {
  color: '#1f2937',
  fontSize: '14px',
};

const radioLabelStyle: CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  color: '#374151',
  fontSize: '14px',
};

const radioInputStyle: CSSProperties = {
  marginRight: '8px',
};

const guidelinesBoxStyle: CSSProperties = {
  background: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '6px',
  padding: '12px',
  marginTop: '15px',
};

const validationBoxStyle: CSSProperties = {
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '6px',
  padding: '12px',
  marginTop: '15px',
};

const feedbackBoxStyle: CSSProperties = {
  background: '#fefce8',
  border: '1px solid #fde047',
  borderRadius: '6px',
  padding: '12px',
  marginTop: '15px',
};

const warningBoxStyle: CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '12px',
  marginBottom: '20px',
};

const textAreaStyle: CSSProperties = {
  width: '100%',
  minHeight: '200px',
  maxWidth: '100%',
  marginTop: '15px',
  padding: '12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  resize: 'vertical',
  fontSize: '14px',
  fontFamily: 'inherit',
};

const previewBoxStyle: CSSProperties = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '15px',
  marginTop: '20px',
};

const rightCardStyle: CSSProperties = {
  background: 'white',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  marginBottom: '20px',
};

const rightCardTitleStyle: CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  marginBottom: '15px',
  color: '#1f2937',
};

const ghsCodeStyle: CSSProperties = {
  backgroundColor: '#ef4444',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500,
  marginRight: '5px',
  display: 'inline-block',
};

const loadingStyle: CSSProperties = {
  background: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  padding: '12px',
  marginTop: '15px',
  textAlign: 'center',
  color: '#6b7280',
};

const errorStyle: CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '12px',
  marginTop: '15px',
  color: '#dc2626',
};

const batchProgressStyle: CSSProperties = {
  background: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '6px',
  padding: '15px',
  marginTop: '15px',
  marginBottom: '15px',
};

const progressBarStyle: CSSProperties = {
  width: '100%',
  height: '8px',
  backgroundColor: '#e5e7eb',
  borderRadius: '4px',
  overflow: 'hidden',
  marginTop: '8px',
};

const progressFillStyle = (progress: number): CSSProperties => ({
  height: '100%',
  backgroundColor: '#3b82f6',
  width: `${progress}%`,
  transition: 'width 0.3s ease',
});

// --- 메인 컴포넌트 ---
const CaptionGenerationSystem: React.FC<CaptionGenerationSystemProps> = ({ selectedChemical }) => {
  const [activeTab, setActiveTab] = useState('main-component');
  const [generatedCaptions, setGeneratedCaptions] = useState<GeneratedCaption>({});
  const [targetAudience, setTargetAudience] = useState<'general' | 'academic'>('general');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{ score: number; feedback: string; suggestions: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: string; total: number; completed: number }>({
    current: '',
    total: 0,
    completed: 0
  });

  // 탭별 생성 타입 매핑
  const getGenerationType = (tabId: string) => {
    switch (tabId) {
      case 'main-component': return targetAudience === 'general' ? 'general' : 'academic';
      case 'toxicity': return 'safety';
      case 'warning': return 'regulatory';
      default: return 'general';
    }
  };

  // 초기화 핸들러
  const handleReset = () => {
    setGeneratedCaptions(prev => ({
      ...prev,
      [activeTab]: ''
    }));
    setEvaluationResult(null);
    setError(null);
  };

  // 설명문 생성 핸들러
  const handleGenerateCaption = async () => {
    if (!selectedChemical) return;

    const generationType = getGenerationType(activeTab);
    console.log('AI 설명문 생성 시작:', { activeTab, generationType });

    setIsGenerating(true);
    setError(null);

    try {
      const response = await generateCaption({
        chemical: selectedChemical,
        generationType: generationType as 'academic' | 'general' | 'safety' | 'regulatory',
        language: 'ko',
      });

      if (response.success && response.result) {
        setGeneratedCaptions(prev => ({
          ...prev,
          [activeTab]: response.result
        }));
        console.log('AI 설명문 생성 성공:', activeTab);
      } else {
        throw new Error(response.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('설명문 생성 오류:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 설명문 품질 평가 핸들러
  const handleEvaluateCaption = async () => {
    const currentCaption = generatedCaptions[activeTab];
    if (!currentCaption || !selectedChemical) return;

    setIsEvaluating(true);
    setError(null);

    try {
      const result = await evaluateCaption(selectedChemical, currentCaption);
      setEvaluationResult(result);
    } catch (error) {
      console.error('설명문 평가 오류:', error);
      setError('설명문 평가 중 오류가 발생했습니다.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // 전체 설명문 일괄 생성 핸들러
  const handleBatchGenerate = async () => {
    if (!selectedChemical) return;
    
    setIsBatchGenerating(true);
    setError(null);
    
    const generationTasks = [
      { tab: 'main-component', type: targetAudience === 'general' ? 'general' : 'academic', label: '주성분 설명문' },
      { tab: 'toxicity', type: 'safety', label: '독성 설명문' },
      { tab: 'warning', type: 'regulatory', label: '경고문 및 주의사항' }
    ];

    setBatchProgress({ current: '', total: generationTasks.length, completed: 0 });

    try {
      for (let i = 0; i < generationTasks.length; i++) {
        const task = generationTasks[i];
        
        setBatchProgress(prev => ({
          ...prev,
          current: task.label,
          completed: i
        }));

        console.log(`AI 설명문 생성 시작: ${task.tab} (${task.type})`);
        
        const response = await generateCaption({
          chemical: selectedChemical,
          generationType: task.type as 'academic' | 'general' | 'safety' | 'regulatory',
          language: 'ko',
        });

        if (response.success && response.result) {
          setGeneratedCaptions(prev => ({
            ...prev,
            [task.tab]: response.result
          }));
          console.log(`AI 설명문 생성 성공: ${task.tab}`);
        } else {
          throw new Error(`${task.label} 생성 실패: ${response.error || '알 수 없는 오류'}`);
        }

        // API 호출 간격 조절 (과부하 방지)
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      setBatchProgress(prev => ({
        ...prev,
        current: '완료',
        completed: generationTasks.length
      }));
      
      console.log('전체 설명문 일괄 생성 완료');
    } catch (error) {
      console.error('일괄 생성 오류:', error);
      setError(error instanceof Error ? error.message : '일괄 생성 중 오류가 발생했습니다.');
    } finally {
      setIsBatchGenerating(false);
      setTimeout(() => {
        setBatchProgress({ current: '', total: 0, completed: 0 });
      }, 3000);
    }
  };

  // 탭 정의
  const tabs = [
    { id: 'main-component', label: '📋 주성분 설명문' },
    { id: 'toxicity', label: '⚠️ 독성 설명문' },
    { id: 'warning', label: '🚨 경고문 및 주의사항' },
  ];

  // 선택된 물질이 변경될 때 초기화
  useEffect(() => {
    if (selectedChemical) {
      setGeneratedCaptions({});
      setEvaluationResult(null);
      setError(null);
      setActiveTab('main-component');
    }
  }, [selectedChemical]);

  return (
    <div style={processingSystemStyle}>
      <div style={cardHeaderStyle}>
        <h3 style={cardTitleStyle}>
          ChemiGuard v1.0 - AI 설명문 생성 시스템
          <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6b7280', marginLeft: '10px' }}>
            {selectedChemical.name} ({selectedChemical.casNumber || selectedChemical.cas_no})
          </span>
        </h3>
        <div style={buttonGroupStyle}>
          <button 
            style={btnStyle('secondary')}
            onClick={handleReset}
            disabled={isGenerating || isBatchGenerating}
          >
            🔄 초기화
          </button>
          <button 
            style={btnStyle('primary', isBatchGenerating)}
            onClick={handleBatchGenerate}
            disabled={isGenerating || isBatchGenerating}
          >
            {isBatchGenerating ? '⏳ 일괄 생성중...' : '🚀 AI 전체 설명문 일괄 생성'}
          </button>
          <button 
            style={btnStyle('success', isGenerating)}
            onClick={handleGenerateCaption}
            disabled={isGenerating || isBatchGenerating}
          >
            {isGenerating ? '⏳ AI 생성중...' : '🤖 AI 개별 설명문 생성'}
          </button>
          <button 
            style={btnStyle('warning', isEvaluating)}
            onClick={handleEvaluateCaption}
            disabled={isEvaluating || !generatedCaptions[activeTab] || isBatchGenerating}
          >
            {isEvaluating ? '⏳ 평가중...' : '📊 품질 평가'}
          </button>
          <button style={btnStyle('primary')} onClick={onSaveClick}>💾 저장</button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div style={errorStyle}>
          <strong>오류:</strong> {error}
        </div>
      )}

      {/* 일괄 생성 진행 상황 */}
      {isBatchGenerating && batchProgress.total > 0 && (
        <div style={batchProgressStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, color: '#1f2937' }}>
              전체 설명문 일괄 생성 진행 중...
            </span>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              {batchProgress.completed}/{batchProgress.total}
            </span>
          </div>
          {batchProgress.current && (
            <div style={{ color: '#3b82f6', fontSize: '14px', marginBottom: '8px' }}>
              현재 생성 중: {batchProgress.current}
            </div>
          )}
          <div style={progressBarStyle}>
            <div style={progressFillStyle((batchProgress.completed / batchProgress.total) * 100)} />
          </div>
        </div>
      )}

      <div style={tabsContainerStyle}>
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

      {/* Layout: left (input) and right (cards) */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* 좌측 컨텐츠 영역 */}
        <div style={{ flex: 1, maxWidth: '65%' }}>
          {/* 주성분 설명문 탭 */}
          <div style={tabContentStyle(activeTab === 'main-component')}>
            <div style={chemicalInfoStyle}>
              <div style={infoGroupStyle}>
                <div style={infoLabelStyle}>성분명</div>
                <div style={infoValueStyle}>{selectedChemical.name}</div>
              </div>
              <div style={infoGroupStyle}>
                <div style={infoLabelStyle}>CAS 번호</div>
                <div style={infoValueStyle}>
                  {selectedChemical.casNumber || selectedChemical.cas_no || '정보 없음'}
                  {(selectedChemical.casNumber || selectedChemical.cas_no) && (
                    <span 
                      style={{ marginLeft: '8px', cursor: 'pointer' }} 
                      title="복사" 
                      onClick={() => navigator.clipboard.writeText(selectedChemical.casNumber || selectedChemical.cas_no || '')}
                    >
                      📋
                    </span>
                  )}
                </div>
              </div>
              <div style={infoGroupStyle}>
                <div style={infoLabelStyle}>분자식</div>
                <div style={infoValueStyle}>{selectedChemical.molecularFormula || '정보 없음'}</div>
              </div>
              <div style={infoGroupStyle}>
                <div style={infoLabelStyle}>용도</div>
                <div style={infoValueStyle}>{selectedChemical.usage || '정보 없음'}</div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={infoLabelStyle}>위험성 분류</div>
              <div style={infoValueStyle}>{selectedChemical.hazardClass || '정보 없음'}</div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={infoLabelStyle}>설명 대상 선택</div>
              <div style={{ marginTop: '10px' }}>
                <label style={radioLabelStyle}>
                  <input 
                    type="radio" 
                    name="component_audience" 
                    style={radioInputStyle} 
                    checked={targetAudience === 'general'}
                    onChange={() => setTargetAudience('general')}
                  /> 
                  일반인용 (이해하기 쉬운 설명)
                </label>
                <label style={radioLabelStyle}>
                  <input 
                    type="radio" 
                    name="component_audience" 
                    style={radioInputStyle} 
                    checked={targetAudience === 'academic'}
                    onChange={() => setTargetAudience('academic')}
                  /> 
                  전문가용 (학술적 설명)
                </label>
              </div>
            </div>

            <div style={guidelinesBoxStyle}>
              <strong style={{ color: '#1e40af', display: 'block', marginBottom: '8px' }}>📋 주성분 설명문 작성 가이드라인</strong>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#374151', fontSize: '14px', lineHeight: 1.5 }}>
                <li>화학물질의 기본 정보 (CAS 번호, 분자식, 구조 등)</li>
                <li>주요 물리화학적 성질 (용해도, 끓는점, 밀도 등)</li>
                <li>일반적인 용도와 응용 분야</li>
                <li>인체 및 환경에 미치는 영향 (긍정적/부정적)</li>
                <li>일상생활과의 연관성</li>
              </ul>
            </div>

            {isGenerating && (
              <div style={loadingStyle}>
                🤖 AI가 주성분 설명문을 생성하고 있습니다...
              </div>
            )}

            <textarea
              style={textAreaStyle}
              placeholder="AI가 생성한 주성분 설명문이 여기에 표시됩니다..."
              value={generatedCaptions['main-component'] || ''}
              onChange={(e) => setGeneratedCaptions(prev => ({
                ...prev,
                'main-component': e.target.value
              }))}
            />
          </div>

          {/* 독성 설명문 탭 */}
          <div style={tabContentStyle(activeTab === 'toxicity')}>
            <div style={chemicalInfoStyle}>
              <div style={infoGroupStyle}>
                <div style={infoLabelStyle}>위험성 분류</div>
                <div style={infoValueStyle}>{selectedChemical.hazardClass || '정보 없음'}</div>
              </div>
              <div style={infoGroupStyle}>
                <div style={infoLabelStyle}>LD50 값</div>
                <div style={infoValueStyle}>{selectedChemical.ld50_value || '정보 없음'}</div>
              </div>
            </div>

            <div style={warningBoxStyle}>
              <strong style={{ color: '#dc2626', display: 'block', marginBottom: '8px' }}>⚠️ 독성 정보 작성 시 주의사항</strong>
              <p style={{ margin: '0', color: '#7f1d1d', fontSize: '14px' }}>
                독성 정보는 정확하고 과학적 근거에 기반해야 합니다. 
                과장하거나 축소하지 않고 객관적으로 기술해주세요.
              </p>
            </div>

            <div style={validationBoxStyle}>
              <strong style={{ color: '#16a34a', display: 'block', marginBottom: '8px' }}>🔬 독성 설명문 작성 가이드라인</strong>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#15803d', fontSize: '14px', lineHeight: 1.5 }}>
                <li>급성 독성 (경구, 경피, 흡입)</li>
                <li>만성 독성 및 장기 영향</li>
                <li>표적 장기 독성</li>
                <li>생식독성 및 발암성 정보</li>
                <li>환경독성 및 생태계 영향</li>
                <li>독성 메커니즘 설명</li>
              </ul>
            </div>

            {isGenerating && (
              <div style={loadingStyle}>
                🤖 AI가 독성 설명문을 생성하고 있습니다...
              </div>
            )}

            <textarea
              style={textAreaStyle}
              placeholder="AI가 생성한 독성 설명문이 여기에 표시됩니다..."
              value={generatedCaptions['toxicity'] || ''}
              onChange={(e) => setGeneratedCaptions(prev => ({
                ...prev,
                'toxicity': e.target.value
              }))}
            />
          </div>

          {/* 경고문 및 주의사항 탭 */}
          <div style={tabContentStyle(activeTab === 'warning')}>
            <div style={chemicalInfoStyle}>
              <div style={infoGroupStyle}>
                <div style={infoLabelStyle}>위험성 분류</div>
                <div style={infoValueStyle}>{selectedChemical.hazardClass || '정보 없음'}</div>
              </div>
              <div style={infoGroupStyle}>
                <div style={infoLabelStyle}>GHS 코드</div>
                <div style={infoValueStyle}>
                  {selectedChemical.ghs_codes && selectedChemical.ghs_codes.length > 0 
                    ? selectedChemical.ghs_codes.join(', ') 
                    : '정보 없음'}
                </div>
              </div>
            </div>

            <div style={feedbackBoxStyle}>
              <strong style={{ color: '#ca8a04', display: 'block', marginBottom: '8px' }}>🚨 경고문 작성 가이드라인</strong>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#a16207', fontSize: '14px', lineHeight: 1.5 }}>
                <li>취급 시 주의사항 (보호구 착용, 환기 등)</li>
                <li>저장 및 보관 방법</li>
                <li>운송 시 안전 수칙</li>
                <li>노출 시 응급처치 방법</li>
                <li>폐기 시 주의사항</li>
                <li>법적 규제 사항</li>
              </ul>
            </div>

            {isGenerating && (
              <div style={loadingStyle}>
                🤖 AI가 경고문 및 주의사항을 생성하고 있습니다...
              </div>
            )}

            <textarea
              style={textAreaStyle}
              placeholder="AI가 생성한 경고문 및 주의사항이 여기에 표시됩니다..."
              value={generatedCaptions['warning'] || ''}
              onChange={(e) => setGeneratedCaptions(prev => ({
                ...prev,
                'warning': e.target.value
              }))}
            />
          </div>

          {/* 품질 평가 결과 */}
          {evaluationResult && (
            <div style={previewBoxStyle}>
              <h4 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '1.1rem', fontWeight: 600 }}>📊 품질 평가 결과</h4>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', marginRight: '10px', color: evaluationResult.score >= 80 ? '#16a34a' : evaluationResult.score >= 60 ? '#ca8a04' : '#dc2626' }}>
                  {evaluationResult.score}/100
                </span>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>평가 의견:</strong>
                <p style={{ margin: '0', lineHeight: 1.5, color: '#374151', fontSize: '14px' }}>{evaluationResult.feedback}</p>
              </div>
              {evaluationResult.suggestions.length > 0 && (
                <div>
                  <strong style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>개선 제안:</strong>
                  <ul style={{ margin: '0', paddingLeft: '18px' }}>
                    {evaluationResult.suggestions.map((suggestion, index) => (
                      <li key={index} style={{ marginBottom: '4px', fontSize: '14px', color: '#374151' }}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 우측 정보 카드 영역 */}
        <div style={{ width: '300px' }}>
          <div style={rightCardStyle}>
            <h4 style={rightCardTitleStyle}>🧪 화학물질 기본 정보</h4>
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#4b5563' }}>
              <p><strong>분자량:</strong> {selectedChemical.molecularWeight || '정보 없음'}</p>
              <p><strong>물리적 상태:</strong> {selectedChemical.physicalState || '정보 없음'}</p>
              <p><strong>함량:</strong> {selectedChemical.content_percentage || '정보 없음'}</p>
              <p><strong>제조사:</strong> {selectedChemical.manufacturer || '정보 없음'}</p>
            </div>
          </div>

          <div style={rightCardStyle}>
            <h4 style={rightCardTitleStyle}>⚠️ 위험성 정보</h4>
            <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
              {selectedChemical.ghs_codes && selectedChemical.ghs_codes.length > 0 ? (
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ display: 'block', marginBottom: '5px', color: '#1f2937' }}>GHS 코드:</strong>
                  {selectedChemical.ghs_codes.map((code: string, index: number) => (
                    <span key={index} style={ghsCodeStyle}>{code}</span>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6b7280', fontSize: '12px' }}>GHS 코드 정보 없음</p>
              )}
              <p style={{ color: '#4b5563' }}>
                <strong>위험 등급:</strong> {selectedChemical.hazardClass || '정보 없음'}
              </p>
            </div>
          </div>

          <div style={rightCardStyle}>
            <h4 style={rightCardTitleStyle}>📋 생성 현황</h4>
            <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: activeTab === 'main-component' ? '2px solid #3b82f6' : 'none', paddingTop: activeTab === 'main-component' ? '8px' : '0' }}>
                <span style={{ color: activeTab === 'main-component' ? '#3b82f6' : '#6b7280' }}>📋 주성분</span>
                <span style={{ 
                  fontSize: '18px',
                  color: generatedCaptions['main-component'] ? '#16a34a' : '#d1d5db'
                }}>
                  {generatedCaptions['main-component'] ? '✅' : '⭕'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: activeTab === 'toxicity' ? '2px solid #3b82f6' : 'none', paddingTop: activeTab === 'toxicity' ? '8px' : '0' }}>
                <span style={{ color: activeTab === 'toxicity' ? '#3b82f6' : '#6b7280' }}>⚠️ 독성</span>
                <span style={{ 
                  fontSize: '18px',
                  color: generatedCaptions['toxicity'] ? '#16a34a' : '#d1d5db'
                }}>
                  {generatedCaptions['toxicity'] ? '✅' : '⭕'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: activeTab === 'warning' ? '2px solid #3b82f6' : 'none', paddingTop: activeTab === 'warning' ? '8px' : '0' }}>
                <span style={{ color: activeTab === 'warning' ? '#3b82f6' : '#6b7280' }}>🚨 경고</span>
                <span style={{ 
                  fontSize: '18px',
                  color: generatedCaptions['warning'] ? '#16a34a' : '#d1d5db'
                }}>
                  {generatedCaptions['warning'] ? '✅' : '⭕'}
                </span>
              </div>
            </div>
            <div style={{ marginTop: '15px', padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
              <div style={{ fontSize: '12px', color: '#1e40af', textAlign: 'center' }}>
                완성도: {Object.values(generatedCaptions).filter(Boolean).length}/3
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptionGenerationSystem;

  // 저장 버튼 핸들러
  const onSaveClick = () => {
    alert('저장되었습니다.');
  };