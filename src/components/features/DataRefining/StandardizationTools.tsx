// src/components/DataRefining/StandardizationTools.tsx
import React, { useState, CSSProperties } from 'react';
import { 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  Eye,
  Save,
  AlertTriangle,
  CheckCircle,
  Merge,
  Type,
  Hash
} from 'lucide-react';
import { StandardizationRule } from '../../../types/processing';

interface StandardizationToolsProps {
  onApplyStandardization: (rules: StandardizationRule[]) => Promise<void>;
  onPreview: (rules: StandardizationRule[]) => void;
}

const toolsContainerStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  marginBottom: '20px',
};

const headerStyle: CSSProperties = {
  padding: '20px 24px',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  borderRadius: '12px 12px 0 0',
};

const contentStyle: CSSProperties = {
  padding: '24px',
};

const buttonStyle = (variant: 'primary' | 'secondary' | 'success' | 'warning'): CSSProperties => {
  const variants = {
    primary: { bg: '#3b82f6', hover: '#2563eb', text: 'white' },
    secondary: { bg: '#6b7280', hover: '#4b5563', text: 'white' },
    success: { bg: '#10b981', hover: '#059669', text: 'white' },
    warning: { bg: '#f59e0b', hover: '#d97706', text: 'white' },
  };
  
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
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

const ruleCardStyle = (enabled: boolean): CSSProperties => ({
  padding: '16px',
  border: `1px solid ${enabled ? '#3b82f6' : '#e5e7eb'}`,
  borderRadius: '8px',
  backgroundColor: enabled ? '#f0f9ff' : '#f9fafb',
  marginBottom: '12px',
});

const StandardizationTools: React.FC<StandardizationToolsProps> = ({
  onApplyStandardization,
  onPreview
}) => {
  const [processing, setProcessing] = useState(false);
  const [rules, setRules] = useState<StandardizationRule[]>([
    {
      id: 'ingredient-names',
      field: 'main_ingredient',
      type: 'merge',
      description: '성분명 동의어 통합',
      from: ['Sodium Chloride', 'NaCl', '소금', '염화나트륨'],
      to: '염화나트륨 (Sodium Chloride)',
      enabled: true,
    },
    {
      id: 'cas-format',
      field: 'cas_number',
      type: 'format',
      description: 'CAS 번호 형식 통일',
      from: 'various',
      to: 'XXX-XX-X 형식',
      enabled: true,
    },
    {
      id: 'percentage-normalize',
      field: 'content_percentage',
      type: 'normalize',
      description: '함량 표기 정규화',
      from: ['10%', '10 %', '10percent', '0.1'],
      to: '10.0%',
      enabled: true,
    },
    {
      id: 'formula-standard',
      field: 'chemical_formula',
      type: 'format',
      description: '화학식 IUPAC 표준화',
      from: 'various',
      to: 'IUPAC 표준 형식',
      enabled: false,
    },
  ]);

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleApply = async () => {
    setProcessing(true);
    try {
      const enabledRules = rules.filter(rule => rule.enabled);
      await onApplyStandardization(enabledRules);
    } catch (error) {
      console.error('표준화 적용 실패:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePreview = () => {
    const enabledRules = rules.filter(rule => rule.enabled);
    onPreview(enabledRules);
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'merge': return <Merge size={16} />;
      case 'format': return <Type size={16} />;
      case 'normalize': return <Hash size={16} />;
      default: return <Settings size={16} />;
    }
  };

  const enabledRulesCount = rules.filter(rule => rule.enabled).length;

  return (
    <div style={toolsContainerStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              데이터 표준화 도구
            </h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              데이터 형식을 통일하고 표준 규칙을 적용합니다
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handlePreview} style={buttonStyle('secondary')}>
              <Eye size={16} />
              미리보기
            </button>
            <button 
              onClick={handleApply} 
              disabled={processing || enabledRulesCount === 0}
              style={{
                ...buttonStyle('primary'),
                opacity: processing || enabledRulesCount === 0 ? 0.6 : 1,
                cursor: processing || enabledRulesCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {processing ? <Pause size={16} /> : <Play size={16} />}
              {processing ? '처리 중...' : `표준화 적용 (${enabledRulesCount}개 규칙)`}
            </button>
          </div>
        </div>
      </div>

      <div style={contentStyle}>
        {/* 통계 정보 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #0ea5e9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Settings size={20} style={{ color: '#0369a1' }} />
              <span style={{ fontWeight: '600', color: '#0369a1' }}>활성 규칙</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c4a6e' }}>
              {enabledRulesCount}개
            </div>
          </div>
          
          <div style={{
            padding: '16px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #22c55e',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle size={20} style={{ color: '#16a34a' }} />
              <span style={{ fontWeight: '600', color: '#16a34a' }}>예상 개선</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#14532d' }}>
              ~85%
            </div>
          </div>
        </div>

        {/* 표준화 규칙 목록 */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
            표준화 규칙 설정
          </h4>
          
          {rules.map(rule => (
            <div key={rule.id} style={ruleCardStyle(rule.enabled)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {getRuleIcon(rule.type)}
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>
                      {rule.description}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#6b7280',
                    }}>
                      {rule.field}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                    {Array.isArray(rule.from) 
                      ? `변환 대상: ${rule.from.slice(0, 3).join(', ')}${rule.from.length > 3 ? ` 외 ${rule.from.length - 3}개` : ''}`
                      : `형식: ${rule.from}`
                    }
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#059669', fontWeight: '500' }}>
                    → {rule.to}
                  </div>
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleRule(rule.id)}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px', color: rule.enabled ? '#16a34a' : '#6b7280' }}>
                    {rule.enabled ? '활성' : '비활성'}
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* 주의사항 */}
        <div style={{
          padding: '16px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          border: '1px solid #f59e0b',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle size={20} style={{ color: '#d97706', marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                표준화 적용 전 주의사항
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', color: '#92400e', fontSize: '14px' }}>
                <li>표준화는 되돌릴 수 없는 작업입니다</li>
                <li>미리보기를 통해 결과를 확인한 후 적용하세요</li>
                <li>중요한 데이터는 백업을 권장합니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardizationTools;