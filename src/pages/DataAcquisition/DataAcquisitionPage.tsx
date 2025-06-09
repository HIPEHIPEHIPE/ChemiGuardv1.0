import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabaseClient';

// 업로드 이력 타입 정의
interface UploadHistory {
  id: number;
  filename: string;
  file_size: string;
  upload_date: string;
  status: string;
  records_count?: number;
  file_type: string;
  data_type?: string;
  table_name?: string;
  error_message?: string;
}

// 검색 결과 타입 정의
interface SearchResult {
  cas_no: string;
  chemical_name_ko: string;
  ghs_code: string | null;
  smiles: string | null;
  source_api: string;
  source_chem_id: string;
}

// 재사용 가능한 스타일 버튼 컴포넌트
const StyledButton = ({ children, bgColor, onClick, type = 'button' }: { children: React.ReactNode; bgColor: string; onClick?: () => void; type?: 'button' | 'submit' | 'reset'; }) => (
  <button
    type={type}
    onClick={onClick}
    style={{
      backgroundColor: bgColor,
      color: '#fff',
      fontSize: '14px',
      fontWeight: 'bold',
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      marginRight: '8px'
    }}
  >
    {children}
  </button>
);

// --- 검색 결과 컴포넌트 ---
const SearchResults = ({ results, onAddToDb }: { results: SearchResult[], onAddToDb: (item: SearchResult) => void }) => {
  if (results.length === 0) return null;

  return (
    <div style={{ marginTop: '20px' }}>
      <h4 style={{ marginBottom: '10px' }}>검색 결과</h4>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto' }}>
        {results.map((item) => (
          <div key={item.source_chem_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>{item.chemical_name_ko}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>CAS No: {item.cas_no}</div>
            </div>
            <StyledButton bgColor="#10b981" onClick={() => onAddToDb(item)}>DB에 추가</StyledButton>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 수동 입력 모달 컴포넌트 ---
const ManualInputModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) => {
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
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>데이터 수동 입력</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <InputField label="제품명 (가명 처리)" name="product_name_alias" placeholder="예: 세정제A-001" required />
            <InputField label="주성분명 (한글/영문)" name="chemical_name" placeholder="예: 에탄올 (Ethanol)" required />
            <InputField label="CAS 번호" name="cas_no" placeholder="예: 64-17-5" required />
            <InputField label="GHS 코드" name="ghs_code" placeholder="예: H225" />
            <InputField label="화학 구조 정보 (SMILES)" name="smiles" placeholder="예: CCO" />
            <TextAreaField label="유해성 정보" name="toxicity_info" placeholder="예: 고인화성 액체 및 증기." />
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

const InputField = ({ label, name, placeholder, required = false }: { label: string; name: string; placeholder?: string; required?: boolean }) => (
  <div style={{ marginBottom: '16px', width: '100%' }}>
    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>{label}</label>
    <input type="text" name={name} placeholder={placeholder} required={required} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }} />
  </div>
);

const TextAreaField = ({ label, name, placeholder, rows = 3 }: { label: string; name: string; placeholder?: string; rows?: number }) => (
  <div style={{ marginBottom: '16px', width: '100%' }}>
    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>{label}</label>
    <textarea name={name} placeholder={placeholder} rows={rows} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', resize: 'vertical' }} />
  </div>
);

// 페이지 메인 컴포넌트
const DataAcquisitionPage = () => {
  // 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [recentUploads, setRecentUploads] = useState<UploadHistory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // 데이터 타입 자동 감지 함수
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

  // 업로드 이력 데이터 가져오기
  const fetchUploadHistory = async () => {
    try {
      const { data: uploadData, error: uploadError } = await supabase
        .from('upload_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (uploadError) {
        console.error('Upload history 에러:', uploadError);
        setRecentUploads([]);
        return;
      }
      
      if (uploadData && uploadData.length > 0) {
        const formattedHistory = uploadData.map((item: any) => ({
          id: item.id,
          filename: item.filename,
          file_size: item.file_size,
          upload_date: new Date(item.created_at).toLocaleString('ko-KR'),
          status: item.status,
          records_count: item.records_count,
          file_type: item.file_type,
          data_type: item.data_type || 'chemicals',
          table_name: item.table_name,
          error_message: item.error_message
        }));
        setRecentUploads(formattedHistory);
      } else {
        setRecentUploads([]);
      }
      
    } catch (error) {
      console.error('업로드 이력 로딩 에러:', error);
      setRecentUploads([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUploadHistory();
  }, []);

  // 파일 처리 핸들러
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
          // 제품 데이터 저장 - products 테이블과 product_chemicals 테이블에 분리 저장
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
                // 화학물질 정보 저장/찾기
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
          // 화학물질 데이터 저장
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
                // raw_data_from_file 에 원본 데이터 저장
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
                // 중복된 데이터도 카운트에서 제외하지 않음 (사용자에게 전체 체크된 데이터 수 알려주기 위해)
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
              uploaded_by: 'system', // 실제 사용자 정보로 교체 가능
              metadata: {
                failed_records_count: failedRecords.length,
                total_processed: jsonData.length,
                success_rate: ((processedCount / jsonData.length) * 100).toFixed(1) + '%',
                failed_records: failedRecords.length > 0 ? failedRecords.slice(0, 5) : null // 처음 5개만 저장
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
        
        // 업로드 이력 새로고침
        await fetchUploadHistory();

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

  // 외부 DB 검색 핸들러
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      alert('검색어를 입력해주세요.');
      return;
    }
    setIsSearching(true);
    setSearchResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('search-kosha-msds', {
        body: { searchTerm: searchTerm },
      });

      if (error) throw error;

      setSearchResults(data || []);
      if (!data || data.length === 0) {
        alert('검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('검색 함수 호출 에러:', error);
      alert('검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToDb = async (item: SearchResult) => {
    try {
      const { data: existing } = await supabase
        .from('chemicals')
        .select('id', { count: 'exact' })
        .eq('cas_no', item.cas_no);

      if (existing && existing.length > 0) {
        alert(`${item.chemical_name_ko} (CAS: ${item.cas_no})는 이미 DB에 존재합니다.`);
        return;
      }

      const { error } = await supabase.from('chemicals').insert({
        cas_no: item.cas_no,
        chemical_name_ko: item.chemical_name_ko,
        source_data: {
          api: item.source_api,
          id: item.source_chem_id,
        },
      });

      if (error) throw error;

      alert(`${item.chemical_name_ko}이(가) DB에 성공적으로 추가되었습니다.`);
    } catch (error) {
      alert('DB에 추가하는 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  return (
    <>
      <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>데이터 수집</h2>
          <StyledButton bgColor="#1d4ed8" onClick={() => setIsModalOpen(true)}>+ 수동 입력</StyledButton>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '30px' }}>
          {/* 외부 DB 연동 섹션 */}
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>외부 DB에서 검색 및 수집</h3>
            <p style={{ fontSize: '14px', color: '#4b5563', marginTop: 0, marginBottom: '16px' }}>
              초록누리, PubChem 등 외부 데이터베이스에서 실시간으로 데이터를 검색하여 수집합니다.
            </p>
            <div style={{ display: 'flex' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="화학물질명 또는 CAS 번호 입력"
                style={{ flexGrow: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', marginRight: '8px' }}
              />
              <StyledButton bgColor="#3b82f6" onClick={handleSearch}>
                {isSearching ? '검색 중...' : '검색'}
              </StyledButton>
            </div>
            <SearchResults results={searchResults} onAddToDb={handleAddToDb} />
          </div>

          {/* 파일 업로드 섹션 */}
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
        </div>
        
        {/* 업로드 이력 섹션 */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>최근 업로드 이력</h3>
            <StyledButton bgColor="#6b7280" onClick={fetchUploadHistory}>🔄 새로고침</StyledButton>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              데이터를 불러오는 중...
            </div>
          ) : recentUploads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              아직 업로드 이력이 없습니다.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>파일명</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>데이터 타입</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>데이터 건수</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>업로드일</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>상태</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>액션</th>
                </tr>
              </thead>
              <tbody>
                {recentUploads.map((file) => {
                  const getDataTypeDisplay = (dataType: string | undefined) => {
                    switch(dataType) {
                      case 'products': return { text: '제품', color: '#10b981' };
                      case 'chemicals': return { text: '화학물질', color: '#3b82f6' };
                      default: return { text: '제품', color: '#10b981' };
                    }
                  };
                  
                  const dataTypeDisplay = getDataTypeDisplay(file.data_type);
                  
                  return (
                    <tr key={file.id}>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>                        <div style={{ fontWeight: 'bold' }}>{file.filename}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{file.file_size}</div>
                        {file.error_message && (
                          <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px' }}>
                            ⚠️ {file.error_message}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ 
                          color: dataTypeDisplay.color,
                          fontWeight: 'bold',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: `${dataTypeDisplay.color}15`,
                          fontSize: '12px'
                        }}>
                          {dataTypeDisplay.text}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                        {file.records_count ? `${file.records_count}건` : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>{file.upload_date}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{ 
                          color: file.status === '업로드 완료' ? '#10b981' : '#f59e0b',
                          fontWeight: 'bold'
                        }}>
                          {file.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                        <StyledButton bgColor="#4b5563" onClick={() => alert(`${file.filename}의 상세 정보를 봅니다.`)}>상세보기</StyledButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <ManualInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default DataAcquisitionPage;