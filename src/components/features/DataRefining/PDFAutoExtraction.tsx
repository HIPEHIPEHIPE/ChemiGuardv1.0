import React, { useState, useRef, CSSProperties } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, Edit3, Save, X } from 'lucide-react';

interface ExtractedData {
  productInfo: {
    productName: string;
    manufacturer: string;
    emergencyContact: string;
    recommendedUse: string;
    restrictions: string;
  };
  hazardInfo: {
    ghs_classification: string;
    pictograms: string[];
    signalWord: string;
    hazardStatements: string[];
    precautionaryStatements: string[];
    nfpaRatings: {
      health: number;
      fire: number;
      reactivity: number;
    };
  };
  composition: Array<{
    substanceName: string;
    synonym: string;
    casNumber: string;
    percentage: string;
  }>;
  firstAid: {
    eyeContact: string;
    skinContact: string;
    inhalation: string;
    ingestion: string;
    medicalAttention: string;
  };
  physicalProperties: {
    appearance: string;
    odor: string;
    ph: string;
    meltingPoint: string;
    boilingPoint: string;
    flashPoint: string;
    density: string;
    vaporPressure: string;
    solubility: string;
  };
}

interface PDFAutoExtractionProps {
  onDataExtracted: (data: ExtractedData) => void;
}

const cardStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  marginBottom: '20px',
  padding: '24px'
};

const uploadAreaStyle: CSSProperties = {
  border: '2px dashed #d1d5db',
  borderRadius: '8px',
  padding: '40px',
  textAlign: 'center',
  backgroundColor: '#f9fafb',
  transition: 'all 0.3s ease'
};

const uploadAreaActiveStyle: CSSProperties = {
  ...uploadAreaStyle,
  borderColor: '#3b82f6',
  backgroundColor: '#eff6ff'
};

const buttonStyle: CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'background-color 0.2s'
};

const sectionStyle: CSSProperties = {
  marginBottom: '24px',
  padding: '16px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0'
};

const fieldGroupStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '16px',
  marginTop: '12px'
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px'
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical'
};

const editButtonStyle: CSSProperties = {
  padding: '4px 8px',
  backgroundColor: '#f59e0b',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px'
};

const saveButtonStyle: CSSProperties = {
  ...editButtonStyle,
  backgroundColor: '#10b981'
};

const cancelButtonStyle: CSSProperties = {
  ...editButtonStyle,
  backgroundColor: '#6b7280'
};

