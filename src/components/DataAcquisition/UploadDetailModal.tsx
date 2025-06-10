import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { UploadHistory } from './UploadHistoryTable';

interface UploadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadHistory: UploadHistory | null;
}

interface PreviewData {
  [key: string]: any;
}

const UploadDetailModal: React.FC<UploadDetailModalProps> = ({ isOpen, onClose, uploadHistory }) => {
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [totalCount, setTotalCount] = useState(0);

  // 데이터 미리보기 가져오기
  const fetchPreviewData = useCallback(async () => {
    if (!uploadHistory) return;
    
    setLoading(true);
    try {
      const tableName = uploadHistory.data_type === 'products' ? 'product_ingredients' : 'chemicals';
      
      // 총 개수 조회
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      setTotalCount(count || 0);
      
      // 미리보기 데이터 조회 (최근 20개)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      setPreviewData(data || []);
    } catch (error) {
      console.error('미리보기 데이터 로딩 에러:', error);
      setPreviewData([]);
    } finally {
      setLoading(false);
    }
  }, [uploadHistory]);

  useEffect(() => {
    if (isOpen && uploadHistory) {
      fetchPreviewData();
    }
  }, [isOpen, uploadHistory, fetchPreviewData]);

  if (!isOpen || !uploadHistory) return null;

  const renderOverviewTab = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937' }}>파일 정보</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>기본 정보</h4>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div><strong>파일명:</strong> {uploadHistory.filename}</div>
            <div><strong>파일 크기:</strong> {uploadHistory.file_size}</div>
            <div><strong>업로드 일시:</strong> {uploadHistory.upload_date}</div>
            <div><strong>파일 타입:</strong> {uploadHistory.file_type}</div>
          </div>
        </div>
        
        <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>데이터 정보</h4>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div><strong>데이터 타입:</strong> {uploadHistory.data_type === 'products' ? '제품 데이터' : '화학물질 데이터'}</div>
            <div><strong>처리된 레코드:</strong> {uploadHistory.records_count}건</div>
            <div><strong>상태:</strong> 
              <span style={{ 
                color: uploadHistory.status === '업로드 완료' ? '#10b981' : '#f59e0b',
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>
                {uploadHistory.status}
              </span>
            </div>
            <div><strong>DB 테이블:</strong> {uploadHistory.data_type === 'products' ? 'product_ingredients' : 'chemicals'}</div>
          </div>
        </div>
      </div>
      
      {uploadHistory.error_message && (
        <div style={{ 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          padding: '16px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>⚠️ 오류 정보</h4>
          <div style={{ fontSize: '14px', color: '#7f1d1d' }}>
            {uploadHistory.error_message}
          </div>
        </div>
      )}
    </div>
  );

  const renderPreviewTab = () => {
    if (loading) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          데이터를 불러오는 중...
        </div>
      );
    }

    if (previewData.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          미리보기할 데이터가 없습니다.
        </div>
      );
    }

    // 테이블 컬럼 정의
    const getColumns = () => {
      if (uploadHistory.data_type === 'products') {
        return [
          { key: 'product_name_alias', label: '제품명' },
          { key: 'chemical_name_ko', label: '화학물질명(한글)' },
          { key: 'chemical_name_en', label: '화학물질명(영문)' },
          { key: 'cas_no', label: 'CAS 번호' },
          { key: 'content_percentage', label: '함량(%)' },
          { key: 'ghs_code', label: 'GHS 코드' }
        ];
      } else {
        return [
          { key: 'chemical_name_ko', label: '화학물질명(한글)' },
          { key: 'chemical_name_en', label: '화학물질명(영문)' },
          { key: 'cas_no', label: 'CAS 번호' },
          { key: 'molecular_formula', label: '분자식' },
          { key: 'ghs_code', label: 'GHS 코드' },
          { key: 'toxicity_info', label: '독성정보' }
        ];
      }
    };

    const columns = getColumns();

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>데이터 미리보기</h3>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            총 {totalCount}건 중 최근 {Math.min(20, previewData.length)}건 표시
          </div>
        </div>
        
        <div style={{ 
          overflowX: 'auto', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc' }}>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={{ 
                    padding: '12px 8px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #e5e7eb',
                    fontWeight: 'bold',
                    minWidth: '120px'
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, index) => (
                <tr key={index} style={{ 
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' 
                }}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ 
                      padding: '10px 8px', 
                      borderBottom: '1px solid #e5e7eb',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {row[col.key] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '80%',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
      }}>
        {/* 헤더 */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            업로드 상세 정보
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'overview' ? 'white' : 'transparent',
              borderBottom: activeTab === 'overview' ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'overview' ? 'bold' : 'normal',
              color: activeTab === 'overview' ? '#3b82f6' : '#6b7280'
            }}
          >
            개요
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'preview' ? 'white' : 'transparent',
              borderBottom: activeTab === 'preview' ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'preview' ? 'bold' : 'normal',
              color: activeTab === 'preview' ? '#3b82f6' : '#6b7280'
            }}
          >
            데이터 미리보기
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div style={{ 
          maxHeight: 'calc(80vh - 140px)', 
          overflowY: 'auto' 
        }}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'preview' && renderPreviewTab()}
        </div>
      </div>
    </div>
  );
};

export default UploadDetailModal;
