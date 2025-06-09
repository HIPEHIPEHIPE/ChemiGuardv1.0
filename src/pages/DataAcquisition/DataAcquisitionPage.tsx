import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabaseClient';

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
    type={type} // 이 부분이 추가되었습니다.
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
    // TODO: Supabase DB에 데이터 저장 API 호출
    onClose(); // 저장 후 모달 닫기
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
            {/* 수행계획서 기반 입력 필드들 */}
            <InputField label="제품명 (가명 처리)" name="product_name_alias" placeholder="예: 세정제A-001" required />
            <InputField label="주성분명 (한글/영문)" name="chemical_name" placeholder="예: 에탄올 (Ethanol)" required />
            <InputField label="CAS 번호" name="cas_no" placeholder="예: 64-17-5" required />
            <InputField label="GHS 코드" name="ghs_code" placeholder="예: H225" />
            <InputField label="화학 구조 정보 (SMILES)" name="smiles" placeholder="예: CCO" />
            <TextAreaField label="유해성 정보" name="toxicity_info" placeholder="예: 고인화성 액체 및 증기. 눈에 심한 자극을 일으킴." />
            <TextAreaField label="안전 사용 지침" name="safety_guidelines" placeholder="예: 열, 스파크, 화염으로부터 멀리하시오. 보호장갑/보호안경을 착용하시오." />
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
  // 상태 관리 (향후 실제 데이터 연동을 위함)
  const [searchTerm, setSearchTerm] = useState('');
  const [recentUploads, setRecentUploads] = useState([
    { id: 1, name: '화학제품_데이터_2025_0430.xlsx', size: '2.1 MB', date: '2025-04-30 14:23', status: '업로드 완료' },
    { id: 2, name: '추가_세정제_정보_2025_0429.csv', size: '1.8 MB', date: '2025-04-29 09:15', status: '처리 대기' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 파일 처리 핸들러 (CSV/XLSX/XLS 업로드 및 DB 저장) - 새 버전 (지정된 구현으로 대체)
  const handleFileProcess = (file: File) => {
    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
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

        const validData = jsonData.filter(row => row.casNo && row.chemNameKor);
        if (validData.length === 0) {
            throw new Error("파일에 유효한 데이터 행이 없습니다. 컬럼 이름을 확인해주세요. (예: casNo, chemNameKor)");
        }

        const dataToInsert = validData.map((row: any) => {
            const hazardInfo = row.hazardInfo || '';
            const ghsClassification = typeof hazardInfo === 'string' 
                                    ? hazardInfo.split('|')
                                        .find((info: string) => info.includes('유해성·위험성 분류:'))
                                        ?.replace('유해성·위험성 분류:', '').trim()
                                    : null;
            return {
                chemical_name_ko: row.chemNameKor,
                cas_no: row.casNo,
                ghs_info: ghsClassification || null,
                smiles: null,
                source_data: {
                    source: 'msds_crawling_csv', chemId: row.chemId, enNo: row.enNo,
                    keNo: row.keNo, unNo: row.unNo, lastDate: row.lastDate
                },
                raw_data_from_file: row,
            };
        });

        const { error } = await supabase.from('chemicals').insert(dataToInsert);
        if (error) throw error;

        alert(`${dataToInsert.length}개의 데이터가 성공적으로 DB에 추가되었습니다.`);

        // TODO: 최근 업로드 이력 업데이트 로직 추가

      } catch (error) {
        let errorMessage = "알 수 없는 오류가 발생했습니다.";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        console.error("파일 처리 중 전체 오류:", error);
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
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>  </h2>
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
            <StyledButton bgColor="#3b82f6" onClick={handleSearch} >
              {isSearching ? '검색 중...' : '검색'}
            </StyledButton>
          </div>
          <SearchResults results={searchResults} onAddToDb={handleAddToDb} />
        </div>

        {/* 파일 업로드 섹션 */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>파일 일괄 업로드</h3>
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
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>📁</div>
                <div style={{ fontWeight: 'bold' }}>
                  파일을 드래그하거나 클릭하여 업로드
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                  Excel, CSV 파일 지원
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
        </div>
      </div>
      
      {/* 최근 업로드 이력 섹션 */}
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>최근 업로드 이력</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
              <th style={tableHeaderStyle}>파일명</th>
              <th style={tableHeaderStyle}>업로드일</th>
              <th style={tableHeaderStyle}>상태</th>
              <th style={tableHeaderStyle}>액션</th>
            </tr>
          </thead>
          <tbody>
            {recentUploads.map((file) => (
              <tr key={file.id}>
                <td style={tableCellStyle}>{file.name}</td>
                <td style={tableCellStyle}>{file.date}</td>
                <td style={tableCellStyle}>
                  <span style={{ 
                    color: file.status === '업로드 완료' ? '#10b981' : '#f59e0b',
                    fontWeight: 'bold'
                  }}>
                    {file.status}
                  </span>
                </td>
                <td style={tableCellStyle}>
                  <StyledButton bgColor="#4b5563" onClick={() => alert(`${file.name}의 상세 정보를 봅니다.`)}>상세보기</StyledButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      <ManualInputModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

// 테이블 스타일 정의
const tableHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #e5e7eb',
};
const tableCellStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #e5e7eb',
};

export default DataAcquisitionPage;