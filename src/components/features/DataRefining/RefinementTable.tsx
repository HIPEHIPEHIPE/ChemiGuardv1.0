import React, { CSSProperties } from 'react';
import { ProductWithIngredients } from '../../../api/dataRefinement';

interface RefinementTableProps {
  products: ProductWithIngredients[];
  showExampleData?: boolean;
}

const tableContainerStyle: CSSProperties = {
  overflowX: 'auto',
  backgroundColor: '#fff',
  borderRadius: 8,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  padding: '20px',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '12px 15px',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  fontWeight: 600,
  fontSize: '14px',
  color: '#374151',
};

const tdStyle: CSSProperties = {
  padding: '12px 8px',
  fontSize: 14,
  color: '#374151',
  borderBottom: '1px solid #e5e7eb',
  textAlign: 'left',
};

const statusBadgeStyle = (status: 'complete' | 'progress' | 'normal'): CSSProperties => {
  let base: CSSProperties = {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  };
  if (status === 'complete') return { ...base, backgroundColor: '#d1fae5', color: '#065f46' };
  if (status === 'progress') return { ...base, backgroundColor: '#fee2e2', color: '#991b1b' };
  return { ...base, backgroundColor: '#e5e7eb', color: '#4b5563' };
};

const emptyMessageStyle: CSSProperties = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#6b7280',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  fontSize: '14px',
};

const RefinementTable: React.FC<RefinementTableProps> = ({ products, showExampleData = false }) => {
  // 실제 데이터가 있는 경우 처리
  const realDataRows = products.flatMap(product => 
    product.ingredients.map(ingredient => ({
      productName: product.product_name,
      ingredientName: ingredient.main_ingredient,
      casNumber: ingredient.cas_number || '미입력',
      percentage: ingredient.content_percentage ? `${ingredient.content_percentage}%` : '미입력',
      hasIssues: ingredient.issues && ingredient.issues.length > 0,
      issueCount: ingredient.issues?.length || 0,
      key: `${product.product_id}-${ingredient.ingredient_id}`
    }))
  );

  // 데이터가 없을 때만 예시 데이터 표시
  const shouldShowExample = realDataRows.length === 0 || showExampleData;

  return (
    <div style={tableContainerStyle}>
      {!shouldShowExample ? (
        <>
          {/* 실제 데이터 테이블 */}
          <div style={{ marginBottom: '10px', fontSize: '14px', color: '#6b7280' }}>
            총 {realDataRows.length}개 성분 데이터 (최대 10개 표시)
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>제품명</th>
                <th style={thStyle}>성분명</th>
                <th style={thStyle}>CAS 번호</th>
                <th style={thStyle}>함량</th>
                <th style={thStyle}>품질 상태</th>
                <th style={thStyle}>이슈 수</th>
              </tr>
            </thead>
            <tbody>
              {realDataRows.slice(0, 10).map(row => (
                <tr key={row.key}>
                  <td style={tdStyle}>{row.productName}</td>
                  <td style={tdStyle}>{row.ingredientName}</td>
                  <td style={tdStyle}>{row.casNumber}</td>
                  <td style={tdStyle}>{row.percentage}</td>
                  <td style={tdStyle}>
                    <span style={statusBadgeStyle(row.hasIssues ? 'progress' : 'complete')}>
                      {row.hasIssues ? '정제 필요' : '정제 완료'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {row.issueCount > 0 ? (
                      <span style={{ color: '#dc2626', fontWeight: '600' }}>{row.issueCount}건</span>
                    ) : (
                      <span style={{ color: '#059669' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {realDataRows.length > 10 && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
              더 많은 데이터가 있습니다. 전체 목록은 데이터 관리 페이지에서 확인하세요.
            </div>
          )}
        </>
      ) : (
        <>
          {/* 데이터 없음 메시지 */}
          <div style={emptyMessageStyle}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>표시할 데이터가 없습니다</div>
            <div>데이터 수집 페이지에서 제품 정보를 먼저 등록해주세요.</div>
          </div>
          
          {/* 예시 데이터 (선택적 표시) */}
          {showExampleData && (
            <>
              <div style={{ marginTop: '20px', marginBottom: '10px', fontSize: '14px', color: '#6b7280' }}>
                예시 데이터 (실제 데이터가 로드되면 자동으로 교체됩니다):
              </div>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>제품명</th>
                    <th style={thStyle}>성분명</th>
                    <th style={thStyle}>CAS 번호</th>
                    <th style={thStyle}>함량</th>
                    <th style={thStyle}>품질 상태</th>
                    <th style={thStyle}>이슈 수</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{...tdStyle, opacity: 0.7}}>클린원시 주방세정제 (예시)</td>
                    <td style={{...tdStyle, opacity: 0.7}}>소듐라우릴황산염</td>
                    <td style={{...tdStyle, opacity: 0.7}}>151-21-3</td>
                    <td style={{...tdStyle, opacity: 0.7}}>15-20%</td>
                    <td style={{...tdStyle, opacity: 0.7}}>
                      <span style={statusBadgeStyle('complete')}>정제완료</span>
                    </td>
                    <td style={{...tdStyle, opacity: 0.7}}>
                      <span style={{ color: '#059669' }}>-</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{...tdStyle, opacity: 0.7}}>클린원시 주방세정제 (예시)</td>
                    <td style={{...tdStyle, opacity: 0.7}}>에탄올</td>
                    <td style={{...tdStyle, opacity: 0.7}}>64-17-5</td>
                    <td style={{...tdStyle, opacity: 0.7}}>5-10%</td>
                    <td style={{...tdStyle, opacity: 0.7}}>
                      <span style={statusBadgeStyle('progress')}>정제필요</span>
                    </td>
                    <td style={{...tdStyle, opacity: 0.7}}>
                      <span style={{ color: '#dc2626', fontWeight: '600' }}>2건</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default RefinementTable;
