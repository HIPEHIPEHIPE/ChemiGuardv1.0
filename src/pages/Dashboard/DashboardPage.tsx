import React from 'react';

const DashboardPage = () => {
  return (
    <main style={{ padding: '24px', backgroundColor: '#f9fafb' }}>
      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <StatCard color="#3b82f6" number="287" label="총 데이터 등록 / 300 목표" />
        <StatCard color="#10b981" number="156" label="완료된 등록" />
        <StatCard color="#f59e0b" number="43" label="검수 대기 등록" />
        <StatCard color="#8b5cf6" number="85%" label="품질 검수 통과율" />
      </div>

      {/* 진행률 차트 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <ProgressGroup
          title="단계별 진행 현황"
          items={[
            { label: '초기 정제', percent: 100, color: '#10b981' },
            { label: '독성 정보', percent: 82, color: '#3b82f6' },
            { label: '가공 정보', percent: 70, color: '#f59e0b' },
            { label: '검수 완료', percent: 58, color: '#8b5cf6' },
          ]}
        />
        <ProgressGroup
          title="카테고리별 데이터 분포"
          items={[
            { label: '세정제: 120건 (42%)', percent: 42, color: '#3b82f6' },
            { label: '살균제: 78건 (27%)', percent: 27, color: '#10b981' },
            { label: '방향제: 45건 (16%)', percent: 16, color: '#f59e0b' },
            { label: '기타: 19건 (6%)', percent: 6, color: '#8b5cf6' },
          ]}
          qualityMetrics={[
            { label: '데이터 품질', percent: 85, color: '#10b981' },
            { label: '자동 처리 오류율', percent: 15, color: '#f59e0b' },
            { label: '데이터 완전성', percent: 92, color: '#3b82f6' },
          ]}
        />
      </div>

      {/* 작업자 테이블 */}
     <div style={{ marginTop: 20 }}>
        <div style={{ padding: 20, borderBottom: '1px solid #e5e7eb', position: 'relative' }}>
            <h3 style={{ marginBottom: 10 }}>작업자별 현황</h3>
            <button
            style={{
                position: 'absolute',
                right: 20,
                top: 20,
                padding: '6px 12px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer',
            }}
            >
            목록 보기
            </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
            <tr>
                {['작업자', '담당 건수', '완료 건수', '반려율', '품질', '상태'].map((head) => (
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
            {[
                { name: '김○○', total: '15건', done: '12건', reject: '8%', quality: '좋음', qualityColor: '#10b981' },
                { name: '이○○', total: '22건', done: '18건', reject: '5%', quality: '좋음', qualityColor: '#10b981' },
                { name: '박○○', total: '18건', done: '10건', reject: '15%', quality: '보통', qualityColor: '#f59e0b' },
            ].map((row, i) => (
                <tr key={i}>
                <td style={tdStyle}>{row.name}</td>
                <td style={tdStyle}>{row.total}</td>
                <td style={tdStyle}>{row.done}</td>
                <td style={tdStyle}>{row.reject}</td>
                <td style={{ ...tdStyle, color: row.qualityColor }}>{row.quality}</td>
                <td style={{ ...tdStyle, color: '#3b82f6' }}>정상</td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
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
  qualityMetrics,
}: {
  title: string;
  items: { label: string; percent: number; color: string }[];
  qualityMetrics?: { label: string; percent: number; color: string }[];
}) => (
  <div style={{ background: '#fff', borderRadius: 8, padding: 20 }}>
    <h3 style={{ marginBottom: 20 }}>{title}</h3>
    {items.map((item, i) => (
      <ProgressItem key={i} {...item} />
    ))}
    {qualityMetrics && (
      <div style={{ marginTop: 20 }}>
        <h4 style={{ marginBottom: 10 }}>품질 지표</h4>
        {qualityMetrics.map((item, i) => (
          <ProgressItem key={i} {...item} />
        ))}
      </div>
    )}
  </div>
);

const ProgressItem = ({ label, percent, color }: { label: string; percent: number; color: string }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
      <span>{label}</span>
      <span>{percent}%</span>
    </div>
    <div style={{ background: '#e5e7eb', height: 10, borderRadius: 4, overflow: 'hidden' }}>
      <div style={{
        width: `${percent}%`,
        height: '100%',
        backgroundColor: color,
        borderRadius: 4
      }} />
    </div>
  </div>
);


const buttonStyle: React.CSSProperties = {
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '8px 16px',
  cursor: 'pointer',
};
// 통계 카드 스타일
export const statCardStyle = (color: string) => ({
  backgroundColor: '#fff',
  borderLeft: `6px solid ${color}`,
  borderRadius: 8,
  padding: 20,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
});

// 카드 숫자
export const statNumberStyle = (color: string) => ({
  fontSize: 28,
  fontWeight: 'bold',
  color: color,
  marginBottom: 8,
});

// 카드 레이블
export const statLabelStyle = {
  fontSize: 14,
  color: '#374151',
};


// 차트 컨테이너
export const chartContainerStyle = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

// 차트 제목
export const chartTitleStyle = {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 20,
};

// 프로그레스 아이템 한 줄
export const progressItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
};

// 프로그레스 바 전체
export const progressBarStyle = {
  flex: 1,
  height: 12,
  backgroundColor: '#e5e7eb',
  borderRadius: 6,
  margin: '0 12px',
};

// 채워진 바
export const progressFillStyle = (color: string, widthPercent: number) => ({
  height: '100%',
  width: `${widthPercent}%`,
  backgroundColor: color,
  borderRadius: 6,
});


// 테이블 스타일
export const tableContainerStyle = {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 24,
  marginTop: 40,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

export const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

export const thStyle = {
  textAlign: 'center' as const,
  padding: '14px 12px',
  backgroundColor: '#f3f4f6',
  borderBottom: '2px solid #e5e7eb',
  fontWeight: 600,
  fontSize: 15,
  color: '#374151',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 8px',
  fontSize: 14,
  color: '#374151',
  borderBottom: '1px solid #e5e7eb',
};

export const statusStyle = (color: string) => ({
  color,
  fontWeight: 'bold',
});

export const tableRowHoverStyle = {
  transition: 'background-color 0.2s ease',
  ':hover': {
    backgroundColor: '#f9fafb',
  },
};

export default DashboardPage;