const PDFAutoExtraction: React.FC<PDFAutoExtractionProps> = ({ onDataExtracted }) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setErrorMessage('PDF 파일만 업로드 가능합니다.');
      setExtractionStatus('error');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB 제한
      setErrorMessage('파일 크기는 10MB 이하여야 합니다.');
      setExtractionStatus('error');
      return;
    }

    setFile(selectedFile);
    setErrorMessage('');
    setExtractionStatus('idle');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  };

  const extractDataFromPDF = async () => {
    if (!file) return;

    setIsExtracting(true);
    setExtractionStatus('processing');

    try {
      console.log('PDF 분석 시작:', file.name);
      
      // PDF를 base64로 변환
      const base64 = await fileToBase64(file);
      console.log('Base64 변환 완료, 길이:', base64.length);
      
      // PDF 분석 API 호출 (다이렉트)
      console.log('API 호출 URL: /.netlify/functions/extract-msds');
      const response = await fetch('/.netlify/functions/extract-msds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64,
          fileName: file.name
        })
      });

      console.log('API 응답 상태:', response.status);
      console.log('API 응답 헤더:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 응답 오류:', errorText);
        throw new Error(`PDF 분석 중 오류가 발생했습니다. (${response.status})`);
      }

      const result = await response.json();
      console.log('API 응답 결과:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const extracted: ExtractedData = result.data;
      setExtractedData(extracted);
      setEditedData(extracted);
      setExtractionStatus('success');
      
    } catch (error) {
      console.error('PDF 추출 오류:', error);
      setErrorMessage(error instanceof Error ? error.message : 'PDF 분석 중 오류가 발생했습니다.');
      setExtractionStatus('error');
    } finally {
      setIsExtracting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // data:application/pdf;base64, 제거하고 base64 데이터만 추출
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleEditSection = (sectionName: string) => {
    setEditingSection(sectionName);
  };

  const handleSaveSection = (sectionName: string) => {
    if (editedData) {
      setExtractedData(editedData);
      setEditingSection(null);
    }
  };

  const handleCancelEdit = () => {
    setEditedData(extractedData);
    setEditingSection(null);
  };

  const handleFieldChange = (section: string, field: string, value: any) => {
    if (!editedData) return;

    setEditedData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        [section]: {
          ...prev[section as keyof ExtractedData],
          [field]: value
        }
      };
    });
  };

  const handleCompositionChange = (index: number, field: string, value: string) => {
    if (!editedData) return;

    setEditedData(prev => {
      if (!prev) return prev;
      
      const newComposition = [...prev.composition];
      newComposition[index] = {
        ...newComposition[index],
        [field]: value
      };
      
      return {
        ...prev,
        composition: newComposition
      };
    });
  };

  const handleSubmitData = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
    }
  };

  const renderEditableSection = (
    title: string,
    sectionName: keyof ExtractedData,
    renderContent: () => React.ReactNode
  ) => {
    const isEditing = editingSection === sectionName;
    
    return (
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{title}</h4>
          {!isEditing ? (
            <button
              onClick={() => handleEditSection(sectionName)}
              style={editButtonStyle}
            >
              <Edit3 size={12} />
              수정
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleSaveSection(sectionName)}
                style={saveButtonStyle}
              >
                <Save size={12} />
                저장
              </button>
              <button
                onClick={handleCancelEdit}
                style={cancelButtonStyle}
              >
                <X size={12} />
                취소
              </button>
            </div>
          )}
        </div>
        {renderContent()}
      </div>
    );
  };

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700' }}>
          MSDS PDF 자동 분석
        </h3>
        <p style={{ margin: 0, color: '#6b7280' }}>
          MSDS PDF 파일을 업로드하면 Gemini AI가 자동으로 화학물질 정보를 추출합니다.
        </p>
      </div>

      {/* 파일 업로드 영역 */}
      <div
        style={isDragOver ? uploadAreaActiveStyle : uploadAreaStyle}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        <FileText size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
        
        {file ? (
          <div>
            <p style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
              {file.name}
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>
              {(file.size / 1024 / 1024).toFixed(2)}MB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                extractDataFromPDF();
              }}
              disabled={isExtracting}
              style={{
                ...buttonStyle,
                backgroundColor: isExtracting ? '#9ca3af' : '#3b82f6'
              }}
            >
              {isExtracting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  PDF 분석 시작
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
              PDF 파일을 드래그하거나 클릭하여 업로드
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              최대 10MB, PDF 형식만 지원
            </p>
          </div>
        )}
      </div>

      {/* 상태 표시 */}
      {extractionStatus === 'processing' && (
        <div style={{
          padding: '16px',
          backgroundColor: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Loader size={20} className="animate-spin" style={{ color: '#3b82f6' }} />
          <span>Gemini AI가 PDF를 분석하고 있습니다...</span>
        </div>
      )}

      {extractionStatus === 'error' && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={20} style={{ color: '#ef4444' }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 추출된 데이터 표시 및 편집 */}
      {extractionStatus === 'success' && extractedData && editedData && (
        <div style={{ marginTop: '24px' }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#dcfce7',
            border: '1px solid #16a34a',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <CheckCircle size={20} style={{ color: '#16a34a' }} />
            <span>PDF 분석이 완료되었습니다. 추출된 정보를 검토하고 수정하세요.</span>
          </div>

          {/* 1. 화학제품과 회사에 관한 정보 */}
          {renderEditableSection(
            '1. 화학제품과 회사에 관한 정보',
            'productInfo',
            () => (
              <div style={fieldGroupStyle}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                    제품명
                  </label>
                  <input
                    type="text"
                    value={editedData.productInfo.productName}
                    onChange={(e) => handleFieldChange('productInfo', 'productName', e.target.value)}
                    disabled={editingSection !== 'productInfo'}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                    회사명
                  </label>
                  <input
                    type="text"
                    value={editedData.productInfo.manufacturer}
                    onChange={(e) => handleFieldChange('productInfo', 'manufacturer', e.target.value)}
                    disabled={editingSection !== 'productInfo'}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                    긴급연락처
                  </label>
                  <input
                    type="text"
                    value={editedData.productInfo.emergencyContact}
                    onChange={(e) => handleFieldChange('productInfo', 'emergencyContact', e.target.value)}
                    disabled={editingSection !== 'productInfo'}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                    제품의 권고 용도
                  </label>
                  <textarea
                    value={editedData.productInfo.recommendedUse}
                    onChange={(e) => handleFieldChange('productInfo', 'recommendedUse', e.target.value)}
                    disabled={editingSection !== 'productInfo'}
                    style={textareaStyle}
                  />
                </div>
              </div>
            )
          )}

          {/* 2. 유해성·위험성 */}
          {renderEditableSection(
            '2. 유해성·위험성',
            'hazardInfo',
            () => (
              <div style={fieldGroupStyle}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                    GHS 분류
                  </label>
                  <input
                    type="text"
                    value={editedData.hazardInfo.ghs_classification}
                    onChange={(e) => handleFieldChange('hazardInfo', 'ghs_classification', e.target.value)}
                    disabled={editingSection !== 'hazardInfo'}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                    신호어
                  </label>
                  <input
                    type="text"
                    value={editedData.hazardInfo.signalWord}
                    onChange={(e) => handleFieldChange('hazardInfo', 'signalWord', e.target.value)}
                    disabled={editingSection !== 'hazardInfo'}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                    NFPA 보건
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={editedData.hazardInfo.nfpaRatings.health}
                    onChange={(e) => handleFieldChange('hazardInfo', 'nfpaRatings', {
                      ...editedData.hazardInfo.nfpaRatings,
                      health: parseInt(e.target.value) || 0
                    })}
                    disabled={editingSection !== 'hazardInfo'}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                    NFPA 화재
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={editedData.hazardInfo.nfpaRatings.fire}
                    onChange={(e) => handleFieldChange('hazardInfo', 'nfpaRatings', {
                      ...editedData.hazardInfo.nfpaRatings,
                      fire: parseInt(e.target.value) || 0
                    })}
                    disabled={editingSection !== 'hazardInfo'}
                    style={inputStyle}
                  />
                </div>
              </div>
            )
          )}

          {/* 3. 구성성분의 명칭 및 함유량 */}
          {renderEditableSection(
            '3. 구성성분의 명칭 및 함유량',
            'composition',
            () => (
              <div>
                {editedData.composition.map((comp, index) => (
                  <div key={index} style={{ 
                    ...fieldGroupStyle, 
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                        물질명
                      </label>
                      <input
                        type="text"
                        value={comp.substanceName}
                        onChange={(e) => handleCompositionChange(index, 'substanceName', e.target.value)}
                        disabled={editingSection !== 'composition'}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                        CAS 번호
                      </label>
                      <input
                        type="text"
                        value={comp.casNumber}
                        onChange={(e) => handleCompositionChange(index, 'casNumber', e.target.value)}
                        disabled={editingSection !== 'composition'}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '14px' }}>
                        함유량(%)
                      </label>
                      <input
                        type="text"
                        value={comp.percentage}
                        onChange={(e) => handleCompositionChange(index, 'percentage', e.target.value)}
                        disabled={editingSection !== 'composition'}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* 제출 버튼 */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={handleSubmitData}
              style={{
                ...buttonStyle,
                backgroundColor: '#16a34a',
                fontSize: '18px',
                padding: '16px 32px'
              }}
            >
              <CheckCircle size={20} />
              추출된 데이터 적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFAutoExtraction;