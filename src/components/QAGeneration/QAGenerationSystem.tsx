// src/components/QAGeneration/QAGenerationSystem.tsx
import React, { useState, CSSProperties } from 'react';
import { ChemicalData } from '../../types/qaGeneration';
import { generateQA, generateQuestion, generateAnswer, saveQA, GeneratedQA } from '../../api/qaGeneration';

// --- 스타일 정의 ---
const systemContainerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '20px',
  marginTop: '20px',
};

const mainContentStyle: CSSProperties = {
  background: 'white',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  padding: '20px',
};

const sidebarStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const cardStyle: CSSProperties = {
  background: 'white',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const cardTitleStyle: CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  marginBottom: '15px',
  color: '#1f2937',
};

const tabsContainerStyle: CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid #e0e0e0',
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

const tabContentStyle = (isActive: boolean): CSSProperties => ({
  display: isActive ? 'block' : 'none',
});

const sectionTitleStyle: CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#1f2937',
  marginBottom: '15px',
};

const subSectionTitleStyle: CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#1f2937',
  marginBottom: '10px',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontWeight: 500,
  color: '#374151',
  fontSize: '14px',
  marginBottom: '5px',
};

const selectStyle: CSSProperties = {
  width: '100%',
  padding: '10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  backgroundColor: 'white',
  fontSize: '14px',
  marginBottom: '15px',
};

const textAreaStyle: CSSProperties = {
  width: 'calc(100% - 22px)',
  padding: '10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  resize: 'vertical',
  marginBottom: '15px',
};

const guideBoxStyle: CSSProperties = {
  background: '#f8fafc',
  borderRadius: '8px',
  padding: '15px',
  margin: '10px 0',
};

const guideTextStyle: CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: 1.5,
  marginBottom: '10px',
};

const messageBoxStyle = (type: 'success' | 'error' | 'info'): CSSProperties => {
  const colors = {
    success: { bg: '#d1fae5', border: '#10b981', text: '#047857' },
    error: { bg: '#fee2e2', border: '#ef4444', text: '#dc2626' },
    info: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' }
  };
  
  return {
    background: colors[type].bg,
    border: `1px solid ${colors[type].border}`,
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '15px',
    color: colors[type].text,
    fontSize: '14px',
  };
};

const loadingOverlayStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(255, 255, 255, 0.9)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  zIndex: 10,
};

const btnStyle = (
  variant: 'primary' | 'secondary' | 'success' | 'danger',
  isHovered: boolean,
  customStyle?: CSSProperties
): CSSProperties => {
  const baseStyle: CSSProperties = {
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    color: 'white',
    fontWeight: 500,
    marginRight: '10px',
    position: 'relative',
    transition: 'all 0.2s ease',
  };

  const colorMap = {
    primary: ['#3b82f6', '#2563eb'],
    secondary: ['#6b7280', '#4b5563'],
    success: ['#10b981', '#059669'],
    danger: ['#ef4444', '#dc2626']
  };

  const [defaultColor, hoverColor] = colorMap[variant];
  const backgroundColor = isHovered ? hoverColor : defaultColor;

  return { ...baseStyle, backgroundColor, ...customStyle };
};

const infoGroupStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px dashed #e0e0e0',
  alignItems: 'center',
};

const infoGroupLabelStyle: CSSProperties = {
  fontWeight: 500,
  color: '#374151',
  fontSize: '14px',
};

const infoGroupValueStyle: CSSProperties = {
  color: '#4b5563',
  fontSize: '14px',
  textAlign: 'right',
};

const ghsCodeStyle: CSSProperties = {
  backgroundColor: '#e0e7ff',
  color: '#3730a3',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 500,
  marginRight: '4px',
};

// --- 컴포넌트 정의 ---
interface QAGenerationSystemProps {
  selectedChemical: ChemicalData | null;
}

const QAGenerationSystem: React.FC<QAGenerationSystemProps> = ({ selectedChemical }) => {
  const [activeTab, setActiveTab] = useState('qa-setup');
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [qaType, setQaType] = useState('safety');
  const [difficultyLevel, setDifficultyLevel] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const tabs = [
    { id: 'qa-setup', label: '❓ Q&A 생성' },
    { id: 'basic-info', label: '📋 기본 정보' },
    { id: 'toxicity-data', label: '⚠️ 독성 정보' },
    { id: 'regulation-info', label: '📜 규제 정보' },
  ];

  // 실제 AI API 호출 함수들
  const handleGenerateFullQA = async () => {
    if (!selectedChemical) return;
    
    setIsLoading(true);
    setLoadingMessage('AI가 Q&A를 생성하고 있습니다...');
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await generateQA({
        chemical: selectedChemical,
        questionType: qaType as 'safety' | 'usage' | 'component' | 'regulation',
        difficultyLevel: difficultyLevel as 'general' | 'professional' | 'expert',
        language: 'ko'
      });
      
      if (response.success && response.result) {
        setQuestionText(response.result.question);
        setAnswerText(response.result.answer);
        setSuccessMessage('Q&A가 성공적으로 생성되었습니다!');
      } else {
        throw new Error(response.error || 'Q&A 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Q&A 생성 오류:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Q&A 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateQuestion = async () => {
    if (!selectedChemical) return;
    
    setIsLoading(true);
    setLoadingMessage('AI가 질문을 생성하고 있습니다...');
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await generateQuestion(
        selectedChemical,
        qaType,
        difficultyLevel,
        'ko'
      );
      
      if (response.success && response.result) {
        setQuestionText(response.result.question);
        setSuccessMessage('질문이 성공적으로 생성되었습니다!');
      } else {
        throw new Error(response.error || '질문 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('질문 생성 오류:', error);
      setErrorMessage(error instanceof Error ? error.message : '질문 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateAnswer = async () => {
    if (!selectedChemical || !questionText.trim()) {
      setErrorMessage('질문을 먼저 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('AI가 답변을 생성하고 있습니다...');
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await generateAnswer(
        selectedChemical,
        questionText,
        qaType,
        difficultyLevel,
        'ko'
      );
      
      if (response.success && response.result) {
        setAnswerText(response.result.answer);
        setSuccessMessage('답변이 성공적으로 생성되었습니다!');
      } else {
        throw new Error(response.error || '답변 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('답변 생성 오류:', error);
      setErrorMessage(error instanceof Error ? error.message : '답변 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleSaveQA = () => {
    if (!selectedChemical || !questionText.trim() || !answerText.trim()) {
      setErrorMessage('질문과 답변을 모두 입력해주세요.');
      return;
    }
    
    try {
      const newQA: GeneratedQA = {
        id: `qa_${Date.now()}_${selectedChemical.id}`,
        question: questionText,
        answer: answerText,
        category: qaType,
        sourceData: selectedChemical,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'gemini-2.5-pro',
          temperature: 0.7,
          dataSource: selectedChemical.id,
          questionType: qaType,
          targetAudience: difficultyLevel
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      saveQA(newQA);
      setSuccessMessage('Q&A가 성공적으로 저장되었습니다!');
      
      // 저장 후 폼 초기화
      setTimeout(() => {
        setQuestionText('');
        setAnswerText('');
        setSuccessMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('Q&A 저장 오류:', error);
      setErrorMessage('Q&A 저장 중 오류가 발생했습니다.');
    }
  };

  // 메시지 자동 해제
  React.useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // 버튼 hover 상태 관리 (상단으로 이동)
  const [hoverSave, setHoverSave] = useState(false);
  const [hoverSaveNext, setHoverSaveNext] = useState(false);
  const [hoverFullQA, setHoverFullQA] = useState(false);
  const [hoverQuestion, setHoverQuestion] = useState(false);
  const [hoverAnswer, setHoverAnswer] = useState(false);
  const [hoverQASave, setHoverQASave] = useState(false);
  const [hoverAIDo, setHoverAIDo] = useState(false);

  if (!selectedChemical) {
    return (
      <div style={mainContentStyle}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <h3>화학물질을 선택해주세요</h3>
          <p>좌측 목록에서 Q&A를 생성할 화학물질을 선택하면 작업을 시작할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={systemContainerStyle}>
      {/* 메인 콘텐츠 */}
      <div style={{ ...mainContentStyle, position: 'relative' }}>
        {/* 로딩 오버레이 */}
        {isLoading && (
          <div style={loadingOverlayStyle}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🤖</div>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '10px' }}>
              {loadingMessage}
            </div>
            <div style={{ 
              border: '2px solid #f3f4f6', 
              borderTop: '2px solid #3b82f6', 
              borderRadius: '50%', 
              width: '20px', 
              height: '20px', 
              animation: 'spin 1s linear infinite' 
            }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            Q&A 생성: {selectedChemical.name} ({selectedChemical.casNumber})
          </h2>
          <div>
            <button
              style={btnStyle('primary', hoverSave)}
              onClick={handleSaveQA}
              onMouseEnter={() => setHoverSave(true)}
              onMouseLeave={() => setHoverSave(false)}
            >
              💾 임시 저장
            </button>
            <button
              style={btnStyle('success', hoverSaveNext)}
              onClick={handleSaveQA}
              onMouseEnter={() => setHoverSaveNext(true)}
              onMouseLeave={() => setHoverSaveNext(false)}
            >
              ✅ 저장 후 다음
            </button>
          </div>
        </div>

        {/* 메시지 표시 */}
        {successMessage && (
          <div style={messageBoxStyle('success')}>
            ✅ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={messageBoxStyle('error')}>
            ❌ {errorMessage}
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

        {/* Q&A 생성 탭 */}
        <div style={tabContentStyle(activeTab === 'qa-setup')}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={sectionTitleStyle}>Q&A 생성 설정</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>질문 유형</label>
                <select style={selectStyle} value={qaType} onChange={(e) => setQaType(e.target.value)}>
                  <option value="safety">안전성 문의</option>
                  <option value="usage">사용법 문의</option>
                  <option value="component">성분 정보 문의</option>
                  <option value="regulation">규제 정보 문의</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>난이도 수준</label>
                <select style={selectStyle} value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value)}>
                  <option value="general">일반인 수준</option>
                  <option value="professional">전문가 수준</option>
                  <option value="expert">연구자 수준</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
            <button
              style={btnStyle('primary', hoverFullQA)}
              onClick={handleGenerateFullQA}
              disabled={isLoading}
              onMouseEnter={() => setHoverFullQA(true)}
              onMouseLeave={() => setHoverFullQA(false)}
            >
              🤖 AI 전체 Q&A 생성
            </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={subSectionTitleStyle}>질문 생성</h4>
            <div style={guideBoxStyle}>
              <div style={guideTextStyle}>
                AI가 자동으로 질문을 생성하거나 직접 입력할 수 있습니다.<br />
                예: {selectedChemical.name}과 다른 성분을 함께 사용해도 안전한가요?
              </div>
            </div>
            <textarea
              style={{ ...textAreaStyle, height: '100px' }}
              placeholder="질문을 입력하거나 AI 생성 버튼을 클릭하세요"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              disabled={isLoading}
            />
            <button
              style={btnStyle('secondary', hoverQuestion)}
              onClick={handleGenerateQuestion}
              disabled={isLoading}
              onMouseEnter={() => setHoverQuestion(true)}
              onMouseLeave={() => setHoverQuestion(false)}
            >
              ❓ AI 질문 생성
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={subSectionTitleStyle}>답변 생성</h4>
            <div style={guideBoxStyle}>
              <div style={guideTextStyle}>
                화학물질 정보를 기반으로 AI가 전문적인 답변을 생성합니다.<br />
                생성된 답변은 검토 후 수정할 수 있습니다.
              </div>
            </div>
            <textarea
              style={{ ...textAreaStyle, height: '200px' }}
              placeholder="AI가 생성한 답변이 여기에 표시됩니다"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              disabled={isLoading}
            />
            <button
              style={btnStyle('primary', hoverAnswer)}
              onClick={handleGenerateAnswer}
              disabled={isLoading || !questionText.trim()}
              onMouseEnter={() => setHoverAnswer(true)}
              onMouseLeave={() => setHoverAnswer(false)}
            >
              🤖 AI 답변 생성
            </button>
            <button
              style={btnStyle('success', hoverQASave)}
              onClick={handleSaveQA}
              disabled={isLoading || !questionText.trim() || !answerText.trim()}
              onMouseEnter={() => setHoverQASave(true)}
              onMouseLeave={() => setHoverQASave(false)}
            >
              💾 Q&A 저장
            </button>
          </div>
        </div>

        {/* 기본 정보 탭 */}
        <div style={tabContentStyle(activeTab === 'basic-info')}>
          <div style={{ marginBottom: '20px' }}>
            <div style={infoGroupStyle}>
              <div style={infoGroupLabelStyle}>성분명</div>
              <div style={infoGroupValueStyle}>{selectedChemical.name}</div>
            </div>
            <div style={infoGroupStyle}>
              <div style={infoGroupLabelStyle}>CAS 번호</div>
              <div style={infoGroupValueStyle}>{selectedChemical.casNumber}</div>
            </div>
            <div style={infoGroupStyle}>
              <div style={infoGroupLabelStyle}>분자식</div>
              <div style={infoGroupValueStyle}>{selectedChemical.molecularFormula}</div>
            </div>
            <div style={infoGroupStyle}>
              <div style={infoGroupLabelStyle}>주요 용도</div>
              <div style={infoGroupValueStyle}>{selectedChemical.usage}</div>
            </div>
            <div style={infoGroupStyle}>
              <div style={infoGroupLabelStyle}>제품 내 함량</div>
              <div style={infoGroupValueStyle}>{selectedChemical.content_percentage}</div>
            </div>
          </div>
          <div>
            <h4 style={subSectionTitleStyle}>GHS 분류 및 표지</h4>
            <div style={{ marginBottom: '10px' }}>
              {selectedChemical.ghs_codes.map((code, index) => (
                <span key={index} style={ghsCodeStyle}>{code}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 독성 정보 탭 */}
        <div style={tabContentStyle(activeTab === 'toxicity-data')}>
          <h3 style={sectionTitleStyle}>독성 정보</h3>
          <div style={infoGroupStyle}>
            <div style={infoGroupLabelStyle}>LD50 (경구, 쥐)</div>
            <div style={infoGroupValueStyle}>{selectedChemical.ld50_value}</div>
          </div>
          <div style={infoGroupStyle}>
            <div style={infoGroupLabelStyle}>위험 등급</div>
            <div style={infoGroupValueStyle}>{selectedChemical.hazardClass}</div>
          </div>
        </div>

        {/* 규제 정보 탭 */}
        <div style={tabContentStyle(activeTab === 'regulation-info')}>
          <h3 style={sectionTitleStyle}>규제 정보</h3>
          <p>해당 화학물질의 국내외 규제 정보가 여기에 표시됩니다.</p>
        </div>
      </div>

      {/* 사이드바 */}
      <div style={sidebarStyle}>
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>화학물질 정보 요약</h4>
          <div style={infoGroupStyle}>
            <div style={infoGroupLabelStyle}>CAS 번호</div>
            <div style={infoGroupValueStyle}>{selectedChemical.casNumber}</div>
          </div>
          <div style={infoGroupStyle}>
            <div style={infoGroupLabelStyle}>분자식</div>
            <div style={infoGroupValueStyle}>{selectedChemical.molecularFormula}</div>
          </div>
          <div style={infoGroupStyle}>
            <div style={infoGroupLabelStyle}>제품명</div>
            <div style={infoGroupValueStyle}>{selectedChemical.product_name}</div>
          </div>
          <div style={infoGroupStyle}>
            <div style={infoGroupLabelStyle}>함량</div>
            <div style={infoGroupValueStyle}>{selectedChemical.content_percentage}</div>
          </div>
        </div>

        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>독성 정보</h4>
          <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>LD50:</strong> {selectedChemical.ld50_value}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>위험 등급:</strong> {selectedChemical.hazardClass}
            </div>
            <div>
              <strong>GHS 코드:</strong> {selectedChemical.ghs_codes.join(', ')}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>AI 작업 도우미</h4>
          <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, marginBottom: '15px' }}>
            현재 사용 가능한 AI 기능:<br />
            ✅ 질문 자동 생성<br />
            ✅ 전문 답변 작성<br />
            ✅ 안전성 정보 요약<br />
            ✅ 사용법 안내 생성
          </div>
          <button
            style={btnStyle('success', hoverAIDo, { width: '100%', marginRight: 0 })}
            onClick={handleGenerateFullQA}
            disabled={isLoading}
            onMouseEnter={() => setHoverAIDo(true)}
            onMouseLeave={() => setHoverAIDo(false)}
          >
            🤖 AI 도우미 시작
          </button>
        </div>
      </div>

      {/* CSS 애니메이션 */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default QAGenerationSystem;
