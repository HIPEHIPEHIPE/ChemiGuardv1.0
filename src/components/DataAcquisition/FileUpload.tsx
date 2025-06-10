import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabaseClient';

interface FileUploadProps {
  onUploadComplete: () => void;
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
  // 초록누리 API 컬럼명 → Supabase 컬럼명
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
  
  // 일반적인 컬럼명들
  'product_name': { target_column: 'product_name', required: true },
  'manufacturer': { target_column: 'manufacturer' },
  'product_category': { target_column: 'product_category' },
  '제품명': { target_column: 'product_name', required: true },
  '제조사': { target_column: 'manufacturer' },
  '카테고리': { target_column: 'product_category' },
  '제품군': { target_column: 'product_category' },
};

// 화학물질 데이터 컬럼 매핑 (독립적인 chemicals 테이블용)
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

// 데이터 변환 함수 (실제 스키마에 맞게 수정)
const transformData = (item: any, mappings: ColumnMapping): any => {
  const transformed: any = {};
  
  // 기본 메타데이터 설정 (실제 컬럼에 맞게)
  transformed.status = 'collected';
  transformed.collected_date = new Date().toISOString().split('T')[0];
  transformed.collected_method = 'file_upload';
  
  // 컬럼 매핑 적용
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

// 데이터 타입 감지 함수 (개선됨)
const detectDataType = (jsonData: any[]): 'chemicals' | 'products' => {
  if (jsonData.length === 0) return 'chemicals';
  
  const sampleSize = Math.min(10, jsonData.length);
  const samples = jsonData.slice(0, sampleSize);
  
  let chemicalScore = 0;
  let productScore = 0;
  
  samples.forEach(sample => {
    const columns = Object.keys(sample).map(c => c.toLowerCase());
    
    // 제품 관련 컬럼 확인
    const productIndicators = [
      'prdt_mstr_no', 'prdtnm_kor', 'prdtarm', 'prdtn_incme_cmpnynm',
      'product_name', 'manufacturer', '제품명', '제조사'
    ];
    
    // 화학물질 관련 컬럼 확인
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

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
        const batchSize = 10; // 배치 크기
        
        setUploadProgress('데이터 변환 및 저장 중...');
        
        for (let i = 0; i < jsonData.length; i += batchSize) {
          const batch = jsonData.slice(i, i + batchSize);
          
          for (const item of batch) {
            try {
              if (dataType === 'products') {
                // 제품 데이터 변환
                const transformedData = transformData(item, PRODUCT_COLUMN_MAPPINGS);
                
                // 필수 필드 확인
                if (!transformedData.product_name) {
                  transformedData.product_name = `제품-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                }
                
                if (!transformedData.product_id) {
                  transformedData.product_id = `P-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                }
                
                console.log('변환된 제품 데이터:', transformedData);
                
                // Supabase에 저장
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
                // 화학물질 데이터를 독립적인 chemicals 테이블에 저장
                const transformedData = transformData(item, CHEMICAL_COLUMN_MAPPINGS);
                
                // 필수 필드 확인 및 변환 (chemicals 스키마에 맞게)
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
                  raw_data: item // 원본 데이터 보존
                };
                
                console.log('변환된 화학물질 데이터 (chemicals 테이블):', chemicalData);
                
                // 중복 체크 (CAS 번호 기준)
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
              
              // 진행률 업데이트
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
        
        // 업로드 이력을 metadata 테이블에 저장
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
                table_name: dataType === 'products' ? 'products' : 'product_ingredients',
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
        
        // 업로드 완료 콜백 호출
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

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>🤖 스마트 컬럼 매핑 업로드</h3>
      
      <div
        onClick={() => !isUploading && document.getElementById('fileInput')?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFileProcess(file);
        }}
        style={{
          border: '2px dashed #d1d5db',
          padding: '25px',
          textAlign: 'center',
          borderRadius: '10px',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          backgroundColor: isUploading ? '#f3f4f6' : '#f9fafb',
        }}
      >
        {isUploading ? (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              {uploadProgress || '처리 중...'}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              잠시만 기다려주세요.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎯</div>
            <div style={{ fontWeight: 'bold' }}>
              파일을 드래그하거나 클릭하여 업로드
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              Excel, CSV 파일 지원 (자동 컬럼 매핑)
            </div>
          </>
        )}

        <input
          id="fileInput"
          type="file"
          accept=".csv, .xlsx, .xls"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileProcess(file);
          }}
          disabled={isUploading}
        />
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
          • 원본 데이터 완전 보존 (source_data 필드)<br/>
          • 실시간 진행률 표시 및 상세 로그<br/>
          • 중복 데이터 자동 감지 및 건너뛰기
        </div>
      </div>
      
      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '13px', border: '1px solid #f59e0b' }}>
        <strong style={{ color: '#92400e' }}>💡 지원하는 컬럼명 예시:</strong><br/>
        제품명, product_name, prdtnm_kor | 제조사, manufacturer, prdtn_incme_cmpnynm | 카테고리, product_category, prdtarm
      </div>
    </div>
  );
};

export default FileUpload;