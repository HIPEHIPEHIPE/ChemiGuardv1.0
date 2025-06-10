import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

// --- 타입 정의 ---
interface StatCardData {
  totalProducts: number;
  approvedCount: number;
  reviewedCount: number;
  qualityPassRate: number;
}

interface ProgressItemData {
  label: string;
  percent: number;
  color: string;
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
    totalProducts: 0,
    approvedCount: 0,
    reviewedCount: 0,
    qualityPassRate: 0,
  });
  const [progressData, setProgressData] = useState<ProgressItemData[]>([]);
  const [categoryData, setCategoryData] = useState<ProgressItemData[]>([]);
  const [workerStats, setWorkerStats] = useState<WorkerStat[]>([]);

  const ALL_STATUSES = [
    { key: 'collected', label: '수집완료', color: '#10b981' },
    { key: 'annotated', label: '주석완료', color: '#3b82f6' },
    { key: 'reviewed', label: '검수완료', color: '#8b5cf6' },
    { key: 'approved', label: '승인완료', color: '#059669' },
    { key: 'rejected', label: '반려', color: '#ef4444' },
    { key: 'draft', label: '초안', color: '#f59e0b' },
  ];

  // 카테고리 매핑 함수 (CSV 데이터 → 표준 카테고리)
  const mapToStandardCategory = (csvCategory: string): string => {
    const categoryMap: { [key: string]: string } = {
      '세정제': '세정제품',
      '세탁세제': '세탁제품', 
      '표백제/섬유유연제': '세탁제품',
      '광택제': '코팅제품',
      '방향제': '방향·탈취제품',
      '탈취제': '방향·탈취제품',
      '살균제': '살균제품',
      '다림질보조제': '세탁제품',
      '제습제': '기타'
    };
    return categoryMap[csvCategory] || '기타';
  };

  const PRODUCT_CATEGORIES = [
    '세정제품', '세탁제품', '코팅제품', '접착·접합제품', '방향·탈취제품',
    '염색·도색제품', '자동차 전용 제품', '인쇄 및 문서관련 제품', '미용제품',
    '여가용품 관리제품', '살균제품', '구제제품', '보존·보존처리제품', '기타'
  ];

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. 필요한 모든 데이터를 병렬로 가져오기 (성능 향상)
      const [
        { data: productsData, error: productsError },
        { data: trainingData, error: trainingError },
        { data: workersData, error: workersError },
        { data: assignmentsData, error: assignmentsError }
      ] = await Promise.all([
        supabase.from('products').select('id, product_category, status, created_at'),
        supabase.from('ai_training_data').select('review_status'),
        supabase.from('workers').select('id, name, role, organization'), 
        supabase.from('work_assignments').select('assigned_to, target_count, completed_count')
      ]);

      // 2. 에러 핸들링
      if (productsError) throw productsError;
      if (trainingError) throw trainingError;
      if (workersError) throw workersError;
      if (assignmentsError) throw assignmentsError;
      
      const totalProducts = productsData?.length || 0;

      // 3. 통계 카드 데이터 계산 (approved, reviewed는 trainingData 기준)
      const approvedCount = trainingData?.filter(d => d.review_status === 'approved').length || 0;
      const reviewedCount = trainingData?.filter(d => d.review_status === 'reviewed').length || 0;
      
      setStats({
        totalProducts: totalProducts,
        approvedCount: approvedCount,
        reviewedCount: reviewedCount,
        qualityPassRate: totalProducts > 0 ? Math.round((approvedCount / totalProducts) * 100) : 0,
      });

      // 4. 데이터 처리 단계별 현황 계산
      const statusCounts: {[key: string]: number} = {};
      ALL_STATUSES.forEach(status => { statusCounts[status.key] = 0; });

      productsData?.forEach(product => {
        if (product.status && product.status in statusCounts) {
          statusCounts[product.status]++;
        }
      });
      statusCounts['approved'] = approvedCount; // 정확한 값으로 덮어쓰기
      statusCounts['reviewed'] = reviewedCount; // 정확한 값으로 덮어쓰기

      // 데이터 유무와 상관없이 항상 모든 상태 항목 생성
      const formattedProgress = ALL_STATUSES.map(statusInfo => {
        const count = statusCounts[statusInfo.key] || 0;
        const percent = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0;
        return {
          label: `${statusInfo.label}: ${count}건`,
          percent: percent,
          color: statusInfo.color
        };
      });
      setProgressData(formattedProgress);

      // 5. 제품 카테고리별 분포 계산 (표준 카테고리로 매핑)
      const categoryCounts: { [key: string]: number } = {};
      productsData?.forEach(product => {
        const rawCategory = product.product_category || '기타';
        const standardCategory = mapToStandardCategory(rawCategory);
        categoryCounts[standardCategory] = (categoryCounts[standardCategory] || 0) + 1;
      });

      // 실제 데이터에서 발견된 카테고리들을 기준으로 정렬
      const categoryColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#059669', '#d97706', '#7c3aed'];
      const sortedCategories = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a) // 건수 많은 순으로 정렬
        .slice(0, 8); // 상위 8개만 표시
      
      const formattedCategories = sortedCategories.map(([categoryName, count], index) => {
        const percent = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0;
        return {
          label: `${categoryName}: ${count}건`,
          percent: percent,
          color: categoryColors[index % categoryColors.length]
        };
      });
      
      setCategoryData(formattedCategories);

         if (!workersData) {
          setWorkerStats([]);
        } else {
          const formattedWorkerStats = workersData.map(worker => {
            const assignment = assignmentsData?.find(a => a.assigned_to === worker.id);
            
            // --- ✨ 여기가 수정된 부분입니다 ---
            const role = worker.role;
            const org = worker.organization;
            let roleDisplay = '미지정'; // 기본값

            if (role && org) {
              roleDisplay = `${role} / ${org}`; // 역할과 소속이 모두 있는 경우
            } else if (role) {
              roleDisplay = role; // 역할만 있는 경우
            } else if (org) {
              roleDisplay = org; // 소속만 있는 경우
            }
            // --- ✨ 수정 끝 ---

            return {
              worker_id: worker.id?.toString() || 'unknown',
              worker_name: worker.name || '알 수 없음',
              worker_role: roleDisplay, // 수정된 값을 할당합니다.
              total_assigned: assignment?.target_count || 0,
              total_completed: assignment?.completed_count || 0,
              rejection_rate: 0 // 반려율은 현재 계산 로직이 없으므로 0으로 유지
            };
          });
          
          setWorkerStats(formattedWorkerStats);
        }

    } catch (error) {
      console.error('대시보드 데이터 로딩 에러:', error);
      // 에러 발생 시에도 기본 항목을 표시하도록 설정
      setProgressData(ALL_STATUSES.map(s => ({label: `${s.label}: 0건`, percent: 0, color: s.color})));
      setCategoryData([]); // 카테고리는 DB 조회 실패 시 비워둠
      setWorkerStats([]);
    } finally {
      setLoading(false);
    }
}, []);
  useEffect(() => {
    fetchDashboardData();
    
    // 주기적으로 데이터 새로고침 (30초마다)
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return <div style={{ padding: '24px' }}>대시보드 데이터를 불러오는 중...</div>;
  }

  return (
    <main style={{ padding: '24px', backgroundColor: '#f9fafb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>ChemiGuard 관리자 대시보드</h2>
        <button onClick={fetchDashboardData} style={{
          padding: '10px 20px',
          cursor: 'pointer',
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
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
        <StatCard color="#3b82f6" number={`${stats.totalProducts}`} label="총 제품 수" />
        <StatCard color="#10b981" number={`${stats.approvedCount}`} label="승인 완료" />
        <StatCard color="#f59e0b" number={`${stats.reviewedCount}`} label="검수 완료" />
        <StatCard color="#8b5cf6" number={`${stats.qualityPassRate}%`} label="품질 승인율" />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '30px'
        }}
      >
        <ProgressGroup title="데이터 처리 단계별 현황" items={progressData} />
        <ProgressGroup title="제품 카테고리별 분포" items={categoryData} />
      </div>

      <WorkerTable workerStats={workerStats} />
    </main>
  );
};

const StatCard = ({ color, number, label }: { color: string; number: string; label: string }) => (
  <div style={{
    backgroundColor: color,
    padding: 24,
    borderRadius: 12,
    color: '#fff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }}>
    <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{number}</div>
    <div style={{ fontSize: 16, opacity: 0.9 }}>{label}</div>
  </div>
);

const ProgressGroup = ({
  title,
  items,
}: {
  title: string;
  items: { label: string; percent: number; color: string }[];
}) => (
  <div style={{
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  }}>
    <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: '600', color: '#1f2937' }}>{title}</h3>
    
    {/* 조건문을 제거하고 바로 map을 실행 */}
    {items.map((item, i) => (
      <ProgressItem key={i} {...item} />
    ))}

    {/* 예외 상황(DB 연결 실패 등)에서 items가 비어있을 때를 위한 메시지 */}
    {items.length === 0 && (
        <p style={{ color: '#6b7280', fontSize: 14 }}>표시할 항목이 없습니다.</p>
    )}
  </div>
);

const ProgressItem = ({ label, percent, color }: { label: string; percent: number; color: string }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8, color: '#374151' }}>
      <span>{label}</span>
      <span style={{ fontWeight: '600' }}>{percent}%</span>
    </div>
    <div style={{ background: '#e5e7eb', height: 8, borderRadius: 4, overflow: 'hidden' }}>
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 4,
          transition: 'width 0.3s ease'
        }}
      />
    </div>
  </div>
);

const WorkerTable = ({ workerStats }: { workerStats: WorkerStat[] }) => {
  const getQuality = (rejectionRate: number) => {
    if (rejectionRate <= 10) return { text: '우수', color: '#10b981' };
    if (rejectionRate <= 30) return { text: '보통', color: '#f59e0b' };
    if (rejectionRate <= 50) return { text: '개선필요', color: '#ef4444' };
    return { text: '긴급조치', color: '#dc2626' };
  };

  if (workerStats.length === 0) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: 24,
        color: '#6b7280',
        fontSize: 14,
        textAlign: 'center'
      }}>
        현재 등록된 작업자 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: '600', color: '#1f2937' }}>작업자별 현황</h3>
        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: 14 }}>현재 등록된 작업자들의 작업 진행 상황</p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              {['작업자', '역할/소속', '할당 건수', '완료 건수', '진행률', '품질 등급', '상태'].map(head => (
                <th
                  key={head}
                  style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid #e5e7eb',
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
              const completionRate = worker.total_assigned > 0 ? Math.round((worker.total_completed / worker.total_assigned) * 100) : 0;

              return (
                <tr key={worker.worker_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>{worker.worker_name}</div>
                  </td>
                  <td style={{ ...tdStyle, color: '#6b7280', fontSize: '13px' }}>{worker.worker_role}</td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: '500' }}>{worker.total_assigned}건</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: '500' }}>{worker.total_completed}건</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: '500', color: completionRate >= 80 ? '#10b981' : completionRate >= 50 ? '#f59e0b' : '#ef4444' }}>
                      {completionRate}%
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: quality.color, fontWeight: '600' }}>{quality.text}</td>
                  <td style={{ ...tdStyle }}>
                    <span style={{
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      활성
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const tdStyle: React.CSSProperties = {
  padding: '16px',
  fontSize: 14,
  color: '#374151',
  borderBottom: '1px solid #f3f4f6',
};

export default DashboardPage;