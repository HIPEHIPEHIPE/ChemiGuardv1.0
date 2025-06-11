// src/components/DataRefining/ExcelStyleDataGrid.tsx
import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import { 
  Edit3, 
  Check, 
  X, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  Save,
  Zap,
  Filter,
  Search,
  Database,
  Trash2
} from 'lucide-react';
import { 
  ProductWithIngredients, 
  RefinementIssue,
  getProductsForRefinement,
  updateIngredient,
  applyAutoRefinement 
} from '../../api/dataRefinement';
import { debugDatabaseState, cleanupDatabase, cleanupEmptyProducts } from '../../utils/debugDatabase';
import { ProcessingStep } from '../../types/processingTypes';

// 스타일 정의
const gridContainerStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  padding: '20px',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 20px',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
};

const headerCellStyle: CSSProperties = {
  padding: '12px 8px',
  backgroundColor: '#f8fafc',
  borderRight: '1px solid #e2e8f0',
  borderBottom: '2px solid #e2e8f0',
  fontWeight: '600',
  color: '#475569',
  textAlign: 'left',
  position: 'sticky',
  top: 0,
  zIndex: 10,
};

const cellStyle = (hasIssue?: boolean, isEditing?: boolean): CSSProperties => ({
  padding: '8px',
  borderRight: '1px solid #e2e8f0',
  borderBottom: '1px solid #e2e8f0',
  backgroundColor: hasIssue ? '#fef3c7' : (isEditing ? '#dbeafe' : 'white'),
  border: isEditing ? '2px solid #3b82f6' : undefined,
  position: 'relative',
  minHeight: '40px',
  verticalAlign: 'top',
});

const productHeaderCellStyle: CSSProperties = {
  ...cellStyle(),
  backgroundColor: '#f1f5f9',
  fontWeight: '600',
  color: '#334155',
  borderLeft: '3px solid #3b82f6',
};

const inputStyle: CSSProperties = {
  width: '100%',
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  padding: '4px',
  fontSize: '14px',
};

const issueIndicatorStyle = (type: 'error' | 'warning' | 'suggestion'): CSSProperties => {
  const colors = {
    error: '#ef4444',
    warning: '#f59e0b', 
    suggestion: '#3b82f6',
  };
  
  return {
    position: 'absolute',
    top: '2px',
    right: '2px',
    width: '0',
    height: '0',
    borderLeft: '8px solid transparent',
    borderTop: `8px solid ${colors[type]}`,
  };
};

const buttonStyle = (variant: 'primary' | 'secondary' | 'success' | 'danger' | 'auto'): CSSProperties => {
  const variants = {
    primary: { bg: '#3b82f6', hover: '#2563eb', text: 'white' },
    secondary: { bg: '#6b7280', hover: '#4b5563', text: 'white' },
    success: { bg: '#10b981', hover: '#059669', text: 'white' },
    danger: { bg: '#ef4444', hover: '#dc2626', text: 'white' },
    auto: { bg: '#8b5cf6', hover: '#7c3aed', text: 'white' },
  };
  
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: variants[variant].bg,
    color: variants[variant].text,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };
};

interface EditingCell {
  productId: string;
  ingredientId: string;
  field: string;
  value: string;
}

interface ExcelStyleDataGridProps {
  onRefresh?: () => void;
  step?: ProcessingStep;
}

