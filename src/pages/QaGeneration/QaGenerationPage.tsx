// src/pages/QaGeneration/QaGenerationPage.tsx
import React, { useState, CSSProperties } from 'react';

// --- 스타일 객체 정의 (이전 페이지들과 유사한 스타일은 재활용 또는 유사하게 정의) ---

const pageWrapperStyle: CSSProperties = {
  padding: '24px',
  backgroundColor: '#f9fafb',
};

const mainCardStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  padding: '20px',
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
};

const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
};

// primary, secondary, danger, success 버튼 스타일
const btnStyle = (variant: 'primary' | 'secondary' | 'danger' | 'success', customStyle?: CSSProperties): CSSProperties => {
  let base: CSSProperties = {
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    color: 'white',
    fontWeight: 500,
  };
  if (variant === 'primary') { base.background = '#3b82f6'; }
  else if (variant === 'secondary') { base.background = '#6b7280'; }
  else if (variant === 'danger') { base.background = '#ef4444'; }
  else if (variant === 'success') { base.background = '#10b981'; }
  return { ...base, ...customStyle };
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

const contentGridStyle: CSSProperties = { // data-processing-grid 와 동일
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '20px',
};

const tabContentStyle = (isActive: boolean): CSSProperties => ({
  display: isActive ? 'block' : 'none',
});

const sectionTitleStyle: CSSProperties = { // h3
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '15px',
};
const subSectionTitleStyle: CSSProperties = { // h4
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '10px', // HTML은 0, 여기선 약간 추가
};

const infoLabelStyle: CSSProperties = {
  display: 'block', // label 태그 기본이 inline이라 block으로 변경
  fontWeight: 500,
  color: '#374151',
  fontSize: '14px',
  marginBottom: '5px', // select/input 과의 간격
};

const selectStyle: CSSProperties = {
  width: '100%',
  padding: '10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  backgroundColor: 'white',
  fontSize: '14px',
  marginTop: '5px', // label 과의 간격 (HTML 구조 반영)
};

const filterButtonContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
};

const qaInputGuideBoxStyle: CSSProperties = {
    background: '#f8fafc',
    borderRadius: '8px',
    padding: '15px',
    margin: '10px 0',
};
const qaInputGuideTitleStyle: CSSProperties = {
    fontWeight: 'bold',
    marginBottom: '5px',
    fontSize: '14px',
};
const qaInputGuideTextStyle: CSSProperties = {
    marginBottom: '10px',
    fontSize:'14px',
    color: '#6b7280',
    lineHeight: 1.5,
};

const textAreaStyle: CSSProperties = {
  width: 'calc(100% - 22px)', // padding 고려
  minHeight: '100px', // 기본 높이
  marginTop: '10px',
  padding: '10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  resize: 'vertical',
};

// 화학 정보 표시 (DataProcessingPage의 InfoItem과 유사)
const chemicalInfoStyle: CSSProperties = {
    marginBottom: '20px',
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
const infoGroupLastStyle: CSSProperties = {
    ...infoGroupStyle,
    borderBottom: 'none',
};

const ghsCodeStyle: CSSProperties = { // DataProcessingPage 에서 가져옴
  backgroundColor: '#e0e7ff',
  color: '#3730a3',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 500,
};

// 우측 카드 공통 스타일 (DataProcessingPage 에서 가져옴)
const rightCardStyle: CSSProperties = {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    marginBottom: '20px',
};
const rightCardTitleStyle: CSSProperties = { // h4
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '15px',
    color: '#1f2937',
};
const rightCardTextStyle: CSSProperties = {
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: 1.6,
    marginBottom: '10px', // 버튼과의 간격
};

// 하단 Q&A 목록 스타일
const generatedQaListContainerStyle: CSSProperties = {
    marginTop: '30px',
};
const generatedQaListHeaderStyle: CSSProperties = {
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
};
const generatedQaItemStyle: CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
};
const qaItemTagBoxStyle = (type: 'ingredient' | 'toxicity'): CSSProperties => {
    let base: CSSProperties = {
        borderRadius: '4px',
        padding: '10px',
        marginBottom: '10px',
    };
    if (type === 'ingredient') return {...base, background: '#e0e7ff'}; // 주성분 관련
    if (type === 'toxicity') return {...base, background: '#fef3c7'}; // 독성 관련
    return base;
};
const qaItemTagTextStyle = (type: 'ingredient' | 'toxicity'): CSSProperties => {
    let base: CSSProperties = { fontSize: '12px', marginBottom: '5px' };
    if (type === 'ingredient') return {...base, color: '#3730a3'};
    if (type === 'toxicity') return {...base, color: '#92400e'};
    return base;
};
const qaItemQuestionStyle: CSSProperties = {
    fontWeight: 'bold',
    fontSize: '15px', // 질문이므로 약간 크게
    marginBottom: '10px', // 답변과의 간격
};
const qaItemAnswerStyle: CSSProperties = {
    marginBottom: '10px',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#374151',
};
const qaItemActionsStyle: CSSProperties = {
    display: 'flex',
    gap: '10px',
};


// --- 컴포넌트 정의 ---

// 간단한 정보 표시 그룹 (우측 카드에서 사용)
interface InfoRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}
const InfoRow: React.FC<InfoRowProps> = ({ label, value, isLast }) => (
  <div style={isLast ? infoGroupLastStyle : infoGroupStyle}>
    <div style={infoGroupLabelStyle}>{label}</div>
    <div style={infoGroupValueStyle}>{value}</div>
  </div>
);

// 이미 생성된 Q&A 아이템
interface GeneratedQaItemProps {
    tagType: 'ingredient' | 'toxicity';
    tagText: string;
    question: string;
    answer: string;
}
const GeneratedQaItem: React.FC<GeneratedQaItemProps> = ({tagType, tagText, question, answer}) => (
    <div style={generatedQaItemStyle}>
        <div style={qaItemTagBoxStyle(tagType)}>
            <div style={qaItemTagTextStyle(tagType)}>{tagText}</div>
            <div style={{...qaItemQuestionStyle, fontSize: '14px' /* 태그 안에서는 폰트 통일 */}}>{question}</div>
        </div>
        <div style={qaItemAnswerStyle}>{answer}</div>
        <div style={qaItemActionsStyle}>
            <button style={btnStyle('secondary', {fontSize: '12px', padding: '4px 8px'})}>❌</button>
            <button style={btnStyle('secondary', {fontSize: '12px', padding: '4px 8px'})}>📝</button>
        </div>
    </div>
);


const QaGenerationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('qa-setup');
  const [questionText, setQuestionText] = useState("소듐라우릴황산염과 에탄올을 함께 사용해도 안전한가요?");
  const [answerText, setAnswerText] = useState(
    "에탄올(LD50: 7080mg/kg, 경구, 쥐)은 일반적으로 사용 농도에서 안전성이 확보된 물질입니다. 소듐라우릴황산염과의 혼합 사용에 대한 안전성은 해당 제품의 전체 성분 배합 및 사용 환경에 따라 다를 수 있습니다. 사용 전 제품 라벨의 사용방법 및 주의사항을 반드시 확인하시고, 필요시 전문가와 상담하는 것이 좋습니다.\n\n두 물질 모두 피부 자극을 유발할 수 있으므로, 민감한 피부의 경우 접촉에 주의하고 보호 장갑 등을 사용하는 것이 안전합니다. 눈에 들어가지 않도록 각별히 주의해야 합니다."
  );

  const tabs = [
    { id: 'qa-setup', label: '❓ Q&A 생성' },
    { id: 'basic-info', label: '📋 기본 정보' },
    { id: 'toxicity-data', label: '⚠️ 독성 정보' },
    { id: 'regulation-info', label: '📜 규제 정보' },
  ];

  const generatedQas = [
    {
        tagType: 'ingredient' as const,
        tagText: '주성분 관련',
        question: '소듐라우릴황산염과 에탄올 혼용 시 안전한가요?',
        answer: '에탄올(LD50: 7080mg/kg, 경구, 쥐)은 일반적으로 사용 농도에서 안전성이 확보된 물질이나, 소듐라우릴황산염과의 혼합 사용에 대한 안전성은 특정 제품의 전체 배합 및 사용 환경에 따라 다를 수 있습니다. 사용 시에는 반드시 제품 라벨의 지시사항을 확인하고, 필요시 전문가와 상담하십시오.'
    },
    {
        tagType: 'toxicity' as const,
        tagText: '독성 관련',
        question: '에탄올의 LD50 값과 그 의미는 무엇인가요?',
        answer: '에탄올의 LD50 값(경구, 쥐)은 7080mg/kg입니다. 이는 해당 경로로 투여 시 실험동물의 50%를 치사시키는 양을 의미하며, 물질의 급성 독성 수준을 나타내는 지표 중 하나입니다.'
    }
  ];


  return (
    <div style={pageWrapperStyle}>
      <div style={mainCardStyle}>
        <div style={cardHeaderStyle}>
          <h2 style={cardTitleStyle}>Q&A 생성: 에탄올 (64-17-5)</h2>
          <div style={buttonGroupStyle}>
            <button style={btnStyle('primary')}>임시 저장</button>
            <button style={btnStyle('secondary')}>완료</button>
            <button style={btnStyle('danger')}>저장 후 다음</button>
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

        <div style={contentGridStyle}>
          {/* 좌측 컨텐츠 영역 */}
          <div>
            {/* Q&A 생성 탭 */}
            <div style={tabContentStyle(activeTab === 'qa-setup')}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={sectionTitleStyle}>Q&A 생성 설정</h3>
                <div style={{ marginTop: '15px' }}>
                  <label style={infoLabelStyle}>질문 대상 수준</label>
                  <select style={selectStyle}>
                    <option>주요 성분 관련 질문</option>
                    <option>전문가 수준</option>
                    <option>일반인 수준</option>
                  </select>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label style={infoLabelStyle}>질문 유형</label>
                  <select style={selectStyle}>
                    <option>단순 정보 요청</option>
                    <option>안전성 문의</option>
                    <option>사용법 문의</option>
                    <option>성분 정보 문의</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={infoLabelStyle}>자동 필터 추가</label>
                <div style={filterButtonContainerStyle}>
                  <button style={btnStyle('secondary', { fontSize: '12px', padding: '6px 12px' })}>국가별 필터</button>
                  <button style={btnStyle('secondary', { fontSize: '12px', padding: '6px 12px' })}>정보 유형</button>
                  <button style={btnStyle('secondary', { fontSize: '12px', padding: '6px 12px' })}>분류</button>
                  <button style={btnStyle('secondary', { fontSize: '12px', padding: '6px 12px' })}>난이도</button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={subSectionTitleStyle}>Q&A 작성</h4>
                <div style={qaInputGuideBoxStyle}>
                  <div style={qaInputGuideTitleStyle}>질문 내용</div>
                  <div style={qaInputGuideTextStyle}>
                    생성할 Q&A의 질문을 입력하세요.<br />
                    예: 소듐라우릴황산염과 에탄올을 함께 사용해도 안전한가요?
                  </div>
                </div>
                <textarea
                  style={{...textAreaStyle, height: '100px'}}
                  placeholder="예: 소듐라우릴황산염과 에탄올을 함께 사용해도 안전한가요?"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={qaInputGuideBoxStyle}>
                  <div style={qaInputGuideTitleStyle}>답변 내용</div>
                  <div style={qaInputGuideTextStyle}>
                    생성할 Q&A의 답변을 입력하거나 AI를 통해 생성하세요.<br />
                    예: 에탄올의 LD50(경구, 쥐) 값은 7080mg/kg으로, 이는 실험동물 50%가 사망에 이르는 양을 의미합니다. 두 성분을 혼합 사용할 경우의 안전성은 별도 확인이 필요합니다.
                  </div>
                </div>
                <textarea
                  style={{...textAreaStyle, height: '150px'}}
                  placeholder="생성된 답변이 여기에 표시되거나, 직접 답변을 입력합니다."
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <button style={btnStyle('success', { marginRight: '10px' })}>💾 저장</button>
                <button style={btnStyle('secondary')}>🔄 추가 Q&A 생성</button>
              </div>
            </div>

            {/* 기본 정보 탭 */}
            <div style={tabContentStyle(activeTab === 'basic-info')}>
              <div style={chemicalInfoStyle}>
                <InfoRow label="성분명" value="에탄올" />
                <InfoRow label="CAS 번호" value="64-17-5" />
                <InfoRow label="분자식" value="C₂H₆O" />
                <InfoRow label="주요 용도" value="용매, 살균소독제, 연료 등" isLast/>
              </div>
              <div style={{ marginTop: '20px' }}>
                <div style={infoLabelStyle}>GHS 분류 및 표지</div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <span style={ghsCodeStyle}>H225</span> <span style={ghsCodeStyle}>H319</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '14px' }}>위험 문구: H225, H319</span><br />
                    <span style={{ fontSize: '14px' }}>신호어: 위험 (Danger)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 독성 정보 탭 */}
            <div style={tabContentStyle(activeTab === 'toxicity-data')}>
              <p>에탄올의 상세 독성 정보가 여기에 표시됩니다. (예: LD50, LC50, 피부/눈 자극성 정보 등)</p>
            </div>

            {/* 규제 정보 탭 */}
            <div style={tabContentStyle(activeTab === 'regulation-info')}>
              <p>에탄올 관련 국내외 규제 정보가 여기에 표시됩니다.</p>
            </div>
          </div>

          {/* 우측 컨텐츠 영역 */}
          <div>
            <div style={rightCardStyle}>
              <h4 style={rightCardTitleStyle}>에탄올 정보 요약</h4>
              <div style={{...chemicalInfoStyle, gridTemplateColumns: '1fr' /* 우측은 1단으로 */}}>
                <InfoRow label="CAS 번호" value="64-17-5" />
                <InfoRow label="분자식" value="C₂H₆O" />
                <InfoRow label="주요 함량 (제품 내)" value="70-80% (예시값)" />
                <InfoRow label="주요 용도 (제품 내)" value="살균소독 (활성 성분)" />
                <InfoRow label="GHS 코드" value="H225, H319" isLast/>
              </div>
              <button style={btnStyle('primary', { width: '100%', marginTop: '10px' })}>📊 상세 정보 보기</button>
            </div>

            <div style={rightCardStyle}>
              <h4 style={rightCardTitleStyle}>참고 자료</h4>
              <div style={rightCardTextStyle}>
                주요 정보:<br />
                LD50(경구, 쥐): 7080 mg/kg<br />
                LC50(흡입, 쥐): 124.7 mg/L (4시간)<br />
                LD50(경피, 토끼): 15800 mg/kg
              </div>
              <button style={btnStyle('secondary', { width: '100%', marginTop: '10px' })}>ℹ️ 출처 확인</button>
            </div>

            <div style={rightCardStyle}>
              <h4 style={rightCardTitleStyle}>안전 사용 기준</h4>
              <div style={rightCardTextStyle}>
                예방조치문구 예시:<br />
                P210: 열·스파크·화염·고열로부터 멀리하시오 – 금연.<br />
                P233: 용기를 단단히 밀폐하시오.
              </div>
              <button style={btnStyle('secondary', { width: '100%', marginTop: '10px' })}>ℹ️ 주의사항 전체 보기</button>
            </div>

            <div style={rightCardStyle}>
              <h4 style={rightCardTitleStyle}>AI 작업 로그</h4>
              <div style={rightCardTextStyle}>
                - 질문 기반 답변 자동 생성<br />
                - 참고 자료 기반 정보 요약<br />
                - 답변 길이 및 스타일 조절<br />
                - 추가 고려 사항: 최신 규제, 사용자 피드백 등
              </div>
              <button style={btnStyle('success', { width: '100%', marginTop: '10px' })}>🤖 AI 답변 생성</button>
            </div>
          </div>
        </div>

        {/* 이미 생성된 Q&A 목록 */}
        <div style={generatedQaListContainerStyle}>
            <h3 style={sectionTitleStyle}>이미 생성된 Q&A ({generatedQas.length}건)</h3>
            <div style={generatedQaListHeaderStyle}>
                <select style={{...selectStyle, width: 'auto', marginTop: 0}}>
                    <option>모든 유형</option>
                    <option>안전성 문의</option>
                    <option>사용법 문의</option>
                </select>
                <button style={btnStyle('danger', {fontSize:'12px', padding: '6px 10px'})}>❌ 선택 삭제</button>
                <button style={btnStyle('secondary', {fontSize:'12px', padding: '6px 10px'})}>📝 일괄 편집</button>
            </div>
            {generatedQas.map((qa, index) => (
                <GeneratedQaItem
                    key={index}
                    tagType={qa.tagType}
                    tagText={qa.tagText}
                    question={qa.question}
                    answer={qa.answer}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

export default QaGenerationPage;