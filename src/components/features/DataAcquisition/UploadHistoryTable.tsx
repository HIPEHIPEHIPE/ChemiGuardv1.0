import React, { useState } from 'react';
import StyledButton from './StyledButton';
import UploadDetailModal from './UploadDetailModal';

// 업로드 이력 타입 정의
export interface UploadHistory {
  id: string | number;  // string 또는 number 허용
  filename: string;
  file_size: string;
  upload_date: string;
  status: string;
  records_count?: number;
  file_type: string;
  data_type?: string;
  table_name?: string;
  error_message?: string;
}

interface UploadHistoryTableProps {
  uploads: UploadHistory[];
  loading: boolean;
  onRefresh: () => void;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

const UploadHistoryTable: React.FC<UploadHistoryTableProps> = ({ 
  uploads, 
  loading, 
  onRefresh, 
  totalCount = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange 
}) => {
  const [selectedUpload, setSelectedUpload] = useState<UploadHistory | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 페이지네이션 계산
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  const getDataTypeDisplay = (dataType: string | undefined) => {
    switch(dataType) {
      case 'products':
      case '제품': 
        return { text: '제품', color: '#10b981' };
      case 'chemicals':
      case '화학물질': 
        return { text: '화학물질', color: '#3b82f6' };
      case 'msds':
        return { text: 'MSDS', color: '#8b5cf6' };
      default: 
        return { text: dataType || '미지정', color: '#6b7280' };
    }
  };

  const handleDetailClick = (upload: UploadHistory) => {
    setSelectedUpload(upload);
    setIsDetailModalOpen(true);
  };

  const handleModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedUpload(null);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    if (onPageChange && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (size: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(size);
    }
  };

  // 페이지 번호 배열 생성 (현재 페이지 주변 5개 페이지)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <>
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '4px' }}>업로드 이력</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              총 {totalCount}건 • {startIndex}-{endIndex}번째 항목
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select 
              value={pageSize} 
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value={10}>10개씩</option>
              <option value={20}>20개씩</option>
              <option value={50}>50개씩</option>
              <option value={100}>100개씩</option>
            </select>
            <StyledButton bgColor="#6b7280" onClick={onRefresh}>🔄 새로고침</StyledButton>
          </div>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            데이터를 불러오는 중...
          </div>
        ) : uploads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            아직 업로드 이력이 없습니다.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>파일명</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>데이터 타입</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>데이터 건수</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>업로드일</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>상태</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((file) => {
                const dataTypeDisplay = getDataTypeDisplay(file.data_type);
                
                return (
                  <tr key={file.id}>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: 'bold' }}>{file.filename}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{file.file_size}</div>
                      {file.error_message && (
                        <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px' }}>
                          ⚠️ {file.error_message}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{ 
                        color: dataTypeDisplay.color,
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: `${dataTypeDisplay.color}15`,
                        fontSize: '12px'
                      }}>
                        {dataTypeDisplay.text}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                      {file.records_count ? `${file.records_count}건` : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>{file.upload_date}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{ 
                        color: file.status === '업로드 완료' ? '#10b981' : '#f59e0b',
                        fontWeight: 'bold'
                      }}>
                        {file.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                      <StyledButton 
                        bgColor="#4b5563" 
                        onClick={() => handleDetailClick(file)}
                      >
                        상세보기
                      </StyledButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        
        {/* 페이지네이션 */}
        {!loading && uploads.length > 0 && totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center', 
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              페이지 {currentPage} / {totalPages}
            </div>
            
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {/* 처음 페이지 */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                  color: currentPage === 1 ? '#9ca3af' : '#374151',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                처음
              </button>
              
              {/* 이전 페이지 */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                  color: currentPage === 1 ? '#9ca3af' : '#374151',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                이전
              </button>
              
              {/* 페이지 번호들 */}
              {getPageNumbers().map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: pageNum === currentPage ? '#3b82f6' : 'white',
                    color: pageNum === currentPage ? 'white' : '#374151',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: pageNum === currentPage ? 'bold' : 'normal'
                  }}
                >
                  {pageNum}
                </button>
              ))}
              
              {/* 다음 페이지 */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
                  color: currentPage === totalPages ? '#9ca3af' : '#374151',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                다음
              </button>
              
              {/* 마지막 페이지 */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
                  color: currentPage === totalPages ? '#9ca3af' : '#374151',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                마지막
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      <UploadDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleModalClose}
        uploadHistory={selectedUpload}
      />
    </>
  );
};

export default UploadHistoryTable;
