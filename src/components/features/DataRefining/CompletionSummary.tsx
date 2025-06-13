// src/components/DataRefining/CompletionSummary.tsx
import React, { CSSProperties } from 'react';
import { 
  Trophy, 
  Download, 
  Share, 
  CheckCircle,
  BarChart3,
  FileText,
  Calendar,
  Users,
  Database,
  Shield,
  Target
} from 'lucide-react';

interface CompletionSummaryProps {
  processingStats: {
    totalProducts: number;
    totalIngredients: number;
    issuesResolved: number;
    standardizationApplied: number;
    anonymizationApplied: number;
    processingTime: string;
  };
  onExport: (format: 'csv' | 'json' | 'excel') => void;
  onShare: () => void;
}

const summaryContainerStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  marginBottom: '20px',
};

const headerStyle: CSSProperties = {
  padding: '24px',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#f0fdf4',
  borderRadius: '12px 12px 0 0',
  textAlign: 'center',
};

const contentStyle: CSSProperties = {
  padding: '24px',
};

const buttonStyle = (variant: 'primary' | 'secondary' | 'success'): CSSProperties => {
  const variants = {
    primary: { bg: '#3b82f6', hover: '#2563eb', text: 'white' },
    secondary: { bg: '#6b7280', hover: '#4b5563', text: 'white' },
    success: { bg: '#10b981', hover: '#059669', text: 'white' },
  };
  
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: variants[variant].bg,
    color: variants[variant].text,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };
};

const statCardStyle: CSSProperties = {
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  textAlign: 'center',
  backgroundColor: '#fafafa',
};

const CompletionSummary: React.FC<CompletionSummaryProps> = ({
  processingStats,
  onExport,
  onShare
}) => {
  const completionRate = Math.round(
    ((processingStats.issuesResolved + processingStats.standardizationApplied + processingStats.anonymizationApplied) / 
     (processingStats.totalIngredients * 3)) * 100
  );

  return (
    <div style={summaryContainerStyle}>
      {/* 성공 헤더 */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Trophy size={40} style={{ color: 'white' }} />
          </div>
        </div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold', color: '#14532d' }}>
          데이터 처리 완료!
        </h2>
        <p style={{ margin: 0, color: '#166534', fontSize: '16px' }}>
          모든 데이터 처리 단계가 성공적으로 완료되었습니다
        </p>
      </div>

      <div style={contentStyle}>
        {/* 처리 결과 통계 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            처리 결과 요약
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div style={{
              ...statCardStyle,
              backgroundColor: '#f0f9ff',
              borderColor: '#0ea5e9',
            }}>
              <Database size={24} style={{ color: '#0369a1', marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c4a6e', marginBottom: '4px' }}>
                {processingStats.totalProducts}
              </div>
              <div style={{ fontSize: '14px', color: '#0369a1' }}>처리된 제품</div>
            </div>

            <div style={{
              ...statCardStyle,
              backgroundColor: '#fef3c7',
              borderColor: '#f59e0b',
            }}>
              <Target size={24} style={{ color: '#d97706', marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>
                {processingStats.totalIngredients}
              </div>
              <div style={{ fontSize: '14px', color: '#d97706' }}>처리된 성분</div>
            </div>

            <div style={{
              ...statCardStyle,
              backgroundColor: '#f0fdf4',
              borderColor: '#22c55e',
            }}>
              <CheckCircle size={24} style={{ color: '#16a34a', marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#14532d', marginBottom: '4px' }}>
                {processingStats.issuesResolved}
              </div>
              <div style={{ fontSize: '14px', color: '#16a34a' }}>해결된 이슈</div>
            </div>

            <div style={{
              ...statCardStyle,
              backgroundColor: '#fdf2f8',
              borderColor: '#ec4899',
            }}>
              <Shield size={24} style={{ color: '#be185d', marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#831843', marginBottom: '4px' }}>
                {completionRate}%
              </div>
              <div style={{ fontSize: '14px', color: '#be185d' }}>완성도</div>
            </div>
          </div>
        </div>

        {/* 단계별 처리 현황 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            단계별 처리 현황
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #22c55e',
            }}>
              <CheckCircle size={20} style={{ color: '#16a34a', marginRight: '12px' }} />
              <div>
                <div style={{ fontWeight: '600', color: '#14532d' }}>1단계: 데이터 정제</div>
                <div style={{ fontSize: '14px', color: '#166534' }}>
                  {processingStats.issuesResolved}개 이슈 해결 완료
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #22c55e',
            }}>
              <CheckCircle size={20} style={{ color: '#16a34a', marginRight: '12px' }} />
              <div>
                <div style={{ fontWeight: '600', color: '#14532d' }}>2단계: 데이터 표준화</div>
                <div style={{ fontSize: '14px', color: '#166534' }}>
                  {processingStats.standardizationApplied}개 규칙 적용 완료
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #22c55e',
            }}>
              <CheckCircle size={20} style={{ color: '#16a34a', marginRight: '12px' }} />
              <div>
                <div style={{ fontWeight: '600', color: '#14532d' }}>3단계: 데이터 비식별화</div>
                <div style={{ fontSize: '14px', color: '#166534' }}>
                  {processingStats.anonymizationApplied}개 보안 규칙 적용 완료
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 처리 정보 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            처리 정보
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
          }}>
            <div style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Calendar size={16} style={{ color: '#6b7280' }} />
                <span style={{ fontWeight: '600', color: '#374151' }}>처리 시간</span>
              </div>
              <div style={{ color: '#6b7280' }}>{processingStats.processingTime}</div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Users size={16} style={{ color: '#6b7280' }} />
                <span style={{ fontWeight: '600', color: '#374151' }}>처리자</span>
              </div>
              <div style={{ color: '#6b7280' }}>시스템 자동 처리</div>
            </div>
          </div>
        </div>

        {/* 내보내기 및 공유 옵션 */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #0ea5e9',
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#0c4a6e' }}>
            결과 내보내기 및 공유
          </h4>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button onClick={() => onExport('excel')} style={buttonStyle('primary')}>
              <FileText size={16} />
              Excel 다운로드
            </button>
            
            <button onClick={() => onExport('csv')} style={buttonStyle('secondary')}>
              <Download size={16} />
              CSV 다운로드
            </button>
            
            <button onClick={() => onExport('json')} style={buttonStyle('secondary')}>
              <Database size={16} />
              JSON 다운로드
            </button>
            
            <button onClick={onShare} style={buttonStyle('success')}>
              <Share size={16} />
              결과 공유
            </button>
          </div>
        </div>

        {/* 다음 단계 안내 */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          border: '1px solid #f59e0b',
        }}>
          <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
            💡 다음 단계 권장사항
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', color: '#92400e', fontSize: '14px' }}>
            <li>처리된 데이터를 안전한 장소에 백업하세요</li>
            <li>정기적인 데이터 품질 검토를 진행하세요</li>
            <li>필요시 추가 정제 작업을 수행할 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CompletionSummary;