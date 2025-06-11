import React, { CSSProperties, useState } from 'react';
import RefineStatCard from './RefineStatCard';
import IssueCard from './IssueCard';
import RefinementTable from './RefinementTable';
import { ProductWithIngredients, RefinementStats, RefinementIssue, determineProductStatus } from '../../api/dataRefinement';
import { detailTextStyle, detailHighlightStyle, btnStyle, getIssueIcon } from './utils';

interface RefinementOverviewProps {
  stats: RefinementStats | null;
  products: ProductWithIngredients[];
  onAutoFix: (ingredientId: string, issues: RefinementIssue[]) => Promise<void>;
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

const RefinementOverview: React.FC<RefinementOverviewProps> = ({ stats, products, onAutoFix }) => {
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

      {/* 발견된 문제점 섹션 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={subHeadingStyle}>발견된 문제점 및 제안사항</h3>
        
        {/* 실제 데이터 현황 정보 */}
        <div style={{
          padding: '15px', 
          backgroundColor: totalIssues > 0 ? '#fee2e2' : totalProducts === 0 ? '#f3f4f6' : '#d1fae5', 
          borderRadius: '8px', 
          marginBottom: '15px', 
          fontSize: '14px',
          border: totalIssues > 0 ? '1px solid #fecaca' : totalProducts === 0 ? '1px solid #d1d5db' : '1px solid #a7f3d0'
        }}>
          {getDataStatusMessage()}
          {totalProducts > 0 && totalIssues === 0 && (
            <div style={{color: '#065f46', marginTop: '5px', fontWeight: '500'}}>
              ✅ 모든 제품이 검증 기준을 통과했습니다.
            </div>
          )}
          {totalProducts === 0 && (
            <div style={{color: '#6b7280', marginTop: '5px'}}>
              ※ 실제 데이터가 없어 예시를 표시합니다. 데이터 수집 페이지에서 제품 정보를 먼저 등록해주세요.
            </div>
          )}
          {totalProducts > 0 && totalIssues > 0 && (
            <div style={{color: '#991b1b', marginTop: '5px', fontWeight: '500'}}>
              ⚠️ 데이터 품질 개선이 필요합니다. 아래 이슈들을 확인해주세요.
            </div>
          )}
        </div>

        {/* 이슈 필터링 버튼 */}
        {activeIssues > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              이슈 필터링:
            </div>
            <div>
              <button
                style={filterButtonStyle(issueFilter === 'all', 'all')}
                onClick={() => handleFilterChange('all')}
              >
                전체 ({issueTypeCounts.all})
              </button>
              <button
                style={filterButtonStyle(issueFilter === 'error', 'error')}
                onClick={() => handleFilterChange('error')}
              >
                ❌ 오류 ({issueTypeCounts.error})
              </button>
              <button
                style={filterButtonStyle(issueFilter === 'warning', 'warning')}
                onClick={() => handleFilterChange('warning')}
              >
                ⚠️ 경고 ({issueTypeCounts.warning})
              </button>
              <button
                style={filterButtonStyle(issueFilter === 'suggestion', 'suggestion')}
                onClick={() => handleFilterChange('suggestion')}
              >
                💡 제안 ({issueTypeCounts.suggestion})
              </button>
            </div>
          </div>
        )}
        