const ExcelStyleDataGrid: React.FC<ExcelStyleDataGridProps> = ({ onRefresh, step }) => {
  const [products, setProducts] = useState<ProductWithIngredients[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIssues, setFilterIssues] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 데이터 로드
  useEffect(() => {
    loadProducts();
  }, []);

  // 편집 모드일 때 input에 포커스
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // 전체 데이터를 가져오도록 수정 (limit을 더 크게 설정)
      const result = await getProductsForRefinement(1000, 0, ['collected', 'refining', 'completed']);
      if (result.data) {
        console.log(`📈 로드된 데이터: ${result.data.length}개 제품, 총 ${result.data.reduce((sum, p) => sum + p.ingredients.length, 0)}개 성분`);
        setProducts(result.data);
      } else {
        console.warn('⚠️ 데이터 로드 결과가 비어있습니다');
        setProducts([]);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 제품 목록
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.ingredients.some(ing => 
        ing.main_ingredient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ing.cas_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const hasIssues = product.ingredients.some(ing => ing.issues && ing.issues.length > 0);
    const matchesFilter = !filterIssues || hasIssues;
    
    return matchesSearch && matchesFilter;
  });

  // 셀 편집 시작
  const startEditing = (productId: string, ingredientId: string, field: string, currentValue: string) => {
    setEditingCell({
      productId,
      ingredientId,
      field,
      value: currentValue || '',
    });
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingCell(null);
  };

  // 편집 저장
  const saveEditing = async () => {
    if (!editingCell) return;
    
    try {
      const updates = { [editingCell.field]: editingCell.value };
      const result = await updateIngredient(editingCell.ingredientId, updates);
      
      if (result.data) {
        // 로컬 상태 업데이트
        setProducts(prev => prev.map(product => ({
          ...product,
          ingredients: product.ingredients.map(ingredient => 
            ingredient.ingredient_id === editingCell.ingredientId
              ? { ...ingredient, [editingCell.field]: editingCell.value }
              : ingredient
          )
        })));
        
        setEditingCell(null);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error('필드 업데이트 실패:', error);
      alert('업데이트 실패: ' + error);
    }
  };

  // 자동 수정
  const handleAutoFix = async (ingredientId: string, field: string) => {
    const ingredient = products
      .flatMap(p => p.ingredients)
      .find(ing => ing.ingredient_id === ingredientId);
    
    if (!ingredient?.issues) return;
    
    const fieldIssues = ingredient.issues.filter(issue => 
      issue.field === field && issue.auto_fixable
    );
    
    if (fieldIssues.length === 0) return;
    
    try {
      const result = await applyAutoRefinement(ingredientId, fieldIssues);
      if (result.success) {
        loadProducts();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error('자동 수정 실패:', error);
      alert('자동 수정 실패: ' + error);
    }
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingCell) return;
    
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // 이슈 정보 가져오기
  const getFieldIssues = (ingredient: any, field: string): RefinementIssue[] => {
    return ingredient.issues?.filter((issue: RefinementIssue) => issue.field === field) || [];
  };

  // 이슈가 있는 셀 렌더링
  const renderCell = (
    productId: string,
    ingredient: any,
    field: string,
    value: string | number | null,
    displayValue?: string
  ) => {
    const issues = getFieldIssues(ingredient, field);
    const hasIssue = issues.length > 0;
    const isEditing = editingCell?.ingredientId === ingredient.ingredient_id && editingCell?.field === field;
    const hasAutoFix = issues.some(issue => issue.auto_fixable);
    
    return (
      <td 
        key={`${ingredient.ingredient_id}-${field}`}
        style={cellStyle(hasIssue, isEditing)}
        onClick={() => !isEditing && startEditing(productId, ingredient.ingredient_id, field, String(value || ''))}
      >
        {/* 이슈 인디케이터 */}
        {hasIssue && issues.map(issue => (
          <div 
            key={issue.id}
            style={issueIndicatorStyle(issue.type)}
            title={`${issue.title}: ${issue.description}`}
          />
        ))}
        
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              ref={inputRef}
              type="text"
              value={editingCell?.value || ''}
              onChange={(e) => setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
            />
            <button onClick={saveEditing} style={buttonStyle('success')}>
              <Check size={12} />
            </button>
            <button onClick={cancelEditing} style={buttonStyle('secondary')}>
              <X size={12} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ flex: 1 }}>
              {displayValue || value || ''}
            </span>
            {hasAutoFix && (
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleAutoFix(ingredient.ingredient_id, field); 
                }}
                style={buttonStyle('auto')}
                title="자동 수정"
              >
                <Zap size={12} />
              </button>
            )}
          </div>
        )}
        
        {/* 이슈 툴팁 */}
        {hasIssue && (
          <div style={{ 
            fontSize: '11px', 
            color: '#dc2626', 
            marginTop: '2px',
            display: isEditing ? 'none' : 'block'
          }}>
            {issues.map(issue => issue.title).join(', ')}
          </div>
        )}
      </td>
    );
  };

  if (loading) {
    return (
      <div style={gridContainerStyle}>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: '16px' }}>전체 데이터를 불러오는 중...</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            최대 1000개 제품을 로드하고 있습니다.
          </div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우 처리
  if (products.length === 0) {
    return (
      <div style={gridContainerStyle}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            데이터 정제 - 엑셀 스타일 편집기
          </h3>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ 
            padding: '24px', 
            backgroundColor: '#fef3c7', 
            borderRadius: '12px', 
            border: '1px solid #f59e0b',
            marginBottom: '20px',
            display: 'inline-block'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
              📄 정제할 데이터가 없습니다
            </div>
            <div style={{ color: '#92400e', fontSize: '14px' }}>
              데이터 획득 페이지에서 먼저 데이터를 수집하거나<br/>
              테스트 데이터를 업로드해주세요.
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <button onClick={onRefresh || loadProducts} style={{
              ...buttonStyle('primary'),
              padding: '12px 24px',
              fontSize: '16px'
            }}>
              <RefreshCw size={16} />
              데이터 새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={gridContainerStyle}>
      {/* 헤더 */}
      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
          데이터 정제 - 엑셀 스타일 편집기
        </h3>
        <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
          셀을 클릭하여 편집하거나 ⚡ 버튼으로 자동 수정할 수 있습니다
        </p>
      </div>

      {/* 도구 모음 */}
      <div style={toolbarStyle}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input
              type="text"
              placeholder="제품명, 성분명, CAS 번호 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: '32px',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                width: '250px',
              }}
            />
          </div>
          
          <button
            onClick={() => setFilterIssues(!filterIssues)}
            style={{
              ...buttonStyle(filterIssues ? 'primary' : 'secondary'),
              padding: '8px 12px',
            }}
          >
            <Filter size={14} />
            {filterIssues ? '이슈만 표시' : '전체 표시'}
          </button>
          
          <button
            onClick={async () => {
              console.log('🔍 데이터베이스 상태 분석 시작...');
              const result = await debugDatabaseState();
              if (result) {
                alert(`데이터베이스 상태:\n\n` +
                  `전체 제품: ${result.totalProducts}개\n` +
                  `전체 성분: ${result.totalIngredients}개\n` +
                  `성분 있는 제품: ${result.productsWithIngredients}개\n` +
                  `성분 없는 제품: ${result.productsWithoutIngredients}개\n` +
                  `고아 성분: ${result.orphanIngredients}개\n\n` +
                  `상세 정보는 콘솔을 확인하세요.`);
              }
            }}
            style={{
              ...buttonStyle('auto'),
              padding: '8px 12px',
            }}
          >
            <Database size={14} />
            DB 분석
          </button>
          
          <button
            onClick={async () => {
              if (window.confirm('데이터베이스를 정리하시겠습니까?\n\n- 고아 성분 제거\n- 빈 제품 확인\n\n이 작업은 되돌릴 수 없습니다.')) {
                console.log('🧹 데이터베이스 정리 시작...');
                const result = await cleanupDatabase();
                if (result) {
                  alert(`데이터베이스 정리 완료:\n\n` +
                    `제거된 고아 성분: ${result.orphanIngredientsRemoved}개\n` +
                    `발견된 빈 제품: ${result.emptyProductsFound}개\n\n` +
                    `데이터를 새로고침합니다.`);
                  loadProducts();
                }
              }
            }}
            style={{
              ...buttonStyle('danger'),
              padding: '8px 12px',
            }}
          >
            <Trash2 size={14} />
            DB 정리
          </button>
        </div>
        
        <button onClick={onRefresh || loadProducts} style={buttonStyle('secondary')}>
          <RefreshCw size={14} />
          새로고침
        </button>
      </div>

      {/* 테이블 */}
      <div style={{ overflowX: 'auto', maxHeight: '70vh', overflowY: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, minWidth: '200px' }}>제품명</th>
              <th style={{ ...headerCellStyle, minWidth: '200px' }}>성분명</th>
              <th style={{ ...headerCellStyle, minWidth: '120px' }}>CAS 번호</th>
              <th style={{ ...headerCellStyle, minWidth: '80px' }}>함량 (%)</th>
              <th style={{ ...headerCellStyle, minWidth: '150px' }}>화학식</th>
              <th style={{ ...headerCellStyle, minWidth: '100px' }}>상태</th>
              <th style={{ ...headerCellStyle, minWidth: '80px' }}>이슈</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => 
              product.ingredients.map((ingredient, idx) => (
                <tr key={`${product.product_id}-${ingredient.ingredient_id}`}>
                  {/* 제품명 (첫 번째 성분에서만 표시) */}
                  {idx === 0 && (
                    <td 
                      style={{
                        ...productHeaderCellStyle,
                        ...(product.ingredients.length > 1 && { 
                          borderBottom: `${product.ingredients.length}px solid #e2e8f0` 
                        })
                      }}
                      rowSpan={product.ingredients.length}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {product.product_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {product.ingredients.length}개 성분
                      </div>
                    </td>
                  )}
                  
                  {/* 성분명 */}
                  {renderCell(
                    product.product_id,
                    ingredient,
                    'main_ingredient',
                    ingredient.main_ingredient
                  )}
                  
                  {/* CAS 번호 */}
                  {renderCell(
                    product.product_id,
                    ingredient,
                    'cas_number',
                    ingredient.cas_number || null
                  )}
                  
                  {/* 함량 */}
                  {renderCell(
                    product.product_id,
                    ingredient,
                    'content_percentage',
                    ingredient.content_percentage ?? null,
                    ingredient.content_percentage ? `${ingredient.content_percentage}%` : ''
                  )}
                  
                  {/* 화학식 */}
                  {renderCell(
                    product.product_id,
                    ingredient,
                    'chemical_formula',
                    ingredient.chemical_formula || null
                  )}
                  
                  {/* 상태 */}
                  <td style={cellStyle()}>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500',
                      textAlign: 'center',
                      backgroundColor: ingredient.issues && ingredient.issues.length > 0 ? '#fef3c7' : '#dcfce7',
                      color: ingredient.issues && ingredient.issues.length > 0 ? '#92400e' : '#166534',
                    }}>
                      {ingredient.issues && ingredient.issues.length > 0 ? '정제 필요' : '완료'}
                    </div>
                  </td>
                  
                  {/* 이슈 개수 */}
                  <td style={cellStyle()}>
                    <div style={{ textAlign: 'center', fontWeight: '600' }}>
                      {ingredient.issues?.length || 0}
                      {ingredient.issues && ingredient.issues.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>
                          {ingredient.issues.filter(i => i.type === 'error').length > 0 && '🔴 '}
                          {ingredient.issues.filter(i => i.type === 'warning').length > 0 && '🟡 '}
                          {ingredient.issues.filter(i => i.type === 'suggestion').length > 0 && '🔵 '}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 푸터 정보 */}
      <div style={{ padding: '12px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6b7280' }}>
          <div>
            총 {filteredProducts.length}개 제품, {filteredProducts.reduce((sum, p) => sum + p.ingredients.length, 0)}개 성분
            {products.length !== filteredProducts.length && (
              <span style={{ marginLeft: '8px', color: '#059669' }}>(전체 {products.length}개 제품에서 필터링됨)</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>🔴 오류 🟡 경고 🔵 제안 ⚡ 자동수정가능</div>
            <div>
              이슈 있는 성분: {filteredProducts.reduce((sum, p) => sum + p.ingredients.filter(ing => ing.issues && ing.issues.length > 0).length, 0)}개
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelStyleDataGrid;