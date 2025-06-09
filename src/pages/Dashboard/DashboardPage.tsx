import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const ALL_STATUSES = [
      { key: 'pending', label: '수집 대기', color: '#f59e0b' },
      { key: 'refining', label: '정제 중', color: '#eab308' },
      { key: 'processing', label: '가공 중', color: '#3b82f6' },
      { key: 'validation', label: '검수 대기', color: '#8b5cf6' },
      { key: 'completed', label: '완료', color: '#10b981' },
      { key: 'rejected', label: '반려', color: '#ef4444' },
    ];

    const ALL_CATEGORIES = ['세정제', '살균제', '방향제', '표백제', '기타'];

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, progressRes, categoryRes, workerRes] = await Promise.all([
          supabase.rpc('get_dashboard_stats'),
          supabase.rpc('get_status_progress'),
          supabase.rpc('get_category_distribution'),
          supabase.rpc('get_worker_stats'),
        ]);

        if (statsRes.error) throw statsRes.error;
        if (progressRes.error) throw progressRes.error;
        if (categoryRes.error) throw categoryRes.error;
        if (workerRes.error) throw workerRes.error;

        if (statsRes.data) setStats(statsRes.data);
        if (workerRes.data) setWorkerStats(workerRes.data);

        if (progressRes.data) {
          const dbProgressData = progressRes.data as StatusProgress[];
          const formattedProgress = ALL_STATUSES.map(statusInfo => {
            const dbData = dbProgressData.find(dbItem => dbItem.status === statusInfo.key);
            return { label: statusInfo.label, percent: dbData ? dbData.percent : 0, color: statusInfo.color };
          });
          setProgressData(formattedProgress);
        }

        if (categoryRes.data) {
          const categoryColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'];
          const dbCategoryData = categoryRes.data as CategoryDistribution[];
          const formattedCategories = ALL_CATEGORIES.map((categoryName, index) => {
            const dbData = dbCategoryData.find(dbItem => dbItem.product_category === categoryName);
            const count = dbData ? dbData.count : 0;
            const percent = dbData ? dbData.percent : 0;
            return {
              label: `${categoryName}: ${count}건 (${percent}%)`,
              percent: percent,
              color: categoryColors[index % categoryColors.length]
            };
          });
          setCategoryData(formattedCategories);
        }

      } catch (error) {
        console.error('대시보드 데이터 로딩 에러:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div style={{ padding: '24px' }}>대시보드 데이터를 불러오는 중...</div>;
  }

  return (
    <main style={{ padding: '24px', backgroundColor: '#f9fafb' }}>
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
            {['작업자', '담당 건수', '완료 건수', '반려율', '품질', '상태'].map(head => (
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