// src/pages/DataProcessing/DataProcessingPage.tsx
import React, { useState, CSSProperties } from 'react';

// --- 스타일 객체 정의 ---

const pageWrapperStyle: CSSProperties = {
  padding: '24px',
  backgroundColor: '#f9fafb',
};

const mainCardStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  padding: '20px', // 카드 자체의 패딩
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
  fontSize: '1.5rem', // h2에 해당
  fontWeight: 600,
};

const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
};

// btn-secondary, btn-success 와 유사한 스타일
const btnStyle = (variant: 'secondary' | 'success' | 'primary', customStyle?: CSSProperties): CSSProperties => {
  let base: CSSProperties = {
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px', // 기본 버튼 크기
    fontSize: '14px',
    cursor: 'pointer',
    color: 'white',
    fontWeight: 500,
  };
  if (variant === 'secondary') { base.background = '#6b7280'; } // 초기화
  else if (variant === 'success') { base.background = '#10b981'; } // 설명문 생성, 저장
  else if (variant === 'primary') { base.background = '#3b82f6'; } // (필요시)
  return { ...base, ...customStyle };
};


const tabsContainerStyle: CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid #e0e0e0', // HTML의 tabs 클래스에 border-bottom은 없었지만, 구분선 역할
  marginBottom: '20px',
};

const tabButtonStyle = (isActive: boolean): CSSProperties => ({
  padding: '10px 20px', // HTML tab 클래스 패딩과 유사하게
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: isActive ? 'bold' : 'normal',
  color: isActive ? '#3b82f6' : '#6b7280',
  borderBottom: isActive ? '3px solid #3b82f6' : '3px solid transparent',
  marginRight: '10px', // 탭 간 간격
});

const dataProcessingGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr', // 좌측이 더 넓게 (내용이 많으므로)
  gap: '20px',
};

const tabContentStyle = (isActive: boolean): CSSProperties => ({
  display: isActive ? 'block' : 'none',
});

const chemicalInfoStyle: CSSProperties = {
  // border: '1px solid #e5e7eb', // 필요시 경계선
  // borderRadius: '8px',
  // padding: '15px',
  marginBottom: '20px', // 각 정보 그룹 후 여백
};

const infoGroupStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0', // 각 항목의 상하 패딩
  borderBottom: '1px dashed #e0e0e0', // 항목 구분선 (선택 사항)
  alignItems: 'center',
};
const infoGroupLastStyle: CSSProperties = { // 마지막 항목은 하단선 제거
    ...infoGroupStyle,
    borderBottom: 'none',
};


const infoLabelStyle: CSSProperties = {
  fontWeight: 500,
  color: '#374151',
  fontSize: '14px',
};

const infoValueStyle: CSSProperties = {
  color: '#4b5563',
  fontSize: '14px',
  textAlign: 'right',
};

const ghsCodeStyle: CSSProperties = {
  backgroundColor: '#e0e7ff', // 연한 파란색 배경
  color: '#3730a3',          // 진한 파란색 글씨
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: 500,
};

const radioLabelStyle: CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  color: '#4b5563',
};
const radioInputStyle: CSSProperties = {
  marginRight: '6px',
};

const guidelinesBoxStyle: CSSProperties = {
  backgroundColor: '#f0f9ff', // 연한 하늘색
  border: '1px solid #bae6fd',
  borderRadius: '8px',
  padding: '15px',
  marginTop: '20px',
};

const textAreaStyle: CSSProperties = {
  width: 'calc(100% - 20px)', // padding 고려
  minHeight: '120px',
  marginTop: '10px',
  padding: '10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  resize: 'vertical', // 세로 크기만 조절 가능
};

const validationBoxStyle: CSSProperties = {
  backgroundColor: '#f0fdf4', // 연한 녹색
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '15px',
  marginTop: '20px',
};
const validationSuccessTitleStyle: CSSProperties = {
    color: '#059669',
    fontWeight: 'bold',
    marginBottom: '5px',
};
const validationSuccessTextStyle: CSSProperties = {
    color: '#059669',
    fontSize: '14px',
};


const previewBoxStyle: CSSProperties = { // 좌측의 미리보기 박스
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '15px',
  marginTop: '20px',
  backgroundColor: '#f9fafb', // 약간의 배경색
};

