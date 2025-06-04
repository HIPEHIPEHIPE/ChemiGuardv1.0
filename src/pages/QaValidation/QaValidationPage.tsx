// src/pages/QaValidation/QaValidationPage.tsx
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
  padding: '25px',
  marginBottom: '20px',
};

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  paddingBottom: '15px',
  borderBottom: '1px solid #f3f4f6',
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

const btnStyle = (variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning', customStyle?: CSSProperties): CSSProperties => {
  let base: CSSProperties = {
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    color: 'white',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
  };
  if (variant === 'primary') { base.background = '#4f46e5'; }
  else if (variant === 'secondary') { base.background = '#6b7280'; }
  else if (variant === 'danger') { base.background = '#ef4444'; }
  else if (variant === 'success') { base.background = '#10b981'; }
  else if (variant === 'warning') { base.background = '#f59e0b'; }
  return { ...base, ...customStyle };
};

const tabsContainerStyle: CSSProperties = {
  display: 'flex',
  gap: '5px',
  marginBottom: '20px',
  borderBottom: '1px solid #e5e7eb',
};

const tabButtonStyle = (isActive: boolean): CSSProperties => ({
  padding: '12px 20px',
  background: 'none',
  border: 'none',
  color: isActive ? '#4f46e5' : '#6b7280',
  cursor: 'pointer',
  borderBottom: isActive ? '2px solid #4f46e5' : '2px solid transparent',
  fontSize: '14px',
  fontWeight: isActive ? 600 : 'normal',
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

const productInfoSectionStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
};
const productInfoTitleStyle: CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '5px',
};
const productInfoSubTextStyle: CSSProperties = {
    color: '#6b7280',
    fontSize: '14px',
};

const productSummaryBoxStyle: CSSProperties = {
    background: '#f8fafc',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
};
const productSummaryGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
};
const summaryItemLabelStyle: CSSProperties = {
    fontWeight: 'bold',
    marginBottom: '5px',
    fontSize: '14px',
};
const summaryItemValueStyle: CSSProperties = {
    color: '#6b7280',
    fontSize: '14px',
};

const infoGrid3ColStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
};

const ghsComparisonGridStyle: CSSProperties = {
    display: 'flex',
    gap: '40px',
    alignItems: 'flex-start',
};
const ghsInfoBoxLabelStyle: CSSProperties = {
    fontSize: '14px',
    marginBottom: '5px',
    fontWeight: 500,
};
const ghsCodeContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '10px',
    marginBottom: '5px',
};

// 수정된 ghsCodeStyle 정의
const ghsCodeStyle = (isNew?: boolean): CSSProperties => ({
  background: isNew ? '#f59e0b' : '#ef4444',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  marginRight: '5px',
});

const ghsMetaTextStyle: CSSProperties = {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: 1.5,
};
const ghsNewTextStyle: CSSProperties = {
    color: '#f59e0b',
};

const tableContainerStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
};
const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};
const thStyle: CSSProperties = {
  background: '#f8fafc',
  padding: '12px 15px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#374151',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '13px',
};
const tdStyle: CSSProperties = {
  padding: '12px 15px',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '13px',
  verticalAlign: 'middle',
};

const checklistReviewBoxStyle: CSSProperties = {
    background: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    padding: '15px',
};
const checklistTitleStyle: CSSProperties = {
    color: '#856404',
    fontWeight: 'bold',
    marginBottom: '10px',
};
const checklistContentStyle: CSSProperties = {
    color: '#6c5300',
    marginBottom: '15px',
    fontSize:'14px',
    lineHeight: 1.6,
};
const infoLabelStyle: CSSProperties = {
    display: 'block',
    fontWeight: 500,
    color: '#374151',
    fontSize: '14px',
    marginBottom: '5px',
};
const textAreaStyle: CSSProperties = {
  width: 'calc(100% - 24px)',
  minHeight: '80px',
  padding: '12px',
  border: '2px solid #e5e7eb',
  borderRadius: '8px',
  resize: 'vertical',
  fontFamily: 'inherit',
  marginTop: '5px',
};

const historyTimelineStyle: CSSProperties = {
    borderLeft: '3px solid #e5e7eb',
    paddingLeft: '15px',
    marginTop: '20px',
};
const historyItemStyle: CSSProperties = {
    marginBottom: '20px',
    position: 'relative',
};
const historyItemDotStyle: CSSProperties = {
    position: 'absolute',
    left: '-23px',
    top: '4px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#e5e7eb',
};

const historyItemTitleStyle = (type: 'initial' | 'review'): CSSProperties => ({
    fontWeight: 'bold',
    color: type === 'initial' ? '#059669' : '#1d4ed8',
    marginBottom: '3px',
});
const historyItemMetaStyle: CSSProperties = {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '5px',
};
const historyItemContentStyle: CSSProperties = {
    fontSize: '14px',
    marginTop: '5px',
    lineHeight: 1.5,
};
const historyItemStatusBoxStyle = (type: 'pending' | 'feedback'): CSSProperties => {
    let base: CSSProperties = { padding: '8px', borderRadius: '4px', marginTop: '8px', fontSize: '12px'};
    if (type === 'pending') return {...base, background: '#e0e7ff', color: '#3730a3'};
    if (type === 'feedback') return {...base, background: '#fffbeb', color: '#d97706'};
    return base;
};

// --- 컴포넌트 정의 ---

interface HistoryItemProps {
    type: 'initial' | 'review';
    title: string;
    dateTime: string;
    author: string;
    content: string;
    statusType?: 'pending' | 'feedback';
    statusText?: string;
    feedbackOrStatusContent?: string;
}
const HistoryItemDisplay: React.FC<HistoryItemProps> = ({ type, title, dateTime, author, content, statusType, statusText, feedbackOrStatusContent}) => (
    <div style={historyItemStyle}>
        <span style={{...historyItemDotStyle, background: type === 'initial' ? '#059669' : '#1d4ed8'}}></span>
        <div style={historyItemTitleStyle(type)}>{title}</div>
        <div style={historyItemMetaStyle}>{dateTime} ({author})</div>
        <div style={historyItemContentStyle}>{content}</div>
        {statusType && feedbackOrStatusContent && (
            <div style={historyItemStatusBoxStyle(statusType)}>
                {statusText && <strong style={{marginRight: '5px'}}>{statusText}:</strong>}
                {feedbackOrStatusContent}
            </div>
        )}
    </div>
);

const QaValidationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending-review');
  const [reviewerComment, setReviewerComment] = useState('');

  const tabs = [
    { id: 'pending-review', label: '검수 대기 (43)' },
    { id: 'completed-review', label: '검수 완료 (152)' },
    { id: 'rework-list', label: '재작업 요청 (28)' },
    { id: 'auto-approved', label: '자동 승인 (28)' },
  ];

  const toxicityData = [
    { type: '급성독성 LD50', value: '1200', unit: 'mg/kg', species: '랫드(Rat)', route: '경구', duration: '-', source: 'ECHA' },
    { type: '급성독성 LC50', value: '>3.9', unit: 'mg/L', species: '랫드(Rat)', route: '흡입 (더스트/미스트)', duration: '1시간', source: 'HSDB, ECHA' },
    { type: '급성독성 LD50', value: '>2000', unit: 'mg/kg', species: '토끼(Rabbit)', route: '경피', duration: '-', source: 'ECHA' },
  ];

  const historyItems: HistoryItemProps[] = [ // 타입 명시
    { type: 'initial', title: '데이터 입력 및 초기 검토', dateTime: '2025-04-25 14:15', author: '이하나', content: '기본 정보 및 독성 정보 초안 작성 완료.', statusType: 'pending', statusText: '상태', feedbackOrStatusContent: '검수 대기' },
    { type: 'review', title: '1차 검수', dateTime: '2025-04-30 09:35', author: '박서준', content: '일부 수치 데이터 및 출처 정보 보완. GHS 분류 재확인 필요.', statusType: 'feedback', statusText: '피드백', feedbackOrStatusContent: '수생 독성 관련 정보 추가 검토 요청' },
  ];

  return (
    <div style={pageWrapperStyle}>
      <div style={mainCardStyle}>
        <div style={cardHeaderStyle}>
          <h2 style={cardTitleStyle}>데이터 검수</h2>
          <div style={buttonGroupStyle}>
            <button style={btnStyle('secondary')}>🔍 고급 검색</button>
            <button style={btnStyle('primary')}>📊 새 데이터 추가</button>
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

        <div style={tabContentStyle(activeTab === 'pending-review')}>
          <div style={{...mainCardStyle, padding: '20px', marginBottom: '20px'}}>
            <div style={productInfoSectionStyle}>
              <div>
                <h3 style={productInfoTitleStyle}>제품 정보: 클린원시 주방세정</h3>
                <div style={productInfoSubTextStyle}>주성분: 소듐라우릴황산염 (CAS: 151-21-3)</div>
              </div>
              <div style={buttonGroupStyle}>
                <button style={btnStyle('secondary')}>📝 변경 이력 보기</button>
                <button style={btnStyle('primary')}>📊 전체 목록으로</button>
              </div>
            </div>
            <div style={productSummaryBoxStyle}>
              <div style={productSummaryGridStyle}>
                <div>
                  <div style={summaryItemLabelStyle}>카테고리</div>
                  <div style={summaryItemValueStyle}>세정제</div>
                </div>
                <div>
                  <div style={summaryItemLabelStyle}>담당 검수자</div>
                  <div style={summaryItemValueStyle}>김민준</div>
                </div>
                <div>
                  <div style={summaryItemLabelStyle}>최종 작업일</div>
                  <div style={summaryItemValueStyle}>2025-04-25</div>
                </div>
                <div>
                  <div style={summaryItemLabelStyle}>최초 작성자</div>
                  <div style={summaryItemValueStyle}>이하나</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{...mainCardStyle, padding: '20px', marginBottom: '20px'}}>
            <h3 style={sectionTitleStyle}>주성분 정보</h3>
            <div style={infoGrid3ColStyle}>
              <div>
                <div style={summaryItemLabelStyle}>성분명</div>
                <div style={summaryItemValueStyle}>소듐라우릴황산염</div>
              </div>
              <div>
                <div style={summaryItemLabelStyle}>CAS 번호</div>
                <div style={summaryItemValueStyle}>151-21-3</div>
              </div>
              <div>
                <div style={summaryItemLabelStyle}>함량</div>
                <div style={summaryItemValueStyle}>15-20%</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={subSectionTitleStyle}>GHS 분류 및 표지</h4>
              <div style={ghsComparisonGridStyle}>
                <div>
                  <div style={ghsInfoBoxLabelStyle}>현재 정보</div>
                  <div style={ghsCodeContainerStyle}>
                    <span style={ghsCodeStyle()}>H315</span>
                    <span style={ghsCodeStyle()}>H318</span>
                  </div>
                  <div style={ghsMetaTextStyle}>
                    그림문자: GHS05, GHS07<br />
                    신호어: 위험 (Danger)
                  </div>
                </div>
                <div>
                  <div style={ghsInfoBoxLabelStyle}>제안 변경사항</div>
                  <div style={ghsCodeContainerStyle}>
                    <span style={ghsCodeStyle()}>H315</span>
                    <span style={ghsCodeStyle()}>H318</span>
                    <span style={ghsCodeStyle(true)}>H411</span>
                  </div>
                  <div style={ghsMetaTextStyle}>
                    그림문자: GHS05, GHS07, <span style={ghsNewTextStyle}>GHS09</span><br />
                    신호어: 위험 (Danger)
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={subSectionTitleStyle}>독성값</h4>
              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>독성 유형</th>
                      <th style={thStyle}>수치</th>
                      <th style={thStyle}>단위</th>
                      <th style={thStyle}>시험종</th>
                      <th style={thStyle}>노출 경로</th>
                      <th style={thStyle}>노출 시간</th>
                      <th style={thStyle}>출처</th>
                      <th style={thStyle}>확인</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toxicityData.map((item, index) => (
                      <tr key={index}>
                        <td style={tdStyle}>{item.type}</td>
                        <td style={tdStyle}>{item.value}</td>
                        <td style={tdStyle}>{item.unit}</td>
                        <td style={tdStyle}>{item.species}</td>
                        <td style={tdStyle}>{item.route}</td>
                        <td style={tdStyle}>{item.duration}</td>
                        <td style={tdStyle}>{item.source}</td>
                        <td style={tdStyle}>
                          <button style={btnStyle('secondary', { fontSize: '10px', padding: '2px 6px' })}>상세</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h4 style={subSectionTitleStyle}>검수 체크리스트 및 의견</h4>
                <div style={checklistReviewBoxStyle}>
                    <div style={checklistTitleStyle}>🟡 주요 검토 사항</div>
                    <div style={checklistContentStyle}>
                        • GHS 정보 업데이트: 수생 환경 유해성 (만성) Category 2 (H411) 및 GHS09 그림문자 추가 필요. (ECHA 데이터베이스 2024-11 기준)<br />
                        • 흡입 독성 LC50 값 (1시간 노출) 3.9 mg/L 확인. 일부 자료에서 4시간 노출 값과 혼용되어 있어 명확한 기준 시간 명시 필요.
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="reviewer_comment" style={infoLabelStyle}>검수자 의견:</label>
                        <textarea
                            id="reviewer_comment"
                            style={textAreaStyle}
                            placeholder="추가 의견을 입력하세요..."
                            value={reviewerComment}
                            onChange={(e) => setReviewerComment(e.target.value)}
                        />
                    </div>
                    <div style={buttonGroupStyle}>
                        <button style={btnStyle('success', { fontSize: '12px', padding: '6px 10px' })}>✅ 승인</button>
                        <button style={btnStyle('danger', { fontSize: '12px', padding: '6px 10px' })}>❌ 재작업 요청</button>
                        <button style={btnStyle('warning', { fontSize: '12px', padding: '6px 10px' })}>📋 수정 후 승인</button>
                        <button style={btnStyle('secondary', { fontSize: '12px', padding: '6px 10px' })}>ℹ️ 피드백 가이드라인</button>
                    </div>
                </div>
            </div>

            <div>
                <h4 style={subSectionTitleStyle}>검수 이력</h4>
                <div style={historyTimelineStyle}>
                    {historyItems.map((item, index) => (
                        <HistoryItemDisplay key={index} {...item} />
                    ))}
                </div>
            </div>
          </div>
        </div>

        <div style={tabContentStyle(activeTab === 'completed-review')}>
          <p style={{padding: '20px', background: 'white', borderRadius: '8px'}}>검수 완료된 데이터 목록이 여기에 표시됩니다.</p>
        </div>

        <div style={tabContentStyle(activeTab === 'rework-list')}>
          <p style={{padding: '20px', background: 'white', borderRadius: '8px'}}>재작업 요청된 데이터 목록이 여기에 표시됩니다.</p>
        </div>

        <div style={tabContentStyle(activeTab === 'auto-approved')}>
          <p style={{padding: '20px', background: 'white', borderRadius: '8px'}}>자동 승인된 데이터 목록이 여기에 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default QaValidationPage;