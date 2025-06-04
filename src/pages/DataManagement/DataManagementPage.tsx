import React, { useState } from 'react';

const DataManagementPage = () => {
  const [activeTab, setActiveTab] = useState('all-data');

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div id="data-management" className="content-section" style={{ padding: '20px' }}>
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          marginBottom: '20px',
        }}
      >
        <div style={{ borderBottom: 'none', padding: '20px 20px 0 20px' }}>
          {[
            ['all-data', '전체 데이터 (287)'],
            ['completed', '대기중 (54)'],
            ['pending', '진행중 (92)'],
            ['errors', '완료 (141)'],
            ['draft', '정보 부족 (12)'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleTabClick(key)}
              style={{
                padding: '10px 20px',
                marginRight: '8px',
                border: 'none',
                borderBottom: activeTab === key ? '3px solid #4f46e5' : '3px solid transparent',
                background: 'none',
                fontWeight: activeTab === key ? 'bold' : 'normal',
                color: activeTab === key ? '#4f46e5' : '#6b7280',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="제품명 또는 CAS 번호로 검색"
              style={{
                flex: 1,
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            {['모든 카테고리', '모든 단계', '담당자 전체'].map((groupLabel) => (
              <select
                key={groupLabel}
                style={{
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              >
                <option>{groupLabel}</option>
              </select>
            ))}
            <button
              style={{
                backgroundColor: '#6b7280',
                color: '#fff',
                fontSize: '14px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              🔍 고급 필터
            </button>
          </div>
        </div>
        </div>
      {activeTab === 'all-data' && (
        <>
          <div style={{ overflowX: 'auto', marginTop: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}><input type="checkbox" /></th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>제품명</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>카테고리</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>주성분</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>CAS 번호</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>진행 단계</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>담당자</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>마지막 수정일</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>액션</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px' }}><input type="checkbox" /></td>
                  <td style={{ padding: '12px' }}>바이오롤젯 순수세정</td>
                  <td style={{ padding: '12px' }}>소독제</td>
                  <td style={{ padding: '12px' }}>에탄올</td>
                  <td style={{ padding: '12px' }}>64-17-5</td>
                  <td style={{ padding: '12px', color: '#059669' }}><strong>가공 완료</strong></td>
                  <td style={{ padding: '12px' }}>김○○</td>
                  <td style={{ padding: '12px' }}>2025-04-28</td>
            <td style={{ padding: '12px' }}>
              <button
                style={{
                  backgroundColor: '#ffff',
                  color: '#fff',
                  fontSize: '14px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}
              >🔍</button>
              <button
                style={{
                  backgroundColor: '#ffff',
                  color: '#fff',
                  fontSize: '14px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}
              >✏️</button>
              <button
                style={{
                  backgroundColor: '#ffff',
                  color: '#fff',
                  fontSize: '14px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >🗑️</button>
            </td>
                </tr>
              </tbody>
            </table>
            {/* Re-added selection summary, batch actions, pagination, and item count */}
            <div style={{
              background: "white",
              padding: "18px 24px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "24px",
              borderRadius: "0 0 12px 12px"
            }}>
              <div style={{ color: "#6b7280", fontSize: "16px" }}>
                3개 항목 선택됨 <a href="#" style={{ color: "#4f46e5" }}>선택 해제</a>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  style={{
                    backgroundColor: '#6b7280',
                    color: '#fff',
                    fontSize: '14px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >🔍 검수 요청</button>
                <button
                  style={{
                    backgroundColor: '#6b7280',
                    color: '#fff',
                    fontSize: '14px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >📊 일괄 편집</button>
                <button
                  style={{
                    backgroundColor: '#6b7280',
                    color: '#fff',
                    fontSize: '14px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >🔄 내보내기</button>
                <button
                  style={{
                    backgroundColor: '#6b7280',
                    color: '#fff',
                    fontSize: '14px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >🗑️ 삭제</button>
              </div>
            </div>
            <div
              className="pagination"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '30px'
              }}
            >
              <button
                style={{
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  margin: '0 4px',
                  cursor: 'pointer'
                }}
              >◀</button>
              <button
                className="active"
                style={{
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  margin: '0 4px',
                  cursor: 'pointer'
                }}
              >1</button>
              <button
                style={{
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  margin: '0 4px',
                  cursor: 'pointer'
                }}
              >2</button>
              <button
                style={{
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  margin: '0 4px',
                  cursor: 'pointer'
                }}
              >3</button>
              <button
                style={{
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  margin: '0 4px',
                  cursor: 'pointer'
                }}
              >4</button>
              <button
                style={{
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  margin: '0 4px',
                  cursor: 'pointer'
                }}
              >5</button>
              <button
                style={{
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  margin: '0 4px',
                  cursor: 'pointer'
                }}
              >▶</button>
            </div>
            <div style={{
              textAlign: "center",
              color: "#6b7280",
              fontSize: "16px",
              marginTop: "10px"
            }}>
              총 287개 항목 중 1-20 표시
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DataManagementPage;