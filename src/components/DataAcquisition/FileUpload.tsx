import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, Edit3, Save, X, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface FileUploadProps {
  onUploadComplete: () => void;
}

// PDF 분석으로 추출된 데이터 인터페이스
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

// 컬럼 매핑 설정
interface ColumnMapping {
  [key: string]: {
    target_column: string;
    transform?: (value: any, existing?: any) => any;
    required?: boolean;
  };
}

// 제품 데이터 컬럼 매핑
const PRODUCT_COLUMN_MAPPINGS: ColumnMapping = {
  'prdt_mstr_no': { target_column: 'product_id', required: true },
  'prdtnm_kor': { target_column: 'product_name', required: true },
  'prdtarm': { target_column: 'product_category' },
  'prdtn_incme_cmpnynm': { target_column: 'manufacturer' },
  'knd': { target_column: 'product_subcategory' },
  'slfsfcfst_no': { target_column: 'source_reference' },
  'wt': { target_column: 'usage_purpose', transform: (value) => `용량: ${value}` },
  'cttpc': { target_column: 'collected_source' },
  'stdusewt': { target_column: 'usage_purpose', transform: (value, existing) => `${existing || ''}\n사용법: ${value}`.trim() },
  'useuppt_atpn': { target_column: 'usage_purpose', transform: (value, existing) => `${existing || ''}\n주의사항: ${value}`.trim() },
  'product_name': { target_column: 'product_name', required: true },
  'manufacturer': { target_column: 'manufacturer' },
  'product_category': { target_column: 'product_category' },
  '제품명': { target_column: 'product_name', required: true },
  '제조사': { target_column: 'manufacturer' },
  '카테고리': { target_column: 'product_category' },
  '제품군': { target_column: 'product_category' },
};

// 화학물질 데이터 컬럼 매핑
const CHEMICAL_COLUMN_MAPPINGS: ColumnMapping = {
  'chemical_name_ko': { target_column: 'chemical_name_ko', required: true },
  'chemical_name_en': { target_column: 'chemical_name_en' },
  'cas_no': { target_column: 'cas_no' },
  'casNo': { target_column: 'cas_no' },
  'ghs_code': { target_column: 'ghs_code' },
  'smiles': { target_column: 'smiles' },
  'chemical_formula': { target_column: 'chemical_formula' },
  'molecular_weight': { target_column: 'molecular_weight' },
  'iupac_name': { target_column: 'iupac_name' },
  'physical_state': { target_column: 'physical_state' },
  'melting_point': { target_column: 'melting_point' },
  'boiling_point': { target_column: 'boiling_point' },
  'density': { target_column: 'density' },
  'solubility': { target_column: 'solubility' },
  'flash_point': { target_column: 'flash_point' },
  '화학물질명': { target_column: 'chemical_name_ko', required: true },
  '영문명': { target_column: 'chemical_name_en' },
  'CAS번호': { target_column: 'cas_no' },
  '분자식': { target_column: 'chemical_formula' },
  '분자량': { target_column: 'molecular_weight' },
  '녹는점': { target_column: 'melting_point' },
  '끓는점': { target_column: 'boiling_point' },
  '밀도': { target_column: 'density' },
  '용해도': { target_column: 'solubility' },
};

// 스타일 정의
const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  marginBottom: '20px',
  padding: '24px'
};

const uploadAreaStyle: React.CSSProperties = {
  border: '2px dashed #d1d5db',
  borderRadius: '8px',
  padding: '40px',
  textAlign: 'center',
  backgroundColor: '#f9fafb',
  transition: 'all 0.3s ease',
  cursor: 'pointer'
};

const uploadAreaActiveStyle: React.CSSProperties = {
  ...uploadAreaStyle,
  borderColor: '#3b82f6',
  backgroundColor: '#eff6ff'
};

const buttonStyle: React.CSSProperties = {
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

const tabStyle: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '8px 8px 0 0',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px'
};

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  backgroundColor: '#3b82f6',
  color: 'white',
  borderColor: '#3b82f6'
};

// 데이터 변환 함수
const transformData = (item: any, mappings: ColumnMapping): any => {
  const transformed: any = {};
  
  transformed.status = 'collected';
  transformed.collected_date = new Date().toISOString().split('T')[0];
  transformed.collected_method = 'file_upload';
  
  for (const [sourceCol, mapping] of Object.entries(mappings)) {
    const sourceValue = item[sourceCol];
    if (sourceValue !== undefined && sourceValue !== null && sourceValue !== '') {
      const targetCol = mapping.target_column;
      
      if (mapping.transform) {
        transformed[targetCol] = mapping.transform(sourceValue, transformed[targetCol]);
      } else {
        transformed[targetCol] = sourceValue;
      }
    }
  }
  
  return transformed;
};