        {/* 실제 이슈들 표시 */}
        {activeIssues > 0 ? (
          <>
            <div style={{marginBottom: '10px', color: '#6b7280', fontSize: '14px'}}>
              {issueFilter === 'all' ? '전체' : issueFilter} 이슈 ({activeIssues}건 중 {startIndex + 1}-{Math.min(endIndex, activeIssues)}번):
            </div>
            {currentIssues.map((issue, index) => (
              <IssueCard
                key={`real-issue-${issue.id}-${issue.ingredientId}-${index}`}
                type={issue.type}
                title={getIssueIcon(issue.type) + ' ' + issue.title}
                content={
                  <>
                    <strong>제품:</strong> {issue.productName}<br/>
                    <strong>성분:</strong> {issue.ingredientName}<br/>
                    <strong>문제:</strong> {issue.description}
                    {issue.suggested_value && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={detailTextStyle}>
                          현재 값: <span style={detailHighlightStyle(issue.type)}>{issue.original_value}</span>
                        </div>
                        <div style={detailTextStyle}>
                          수정 제안: <span style={detailHighlightStyle(issue.type)}>{issue.suggested_value}</span>
                        </div>
                      </div>
                    )}
                  </>
                }
                actions={
                  <>
                    {issue.auto_fixable && (
                      <button 
                        style={btnStyle('primary')} 
                        onClick={() => onAutoFix(issue.ingredientId, [issue])}
                      >
                        자동 수정
                      </button>
                    )}
                    <button 
                      style={btnStyle('secondary')} 
                      onClick={() => handleIgnoreIssue(issue)}
                    >
                      무시
                    </button>
                    <button 
                      style={btnStyle('warning')} 
                      onClick={() => handleViewDetails(issue)}
                    >
                      상세 보기
                    </button>
                  </>
                }
              />
            ))}
            
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={paginationStyle}>
                <button
                  style={pageButtonStyle(false)}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    style={pageButtonStyle(page === currentPage)}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  style={pageButtonStyle(false)}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  다음
                </button>
              </div>
            )}
          </>
        ) : totalProducts > 0 ? (
          /* 데이터는 있지만 이슈가 없는 경우 */
          <div style={{
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{fontSize: '24px', marginBottom: '8px'}}>🎉</div>
            <div style={{fontSize: '16px', fontWeight: '600', color: '#166534', marginBottom: '4px'}}>
              모든 제품이 품질 기준을 통과했습니다!
            </div>
            <div style={{fontSize: '14px', color: '#166534'}}>
              추가 정제가 필요한 항목이 발견되지 않았습니다.
            </div>
          </div>
        ) : (
          /* 실제 데이터가 없을 때만 예시 표시 */
          <>
            <div style={{marginBottom: '10px', color: '#6b7280', fontSize: '14px'}}>
              데이터 품질 이슈 예시 (실제 데이터가 로드되면 자동 업데이트됩니다):
            </div>
            <IssueCard
              type="error"
              title="❌ CAS 번호 형식 오류 (예시)"
              content={
                <>
                  예시: 소듐라우릴황산염의 CAS 번호 형식이 올바르지 않습니다.
                  <div style={{ marginTop: '10px' }}>
                    <div style={detailTextStyle}>
                      입력 형식: <span style={detailHighlightStyle('error')}>151-21-3</span>
                    </div>
                    <div style={detailTextStyle}>
                      정정 제안: <span style={detailHighlightStyle('error')}>151-21-3</span>
                    </div>
                  </div>
                </>
              }
              actions={
                <>
                  <button style={btnStyle('primary')} disabled>수정 적용</button>
                  <button style={btnStyle('secondary')} disabled>무시</button>
                  <button style={btnStyle('warning')} disabled>상세 보기</button>
                </>
              }
            />
            <IssueCard
              type="warning"
              title="⚠️ 함량 범위 오류 (예시)"
              content={
                <>
                  예시: 일부 성분의 총 함량이 100%를 초과합니다.<br />
                  소듐라우릴황산염: 15-20%<br />
                  성분 B: 5-10%<br />
                  정제수: 70-80%
                </>
              }
              actions={
                <>
                  <button style={btnStyle('primary')} disabled>수정 적용</button>
                  <button style={btnStyle('secondary')} disabled>무시</button>
                  <button style={btnStyle('warning')} disabled>상세 보기</button>
                </>
              }
            />
          </>
        )}
      </div>

      {/* 이슈 상세보기 모달 */}
      {selectedIssue && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedIssue(null)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: getTypeColor(selectedIssue.type) }}>
                {getIssueIcon(selectedIssue.type)} {selectedIssue.title}
              </h3>
              <button
                onClick={() => setSelectedIssue(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>제품:</strong> {selectedIssue.productName}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>성분:</strong> {selectedIssue.ingredientName}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>문제 설명:</strong> {selectedIssue.description}
            </div>
            
            {selectedIssue.original_value && (
              <div style={{ marginBottom: '15px' }}>
                <strong>현재 값:</strong> 
                <span style={{
                  marginLeft: '8px',
                  padding: '4px 8px',
                  backgroundColor: '#fee2e2',
                  borderRadius: '4px',
                  color: '#dc2626'
                }}>
                  {selectedIssue.original_value}
                </span>
              </div>
            )}
            
            {selectedIssue.suggested_value && (
              <div style={{ marginBottom: '15px' }}>
                <strong>수정 제안:</strong>
                <span style={{
                  marginLeft: '8px',
                  padding: '4px 8px',
                  backgroundColor: '#d1fae5',
                  borderRadius: '4px',
                  color: '#065f46'
                }}>
                  {selectedIssue.suggested_value}
                </span>
              </div>
            )}
            
            <div style={{ marginBottom: '20px' }}>
              <strong>자동 수정 가능:</strong> {selectedIssue.auto_fixable ? '✅ 예' : '❌ 아니오'}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {selectedIssue.auto_fixable && (
                <button
                  style={btnStyle('primary')}
                  onClick={() => {
                    onAutoFix(selectedIssue.ingredientId, [selectedIssue]);
                    setSelectedIssue(null);
                  }}
                >
                  자동 수정 적용
                </button>
              )}
              <button
                style={btnStyle('secondary')}
                onClick={() => {
                  handleIgnoreIssue(selectedIssue);
                  setSelectedIssue(null);
                }}
              >
                이슈 무시
              </button>
              <button
                style={btnStyle('warning')}
                onClick={() => setSelectedIssue(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 정제 전후 데이터 비교 테이블 */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={subHeadingStyle}>정제 전후 데이터 비교</h3>
        <RefinementTable products={products} showExampleData={totalProducts === 0} />
      </div>
    </>
  );
};

export default RefinementOverview;
