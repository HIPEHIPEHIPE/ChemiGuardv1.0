import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabaseClient';

interface FileUploadProps {
  onUploadComplete: () => void;
}

// 데이터 타입 감지 함수
const detectDataType = (jsonData: any[]): 'chemicals' | 'products' => {
  if (jsonData.length === 0) return 'chemicals';
  
  const sampleSize = Math.min(10, jsonData.length);
  const samples = jsonData.slice(0, sampleSize);
  const columns = Object.keys(samples[0] || {});
  
  console.log('데이터 타입 감지 시작');
  console.log('컬럼 목록:', columns);
  
  // 점수 기반 분류 시스템
  let chemicalScore = 0;
  let productScore = 0;
  
  const productIndicators = [
    '제품명', 'product_name', 'productName', 'product_name_alias',
    '함량', 'content', 'concentration',
    '출처', 'source', 'manufacturer',
    '상태', 'status'
  ];
  
  const chemicalIndicators = [
    'chemId', 'enNo', 'keNo', 'unNo', 'lastDate',
    'hazardInfo', 'ghs', 'smiles',
    'chemical_name_en', 'chemNameEng',
    'molecular', 'formula'
  ];
  
  productIndicators.forEach(indicator => {
    if (columns.some(col => col.toLowerCase().includes(indicator.toLowerCase()))) {
      productScore += 2;
    }
  });
  
  chemicalIndicators.forEach(indicator => {
    if (columns.some(col => col.toLowerCase().includes(indicator.toLowerCase()))) {
      chemicalScore += 2;
    }
  });
  
  const detectedType = productScore > chemicalScore ? 'products' : 'chemicals';
  console.log(`자동 감지 결과: ${detectedType}`);
  
  return detectedType;
};

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileProcess = (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      let actualDataType: 'chemicals' | 'products' = 'chemicals';
      
      try {
        const data = e.target?.result;
        if (!data) throw new Error("파일을 읽을 수 없습니다.");

        let jsonData: any[] = [];
        
        if (file.name.endsWith('.csv')) {
          const result = Papa.parse(data as string, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim().replace(/^\uFEFF/, '')
          });
          jsonData = result.data;
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet);
        } else {
          throw new Error("지원하지 않는 파일 형식입니다. (CSV, XLSX, XLS만 가능)");
        }

        if (jsonData.length === 0) {
          throw new Error("파일에 데이터가 없거나 형식이 올바르지 않습니다.");
        }

        try {
          actualDataType = detectDataType(jsonData);
          console.log(`자동 감지 결과: ${actualDataType}`);
        } catch (error) {
          console.log('자동 감지 실패, 기본값 사용');
          actualDataType = 'chemicals';
        }

        // 실제 데이터베이스에 저장
        let processedCount = 0;
        const failedRecords: any[] = [];
        
        console.log('데이터베이스 저장 시작:', { dataType: actualDataType, count: jsonData.length });
        
        if (actualDataType === 'products') {
          // 제품 데이터 저장 로직
          for (const item of jsonData) {
            try {
              // 1. 제품 정보 저장
              const productData = {
                product_name: item.product_name || item['제품명'] || `제품-${Date.now()}-${Math.random()}`,
                product_name_alias: item.product_name_alias || item.product_name || item['제품명'] || null,
                product_category: item.product_category || item['카테고리'] || null,
                manufacturer: item.manufacturer || item['제조사'] || null,
                status: 'active'
              };
              
              const { data: productResult, error: productError } = await supabase
                .from('products')
                .insert(productData)
                .select('id')
                .single();
                
              if (productError) {
                console.error('제품 데이터 저장 실패:', productError);
                failedRecords.push({ item, error: productError.message });
                continue;
              }
              
              // 2. 화학물질 정보 처리
              if (item.chemical_name_ko || item.chemical_name || item['성분명'] || item['주성분']) {
                // 화학물질 정보 저장/찾기 로직
                const chemicalData = {
                  chemical_name_ko: item.chemical_name_ko || item.chemical_name || item['성분명'] || item['주성분'] || '미상',
                  chemical_name_en: item.chemical_name_en || null,
                  cas_no: item.cas_no || item.casNo || item['CAS번호'] || null,
                  ghs_code: item.ghs_code || item.ghs || null,
                  smiles: item.smiles || null,
                  source_data: {
                    original: item,
                    upload_info: {
                      filename: file.name,
                      upload_date: new Date().toISOString(),
                      data_type: 'products'
                    }
                  }
                };
                
                let chemicalId;
                
                // CAS 번호로 기존 화학물질 찾기
                if (chemicalData.cas_no) {
                  const { data: existingChemical } = await supabase
                    .from('chemicals')
                    .select('id')
                    .eq('cas_no', chemicalData.cas_no)
                    .single();
                    
                  if (existingChemical) {
                    chemicalId = existingChemical.id;
                  }
                }
                
                // 기존 화학물질이 없으면 새로 생성
                if (!chemicalId) {
                  const { data: newChemical, error: chemicalError } = await supabase
                    .from('chemicals')
                    .insert(chemicalData)
                    .select('id')
                    .single();
                    
                  if (chemicalError) {
                    console.error('화학물질 생성 실패:', chemicalError);
                  } else {
                    chemicalId = newChemical.id;
                  }
                }
                
                // 3. 제품-화학물질 연결 정보 저장
                if (chemicalId && productResult?.id) {
                  const { error: linkError } = await supabase
                    .from('product_chemicals')
                    .insert({
                      product_id: productResult.id,
                      chemical_id: chemicalId,
                      concentration: item.content_percentage || item.content || item['함량'] || null
                    });
                    
                  if (linkError) {
                    console.error('제품-화학물질 연결 실패:', linkError);
                  }
                }
              }
              
              processedCount++;
            } catch (error) {
              console.error('제품 데이터 처리 중 오류:', error);
              failedRecords.push({ item, error: error instanceof Error ? error.message : String(error) });
            }
          }
        } else {
          // 화학물질 데이터 저장 로직
          for (const item of jsonData) {
            try {
              const chemicalData = {
                chemical_name_ko: item.chemical_name_ko || item.chemNameKor || item['화학물질명'] || '미상',
                chemical_name_en: item.chemical_name_en || item.chemNameEng || item['영문명'] || null,
                cas_no: item.cas_no || item.casNo || item['CAS번호'] || null,
                ghs_code: item.ghs_code || item.ghs || null,
                smiles: item.smiles || null,
                source_data: {
                  original: item,
                  upload_info: {
                    filename: file.name,
                    upload_date: new Date().toISOString(),
                    data_type: 'chemicals'
                  }
                },
                raw_data_from_file: item
              };
              
              // CAS 번호로 중복 체크
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
                  console.error('화학물질 데이터 저장 실패:', error);
                  failedRecords.push({ item, error: error.message });
                } else {
                  processedCount++;
                }
              } else {
                // 중복된 데이터도 카운트에서 제외하지 않음
                processedCount++;
              }
            } catch (error) {
              console.error('화학물질 데이터 처리 중 오류:', error);
              failedRecords.push({ item, error: error instanceof Error ? error.message : String(error) });
            }
          }
        }
        
        // 업로드 이력 저장
        try {
          const { error: historyError } = await supabase
            .from('upload_history')
            .insert({
              filename: file.name,
              file_size: `${(file.size / 1024).toFixed(1)} KB`,
              file_type: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
              data_type: actualDataType,
              records_count: processedCount,
              status: processedCount > 0 ? '업로드 완료' : '업로드 실패',
              table_name: actualDataType === 'products' ? 'products' : 'chemicals',
              uploaded_by: 'system',
              metadata: {
                failed_records_count: failedRecords.length,
                total_processed: jsonData.length,
                success_rate: ((processedCount / jsonData.length) * 100).toFixed(1) + '%',
                failed_records: failedRecords.length > 0 ? failedRecords.slice(0, 5) : null
              },
              error_message: failedRecords.length > 0 ? `${failedRecords.length}개 데이터 저장 실패` : null
            });
            
          if (historyError) {
            console.error('업로드 이력 저장 실패:', historyError);
          }
        } catch (error) {
          console.error('업로드 이력 저장 중 오류:', error);
        }
        
        // 결과 메시지
        let resultMessage = `${processedCount}개의 ${actualDataType === 'chemicals' ? '화학물질' : '제품 성분'} 데이터가 성공적으로 DB에 추가되었습니다.\n\n자동감지결과: ${actualDataType === 'chemicals' ? '화학물질데이터' : '제품데이터'}`;
        
        if (failedRecords.length > 0) {
          resultMessage += `\n\n⚠️ ${failedRecords.length}개 데이터 저장 실패 (콘솔 확인)`;
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
        alert(`파일을 처리하는 중 오류가 발생했습니다: ${errorMessage}`);
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.onerror = () => {
      alert("파일을 읽는 데 실패했습니다.");
      setIsUploading(false);
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>스마트 파일 업로드</h3>
      
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
          backgroundColor: '#f9fafb',
        }}
      >
        {isUploading ? (
          <div>
            <div style={{ fontWeight: 'bold' }}>업로드 및 처리 중...</div>
            <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              잠시만 기다려주세요.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🤖</div>
            <div style={{ fontWeight: 'bold' }}>
              파일을 드래그하거나 클릭하여 업로드
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              Excel, CSV 파일 지원 (AI 자동 분류)
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

      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '13px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#8b5cf6' }}>
          🤖 AI 스마트 업로드:
        </div>
        <div>
          • 파일 구조를 자동 분석하여 적절한 테이블에 저장<br/>
          • 웹 크롤링 데이터 등 어떤 형식이든 수집 가능<br/>
          • 원본 데이터 완전 보존 후 정제 과정에서 처리
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
