// src/pages/DataRefining/DataRefiningPage.tsx
import React, { useState, CSSProperties } from 'react';

// --- 스타일 객체 정의 ---

const pageWrapperStyle: CSSProperties = {
  // 기존 id="data-refining" class="content-section" 에 해당하는 스타일
  // 필요하다면 DashboardPage의 main 스타일 참고
  padding: '24px',
  backgroundColor: '#f9fafb', // DashboardPage와 유사하게
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
  borderBottom: 'none', // HTML 구조상 이렇게 되어 있었음
  display: 'flex', // 탭 버튼들을 가로로 배열
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
  marginBottom: '-1px', // 컨테이너의 border-bottom과 겹치도록
});

const tabContentStyle = (isActive: boolean): CSSProperties => ({
  display: isActive ? 'block' : 'none',
  // 각 탭 컨텐츠의 공통 스타일이 있다면 추가
});

const statGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '15px',
  marginBottom: '20px',
};

const subHeadingStyle: CSSProperties = {
  marginBottom: '15px',
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#1f2937', // 예시 색상
};

// StatCard를 위한 스타일 (DashboardPage.tsx의 StatCard와 유사하게 또는 맞게 조정)
const statCardBaseStyle: CSSProperties = {
  backgroundColor: 'white', // html에서는 배경색이 없었지만, 카드로 보이도록
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};
const statNumberStyle = (color?: string): CSSProperties => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: color || '#1f2937',
  marginBottom: '5px',
});
const statLabelStyle: CSSProperties = {
  fontSize: '0.9rem',
  color: '#6b7280',
};

// IssueCard를 위한 스타일
const issueCardStyle = (type: 'error' | 'warning' | 'suggestion'): CSSProperties => {
  let baseStyle: CSSProperties = {
    border: '1px solid',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '10px',
  };
  if (type === 'error') return { ...baseStyle, background: '#fee2e2', borderColor: '#fecaca' };
  if (type === 'warning') return { ...baseStyle, background: '#fef3c7', borderColor: '#fde68a' };
  if (type === 'suggestion') return { ...baseStyle, background: '#d1fae5', borderColor: '#a7f3d0' };
  return baseStyle;
};

const issueTitleStyle = (type: 'error' | 'warning' | 'suggestion'): CSSProperties => {
  let baseStyle: CSSProperties = { fontWeight: 'bold', marginBottom: '5px' };
  if (type === 'error') return { ...baseStyle, color: '#dc2626' };
  if (type === 'warning') return { ...baseStyle, color: '#d97706' };
  if (type === 'suggestion') return { ...baseStyle, color: '#059669' };
  return baseStyle;
};

const issueContentStyle = (type: 'error' | 'warning' | 'suggestion'): CSSProperties => {
  let baseStyle: CSSProperties = { fontSize: '14px', marginBottom: '10px' };
  if (type === 'error') return { ...baseStyle, color: '#7f1d1d' };
  if (type === 'warning') return { ...baseStyle, color: '#92400e' };
  if (type === 'suggestion') return { ...baseStyle, color: '#065f46' };
  return baseStyle;
};

const issueActionsStyle: CSSProperties = {
  marginTop: '10px',
};

const detailTextStyle: CSSProperties = {
  fontSize: '12px',
  marginBottom: '2px',
};
const detailHighlightStyle = (type: 'error' | 'warning' | 'suggestion'): CSSProperties => {
    if (type === 'error') return { color: '#dc2626' };
    if (type === 'warning') return { color: '#d97706' };
    if (type === 'suggestion') return { color: '#059669' };
    return {};
}

// 버튼 스타일 (HTML의 btn 클래스와 유사하게)
const btnStyle = (variant: 'primary' | 'secondary' | 'warning', customStyle?: CSSProperties): CSSProperties => {
  let base: CSSProperties = {
    border: 'none',
    borderRadius: '6px', // DashboardPage 버튼과 유사하게
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    marginRight: '5px',
    color: 'white',
  };
  if (variant === 'primary') base.background = '#10b981';
  else if (variant === 'secondary') base.background = '#6b7280';
  else if (variant === 'warning') base.background = '#f59e0b';
  return { ...base, ...customStyle };
};

// 테이블 관련 스타일 (DashboardPage.tsx의 스타일 객체 참고)
const tableContainerStyle: CSSProperties = {
  overflowX: 'auto', // 테이블 내용이 길 경우 스크롤
  backgroundColor: '#fff', // DashboardPage와 유사하게
  borderRadius: 8,      // DashboardPage와 유사하게
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)', // DashboardPage와 유사하게
  padding: '20px', // 내부 여백
};
const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};
const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '12px 15px', // DashboardPage thStyle 참고 및 조정
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  fontWeight: 600,
  fontSize: '14px', // DashboardPage thStyle 참고 및 조정
  color: '#374151',
};
const tdStyle: CSSProperties = { // DashboardPage의 tdStyle과 동일하게
  padding: '12px 8px',
  fontSize: 14,
  color: '#374151',
  borderBottom: '1px solid #e5e7eb',
  textAlign: 'left', // HTML 기본값
};
const statusBadgeStyle = (status: 'complete' | 'progress'): CSSProperties => {
  let base: CSSProperties = {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  };
  if (status === 'complete') return { ...base, backgroundColor: '#d1fae5', color: '#065f46' }; // 정제완료
  if (status === 'progress') return { ...base, backgroundColor: '#fee2e2', color: '#991b1b' }; // 자료수정 (예시)
  return { ...base, backgroundColor: '#e5e7eb', color: '#4b5563' };
};

// AutoRefineSettingsCard 스타일
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
  fontSize: '1.1rem',
  fontWeight: 600,
};
const infoLabelStyle: CSSProperties = {
  fontWeight: 500,
  color: '#374151',
  marginBottom: '5px',
};
const checkboxLabelStyle: CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  color: '#4b5563',
};
const checkboxInputStyle: CSSProperties = { // HTML 기본 스타일을 따르므로 별도 스타일 적을 필요는 적음
  marginRight: '8px',
  // accentColor: '#3b82f6', // CSSProperties에 accentColor가 없을 수 있음. 브라우저 기본값 사용.
};
const selectStyle: CSSProperties = {
  width: '100%',
  padding: '10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  marginTop: '10px',
  backgroundColor: 'white',
  fontSize: '14px',
};


// --- 컴포넌트 정의 ---

interface TabInfo {
  id: string;
  label: string;
}

// StatCard 컴포넌트 (DataRefiningPage 전용)
const RefineStatCard: React.FC<{ number: string; label: string; color?: string }> = ({ number, label, color }) => (
  <div style={statCardBaseStyle}>
    <div style={statNumberStyle(color)}>{number}</div>
    <div style={statLabelStyle}>{label}</div>
  </div>
);

// IssueCard 컴포넌트
interface IssueCardProps {
  type: 'error' | 'warning' | 'suggestion';
  title: string;
  content: React.ReactNode;
  actions: React.ReactNode;
}
const IssueCard: React.FC<IssueCardProps> = ({ type, title, content, actions }) => (
    <div style={issueCardStyle(type)}>
        <div style={issueTitleStyle(type)}>{title}</div>
        <div style={issueContentStyle(type)}>{content}</div>
        <div style={issueActionsStyle}>{actions}</div>
    </div>
);


const DataRefiningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('data-refining-tab-content-processing');

  const tabs: TabInfo[] = [
    { id: 'data-refining-tab-content-processing', label: '데이터 정제' },
    { id: 'auto-processing', label: '자동 정제' },
    { id: 'comparison', label: '검수' },
    { id: 'finalized', label: '완료' },
  ];

  const statData = [
    { number: '32건', label: '오류', color: '#ef4444' },
    { number: '5건', label: '경고', color: '#f59e0b' },
    { number: '8건', label: '검토필요', color: '#3b82f6' },
    { number: '12건', label: '정상 완료', color: '#10b981' },
  ];

  return (
    <div style={pageWrapperStyle}>
      <div style={{...sectionCardStyle, padding: 0 /* 내부 탭 컨테이너가 패딩 가짐 */}}>
        <div style={tabContainerStyle}>
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
      </div>

      {/* 데이터 정제 탭 내용 */}
      <div style={tabContentStyle(activeTab === 'data-refining-tab-content-processing')}>
        <div style={statGridStyle}>
          {statData.map(stat => (
            <RefineStatCard key={stat.label} number={stat.number} label={stat.label} color={stat.color} />
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={subHeadingStyle}>발견된 문제점 및 제안사항</h3>
          <IssueCard
            type="error"
            title="❌ CAS 번호 형식 오류"
            content={
              <>
                내용: 소듐라우릴황산염의 CAS 번호 형식이 올바르지 않습니다.
                <div style={{ marginTop: '10px' }}>
                  <div style={detailTextStyle}>
                    입력 형식: <span style={detailHighlightStyle('error')}>151-21-3</span>
                  </div>
                  <div style={detailTextStyle}>
                    정정 제안: <span style={detailHighlightStyle('error')}>151-21-3</span>
                  </div>
                </div>
              </>
            }
            actions={
              <>
                <button style={btnStyle('primary')}>수정 적용</button>
                <button style={btnStyle('secondary')}>무시</button>
                <button style={btnStyle('warning')}>상세 보기</button>
              </>
            }
          />
          <IssueCard
            type="warning"
            title="⚠️ 함량 범위 오류"
            content={
              <>
                내용: 일부 성분의 총 함량이 100%를 초과합니다.<br />
                소듐라우릴황산염: 15-20%<br />
                성분 B (예시): 5-10%<br />
                정제수 (예시): 70-80%
                <div style={{ marginTop: '10px' }}>
                    <div style={detailTextStyle}>
                        정정 제안 (예시): <span style={detailHighlightStyle('warning')}>정제수 함량을 65-75%로 조정</span>
                    </div>
                </div>
              </>
            }
            actions={
              <>
                <button style={btnStyle('primary')}>수정 적용</button>
                <button style={btnStyle('secondary')}>무시</button>
                <button style={btnStyle('warning')}>상세 보기</button>
              </>
            }
          />
          <IssueCard
            type="suggestion"
            title="✅ 독성 정보 표준화 제안"
            content={
              <>
                성분들의 안전성에 대한 설명을 표준화할 수 있습니다.<br />
                현재 독성 정보 예시: <span style={detailHighlightStyle('suggestion')}>에탄올과 혼용 시 안전함</span><br />
                표준화 제안: <span style={detailHighlightStyle('suggestion')}>"안전성 확인됨", "주의 필요" 등 일관된 용어 사용</span>
              </>
            }
            actions={
              <>
                <button style={btnStyle('primary')}>자동 정제</button>
                <button style={btnStyle('warning')}>무시</button>
              </>
            }
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3 style={subHeadingStyle}>정제 전후 데이터 비교</h3>
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>항목</th>
                  <th style={thStyle}>원본 데이터</th>
                  <th style={thStyle}>정제된 데이터</th>
                  <th style={thStyle}>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>제품명</td>
                  <td style={tdStyle}>클린원시 주방세정</td>
                  <td style={tdStyle}>클린원시 주방세정</td>
                  <td style={tdStyle}><span style={statusBadgeStyle('complete')}>정제완료</span></td>
                </tr>
                <tr>
                  <td style={tdStyle}>CAS 번호</td>
                  <td style={tdStyle}>151-21-3</td>
                  <td style={tdStyle}>151-21-3</td>
                  <td style={tdStyle}><span style={statusBadgeStyle('complete')}>정제완료</span></td>
                </tr>
                <tr>
                  <td style={tdStyle}>함량</td>
                  <td style={tdStyle}>15-20%</td>
                  <td style={tdStyle}>15-20%</td>
                  <td style={tdStyle}><span style={statusBadgeStyle('complete')}>정제완료</span></td>
                </tr>
                <tr>
                  <td style={tdStyle}>성분명</td>
                  <td style={tdStyle}>Ethanol</td>
                  <td style={tdStyle}>에탄올</td>
                  <td style={tdStyle}><span style={statusBadgeStyle('progress')}>자료수정</span></td>
                </tr>
                <tr>
                  <td style={tdStyle}>출처</td>
                  <td style={tdStyle}>(정보)</td>
                  <td style={tdStyle}>제조사 MSDS</td>
                  <td style={tdStyle}><span style={statusBadgeStyle('progress')}>추가수정</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{...sectionCardStyle, padding: '20px', marginTop: '20px'}}> {/* 화학 정보 자동 정제 카드 */}
          <div style={cardHeaderStyle}>
            <h3 style={cardTitleStyle}>화학 정보 자동 정제</h3>
            <div>
              <button style={btnStyle('secondary', { marginRight: '10px'})}>초기화</button>
              <button style={btnStyle('primary')}>자동 정제</button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={infoLabelStyle}>자동 정제 범위</div>
            <div style={{ marginTop: '10px' }}>
              <label style={checkboxLabelStyle}><input type="checkbox" style={checkboxInputStyle} defaultChecked /> CAS 번호 형식 자동 수정</label>
              <label style={checkboxLabelStyle}><input type="checkbox" style={checkboxInputStyle} defaultChecked /> SMILES 구조식 자동 생성</label>
              <label style={checkboxLabelStyle}><input type="checkbox" style={checkboxInputStyle} defaultChecked /> 기본 독성 정보 자동 입력</label>
              <label style={checkboxLabelStyle}><input type="checkbox" style={checkboxInputStyle} /> 규제 정보 자동 연동</label>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={infoLabelStyle}>정보 출처 선택</div>
            <select style={selectStyle}>
              <option>화학물질정보시스템 (NCIS)</option>
              <option>ECHA Database</option>
              <option>PubChem</option>
              <option>ChemSpider</option>
            </select>
          </div>

          <button style={btnStyle('primary', { width: '100%' })}>🔧 정제 규칙 관리</button>
        </div>
      </div>

      {/* 자동 정제 탭 내용 */}
      <div style={tabContentStyle(activeTab === 'auto-processing')}>
        <div style={sectionCardStyle}> {/* 내용을 감싸는 카드 추가 */}
           <p style={{padding: '20px'}}>자동 정제 설정 및 결과가 여기에 표시됩니다.</p>
        </div>
      </div>

      {/* 검수 탭 내용 */}
      <div style={tabContentStyle(activeTab === 'comparison')}>
        <div style={sectionCardStyle}>
            <p style={{padding: '20px'}}>데이터 검수 및 비교 내용이 여기에 표시됩니다.</p>
        </div>
      </div>

      {/* 완료 탭 내용 */}
      <div style={tabContentStyle(activeTab === 'finalized')}>
        <div style={sectionCardStyle}>
            <p style={{padding: '20px'}}>최종 완료된 데이터 목록이 여기에 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default DataRefiningPage;