import React from 'react';
import StyledButton from './StyledButton';

interface InputFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}

interface TextAreaFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, placeholder, required = false }) => (
  <div style={{ marginBottom: '16px', width: '100%' }}>
    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
      {label}
    </label>
    <input 
      type="text" 
      name={name} 
      placeholder={placeholder} 
      required={required} 
      style={{ 
        width: '100%', 
        padding: '10px', 
        border: '1px solid #d1d5db', 
        borderRadius: '6px' 
      }} 
    />
  </div>
);

const TextAreaField: React.FC<TextAreaFieldProps> = ({ label, name, placeholder, rows = 3 }) => (
  <div style={{ marginBottom: '16px', width: '100%' }}>
    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
      {label}
    </label>
    <textarea 
      name={name} 
      placeholder={placeholder} 
      rows={rows} 
      style={{ 
        width: '100%', 
        padding: '10px', 
        border: '1px solid #d1d5db', 
        borderRadius: '6px', 
        resize: 'vertical' 
      }} 
    />
  </div>
);

interface ManualInputModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManualInputModal: React.FC<ManualInputModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log('수동 입력된 데이터:', data);
    alert('데이터가 성공적으로 저장되었습니다. (콘솔 확인)');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', 
      display: 'flex',
      justifyContent: 'center', 
      alignItems: 'center', 
      zIndex: 1000
    }}>
      <div style={{ 
        background: '#fff', 
        padding: '24px', 
        borderRadius: '12px', 
        width: '600px', 
        maxHeight: '90vh', 
        overflowY: 'auto' 
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>데이터 수동 입력</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <InputField 
              label="제품명 (가명 처리)" 
              name="product_name_alias" 
              placeholder="예: 세정제A-001" 
              required 
            />
            <InputField 
              label="주성분명 (한글/영문)" 
              name="chemical_name" 
              placeholder="예: 에탄올 (Ethanol)" 
              required 
            />
            <InputField 
              label="CAS 번호" 
              name="cas_no" 
              placeholder="예: 64-17-5" 
              required 
            />
            <InputField 
              label="GHS 코드" 
              name="ghs_code" 
              placeholder="예: H225" 
            />
            <InputField 
              label="화학 구조 정보 (SMILES)" 
              name="smiles" 
              placeholder="예: CCO" 
            />
            <TextAreaField 
              label="유해성 정보" 
              name="toxicity_info" 
              placeholder="예: 고인화성 액체 및 증기." 
            />
          </div>
          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <StyledButton bgColor="#6b7280" onClick={onClose}>취소</StyledButton>
            <StyledButton bgColor="#10b981" type="submit">저장</StyledButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualInputModal;
