// src/components/DataRefining/ProcessingStepper.tsx
import React, { CSSProperties } from 'react';
import { 
  Settings, 
  Shield, 
  CheckCircle, 
  Circle,
  ArrowRight,
  Database,
  Target,
  Lock,
  Trophy
} from 'lucide-react';
import { ProcessingStep, ProcessingStepInfo } from '../../../types/processing';

interface ProcessingStepperProps {
  currentStep: ProcessingStep;
  completedSteps: ProcessingStep[];
  onStepClick: (step: ProcessingStep) => void;
}

const stepperContainerStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  padding: '24px',
  marginBottom: '20px',
};

const stepperListStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'relative',
};

const stepItemStyle = (status: 'completed' | 'active' | 'pending' | 'locked'): CSSProperties => {
  const colors = {
    completed: { bg: '#10b981', text: 'white', border: '#10b981' },
    active: { bg: '#3b82f6', text: 'white', border: '#3b82f6' },
    pending: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
    locked: { bg: '#f9fafb', text: '#9ca3af', border: '#e5e7eb' },
  };
  
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: status === 'locked' ? 'not-allowed' : 'pointer',
    opacity: status === 'locked' ? 0.5 : 1,
    flex: 1,
    position: 'relative',
  };
};

const stepCircleStyle = (status: 'completed' | 'active' | 'pending' | 'locked'): CSSProperties => {
  const colors = {
    completed: { bg: '#10b981', text: 'white', border: '#10b981' },
    active: { bg: '#3b82f6', text: 'white', border: '#3b82f6' },
    pending: { bg: 'white', text: '#6b7280', border: '#d1d5db' },
    locked: { bg: '#f9fafb', text: '#9ca3af', border: '#e5e7eb' },
  };
  
  return {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors[status].bg,
    color: colors[status].text,
    border: `2px solid ${colors[status].border}`,
    marginBottom: '12px',
    transition: 'all 0.3s ease',
  };
};

const stepLabelStyle = (status: 'completed' | 'active' | 'pending' | 'locked'): CSSProperties => ({
  fontSize: '16px',
  fontWeight: status === 'active' ? '600' : '500',
  color: status === 'active' ? '#1f2937' : status === 'completed' ? '#10b981' : '#6b7280',
  marginBottom: '4px',
  textAlign: 'center',
});

const stepDescriptionStyle: CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  textAlign: 'center',
  maxWidth: '120px',
  lineHeight: '1.4',
};

const connectorStyle = (isCompleted: boolean): CSSProperties => ({
  position: 'absolute',
  top: '24px',
  left: '50%',
  right: '-50%',
  height: '2px',
  backgroundColor: isCompleted ? '#10b981' : '#e5e7eb',
  zIndex: 0,
  transition: 'background-color 0.3s ease',
});

const ProcessingStepper: React.FC<ProcessingStepperProps> = ({ 
  currentStep, 
  completedSteps, 
  onStepClick 
}) => {
  const steps: ProcessingStepInfo[] = [
    {
      id: ProcessingStep.REFINING,
      title: '데이터 정제',
      description: '품질 검증 및 오류 수정',
      icon: 'database',
      status: completedSteps.includes(ProcessingStep.REFINING) 
        ? 'completed' 
        : currentStep === ProcessingStep.REFINING 
          ? 'active' 
          : 'pending'
    },
    {
      id: ProcessingStep.STANDARDIZING,
      title: '데이터 표준화',
      description: '형식 통일 및 규칙 적용',
      icon: 'target',
      status: completedSteps.includes(ProcessingStep.STANDARDIZING)
        ? 'completed'
        : currentStep === ProcessingStep.STANDARDIZING
          ? 'active'
          : !completedSteps.includes(ProcessingStep.REFINING)
            ? 'locked'
            : 'pending'
    },
    {
      id: ProcessingStep.ANONYMIZING,
      title: '데이터 비식별화',
      description: '개인정보 보호 처리',
      icon: 'shield',
      status: completedSteps.includes(ProcessingStep.ANONYMIZING)
        ? 'completed'
        : currentStep === ProcessingStep.ANONYMIZING
          ? 'active'
          : !completedSteps.includes(ProcessingStep.STANDARDIZING)
            ? 'locked'
            : 'pending'
    },
    {
      id: ProcessingStep.COMPLETED,
      title: '처리 완료',
      description: '최종 검토 및 내보내기',
      icon: 'trophy',
      status: completedSteps.includes(ProcessingStep.COMPLETED)
        ? 'completed'
        : currentStep === ProcessingStep.COMPLETED
          ? 'active'
          : !completedSteps.includes(ProcessingStep.ANONYMIZING)
            ? 'locked'
            : 'pending'
    }
  ];

  const getIcon = (iconName: string, status: string) => {
    const size = 20;
    const IconComponent = {
      database: Database,
      target: Target,
      shield: Shield,
      trophy: Trophy,
    }[iconName] || Circle;

    if (status === 'completed') {
      return <CheckCircle size={size} />;
    }
    
    return <IconComponent size={size} />;
  };

  return (
    <div style={stepperContainerStyle}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
          데이터 처리 파이프라인
        </h2>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          단계별로 데이터를 처리하여 최종 결과물을 생성합니다
        </p>
      </div>
      
      <div style={stepperListStyle}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div 
              style={stepItemStyle(step.status)}
              onClick={() => step.status !== 'locked' && onStepClick(step.id)}
            >
              <div style={stepCircleStyle(step.status)}>
                {getIcon(step.icon, step.status)}
              </div>
              <div style={stepLabelStyle(step.status)}>
                {step.title}
              </div>
              <div style={stepDescriptionStyle}>
                {step.description}
              </div>
            </div>
            
            {/* 연결선 */}
            {index < steps.length - 1 && (
              <div style={{ position: 'relative', flex: '0 0 60px' }}>
                <div style={connectorStyle(
                  completedSteps.includes(step.id) && 
                  (completedSteps.includes(steps[index + 1].id) || currentStep === steps[index + 1].id)
                )}>
                  <ArrowRight 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      right: '-8px', 
                      top: '-7px',
                      color: completedSteps.includes(step.id) ? '#10b981' : '#e5e7eb'
                    }} 
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* 현재 단계 정보 */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        border: '1px solid #0ea5e9',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {getIcon(steps.find(s => s.id === currentStep)?.icon || 'circle', 'active')}
          </div>
          <div>
            <div style={{ fontWeight: '600', color: '#0c4a6e', fontSize: '14px' }}>
              현재 단계: {steps.find(s => s.id === currentStep)?.title}
            </div>
            <div style={{ color: '#0c4a6e', fontSize: '12px' }}>
              {steps.find(s => s.id === currentStep)?.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingStepper;