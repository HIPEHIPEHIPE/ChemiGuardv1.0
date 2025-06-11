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
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  // 통계 데이터 새로고침 함수
  const fetchStats = async () => {
    try {
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();

      const sunday = new Date();
      sunday.setDate(sunday.getDate() - sunday.getDay());
      const weekStart = new Date(sunday.setHours(0, 0, 0, 0)).toISOString();

      // 1. 오늘 수집된 데이터 (products + chemicals 테이블 기준)
      const { count: todayProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);
        
      const { count: todayChemicals } = await supabase
        .from('chemicals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

      // 2. 이번 주 수집된 데이터
      const { count: weekProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart);
        
      const { count: weekChemicals } = await supabase
        .from('chemicals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart);

      // 3. 대기 중인 파일 (processing 상태)
      const { count: pending } = await supabase
        .from('msds_documents')
        .select('*', { count: 'exact', head: true })
        .eq('extraction_status', 'pending');

      // 4. 처리 오류 (failed 상태)
      const { count: failed } = await supabase
        .from('msds_documents')
        .select('*', { count: 'exact', head: true })
        .eq('extraction_status', 'failed');

      setTodayCount((todayProducts ?? 0) + (todayChemicals ?? 0));
      setWeekCount((weekProducts ?? 0) + (weekChemicals ?? 0));
      setPendingCount(pending ?? 0);
      setErrorCount(failed ?? 0);
      
    } catch (error) {
      console.error('통계 데이터 로딩 에러:', error);
    }
  };

  // 업로드 이력 데이터 가져오기 (페이지네이션 적용)
  const fetchUploadHistory = async (page: number = currentPage, size: number = pageSize) => {
    try {
      setLoading(true);
      
      // 1. 전체 업로드 이력 개수 조회
      const { count: metadataCount } = await supabase
        .from('metadata')
        .select('*', { count: 'exact', head: true })
        .eq('data_type', 'upload_history')
        .in('meta_key', ['file_upload_log', 'chemical_upload_log']);
        
      const { count: msdsCount } = await supabase
        .from('msds_documents')
        .select('*', { count: 'exact', head: true });
        
      const { count: chemicalCount } = await supabase
        .from('chemicals')
        .select('*', { count: 'exact', head: true });
        
      const totalRecords = (metadataCount || 0) + (msdsCount || 0) + (chemicalCount || 0);
      setTotalCount(totalRecords);
      
      // 2. metadata 테이블에서 페이지네이션된 업로드 이력 조회
      const metadataOffset = (page - 1) * Math.ceil(size / 3); // 3개 소스로 나누어 조회
      const { data: metadataData, error: metadataError } = await supabase
        .from('metadata')
        .select('*')
        .eq('data_type', 'upload_history')
        .in('meta_key', ['file_upload_log', 'chemical_upload_log'])
        .order('created_at', { ascending: false })
        .range(metadataOffset, metadataOffset + Math.ceil(size / 3) - 1);

      if (metadataError) {
        console.error('업로드 이력 조회 에러:', metadataError);
      }

      // 3. MSDS 문서 업로드 이력도 페이지네이션 적용
      const msdsOffset = (page - 1) * Math.ceil(size / 3);
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
        .range(msdsOffset, msdsOffset + Math.ceil(size / 3) - 1);

      if (msdsError) {
        console.error('MSDS 문서 이력 에러:', msdsError);
      }

      // 4. 화학물질 데이터 수집 이력 조회 (페이지네이션 적용)
      const chemicalOffset = (page - 1) * Math.ceil(size / 3);
      const { data: chemicalsData, error: chemicalsError } = await supabase
        .from('chemicals')
        .select(`
          chemical_id,
          chemical_name_ko,
          cas_no,
          collected_source,
          collected_method,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .range(chemicalOffset, chemicalOffset + Math.ceil(size / 3) - 1);

      if (chemicalsError) {
        console.error('화학물질 이력 에러:', chemicalsError);
      }

      const formattedHistory: UploadHistory[] = [];

      // 5. metadata에서 가져온 업로드 이력 포맷팅 (화학물질 관련 제외)
      if (metadataData) {
        metadataData.forEach((item: any) => {
          try {
            const uploadInfo = JSON.parse(item.meta_value);
            // 화학물질 관련 데이터는 제외 (이미 chemicals 테이블에서 별도 조회)
            if (uploadInfo.data_type === 'chemical' || uploadInfo.data_type === '화학물질') {
              return;
            }
            formattedHistory.push({
              id: item.id,
              filename: uploadInfo.filename,
              file_size: uploadInfo.file_size,
              upload_date: new Date(uploadInfo.upload_date).toLocaleString('ko-KR'),
              status: uploadInfo.status,
              records_count: uploadInfo.records_count,
              file_type: uploadInfo.file_type,
              data_type: uploadInfo.data_type,
              table_name: uploadInfo.table_name,
              error_message: uploadInfo.error_message
            });
          } catch (parseError) {
            console.error('메타데이터 파싱 에러:', parseError);
          }
        });
      }

      // 6. MSDS 문서 데이터 포맷팅
      if (msdsData) {
        msdsData.forEach((item: any) => {
          formattedHistory.push({
            id: `msds_${item.id}`,
            filename: item.file_name,
            file_size: item.file_size?.toString() || 'Unknown',
            upload_date: new Date(item.created_at).toLocaleString('ko-KR'),
            status: item.extraction_status === 'completed' ? '업로드 완료' : 
                   item.extraction_status === 'failed' ? '업로드 실패' : '처리 중',
            records_count: 1,
            file_type: 'PDF',
            data_type: 'msds',
            table_name: 'msds_documents',
            error_message: undefined
          });
        });
      }

      // 7. 화학물질 데이터 포맷팅
      if (chemicalsData) {
        chemicalsData.forEach((item: any) => {
          formattedHistory.push({
            id: `chem_${item.chemical_id}`,
            filename: `${item.chemical_name_ko} (${item.cas_no})`,
            file_size: 'N/A',
            upload_date: new Date(item.created_at).toLocaleString('ko-KR'),
            status: item.status === 'collected' ? '수집 완료' : item.status,
            records_count: 1,
            file_type: 'CHEMICAL',
            data_type: '화학물질',
            table_name: 'chemicals',
            error_message: undefined
          });
        });
      }

      // 8. 날짜순 정렬 및 페이지 크기만큼 제한
      formattedHistory.sort((a, b) => 
        new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
      );

      setRecentUploads(formattedHistory.slice(0, size));
      
    } catch (error) {
      console.error('업로드 이력 로딩 에러:', error);
      setRecentUploads([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 초기 로딩 및 데이터 새로고침
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchStats(),
        fetchUploadHistory(currentPage, pageSize)
      ]);
    };
    
    initializeData();
  }, [currentPage, pageSize]);
  
  // 업로드 완료 후 콜백 함수 (통계와 이력 모두 새로고침)
  const handleUploadComplete = async () => {
    await Promise.all([
      fetchStats(),
      fetchUploadHistory(currentPage, pageSize)
    ]);
  };
  
  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // 페이지 크기 변경 시 첫 페이지로 이동
  };
  
  // 데이터 새로고침 핸들러
  const handleRefresh = async () => {
    await Promise.all([
      fetchStats(),
      fetchUploadHistory(currentPage, pageSize)
    ]);
  };

  // 검색 결과를 DB에 추가하는 핸들러 (chemicals 테이블에 저장)
  const handleAddToDb = async (item: SearchResult) => {
    try {
      // 1. 기존 화학물질 중복 확인 (CAS 번호 기준)
      const { data: existingChemical } = await supabase
        .from('chemicals')
        .select('chemical_id')
        .eq('cas_no', item.cas_no)
        .single();

      if (existingChemical) {
        alert(`${item.chemical_name_ko} (CAS: ${item.cas_no})는 이미 화학물질 DB에 존재합니다.`);
        return;
      }

      // 2. 새로운 화학물질 ID 생성
      const chemicalId = `CHEM-${Date.now()}`;
      
      // 3. chemicals 테이블에 화학물질 정보 저장
      const { error: chemicalError } = await supabase
        .from('chemicals')
        .insert({
          chemical_id: chemicalId,
          chemical_name_ko: item.chemical_name_ko,
          cas_no: item.cas_no,
          collected_source: item.source_api,
          collected_method: 'external_search',
          collected_date: new Date().toISOString().split('T')[0],
          status: 'collected',
          verification_status: 'pending',
          raw_data: JSON.stringify(item) // 원본 검색 데이터 보존
        });

      if (chemicalError) throw chemicalError;

      // 4. GHS 정보가 있다면 chemical_ghs_info 테이블에도 저장
      if (item.ghs_code) {
        const { error: ghsError } = await supabase
          .from('chemical_ghs_info')
          .insert({
            chemical_id: chemicalId,
            ghs_code: item.ghs_code
          });
        
        if (ghsError) {
          console.warn('GHS 정보 저장 실패:', ghsError);
        }
      }

      alert(`화학물질 "${item.chemical_name_ko}"이(가) 성공적으로 추가되었습니다.`);
      
      // 5. 업로드 이력을 metadata 테이블에 기록
      const uploadLogData = {
        filename: `${item.chemical_name_ko} (${item.cas_no})`,
        file_size: 'N/A',
        upload_date: new Date().toISOString(),
        status: '수집 완료',
        records_count: 1,
        file_type: 'CHEMICAL',
        data_type: '화학물질',
        table_name: 'chemicals',
        source: item.source_api,
        method: 'external_search'
      };

      const { error: metadataError } = await supabase
        .from('metadata')
        .insert({
          data_type: 'upload_history',
          reference_id: chemicalId,
          meta_key: 'chemical_upload_log',
          meta_value: JSON.stringify(uploadLogData)
        });

      if (metadataError) {
        console.warn('업로드 이력 기록 실패:', metadataError);
      }
      
      // 6. 통계 및 업로드 이력 새로고침
      await Promise.all([
        fetchStats(),
        fetchUploadHistory(currentPage, pageSize)
      ]);
      
    } catch (error) {
      console.error('화학물질 DB 추가 오류:', error);
      alert('화학물질을 DB에 추가하는 중 오류가 발생했습니다.');
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
          <FileUpload onUploadComplete={handleUploadComplete} />
        </div>
        
        {/* 업로드 이력 테이블 */}
        <UploadHistoryTable 
          uploads={recentUploads}
          loading={loading}
          onRefresh={handleRefresh}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
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