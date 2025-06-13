// src/components/DataRefining/ValidationExamples.tsx
import React from 'react';
import { validateIngredientData, VALIDATION_RULES } from '../../../utils/dataValidation';

const ValidationExamples: React.FC = () => {
  // 예시 데이터
  const exampleProducts = [
    {
      productName: '예시 주방세정제',
      ingredients: [
        {
          ingredient_id: '1',
          main_ingredient: '소듐라우릴황산염',
          cas_number: '151-21-3',
          content_percentage: '15-20%'
        },
        {
          ingredient_id: '2',
          main_ingredient: '에탄올',
          cas_number: '64175', // 형식 오류 (64-17-5가 정확)
          content_percentage: '5-10%'
        },
        {
          ingredient_id: '3',
          main_ingredient: '', // 성분명 누락
          cas_number: '7732-18-5',
          content_percentage: '60-70%'
        }
      ]
    }
  ];

  const issues = validateIngredientData(
    exampleProducts[0].productName,
    exampleProducts[0].ingredients
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔍 데이터 검증 시스템 설명</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>📋 검증 규칙 분류</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {/* 오류 */}
          <div style={{ 
            border: '2px solid #ef4444', 
            borderRadius: '8px', 
            padding: '15px',
            background: '#fee2e2'
          }}>
            <h4 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>❌ 오류 (Error)</h4>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}>
              <strong>반드시 수정해야 하는 문제들</strong>
            </p>
            <ul style={{ fontSize: '12px', margin: 0, paddingLeft: '20px' }}>
              <li>CAS 번호 형식 오류</li>
              <li>성분명 누락</li>
              <li>함량 합계 100% 초과</li>
              <li>음수 함량</li>
            </ul>
          </div>

          {/* 경고 */}
          <div style={{ 
            border: '2px solid #f59e0b', 
            borderRadius: '8px', 
            padding: '15px',
            background: '#fef3c7'
          }}>
            <h4 style={{ color: '#d97706', margin: '0 0 10px 0' }}>⚠️ 경고 (Warning)</h4>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}>
              <strong>수정을 권장하는 문제들</strong>
            </p>
            <ul style={{ fontSize: '12px', margin: 0, paddingLeft: '20px' }}>
              <li>유효하지 않은 CAS 번호</li>
              <li>CAS-성분명 불일치</li>
              <li>위험물질 고농도</li>
              <li>함량 합계 불균형</li>
            </ul>
          </div>

          {/* 제안 */}
          <div style={{ 
            border: '2px solid #10b981', 
            borderRadius: '8px', 
            padding: '15px',
            background: '#d1fae5'
          }}>
            <h4 style={{ color: '#059669', margin: '0 0 10px 0' }}>✅ 제안 (Suggestion)</h4>
            <p style={{ fontSize: '14px', marginBottom: '10px' }}>
              <strong>개선할 수 있는 부분들</strong>
            </p>
            <ul style={{ fontSize: '12px', margin: 0, paddingLeft: '20px' }}>
              <li>CAS 번호 추가</li>
              <li>성분명 표준화</li>
              <li>유해성 정보 추가</li>
              <li>함량 범위 구체화</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>🧪 검증 로직 예시</h3>
        <div style={{ 
          background: '#f8f9fa', 
          border: '1px solid #e9ecef', 
          borderRadius: '8px', 
          padding: '20px' 
        }}>
          <h4>입력 데이터:</h4>
          <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
{JSON.stringify(exampleProducts[0], null, 2)}
          </pre>
        </div>
      </div>

      <div>
        <h3>📊 검증 결과</h3>
        <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: '8px', padding: '15px' }}>
          <p><strong>발견된 이슈: {issues.length}건</strong></p>
          
          {issues.map((issue, index) => (
            <div key={index} style={{
              margin: '10px 0',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              borderLeft: `4px solid ${
                issue.type === 'error' ? '#ef4444' : 
                issue.type === 'warning' ? '#f59e0b' : '#10b981'
              }`
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : '✅'} {issue.title}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                {issue.description}
              </div>
              <div style={{ fontSize: '12px' }}>
                <span style={{ color: '#999' }}>필드:</span> {issue.field} | 
                <span style={{ color: '#999' }}> 원본값:</span> "{issue.original_value}" | 
                <span style={{ color: '#999' }}> 자동수정:</span> {issue.auto_fixable ? '가능' : '불가능'}
                {issue.suggested_value && (
                  <span>
                    <span style={{ color: '#999' }}> | 제안값:</span> "{issue.suggested_value}"
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#f0f9ff', borderRadius: '8px' }}>
        <h4>💡 자동 수정 기능</h4>
        <p style={{ fontSize: '14px', margin: '10px 0' }}>
          다음과 같은 문제들은 자동으로 수정할 수 있습니다:
        </p>
        <ul style={{ fontSize: '13px', paddingLeft: '20px' }}>
          <li><strong>CAS 번호 형식 교정:</strong> "64175" → "64-17-5"</li>
          <li><strong>성분명 표준화:</strong> "소디움라우릴황산염" → "소듐라우릴황산염"</li>
          <li><strong>CAS 번호 자동 찾기:</strong> 알려진 성분명으로부터 CAS 번호 추가</li>
          <li><strong>영어-한국어 변환:</strong> "Water" → "정제수"</li>
        </ul>
      </div>
    </div>
  );
};

export default ValidationExamples;
