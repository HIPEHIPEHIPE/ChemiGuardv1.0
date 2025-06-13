import React, { CSSProperties, useState } from 'react';
import RefineStatCard from './RefineStatCard';
import IssueCard from './IssueCard';
import RefinementTable from './RefinementTable';
import { ProductWithIngredients, RefinementStats, RefinementIssue, determineProductStatus } from '../../../api/dataRefinement';
import { detailTextStyle, detailHighlightStyle, btnStyle, getIssueIcon } from './utils';

interface RefinementOverviewProps {
  stats: RefinementStats | null;
  products: ProductWithIngredients[];
  onAutoFix: (ingredientId: string, issues: RefinementIssue[]) => Promise<void>;
  onComplete?: () => void;
}

// 확장된 이슈 타입 정의
interface ExtendedIssue extends RefinementIssue {
  productName: string;
  ingredientName: string;
  ingredientId: string;
  isIgnored?: boolean;
}

const statGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '15px',
  marginBottom: '20px',
};

const subHeadingStyle: CSSProperties = {
  marginBottom: '15px',
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#1f2937',
};

// 이슈 필터 버튼 스타일
const filterButtonStyle = (isActive: boolean, type: string): CSSProperties => ({
  padding: '6px 12px',
  margin: '0 5px 5px 0',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  backgroundColor: isActive ? getTypeColor(type) : 'white',
  color: isActive ? 'white' : '#374151',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '500',
});

// 타입별 색상 함수
const getTypeColor = (type: string): string => {
  switch (type) {
    case 'error': return '#ef4444';
    case 'warning': return '#f59e0b';
    case 'suggestion': return '#3b82f6';
    default: return '#6b7280';
  }
};

// 페이지네이션 스타일
const paginationStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px',
  marginTop: '20px',
  padding: '15px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
};

const pageButtonStyle = (isActive: boolean): CSSProperties => ({
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  backgroundColor: isActive ? '#3b82f6' : 'white',
  color: isActive ? 'white' : '#374151',
  cursor: 'pointer',
  fontSize: '14px',
});

const RefinementOverview: React.FC<RefinementOverviewProps> = ({ stats, products, onAutoFix, onComplete }) => {
  // 상태 관리
  const [ignoredIssues, setIgnoredIssues] = useState<Set<string>>(new Set());
  const [selectedIssue, setSelectedIssue] = useState<ExtendedIssue | null>(null);
  const [issueFilter, setIssueFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const issuesPerPage = 10;

  // 통계 데이터 포맷팅
  const statData = stats ? [
    { number: `${stats.error_count}개`, label: '오류 제품', color: '#ef4444' },
    { number: `${stats.warning_count}개`, label: '경고 제품', color: '#f59e0b' },
    { number: `${stats.suggestion_count}개`, label: '검토필요 제품', color: '#3b82f6' },
    { number: `${stats.completed_count}개`, label: '정상완료 제품', color: '#10b981' },
  ] : [
    { number: '0개', label: '오류 제품', color: '#ef4444' },
    { number: '0개', label: '경고 제품', color: '#f59e0b' },
    { number: '0개', label: '검토필요 제품', color: '#3b82f6' },
    { number: '0개', label: '정상완료 제품', color: '#10b981' },
  ];

  // 모든 이슈를 평면화해서 가져오기
  const allIssues: ExtendedIssue[] = products.flatMap(product => 
    product.ingredients.flatMap(ingredient => 
      (ingredient.issues || []).map(issue => ({
        ...issue,
        productName: product.product_name,
        ingredientName: ingredient.main_ingredient,
        ingredientId: ingredient.ingredient_id,
        isIgnored: ignoredIssues.has(`${issue.id}-${ingredient.ingredient_id}`)
      }))
    )
  );

  // 필터링된 이슈
  const filteredIssues = allIssues.filter(issue => {
    if (issue.isIgnored) return false;
    if (issueFilter === 'all') return true;
    return issue.type === issueFilter;
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredIssues.length / issuesPerPage);
  const startIndex = (currentPage - 1) * issuesPerPage;
  const endIndex = startIndex + issuesPerPage;
  const currentIssues = filteredIssues.slice(startIndex, endIndex);

  // 실제 데이터 현황 계산
  const totalProducts = products.length;
  const totalIngredients = products.reduce((sum, product) => sum + product.ingredients.length, 0);
  const totalIssues = allIssues.length;
  const activeIssues = filteredIssues.length;

  // 제품별 상태 분석
  const productStatusBreakdown = products.map(product => {
    const { status, issueCount } = determineProductStatus(product);
    return { product, status, issueCount };
  });

  // 이슈 무시 핸들러
  const handleIgnoreIssue = (issue: ExtendedIssue) => {
    const issueKey = `${issue.id}-${issue.ingredientId}`;
    setIgnoredIssues(prev => {
      const newSet = new Set(prev);
      newSet.add(issueKey);
      return newSet;
    });
    console.log('이슈 무시됨:', issue.title);
  };

  // 이슈 상세보기 핸들러
  const handleViewDetails = (issue: ExtendedIssue) => {
    setSelectedIssue(issue);
    console.log('이슈 상세보기:', issue);
  };

  // 필터 변경 핸들러
  const handleFilterChange = (filter: string) => {
    setIssueFilter(filter);
    setCurrentPage(1);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 데이터 현황 메시지 동적 생성
  const getDataStatusMessage = () => {
    if (totalProducts === 0) {
      return '📊 데이터베이스에서 제품 데이터를 찾을 수 없습니다. 데이터 수집을 먼저 진행해주세요.';
    }
    
    const errorProducts = productStatusBreakdown.filter(p => p.status === 'error').length;
    const warningProducts = productStatusBreakdown.filter(p => p.status === 'warning').length;
    const suggestionProducts = productStatusBreakdown.filter(p => p.status === 'suggestion').length;
    const completedProducts = productStatusBreakdown.filter(p => p.status === 'completed').length;
    
    if (totalIssues === 0) {
      return `📊 데이터 현황: 제품 ${totalProducts}개, 성분 ${totalIngredients}개 - 모든 데이터가 정상입니다! 🎉`;
    }
    
    return `📊 데이터 현황: 총 제품 ${totalProducts}개 (오류 ${errorProducts}개, 경고 ${warningProducts}개, 검토필요 ${suggestionProducts}개, 정상 ${completedProducts}개), 성분 ${totalIngredients}개, 발견된 이슈 ${totalIssues}건`;
  };

  // 이슈 타입별 개수 계산
  const issueTypeCounts = {
    all: allIssues.filter(i => !i.isIgnored).length,
    error: allIssues.filter(i => !i.isIgnored && i.type === 'error').length,
    warning: allIssues.filter(i => !i.isIgnored && i.type === 'warning').length,
    suggestion: allIssues.filter(i => !i.isIgnored && i.type === 'suggestion').length,
  };

  return (
    <>
      {/* 총 데이터 개수 표시 */}
      <div style={{
        padding: '15px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
          📊 전체 데이터 현황
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#4b5563' }}>
          <span><strong>총 제품:</strong> {stats?.total_products || 0}개</span>
          <span><strong>총 성분:</strong> {stats?.total_ingredients || 0}개</span>
          <span><strong>감지된 이슈:</strong> {totalIssues}건</span>
          <span><strong>무시된 이슈:</strong> {ignoredIssues.size}건</span>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={statGridStyle}>
        {statData.map(stat => (
          <RefineStatCard key={stat.label} number={stat.number} label={stat.label} color={stat.color} />
        ))}
      </div>

      {/* 정제 완료 버튼 - 테스트용으로 조건 완화 */}
      {onComplete && totalProducts > 0 && (
        <div style={{
          padding: '16px',
          backgroundColor: totalIssues === 0 ? '#ecfdf5' : '#dbeafe',
          borderRadius: '8px',
          border: totalIssues === 0 ? '1px solid #10b981' : '1px solid #3b82f6',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {totalIssues === 0 ? (
            <>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
                ✅ 데이터 정제가 완료되었습니다!
              </div>
              <div style={{ fontSize: '14px', color: '#065f46', marginBottom: '16px' }}>
                모든 제품이 품질 검증을 통과했습니다. 다음 단계(표준화)로 진행할 수 있습니다.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
                🧪 테스트 모드: 정제 진행 중
              </div>
              <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '16px' }}>
                아직 {totalIssues}개의 이슈가 남아있지만, 테스트를 위해 다음 단계로 진행할 수 있습니다.
              </div>
            </>
          )}
          <button
            onClick={onComplete}
            style={{
              padding: '12px 24px',
              backgroundColor: totalIssues === 0 ? '#10b981' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: `0 2px 4px rgba(${totalIssues === 0 ? '16, 185, 129' : '59, 130, 246'}, 0.2)`
            }}
          >
            다음 단계: 데이터 표준화 {totalIssues > 0 ? '(테스트)' : ''}
          </button>
        </div>
      )}

      {/* 진행 중 메시지 */}
      {totalIssues > 0 && totalProducts > 0 && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          border: '1px solid #f59e0b',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
            ⚠️ 데이터 정제가 진행 중입니다
          </div>
          <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '16px' }}>
            아직 {totalIssues}개의 이슈가 남아있습니다. 하단의 엑셀 스타일 편집기에서 모든 이슈를 해결해주세요.
          </div>
          <div style={{ fontSize: '12px', color: '#92400e' }}>
            💡 이슈가 있는 셀을 클릭하여 편집하거나 ⚡ 버튼으로 자동 수정할 수 있습니다.
          </div>
        </div>
      )}

      {/* 데이터가 없는 경우 안내 */}
      {totalProducts === 0 && (
        <div style={{
          padding: '32px',
          backgroundColor: '#f3f4f6',
          borderRadius: '12px',
          border: '2px dashed #d1d5db',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            데이터 정제를 시작하려면 데이터가 필요합니다
          </div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>
            데이터 획득 페이지에서 먼저 제품 데이터를 수집하거나<br/>
            하단의 관리자 도구에서 테스트 데이터를 업로드해주세요.
          </div>
        </div>
      )}
    </>
  );
};

export default RefinementOverview;
