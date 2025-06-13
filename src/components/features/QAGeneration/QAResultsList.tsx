// src/components/QAGeneration/QAResultsList.tsx
import React, { useState, CSSProperties } from 'react';
import { GeneratedQA } from '../../../types/qaGeneration';

// --- 스타일 정의 ---
const resultsContainerStyle: CSSProperties = {
  background: 'white',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  padding: '20px',
  marginTop: '20px',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  paddingBottom: '15px',
  borderBottom: '1px solid #e5e7eb',
};

const titleStyle: CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#1f2937',
  margin: 0,
};

const controlsStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
};

const selectStyle: CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  backgroundColor: 'white',
};

const btnStyle = (variant: 'primary' | 'secondary' | 'danger' | 'success', customStyle?: CSSProperties): CSSProperties => {
  const baseStyle: CSSProperties = {
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 500,
  };

  let colorStyle: CSSProperties = {};
  switch (variant) {
    case 'primary': colorStyle = { backgroundColor: '#3b82f6', color: 'white' }; break;
    case 'secondary': colorStyle = { backgroundColor: '#6b7280', color: 'white' }; break;
    case 'danger': colorStyle = { backgroundColor: '#ef4444', color: 'white' }; break;
    case 'success': colorStyle = { backgroundColor: '#10b981', color: 'white' }; break;
  }

  return { ...baseStyle, ...colorStyle, ...customStyle };
};

const qaItemStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '15px',
  backgroundColor: '#fafbfc',
};

const qaTagStyle = (type: 'safety' | 'usage' | 'component' | 'regulation'): CSSProperties => {
  const baseStyle: CSSProperties = {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    marginBottom: '10px',
  };

  switch (type) {
    case 'safety':
      return { ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e' };
    case 'usage':
      return { ...baseStyle, backgroundColor: '#e0e7ff', color: '#3730a3' };
    case 'component':
      return { ...baseStyle, backgroundColor: '#dcfce7', color: '#166534' };
    case 'regulation':
      return { ...baseStyle, backgroundColor: '#fce7f3', color: '#be185d' };
    default:
      return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#6b7280' };
  }
};

const questionStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: '16px',
  color: '#1f2937',
  marginBottom: '12px',
  lineHeight: 1.5,
};

const answerStyle: CSSProperties = {
  fontSize: '14px',
  color: '#374151',
  lineHeight: 1.6,
  marginBottom: '15px',
  whiteSpace: 'pre-line',
};

const metaInfoStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '12px',
  color: '#6b7280',
  marginBottom: '10px',
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
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
interface QAResultsListProps {
  qaList: GeneratedQA[];
  onEdit: (qa: GeneratedQA) => void;
  onDelete: (id: string) => void;
  onBulkAction: (action: string, ids: string[]) => void;
}

const QAResultsList: React.FC<QAResultsListProps> = ({
  qaList,
  onEdit,
  onDelete,
  onBulkAction,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const getTypeText = (type: string) => {
    switch (type) {
      case 'safety': return '안전성 문의';
      case 'usage': return '사용법 문의';
      case 'component': return '성분 정보';
      case 'regulation': return '규제 정보';
      default: return type;
    }
  };

  const getDifficultyText = (level: string) => {
    switch (level) {
      case 'general': return '일반인';
      case 'professional': return '전문가';
      case 'expert': return '연구자';
      default: return level;
    }
  };

  // 필터링된 데이터
  const filteredQAs = qaList.filter(qa => 
    filterType === 'all' || qa.type === filterType
  );

  // 페이지네이션
  const totalPages = Math.ceil(filteredQAs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQAs = filteredQAs.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedQAs.map(qa => qa.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter(item => item !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length > 0) {
      onBulkAction('delete', selectedItems);
      setSelectedItems([]);
    }
  };

  return (
    <div style={resultsContainerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>생성된 Q&A 목록 ({filteredQAs.length}건)</h3>
        <div style={controlsStyle}>
          <select 
            style={selectStyle}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">전체 유형</option>
            <option value="safety">안전성 문의</option>
            <option value="usage">사용법 문의</option>
            <option value="component">성분 정보</option>
            <option value="regulation">규제 정보</option>
          </select>
          
          <button 
            style={btnStyle('danger')}
            onClick={handleBulkDelete}
            disabled={selectedItems.length === 0}
          >
            선택 삭제 ({selectedItems.length})
          </button>
          
          <button style={btnStyle('secondary')}>
            일괄 편집
          </button>
          
          <button style={btnStyle('primary')}>
            엑셀 내보내기
          </button>
        </div>
      </div>

      {/* 전체 선택 체크박스 */}
      {paginatedQAs.length > 0 && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedItems.length === paginatedQAs.length && paginatedQAs.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              전체 선택 ({paginatedQAs.length}개 항목)
            </span>
          </label>
        </div>
      )}

      {/* Q&A 아이템 목록 */}
      {paginatedQAs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <h4>생성된 Q&A가 없습니다</h4>
          <p>화학물질을 선택하고 Q&A를 생성해보세요.</p>
        </div>
      ) : (
        paginatedQAs.map((qa) => (
          <div key={qa.id} style={qaItemStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={selectedItems.includes(qa.id)}
                onChange={(e) => handleSelectItem(qa.id, e.target.checked)}
                style={{ marginRight: '10px', marginTop: '2px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={qaTagStyle(qa.type as any)}>{getTypeText(qa.type)}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {getDifficultyText(qa.difficulty)} 수준
                  </span>
                </div>
                
                <div style={metaInfoStyle}>
                  <span>화학물질: {qa.chemicalName} ({qa.casNumber})</span>
                  <span>생성일: {qa.createdAt}</span>
                </div>
                
                <div style={questionStyle}>Q. {qa.question}</div>
                <div style={answerStyle}>A. {qa.answer}</div>
                
                <div style={actionsStyle}>
                  <button 
                    style={btnStyle('primary')}
                    onClick={() => onEdit(qa)}
                  >
                    ✏️ 수정
                  </button>
                  <button 
                    style={btnStyle('danger')}
                    onClick={() => onDelete(qa.id)}
                  >
                    🗑️ 삭제
                  </button>
                  <button style={btnStyle('secondary')}>
                    📋 복사
                  </button>
                  <button style={btnStyle('secondary')}>
                    📤 내보내기
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={paginationStyle}>
          <button
            style={paginationButtonStyle}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            이전
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              style={currentPage === page ? paginationActiveStyle : paginationButtonStyle}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          
          <button
            style={paginationButtonStyle}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
};

export default QAResultsList;
