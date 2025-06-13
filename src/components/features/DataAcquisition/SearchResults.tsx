import React from 'react';
import StyledButton from './StyledButton';

// 검색 결과 타입 정의
export interface SearchResult {
  cas_no: string;
  chemical_name_ko: string;
  ghs_code: string | null;
  smiles: string | null;
  source_api: string;
  source_chem_id: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  onAddToDb: (item: SearchResult) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onAddToDb }) => {
  if (results.length === 0) return null;

  return (
    <div style={{ marginTop: '20px' }}>
      <h4 style={{ marginBottom: '10px' }}>검색 결과</h4>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto' }}>
        {results.map((item) => (
          <div 
            key={item.source_chem_id} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px 16px', 
              borderBottom: '1px solid #e5e7eb' 
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>{item.chemical_name_ko}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>CAS No: {item.cas_no}</div>
            </div>
            <StyledButton bgColor="#10b981" onClick={() => onAddToDb(item)}>
              DB에 추가
            </StyledButton>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
