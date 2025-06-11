import React, { useState, CSSProperties } from 'react';
import { ProductWithIngredients, RefinementStats } from '../../api/dataRefinement';
import PDFAutoExtraction from './PDFAutoExtraction';
import APIIntegration from './APIIntegration';
import { FileText, Database, CheckCircle, AlertTriangle, Settings, Zap } from 'lucide-react';

interface AutoProcessingProps {
  products: ProductWithIngredients[];
  stats: RefinementStats | null;
}

const sectionCardStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  marginBottom: '20px',
  padding: '24px'
};

const tabButtonStyle = (isActive: boolean): CSSProperties => ({
  padding: '12px 20px',
  border: '1px solid #e5e7eb',
  backgroundColor: isActive ? '#3b82f6' : 'white',
  color: isActive ? 'white' : '#374151',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '8px',
  marginRight: '8px',
  marginBottom: '8px',
  transition: 'all 0.2s'
});

const statCardStyle: CSSProperties = {
  padding: '16px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  textAlign: 'center'
};

const AutoProcessing: React.FC<AutoProcessingProps> = ({ products, stats }) => {
  const [activeTab, setActiveTab] = useState<'pdf-extraction' | 'api-integration' | 'auto-refinement'>('pdf-extraction');
  
  const allIssues = products.flatMap(product => 
    product.ingredients.flatMap(ingredient => 
      (ingredient.issues || []).map(issue => ({
        ...issue,
        productName: product.product_name,
        ingredientName: ingredient.main_ingredient,
        ingredientId: ingredient.ingredient_id
      }))
    )
  );

  const autoFixableCount = allIssues.filter(i => i.auto_fixable).length;

  const handleDataExtracted = (extractedData: any) => {
    console.log('추출된 데이터:', extractedData);
    // TODO: 추출된 데이터를 데이터베이스에 저장하는 로직 구현
    alert('데이터가 성공적으로 추출되었습니다! 데이터베이스 저장 기능을 구현하세요.');
  };

  const handleDataMapped = (mappedData: any) => {
    console.log('매핑된 API 데이터:', mappedData);
    // TODO: 매핑된 데이터를 데이터베이스에 저장하는 로직 구현
    alert('API 데이터가 성공적으로 매핑되었습니다! 데이터베이스 저장 기능을 구현하세요.');
  };

  const renderPDFExtraction = () => (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
          📄 MSDS PDF 자동 분석
        </h4>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          PDF 형식의 MSDS 문서를 업로드하면 Gemini AI가 자동으로 화학물질 정보를 추출합니다.
        </p>
      </div>
      
      <PDFAutoExtraction onDataExtracted={handleDataExtracted} />
    </div>
  );

  const renderAPIIntegration = () => (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
          🔗 Open API 연동
        </h4>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          안전보건공단 MSDS Open API를 활용하여 화학물질 정보를 자동으로 검색하고 매핑합니다.
        </p>
      </div>
      
      <APIIntegration onDataMapped={handleDataMapped} />
    </div>
  );

  const renderAutoRefinement = () => (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
          ⚡ 자동 정제 설정
        </h4>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          데이터 품질 규칙을 설정하고 자동으로 데이터를 정제합니다.
        </p>
      </div>

      <div style={{
        padding: '20px',
        backgroundColor: '#f0fdf4',
        borderRadius: '8px',
        border: '1px solid #16a34a',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <CheckCircle size={20} style={{ color: '#16a34a' }} />
          <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#14532d' }}>
            자동 수정 가능한 이슈
          </h5>
        </div>
        <div style={{ fontSize: '14px', color: '#14532d', lineHeight: '1.6' }}>
          <div>• CAS 번호 형식 정규화 (하이픈 추가/제거)</div>
          <div>• 화학물질명 표준화 (공백, 대소문자 정리)</div>
          <div>• 농도 단위 통일 (%로 변환)</div>
          <div>• 누락된 필수 필드 자동 채우기</div>
        </div>
      </div>

      <div style={{
        padding: '20px',
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        border: '1px solid #f59e0b',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <AlertTriangle size={20} style={{ color: '#d97706' }} />
          <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
            수동 검토 필요
          </h5>
        </div>
        <div style={{ fontSize: '14px', color: '#92400e', lineHeight: '1.6' }}>
          <div>• 중복 성분 병합 여부 판단</div>
          <div>• 불완전한 화학물질 정보</div>
          <div>• 비표준 형식의 데이터</div>
          <div>• GHS 분류 정보 검증</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a', marginBottom: '4px' }}>
            {autoFixableCount}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>자동 수정 가능</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b', marginBottom: '4px' }}>
            {allIssues.length - autoFixableCount}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>수동 검토 필요</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#6366f1', marginBottom: '4px' }}>
            {Math.round((autoFixableCount / Math.max(allIssues.length, 1)) * 100)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>자동화 비율</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button style={{
          padding: '12px 24px',
          backgroundColor: autoFixableCount > 0 ? '#16a34a' : '#9ca3af',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: autoFixableCount > 0 ? 'pointer' : 'not-allowed',
          fontSize: '16px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Zap size={16} />
          자동 정제 실행 ({autoFixableCount}건)
        </button>
        <button style={{
          padding: '12px 24px',
          backgroundColor: 'white',
          color: '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Settings size={16} />
          정제 규칙 설정
        </button>
      </div>
    </div>
  );

  return (
    <div style={sectionCardStyle}>
      {/* 탭 버튼 */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('pdf-extraction')}
          style={tabButtonStyle(activeTab === 'pdf-extraction')}
        >
          <FileText size={16} />
          PDF 자동 분석
        </button>
        <button
          onClick={() => setActiveTab('api-integration')}
          style={tabButtonStyle(activeTab === 'api-integration')}
        >
          <Database size={16} />
          API 연동
        </button>
        <button
          onClick={() => setActiveTab('auto-refinement')}
          style={tabButtonStyle(activeTab === 'auto-refinement')}
        >
          <Zap size={16} />
          자동 정제
        </button>
      </div>

      {/* 탭 내용 */}
      {activeTab === 'pdf-extraction' && renderPDFExtraction()}
      {activeTab === 'api-integration' && renderAPIIntegration()}
      {activeTab === 'auto-refinement' && renderAutoRefinement()}
    </div>
  );
};

export default AutoProcessing;