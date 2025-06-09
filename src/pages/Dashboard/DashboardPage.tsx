import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

// --- 타입 정의 ---
interface StatCardData {
  totalCount: number;
  completedCount: number;
  validationCount: number;
  qualityPassRate: number;
}

interface ProgressItemData {
  label: string;
  percent: number;
  color: string;
}

// DB 함수 반환 타입
interface StatusProgress {
  status: string;
  count: number;
  percent: number;
}

interface CategoryDistribution {
  product_category: string;
  count: number;
  percent: number;
}

interface WorkerStat {
  worker_id: string;
  worker_name: string;
  worker_role: string;
  total_assigned: number;
  total_completed: number;
  rejection_rate: number;
}

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCardData>({
    totalCount: 0,
    completedCount: 0,
    validationCount: 0,
    qualityPassRate: 0,
  });
  const [progressData, setProgressData] = useState<ProgressItemData[]>([]);
  const [categoryData, setCategoryData] = useState<ProgressItemData[]>([]);
  const [workerStats, setWorkerStats] = useState<WorkerStat[]>([]);

  const ALL_STATUSES = [
    { key: 'pending', label: '수집 대기', color: '#f59e0b' },
    { key: 'refining', label: '정제 중', color: '#eab308' },
    { key: 'processing', label: '가공 중', color: '#3b82f6' },
    { key: 'validation', label: '검수 대기', color: '#8b5cf6' },
    { key: 'completed', label: '완료', color: '#10b981' },
    { key: 'rejected', label: '반려', color: '#ef4444' },
  ];

  const ALL_CATEGORIES = ['세정제', '살균제', '방향제', '표백제', '기타'];

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. 기본 통계 데이터 가져오기
      const { data: chemicalsData, error: chemicalsError } = await supabase
        .from('chemicals')
        .select('id, chemical_name_ko, cas_no, created_at');
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, product_name_alias, product_category, status, created_at');
      
      const { data: captionsData, error: captionsError } = await supabase
        .from('captions')
        .select('id, product_id, caption_type, created_at');
      
      const { data: qaData, error: qaError } = await supabase
        .from('qa_pairs')
        .select('id, product_id, user_type, created_at');

      if (chemicalsError) throw chemicalsError;
      if (productsError) throw productsError;
      if (captionsError) throw captionsError;
      if (qaError) throw qaError;

      // 2. 통계 계산
      const totalChemicals = chemicalsData?.length || 0;
      const totalProducts = productsData?.length || 0;
      const totalCaptions = captionsData?.length || 0;
      const totalQA = qaData?.length || 0;
      
      // 상태별 진행률 계산
      const statusCounts: {[key: string]: number} = {};
      productsData?.forEach(product => {
        statusCounts[product.status] = (statusCounts[product.status] || 0) + 1;
      });
      
      const formattedProgress = ALL_STATUSES.map(statusInfo => {
        const count = statusCounts[statusInfo.key] || 0;
        const percent = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0;
        return { 
          label: `${statusInfo.label}: ${count}건`, 
          percent: percent, 
          color: statusInfo.color 
        };
      });
      
      // 카테고리별 분포 계산
      const categoryCounts: {[key: string]: number} = {};
      
      // 모든 카테고리를 0으로 초기화
      ALL_CATEGORIES.forEach(category => {
        categoryCounts[category] = 0;
      });
      
      // 실제 데이터로 카운트 업데이트
      productsData?.forEach(product => {
        const category = product.product_category || '기타';
        if (ALL_CATEGORIES.includes(category)) {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        } else {
          categoryCounts['기타'] = (categoryCounts['기타'] || 0) + 1;
        }
      });
      
      const categoryColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
      const formattedCategories = ALL_CATEGORIES.map((categoryName, index) => {
        const count = categoryCounts[categoryName] || 0;
        const percent = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0;
        return {
          label: `${categoryName}: ${count}건`,
          percent: percent,
          color: categoryColors[index % categoryColors.length]
        };
      }); // 모든 카테고리 항상 표시
      
      // 디버깅용 로그
      console.log('카테고리 데이터:', formattedCategories);
      console.log('전체 제품 수:', totalProducts);
      console.log('카테고리 카운트:', categoryCounts);
      
      // 상태 업데이트
      setStats({
        totalCount: totalProducts,  // 제품 데이터만 집계
        completedCount: statusCounts['completed'] || 0,
        validationCount: statusCounts['validation'] || 0,
        qualityPassRate: totalProducts > 0 ? Math.round(((statusCounts['completed'] || 0) / totalProducts) * 100) : 0,
      });
      
      setProgressData(formattedProgress);
      setCategoryData(formattedCategories);
      
      // 작업자 데이터 가져오기
      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('id, email, name, organization, created_at, role');
      
      if (workersError) {
        console.error('Workers 데이터 로딩 에러:', workersError);
        setWorkerStats([]);
      } else {
        // 모든 작업자의 담당건수와 완료건수를 0으로 설정
        // 나중에 관리자가 작업 분배 후 업데이트 예정
        const formattedWorkerStats = workersData?.map((worker) => {
          return {
            worker_id: worker.id?.toString() || 'unknown',
            worker_name: worker.name || '알 수 없음',
            worker_role: worker.role || worker.organization || '미지정',
            total_assigned: 0,  // 관리자 분배 대기
            total_completed: 0, // 아직 완료된 작업 없음
            rejection_rate: 0   // 아직 반려 내역 없음
          };
        }) || [];
        
        console.log('Workers 데이터:', workersData);
        console.log('작업자 통계 (분배 대기):', formattedWorkerStats);
        
        setWorkerStats(formattedWorkerStats);
      }
      
    } catch (error) {
      console.error('대시보드 데이터 로딩 에러:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <div style={{ padding: '24px' }}>대시보드 데이터를 불러오는 중...</div>;
  }

  return (
    <main style={{ padding: '24px', backgroundColor: '#f9fafb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>관리자 대시보드</h2>
        <button onClick={fetchDashboardData} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          🔄 새로고침
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '30px',
        }}
      >
        <StatCard color="#3b82f6" number={`${stats.totalCount}`} label="총 데이터 등록" />
        <StatCard color="#10b981" number={`${stats.completedCount}`} label="완료된 등록" />
        <StatCard color="#f59e0b" number={`${stats.validationCount}`} label="검수 대기 등록" />
        <StatCard color="#8b5cf6" number={`${stats.qualityPassRate}%`} label="품질 검수 통과율" />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}
      >
        <ProgressGroup title="단계별 진행 현황" items={progressData} />
        <ProgressGroup title="카테고리별 데이터 분포" items={categoryData} />
      </div>

      <WorkerTable workerStats={workerStats} />
    </main>
  );
};

const StatCard = ({ color, number, label }: { color: string; number: string; label: string }) => (
  <div style={{ backgroundColor: color, padding: 20, borderRadius: 10, color: '#fff' }}>
    <div style={{ fontSize: 24, fontWeight: 700 }}>{number}</div>
    <div style={{ marginTop: 8 }}>{label}</div>
  </div>
);

const ProgressGroup = ({
  title,
  items,
}: {
  title: string;
  items: { label: string; percent: number; color: string }[];
}) => (
  <div style={{ background: '#fff', borderRadius: 8, padding: 20 }}>
    <h3 style={{ marginBottom: 20 }}>{title}</h3>
    {items.map((item, i) => (
      <ProgressItem key={i} {...item} />
    ))}
  </div>
);

const ProgressItem = ({ label, percent, color }: { label: string; percent: number; color: string }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
      <span>{label}</span>
      <span>{percent}%</span>
    </div>
    <div style={{ background: '#e5e7eb', height: 10, borderRadius: 4, overflow: 'hidden' }}>
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 4,
        }}
      />
    </div>
  </div>
);

const WorkerTable = ({ workerStats }: { workerStats: WorkerStat[] }) => {
  const getQuality = (rejectionRate: number) => {
      if (rejectionRate <= 10) return { text: '좋음', color: '#10b981' }; // 0% ~ 10%
      if (rejectionRate <= 30) return { text: '보통', color: '#f59e0b' }; // 11% ~ 30%
      if (rejectionRate <= 50) return { text: '나쁨', color: '#ef4444' }; // 31% ~ 50%
      return { text: '개선 필요', color: '#dc2626' }; // 51% 초과 (더 진한 빨강)
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          padding: 20,
          borderBottom: '1px solid #e5e7eb',
          position: 'relative',
        }}
      >
        <h3 style={{ marginBottom: 10 }}>작업자별 현황</h3>

      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
        <thead>
          <tr>
            {['작업자', '역할', '담당 건수', '완료 건수', '반려율', '품질', '상태'].map(head => (
              <th
                key={head}
                style={{
                  textAlign: 'left',
                  padding: '12px 8px',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#374151',
                }}
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {workerStats.map(worker => {
            const quality = getQuality(worker.rejection_rate);
            return (
              <tr key={worker.worker_id}>
                <td style={tdStyle}>{worker.worker_name}</td>
                <td style={{...tdStyle, color: '#6b7280', fontSize: '13px'}}>{worker.worker_role}</td>
                <td style={tdStyle}>{`${worker.total_assigned}건`}</td>
                <td style={tdStyle}>{`${worker.total_completed}건`}</td>
                <td style={tdStyle}>{`${worker.rejection_rate}%`}</td>
                <td style={{ ...tdStyle, color: quality.color, fontWeight: 'bold' }}>{quality.text}</td>
                <td style={{ ...tdStyle, color: '#3b82f6' }}>정상</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const tdStyle: React.CSSProperties = {
  padding: '12px 8px',
  fontSize: 14,
  color: '#374151',
  borderBottom: '1px solid #e5e7eb',
};

export default DashboardPage;