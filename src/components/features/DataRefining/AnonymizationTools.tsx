// src/components/DataRefining/AnonymizationTools.tsx
import React, { useState, CSSProperties } from 'react';
import { 
  Shield, 
  Play, 
  Pause, 
  Eye,
  AlertTriangle,
  Lock,
  EyeOff,
  Hash,
  Trash2,
  BarChart3,
  Settings
} from 'lucide-react';
import { AnonymizationRule } from '../../../types/processing';

interface AnonymizationToolsProps {
  onApplyAnonymization: (rules: AnonymizationRule[]) => Promise<void>;
  onPreview: (rules: AnonymizationRule[]) => void;
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

const buttonStyle = (variant: 'primary' | 'secondary' | 'success' | 'danger'): CSSProperties => {
  const variants = {
    primary: { bg: '#3b82f6', hover: '#2563eb', text: 'white' },
    secondary: { bg: '#6b7280', hover: '#4b5563', text: 'white' },
    success: { bg: '#10b981', hover: '#059669', text: 'white' },
    danger: { bg: '#ef4444', hover: '#dc2626', text: 'white' },
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
  border: `1px solid ${enabled ? '#ef4444' : '#e5e7eb'}`,
  borderRadius: '8px',
  backgroundColor: enabled ? '#fef2f2' : '#f9fafb',
  marginBottom: '12px',
});

const AnonymizationTools: React.FC<AnonymizationToolsProps> = ({
  onApplyAnonymization,
  onPreview
}) => {
  const [processing, setProcessing] = useState(false);
  const [rules, setRules] = useState<AnonymizationRule[]>([
    {
      id: 'product-name-mask',
      field: 'product_name',
      type: 'mask',
      description: '제품명 마스킹',
      pattern: '제품명',
      replacement: 'PRODUCT_***',
      enabled: true,
    },
    {
      id: 'brand-remove',
      field: 'product_name',
      type: 'remove',
      description: '브랜드명 제거',
      pattern: '브랜드 정보',
      replacement: '',
      enabled: true,
    },
    {
      id: 'content-aggregate',
      field: 'content_percentage',
      type: 'aggregate',
      description: '함량 정보 구간화',
      pattern: '정확한 수치',
      replacement: '구간별 그룹',
      enabled: false,
    },
    {
      id: 'ingredient-pseudonymize',
      field: 'main_ingredient',
      type: 'pseudonymize',
      description: '성분명 가명화',
      pattern: '실제 성분명',
      replacement: 'ING_001, ING_002...',
      enabled: false,
    },
    {
      id: 'cas-remove',
      field: 'cas_number',
      type: 'remove',
      description: 'CAS 번호 제거',
      pattern: 'CAS 번호',
      replacement: '[제거됨]',
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
      await onApplyAnonymization(enabledRules);
    } catch (error) {
      console.error('비식별화 적용 실패:', error);
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
      case 'mask': return <EyeOff size={16} />;
      case 'remove': return <Trash2 size={16} />;
      case 'aggregate': return <BarChart3 size={16} />;
      case 'pseudonymize': return <Hash size={16} />;
      default: return <Shield size={16} />;
    }
  };

  const getRuleColor = (type: string) => {
    switch (type) {
      case 'mask': return '#f59e0b';
      case 'remove': return '#ef4444';
      case 'aggregate': return '#8b5cf6';
      case 'pseudonymize': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const enabledRulesCount = rules.filter(rule => rule.enabled).length;

  return (
    <div style={toolsContainerStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              데이터 비식별화 도구
            </h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              개인정보 보호를 위한 데이터 비식별화 처리를 수행합니다
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
                ...buttonStyle('danger'),
                opacity: processing || enabledRulesCount === 0 ? 0.6 : 1,
                cursor: processing || enabledRulesCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {processing ? <Pause size={16} /> : <Shield size={16} />}
              {processing ? '처리 중...' : `비식별화 적용 (${enabledRulesCount}개 규칙)`}
            </button>
          </div>
        </div>
      </div>

      <div style={contentStyle}>
        {/* 보안 레벨 표시 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #ef4444',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Shield size={20} style={{ color: '#dc2626' }} />
              <span style={{ fontWeight: '600', color: '#dc2626' }}>보안 규칙</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b' }}>
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
              <Lock size={20} style={{ color: '#16a34a' }} />
              <span style={{ fontWeight: '600', color: '#16a34a' }}>보호 수준</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#14532d' }}>
              {enabledRulesCount > 3 ? '높음' : enabledRulesCount > 1 ? '중간' : '낮음'}
            </div>
          </div>
        </div>

        {/* 비식별화 규칙 목록 */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
            비식별화 규칙 설정
          </h4>
          
          {rules.map(rule => (
            <div key={rule.id} style={ruleCardStyle(rule.enabled)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: getRuleColor(rule.type) }}>
                      {getRuleIcon(rule.type)}
                    </span>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>
                      {rule.description}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: getRuleColor(rule.type),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}>
                      {rule.type.toUpperCase()}
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
                  
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                    처리 대상: {rule.pattern}
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>
                    → {rule.replacement}
                  </div>
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleRule(rule.id)}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px', color: rule.enabled ? '#dc2626' : '#6b7280' }}>
                    {rule.enabled ? '활성' : '비활성'}
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* 보안 정책 안내 */}
        <div style={{
          padding: '16px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          border: '1px solid #f59e0b',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle size={20} style={{ color: '#d97706', marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                개인정보보호법 준수 안내
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', color: '#92400e', fontSize: '14px' }}>
                <li>비식별화 처리는 개인정보보호법에 따른 안전조치입니다</li>
                <li>처리된 데이터는 개인 식별이 불가능하도록 변환됩니다</li>
                <li>비식별화는 되돌릴 수 없는 작업이므로 신중히 적용하세요</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 비식별화 효과 예시 */}
        <div style={{
          padding: '16px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #0ea5e9',
        }}>
          <div style={{ fontWeight: '600', color: '#0c4a6e', marginBottom: '12px' }}>
            비식별화 적용 예시:
          </div>
          <div style={{ fontSize: '14px', color: '#0c4a6e' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: '500' }}>적용 전:</span> "ABC 브랜드 세정제 (에탄올 70%)"
            </div>
            <div>
              <span style={{ fontWeight: '500' }}>적용 후:</span> "PRODUCT_001 (ING_002 구간3)"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnonymizationTools;