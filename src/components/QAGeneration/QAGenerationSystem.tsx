// src/components/QAGeneration/QAGenerationSystem.tsx
import React, { useState, CSSProperties } from 'react';
import { ChemicalData } from '../../types/qaGeneration';

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

const btnStyle = (variant: 'primary' | 'secondary' | 'success' | 'danger', customStyle?: CSSProperties): CSSProperties => {
  const baseStyle: CSSProperties = {
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    color: 'white',
    fontWeight: 500,
    marginRight: '10px',
  };

  let colorStyle: CSSProperties = {};
  switch (variant) {
    case 'primary': colorStyle = { backgroundColor: '#3b82f6' }; break;
    case 'secondary': colorStyle = { backgroundColor: '#6b7280' }; break;
    case 'success': colorStyle = { backgroundColor: '#10b981' }; break;
    case 'danger': colorStyle = { backgroundColor: '#ef4444' }; break;
  }

  return { ...baseStyle, ...colorStyle, ...customStyle };
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

  const tabs = [
    { id: 'qa-setup', label: '❓ Q&A 생성' },
    { id: 'basic-info', label: '📋 기본 정보' },
    { id: 'toxicity-data', label: '⚠️ 독성 정보' },
    { id: 'regulation-info', label: '📜 규제 정보' },
  ];

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

  const handleGenerateQA = () => {
    // AI 기반 Q&A 생성 로직
    const sampleQuestions = [
      `${selectedChemical.name}과 다른 성분을 함께 사용해도 안전한가요?`,
      `${selectedChemical.name}의 독성 수준은 어느 정도인가요?`,
      `${selectedChemical.name}이 포함된 제품 사용 시 주의사항은 무엇인가요?`,
      `${selectedChemical.name}의 환경 영향은 어떤가요?`,
    ];
    
    const randomQuestion = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
    setQuestionText(randomQuestion);
    
    // 답변 생성 (실제로는 AI API 호출)
    const sampleAnswer = `${selectedChemical.name}(CAS: ${selectedChemical.casNumber})은 ${selectedChemical.usage}로 사용되는 화학물질입니다. LD50 값은 ${selectedChemical.ld50_value}이며, 이는 급성 독성 수준을 나타냅니다. 사용 시에는 해당 제품의 라벨에 표시된 안전수칙을 반드시 준수하고, 필요시 전문가와 상담하는 것이 좋습니다.`;
    setAnswerText(sampleAnswer);
  };

  return (
    <div style={systemContainerStyle}>
      {/* 메인 콘텐츠 */}
      <div style={mainContentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            Q&A 생성: {selectedChemical.name} ({selectedChemical.casNumber})
          </h2>
          <div>
            <button style={btnStyle('primary')}>임시 저장</button>
            <button style={btnStyle('success')}>저장 후 다음</button>
          </div>
        </div>

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
            />

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
            />
            <button style={btnStyle('primary')}>🤖 AI 답변 생성</button>
            <button style={btnStyle('success')}>💾 Q&A 저장</button>
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
            - 질문 자동 생성<br />
            - 전문 답변 작성<br />
            - 안전성 정보 요약<br />
            - 사용법 안내 생성
          </div>
          <button style={btnStyle('success', { width: '100%', marginRight: 0 })}>
            🤖 AI 도우미 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default QAGenerationSystem;
