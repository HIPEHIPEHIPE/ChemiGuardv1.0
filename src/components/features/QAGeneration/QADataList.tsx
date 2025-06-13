// src/components/QAGeneration/QADataList.tsx
import React, { CSSProperties } from 'react';
import { ChemicalData } from '../../../types/qaGeneration';

// --- 스타일 정의 ---
const tableContainerStyle: CSSProperties = {
  background: 'white',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  overflow: 'hidden',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const tableHeaderStyle: CSSProperties = {
  backgroundColor: '#f8fafc',
  fontWeight: 600,
  fontSize: '14px',
  color: '#374151',
  padding: '16px',
  textAlign: 'left',
  borderBottom: '1px solid #e5e7eb',
};

const tableCellStyle: CSSProperties = {
  padding: '16px',
  fontSize: '14px',
  borderBottom: '1px solid #f1f3f4',
  verticalAlign: 'top',
};

const statusBadgeStyle = (status: string): CSSProperties => {
  const baseStyle: CSSProperties = {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    textAlign: 'center',
  };

  switch (status) {
    case 'pending':
      return { ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e' };
    case 'processing':
      return { ...baseStyle, backgroundColor: '#dbeafe', color: '#1d4ed8' };
    case 'completed':
      return { ...baseStyle, backgroundColor: '#dcfce7', color: '#166534' };
    default:
      return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#6b7280' };
  }
};

const ghsCodeStyle: CSSProperties = {
  backgroundColor: '#e0e7ff',
  color: '#3730a3',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 500,
  marginRight: '4px',
  display: 'inline-block',
};

const btnStyle = (variant: 'primary' | 'secondary' | 'success'): CSSProperties => {
  const baseStyle: CSSProperties = {
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 500,
    marginRight: '5px',
  };

  switch (variant) {
    case 'primary':
      return { ...baseStyle, backgroundColor: '#3b82f6', color: 'white' };
    case 'secondary':
      return { ...baseStyle, backgroundColor: '#6b7280', color: 'white' };
    case 'success':
      return { ...baseStyle, backgroundColor: '#10b981', color: 'white' };
    default:
      return baseStyle;
  }
};

const paginationStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px',
  marginTop: '20px',
  padding: '16px',
};

const paginationButtonStyle: CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  backgroundColor: 'white',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
};

const paginationActiveStyle: CSSProperties = {
  ...paginationButtonStyle,
  backgroundColor: '#3b82f6',
  color: 'white',
  borderColor: '#3b82f6',
};

// --- 컴포넌트 정의 ---
interface QADataListProps {
  data: ChemicalData[];
  selectedChemical: ChemicalData | null;
  onSelectChemical: (chemical: ChemicalData) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filterStatus: string;
  onFilterChange: (status: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const QADataList: React.FC<QADataListProps> = ({
  data,
  selectedChemical,
  onSelectChemical,
  currentPage,
  totalPages,
  onPageChange,
  filterStatus,
  onFilterChange,
  searchTerm,
  onSearchChange,
}) => {
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'QA 생성 대기';
      case 'processing': return 'QA 생성 중';
      case 'completed': return 'QA 생성 완료';
      default: return status;
    }
  };

  const getQAStatusCount = (qaStatus: any) => {
    const total = Object.keys(qaStatus).length;
    const completed = Object.values(qaStatus).filter(Boolean).length;
    return `${completed}/${total}`;
  };

  return (
    <div>
      {/* 필터 및 검색 영역 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>상태:</label>
          <select 
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <option value="all">전체</option>
            <option value="pending">QA 생성 대기</option>
            <option value="processing">QA 생성 중</option>
            <option value="completed">QA 생성 완료</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="화학물질명 또는 CAS 번호 검색..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              width: '250px',
            }}
          />
          <button style={btnStyle('primary')}>🔍 검색</button>
        </div>
      </div>

      {/* 테이블 */}
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>선택</th>
              <th style={tableHeaderStyle}>화학물질명</th>
              <th style={tableHeaderStyle}>CAS 번호</th>
              <th style={tableHeaderStyle}>함량</th>
              <th style={tableHeaderStyle}>GHS 코드</th>
              <th style={tableHeaderStyle}>QA 생성 현황</th>
              <th style={tableHeaderStyle}>상태</th>
              <th style={tableHeaderStyle}>작업</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr 
                key={item.id}
                style={{
                  backgroundColor: selectedChemical?.id === item.id ? '#f0f9ff' : 'white',
                  cursor: 'pointer',
                }}
                onClick={() => onSelectChemical(item)}
              >
                <td style={tableCellStyle}>
                  <input
                    type="radio"
                    checked={selectedChemical?.id === item.id}
                    onChange={() => onSelectChemical(item)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={tableCellStyle}>
                  <div style={{ fontWeight: 500 }}>{item.name}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>{item.usage}</div>
                </td>
                <td style={tableCellStyle}>{item.casNumber}</td>
                <td style={tableCellStyle}>{item.content_percentage}</td>
                <td style={tableCellStyle}>
                  <div>
                    {item.ghs_codes.slice(0, 3).map((code, index) => (
                      <span key={index} style={ghsCodeStyle}>{code}</span>
                    ))}
                    {item.ghs_codes.length > 3 && (
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        +{item.ghs_codes.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td style={tableCellStyle}>
                  <div style={{ fontSize: '12px' }}>
                    <div>완료: {getQAStatusCount(item.qa_status)}</div>
                    <div style={{ color: '#6b7280' }}>
                      최종 수정: {item.updated_at}
                    </div>
                  </div>
                </td>
                <td style={tableCellStyle}>
                  <span style={statusBadgeStyle(item.status)}>
                    {getStatusText(item.status)}
                  </span>
                </td>
                <td style={tableCellStyle}>
                  <button style={btnStyle('primary')}>QA 생성</button>
                  <button style={btnStyle('secondary')}>상세보기</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div style={paginationStyle}>
        <button
          style={paginationButtonStyle}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          이전
        </button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            style={currentPage === page ? paginationActiveStyle : paginationButtonStyle}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        
        <button
          style={paginationButtonStyle}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default QADataList;
