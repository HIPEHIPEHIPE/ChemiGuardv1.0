import React, { useState } from 'react';
import StyledButton from './StyledButton';
import SearchResults, { SearchResult } from './SearchResults';

interface ExternalSearchProps {
  onAddToDb: (item: SearchResult) => void;
}

const ExternalSearch: React.FC<ExternalSearchProps> = ({ onAddToDb }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      alert('검색어를 입력해주세요.');
      return;
    }
    setIsSearching(true);
    setSearchResults([]);

    try {
      // MSDS API 호출 (프록시 서버 사용)
      const { msdsApi, SEARCH_CONDITIONS } = await import('../../../lib/msdsApi');
      
      // 검색어가 CAS 번호 형태이면 CAS No로 검색, 아니면 국문명으로 검색
      const searchCondition = /^\d{1,7}-\d{2}-\d$/.test(searchTerm) 
        ? SEARCH_CONDITIONS.CAS_NO 
        : SEARCH_CONDITIONS.KOREAN_NAME;
      
      const response = await msdsApi.getChemicalList(searchTerm, searchCondition, 20, 1);
      
      // 결과를 기존 SearchResult 형태로 변환
      const convertedResults: SearchResult[] = response.items.map(item => ({
        cas_no: item.casNo,
        chemical_name_ko: item.chemNameKor,
        ghs_code: null, // MSDS API에서는 목록에서 GHS 코드를 제공하지 않음
        smiles: null,   // MSDS API에서는 목록에서 SMILES를 제공하지 않음
        source_api: 'KOSHA_MSDS',
        source_chem_id: item.chemId.toString()
      }));

      setSearchResults(convertedResults);
      if (convertedResults.length === 0) {
        alert('검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('MSDS API 검색 오류:', error);
      
      // API 키가 없거나 잘못된 경우 안내
      if (!process.env.REACT_APP_MSDS_API_KEY || process.env.REACT_APP_MSDS_API_KEY === 'YOUR_MSDS_API_KEY_HERE') {
        alert('MSDS API 키가 설정되지 않았습니다.\n\n1. 한국 안전보건공단에서 API 키를 발급받으세요.\n2. .env 파일의 REACT_APP_MSDS_API_KEY를 설정하세요.');
      } else {
        alert('검색 중 오류가 발생했습니다. API 키나 네트워크를 확인해주세요.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>MSDS 데이터베이스 검색</h3>
      <p style={{ fontSize: '14px', color: '#4b5563', marginTop: 0, marginBottom: '16px' }}>
        한국 안전보건공단의 화학물질 안전보건자료를 실시간으로 검색하여 수집합니다.
      </p>
      <div style={{ display: 'flex' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="화학물질명 또는 CAS 번호 입력 (예: 벤젠, 71-43-2)"
          style={{ 
            flexGrow: 1, 
            padding: '10px', 
            border: '1px solid #d1d5db', 
            borderRadius: '6px', 
            marginRight: '8px' 
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <StyledButton bgColor="#3b82f6" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? '검색 중...' : '검색'}
        </StyledButton>
      </div>
      <SearchResults results={searchResults} onAddToDb={onAddToDb} />
    </div>
  );
};

export default ExternalSearch;