const feedbackBoxStyle: CSSProperties = {
  backgroundColor: '#fff7ed', // 연한 주황색
  border: '1px solid #fed7aa',
  borderRadius: '8px',
  padding: '15px',
  marginTop: '20px',
};
const feedbackWarningTextStyle: CSSProperties = {
    color: '#ea580c',
    fontSize: '14px',
};


// 우측 카드 공통 스타일
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

const rightPreviewContentStyle: CSSProperties = {
    background: '#fafafa',
    borderRadius: '8px',
    padding: '15px',
};
const rightPreviewTextStyle: CSSProperties = {
    fontWeight: 'bold',
    marginBottom: '10px',
    fontSize: '14px', // 원본 HTML과 유사하게
    lineHeight: 1.6,
};
const rightPreviewMetaStyle: CSSProperties = {
    fontSize: '12px',
    color: '#6b7280',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '10px',
    lineHeight: 1.5,
};

const statusHighlightStyle = (status: 'warning' | 'info' | 'success'): CSSProperties => {
    let base: CSSProperties = { fontWeight: 'bold', marginBottom: '5px' };
    if (status === 'warning') return { ...base, color: '#f59e0b' }; // 검수 대기 중
    // 다른 상태들도 추가 가능
    return base;
}
const statusMetaTextStyle: CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.5,
}

const warningBoxStyle: CSSProperties = { // 독성 정보 탭의 경고 박스
    backgroundColor: '#fefce8', // 연한 노란색
    border: '1px solid #fef08a',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
};
const warningBoxTitleStyle: CSSProperties = {
    color: '#d97706',
    fontWeight: 'bold',
    marginBottom: '5px',
};
const warningBoxTextStyle: CSSProperties = {
    color: '#92400e',
    fontSize: '14px',
};


// --- 컴포넌트 정의 ---

// 간단한 정보 표시 그룹 (좌측에서 사용)
interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  isLast?: boolean;
}
const InfoItem: React.FC<InfoItemProps> = ({ label, value, isLast }) => (
  <div style={isLast ? infoGroupLastStyle : infoGroupStyle}>
    <div style={infoLabelStyle}>{label}</div>
    <div style={infoValueStyle}>{value}</div>
  </div>
);


const DataProcessingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('main-component');
  const [mainDescription, setMainDescription] = useState(
    "소듐라우릴황산염은 강력한 세정력과 발포작용을 가진 음이온성 계면활성제로, 다양한 세정제와 화장품에 널리 사용됩니다. 이 성분은 기름과 오염물질을 효과적으로 제거하며 풍부한 거품을 생성하는 특성이 있습니다. 다만, 일부 사용자에게 피부 자극을 유발할 수 있으므로 민감성 피부의 경우 사용 시 주의가 필요합니다."
  );
  const [toxicityDescription, setToxicityDescription] = useState(
    "소듐라우릴황산염은 피부와 눈에 자극을 유발할 수 있습니다. 특히 눈에 직접 접촉할 경우 심한 자극 또는 손상을 일으킬 수 있으므로 주의해야 합니다. 장기간 또는 반복적인 피부 접촉은 피부염을 유발할 수 있으며, 일부 민감한 개인에게는 알레르기 반응이 나타날 수 있습니다. 수생 환경에 유해할 수 있습니다."
  );
  const [warningNotes, setWarningNotes] = useState(
    `【경고】
• 눈에 들어가지 않도록 주의하십시오.
• 피부에 직접적인 접촉을 피하십시오.
• 어린이의 손이 닿지 않는 곳에 보관하십시오.
• 사용 후에는 손을 깨끗이 씻으십시오.

【응급처치】
• 눈에 들어갔을 때: 즉시 다량의 물로 15분 이상 씻어내고 의사의 진료를 받으십시오.
• 피부에 접촉했을 때: 비누와 물로 깨끗이 씻어내십시오. 자극이 지속되면 의사의 진료를 받으십시오.
• 삼켰을 때: 물을 마시게 하고 즉시 의사의 진료를 받으십시오. (억지로 토하게 하지 마십시오.)`
  );


  const tabs = [
    { id: 'main-component', label: '📋 주성분 설명문' },
    { id: 'toxicity-info', label: '⚠️ 독성 설명문' },
    { id: 'warning-notes', label: '🚨 경고문 및 주의사항' },
  ];

  const getPreviewText = () => {
    if (activeTab === 'main-component') return mainDescription;
    if (activeTab === 'toxicity-info') return toxicityDescription;
    if (activeTab === 'warning-notes') return warningNotes;
    return "미리보기 내용이 없습니다.";
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('CAS 번호가 복사되었습니다.');
    }).catch(err => {
      console.error('복사 실패:', err);
    });
  };

  return (
    <div style={pageWrapperStyle}>
      <div style={mainCardStyle}>
        <div style={cardHeaderStyle}>
          <h2 style={cardTitleStyle}>ChemiGuard v1.0 - 설명문 생성 시스템</h2>
          <div style={buttonGroupStyle}>
            <button style={btnStyle('secondary')}>🔄 초기화</button>
            <button style={btnStyle('success')}>🤖 설명문 생성</button>
            <button style={btnStyle('success')}>💾 저장</button>
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

        <div style={dataProcessingGridStyle}>
          {/* 좌측 컨텐츠 영역 */}
          <div>
            {/* 주성분 설명문 탭 */}
            <div style={tabContentStyle(activeTab === 'main-component')}>
              <div style={chemicalInfoStyle}>
                <InfoItem label="성분명" value="소듐라우릴황산염" />
                <InfoItem label="CAS 번호" value={
                  <>
                    151-21-3
                    <span style={{ marginLeft: '8px', cursor: 'pointer', fontSize:'16px' }} title="복사" onClick={() => handleCopy('151-21-3')}>📋</span>
                  </>
                } />
                <InfoItem label="함량" value="15-20%" />
                <InfoItem label="용도" value="세정제" isLast/>
              </div>

              <div style={{ marginTop: '20px' }}>
                <div style={infoLabelStyle}>GHS 코드</div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <span style={ghsCodeStyle}>H315</span>
                  <span style={ghsCodeStyle}>H318</span>
                  <span style={ghsCodeStyle}>H412</span>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <InfoItem label="LD50" value="1200 mg/kg (경구, 쥐)" isLast/>
              </div>

              <div style={{ marginTop: '20px' }}>
                <div style={infoLabelStyle}>설명 대상 선택</div>
                <div style={{ marginTop: '10px' }}>
                  <label style={radioLabelStyle}><input type="radio" name="component_audience" style={radioInputStyle} defaultChecked /> 일반인용</label>
                  <label style={radioLabelStyle}><input type="radio" name="component_audience" style={radioInputStyle} /> 전문가용</label>
                </div>
              </div>

              <div style={guidelinesBoxStyle}>
                <div style={{ fontSize: '14px', color: '#0369a1', lineHeight: 1.6 }}>
                  📝 주성분 설명문 작성 가이드라인<br /><br />
                  • 성분의 물리화학적 특성 및 기능 설명 (1문장)<br />
                  • 주된 사용 목적 및 기대 효과 설명 (1문장)<br />
                  • 주요 주의사항 (1-2문장)
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                  ⚡ 필수 포함 요소: 성분명, 주요 기능, 사용 목적, 핵심 주의사항
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <label style={{...infoLabelStyle, display: 'block' }}>📝 설명문 작성</label>
                <textarea
                  style={textAreaStyle}
                  placeholder="주성분에 대한 설명문을 작성하세요..."
                  value={mainDescription}
                  onChange={(e) => setMainDescription(e.target.value)}
                />
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px', textAlign: 'right' }}>
                    글자 수: {mainDescription.length} / 권장: 150자 내외
                </div>
              </div>

              <div style={validationBoxStyle}>
                <div style={validationSuccessTitleStyle}>🎯 자동 검증 결과</div>
                <div style={validationSuccessTextStyle}>✅ 모든 검증 항목을 통과했습니다.</div>
              </div>

              <div style={previewBoxStyle}> {/* 좌측 하단 미리보기 (HTML 구조에 있음) */}
                <div style={{...infoLabelStyle, marginBottom: '10px'}}>⏰ 실시간 미리보기</div>
                <div style={{ fontWeight: 'bold', margin: '10px 0', fontSize: '14px', lineHeight: 1.6 }}>{mainDescription}</div>
                <div style={rightPreviewMetaStyle}> {/* rightPreviewMetaStyle 재활용 */}
                    📊 검수 상태:<br />
                    • 작성일: 2025-04-30 15:30<br />
                    • 버전: v1.1<br />
                    • 검수자: 이영수
                </div>
              </div>

              <div style={feedbackBoxStyle}>
                <div style={feedbackWarningTextStyle}>
                    ⚠️ 검수가 완료되지 않았습니다. 검수 완료 후 최종 승인됩니다.
                </div>
              </div>
            </div>

            {/* 독성 설명문 탭 */}
            <div style={tabContentStyle(activeTab === 'toxicity-info')}>
              <div style={warningBoxStyle}>
                <div style={warningBoxTitleStyle}>⚠️ 독성 정보 확인</div>
                <div style={warningBoxTextStyle}>이 성분은 아래와 같은 독성 정보가 등록되어 있습니다. 설명문 작성 시 유의하십시오.</div>
              </div>

              <div style={chemicalInfoStyle}>
                <InfoItem label="급성 독성 (경구)" value="LD50: 1,288 mg/kg (쥐)" />
                <InfoItem label="피부 자극성" value="중등도 자극성 (토끼)" />
                <InfoItem label="눈 자극성" value="심한 자극성 (토끼)" />
                <InfoItem label="환경 독성 (어류)" value="LC50: 7.8 mg/L (무지개송어, 96시간)" isLast/>
              </div>

              <div style={{ marginTop: '20px' }}>
                <label style={{...infoLabelStyle, display: 'block' }}>⚠️ 독성 설명문 작성</label>
                <textarea
                    style={{...textAreaStyle, height: '120px'}}
                    placeholder="독성 정보에 대한 설명문을 작성하세요..."
                    value={toxicityDescription}
                    onChange={(e) => setToxicityDescription(e.target.value)}
                />
                 <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px', textAlign: 'right' }}>
                    글자 수: {toxicityDescription.length}
                </div>
              </div>
               {/* 이 탭에도 미리보기/검증결과 등이 필요하면 추가 */}
            </div>

            {/* 경고문 및 주의사항 탭 */}
            <div style={tabContentStyle(activeTab === 'warning-notes')}>
              <div style={{ marginTop: '20px' }}>
                <label style={{...infoLabelStyle, display: 'block' }}>🚨 경고문 및 주의사항</label>
                <textarea
                    style={{...textAreaStyle, height: '200px'}}
                    placeholder="경고문과 주의사항을 작성하세요..."
                    value={warningNotes}
                    onChange={(e) => setWarningNotes(e.target.value)}
                />
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px', textAlign: 'right' }}>
                    글자 수: {warningNotes.length}
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <label style={{...infoLabelStyle, display: 'block', marginBottom: '10px' }}>🎯 대상별 맞춤 경고</label>
                <div style={chemicalInfoStyle}> {/* chemicalInfoStyle 재활용 가능 */}
                    <InfoItem label="일반 사용자용" value="사용 시 고무장갑 착용을 권장합니다." />
                    <InfoItem label="산업/전문가용" value="적절한 개인보호구(보안경, 보호장갑, 보호의)를 착용하십시오." isLast />
                </div>
              </div>
              {/* 이 탭에도 미리보기/검증결과 등이 필요하면 추가 */}
            </div>
          </div>

          {/* 우측 컨텐츠 영역 */}
          <div>
            <div style={rightCardStyle}>
              <h4 style={rightCardTitleStyle}>실시간 미리보기</h4>
              <div style={rightPreviewContentStyle}>
                <p style={rightPreviewTextStyle}>{getPreviewText()}</p>
                <div style={rightPreviewMetaStyle}>
                  📊 검수 상태:<br />
                  • 작성일: 2025-04-30 15:30<br />
                  • 버전: v1.1<br />
                  • 검수자: 이영수
                </div>
              </div>
            </div>

            <div style={rightCardStyle}>
              <h4 style={rightCardTitleStyle}>검수 상태</h4>
              <div style={statusHighlightStyle('warning')}>🟡 검수 대기 중</div>
              <div style={statusMetaTextStyle}>
                작성일: 2025-04-30 15:30<br />
                버전: v1.1<br />
                검수자: 이영수
              </div>
            </div>

            <div style={rightCardStyle}>
              <h4 style={rightCardTitleStyle}>📊 검수 피드백</h4>
              <div style={{ background: '#fffbeb', border: '1px solid #fed7aa', borderRadius: '8px', padding: '15px' }}>
                <div style={{ color: '#ea580c', fontSize: '14px' }}>
                  ⚠️ 검수가 완료되지 않았습니다. 검수 완료 후 최종 승인됩니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataProcessingPage;