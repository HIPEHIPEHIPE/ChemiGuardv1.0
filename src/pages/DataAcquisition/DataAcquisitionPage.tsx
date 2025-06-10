import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

// 컴포넌트 imports
import StyledButton from '../../components/DataAcquisition/StyledButton';
import ExternalSearch from '../../components/DataAcquisition/ExternalSearch';
import FileUpload from '../../components/DataAcquisition/FileUpload';
import UploadHistoryTable, { UploadHistory } from '../../components/DataAcquisition/UploadHistoryTable';
import ManualInputModal from '../../components/DataAcquisition/ManualInputModal';
import { SearchResult } from '../../components/DataAcquisition/SearchResults';

const DataAcquisitionPage: React.FC = () => {
  // 상태 관리
  const [recentUploads, setRecentUploads] = useState<UploadHistory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();

      const sunday = new Date();
      sunday.setDate(sunday.getDate() - sunday.getDay());
      const weekStart = new Date(sunday.setHours(0, 0, 0, 0)).toISOString();

      const { count: todayWork } = await supabase
        .from('work_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

      const { count: weekWork } = await supabase
        .from('work_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart);

      const { count: pending } = await supabase
        .from('msds_documents')
        .select('*', { count: 'exact', head: true })
        .eq('extraction_status', 'pending');

      const { count: failed } = await supabase
        .from('msds_documents')
        .select('*', { count: 'exact', head: true })
        .eq('extraction_status', 'failed');

      setTodayCount(todayWork ?? 0);
      setWeekCount(weekWork ?? 0);
      setPendingCount(pending ?? 0);
      setErrorCount(failed ?? 0);
    };

    fetchStats();
  }, []);

  // 업로드 이력 데이터 가져오기 (새로운 스키마에 맞춤)
  const fetchUploadHistory = async () => {
    try {
      // MSDS 문서 업로드 이력 조회
      const { data: msdsData, error: msdsError } = await supabase
        .from('msds_documents')
        .select(`
          id,
          file_name,
          file_size,
          extraction_status,
          created_at,
          product_id,
          products(product_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (msdsError) {
        console.error('MSDS 문서 이력 에러:', msdsError);
      }

      // 기존 upload_history 테이블도 확인 (있는 경우)
      const { data: uploadData, error: uploadError } = await supabase
        .from('upload_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      // 두 데이터를 합쳐서 포맷팅
      const formattedHistory: UploadHistory[] = [];

      // MSDS 문서 데이터 포맷팅
      if (msdsData) {
        msdsData.forEach((item: any) => {
          formattedHistory.push({
            id: item.id,
            filename: item.file_name,
            file_size: item.file_size,
            upload_date: new Date(item.created_at).toLocaleString('ko-KR'),
            status: item.extraction_status || 'processing',
            records_count: 1, // MSDS는 보통 1개 제품
            file_type: 'PDF',
            data_type: 'msds',
            table_name: 'msds_documents',
            error_message: undefined
          });
        });
      }

      // 기존 업로드 데이터 포맷팅 (있는 경우)
      if (uploadData && !uploadError) {
        uploadData.forEach((item: any) => {
          formattedHistory.push({
            id: item.id,
            filename: item.filename,
            file_size: item.file_size,
            upload_date: new Date(item.created_at).toLocaleString('ko-KR'),
            status: item.status,
            records_count: item.records_count,
            file_type: item.file_type,
            data_type: item.data_type || 'chemicals',
            table_name: item.table_name,
            error_message: item.error_message
          });
        });
      }

      // 날짜순 정렬
      formattedHistory.sort((a, b) => 
        new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
      );

      setRecentUploads(formattedHistory.slice(0, 10));
      
    } catch (error) {
      console.error('업로드 이력 로딩 에러:', error);
      setRecentUploads([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUploadHistory();
  }, []);

  // 검색 결과를 DB에 추가하는 핸들러 (새로운 스키마에 맞춤)
  const handleAddToDb = async (item: SearchResult) => {
    try {
      // 1. 먼저 제품 정보 확인/생성
      const productId = `PROD-${Date.now()}`;
      
      const { data: existingProduct } = await supabase
        .from('products')
        .select('product_id')
        .eq('product_name', item.chemical_name_ko)
        .single();

      let finalProductId = productId;

      if (!existingProduct) {
        // 새로운 제품 생성
        const { error: productError } = await supabase
          .from('products')
          .insert({
            product_id: productId,
            product_name: item.chemical_name_ko,
            product_category: '기타',
            collected_source: item.source_api,
            collected_method: 'external_search',
            status: 'collected'
          });

        if (productError) throw productError;
      } else {
        finalProductId = existingProduct.product_id;
      }

      // 2. 제품 성분 정보 확인
      const { data: existing } = await supabase
        .from('product_ingredients')
        .select('id')
        .eq('cas_number', item.cas_no)
        .eq('product_id', finalProductId);

      if (existing && existing.length > 0) {
        alert(`${item.chemical_name_ko} (CAS: ${item.cas_no})는 이미 DB에 존재합니다.`);
        return;
      }

      // 3. 제품 성분 정보 추가
      const ingredientId = `ING-${Date.now()}`;
      
      const { error: ingredientError } = await supabase
        .from('product_ingredients')
        .insert({
          product_id: finalProductId,
          ingredient_id: ingredientId,
          main_ingredient: item.chemical_name_ko,
          cas_number: item.cas_no,
          status: 'collected'
        });

      if (ingredientError) throw ingredientError;

      alert(`${item.chemical_name_ko}이(가) DB에 성공적으로 추가되었습니다.`);
      
      // 업로드 이력 새로고침
      fetchUploadHistory();
      
    } catch (error) {
      alert('DB에 추가하는 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  return (
    <>
      <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>데이터 수집</h2>
            <p style={{ color: '#6b7280', fontSize: '16px', marginTop: '4px' }}>
              제품 정보, 성분 데이터, MSDS 문서를 수집하고 관리합니다
            </p>
          </div>
          <StyledButton bgColor="#1d4ed8" onClick={() => setIsModalOpen(true)}>
            + 수동 입력
          </StyledButton>
        </div>

        {/* 통계 카드 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          <StatCard 
            title="오늘 수집" 
            value={`${todayCount}건`} 
            color="#3b82f6" 
            icon="📊"
          />
          <StatCard 
            title="이번 주 수집" 
            value={`${weekCount}건`} 
            color="#10b981" 
            icon="📈"
          />
          <StatCard 
            title="대기 중인 파일" 
            value={`${pendingCount}건`} 
            color="#f59e0b" 
            icon="⏳"
          />
          <StatCard 
            title="처리 오류" 
            value={`${errorCount}건`} 
            color="#ef4444" 
            icon="⚠️"
          />
        </div>

        {/* 메인 그리드 - 외부 검색 & 파일 업로드 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '30px' }}>
          <ExternalSearch onAddToDb={handleAddToDb} />
          <FileUpload onUploadComplete={fetchUploadHistory} />
        </div>
        
        {/* 업로드 이력 테이블 */}
        <UploadHistoryTable 
          uploads={recentUploads}
          loading={loading}
          onRefresh={fetchUploadHistory}
        />
      </div>
      
      {/* 수동 입력 모달 */}
      <ManualInputModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

// 통계 카드 컴포넌트
const StatCard = ({ 
  title, 
  value, 
  color, 
  icon 
}: { 
  title: string; 
  value: string; 
  color: string; 
  icon: string; 
}) => (
  <div style={{ 
    background: 'white', 
    padding: '20px', 
    borderRadius: '12px', 
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    border: `2px solid ${color}20`,
    transition: 'transform 0.2s ease'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ 
        fontSize: '24px', 
        backgroundColor: `${color}15`, 
        padding: '8px', 
        borderRadius: '8px' 
      }}>
        {icon}
      </div>
      <div>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: color 
        }}>
          {value}
        </div>
        <div style={{ 
          fontSize: '14px', 
          color: '#6b7280', 
          marginTop: '2px' 
        }}>
          {title}
        </div>
      </div>
    </div>
  </div>
);

export default DataAcquisitionPage;