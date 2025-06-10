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
}

const UploadHistoryTable: React.FC<UploadHistoryTableProps> = ({ uploads, loading, onRefresh }) => {
  const [selectedUpload, setSelectedUpload] = useState<UploadHistory | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  return (
    <>
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ marginTop: 0, marginBottom: 0 }}>최근 업로드 이력</h3>
          <StyledButton bgColor="#6b7280" onClick={onRefresh}>🔄 새로고침</StyledButton>
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