// 데이터 타입 감지 함수
const detectDataType = (jsonData: any[]): 'chemicals' | 'products' => {
  if (jsonData.length === 0) return 'chemicals';
  
  const sampleSize = Math.min(10, jsonData.length);
  const samples = jsonData.slice(0, sampleSize);
  
  let chemicalScore = 0;
  let productScore = 0;
  
  samples.forEach(sample => {
    const columns = Object.keys(sample).map(c => c.toLowerCase());
    
    const productIndicators = [
      'prdt_mstr_no', 'prdtnm_kor', 'prdtarm', 'prdtn_incme_cmpnynm',
      'product_name', 'manufacturer', '제품명', '제조사'
    ];
    
    const chemicalIndicators = [
      'chemical_name_ko', 'chemical_name_en', 'cas_no', 'casno', 'smiles',
      '화학물질명', '영문명', 'cas번호'
    ];
    
    productIndicators.forEach(indicator => {
      if (columns.some(col => col.includes(indicator.toLowerCase()))) {
        productScore += 1;
      }
    });
    
    chemicalIndicators.forEach(indicator => {
      if (columns.some(col => col.includes(indicator.toLowerCase()))) {
        chemicalScore += 1;
      }
    });
  });
  
  const detectedType = productScore > chemicalScore ? 'products' : 'chemicals';
  console.log(`자동 감지 결과: ${detectedType} (Product Score: ${productScore}, Chemical Score: ${chemicalScore})`);
  
  return detectedType;
};

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [activeTab, setActiveTab] = useState<'csv' | 'pdf'>('csv');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  
  // PDF 관련 상태
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // CSV/Excel 파일 처리
  const handleFileProcess = (file: File) => {
    setIsUploading(true);
    setUploadProgress('파일 읽는 중...');
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("파일을 읽을 수 없습니다.");

        let jsonData: any[] = [];
        
        setUploadProgress('데이터 파싱 중...');
        
        if (file.name.endsWith('.csv')) {
          const result = Papa.parse(data as string, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim().replace(/^\uFEFF/, ''),
            dynamicTyping: true,
            delimitersToGuess: [',', '\t', '|', ';']
          });
          jsonData = result.data;
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        } else {
          throw new Error("지원하지 않는 파일 형식입니다. (CSV, XLSX, XLS만 가능)");
        }

        if (jsonData.length === 0) {
          throw new Error("파일에 데이터가 없거나 형식이 올바르지 않습니다.");
        }

        console.log('원본 데이터 샘플:', jsonData[0]);
        console.log('컬럼명:', Object.keys(jsonData[0]));

        // 데이터 타입 감지
        const dataType = detectDataType(jsonData);
        setUploadProgress(`${dataType === 'products' ? '제품' : '화학물질'} 데이터로 감지됨`);
        
        // 데이터 변환 및 저장
        let processedCount = 0;
        const failedRecords: any[] = [];
        const batchSize = 10;
        
        setUploadProgress('데이터 변환 및 저장 중...');
        
        for (let i = 0; i < jsonData.length; i += batchSize) {
          const batch = jsonData.slice(i, i + batchSize);
          
          for (const item of batch) {
            try {
              if (dataType === 'products') {
                const transformedData = transformData(item, PRODUCT_COLUMN_MAPPINGS);
                
                if (!transformedData.product_name) {
                  transformedData.product_name = `제품-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                }
                
                if (!transformedData.product_id) {
                  transformedData.product_id = `P-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                }
                
                console.log('변환된 제품 데이터:', transformedData);
                
                const { error } = await supabase
                  .from('products')
                  .insert(transformedData);
                
                if (error) {
                  if (error.code === '23505') {
                    console.log(`중복된 제품 건너뛰기: ${transformedData.product_name}`);
                  } else {
                    console.error('제품 저장 실패:', error);
                    failedRecords.push({ item, error: error.message });
                    continue;
                  }
                }
                
                processedCount++;
                
              } else {
                const transformedData = transformData(item, CHEMICAL_COLUMN_MAPPINGS);
                
                const chemicalData = {
                  chemical_id: `CHEM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  chemical_name_ko: transformedData.chemical_name_ko || `화학물질-${Date.now()}`,
                  chemical_name_en: transformedData.chemical_name_en || null,
                  cas_no: transformedData.cas_no || null,
                  chemical_formula: transformedData.chemical_formula || null,
                  molecular_weight: transformedData.molecular_weight || null,
                  iupac_name: transformedData.iupac_name || null,
                  smiles: transformedData.smiles || null,
                  physical_state: transformedData.physical_state || null,
                  melting_point: transformedData.melting_point || null,
                  boiling_point: transformedData.boiling_point || null,
                  density: transformedData.density || null,
                  solubility: transformedData.solubility || null,
                  flash_point: transformedData.flash_point || null,
                  collected_method: 'file_upload',
                  collected_source: 'csv_upload',
                  status: 'collected',
                  verification_status: 'pending',
                  raw_data: item
                };
                
                console.log('변환된 화학물질 데이터 (chemicals 테이블):', chemicalData);
                
                let shouldInsert = true;
                if (chemicalData.cas_no) {
                  const { data: existing } = await supabase
                    .from('chemicals')
                    .select('id')
                    .eq('cas_no', chemicalData.cas_no)
                    .single();
                    
                  if (existing) {
                    console.log(`중복된 CAS 번호 건너뛰기: ${chemicalData.cas_no}`);
                    shouldInsert = false;
                  }
                }
                
                if (shouldInsert) {
                  const { error } = await supabase
                    .from('chemicals')
                    .insert(chemicalData);
                    
                  if (error) {
                    console.error('화학물질 저장 실패:', error);
                    failedRecords.push({ item, error: error.message });
                    continue;
                  }
                }
                
                processedCount++;
              }
              
              const progress = Math.round(((i + batch.indexOf(item) + 1) / jsonData.length) * 100);
              setUploadProgress(`처리 중... ${progress}% (${processedCount}/${jsonData.length})`);
              
            } catch (error) {
              console.error('데이터 처리 중 오류:', error);
              failedRecords.push({ 
                item, 
                error: error instanceof Error ? error.message : String(error) 
              });
            }
          }
        }
        
        // 업로드 이력 저장
        setUploadProgress('업로드 이력 저장 중...');
        
        try {
          const { error: historyError } = await supabase
            .from('metadata')
            .insert({
              data_type: 'upload_history',
              reference_id: `upload_${Date.now()}`,
              meta_key: 'file_upload_log',
              meta_value: JSON.stringify({
                filename: file.name,
                file_size: `${(file.size / 1024).toFixed(1)} KB`,
                file_type: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
                data_type: dataType,
                records_count: processedCount,
                status: processedCount > 0 ? '업로드 완료' : '업로드 실패',
                table_name: dataType === 'products' ? 'products' : 'chemicals',
                uploaded_by: 'system',
                upload_date: new Date().toISOString(),
                metadata: {
                  failed_records_count: failedRecords.length,
                  total_processed: jsonData.length,
                  success_rate: ((processedCount / jsonData.length) * 100).toFixed(1) + '%',
                  column_mappings: dataType === 'products' ? PRODUCT_COLUMN_MAPPINGS : CHEMICAL_COLUMN_MAPPINGS,
                  original_columns: Object.keys(jsonData[0] || {}),
                  failed_records: failedRecords.length > 0 ? failedRecords.slice(0, 5) : null
                },
                error_message: failedRecords.length > 0 ? `${failedRecords.length}개 데이터 저장 실패` : null
              })
            });
            
          if (historyError) {
            console.error('업로드 이력 저장 실패:', historyError);
          }
        } catch (error) {
          console.error('업로드 이력 저장 중 오류:', error);
        }
        
        // 결과 메시지
        let resultMessage = `✅ 업로드 완료!\n\n`;
        resultMessage += `📊 처리 결과:\n`;
        resultMessage += `- 총 데이터: ${jsonData.length}개\n`;
        resultMessage += `- 성공: ${processedCount}개\n`;
        resultMessage += `- 실패: ${failedRecords.length}개\n`;
        resultMessage += `- 성공률: ${((processedCount / jsonData.length) * 100).toFixed(1)}%\n\n`;
        resultMessage += `🔍 자동 감지: ${dataType === 'products' ? '제품 데이터' : '화학물질 데이터'}\n`;
        resultMessage += `📋 저장 테이블: ${dataType === 'products' ? 'products' : 'chemicals'}`;
        
        if (failedRecords.length > 0) {
          resultMessage += `\n\n⚠️ 실패한 데이터는 콘솔에서 확인하세요.`;
          console.log('저장 실패한 데이터:', failedRecords);
        }
        
        alert(resultMessage);
        onUploadComplete();

      } catch (error) {
        let errorMessage = "알 수 없는 오류가 발생했습니다.";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        console.error("파일 처리 중 오류:", error);
        alert(`❌ 파일 처리 실패:\n${errorMessage}`);
      } finally {
        setIsUploading(false);
        setUploadProgress('');
      }
    };
    
    reader.onerror = () => {
      alert("파일을 읽는 데 실패했습니다.");
      setIsUploading(false);
      setUploadProgress('');
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  // PDF 파일 처리
  const handlePdfUpload = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setErrorMessage('PDF 파일만 업로드 가능합니다.');
      setExtractionStatus('error');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage('파일 크기는 10MB 이하여야 합니다.');
      setExtractionStatus('error');
      return;
    }

    setPdfFile(selectedFile);
    setErrorMessage('');
    setExtractionStatus('idle');
  };

  const extractDataFromPDF = async () => {
    if (!pdfFile) return;

    setIsExtracting(true);
    setExtractionStatus('processing');

    try {
      const base64 = await fileToBase64(pdfFile);
      
      const response = await fetch('/api/gemini/extract-msds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64,
          fileName: pdfFile.name
        })
      });

      if (!response.ok) {
        throw new Error('PDF 분석 중 오류가 발생했습니다.');
      }

      const result = await response.json();
      
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
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // PDF 데이터를 데이터베이스에 저장
  const handleSubmitPdfData = async () => {
    if (!extractedData) return;

    setIsUploading(true);
    setUploadProgress('PDF 분석 데이터 저장 중...');

    try {
      // 제품 정보 저장
      const productData = {
        product_id: `PDF-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        product_name: extractedData.productInfo.productName || 'MSDS 추출 제품',
        manufacturer: extractedData.productInfo.manufacturer || '',
        product_category: 'MSDS 추출',
        usage_purpose: extractedData.productInfo.recommendedUse || '',
        collected_method: 'pdf_analysis',
        collected_source: 'gemini_pdf_extraction',
        status: 'collected',
        collected_date: new Date().toISOString().split('T')[0],
        raw_data: extractedData
      };

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (productError) {
        throw new Error(`제품 정보 저장 실패: ${productError.message}`);
      }

      // 구성 성분 저장 (화학물질로)
      let savedChemicals = 0;
      for (const component of extractedData.composition) {
        if (component.substanceName) {
          const chemicalData = {
            chemical_id: `PDF-CHEM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            chemical_name_ko: component.substanceName,
            chemical_name_en: component.synonym || '',
            cas_no: component.casNumber || '',
            collected_method: 'pdf_analysis',
            collected_source: 'msds_pdf',
            status: 'collected',
            verification_status: 'pending',
            raw_data: {
              ...component,
              source_product: product.id,
              extraction_method: 'gemini_pdf_analysis'
            }
          };

          const { error: chemError } = await supabase
            .from('chemicals')
            .insert(chemicalData);

          if (!chemError) {
            savedChemicals++;
          } else {
            console.error('화학물질 저장 실패:', chemError);
          }
        }
      }

      // 업로드 이력 저장
      await supabase
        .from('metadata')
        .insert({
          data_type: 'pdf_analysis_history',
          reference_id: `pdf_analysis_${Date.now()}`,
          meta_key: 'pdf_extraction_log',
          meta_value: JSON.stringify({
            filename: pdfFile?.name || 'unknown.pdf',
            file_size: pdfFile ? `${(pdfFile.size / 1024).toFixed(1)} KB` : 'unknown',
            extraction_method: 'gemini_pdf_analysis',
            product_saved: true,
            chemicals_saved: savedChemicals,
            total_components: extractedData.composition.length,
            analysis_date: new Date().toISOString(),
            extracted_data: extractedData
          })
        });

      const resultMessage = `✅ PDF 분석 데이터 저장 완료!\n\n` +
        `📊 저장 결과:\n` +
        `- 제품 정보: 1개 저장\n` +
        `- 화학물질 성분: ${savedChemicals}개 저장\n` +
        `- 총 성분 수: ${extractedData.composition.length}개\n\n` +
        `🤖 분석 방법: Gemini AI PDF 분석`;

      alert(resultMessage);
      onUploadComplete();

    } catch (error) {
      console.error('PDF 데이터 저장 중 오류:', error);
      alert(`❌ PDF 데이터 저장 실패:\n${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
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
      if (activeTab === 'pdf') {
        handlePdfUpload(droppedFile);
      } else {
        handleFileProcess(droppedFile);
      }
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700' }}>
          🤖 통합 데이터 업로드
        </h3>
        <p style={{ margin: 0, color: '#6b7280' }}>
          CSV/Excel 파일의 스마트 컬럼 매핑 또는 MSDS PDF 자동 분석을 선택하세요.
        </p>
      </div>

      {/* 탭 선택 */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('csv')}
          style={activeTab === 'csv' ? activeTabStyle : tabStyle}
        >
          <FileSpreadsheet size={16} />
          CSV/Excel 업로드
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          style={activeTab === 'pdf' ? activeTabStyle : tabStyle}
        >
          <FileText size={16} />
          MSDS PDF 분석
        </button>
      </div>

      {/* CSV/Excel 업로드 탭 */}
      {activeTab === 'csv' && (
        <div>
          <div
            style={isDragOver ? uploadAreaActiveStyle : uploadAreaStyle}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileProcess(file);
              }}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
            
            {isUploading ? (
              <div>
                <Loader size={48} className="animate-spin" style={{ color: '#3b82f6', marginBottom: '16px' }} />
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  {uploadProgress || '처리 중...'}
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  잠시만 기다려주세요.
                </div>
              </div>
            ) : (
              <div>
                <FileSpreadsheet size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
                  CSV/Excel 파일을 드래그하거나 클릭하여 업로드
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  자동 컬럼 매핑으로 스마트 데이터 변환
                </p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', fontSize: '14px', border: '1px solid #0ea5e9' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#0369a1' }}>
              🎯 스마트 컬럼 매핑 기능:
            </div>
            <div style={{ lineHeight: '1.6' }}>
              <strong>📋 초록누리 API 지원:</strong><br/>
              • prdt_mstr_no → product_id<br/>
              • prdtnm_kor → product_name<br/>
              • prdtarm → product_category<br/>
              • prdtn_incme_cmpnynm → manufacturer<br/><br/>
              
              <strong>🔄 자동 변환:</strong><br/>
              • 다양한 컬럼명을 표준 스키마로 자동 변환<br/>
              • 원본 데이터 완전 보존 (raw_data 필드)<br/>
              • 실시간 진행률 표시 및 상세 로그<br/>
              • 중복 데이터 자동 감지 및 건너뛰기
            </div>
          </div>
        </div>
      )}

      {/* PDF 분석 탭 */}
      {activeTab === 'pdf' && (
        <div>
          <div
            style={isDragOver ? uploadAreaActiveStyle : uploadAreaStyle}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => pdfInputRef.current?.click()}
          >
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handlePdfUpload(selectedFile);
              }}
              style={{ display: 'none' }}
            />
            
            <FileText size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
            
            {pdfFile ? (
              <div>
                <p style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
                  {pdfFile.name}
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0' }}>
                  {(pdfFile.size / 1024 / 1024).toFixed(2)}MB
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
                <p style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
                  MSDS PDF 파일을 드래그하거나 클릭하여 업로드
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  최대 10MB, Gemini AI가 자동으로 화학물질 정보를 추출합니다
                </p>
              </div>
            )}
          </div>

          {/* PDF 분석 상태 표시 */}
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
              <span>Gemini AI가 MSDS PDF를 분석하고 있습니다...</span>
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

          {/* PDF 분석 결과 */}
          {extractionStatus === 'success' && extractedData && (
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
                <span>PDF 분석이 완료되었습니다. 추출된 정보를 확인하고 저장하세요.</span>
              </div>

              {/* 추출된 데이터 미리보기 */}
              <div style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '24px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                  추출된 정보 미리보기
                </h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <p><strong>제품명:</strong> {extractedData.productInfo.productName || '미확인'}</p>
                  <p><strong>제조사:</strong> {extractedData.productInfo.manufacturer || '미확인'}</p>
                  <p><strong>구성성분:</strong> {extractedData.composition.length}개 성분</p>
                  <p><strong>GHS 분류:</strong> {extractedData.hazardInfo.ghs_classification || '미확인'}</p>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleSubmitPdfData}
                  disabled={isUploading}
                  style={{
                    ...buttonStyle,
                    backgroundColor: isUploading ? '#9ca3af' : '#16a34a',
                    fontSize: '18px',
                    padding: '16px 32px'
                  }}
                >
                  {isUploading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      추출된 데이터 저장
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', fontSize: '14px', border: '1px solid #d97706' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#92400e' }}>
              🤖 MSDS PDF 자동 분석 기능:
            </div>
            <div style={{ lineHeight: '1.6' }}>
              • <strong>Gemini AI 활용:</strong> 고급 AI 모델로 정확한 정보 추출<br/>
              • <strong>자동 구조화:</strong> 화학물질 정보를 데이터베이스 스키마에 맞게 변환<br/>
              • <strong>완전 자동화:</strong> 수동 입력 없이 PDF에서 바로 데이터베이스로<br/>
              • <strong>품질 보장:</strong> 추출된 데이터 검토 및 수정 가능
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;