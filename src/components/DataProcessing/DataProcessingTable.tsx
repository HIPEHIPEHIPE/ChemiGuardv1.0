// src/components/DataProcessing/DataProcessingTable.tsx
import React, { CSSProperties } from 'react';
import { ChemicalData } from '../../types/dataProcessing';

// --- 인터페이스 정의 ---
interface DataProcessingTableProps {
  chemicalDataList: ChemicalData[];
  selectedChemical: ChemicalData | null;
  onSelectChemical: (chemical: ChemicalData) => void;
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

// --- 스타일 객체 정의 ---
const mainCardStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  padding: '20px',
  marginBottom: '20px',
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

const btnStyle = (variant: 'secondary' | 'success' | 'primary' | 'warning', size?: 'sm' | 'md'): CSSProperties => {
  let base: CSSProperties = {
    border: 'none',
    borderRadius: '6px',
    padding: size === 'sm' ? '6px 12px' : '8px 16px',
    fontSize: size === 'sm' ? '12px' : '14px',
    cursor: 'pointer',
    color: 'white',
    fontWeight: 500,
    transition: 'all 0.2s',
  };
  
  switch (variant) {
    case 'secondary': base.background = '#6b7280'; break;
    case 'success': base.background = '#10b981'; break;
    case 'primary': base.background = '#3b82f6'; break;
    case 'warning': base.background = '#f59e0b'; break;
  }
  
  return base;
};

const filterContainerStyle: CSSProperties = {
  display: 'flex',
  gap: '15px',
  alignItems: 'center',
  marginBottom: '20px',
  padding: '15px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
};

const selectStyle: CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  minWidth: '150px',
};

const searchInputStyle: CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  minWidth: '200px',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
};

const thStyle: CSSProperties = {
  backgroundColor: '#f9fafb',
  padding: '12px 8px',
  textAlign: 'left',
  fontWeight: 600,
  borderBottom: '1px solid #e5e7eb',
  color: '#374151',
};

const tdStyle: CSSProperties = {
  padding: '12px 8px',
  borderBottom: '1px solid #f3f4f6',
  verticalAlign: 'middle',
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

const paginationStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px',
  marginTop: '20px',
  padding: '20px',
};

const pageButtonStyle = (isActive: boolean): CSSProperties => ({
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  cursor: 'pointer',
  backgroundColor: isActive ? '#3b82f6' : 'white',
  color: isActive ? 'white' : '#374151',
});

const DataProcessingTable: React.FC<DataProcessingTableProps> = ({
  chemicalDataList,
  selectedChemical,
  onSelectChemical,
  filterStatus,
  onFilterStatusChange,
  searchTerm,
  onSearchTermChange,
  currentPage,
  onPageChange,
  itemsPerPage,
}) => {
  // 필터링된 데이터
  const filteredData = chemicalDataList.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = (item.main_ingredient || item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.cas_no || item.casNumber || '').includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div style={mainCardStyle}>
      <div style={cardHeaderStyle}>
        <h2 style={cardTitleStyle}>데이터 가공 - 설명문 생성</h2>
      </div>

      {/* 필터 및 검색 */}
      <div style={filterContainerStyle}>
        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, marginRight: '8px' }}>상태:</label>
          <select 
            style={selectStyle} 
            value={filterStatus} 
            onChange={(e) => onFilterStatusChange(e.target.value)}
          >
            <option value="all">전체</option>
            <option value="refined">정제완료</option>
            <option value="processing">가공중</option>
            <option value="completed">완료</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, marginRight: '8px' }}>검색:</label>
          <input
            type="text"
            placeholder="성분명, 제품명, CAS 번호..."
            style={searchInputStyle}
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#6b7280' }}>
          총 {filteredData.length}개 항목
        </div>
      </div>

      {/* 데이터 테이블 */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>선택</th>
            <th style={thStyle}>제품명</th>
            <th style={thStyle}>주성분</th>
            <th style={thStyle}>CAS 번호</th>
            <th style={thStyle}>함량</th>
            <th style={thStyle}>GHS 코드</th>
            <th style={thStyle}>설명문 진행도</th>
            <th style={thStyle}>최종 수정일</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item) => (
            <tr 
              key={item.id} 
              style={{ 
                backgroundColor: selectedChemical?.id === item.id ? '#f0f9ff' : 'transparent',
                cursor: 'pointer'
              }}
              onClick={() => onSelectChemical(item)}
            >
              <td style={tdStyle}>
                <input
                  type="radio"
                  name="selectedChemical"
                  checked={selectedChemical?.id === item.id}
                  onChange={() => onSelectChemical(item)}
                />
              </td>
              <td style={tdStyle}>{item.product_name || '정보 없음'}</td>
              <td style={tdStyle}>
                <div style={{ fontWeight: 500 }}>{item.main_ingredient || item.name || '정보 없음'}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.usage_category || item.usage || '정보 없음'}</div>
              </td>
              <td style={tdStyle}>
                <code style={{ fontSize: '12px', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '4px' }}>
                  {item.cas_no || item.casNumber || '정보 없음'}
                </code>
              </td>
              <td style={tdStyle}>{item.content_percentage}</td>
              <td style={tdStyle}>
                {(item.ghs_codes || []).map((code, index) => (
                  <span key={index} style={ghsCodeStyle}>{code}</span>
                ))}
              </td>
              <td style={tdStyle}>
                <div style={{ fontSize: '12px' }}>
                  <div>주성분: {item.caption_status?.main_component ? '✅' : '❌'}</div>
                  <div>독성: {item.caption_status?.toxicity ? '✅' : '❌'}</div>
                  <div>경고: {item.caption_status?.warning ? '✅' : '❌'}</div>
                </div>
              </td>
              <td style={tdStyle}>
                <div style={{ fontSize: '12px' }}>{item.updated_at}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      <div style={paginationStyle}>
        <button 
          style={pageButtonStyle(false)}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          이전
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            style={pageButtonStyle(page === currentPage)}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button 
          style={pageButtonStyle(false)}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default DataProcessingTable;